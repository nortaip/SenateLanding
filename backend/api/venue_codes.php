<?php
// Venue üçün one-time aktivasiya kodlarının idarəetməsi.
//
// Admin Senate ERP "Obyektlər" səhifəsində bir venue seçir, "Yeni
// aktivasiya kodu" basır → bu endpoint çağırılır → server
// `device_activation_codes` cədvəlində venue-scoped kod yaradır
// (device_id = NULL, venue_id set, expires_at = +TTL).  Kod
// back-office user-ə verilir, o yazır, redeem zamanı kod
// `used_at` ilə möhürlənir.  İkinci dəfə işləməz.
//
// Endpoint-lər:
//   GET    ?venue_id=X         → bu venue üçün aktiv kodlar siyahısı
//   POST   {venue_id, ttl_hours?=24, count?=1} → yeni kod(lar) yarat
//   DELETE ?id=Y               → kodu ləğv et (used_at = NOW())

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
// `migrations.php` faylı serverə hələ upload edilməyibsə də işləsin.
@include_once __DIR__ . '/helpers/migrations.php';
if (!function_exists('ensure_senate_schema')) {
    function ensure_senate_schema(PDO $db): void {
        $cols = [
            ['venues', 'name', 'VARCHAR(255) NULL'],
            ['venues', 'status', "VARCHAR(20) NOT NULL DEFAULT 'active'"],
            ['device_activation_codes', 'venue_id', 'INT NULL'],
            ['device_activation_codes', 'deleted_at', 'DATETIME NULL'],
        ];
        foreach ($cols as [$t, $c, $def]) {
            try {
                $q = $db->prepare("
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE()
                       AND TABLE_NAME   = :t
                       AND COLUMN_NAME  = :c
                ");
                $q->execute([':t' => $t, ':c' => $c]);
                if ((int)$q->fetchColumn() === 0) {
                    $db->exec("ALTER TABLE `{$t}` ADD COLUMN `{$c}` {$def}");
                }
            } catch (Throwable $_) {}
        }
        try {
            $q = $db->prepare("
                SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME   = 'device_activation_codes'
                   AND COLUMN_NAME  = 'device_id'
                 LIMIT 1
            ");
            $q->execute();
            if ((string)$q->fetchColumn() === 'NO') {
                $db->exec("ALTER TABLE `device_activation_codes` MODIFY `device_id` INT NULL");
            }
        } catch (Throwable $_) {}
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function vc_random_code(int $len = 6): string {
    // A–Z, 2–9 (0/O/1/I/L kimi oxşar simvollar yoxdur).
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $out = '';
    for ($i = 0; $i < $len; $i++) {
        $out .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $out;
}

try {
    ensure_senate_schema($db);

    switch ($method) {
        case 'GET':
            $venueId = require_int($_GET['venue_id'] ?? null, 'venue_id');

            // Venue mövcudluğunu yoxla.
            $vq = $db->prepare("
                SELECT id, code, name FROM venues WHERE id = :v LIMIT 1
            ");
            $vq->execute([':v' => $venueId]);
            $venue = $vq->fetch();
            if (!$venue) {
                not_found('venue_not_found');
            }

            // Bu venue üçün açılmış kodlar — həm aktiv (used_at NULL,
            // expired deyil), həm də son istifadə tarixçəsi.
            $sq = $db->prepare("
                SELECT
                    id, code, device_id, venue_id,
                    created_at, expires_at, used_at,
                    CASE
                        WHEN used_at IS NOT NULL              THEN 'used'
                        WHEN expires_at < NOW()               THEN 'expired'
                        ELSE 'active'
                    END AS state
                  FROM device_activation_codes
                 WHERE venue_id = :v
                   AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')
                 ORDER BY id DESC
                 LIMIT 100
            ");
            try {
                $sq->execute([':v' => $venueId]);
            } catch (Throwable $_) {
                $sq = $db->prepare("
                    SELECT
                        id, code, device_id, venue_id,
                        created_at, expires_at, used_at,
                        CASE
                            WHEN used_at IS NOT NULL THEN 'used'
                            WHEN expires_at < NOW()  THEN 'expired'
                            ELSE 'active'
                        END AS state
                      FROM device_activation_codes
                     WHERE venue_id = :v
                     ORDER BY id DESC
                     LIMIT 100
                ");
                $sq->execute([':v' => $venueId]);
            }
            $rows = $sq->fetchAll();

            json_response([
                'ok'    => true,
                'venue' => [
                    'id'   => (int)$venue['id'],
                    'code' => (string)$venue['code'],
                    'name' => (string)($venue['name'] ?? ''),
                ],
                'codes' => $rows,
            ]);
            break;

        case 'POST':
            $in       = json_input();
            $venueId  = require_int($in['venue_id']  ?? null, 'venue_id');
            $ttlHours = isset($in['ttl_hours']) ? max(1, (int)$in['ttl_hours']) : 24;
            $count    = isset($in['count']) ? max(1, min(10, (int)$in['count'])) : 1;

            $vq = $db->prepare("
                SELECT id, code, name FROM venues WHERE id = :v LIMIT 1
            ");
            $vq->execute([':v' => $venueId]);
            $venue = $vq->fetch();
            if (!$venue) {
                not_found('venue_not_found');
            }

            $expiresAt = (new DateTime("+{$ttlHours} hours"))->format('Y-m-d H:i:s');
            $created = [];

            for ($i = 0; $i < $count; $i++) {
                // Unikallıq üçün maksimum 5 cəhd — kolizyon riski praktik
                // olaraq sıfırdır (32^6 ≈ 1 milyard), ancaq idempotent
                // garanti.
                $code = '';
                $ins = $db->prepare("
                    INSERT INTO device_activation_codes
                      (device_id, venue_id, code, created_at, expires_at)
                    VALUES
                      (NULL, :v, :c, NOW(), :e)
                ");
                $attempts = 0;
                while ($attempts < 5) {
                    $candidate = vc_random_code(6);
                    try {
                        $ins->execute([
                            ':v' => $venueId,
                            ':c' => $candidate,
                            ':e' => $expiresAt,
                        ]);
                        $code = $candidate;
                        break;
                    } catch (PDOException $pe) {
                        // unique constraint pozulubsa təkrar cəhd.
                        if ($pe->getCode() === '23000') {
                            $attempts++;
                            continue;
                        }
                        throw $pe;
                    }
                }
                if ($code === '') {
                    server_error('code_generation_collision');
                }
                $created[] = [
                    'id'         => (int)$db->lastInsertId(),
                    'code'       => $code,
                    'venue_id'   => $venueId,
                    'expires_at' => $expiresAt,
                ];
            }

            audit_log($db, 'device_activation_codes', null, 'venue_codes_create', [
                'venue_id' => $venueId,
                'count'    => $count,
                'ttl_hours'=> $ttlHours,
            ]);

            json_response([
                'ok'    => true,
                'venue' => [
                    'id'   => (int)$venue['id'],
                    'code' => (string)$venue['code'],
                    'name' => (string)($venue['name'] ?? ''),
                ],
                'created' => $created,
            ], 201);
            break;

        case 'DELETE':
            $codeId = require_int($_GET['id'] ?? null, 'id');

            // Soft-revoke: used_at = NOW().  Sil etmirik ki, audit-də
            // qalsın.  Köhnə deleted_at sütunu varsa onu da işarələyirik.
            try {
                $del = $db->prepare("
                    UPDATE device_activation_codes
                       SET used_at    = COALESCE(used_at, NOW()),
                           deleted_at = NOW(),
                           deleted_by = 'admin_revoke'
                     WHERE id = :id
                ");
                $del->execute([':id' => $codeId]);
            } catch (Throwable $_) {
                $del = $db->prepare("
                    UPDATE device_activation_codes
                       SET used_at = COALESCE(used_at, NOW())
                     WHERE id = :id
                ");
                $del->execute([':id' => $codeId]);
            }
            if ($del->rowCount() === 0) {
                not_found('code_not_found');
            }

            audit_log($db, 'device_activation_codes', $codeId, 'venue_codes_revoke');
            json_response(['ok' => true, 'revoked' => $codeId]);
            break;

        default:
            method_not_allowed(['GET', 'POST', 'DELETE', 'OPTIONS']);
    }
} catch (Throwable $e) {
    api_log('venue_codes_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}
