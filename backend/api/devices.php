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
                    FROM devices
                    WHERE id = :id
                      AND deleted_at IS NULL
                    LIMIT 1
                ");
                $stmt->execute([':id' => $id]);
                $row = $stmt->fetch();

                if (!$row) {
                    not_found('device_not_found');
                }

                audit_log($db, 'devices', $id, 'view_one');
                json_response(['ok' => true, 'data' => $row]);
            }

            [$page, $limit, $offset] = validate_pagination();
            $search = validate_search();
            $status = $_GET['status'] ?? null;
            $venueId = isset($_GET['venue_id']) ? (int)$_GET['venue_id'] : null;
            $deviceType = $_GET['Divace_type'] ?? null;

            $where = ["deleted_at IS NULL"];
            $params = [];

            if ($search) {
                $where[] = "(device_name LIKE :search OR stable_id LIKE :search OR imei LIKE :search)";
                $params[':search'] = '%' . $search . '%';
            }

            if ($status !== null && $status !== '') {
                $where[] = "status = :status";
                $params[':status'] = $status;
            }

            if ($venueId) {
                $where[] = "venue_id = :venue_id";
                $params[':venue_id'] = $venueId;
            }

            if ($deviceType) {
                $where[] = "Divace_type = :Divace_type";
                $params[':Divace_type'] = $deviceType;
            }

            $whereSql = implode(' AND ', $where);

            $countStmt = $db->prepare("SELECT COUNT(*) AS total FROM devices WHERE {$whereSql}");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetch()['total'];

            $sql = "
                SELECT *
                FROM devices
                WHERE {$whereSql}
                ORDER BY id DESC
                LIMIT :limit OFFSET :offset
            ";

            $stmt = $db->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $rows = $stmt->fetchAll();

            audit_log($db, 'devices', null, 'list', [
                'page' => $page,
                'limit' => $limit,
                'search' => $search,
            ]);

            json_response([
                'ok' => true,
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'data' => $rows
            ]);
            break;

        case 'POST':
            $in = json_input();

            $venue_id = optional_int($in['venue_id'] ?? null);
            $device_name = optional_string($in['device_name'] ?? null, 255);
            $Divace_type = optional_enum($in['Divace_type'] ?? null, ['kitchen', 'mobile', 'desktop'], 'Divace_type');
            $station = optional_string($in['station'] ?? null, 64);
            $login = optional_int($in['login'] ?? null);
            $stable_id = require_string($in['stable_id'] ?? null, 'stable_id', 128);
            $imei = optional_string($in['imei'] ?? null, 64);
            $app_version = optional_string($in['app_version'] ?? null, 50);
            $status = optional_enum($in['status'] ?? 'inactive', ['inactive', 'active', 'blocked'], 'status');
            $activated_at = optional_datetime($in['activated_at'] ?? null);
            $blocked_at = optional_datetime($in['blocked_at'] ?? null);
            $block_reason = optional_string($in['block_reason'] ?? null, 255);
            $last_block_reason = optional_string($in['last_block_reason'] ?? null, 50);
            $last_block_source = optional_string($in['last_block_source'] ?? null, 50);

            // unique stable_id check
            $chk = $db->prepare("SELECT id FROM devices WHERE stable_id = :stable_id AND deleted_at IS NULL LIMIT 1");
            $chk->execute([':stable_id' => $stable_id]);
            if ($chk->fetch()) {
                bad_request('stable_id_already_exists');
            }

            // foreign key venue check
            if ($venue_id !== null) {
                $venueChk = $db->prepare("SELECT id FROM venues WHERE id = :id LIMIT 1");
                $venueChk->execute([':id' => $venue_id]);
                if (!$venueChk->fetch()) {
                    bad_request('invalid_venue_id');
                }
            }

            $stmt = $db->prepare("
                INSERT INTO devices
                (
                    venue_id, device_name, Divace_type, station, login,
                    stable_id, imei, app_version, status,
                    activated_at, blocked_at, block_reason,
                    last_block_reason, last_block_source, updated_at
                )
                VALUES
                (
                    :venue_id, :device_name, :Divace_type, :station, :login,
                    :stable_id, :imei, :app_version, :status,
                    :activated_at, :blocked_at, :block_reason,
                    :last_block_reason, :last_block_source, NOW()
                )
            ");

            $stmt->execute([
                ':venue_id' => $venue_id,
                ':device_name' => $device_name,
                ':Divace_type' => $Divace_type,
                ':station' => $station,
                ':login' => $login,
                ':stable_id' => $stable_id,
                ':imei' => $imei,
                ':app_version' => $app_version,
                ':status' => $status,
                ':activated_at' => $activated_at,
                ':blocked_at' => $blocked_at,
                ':block_reason' => $block_reason,
                ':last_block_reason' => $last_block_reason,
                ':last_block_source' => $last_block_source,
            ]);

            $newId = (int)$db->lastInsertId();

            api_log('device_created', ['id' => $newId, 'stable_id' => $stable_id]);
            audit_log($db, 'devices', $newId, 'create', $in);

            json_response([
                'ok' => true,
                'message' => 'device_created',
                'id' => $newId,
            ], 201);
            break;

        case 'PUT':
        case 'PATCH':
            $id = require_int($_GET['id'] ?? null, 'id');
            $in = json_input();

            $stmt = $db->prepare("SELECT * FROM devices WHERE id = :id AND deleted_at IS NULL LIMIT 1");
            $stmt->execute([':id' => $id]);
            $existing = $stmt->fetch();

            if (!$existing) {
                not_found('device_not_found');
            }

            $data = [
                'venue_id' => array_key_exists('venue_id', $in) ? optional_int($in['venue_id']) : $existing['venue_id'],
                'device_name' => array_key_exists('device_name', $in) ? optional_string($in['device_name'], 255) : $existing['device_name'],
                'Divace_type' => array_key_exists('Divace_type', $in) ? optional_enum($in['Divace_type'], ['kitchen', 'mobile', 'desktop'], 'Divace_type') : $existing['Divace_type'],
                'station' => array_key_exists('station', $in) ? optional_string($in['station'], 64) : $existing['station'],
                'login' => array_key_exists('login', $in) ? optional_int($in['login']) : $existing['login'],
                'stable_id' => array_key_exists('stable_id', $in) ? require_string($in['stable_id'], 'stable_id', 128) : $existing['stable_id'],
                'imei' => array_key_exists('imei', $in) ? optional_string($in['imei'], 64) : $existing['imei'],
                'app_version' => array_key_exists('app_version', $in) ? optional_string($in['app_version'], 50) : $existing['app_version'],
                'status' => array_key_exists('status', $in) ? optional_enum($in['status'], ['inactive', 'active', 'blocked'], 'status') : $existing['status'],
                'activated_at' => array_key_exists('activated_at', $in) ? optional_datetime($in['activated_at']) : $existing['activated_at'],
                'blocked_at' => array_key_exists('blocked_at', $in) ? optional_datetime($in['blocked_at']) : $existing['blocked_at'],
                'block_reason' => array_key_exists('block_reason', $in) ? optional_string($in['block_reason'], 255) : $existing['block_reason'],
                'last_block_reason' => array_key_exists('last_block_reason', $in) ? optional_string($in['last_block_reason'], 50) : $existing['last_block_reason'],
                'last_block_source' => array_key_exists('last_block_source', $in) ? optional_string($in['last_block_source'], 50) : $existing['last_block_source'],
            ];

            $chk = $db->prepare("
                SELECT id FROM devices
                WHERE stable_id = :stable_id
                  AND id <> :id
                  AND deleted_at IS NULL
                LIMIT 1
            ");
            $chk->execute([
                ':stable_id' => $data['stable_id'],
                ':id' => $id,
            ]);
            if ($chk->fetch()) {
                bad_request('stable_id_already_exists');
            }

            if ($data['venue_id'] !== null) {
                $venueChk = $db->prepare("SELECT id FROM venues WHERE id = :id LIMIT 1");
                $venueChk->execute([':id' => $data['venue_id']]);
                if (!$venueChk->fetch()) {
                    bad_request('invalid_venue_id');
                }
            }

            $upd = $db->prepare("
                UPDATE devices
                SET
                    venue_id = :venue_id,
                    device_name = :device_name,
                    Divace_type = :Divace_type,
                    station = :station,
                    login = :login,
                    stable_id = :stable_id,
                    imei = :imei,
                    app_version = :app_version,
                    status = :status,
                    activated_at = :activated_at,
                    blocked_at = :blocked_at,
                    block_reason = :block_reason,
                    last_block_reason = :last_block_reason,
                    last_block_source = :last_block_source,
                    updated_at = NOW()
                WHERE id = :id
                  AND deleted_at IS NULL
            ");

            $upd->execute([
                ':venue_id' => $data['venue_id'],
                ':device_name' => $data['device_name'],
                ':Divace_type' => $data['Divace_type'],
                ':station' => $data['station'],
                ':login' => $data['login'],
                ':stable_id' => $data['stable_id'],
                ':imei' => $data['imei'],
                ':app_version' => $data['app_version'],
                ':status' => $data['status'],
                ':activated_at' => $data['activated_at'],
                ':blocked_at' => $data['blocked_at'],
                ':block_reason' => $data['block_reason'],
                ':last_block_reason' => $data['last_block_reason'],
                ':last_block_source' => $data['last_block_source'],
                ':id' => $id,
            ]);

            api_log('device_updated', ['id' => $id]);
            audit_log($db, 'devices', $id, 'update', $in);

            json_response([
                'ok' => true,
                'message' => 'device_updated',
            ]);
            break;

        case 'DELETE':
            $id = require_int($_GET['id'] ?? null, 'id');

            $stmt = $db->prepare("
                UPDATE devices
                SET deleted_at = NOW(), deleted_by = 'api'
                WHERE id = :id
                  AND deleted_at IS NULL
            ");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                not_found('device_not_found_or_already_deleted');
            }

            api_log('device_deleted', ['id' => $id]);
            audit_log($db, 'devices', $id, 'soft_delete');

            json_response([
                'ok' => true,
                'message' => 'device_deleted',
            ]);
            break;

        default:
            method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    }
} catch (Throwable $e) {
    api_log('devices_api_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}