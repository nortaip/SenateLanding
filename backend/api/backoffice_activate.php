<?php
// Senate back-office (desktop) — one-time code redemption.
//
// Refactored: artıq venue_code qəbul etmir.  Admin əvvəlcədən venue
// üçün `device_activation_codes`-də one-time kod yaradır (venue_id
// set, device_id NULL).  Back-office user kodu yazır, server kodu
// tapır, hansı venue-yə aiddirsə bilir, cihazı yaradır/yeniləyir və
// həm kodu used_at ilə möhürləyir, həm cihazı aktivləşdirir.
//
// Eyni kod ikinci dəfə işləməyəcək (used_at NULL şərti yoxlanır).
//
// İstifadə (POST):
//   {
//     "stable_id":  "bo-asif-pc-...",
//     "code":       "K7M9X2",
//     "device_name":"Back-office"   // opsional
//   }

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

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
if ($method !== 'POST') {
    method_not_allowed(['POST', 'OPTIONS']);
}

function ba_venue_payload(PDO $db, int $venueId): array
{
    $vq = $db->prepare("
        SELECT id, code, name, domain, api_base_url, status
          FROM venues
         WHERE id = :id
         LIMIT 1
    ");
    $vq->execute([':id' => $venueId]);
    $venue = $vq->fetch();
    if (!$venue) return [];

    $lq = $db->prepare("
        SELECT COALESCE(max_devices, device_limit, 0) AS max_devices
          FROM venue_device_limits
         WHERE venue_id = :v
         LIMIT 1
    ");
    $lq->execute([':v' => $venueId]);
    $maxDevices = (int)($lq->fetchColumn() ?: 0);

    $cq = $db->prepare("
        SELECT
          SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
          SUM(CASE WHEN status = 'blocked'  THEN 1 ELSE 0 END) AS blocked
          FROM devices
         WHERE venue_id = :v
    ");
    $cq->execute([':v' => $venueId]);
    $cnt = $cq->fetch() ?: [];

    return [
        'venue' => [
            'id'           => (int)$venue['id'],
            'code'         => (string)$venue['code'],
            'name'         => (string)($venue['name'] ?? ''),
            'domain'       => (string)($venue['domain'] ?? ''),
            'api_base_url' => (string)($venue['api_base_url'] ?? ''),
            'status'       => (string)($venue['status'] ?? 'active'),
        ],
        'limit' => [
            'max_devices' => $maxDevices,
            'active'      => (int)($cnt['active']   ?? 0),
            'inactive'    => (int)($cnt['inactive'] ?? 0),
            'blocked'     => (int)($cnt['blocked']  ?? 0),
        ],
    ];
}

try {
    ensure_senate_schema($db);

    $in        = json_input();
    $stableId  = require_string($in['stable_id'] ?? null, 'stable_id', 128);
    $code      = require_string($in['code']      ?? null, 'code', 32);
    $devName   = optional_string($in['device_name'] ?? null, 255) ?? 'Back-office';

    // 1) Kodu tap — used_at NULL, expired deyil.
    //    MySQL `sql_mode=NO_ZERO_DATE`-də `'0000-00-00 00:00:00'`
    //    literali parse-də fail verir (#1525), ona görə zero-date
    //    yoxlanışı PHP tərəfində aparılır.
    $cq = $db->prepare("
        SELECT id, device_id, venue_id, code, expires_at, used_at, created_at
          FROM device_activation_codes
         WHERE code = :c
           AND used_at IS NULL
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (deleted_at IS NULL)
         ORDER BY id DESC
         LIMIT 1
    ");
    try {
        $cq->execute([':c' => $code]);
    } catch (Throwable $_) {
        // `deleted_at` köhnə bazada olmaya bilər — onsuz cəhd et.
        $cq = $db->prepare("
            SELECT id, device_id, venue_id, code, expires_at, used_at, created_at
              FROM device_activation_codes
             WHERE code = :c
               AND used_at IS NULL
               AND (expires_at IS NULL OR expires_at > NOW())
             ORDER BY id DESC
             LIMIT 1
        ");
        $cq->execute([':c' => $code]);
    }
    $codeRow = $cq->fetch();
    if (!$codeRow) {
        // Diaqnostika — kod ümumiyyətlə cədvəldədirmi?  Nəyə görə
        // rədd olundu?  Generic mesaj yerinə dəqiq səbəbi göstər.
        $diag = $db->prepare("
            SELECT id, device_id, venue_id, used_at, expires_at, created_at
              FROM device_activation_codes
             WHERE code = :c
             ORDER BY id DESC
             LIMIT 1
        ");
        $diag->execute([':c' => $code]);
        $diagRow = $diag->fetch();
        if (!$diagRow) {
            bad_request('invalid_or_expired_code', [
                'detail' => "Kod \"$code\" heç bir cədvəldə tapılmadı. "
                          . 'Admin paneldə "Yeni kod" yaratdığınızdan və '
                          . 'düzgün yazdığınızdan əmin olun (boşluq yox, '
                          . 'böyük hərflərlə).',
            ]);
        }
        if (!empty($diagRow['used_at'])) {
            bad_request('invalid_or_expired_code', [
                'detail' => "Bu kod artıq istifadə olunub: {$diagRow['used_at']}. "
                          . 'Admindən YENİ kod istəyin.',
                'used_at' => $diagRow['used_at'],
            ]);
        }
        $exp = $diagRow['expires_at'] ?? null;
        if ($exp && $exp !== '0000-00-00 00:00:00' && strtotime($exp) < time()) {
            bad_request('invalid_or_expired_code', [
                'detail' => "Bu kodun vaxtı keçib: $exp. "
                          . 'Admindən YENİ kod istəyin.',
                'expires_at' => $exp,
            ]);
        }
        bad_request('invalid_or_expired_code', [
            'detail' => 'Kod cədvəldə mövcuddur, lakin yoxlanışdan keçmədi. '
                      . 'Admin ilə əlaqə saxlayın.',
            'diag' => $diagRow,
        ]);
    }

    // 2) venue_id çıxar:
    //    • code.venue_id set: admin venue üçün generate edib (yeni axın)
    //    • code.device_id set: legacy mobil/QR axını — device-dən venue tap
    $venueId = (int)($codeRow['venue_id'] ?? 0);
    $boundDeviceId = (int)($codeRow['device_id'] ?? 0);
    if ($venueId <= 0 && $boundDeviceId > 0) {
        $dq = $db->prepare("SELECT venue_id FROM devices WHERE id = :id LIMIT 1");
        $dq->execute([':id' => $boundDeviceId]);
        $venueId = (int)($dq->fetchColumn() ?: 0);
    }
    if ($venueId <= 0) {
        bad_request('code_not_bound_to_venue', [
            'detail' => 'Bu kod heç bir obyektə bağlı deyil. '
                      . 'Admin panelindən venue üçün yeni kod yaradın.',
        ]);
    }

    // 3) Cihaz limit-i yoxla.
    $summary    = ba_venue_payload($db, $venueId);
    $maxDevices = (int)$summary['limit']['max_devices'];
    $active     = (int)$summary['limit']['active'];
    if ($maxDevices > 0 && $active >= $maxDevices) {
        // Aktiv cihazlar artıq limit-də — yeni cihaz əlavə etmirik.
        // Mövcud stable_id-li cihaz aktivləşdirilsə də sayılır.
        $existsActiveQ = $db->prepare("
            SELECT id FROM devices
             WHERE stable_id = :s AND venue_id = :v AND status = 'active'
             LIMIT 1
        ");
        $existsActiveQ->execute([':s' => $stableId, ':v' => $venueId]);
        if (!$existsActiveQ->fetch()) {
            json_response([
                'ok'    => false,
                'error' => 'limit_reached',
            ] + $summary, 200);
        }
    }

    // 4) Cihazı tap / yarat (stable_id üzrə).
    $dq = $db->prepare("SELECT * FROM devices WHERE stable_id = :s LIMIT 1");
    $dq->execute([':s' => $stableId]);
    $dev = $dq->fetch();

    if (!$dev) {
        $ins = $db->prepare("
            INSERT INTO devices
              (venue_id, device_name, Divace_type, stable_id,
               status, login, created_at, updated_at)
            VALUES
              (:v, :n, 'desktop', :s,
               'active', 1, NOW(), NOW())
        ");
        $ins->execute([
            ':v' => $venueId,
            ':n' => $devName,
            ':s' => $stableId,
        ]);
        $deviceId = (int)$db->lastInsertId();
        if ($deviceId <= 0) {
            json_response([
                'ok'    => false,
                'error' => 'device_insert_failed',
                'detail' => 'Cihaz devices cədvəlinə əlavə oluna bilmədi.  '
                          . 'NOT NULL constraint / strict_mode yoxlayın.',
            ], 500);
        }
    } else {
        // Mövcud cihazsa: başqa venue-yə bağlıdırsa rədd et.
        $existingVenue = (int)($dev['venue_id'] ?? 0);
        if ($existingVenue > 0 && $existingVenue !== $venueId) {
            json_response([
                'ok'              => false,
                'error'           => 'device_linked_to_another_venue',
                'device_venue_id' => $existingVenue,
            ] + $summary, 409);
        }
        $deviceId = (int)$dev['id'];
        $upd = $db->prepare("
            UPDATE devices
               SET venue_id     = :v,
                   status       = 'active',
                   login        = 1,
                   Divace_type  = COALESCE(NULLIF(Divace_type, ''), 'desktop'),
                   activated_at = NOW(),
                   updated_at   = NOW()
             WHERE id = :id
        ");
        $upd->execute([':v' => $venueId, ':id' => $deviceId]);
    }

    // 5) Kodu möhürlə (used_at = NOW) + device_id-ni təyin et
    //    (audit izi üçün — admin sonradan kimə getdiyini görsün).
    $db->beginTransaction();
    try {
        $db->prepare("
            UPDATE device_activation_codes
               SET used_at  = NOW(),
                   device_id = :did
             WHERE id = :id
               AND used_at IS NULL
        ")->execute([':did' => $deviceId, ':id' => (int)$codeRow['id']]);

        // activated_at yazılmadısa (mövcud cihaz idi) əlavə yenilə.
        $db->prepare("
            UPDATE devices
               SET activated_at = COALESCE(activated_at, NOW()),
                   updated_at   = NOW()
             WHERE id = :id
        ")->execute([':id' => $deviceId]);
        $db->commit();
    } catch (Throwable $tx) {
        if ($db->inTransaction()) $db->rollBack();
        throw $tx;
    }

    audit_log($db, 'devices', $deviceId, 'backoffice_activate', [
        'code_id'   => (int)$codeRow['id'],
        'venue_id'  => $venueId,
        'stable_id' => $stableId,
    ]);

    $summary = ba_venue_payload($db, $venueId);
    json_response([
        'ok'          => true,
        'stage'       => 'redeemed',
        'allow_login' => true,
        'login'       => 1,
        'device_id'   => $deviceId,
        'code_id'     => (int)$codeRow['id'],
    ] + $summary);
} catch (Throwable $e) {
    if ($db instanceof PDO && $db->inTransaction()) $db->rollBack();
    api_log('backoffice_activate_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}
