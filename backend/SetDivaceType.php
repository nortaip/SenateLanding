<?php
// File: Data/MobilePoss/SetDivaceType.php
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

function out(array $arr, int $code=200): void {
  http_response_code($code);
  echo json_encode($arr, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}
function json_input(): array {
  $raw = file_get_contents('php://input') ?: '';
  $j = json_decode($raw, true);
  return is_array($j) ? $j : $_POST;
}
/** divace_type/device_type normalizə: */
function normalize_type(?string $t): ?string {
  if ($t === null) return null;
  $t = strtolower(trim($t));
  if ($t === '') return null;
  $kitchenAliases = ['kitchen','tablet','desktop','chef','metbex'];
  if (in_array($t, $kitchenAliases, true)) return 'kitchen';
  if ($t === 'mobile') return 'mobile';
  return null; // naməlum dəyər gəlibsə toxunmuruq
}

try {
  $in          = json_input();
  $stableId    = trim((string)($in['stable_id'] ?? ''));
  // Client həm "divace_type", həm də "device_type" göndərə bilər
  $inTypeRaw   = (string)($in['divace_type'] ?? ($in['device_type'] ?? ''));
  // station və ya alias kimi gələ bilər
  $inStation   = (string)($in['station'] ?? ($in['alias'] ?? ''));

  if ($stableId === '') out(['ok'=>false,'error'=>'stable_id_required'], 400);

  // Cihazı tap
  $stmt = $db->prepare("SELECT * FROM `devices` WHERE `stable_id`=? LIMIT 1");
  $stmt->execute([$stableId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$row) out(['ok'=>false,'error'=>'device_not_found'], 404);

  // UPDATE hissəsini yığ
  $set = [];
  $val = [];

  // 1) Tip normalizəsi (əgər açıq göndərilibsə)
  $normType = normalize_type($inTypeRaw);
  if ($normType !== null) {
    $set[] = "`Divace_type` = ?";
    $val[] = $normType; // 'kitchen' | 'mobile'
  }

  // 2) Station gəlmişsə (boş gəlibsə NULL), eyni vaxtda Divace_type AUTO
  $stationCame = array_key_exists('station', $in) || array_key_exists('alias', $in);
  if ($stationCame) {
    $st = trim($inStation);
    $set[] = "`station` = ?";
    $val[] = ($st === '' ? null : $st); // DB-də NULL və ya 'pizza'/'sushi'/'all'

    // Əgər tip açıq verilməyibsə, station-a görə avtomatik təyin et
    if ($normType === null) {
      $stLow = strtolower($st);
      if ($st === '') {
        // station təmizləndisə → mobile
        $set[] = "`Divace_type` = ?";
        $val[] = 'mobile';
      } else {
        // yalnız tanınan stansiyalar kitchen sayılır
        if (in_array($stLow, ['pizza','sushi','all'], true)) {
          $set[] = "`Divace_type` = ?";
          $val[] = 'kitchen';
        }
        // başqa dəyərdirsə Divace_type-i toxunma (mövcud qalır)
      }
    }
  }

  if (empty($set)) {
    // Dəyişiklik yox — mövcud vəziyyəti qaytar
    $divace_type = strtolower((string)($row['Divace_type'] ?? 'mobile'));
    $station     = $row['station'] ?? null;
    out([
      'ok'      => true,
      'updated' => 0,
      'device'  => [
        'id'           => (int)$row['id'],
        'venue_id'     => isset($row['venue_id']) ? (int)$row['venue_id'] : null,
        'stable_id'    => $row['stable_id'],
        'device_name'  => $row['device_name'] ?? '',      // marka/model — bu endpoint-də dəyişmirik
        'divace_type'  => $divace_type,
        'device_type'  => $divace_type,                   // alias
        'station'      => $station,
        'status'       => strtolower((string)($row['status'] ?? 'inactive')),
        'app_version'  => $row['app_version'] ?? null,
        'version'      => $row['app_version'] ?? null,    // alias
        'imei'         => $row['imei'] ?? null,
        'created_at'   => $row['created_at'] ?? null,
        'updated_at'   => $row['updated_at'] ?? null,
      ],
    ]);
  }

  // UPDATE et
  $sql = "UPDATE `devices` SET ".implode(', ', $set).", `updated_at`=NOW() WHERE `stable_id`=?";
  $val[] = $stableId;
  $upd = $db->prepare($sql);
  $upd->execute($val);

  // Yenidən oxu
  $stmt = $db->prepare("SELECT * FROM `devices` WHERE `stable_id`=? LIMIT 1");
  $stmt->execute([$stableId]);
  $row2 = $stmt->fetch(PDO::FETCH_ASSOC);

  $divace_type = strtolower((string)($row2['Divace_type'] ?? 'mobile'));
  $station     = $row2['station'] ?? null;

  out([
    'ok'      => true,
    'updated' => count($set),
    'device'  => [
      'id'           => (int)$row2['id'],
      'venue_id'     => isset($row2['venue_id']) ? (int)$row2['venue_id'] : null,
      'stable_id'    => $row2['stable_id'],
      'device_name'  => $row2['device_name'] ?? '',       // marka/model
      'divace_type'  => $divace_type,
      'device_type'  => $divace_type,                     // alias
      'station'      => $station,                         // 'pizza' | 'sushi' | 'all' | NULL
      'status'       => strtolower((string)($row2['status'] ?? 'inactive')),
      'app_version'  => $row2['app_version'] ?? null,
      'version'      => $row2['app_version'] ?? null,     // alias
      'imei'         => $row2['imei'] ?? null,
      'created_at'   => $row2['created_at'] ?? null,
      'updated_at'   => $row2['updated_at'] ?? null,
    ],
  ]);

} catch (Throwable $e) {
  out(['ok'=>false,'error'=>'server_error','message'=>$e->getMessage()], 500);
}
