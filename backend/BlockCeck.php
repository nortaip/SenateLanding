<?php
declare(strict_types=1);

ini_set('display_errors','1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

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
  if (!is_array($data) || empty($data)) {
    $data = $_POST; // form-urlencoded dəstəyi
  }
  return is_array($data) ? $data : [];
}

try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'error'=>'method_not_allowed']);
    exit;
  }

  $in       = json_input();
  $deviceId = isset($in['device_id']) ? (int)$in['device_id'] : null;
  $stableId = isset($in['stable_id']) ? trim((string)$in['stable_id']) : '';

  if (empty($deviceId) && $stableId === '') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'either_device_id_or_stable_id_required']);
    exit;
  }

  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // Cihazı tap
  if (!empty($deviceId)) {
    $stmt = $db->prepare("SELECT id, stable_id, status, venue_id, device_name, updated_at, blocked_at
                          FROM devices WHERE id = ? LIMIT 1");
    $stmt->execute([$deviceId]);
  } else {
    $stmt = $db->prepare("SELECT id, stable_id, status, venue_id, device_name, updated_at, blocked_at
                          FROM devices WHERE stable_id = ? LIMIT 1");
    $stmt->execute([$stableId]);
  }

  $dev = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$dev) {
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'device_not_found']);
    exit;
  }

  // Status şərhi
  $status   = strtolower((string)($dev['status'] ?? ''));
  $blocked  = ($status === 'blocked' || $status === 'ban' || $status === 'banned');

  // App tərəfi üçün uyğun allow_login:
  //  - blocked → "block" (string)
  //  - active/approved/ready → true
  //  - digərləri → false
  $loginTrueStatuses = ['active','approved','ready','allowed'];
  if ($blocked) {
    $allowLogin = 'block'; // SplashScreen-də toLowerCase() == 'block' yoxlanır
  } elseif (in_array($status, $loginTrueStatuses, true)) {
    $allowLogin = true;
  } else {
    $allowLogin = false;
  }

  echo json_encode([
    'ok'          => true,
    'device_id'   => (int)$dev['id'],
    'stable_id'   => $dev['stable_id'] ?: null,
    'status'      => $status,
    'blocked'     => $blocked,
    'allow_login' => $allowLogin,
    'venue_id'    => isset($dev['venue_id']) ? (int)$dev['venue_id'] : null,
    'device_name' => $dev['device_name'] ?? null,
    'updated_at'  => $dev['updated_at'] ?? null,
    'blocked_at'  => $dev['blocked_at'] ?? null,
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
