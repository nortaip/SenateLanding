<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
// Optional miqrasiya zənciri — `owners` cədvəlini + venues.owner_id-i
// avtomatik qurur ki, master admin paneldən yaradılmış venue-lərə
// owner JOIN edə bilək.
@include_once __DIR__ . '/helpers/migrations.php';

/**
 * INFORMATION_SCHEMA ilə cədvəlin mövcudluğunu yoxlayır.  Köhnə
 * deploy-larda owners cədvəli olmaya bilər; o halda JOIN-i atırıq.
 */
function venues_table_exists(PDO $db, string $table): bool {
    static $cache = [];
    if (isset($cache[$table])) return $cache[$table];
    try {
        $q = $db->prepare("
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t
        ");
        $q->execute([':t' => $table]);
        $cache[$table] = ((int)$q->fetchColumn() > 0);
    } catch (Throwable $_) {
        $cache[$table] = false;
    }
    return $cache[$table];
}

function venues_column_exists(PDO $db, string $table, string $column): bool {
    static $cache = [];
    $k = "$table.$column";
    if (isset($cache[$k])) return $cache[$k];
    try {
        $q = $db->prepare("
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = :t AND COLUMN_NAME = :c
        ");
        $q->execute([':t' => $table, ':c' => $column]);
        $cache[$k] = ((int)$q->fetchColumn() > 0);
    } catch (Throwable $_) {
        $cache[$k] = false;
    }
    return $cache[$k];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    switch ($method) {
        case 'GET':
            // Single
            if (isset($_GET['id'])) {
                $id = require_int($_GET['id'], 'id');

                $hasName    = venues_column_exists($db, 'venues', 'name');
                $hasStatus  = venues_column_exists($db, 'venues', 'status');
                $hasOwner   = venues_column_exists($db, 'venues', 'owner_id');
                $hasOwners  = $hasOwner && venues_table_exists($db, 'owners');

                $cols = ['v.id', 'v.code', 'v.domain', 'v.api_base_url', 'v.created_at'];
                $cols[] = $hasName   ? 'v.name'     : "'' AS name";
                $cols[] = $hasStatus ? 'v.status'   : "'active' AS status";
                $cols[] = $hasOwner  ? 'v.owner_id' : "NULL AS owner_id";
                if ($hasOwners) {
                    $cols[] = 'o.first_name AS owner_first_name';
                    $cols[] = 'o.last_name  AS owner_last_name';
                    $cols[] = 'o.phone      AS owner_phone';
                    $cols[] = 'o.email      AS owner_email';
                }
                $joinSql = $hasOwners
                    ? 'LEFT JOIN owners o ON o.id = v.owner_id AND (o.deleted_at IS NULL)'
                    : '';

                $stmt = $db->prepare("
                    SELECT " . implode(', ', $cols) . "
                      FROM venues v
                      {$joinSql}
                     WHERE v.id = :id
                     LIMIT 1
                ");
                $stmt->execute([':id' => $id]);
                $row = $stmt->fetch();

                if (!$row) {
                    not_found('venue_not_found');
                }

                audit_log($db, 'venues', $id, 'view_one');

                json_response([
                    'ok' => true,
                    'data' => $row
                ]);
            }

            // List
            [$page, $limit, $offset] = validate_pagination();
            $search = validate_search();

            // Dinamik kolon dəstəyi — venues sxemada hansılar varsa
            // yalnız onlara istinad edirik (köhnə deploy-larda
            // `name/owner_id/status` olmaya bilər).
            $hasName    = venues_column_exists($db, 'venues', 'name');
            $hasStatus  = venues_column_exists($db, 'venues', 'status');
            $hasOwner   = venues_column_exists($db, 'venues', 'owner_id');
            $hasOwners  = $hasOwner && venues_table_exists($db, 'owners');

            $where = [];
            $params = [];

            if ($search) {
                $where[] = "(v.code LIKE :search "
                         . "OR v.domain LIKE :search "
                         . "OR v.api_base_url LIKE :search"
                         . ($hasName ? " OR v.name LIKE :search" : "")
                         . ")";
                $params[':search'] = '%' . $search . '%';
            }
            // owner_id filtr — master admin paneldə bir owner-in venue-lərini göstərmək üçün.
            if ($hasOwner && isset($_GET['owner_id']) && $_GET['owner_id'] !== '') {
                $where[] = 'v.owner_id = :owner_id';
                $params[':owner_id'] = (int)$_GET['owner_id'];
            }

            $whereSql = '';
            if (!empty($where)) {
                $whereSql = 'WHERE ' . implode(' AND ', $where);
            }

            // SELECT-də yalnız real kolonlar.
            $cols = ['v.id', 'v.code', 'v.domain', 'v.api_base_url', 'v.created_at'];
            $cols[] = $hasName   ? 'v.name'     : "'' AS name";
            $cols[] = $hasStatus ? 'v.status'   : "'active' AS status";
            $cols[] = $hasOwner  ? 'v.owner_id' : "NULL AS owner_id";
            if ($hasOwners) {
                $cols[] = 'o.first_name AS owner_first_name';
                $cols[] = 'o.last_name  AS owner_last_name';
                $cols[] = 'o.phone      AS owner_phone';
                $cols[] = 'o.email      AS owner_email';
            }
            $joinSql = $hasOwners
                ? 'LEFT JOIN owners o ON o.id = v.owner_id AND (o.deleted_at IS NULL)'
                : '';

            $countStmt = $db->prepare("
                SELECT COUNT(*) AS total
                  FROM venues v
                  {$joinSql}
                {$whereSql}
            ");
            $countStmt->execute($params);
            $total = (int)($countStmt->fetch()['total'] ?? 0);

            $stmt = $db->prepare("
                SELECT " . implode(', ', $cols) . "
                  FROM venues v
                  {$joinSql}
                {$whereSql}
                 ORDER BY v.id DESC
                 LIMIT :limit OFFSET :offset
            ");

            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $rows = $stmt->fetchAll();

            audit_log($db, 'venues', null, 'list', [
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
            // Yeni obyekt (venue) yarat.  Limit field-i bilərəkdən
            // exclude edilir — limit `venue_device_limits` cədvəlində
            // ayrıca dev tərəfindən qoyulur, admin form-undan deyil.
            $in = json_input();

            $code         = require_string($in['code'] ?? null, 'code', 100);
            $name         = optional_string($in['name'] ?? null, 255);
            $domain       = optional_string($in['domain'] ?? null, 255);
            $apiBaseUrl   = optional_string($in['api_base_url'] ?? null, 500);
            $ownerId      = isset($in['owner_id']) && $in['owner_id'] !== ''
                ? (int)$in['owner_id'] : null;

            // code unique check.
            $chk = $db->prepare("
                SELECT id FROM venues
                 WHERE code = :code
                 LIMIT 1
            ");
            $chk->execute([':code' => $code]);
            if ($chk->fetch()) {
                bad_request('code_already_exists');
            }

            $stmt = $db->prepare("
                INSERT INTO venues (code, name, domain, api_base_url, owner_id, status, created_at)
                VALUES (:code, :name, :domain, :api_base_url, :owner_id, 'active', NOW())
            ");
            $stmt->execute([
                ':code'         => $code,
                ':name'         => $name,
                ':domain'       => $domain,
                ':api_base_url' => $apiBaseUrl,
                ':owner_id'     => $ownerId,
            ]);
            $newId = (int)$db->lastInsertId();

            audit_log($db, 'venues', $newId, 'create', $in);
            api_log('venue_created', [
                'id' => $newId,
                'code' => $code,
            ]);

            json_response([
                'ok' => true,
                'message' => 'venue_created',
                'id' => $newId,
                'code' => $code,
            ], 201);
            break;

        case 'DELETE':
            $id = require_int($_GET['id'] ?? null, 'id');

            // Bağlı cihaz varsa silmə icazə vermirik — orphan device
            // qalmasın.  Admin əvvəlcə cihazları başqa venue-yə köçürsün.
            $chk = $db->prepare("
                SELECT COUNT(*) FROM devices
                 WHERE venue_id = :id
            ");
            $chk->execute([':id' => $id]);
            $deviceCount = (int)$chk->fetchColumn();
            if ($deviceCount > 0) {
                bad_request('venue_has_devices', [
                    'device_count' => $deviceCount,
                    'detail' => 'Obyekti silmək üçün əvvəl bütün cihazları başqa obyektə köçürün və ya silin.',
                ]);
            }

            // Limit qeydlərini də təmizlə (FK olmasa belə).
            $db->prepare("DELETE FROM venue_device_limits WHERE venue_id = :id")
               ->execute([':id' => $id]);
            $del = $db->prepare("DELETE FROM venues WHERE id = :id");
            $del->execute([':id' => $id]);

            if ($del->rowCount() === 0) {
                not_found('venue_not_found');
            }

            audit_log($db, 'venues', $id, 'delete');
            api_log('venue_deleted', ['id' => $id]);

            json_response([
                'ok' => true,
                'message' => 'venue_deleted',
            ]);
            break;

        case 'PUT':
        case 'PATCH':
            $id = require_int($_GET['id'] ?? null, 'id');
            $in = json_input();

            $stmt = $db->prepare("
                SELECT id, code, domain, api_base_url, created_at
                FROM venues
                WHERE id = :id
                LIMIT 1
            ");
            $stmt->execute([':id' => $id]);
            $existing = $stmt->fetch();

            if (!$existing) {
                not_found('venue_not_found');
            }

            $allowedFields = [
                'code',
                'name',
                'domain',
                'api_base_url',
                'owner_id',
            ];

            $updateData = [];
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $in)) {
                    $updateData[$field] = $in[$field];
                }
            }

            if (empty($updateData)) {
                bad_request('no_valid_fields_to_update', [
                    'allowed_fields' => $allowedFields
                ]);
            }

            if (array_key_exists('code', $updateData)) {
                $updateData['code'] = require_string($updateData['code'], 'code', 100);
            }

            if (array_key_exists('domain', $updateData)) {
                $updateData['domain'] = optional_string($updateData['domain'], 255);
            }

            if (array_key_exists('api_base_url', $updateData)) {
                $updateData['api_base_url'] = optional_string($updateData['api_base_url'], 500);
            }

            // code unique check
            if (array_key_exists('code', $updateData)) {
                $chk = $db->prepare("
                    SELECT id
                    FROM venues
                    WHERE code = :code
                      AND id <> :id
                    LIMIT 1
                ");
                $chk->execute([
                    ':code' => $updateData['code'],
                    ':id' => $id,
                ]);

                if ($chk->fetch()) {
                    bad_request('code_already_exists');
                }
            }

            $setParts = [];
            $params = [':id' => $id];

            foreach ($updateData as $field => $value) {
                $setParts[] = "{$field} = :{$field}";
                $params[":{$field}"] = $value;
            }

            $sql = "
                UPDATE venues
                SET " . implode(', ', $setParts) . "
                WHERE id = :id
            ";

            $upd = $db->prepare($sql);
            $upd->execute($params);

            audit_log($db, 'venues', $id, 'update', $in);
            api_log('venue_updated', [
                'id' => $id,
                'fields' => array_keys($updateData)
            ]);

            json_response([
                'ok' => true,
                'message' => 'venue_updated'
            ]);
            break;

        default:
            method_not_allowed(['GET', 'PUT', 'PATCH', 'OPTIONS']);
    }
} catch (Throwable $e) {
    api_log('venues_api_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}