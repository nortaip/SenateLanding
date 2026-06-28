<?php
// Senate back-office splash bootstrap.
//
// `Divaces2.php`-nın back-office variantı — eyni "register, update,
// resolve" axını, lakin `Divace_type='desktop'` default-u ilə.  Mobil
// splash screen-ində olduğu kimi:
//
//   1) Cihaz yenidirsə → INSERT (status=inactive, venue_id=NULL)
//   2) Mövcuddursa → device_name / app_version / imei yenilənir
//   3) Cavabda `stage` qaytarır:
//        - need_qr_and_activation : admin xüsusi kod yazmalıdır
//        - ready                  : cihaz aktivdir, login açıla bilər
//        - blocked                : block edilib
//   4) `venue` (id, code, name, domain, api_base_url) cavaba daxil
//      olur ki, splash dərhal `AppConfig.apiBaseUrl`-i set etsin və
//      FastAPI çağırışları işə düşsün.
//
// İstifadə (POST):
//   {
//     "stable_id":  "bo-asif-pc-...",
//     "device_name":"Senate ERP / Windows 10",
//     "app_version":"1.4.0+12",
//     "imei":       null
//   }

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
// `migrations.php` faylı serverə hələ upload edilməyibsə də işləsin:
// `@include_once` xəta vermir, `function_exists` yoxlanışı isə
// funksiyanı inline elan edir.  Beləliklə yalnız bu endpoint
// faylını upload etmək kifayətdir — schema avtomatik yaranır.
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
            } catch (Throwable $_) {
                // Schema dəyişikliyi uğursuz olarsa ignorlayırıq —
                // əsas məqsəd kodu sınmadan davam etdirməkdir.
            }
        }
        // device_id NULL allow et — FK constraint `devices.id`-in
        // tipini (məs. `int unsigned`) tələb edir.  `INT` yazsaq
        // "incompatible" xətası alırıq.  Ona görə devices.id-in
        // dəqiq tipini tapıb eyni tipi istifadə edirik.
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
                $tq = $db->prepare("
                    SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE()
                       AND TABLE_NAME   = 'devices'
                       AND COLUMN_NAME  = 'id'
                     LIMIT 1
                ");
                $tq->execute();
                $idType = trim((string)($tq->fetchColumn() ?: 'INT'));
                try {
                    $db->exec("ALTER TABLE `device_activation_codes` MODIFY `device_id` {$idType} NULL");
                } catch (Throwable $_) {
                    // FK ilə kolizyon — əvvəlcə FK-i drop et, sonra
                    // MODIFY, sonra FK-i ON DELETE SET NULL ilə bərpa et.
                    $fkq = $db->prepare("
                        SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                         WHERE TABLE_SCHEMA = DATABASE()
                           AND TABLE_NAME   = 'device_activation_codes'
                           AND COLUMN_NAME  = 'device_id'
                           AND REFERENCED_TABLE_NAME = 'devices'
                         LIMIT 1
                    ");
                    $fkq->execute();
                    $fkName = (string)$fkq->fetchColumn();
                    if ($fkName !== '') {
                        try {
                            $db->exec("ALTER TABLE `device_activation_codes` DROP FOREIGN KEY `{$fkName}`");
                            $db->exec("ALTER TABLE `device_activation_codes` MODIFY `device_id` {$idType} NULL");
                            $db->exec("
                                ALTER TABLE `device_activation_codes`
                                ADD CONSTRAINT `{$fkName}`
                                FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`)
                                ON DELETE SET NULL
                            ");
                        } catch (Throwable $_) {}
                    }
                }
            }
        } catch (Throwable $_) {}
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
if ($method !== 'POST') {
    method_not_allowed(['POST', 'OPTIONS']);
}

/** Aktiv aktivasiya kodu varsa qaytar, yoxdursa yarat. */
function bo_get_or_create_code(PDO $db, int $deviceId): string {
    $stmt = $db->prepare("
        SELECT code
          FROM device_activation_codes
         WHERE device_id = ? AND used_at IS NULL
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY id DESC
         LIMIT 1
    ");
    $stmt->execute([$deviceId]);
    $code = (string)($stmt->fetchColumn() ?: '');
    if ($code !== '') return $code;

    // 6 simvolluq oxunaqlı kod (A–Z, 2–9; oxşar simvollardan qaçırıq).
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < 6; $i++) {
        $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }

    $exp = (new DateTime('+1 day'))->format('Y-m-d H:i:s');
    $db->prepare("
        INSERT INTO device_activation_codes
          (device_id, code, created_at, expires_at)
        VALUES (?, ?, NOW(), ?)
    ")->execute([$deviceId, $code, $exp]);

    return $code;
}

/** Venue summary (id, code, name, domain, api_base_url, limit). */
function bo_venue_payload(PDO $db, ?int $venueId): ?array {
    if (!$venueId) return null;
    $vq = $db->prepare("
        SELECT id, code, name, domain, api_base_url, status
          FROM venues
         WHERE id = :id
         LIMIT 1
    ");
    $vq->execute([':id' => $venueId]);
    $venue = $vq->fetch();
    if (!$venue) return null;

    $lq = $db->prepare("
        SELECT COALESCE(max_devices, device_limit, 0) AS max_devices
          FROM venue_device_limits
         WHERE venue_id = :v
         LIMIT 1
    ");
    $lq->execute([':v' => $venueId]);
    $maxDevices = (int)($lq->fetchColumn() ?: 0);

    $cq = $db->prepare("
        SELECT COUNT(*)
          FROM devices
         WHERE venue_id = :v AND status = 'active'
    ");
    $cq->execute([':v' => $venueId]);
    $active = (int)$cq->fetchColumn();

    return [
        'id'           => (int)$venue['id'],
        'code'         => (string)$venue['code'],
        'name'         => (string)($venue['name'] ?? ''),
        'domain'       => (string)($venue['domain'] ?? ''),
        'api_base_url' => (string)($venue['api_base_url'] ?? ''),
        'status'       => (string)($venue['status'] ?? 'active'),
        'limit'        => [
            'max_devices' => $maxDevices,
            'active'      => $active,
        ],
    ];
}

try {
    ensure_senate_schema($db);

    $in          = json_input();
    $stableId    = require_string($in['stable_id'] ?? null, 'stable_id', 128);
    $deviceName  = optional_string($in['device_name'] ?? null, 255) ?? 'Back-office';
    $appVersion  = optional_string($in['app_version'] ?? null, 50);
    $imei        = optional_string($in['imei'] ?? null, 64);

    // 1) Cihazı tap.
    $stmt = $db->prepare("
        SELECT id, venue_id, device_name, Divace_type, station, login,
               stable_id, imei, app_version, status,
               created_at, updated_at, activated_at,
               blocked_at, block_reason
          FROM devices
         WHERE stable_id = ?
         LIMIT 1
    ");
    $stmt->execute([$stableId]);
    $row = $stmt->fetch();

    // 2) Yoxdursa — yarat (default Divace_type='desktop' fərqi mobildən).
    if (!$row) {
        $ins = $db->prepare("
            INSERT INTO devices
              (venue_id, device_name, Divace_type, stable_id,
               imei, app_version, status, login,
               created_at, updated_at)
            VALUES
              (NULL, ?, 'desktop', ?,
               ?, ?, 'inactive', 0,
               NOW(), NOW())
        ");
        $ins->execute([
            $deviceName,
            $stableId,
            ($imei === null || $imei === '') ? null : $imei,
            ($appVersion === null || $appVersion === '') ? null : $appVersion,
        ]);
        $deviceId = (int)$db->lastInsertId();
        if ($deviceId <= 0) {
            api_log('backoffice_boot_insert_failed', [
                'stable_id' => $stableId,
            ]);
            json_response([
                'ok'    => false,
                'error' => 'device_insert_failed',
                'detail' => 'Cihaz devices cədvəlinə əlavə oluna bilmədi. '
                          . 'NOT NULL constraint / strict_mode yoxlayın.',
            ], 500);
        }
        // ⚠️  Back-office axınında splash cihaz üçün auto-kod
        // yaratmır.  Admin venue səhifəsindən one-time kod
        // generate edir, kodun harda olduğunu user-ə verir.

        audit_log($db, 'devices', $deviceId, 'backoffice_boot_new', [
            'stable_id'  => $stableId,
            'device_name'=> $deviceName,
        ]);

        json_response([
            'ok'              => true,
            'allow_login'     => false,
            'stage'           => 'need_qr_and_activation',
            'device_id'       => $deviceId,
            'stable_id'       => $stableId,
            'activation_code' => null,
            'device' => [
                'id'           => $deviceId,
                'venue_id'     => null,
                'stable_id'    => $stableId,
                'device_name'  => $deviceName,
                'divace_type'  => 'desktop',
                'device_type'  => 'desktop',
                'station'      => null,
                'login'        => 0,
                'imei'         => $imei,
                'app_version'  => $appVersion,
                'status'       => 'inactive',
            ],
            'venue' => null,
        ]);
    }

    // 3) Var — son məlumatları yenilə (Divace_type/station/login dəyişmir).
    $upd = $db->prepare("
        UPDATE devices
           SET device_name = COALESCE(NULLIF(?, ''), device_name),
               app_version = ?,
               imei        = ?,
               updated_at  = NOW()
         WHERE stable_id = ?
    ");
    $upd->execute([
        $deviceName,
        ($appVersion === null || $appVersion === '') ? null : $appVersion,
        ($imei === null || $imei === '') ? null : $imei,
        $stableId,
    ]);

    // Təzələnmiş row-u oxu.
    $stmt->execute([$stableId]);
    $row = $stmt->fetch();

    // 4) Status məntiqi.
    $status      = strtolower((string)($row['status'] ?? 'inactive'));
    $isBlocked   = ($status === 'blocked') || !empty($row['blocked_at']);
    $loginFlag   = (int)($row['login'] ?? 0) === 1;
    $allowLogin  = (!$isBlocked && $status === 'active' && $loginFlag);
    $divaceType  = strtolower((string)($row['Divace_type'] ?? 'desktop'));
    $station     = $row['station'] ?? null;
    $venueIdRaw  = isset($row['venue_id']) && $row['venue_id'] !== null
        ? (int)$row['venue_id'] : null;
    $venuePayload = bo_venue_payload($db, $venueIdRaw);

    $deviceShape = [
        'id'           => (int)$row['id'],
        'venue_id'     => $venueIdRaw,
        'stable_id'    => $row['stable_id'],
        'device_name'  => $row['device_name'] ?? '',
        'divace_type'  => $divaceType,
        'device_type'  => $divaceType,
        'station'      => $station,
        'login'        => (int)($row['login'] ?? 0),
        'imei'         => $row['imei'] ?? null,
        'app_version'  => $row['app_version'] ?? null,
        'status'       => $status,
        'created_at'   => $row['created_at'] ?? null,
        'updated_at'   => $row['updated_at'] ?? null,
        'activated_at' => $row['activated_at'] ?? null,
        'blocked_at'   => $row['blocked_at'] ?? null,
        'block_reason' => $row['block_reason'] ?? null,
    ];

    if ($isBlocked) {
        json_response([
            'ok'          => true,
            'allow_login' => false,
            'stage'       => 'blocked',
            'status'      => 'blocked',
            'device'      => $deviceShape,
            'venue'       => $venuePayload,
        ]);
    }

    if (!$allowLogin) {
        // İnaktivdir — kod aktiv-deyilsə yenisini yarat.
        $code = bo_get_or_create_code($db, (int)$row['id']);
        json_response([
            'ok'              => true,
            'allow_login'     => false,
            'stage'           => 'need_qr_and_activation',
            'device_id'       => (int)$row['id'],
            'stable_id'       => $stableId,
            'activation_code' => $code,
            'device'          => $deviceShape,
            'venue'           => $venuePayload,
        ]);
    }

    // Ready — venue məlumatı və api_base_url ilə birgə cavab.
    json_response([
        'ok'          => true,
        'allow_login' => true,
        'stage'       => 'ready',
        'status'      => 'active',
        'device'      => $deviceShape,
        'venue'       => $venuePayload,
    ]);
} catch (Throwable $e) {
    api_log('backoffice_boot_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}
