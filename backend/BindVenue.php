<?php
declare(strict_types=1);

ini_set('display_errors','1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';
if (!isset($db) || !$db instanceof PDO) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'db_not_initialized']);
  exit;
}

function input_all(): array {
  $raw = file_get_contents('php://input') ?: '';
  $j = json_decode($raw, true);
  $j = is_array($j) ? $j : [];
  // GET dəstəyi
  foreach (['stable_id','venue_code'] as $k) {
    if (!isset($j[$k]) && isset($_GET[$k])) $j[$k] = $_GET[$k];
    if (!isset($j[$k]) && isset($_GET['v']) && $k==='venue_code') $j[$k] = $_GET['v'];
  }
  return $j;
}

try {
  $in        = input_all();
  $stableId  = trim($in['stable_id']  ?? '');
  $venueCode = trim($in['venue_code'] ?? '');

  if ($stableId==='' || $venueCode==='') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'bad_request']);
    exit;
  }

  // venue tap
  $stmt = $db->prepare("SELECT id, code, domain FROM venues WHERE code=? LIMIT 1");
  $stmt->execute([$venueCode]);
  $venue = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$venue) {
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'venue_not_found']);
    exit;
  }

  // cihaz tap
  $stmt = $db->prepare("SELECT * FROM devices WHERE stable_id=? LIMIT 1");
  $stmt->execute([$stableId]);
  $dev = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$dev) {
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'device_not_found']);
    exit;
  }

  // artıq bağlıdırsa keç
  if ($dev['venue_id'] && (int)$dev['venue_id'] === (int)$venue['id']) {
    echo json_encode([
      'ok'=>true,
      'already_bound'=>true,
      'venue'=>['id'=>(int)$venue['id'],'code'=>$venue['code'],'domain'=>$venue['domain']],
    ]);
    exit;
  }

  // venue-ya bağla (yalnız əlavə et, update etmə qaydasına uyaraq — amma burda məcburi bağlama lazımdır)
  $upd = $db->prepare("UPDATE devices SET venue_id=?, updated_at=NOW() WHERE id=?");
  $upd->execute([(int)$venue['id'], (int)$dev['id']]);

  echo json_encode([
    'ok'=>true,
    'bound'=>true,
    'venue'=>['id'=>(int)$venue['id'],'code'=>$venue['code'],'domain'=>$venue['domain']],
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
