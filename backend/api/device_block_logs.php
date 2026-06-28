<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $id = require_int($_GET['id'], 'id');

                $stmt = $db->prepare("
                    SELECT *
                    FROM device_block_logs
                    WHERE id = :id
                      AND deleted_at IS NULL
                    LIMIT 1
                ");
                $stmt->execute([':id' => $id]);
                $row = $stmt->fetch();

                if (!$row) {
                    not_found('block_log_not_found');
                }

                audit_log($db, 'device_block_logs', $id, 'view_one');
                json_response(['ok' => true, 'data' => $row]);
            }

            [$page, $limit, $offset] = validate_pagination();
            $deviceId = isset($_GET['device_id']) ? (int)$_GET['device_id'] : null;
            $stableId = $_GET['stable_id'] ?? null;

            $where = ["deleted_at IS NULL"];
            $params = [];

            if ($deviceId) {
                $where[] = "device_id = :device_id";
                $params[':device_id'] = $deviceId;
            }

            if ($stableId !== null && $stableId !== '') {
                $where[] = "stable_id = :stable_id";
                $params[':stable_id'] = trim((string)$stableId);
            }

            $whereSql = implode(' AND ', $where);

            $countStmt = $db->prepare("SELECT COUNT(*) AS total FROM device_block_logs WHERE {$whereSql}");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetch()['total'];

            $stmt = $db->prepare("
                SELECT *
                FROM device_block_logs
                WHERE {$whereSql}
                ORDER BY id DESC
                LIMIT :limit OFFSET :offset
            ");
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            json_response([
                'ok' => true,
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'data' => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $in = json_input();

            $device_id = require_int($in['device_id'] ?? null, 'device_id');
            $stable_id = require_string($in['stable_id'] ?? null, 'stable_id', 64);
            $reason = optional_string($in['reason'] ?? null, 255);
            $created_at = optional_datetime($in['created_at'] ?? null) ?? date('Y-m-d H:i:s');

            $devChk = $db->prepare("
                SELECT id FROM devices
                WHERE id = :id
                  AND deleted_at IS NULL
                LIMIT 1
            ");
            $devChk->execute([':id' => $device_id]);
            if (!$devChk->fetch()) {
                bad_request('invalid_device_id');
            }

            $stmt = $db->prepare("
                INSERT INTO device_block_logs (device_id, stable_id, reason, created_at)
                VALUES (:device_id, :stable_id, :reason, :created_at)
            ");
            $stmt->execute([
                ':device_id' => $device_id,
                ':stable_id' => $stable_id,
                ':reason' => $reason,
                ':created_at' => $created_at,
            ]);

            $newId = (int)$db->lastInsertId();
            audit_log($db, 'device_block_logs', $newId, 'create', $in);

            json_response([
                'ok' => true,
                'message' => 'block_log_created',
                'id' => $newId,
            ], 201);
            break;

        case 'PUT':
        case 'PATCH':
            $id = require_int($_GET['id'] ?? null, 'id');
            $in = json_input();

            $stmt = $db->prepare("
                SELECT *
                FROM device_block_logs
                WHERE id = :id
                  AND deleted_at IS NULL
                LIMIT 1
            ");
            $stmt->execute([':id' => $id]);
            $existing = $stmt->fetch();

            if (!$existing) {
                not_found('block_log_not_found');
            }

            $device_id = array_key_exists('device_id', $in) ? require_int($in['device_id'], 'device_id') : (int)$existing['device_id'];
            $stable_id = array_key_exists('stable_id', $in) ? require_string($in['stable_id'], 'stable_id', 64) : $existing['stable_id'];
            $reason = array_key_exists('reason', $in) ? optional_string($in['reason'], 255) : $existing['reason'];
            $created_at = array_key_exists('created_at', $in) ? optional_datetime($in['created_at']) : $existing['created_at'];

            $devChk = $db->prepare("
                SELECT id FROM devices
                WHERE id = :id
                  AND deleted_at IS NULL
                LIMIT 1
            ");
            $devChk->execute([':id' => $device_id]);
            if (!$devChk->fetch()) {
                bad_request('invalid_device_id');
            }

            $upd = $db->prepare("
                UPDATE device_block_logs
                SET
                    device_id = :device_id,
                    stable_id = :stable_id,
                    reason = :reason,
                    created_at = :created_at
                WHERE id = :id
                  AND deleted_at IS NULL
            ");
            $upd->execute([
                ':device_id' => $device_id,
                ':stable_id' => $stable_id,
                ':reason' => $reason,
                ':created_at' => $created_at,
                ':id' => $id,
            ]);

            audit_log($db, 'device_block_logs', $id, 'update', $in);

            json_response([
                'ok' => true,
                'message' => 'block_log_updated',
            ]);
            break;

        case 'DELETE':
            $id = require_int($_GET['id'] ?? null, 'id');

            $stmt = $db->prepare("
                UPDATE device_block_logs
                SET deleted_at = NOW(), deleted_by = 'api'
                WHERE id = :id
                  AND deleted_at IS NULL
            ");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                not_found('block_log_not_found_or_already_deleted');
            }

            audit_log($db, 'device_block_logs', $id, 'soft_delete');

            json_response([
                'ok' => true,
                'message' => 'block_log_deleted',
            ]);
            break;

        default:
            method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    }
} catch (Throwable $e) {
    api_log('block_logs_api_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}