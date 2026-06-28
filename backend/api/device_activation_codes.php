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
                    FROM device_activation_codes
                    WHERE id = :id
                      AND deleted_at IS NULL
                    LIMIT 1
                ");
                $stmt->execute([':id' => $id]);
                $row = $stmt->fetch();

                if (!$row) {
                    not_found('activation_code_not_found');
                }

                audit_log($db, 'device_activation_codes', $id, 'view_one');
                json_response(['ok' => true, 'data' => $row]);
            }

            [$page, $limit, $offset] = validate_pagination();
            $deviceId = isset($_GET['device_id']) ? (int)$_GET['device_id'] : null;
            $search = validate_search();

            $where = ["deleted_at IS NULL"];
            $params = [];

            if ($deviceId) {
                $where[] = "device_id = :device_id";
                $params[':device_id'] = $deviceId;
            }

            if ($search) {
                $where[] = "code LIKE :search";
                $params[':search'] = '%' . $search . '%';
            }

            $whereSql = implode(' AND ', $where);

            $countStmt = $db->prepare("SELECT COUNT(*) AS total FROM device_activation_codes WHERE {$whereSql}");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetch()['total'];

            $stmt = $db->prepare("
                SELECT *
                FROM device_activation_codes
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
            $code = require_string($in['code'] ?? null, 'code', 32);
            $expires_at = optional_datetime($in['expires_at'] ?? null);
            $used_at = optional_datetime($in['used_at'] ?? null);

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

            $dup = $db->prepare("
                SELECT id FROM device_activation_codes
                WHERE code = :code
                  AND deleted_at IS NULL
                LIMIT 1
            ");
            $dup->execute([':code' => $code]);
            if ($dup->fetch()) {
                bad_request('code_already_exists');
            }

            $stmt = $db->prepare("
                INSERT INTO device_activation_codes (device_id, code, expires_at, used_at)
                VALUES (:device_id, :code, :expires_at, :used_at)
            ");
            $stmt->execute([
                ':device_id' => $device_id,
                ':code' => $code,
                ':expires_at' => $expires_at,
                ':used_at' => $used_at,
            ]);

            $newId = (int)$db->lastInsertId();
            audit_log($db, 'device_activation_codes', $newId, 'create', $in);

            json_response([
                'ok' => true,
                'message' => 'activation_code_created',
                'id' => $newId,
            ], 201);
            break;

        case 'PUT':
        case 'PATCH':
            $id = require_int($_GET['id'] ?? null, 'id');
            $in = json_input();

            $stmt = $db->prepare("
                SELECT *
                FROM device_activation_codes
                WHERE id = :id
                  AND deleted_at IS NULL
                LIMIT 1
            ");
            $stmt->execute([':id' => $id]);
            $existing = $stmt->fetch();

            if (!$existing) {
                not_found('activation_code_not_found');
            }

            $device_id = array_key_exists('device_id', $in) ? require_int($in['device_id'], 'device_id') : (int)$existing['device_id'];
            $code = array_key_exists('code', $in) ? require_string($in['code'], 'code', 32) : $existing['code'];
            $expires_at = array_key_exists('expires_at', $in) ? optional_datetime($in['expires_at']) : $existing['expires_at'];
            $used_at = array_key_exists('used_at', $in) ? optional_datetime($in['used_at']) : $existing['used_at'];

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

            $dup = $db->prepare("
                SELECT id FROM device_activation_codes
                WHERE code = :code
                  AND id <> :id
                  AND deleted_at IS NULL
                LIMIT 1
            ");
            $dup->execute([
                ':code' => $code,
                ':id' => $id,
            ]);
            if ($dup->fetch()) {
                bad_request('code_already_exists');
            }

            $upd = $db->prepare("
                UPDATE device_activation_codes
                SET
                    device_id = :device_id,
                    code = :code,
                    expires_at = :expires_at,
                    used_at = :used_at
                WHERE id = :id
                  AND deleted_at IS NULL
            ");
            $upd->execute([
                ':device_id' => $device_id,
                ':code' => $code,
                ':expires_at' => $expires_at,
                ':used_at' => $used_at,
                ':id' => $id,
            ]);

            audit_log($db, 'device_activation_codes', $id, 'update', $in);

            json_response([
                'ok' => true,
                'message' => 'activation_code_updated',
            ]);
            break;

        case 'DELETE':
            $id = require_int($_GET['id'] ?? null, 'id');

            $stmt = $db->prepare("
                UPDATE device_activation_codes
                SET deleted_at = NOW(), deleted_by = 'api'
                WHERE id = :id
                  AND deleted_at IS NULL
            ");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                not_found('activation_code_not_found_or_already_deleted');
            }

            audit_log($db, 'device_activation_codes', $id, 'soft_delete');

            json_response([
                'ok' => true,
                'message' => 'activation_code_deleted',
            ]);
            break;

        default:
            method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    }
} catch (Throwable $e) {
    api_log('activation_codes_api_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}