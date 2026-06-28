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

  // 1) devices -> venue_id (DIQQƏT: activation_code seçmirik!)
  $q1 = $db->prepare("SELECT venue_id FROM devices WHERE stable_id = :sid LIMIT 1");
  $q1->execute([':sid' => $stableId]);
  $dev = $q1->fetch(PDO::FETCH_ASSOC);

  if (!$dev || empty($dev['venue_id'])) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'device_or_venue_missing']);
    exit;
  }

  $venueId = (int)$dev['venue_id'];

  // 2) venues məlumatı (şema adı lazımdırsa əlavə edin)
  $q2 = $db->prepare("
    SELECT id, name, domain, api_base_url
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
      'name'          => $venue['name'],
      'venue_domain'  => $venue['domain'] ?? '',       // məsələn: senate, extra, ...
      'api_base_url'  => $venue['api_base_url'] ?? '', // varsa
    ]
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'server_error', 'detail' => $e->getMessage()]);
}
