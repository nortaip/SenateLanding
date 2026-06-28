<?php
// Data/MobilePoss/GetActivationCode.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php'; // burada $db (PDO) olmalıdır
if (!isset($db) || !$db instanceof PDO) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'db_not_initialized']);
  exit;
}

function json_input(): array {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

try {
  $in        = json_input();
  $venueCode = trim((string)($in['venue_code'] ?? ($_SERVER['HTTP_X_VENUE_CODE'] ?? '')));
  $stableId  = trim((string)($in['stable_id']  ?? ''));

  if ($venueCode === '' || $stableId === '') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'bad_request','need'=>['venue_code','stable_id']]);
    exit;
  }

  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // 1) Venue tap (code və ya domain ilə)
  $stmt = $db->prepare("SELECT id, code, domain FROM venues WHERE code = ? OR domain = ? LIMIT 1");
  $stmt->execute([$venueCode, $venueCode]);
  $venue = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$venue) {
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'unknown_venue_code']);
    exit;
  }
  $venueId     = (int)$venue['id'];
  $venueCodeDb = (string)$venue['code'];
  $venueDomain = trim((string)$venue['domain']);

  // 2) Cihazı tap
  $stmt = $db->prepare("SELECT * FROM devices WHERE stable_id = ? LIMIT 1");
  $stmt->execute([$stableId]);
  $device = $stmt->fetch(PDO::FETCH_ASSOC);

  // Cihaz eyni venue-də artıq aktivdirsə → ok
  if ($device && $device['status'] === 'active' && (int)$device['venue_id'] === $venueId) {
    echo json_encode([
      'ok'              => true,
      'already_active'  => true,
      'allow_login'     => true,
      'device_id'       => (int)$device['id'],
      'venue_id'        => $venueId,
      'venue_code'      => $venueCodeDb,
      'venue_domain'    => $venueDomain,
    ]);
    exit;
  }

  // Cihaz başqa venue-də bağlıdırsa → blokla
  if ($device && !empty($device['venue_id']) && (int)$device['venue_id'] !== $venueId) {
    http_response_code(409);
    echo json_encode([
      'ok'               => false,
      'error'            => 'device_linked_to_another_venue',
      'device_venue_id'  => (int)$device['venue_id'],
      'venue_id'         => $venueId,
      'venue_code'       => $venueCodeDb,
      'venue_domain'     => $venueDomain,
    ]);
    exit;
  }

  // 3) Limit yoxla (aktiv cihazlara görə)
  $maxQ = $db->prepare("
    SELECT 
      COALESCE(vdl.max_devices, vdl.device_limit, 0) AS max_devices
    FROM venues v
    LEFT JOIN venue_device_limits vdl ON vdl.venue_id = v.id
    WHERE v.id = ? LIMIT 1
  ");
  $maxQ->execute([$venueId]);
  $maxDevices = (int)$maxQ->fetchColumn();

  $cntQ = $db->prepare("SELECT COUNT(*) FROM devices WHERE venue_id = ? AND status = 'active'");
  $cntQ->execute([$venueId]);
  $activeCount = (int)$cntQ->fetchColumn();

  if ($maxDevices > 0 && $activeCount >= $maxDevices) {
    http_response_code(200);
    echo json_encode([
      'ok'            => false,
      'error'         => 'limit_reached',
      'active_count'  => $activeCount,
      'max_devices'   => $maxDevices,
      'venue_id'      => $venueId,
      'venue_code'    => $venueCodeDb,
      'venue_domain'  => $venueDomain,
    ]);
    exit;
  }

  // 4) Device yoxdursa yarat, varsa venue_id-ni bağla (active etmə!)
  if (!$device) {
    $ins = $db->prepare("
      INSERT INTO devices (venue_id, device_name, stable_id, imei, location_name, app_version, status, created_at)
      VALUES (?, NULL, ?, NULL, NULL, NULL, 'inactive', NOW())
    ");
    $ins->execute([$venueId, $stableId]);
    $deviceId = (int)$db->lastInsertId();
  } else {
    $deviceId = (int)$device['id'];
    if (empty($device['venue_id'])) {
      $upd = $db->prepare("UPDATE devices SET venue_id = ?, updated_at = NOW() WHERE id = ?");
      $upd->execute([$venueId, $deviceId]);
    }
  }

  // 5) İstifadə olunmamış kod varsa götür, yoxdursa yarat (24 saatlıq)
  $sel = $db->prepare("
    SELECT code FROM device_activation_codes
    WHERE device_id = ? AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY id DESC LIMIT 1
  ");
  $sel->execute([$deviceId]);
  $row = $sel->fetch(PDO::FETCH_ASSOC);

  $code = $row['code'] ?? null;
  if (!$code) {
    $code = strtoupper(substr(bin2hex(random_bytes(8)), 0, 6)); // 6 simvol
    $exp  = (new DateTime('+1 day'))->format('Y-m-d H:i:s');
    $insC = $db->prepare("
      INSERT INTO device_activation_codes (device_id, code, created_at, expires_at)
      VALUES (?, ?, NOW(), ?)
    ");
    $insC->execute([$deviceId, $code, $exp]);
  }

  echo json_encode([
    'ok'            => true,
    'code'          => $code,
    'device_id'     => $deviceId,
    'venue_id'      => $venueId,
    'venue_code'    => $venueCodeDb,
    'venue_domain'  => $venueDomain,
    'limit'         => ['active' => $activeCount, 'max' => $maxDevices],
  ]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>'server_error', 'detail'=>$e->getMessage()]);
}
