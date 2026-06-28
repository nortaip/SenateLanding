<?php
// Object owners CRUD — master admin panelinin əsas idarəetmə nöqtəsi.
//
// Hər owner bir obyekt sahibidir: ad, soyad, telefon (məcburi).
// Telefon unique-dir — master admin başqa sahiblərlə qarışmasın
// deyə tələb olunur.  GET-də venues siyahısı + cihaz limit/aktiv
// statistikası ilə birlikdə qaytarılır ki, panel tək sorğuda
// owner-i obyektləri ilə birlikdə render edə bilsin.

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
@include_once __DIR__ . '/helpers/migrations.php';
if (!function_exists('ensure_owners_schema')) {
    // Migrations faylı upload edilməyibsə inline yaradırıq.
    function ensure_owners_schema(PDO $db): void {
        try {
            $db->exec("
                CREATE TABLE IF NOT EXISTS `owners` (
                    `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    `first_name` VARCHAR(100) NOT NULL DEFAULT '',
                    `last_name`  VARCHAR(100) NOT NULL DEFAULT '',
                    `phone`      VARCHAR(50)  NOT NULL,
                    `email`      VARCHAR(255) NULL,
                    `notes`      TEXT NULL,
                    `status`     VARCHAR(20)  NOT NULL DEFAULT 'active',
                    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME     NULL,
                    `deleted_at` DATETIME     NULL,
                    UNIQUE KEY `uq_owner_phone` (`phone`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");
            $exists = $db->prepare("
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'venues' AND COLUMN_NAME = 'owner_id'
            ");
            $exists->execute();
            if ((int)$exists->fetchColumn() === 0) {
                $db->exec("ALTER TABLE `venues` ADD COLUMN `owner_id` INT UNSIGNED NULL AFTER `api_base_url`");
            }
        } catch (Throwable $_) {}
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/**
 * Müəyyən bir cədvəldə sütun adının mövcudluğunu yoxlayır — köhnə
 * sxemada `name`/`status`/`owner_id`/`max_devices` olmaya bilər,
 * onsuz da işlədək.
 */
function column_exists(PDO $db, string $table, string $column): bool
{
    static $cache = [];
    $key = "$table.$column";
    if (isset($cache[$key])) return $cache[$key];
    try {
        $q = $db->prepare("
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = :t AND COLUMN_NAME = :c
        ");
        $q->execute([':t' => $table, ':c' => $column]);
        $cache[$key] = ((int)$q->fetchColumn() > 0);
    } catch (Throwable $_) {
        $cache[$key] = false;
    }
    return $cache[$key];
}

function owner_with_venues(PDO $db, int $ownerId): array
{
    $o = $db->prepare("
        SELECT id, first_name, last_name, phone, email, notes, status,
               created_at, updated_at
          FROM owners
         WHERE id = :id AND (deleted_at IS NULL)
         LIMIT 1
    ");
    $o->execute([':id' => $ownerId]);
    $owner = $o->fetch();
    if (!$owner) return [];

    // Venues — dinamik kolon seçimi.  `name`/`status`/`owner_id`
    // sütunları köhnə bazada olmaya bilər.  Sütun yoxdursa NULL
    // qaytarırıq ki, SELECT itməsin.
    $vCols = ['v.id', 'v.code'];
    $vCols[] = column_exists($db, 'venues', 'name')
        ? 'v.name' : "NULL AS name";
    $vCols[] = column_exists($db, 'venues', 'domain')
        ? 'v.domain' : "NULL AS domain";
    $vCols[] = column_exists($db, 'venues', 'api_base_url')
        ? 'v.api_base_url' : "NULL AS api_base_url";
    $vCols[] = column_exists($db, 'venues', 'status')
        ? 'v.status' : "'active' AS status";

    $hasOwnerCol = column_exists($db, 'venues', 'owner_id');
    if (!$hasOwnerCol) {
        // owner_id sütunu yoxdur → bu owner-ə venue bağlamaq mümkün
        // deyil, boş siyahı qaytar.
        $owner['venues'] = [];
        return $owner;
    }

    $limitMax = column_exists($db, 'venue_device_limits', 'max_devices');
    $limitOld = column_exists($db, 'venue_device_limits', 'device_limit');
    if ($limitMax && $limitOld) {
        $vCols[] = 'COALESCE(l.max_devices, l.device_limit, 0) AS max_devices';
    } elseif ($limitMax) {
        $vCols[] = 'COALESCE(l.max_devices, 0) AS max_devices';
    } elseif ($limitOld) {
        $vCols[] = 'COALESCE(l.device_limit, 0) AS max_devices';
    } else {
        $vCols[] = '0 AS max_devices';
    }
    $joinLimit = ($limitMax || $limitOld)
        ? 'LEFT JOIN venue_device_limits l ON l.venue_id = v.id'
        : '';

    $sql = "
        SELECT " . implode(', ', $vCols) . ",
               (SELECT COUNT(*) FROM devices d
                 WHERE d.venue_id = v.id AND d.status = 'active') AS active_devices,
               (SELECT COUNT(*) FROM devices d
                 WHERE d.venue_id = v.id) AS total_devices
          FROM venues v
          {$joinLimit}
         WHERE v.owner_id = :oid
         ORDER BY v.id
    ";
    $v = $db->prepare($sql);
    $v->execute([':oid' => $ownerId]);
    $owner['venues'] = $v->fetchAll();
    return $owner;
}

try {
    ensure_owners_schema($db);

    switch ($method) {
        case 'GET':
            // Tək owner — venues ilə birlikdə.
            if (isset($_GET['id'])) {
                $id = require_int($_GET['id'], 'id');
                $owner = owner_with_venues($db, $id);
                if (!$owner) not_found('owner_not_found');
                json_response(['ok' => true, 'data' => $owner]);
            }

            [$page, $limit, $offset] = validate_pagination();
            $search = validate_search();

            $where = ['(o.deleted_at IS NULL)'];
            $params = [];

            if ($search) {
                $where[] = '(o.first_name LIKE :s OR o.last_name LIKE :s '
                         . 'OR o.phone LIKE :s OR o.email LIKE :s)';
                $params[':s'] = '%' . $search . '%';
            }
            $whereSql = implode(' AND ', $where);

            // Hər owner üçün venue sayı və limit ümumi cəmləri.
            // Köhnə sxemada `venues.owner_id` olmaya bilər — onda
            // subquery-ləri 0 ilə əvəz edirik.
            $hasOwnerCol = column_exists($db, 'venues', 'owner_id');
            $limitMax    = column_exists($db, 'venue_device_limits', 'max_devices');
            $limitOld    = column_exists($db, 'venue_device_limits', 'device_limit');

            if ($hasOwnerCol) {
                $venueCountSql = "(SELECT COUNT(*) FROM venues v WHERE v.owner_id = o.id)";
                if ($limitMax && $limitOld) {
                    $limitCoalesce = "COALESCE(l.max_devices, l.device_limit, 0)";
                } elseif ($limitMax) {
                    $limitCoalesce = "COALESCE(l.max_devices, 0)";
                } elseif ($limitOld) {
                    $limitCoalesce = "COALESCE(l.device_limit, 0)";
                } else {
                    $limitCoalesce = null;
                }
                if ($limitCoalesce) {
                    $totalLimitSql = "(SELECT COALESCE(SUM({$limitCoalesce}), 0)
                                         FROM venues v
                                    LEFT JOIN venue_device_limits l ON l.venue_id = v.id
                                        WHERE v.owner_id = o.id)";
                } else {
                    $totalLimitSql = '0';
                }
                $activeDevSql = "(SELECT COUNT(*) FROM devices d
                                   WHERE d.venue_id IN (SELECT id FROM venues WHERE owner_id = o.id)
                                     AND d.status = 'active')";
            } else {
                $venueCountSql = '0';
                $totalLimitSql = '0';
                $activeDevSql  = '0';
            }

            $sql = "
                SELECT
                    o.id, o.first_name, o.last_name, o.phone, o.email,
                    o.status, o.notes, o.created_at, o.updated_at,
                    {$venueCountSql}  AS venue_count,
                    {$totalLimitSql}  AS total_limit,
                    {$activeDevSql}   AS active_devices
                  FROM owners o
                 WHERE {$whereSql}
                 ORDER BY o.id DESC
                 LIMIT :limit OFFSET :offset
            ";
            $stmt = $db->prepare($sql);
            foreach ($params as $k => $v) $stmt->bindValue($k, $v);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $countStmt = $db->prepare("SELECT COUNT(*) FROM owners o WHERE {$whereSql}");
            $countStmt->execute($params);

            json_response([
                'ok'    => true,
                'page'  => $page,
                'limit' => $limit,
                'total' => (int)$countStmt->fetchColumn(),
                'data'  => $stmt->fetchAll(),
            ]);
            break;

        case 'POST':
            $in = json_input();
            $firstName = require_string($in['first_name'] ?? null, 'first_name', 100);
            $lastName  = require_string($in['last_name']  ?? null, 'last_name', 100);
            $phone     = require_string($in['phone']      ?? null, 'phone', 50);
            $email     = optional_string($in['email'] ?? null, 255);
            $notes     = optional_string($in['notes'] ?? null, 2000);
            $status    = optional_enum(
                $in['status'] ?? 'active',
                ['active', 'inactive', 'blocked'],
                'status'
            ) ?? 'active';

            // Telefon unique yoxlanışı.
            $dup = $db->prepare("
                SELECT id FROM owners
                 WHERE phone = :p AND (deleted_at IS NULL) LIMIT 1
            ");
            $dup->execute([':p' => $phone]);
            if ($dup->fetch()) {
                bad_request('phone_already_exists', [
                    'detail' => 'Bu telefon nömrəsi ilə artıq owner mövcuddur.',
                ]);
            }

            $ins = $db->prepare("
                INSERT INTO owners
                  (first_name, last_name, phone, email, notes, status, created_at)
                VALUES
                  (:fn, :ln, :ph, :em, :no, :st, NOW())
            ");
            $ins->execute([
                ':fn' => $firstName,
                ':ln' => $lastName,
                ':ph' => $phone,
                ':em' => $email,
                ':no' => $notes,
                ':st' => $status,
            ]);
            $newId = (int)$db->lastInsertId();
            audit_log($db, 'owners', $newId, 'create', $in);
            json_response([
                'ok'      => true,
                'message' => 'owner_created',
                'id'      => $newId,
            ], 201);
            break;

        case 'PUT':
        case 'PATCH':
            $id = require_int($_GET['id'] ?? null, 'id');
            $in = json_input();

            $cur = $db->prepare("
                SELECT * FROM owners
                 WHERE id = :id AND (deleted_at IS NULL) LIMIT 1
            ");
            $cur->execute([':id' => $id]);
            $row = $cur->fetch();
            if (!$row) not_found('owner_not_found');

            $allowed = ['first_name', 'last_name', 'phone', 'email', 'notes', 'status'];
            $sets    = [];
            $params  = [':id' => $id];
            foreach ($allowed as $f) {
                if (!array_key_exists($f, $in)) continue;
                $val = $in[$f];
                if ($f === 'phone' || $f === 'first_name' || $f === 'last_name') {
                    $val = require_string($val, $f,
                        $f === 'phone' ? 50 : 100);
                } elseif ($f === 'status') {
                    $val = optional_enum($val,
                        ['active', 'inactive', 'blocked'], 'status') ?? 'active';
                } else {
                    $val = optional_string($val, 2000);
                }
                $sets[] = "`{$f}` = :{$f}";
                $params[":{$f}"] = $val;
            }
            if (!$sets) bad_request('no_fields_to_update');

            // Telefon unique yoxlanışı.
            if (isset($params[':phone'])) {
                $dup = $db->prepare("
                    SELECT id FROM owners
                     WHERE phone = :p AND id <> :id
                       AND (deleted_at IS NULL) LIMIT 1
                ");
                $dup->execute([':p' => $params[':phone'], ':id' => $id]);
                if ($dup->fetch()) {
                    bad_request('phone_already_exists');
                }
            }

            $sql = "UPDATE owners SET " . implode(', ', $sets)
                 . ", updated_at = NOW() WHERE id = :id";
            $upd = $db->prepare($sql);
            $upd->execute($params);

            audit_log($db, 'owners', $id, 'update', $in);
            json_response(['ok' => true, 'message' => 'owner_updated']);
            break;

        case 'DELETE':
            $id = require_int($_GET['id'] ?? null, 'id');

            // Soft delete — venue-lər owner_id-i saxlayır, lakin yeni
            // venue təyin etmək üçün owner mövcud sayılmır.
            $del = $db->prepare("
                UPDATE owners
                   SET deleted_at = NOW(),
                       status = 'inactive'
                 WHERE id = :id AND (deleted_at IS NULL)
            ");
            $del->execute([':id' => $id]);
            if ($del->rowCount() === 0) not_found('owner_not_found');

            audit_log($db, 'owners', $id, 'soft_delete');
            json_response(['ok' => true, 'message' => 'owner_deleted']);
            break;

        default:
            method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    }
} catch (Throwable $e) {
    api_log('owners_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}
