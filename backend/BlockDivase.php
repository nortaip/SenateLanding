<?php
declare(strict_types=1);

ini_set('display_errors','1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
// CORS lazım olsa aç:
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once __DIR__ . '/config.php';
if (!isset($db) || !$db instanceof PDO) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'db_not_initialized']);
  exit;
}

function json_input(): array {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  // application/x-www-form-urlencoded dəstəyi (lazım ola bilər)
  if (!is_array($data) || empty($data)) {
    $data = $_POST;
  }
  return is_array($data) ? $data : [];
}

try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'error'=>'method_not_allowed']);
    exit;
  }

  $in          = json_input();
  $deviceId    = isset($in['device_id']) ? (int)$in['device_id'] : null;
  $stableId    = isset($in['stable_id']) ? trim((string)$in['stable_id']) : '';
  $reason      = isset($in['reason']) ? trim((string)$in['reason']) : '';
  $source      = isset($in['source']) ? trim((string)$in['source']) : 'pin_policy';
  $deviceName  = isset($in['device_name']) ? trim((string)$in['device_name']) : '';
  $imei        = isset($in['imei']) ? trim((string)$in['imei']) : '';
  $appVersion  = isset($in['app_version']) ? trim((string)$in['app_version']) : '';

  if (empty($deviceId) && $stableId === '') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'either_device_id_or_stable_id_required']);
    exit;
  }

  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $db->beginTransaction();

  // Mövcud cihazı tap
  $dev = null;
  if (!empty($deviceId)) {
    $stmt = $db->prepare("SELECT * FROM devices WHERE id = ? LIMIT 1");
    $stmt->execute([$deviceId]);
    $dev = $stmt->fetch(PDO::FETCH_ASSOC);
  } elseif ($stableId !== '') {
    $stmt = $db->prepare("SELECT * FROM devices WHERE stable_id = ? LIMIT 1");
    $stmt->execute([$stableId]);
    $dev = $stmt->fetch(PDO::FETCH_ASSOC);
  }

  $now = date('Y-m-d H:i:s');

  if ($dev) {
    // Mövcud cihazı BLOCK et
    $id = (int)$dev['id'];

    // Bu sahələr cədvəldə yoxdursa, SET-dən çıxara bilərsən:
    $sql = "
      UPDATE devices
         SET status = 'blocked',
             updated_at = :updated_at,
             blocked_at = :blocked_at,
             last_block_reason = :reason,
             last_block_source = :source
       WHERE id = :id
    ";
    $upd = $db->prepare($sql);
    $upd->execute([
      ':updated_at' => $now,
      ':blocked_at' => $now,
      ':reason'     => ($reason !== '' ? $reason : null),
      ':source'     => $source,
      ':id'         => $id,
    ]);

    $deviceId = $id;
    if ($stableId === '' && !empty($dev['stable_id'])) {
      $stableId = (string)$dev['stable_id'];
    }
  } else {
    // Cihaz tapılmadı — stable_id varsa yeni sətir açıb blok vəziyyətində saxla
    if ($stableId === '') {
      // device_id verilib, amma tapılmadı (uyğunsuz id)
      $db->rollBack();
      http_response_code(404);
      echo json_encode(['ok'=>false,'error'=>'device_not_found']);
      exit;
    }

    $sql = "
      INSERT INTO devices (venue_id, device_name, stable_id, imei, app_version, status, created_at, updated_at, blocked_at, last_block_reason, last_block_source)
      VALUES (NULL, :device_name, :stable_id, :imei, :app_version, 'blocked', :created_at, :updated_at, :blocked_at, :reason, :source)
    ";
    $ins = $db->prepare($sql);
    $ins->execute([
      ':device_name' => $deviceName !== '' ? $deviceName : null,
      ':stable_id'   => $stableId,
      ':imei'        => $imei !== '' ? $imei : null,
      ':app_version' => $appVersion !== '' ? $appVersion : null,
      ':created_at'  => $now,
      ':updated_at'  => $now,
      ':blocked_at'  => $now,
      ':reason'      => ($reason !== '' ? $reason : null),
      ':source'      => $source,
    ]);

    $deviceId = (int)$db->lastInsertId();
  }

  // Opsional jurnal (cədvəl yoxdursa, xətanı uduruq)
  try {
    $log = $db->prepare("
      INSERT INTO device_block_events (device_id, stable_id, reason, source, created_at)
      VALUES (:device_id, :stable_id, :reason, :source, :created_at)
    ");
    $log->execute([
      ':device_id' => $deviceId,
      ':stable_id' => ($stableId !== '' ? $stableId : null),
      ':reason'    => ($reason !== '' ? $reason : null),
      ':source'    => $source,
      ':created_at'=> $now,
    ]);
  } catch (Throwable $e) {
    // jurnal cədvəli yoxdursa problem deyil
  }

  $db->commit();

  echo json_encode([
    'ok'           => true,
    'status'       => 'blocked',
    'allow_login'  => false,
    'device_id'    => (int)$deviceId,
    'stable_id'    => $stableId !== '' ? $stableId : null,
    'reason'       => $reason !== '' ? $reason : null,
  ]);
} catch (Throwable $e) {
  if ($db->inTransaction()) {
    $db->rollBack();
  }
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
