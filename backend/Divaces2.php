<?php
// File: Data/MobilePoss/Divaces.php
declare(strict_types=1);

ini_set('display_errors','1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config.php'; // $db = new PDO(...)

if (!isset($db) || !$db instanceof PDO) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'db_not_initialized'], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}

// Backend versiyasını burada idarə et
const BACKEND_VERSION = '2025.10.10';

function out(array $arr, int $code = 200): void {
  // hər cavaba avtomatik version və server_time əlavə edirik
  if (!array_key_exists('version', $arr)) {
    $arr['version'] = BACKEND_VERSION;
  }
  if (!array_key_exists('server_time', $arr)) {
    $arr['server_time'] = date('c');
  }
  http_response_code($code);
  echo json_encode($arr, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}

function json_input(): array {
  $raw = file_get_contents('php://input') ?: '';
  $j = json_decode($raw, true);
  return is_array($j) ? $j : $_POST;
}

/** Aktiv aktivasiya kodu varsa qaytar, yoxdursa yarat və qaytar. */
function get_or_create_activation_code(PDO $db, int $deviceId): string {
  $stmt = $db->prepare("
    SELECT code
    FROM device_activation_codes
    WHERE device_id = ? AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY id DESC
    LIMIT 1
  ");
  $stmt->execute([$deviceId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!empty($row['code'])) {
    return (string)$row['code'];
  }

  // 6 simvolluq kod (A–Z, 2–9; oxşar simvollardan qaçırıq)
  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $code = '';
  for ($i=0; $i<6; $i++) {
    $code .= $alphabet[random_int(0, strlen($alphabet)-1)];
  }

  $ins = $db->prepare("
    INSERT INTO device_activation_codes (device_id, code, created_at)
    VALUES (?, ?, NOW())
  ");
  $ins->execute([$deviceId, $code]);

  return $code;
}

try {
  $in           = json_input();
  $stable_id    = trim((string)($in['stable_id']    ?? ''));
  $device_name  = trim((string)($in['device_name']  ?? '')); // marka/model
  $app_version  = trim((string)($in['app_version']  ?? ''));
  $imei         = trim((string)($in['imei']         ?? ''));
  // Gəlməsi halında görməzlikdən gəlirik (station bu faylda dəyişilmir):
  $station_in   = trim((string)($in['station']      ?? ($in['alias'] ?? '')));

  if ($stable_id === '') {
    out(['ok'=>false,'error'=>'stable_id_required'], 400);
  }

  // 1) Cihazı tap (explicit sütunlar, o cümlədən login)  // <-- NEW
  $stmt = $db->prepare("
    SELECT
      `id`, `venue_id`, `device_name`, `Divace_type`, `station`,
      `login`,                                      /* 0/1 */
      `stable_id`, `imei`, `app_version`, `status`,
      `created_at`, `updated_at`, `activated_at`,
      `blocked_at`, `block_reason`, `last_block_reason`, `last_block_source`
    FROM `devices`
    WHERE `stable_id`=? 
    LIMIT 1
  ");
  $stmt->execute([$stable_id]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$row) {
    // 2) Yoxdursa — yarad (default: Divace_type=mobile, station=NULL, status=inactive, login=0)  // <-- NEW login
    $ins = $db->prepare("
      INSERT INTO `devices`
        (`venue_id`, `device_name`, `Divace_type`, `station`, `stable_id`,
         `imei`, `app_version`, `status`, `login`,
         `created_at`, `updated_at`)
      VALUES (
         NULL, ?, 'mobile', NULL, ?, 
         ?, ?, 'inactive', 0,
         NOW(), NOW()
      )
    ");
    $ins->execute([
      $device_name,
      $stable_id,
      ($imei === '' ? null : $imei),
      ($app_version === '' ? null : $app_version),
    ]);

    $deviceId = (int)$db->lastInsertId();
    $code = get_or_create_activation_code($db, $deviceId);

    out([
      'ok'              => true,
      'allow_login'     => false,
      'stage'           => 'need_qr_and_activation',
      'device_id'       => $deviceId,
      'stable_id'       => $stable_id,
      'activation_code' => $code,
      'device' => [
        'id'                => $deviceId,
        'venue_id'          => null,
        'stable_id'         => $stable_id,
        'device_name'       => $device_name,   // marka/model
        'divace_type'       => 'mobile',
        'device_type'       => 'mobile',
        'station'           => null,           // Settings-də veriləcək
        'login'             => 0,              // <-- NEW
        'imei'              => ($imei === '' ? null : $imei),
        'app_version'       => ($app_version === '' ? null : $app_version),
        'status'            => 'inactive',
        'created_at'        => null,
        'updated_at'        => null,
        'activated_at'      => null,
        'blocked_at'        => null,
        'block_reason'      => null,
        'last_block_reason' => null,
        'last_block_source' => null,
      ],
    ]);
  }

  // 3) Var — son məlumatları yenilə (Divace_type/station burada dəyişilmir!)
  $upd = $db->prepare("
    UPDATE `devices`
    SET `device_name` = COALESCE(NULLIF(?, ''), `device_name`),
        `app_version` = ?,
        `imei`        = ?,
        `updated_at`  = NOW()
    WHERE `stable_id` = ?
  ");
  $upd->execute([
    $device_name,
    ($app_version === '' ? null : $app_version),
    ($imei === '' ? null : $imei),
    $stable_id
  ]);

  // Yenidən oxu (login də daxil olmaqla)  // <-- NEW
  $stmt = $db->prepare("
    SELECT
      `id`, `venue_id`, `device_name`, `Divace_type`, `station`,
      `login`,
      `stable_id`, `imei`, `app_version`, `status`,
      `created_at`, `updated_at`, `activated_at`,
      `blocked_at`, `block_reason`, `last_block_reason`, `last_block_source`
    FROM `devices`
    WHERE `stable_id`=? 
    LIMIT 1
  ");
  $stmt->execute([$stable_id]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  // 4) Status məntiqi
  $status      = strtolower((string)($row['status'] ?? 'inactive'));
  $isBlocked   = ($status === 'blocked') || !empty($row['blocked_at']);

  // login flag DB-dən gəlir: 1 = icazə var, 0 = icazə yoxdur  // <-- NEW
  $loginFlag   = (int)($row['login'] ?? 0) === 1;

  // allow_login: həm bloklanmamış olmalı, həm status active olmalı,
  // həm də login=1 olmalı  // <-- NEW
  $allow_login = (!$isBlocked && $status === 'active' && $loginFlag);

  $divace_type = strtolower((string)($row['Divace_type'] ?? 'mobile'));
  $station     = $row['station'] ?? null;

  // 5) İnaktivdirsə → aktivasiya lazımdır
  if (!$allow_login && !$isBlocked) {
    // burda status active olmaya bilər və ya login=0 ola bilər
    $code = get_or_create_activation_code($db, (int)$row['id']);
    out([
      'ok'              => true,
      'allow_login'     => false,
      'stage'           => 'need_qr_and_activation',
      'device_id'       => (int)$row['id'],
      'stable_id'       => $stable_id,
      'activation_code' => $code,
      'device' => [
        'id'                => (int)$row['id'],
        'venue_id'          => isset($row['venue_id']) ? (int)$row['venue_id'] : null,
        'stable_id'         => $row['stable_id'],
        'device_name'       => $row['device_name'] ?? '',
        'divace_type'       => $divace_type,
        'device_type'       => $divace_type,
        'station'           => $station,   // Settings-dəki “Cihaz adı” (pizza/sushi/all)
        'login'             => (int)($row['login'] ?? 0), // <-- NEW
        'imei'              => $row['imei'] ?? null,
        'app_version'       => $row['app_version'] ?? null,
        'created_at'        => $row['created_at'] ?? null,
        'updated_at'        => $row['updated_at'] ?? null,
        'activated_at'      => $row['activated_at'] ?? null,
        'blocked_at'        => $row['blocked_at'] ?? null,
        'block_reason'      => $row['block_reason'] ?? null,
        'last_block_reason' => $row['last_block_reason'] ?? null,
        'last_block_source' => $row['last_block_source'] ?? null,
        'status'            => $status,
      ],
    ]);
  }

  // 6) Bloklanıbsa
  if ($isBlocked) {
    out([
      'ok'           => true,
      'allow_login'  => false,
      'stage'        => 'blocked',
      'status'       => 'blocked',
      'device' => [
        'id'                => (int)$row['id'],
        'stable_id'         => $row['stable_id'],
        'divace_type'       => $divace_type,
        'device_type'       => $divace_type,
        'station'           => $station,
        'login'             => (int)($row['login'] ?? 0), // <-- NEW
        'blocked_at'        => $row['blocked_at'] ?? null,
        'block_reason'      => $row['block_reason'] ?? null,
        'last_block_reason' => $row['last_block_reason'] ?? null,
        'last_block_source' => $row['last_block_source'] ?? null,
      ],
    ]);
  }

  // 7) Aktivdirsə — hazır (ready)
  out([
    'ok'           => true,
    'allow_login'  => $allow_login,
    'stage'        => 'ready',
    'status'       => 'active',
    'device' => [
      'id'                => (int)$row['id'],
      'venue_id'          => isset($row['venue_id']) ? (int)$row['venue_id'] : null,
      'stable_id'         => $row['stable_id'],
      'device_name'       => $row['device_name'] ?? '',
      'divace_type'       => $divace_type,
      'device_type'       => $divace_type,
      'station'           => $station,
      'login'             => (int)($row['login'] ?? 0), // <-- NEW
      'imei'              => $row['imei'] ?? null,
      'app_version'       => $row['app_version'] ?? null,
      'created_at'        => $row['created_at'] ?? null,
      'updated_at'        => $row['updated_at'] ?? null,
      'activated_at'      => $row['activated_at'] ?? null,
      'blocked_at'        => $row['blocked_at'] ?? null,
      'block_reason'      => $row['block_reason'] ?? null,
      'last_block_reason' => $row['last_block_reason'] ?? null,
      'last_block_source' => $row['last_block_source'] ?? null,
    ],
  ]);

} catch (Throwable $e) {
  out(['ok'=>false,'error'=>'server_error','message'=>$e->getMessage()], 500);
}
