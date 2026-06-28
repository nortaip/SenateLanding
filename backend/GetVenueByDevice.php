<?php
// Data/MobilePoss/GetVenueByDevice.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php'; // $db: PDO

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
  $in = json_input();
  $stableId = $in['stable_id'] ?? null;

  if (!$stableId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'stable_id_required']);
    exit;
  }

  // 1) devices məlumatı + venue_id
  $q1 = $db->prepare("
    SELECT 
      id,
      venue_id,
      device_name,
      Divace_type,
      station,
      login,
      stable_id,
      imei,
      app_version,
      status,
      created_at,
      updated_at,
      activated_at,
      blocked_at,
      block_reason,
      last_block_reason,
      last_block_source
    FROM devices
    WHERE stable_id = :sid
    LIMIT 1
  ");
  $q1->execute([':sid' => $stableId]);
  $dev = $q1->fetch(PDO::FETCH_ASSOC);

  if (!$dev || empty($dev['venue_id'])) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'device_or_venue_missing']);
    exit;
  }

  $venueId = (int)$dev['venue_id'];

  // 2) venues məlumatı
  $q2 = $db->prepare("
    SELECT id, code, domain, api_base_url
    FROM posssistemadmin.venues
    WHERE id = :vid
    ORDER BY id ASC
    LIMIT 1
  ");
  $q2->execute([':vid' => $venueId]);
  $venue = $q2->fetch(PDO::FETCH_ASSOC);

  if (!$venue) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'venue_not_found']);
    exit;
  }

  echo json_encode([
    'ok' => true,
    'venue' => [
      'id'            => (int)$venue['id'],
      'code'          => $venue['code'],
      'venue_domain'  => $venue['domain'] ?? '',
      'api_base_url'  => $venue['api_base_url'] ?? '',
      'venue_id'          => isset($dev['venue_id']) ? (int)$dev['venue_id'] : 0,
      'device_name'       => $dev['device_name'] ?? '',
      'Divace_type'       => $dev['Divace_type'] ?? '',
      'station'           => $dev['station'] ?? '',
      'login'             => $dev['login'] ?? '',
      'stable_id'         => $dev['stable_id'] ?? '',
      'imei'              => $dev['imei'] ?? '',
      'app_version'       => $dev['app_version'] ?? '',
      'status'            => $dev['status'] ?? '',
      'created_at'        => $dev['created_at'] ?? null,
      'updated_at'        => $dev['updated_at'] ?? null,
      'activated_at'      => $dev['activated_at'] ?? null,
      'blocked_at'        => $dev['blocked_at'] ?? null,
      'block_reason'      => $dev['block_reason'] ?? '',
      'last_block_reason' => $dev['last_block_reason'] ?? '',
      'last_block_source' => $dev['last_block_source'] ?? '',
    ]
  ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => 'server_error',
    'detail' => $e->getMessage()
  ], JSON_UNESCAPED_UNICODE);
}