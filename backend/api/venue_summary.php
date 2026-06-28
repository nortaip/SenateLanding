<?php
// Venue identity + device-limit + restoran siyahısı bir cavabda.
// Back-office activations və devices səhifələri açılışda bunu çəkir
// ki, "X / Y aktiv cihaz" badge-i və QR-ə yerləşdiriləcək obyekt
// məlumatı bir round-trip-də gəlsin.
//
// Cavab forması:
//   {
//     ok: true,
//     venue: { id, code, name, domain, api_base_url, status },
//     limit: { max_devices, active, inactive, blocked, total },
//     restaurants: [
//       { id, code, name, domain, api_base_url }  // bu venue özü
//                                                  // və varsa eyni
//                                                  // domain-ə bağlı
//                                                  // əlavə filiallar
//     ],
//     devices_preview: [...son 10 cihaz...]
//   }

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
// `migrations.php` faylı serverə hələ upload edilməyibsə də işləsin.
@include_once __DIR__ . '/helpers/migrations.php';
if (!function_exists('ensure_senate_schema')) {
    function ensure_senate_schema(PDO $db): void {
        $cols = [
            ['venues', 'name', 'VARCHAR(255) NULL'],
            ['venues', 'status', "VARCHAR(20) NOT NULL DEFAULT 'active'"],
            ['device_activation_codes', 'venue_id', 'INT NULL'],
            ['device_activation_codes', 'deleted_at', 'DATETIME NULL'],
        ];
        foreach ($cols as [$t, $c, $def]) {
            try {
                $q = $db->prepare("
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE()
                       AND TABLE_NAME   = :t
                       AND COLUMN_NAME  = :c
                ");
                $q->execute([':t' => $t, ':c' => $c]);
                if ((int)$q->fetchColumn() === 0) {
                    $db->exec("ALTER TABLE `{$t}` ADD COLUMN `{$c}` {$def}");
                }
            } catch (Throwable $_) {}
        }
        try {
            $q = $db->prepare("
                SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME   = 'device_activation_codes'
                   AND COLUMN_NAME  = 'device_id'
                 LIMIT 1
            ");
            $q->execute();
            if ((string)$q->fetchColumn() === 'NO') {
                $db->exec("ALTER TABLE `device_activation_codes` MODIFY `device_id` INT NULL");
            }
        } catch (Throwable $_) {}
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'GET') {
  method_not_allowed(['GET', 'OPTIONS']);
}

try {
  // İdempotent schema upgrade — `name` sütununu yaradır (yox idisə).
  ensure_senate_schema($db);

  $venueId   = isset($_GET['venue_id']) ? (int)$_GET['venue_id'] : 0;
  $venueCode = isset($_GET['venue_code']) ? trim((string)$_GET['venue_code']) : '';

  if ($venueId <= 0 && $venueCode === '') {
    bad_request('venue_id_or_code_required');
  }

  // 1) Venue tap (id ilk, sonra code/domain).
  if ($venueId > 0) {
    $vq = $db->prepare("
      SELECT id, code, name, domain, api_base_url, status
        FROM venues
       WHERE id = :id
       LIMIT 1
    ");
    $vq->execute([':id' => $venueId]);
  } else {
    $vq = $db->prepare("
      SELECT id, code, name, domain, api_base_url, status
        FROM venues
       WHERE code = :c OR domain = :c
       LIMIT 1
    ");
    $vq->execute([':c' => $venueCode]);
  }
  $venue = $vq->fetch();
  if (!$venue) {
    not_found('venue_not_found');
  }
  $venueId = (int)$venue['id'];

  // 2) Cihaz limiti.
  $lq = $db->prepare("
    SELECT COALESCE(max_devices, device_limit, 0) AS max_devices
      FROM venue_device_limits
     WHERE venue_id = :v
     LIMIT 1
  ");
  $lq->execute([':v' => $venueId]);
  $maxDevices = (int)($lq->fetchColumn() ?: 0);

  // 3) Status üzrə cihaz sayları.
  $sq = $db->prepare("
    SELECT
      SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
      SUM(CASE WHEN status = 'blocked'  THEN 1 ELSE 0 END) AS blocked,
      COUNT(*)                                              AS total
    FROM devices
    WHERE venue_id = :v
      AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')
  ");
  try {
    $sq->execute([':v' => $venueId]);
  } catch (Throwable $_) {
    // `deleted_at` sütunu olmaya bilər (köhnə şema).  Onsuz cəhd et.
    $sq = $db->prepare("
      SELECT
        SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
        SUM(CASE WHEN status = 'blocked'  THEN 1 ELSE 0 END) AS blocked,
        COUNT(*)                                              AS total
      FROM devices
      WHERE venue_id = :v
    ");
    $sq->execute([':v' => $venueId]);
  }
  $stats = $sq->fetch() ?: [];
  $active   = (int)($stats['active']   ?? 0);
  $inactive = (int)($stats['inactive'] ?? 0);
  $blocked  = (int)($stats['blocked']  ?? 0);
  $total    = (int)($stats['total']    ?? 0);

  // 4) Restoran siyahısı.  Hazırki şemada ayrıca `restaurants` cədvəli
  // yoxdur — eyni "object"-ə aid filialları eyni `domain`-də saxlayan
  // venue-lər kimi qiymətləndiririk.  Boş domain-li venue üçün
  // siyahıda yalnız özü olur.
  $domain = trim((string)($venue['domain'] ?? ''));
  if ($domain !== '') {
    $rq = $db->prepare("
      SELECT id, code, name, domain, api_base_url
        FROM venues
       WHERE domain = :d
       ORDER BY id ASC
       LIMIT 100
    ");
    $rq->execute([':d' => $domain]);
    $restaurants = $rq->fetchAll();
  } else {
    $restaurants = [[
      'id'           => (int)$venue['id'],
      'code'         => (string)$venue['code'],
      'name'         => (string)($venue['name'] ?? ''),
      'domain'       => '',
      'api_base_url' => (string)($venue['api_base_url'] ?? ''),
    ]];
  }

  // 5) Son 10 cihaz — devices səhifəsində preview kart üçün.
  $dq = $db->prepare("
    SELECT id, device_name, stable_id, status, Divace_type, station,
           activated_at, created_at
      FROM devices
     WHERE venue_id = :v
     ORDER BY (status = 'active') DESC, id DESC
     LIMIT 10
  ");
  $dq->execute([':v' => $venueId]);
  $devicesPreview = $dq->fetchAll();

  audit_log($db, 'venues', $venueId, 'venue_summary');

  json_response([
    'ok'          => true,
    'venue'       => [
      'id'           => (int)$venue['id'],
      'code'         => (string)$venue['code'],
      'name'         => (string)($venue['name'] ?? ''),
      'domain'       => (string)($venue['domain'] ?? ''),
      'api_base_url' => (string)($venue['api_base_url'] ?? ''),
      'status'       => (string)($venue['status'] ?? 'active'),
    ],
    'limit'       => [
      'max_devices' => $maxDevices,
      'active'      => $active,
      'inactive'    => $inactive,
      'blocked'     => $blocked,
      'total'       => $total,
    ],
    'restaurants' => $restaurants,
    'devices_preview' => $devicesPreview,
  ]);
} catch (Throwable $e) {
  api_log('venue_summary_error', ['error' => $e->getMessage()]);
  server_error($e->getMessage());
}
