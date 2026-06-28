<?php
// Per-venue cihaz limit-inin idarəetməsi.
//
// Master admin panelindən hər venue üçün maksimum aktiv cihaz sayını
// təyin edir.  `device_limit` köhnə sxema adıdır, `max_devices` yeni.
// İkisini də dolduruluruq ki, hər iki yer (köhnə kod + yeni axın)
// eyni dəyəri görsün.

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    switch ($method) {
        case 'GET':
            $venueId = require_int($_GET['venue_id'] ?? null, 'venue_id');

            $vq = $db->prepare("SELECT id FROM venues WHERE id = :v LIMIT 1");
            $vq->execute([':v' => $venueId]);
            if (!$vq->fetch()) not_found('venue_not_found');

            // `max_devices` / `id` köhnə sxemada olmaya bilər.
            // Pillə-pillə fallback: əvvəl tam, sonra device_limit, sonra boş.
            $row = null;
            try {
                $sq = $db->prepare("
                    SELECT venue_id,
                           COALESCE(max_devices, device_limit, 0) AS max_devices
                      FROM venue_device_limits
                     WHERE venue_id = :v LIMIT 1
                ");
                $sq->execute([':v' => $venueId]);
                $row = $sq->fetch();
            } catch (Throwable $_) {
                try {
                    $sq = $db->prepare("
                        SELECT venue_id,
                               COALESCE(device_limit, 0) AS max_devices
                          FROM venue_device_limits
                         WHERE venue_id = :v LIMIT 1
                    ");
                    $sq->execute([':v' => $venueId]);
                    $row = $sq->fetch();
                } catch (Throwable $_) {
                    $row = null;
                }
            }
            $sq->execute([':v' => $venueId]);
            $row = $sq->fetch();

            $cnt = $db->prepare("
                SELECT
                  SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END) AS active,
                  SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
                  SUM(CASE WHEN status = 'blocked'  THEN 1 ELSE 0 END) AS blocked,
                  COUNT(*)                                              AS total
                  FROM devices WHERE venue_id = :v
            ");
            $cnt->execute([':v' => $venueId]);
            $stats = $cnt->fetch() ?: [];

            json_response([
                'ok'       => true,
                'venue_id' => $venueId,
                'limit'    => $row
                    ? (int)$row['max_devices']
                    : 0,
                'usage'    => [
                    'active'   => (int)($stats['active']   ?? 0),
                    'inactive' => (int)($stats['inactive'] ?? 0),
                    'blocked'  => (int)($stats['blocked']  ?? 0),
                    'total'    => (int)($stats['total']    ?? 0),
                ],
            ]);
            break;

        case 'POST':
        case 'PUT':
        case 'PATCH':
            $in = json_input();
            $venueId = require_int($in['venue_id'] ?? null, 'venue_id');
            $max     = isset($in['max_devices'])
                ? max(0, (int)$in['max_devices'])
                : 0;

            $vq = $db->prepare("SELECT id FROM venues WHERE id = :v LIMIT 1");
            $vq->execute([':v' => $venueId]);
            if (!$vq->fetch()) not_found('venue_not_found');

            // Upsert — venue_id key olaraq istifadə olunur, `id`
            // sütununa istinad yoxdur (köhnə sxemada PK olmaya bilər).
            $sel = $db->prepare("
                SELECT venue_id FROM venue_device_limits
                 WHERE venue_id = :v LIMIT 1
            ");
            $sel->execute([':v' => $venueId]);
            $existing = $sel->fetch();

            if ($existing) {
                // Pillə-pillə fallback: max_devices + device_limit + updated_at,
                // sonra yalnız device_limit, sonra yalnız device_limit (no updated_at).
                $updated = false;
                $variants = [
                    "UPDATE venue_device_limits
                        SET max_devices = :m, device_limit = :m, updated_at = NOW()
                      WHERE venue_id = :v",
                    "UPDATE venue_device_limits
                        SET max_devices = :m, device_limit = :m
                      WHERE venue_id = :v",
                    "UPDATE venue_device_limits
                        SET device_limit = :m, updated_at = NOW()
                      WHERE venue_id = :v",
                    "UPDATE venue_device_limits
                        SET device_limit = :m
                      WHERE venue_id = :v",
                ];
                foreach ($variants as $v) {
                    try {
                        $upd = $db->prepare($v);
                        $upd->execute([':m' => $max, ':v' => $venueId]);
                        $updated = true;
                        break;
                    } catch (Throwable $_) {
                        continue;
                    }
                }
                if (!$updated) {
                    server_error('limit_update_failed');
                }
            } else {
                $ins = $db->prepare("
                    INSERT INTO venue_device_limits
                      (venue_id, max_devices, device_limit, created_at)
                    VALUES (:v, :m, :m, NOW())
                ");
                try {
                    $ins->execute([':v' => $venueId, ':m' => $max]);
                } catch (Throwable $_) {
                    // `max_devices` köhnə bazada olmaya bilər — yalnız
                    // device_limit ilə cəhd et.
                    $ins = $db->prepare("
                        INSERT INTO venue_device_limits
                          (venue_id, device_limit, created_at)
                        VALUES (:v, :m, NOW())
                    ");
                    $ins->execute([':v' => $venueId, ':m' => $max]);
                }
            }

            audit_log($db, 'venue_device_limits', $venueId, 'set_limit', [
                'venue_id'    => $venueId,
                'max_devices' => $max,
            ]);
            json_response([
                'ok'          => true,
                'venue_id'    => $venueId,
                'max_devices' => $max,
            ]);
            break;

        case 'DELETE':
            $venueId = require_int($_GET['venue_id'] ?? null, 'venue_id');
            $del = $db->prepare("DELETE FROM venue_device_limits WHERE venue_id = :v");
            $del->execute([':v' => $venueId]);
            audit_log($db, 'venue_device_limits', $venueId, 'remove_limit');
            json_response(['ok' => true, 'venue_id' => $venueId]);
            break;

        default:
            method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    }
} catch (Throwable $e) {
    api_log('venue_device_limits_error', ['error' => $e->getMessage()]);
    server_error($e->getMessage());
}
