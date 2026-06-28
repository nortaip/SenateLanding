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

function json_input(): array {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

try {
  $in        = json_input();
  $stableId  = trim($in['stable_id']  ?? '');
  $code      = trim($in['code']       ?? '');
  $venueCodeIn = trim((string)($in['venue_code'] ?? ''));

  if ($stableId==='' || $code==='') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'bad_request']);
    exit;
  }

  // cihaz + venue
  $stmt = $db->prepare("SELECT * FROM devices WHERE stable_id=? LIMIT 1");
  $stmt->execute([$stableId]);
  $dev = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$dev) {
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'device_not_found']);
    exit;
  }

  // Cihaz hələ venue-yə bağlı deyil (Divaces2.php default `venue_id=NULL`
  // qoyur).  Aktivasiya kodu globally lookup edib, kodun bağlı olduğu
  // venue-ni bu cihaza yapışdırırıq.  3 mənbədən venue tapırıq:
  //   1) payload-dakı venue_code (admin manual göndərirsə)
  //   2) bu kod yazılmış cihazın venue_id-i
  //   3) yox → device_not_bound_to_venue
  if (!$dev['venue_id']) {
    $resolvedVenueId = null;

    if ($venueCodeIn !== '') {
      $vq = $db->prepare("SELECT id FROM venues WHERE code=? OR domain=? LIMIT 1");
      $vq->execute([$venueCodeIn, $venueCodeIn]);
      $vrow = $vq->fetch(PDO::FETCH_ASSOC);
      if ($vrow) {
        $resolvedVenueId = (int)$vrow['id'];
      }
    }

    if (!$resolvedVenueId) {
      $cq = $db->prepare("
        SELECT d2.venue_id
          FROM device_activation_codes ac
          JOIN devices d2 ON d2.id = ac.device_id
         WHERE ac.code = ?
           AND ac.used_at IS NULL
           AND (ac.expires_at IS NULL OR ac.expires_at > NOW())
           AND d2.venue_id IS NOT NULL
      ORDER BY ac.id DESC
         LIMIT 1
      ");
      $cq->execute([$code]);
      $cv = $cq->fetchColumn();
      if ($cv) {
        $resolvedVenueId = (int)$cv;
      }
    }

    if (!$resolvedVenueId) {
      http_response_code(400);
      echo json_encode([
        'ok' => false,
        'error' => 'device_not_bound_to_venue',
        'detail' => 'Kod heç bir venue-yə bağlanmayıb. Əvvəlcə obyekt QR-i ilə cihazı qeydiyyatdan keçirin.'
      ]);
      exit;
    }

    // Cihazı bu venue-yə bağla
    $upd = $db->prepare("UPDATE devices SET venue_id=?, updated_at=NOW() WHERE id=?");
    $upd->execute([$resolvedVenueId, (int)$dev['id']]);
    $dev['venue_id'] = $resolvedVenueId;
  }

  $venueId = (int)$dev['venue_id'];

  // Limit yoxlanışı — yalnız `venue_device_limits` cədvəlində bu venue
  // üçün açıq limit qoyulubsa tətbiq olunur.  GetActivationCode.php
  // ilə eyni semantika: max_devices > 0 olanda işə düşür.
  $stmt = $db->prepare("
    SELECT COALESCE(max_devices, device_limit, 0) AS max_devices
      FROM venue_device_limits
     WHERE venue_id = ?
     LIMIT 1
  ");
  $stmt->execute([$venueId]);
  $max = (int)($stmt->fetchColumn() ?: 0);

  if ($max > 0) {
    $stmt = $db->prepare("SELECT COUNT(*) FROM devices WHERE venue_id=? AND status='active'");
    $stmt->execute([$venueId]);
    $activeCount = (int)$stmt->fetchColumn();
    if ($activeCount >= $max) {
      http_response_code(403);
      echo json_encode([
        'ok' => false,
        'error' => 'limit_reached',
        'active_count' => $activeCount,
        'max_devices' => $max,
      ]);
      exit;
    }
  }

  // kod
  $stmt = $db->prepare("
    SELECT * FROM device_activation_codes
    WHERE device_id=? AND code=? AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at>NOW())
    ORDER BY id DESC LIMIT 1
  ");
  $stmt->execute([(int)$dev['id'], $code]);
  $ac = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$ac) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'invalid_or_expired_code']);
    exit;
  }

  // aktivləşdir — kod istifadə edilmiş kimi işarələnir, cihaz active
  // statusuna və `login=1` (admin panel + POS girişi açılır) keçir.
  $db->beginTransaction();
  $db->prepare("UPDATE device_activation_codes SET used_at=NOW() WHERE id=?")
     ->execute([(int)$ac['id']]);
  $db->prepare("
    UPDATE devices
       SET status='active',
           login=1,
           activated_at=NOW(),
           updated_at=NOW()
     WHERE id=?
  ")->execute([(int)$dev['id']]);
  $db->commit();

  echo json_encode(['ok'=>true,'allow_login'=>true,'login'=>1]);
} catch (Throwable $e) {
  if ($db instanceof PDO && $db->inTransaction()) $db->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error','detail'=>$e->getMessage()]);
}
