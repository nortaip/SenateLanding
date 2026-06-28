<?php
declare(strict_types=1);

ini_set('display_errors','1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

// MÖVCUD config.php-ya toxunmuruq — $db (PDO) oradan gəlir
require_once __DIR__ . '/config.php';
if (!isset($db) || !$db instanceof PDO) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'db_not_initialized']);
  exit;
}

function json_input(): array {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

try {
  $in          = json_input();
  $stableId    = trim($in['stable_id']    ?? '');
  $deviceName  = trim($in['device_name']  ?? '');
  $imei        = trim($in['imei']         ?? '');
  $appVersion  = trim($in['app_version']  ?? '');

  if ($stableId==='' || $deviceName==='') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'bad_request']);
    exit;
  }

  // cihaz var?
  $stmt = $db->prepare("SELECT * FROM devices WHERE stable_id=? LIMIT 1");
  $stmt->execute([$stableId]);
  $dev = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$dev) {
    // yenisini yaz (venue_id=NULL, status=inactive)
    $ins = $db->prepare("
      INSERT INTO devices (venue_id, device_name, stable_id, imei, app_version, status, created_at, updated_at)
      VALUES (NULL, ?, ?, ?, ?, 'inactive', NOW(), NOW())
    ");
    $ins->execute([$deviceName, $stableId, $imei ?: null, $appVersion ?: null]);
    $deviceId = (int)$db->lastInsertId();

    // bu cihaz üçün aktiv aktivasiya kodu varmı?
    $stmt = $db->prepare("
      SELECT code FROM device_activation_codes
      WHERE device_id=? AND used_at IS NULL
        AND (expires_at IS NULL OR expires_at>NOW())
      ORDER BY id DESC LIMIT 1
    ");
    $stmt->execute([$deviceId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $code = $row['code'] ?? null;
    if (!$code) {
      $code = strtoupper(substr(md5(uniqid('', true)), 0, 6));
      $ins2 = $db->prepare("
        INSERT INTO device_activation_codes (device_id, code, created_at)
        VALUES (?, ?, NOW())
      ");
      $ins2->execute([$deviceId, $code]);
    }

    echo json_encode([
      'ok'            => true,
      'allow_login'   => false,
      'stage'         => 'need_qr_and_activation',
      'device_id'     => $deviceId,
      'stable_id'     => $stableId,
      'activation_code'=> $code, // istəsən göstərmə, amma yaradılır
    ]);
    exit;
  }

  // cihaz var — aktivdirsə icazə ver, deyilse QR/aktivasiya gərəklidir
  $allow = ($dev['status'] === 'active');
  echo json_encode([
    'ok' => true,
    'allow_login' => $allow,
    'stage' => $allow ? 'ready' : 'need_qr_and_activation',
    'device_id' => (int)$dev['id'],
    'stable_id' => $stableId,
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
