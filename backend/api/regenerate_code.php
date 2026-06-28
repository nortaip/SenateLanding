<?php
// Data/MobilePoss/api/regenerate_code.php
//
// Admin endpoint — verilmiş cihaz üçün hələ istifadə olunmamış
// kodları "expired" işarələyib YENİ 6-simvolluq kod yaradır.  Back-
// office-də "Yenidən QR yarat" düyməsindən çağrılır.  Kod 24 saat
// etibarlıdır.
//
// POST /api/regenerate_code.php
// Body: {"device_id": 123, "ttl_hours": 24}
// Cavab: {ok: true, device_id, code, expires_at}

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    method_not_allowed(['POST']);
}

try {
    $in = json_input();
    $deviceId = require_int($in['device_id'] ?? null, 'device_id');

    $ttlHours = isset($in['ttl_hours']) && (int)$in['ttl_hours'] > 0
        ? (int)$in['ttl_hours']
        : 24;
    if ($ttlHours > 24 * 30) $ttlHours = 24 * 30;

    // Cihazın varlığını yoxla
    $devChk = $db->prepare("
        SELECT id, status FROM devices
         WHERE id = :id AND deleted_at IS NULL
         LIMIT 1
    ");
    $devChk->execute([':id' => $deviceId]);
    $dev = $devChk->fetch();
    if (!$dev) {
        not_found('device_not_found');
    }

    // Köhnə pending kodları söndür (vaxtı bitsin) — istifadəçi yeni
    // kod skanlasın.
    $expire = $db->prepare("
        UPDATE device_activation_codes
           SET expires_at = NOW()
         WHERE device_id = :device_id
           AND deleted_at IS NULL
           AND used_at    IS NULL
           AND (expires_at IS NULL OR expires_at > NOW())
    ");
    $expire->execute([':device_id' => $deviceId]);

    // 6 simvolluq kod (A–Z, 2–9; oxşar simvollardan qaçırıq).
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < 6; $i++) {
        $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    $expiresAt = (new DateTime())
        ->add(new DateInterval("PT{$ttlHours}H"))
        ->format('Y-m-d H:i:s');

    $ins = $db->prepare("
        INSERT INTO device_activation_codes
            (device_id, code, created_at, expires_at)
        VALUES (:device_id, :code, NOW(), :expires_at)
    ");
    $ins->execute([
        ':device_id' => $deviceId,
        ':code'      => $code,
        ':expires_at' => $expiresAt,
    ]);
    $newId = (int)$db->lastInsertId();

    audit_log($db, 'device_activation_codes', $newId, 'regenerate', [
        'device_id' => $deviceId,
        'ttl_hours' => $ttlHours,
    ]);

    json_response([
        'ok'         => true,
        'code_id'    => $newId,
        'device_id'  => $deviceId,
        'code'       => $code,
        'expires_at' => $expiresAt,
        'ttl_hours'  => $ttlHours,
    ]);
} catch (Throwable $e) {
    json_response([
        'ok' => false,
        'error' => 'server_error',
        'message' => $e->getMessage(),
    ], 500);
}
