<?php
// Data/MobilePoss/api/device_activations_view.php
//
// Admin endpoint — back-office "Cihaz aktivasiyası" səhifəsi üçün.
// devices + device_activation_codes + venues cədvəllərini bir sorğuda
// JOIN edib qaytarır.  Səhifə hər cihaz üçün ayrı-ayrı kod sorğusu
// göndərmir → şəbəkə yükü çox az olur.
//
// GET /api/device_activations_view.php?status=inactive&venue_id=2&search=tab&limit=200
//   status:    inactive | active | blocked  (default: inactive)
//   venue_id:  optional int
//   search:    optional substring (device_name | stable_id | imei)
//   limit:     1..500 (default 100)
//   page:      default 1
//
// Cavab:
//   {
//     ok: true, page, limit, total,
//     data: [
//       {
//         id, device_name, stable_id, imei, app_version, status,
//         venue_id, venue_code, venue_domain, venue_name,
//         created_at, activated_at, blocked_at,
//         activation_code, code_id, code_expires_at, code_created_at
//       }, ...
//     ]
//   }
//
// Kod aktiv deyil (used_at NULL VƏ expired deyil) qeydlər
// activation_code field-ında görünəcək; əks halda null.

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    method_not_allowed(['GET']);
}

try {
    $status = $_GET['status'] ?? 'inactive';
    if (!in_array($status, ['inactive', 'active', 'blocked', 'all'], true)) {
        bad_request('invalid_status', [
            'allowed' => ['inactive', 'active', 'blocked', 'all'],
        ]);
    }

    [$page, $limit, $offset] = validate_pagination();
    $search = validate_search();
    $venueId = isset($_GET['venue_id']) && $_GET['venue_id'] !== ''
        ? (int)$_GET['venue_id']
        : null;

    $where = ['d.deleted_at IS NULL'];
    $params = [];

    if ($status !== 'all') {
        $where[] = 'd.status = :status';
        $params[':status'] = $status;
    }
    if ($venueId !== null) {
        $where[] = 'd.venue_id = :venue_id';
        $params[':venue_id'] = $venueId;
    }
    if ($search !== null && $search !== '') {
        $where[] = '(d.device_name LIKE :search '
                 . 'OR d.stable_id LIKE :search '
                 . 'OR d.imei LIKE :search)';
        $params[':search'] = '%' . $search . '%';
    }
    $whereSql = implode(' AND ', $where);

    // Count total üçün ayrıca sorğu — pagination düzgün işləsin.
    $countStmt = $db->prepare("
        SELECT COUNT(*) AS total
          FROM devices d
         WHERE {$whereSql}
    ");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['total'];

    // Latest unused active code (LEFT JOIN via correlated subquery —
    // hər cihaz üçün maximum 1 kod gəlir).
    // venues cədvəlində: id, code, domain, api_base_url, created_at
    // (name sütunu yoxdur — code/domain identifikator kimi istifadə olunur)
    $sql = "
        SELECT
            d.id,
            d.venue_id,
            d.device_name,
            d.stable_id,
            d.imei,
            d.app_version,
            d.status,
            d.created_at,
            d.activated_at,
            d.blocked_at,
            d.block_reason,
            v.code         AS venue_code,
            v.domain       AS venue_domain,
            v.api_base_url AS venue_api_base_url,
            ac.id          AS code_id,
            ac.code        AS activation_code,
            ac.created_at  AS code_created_at,
            ac.expires_at  AS code_expires_at
          FROM devices d
     LEFT JOIN venues v ON v.id = d.venue_id
     LEFT JOIN device_activation_codes ac ON ac.id = (
            SELECT MAX(ac2.id)
              FROM device_activation_codes ac2
             WHERE ac2.device_id  = d.id
               AND ac2.deleted_at IS NULL
               AND ac2.used_at    IS NULL
               AND (ac2.expires_at IS NULL OR ac2.expires_at > NOW())
        )
         WHERE {$whereSql}
      ORDER BY d.id DESC
         LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();

    audit_log($db, 'device_activations_view', null, 'list', [
        'status' => $status,
        'venue_id' => $venueId,
        'search' => $search,
        'page' => $page,
        'limit' => $limit,
    ]);

    json_response([
        'ok' => true,
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'data' => $rows,
    ]);
} catch (Throwable $e) {
    json_response([
        'ok' => false,
        'error' => 'server_error',
        'message' => $e->getMessage(),
    ], 500);
}
