<?php
// File: MobilePoss/pin_login.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// DB: config include (verilən faylınız)
require_once __DIR__ . '/config.php'; // $db = new PDO(...)

function out($arr, $http = 200) {
  http_response_code($http);
  echo json_encode($arr, JSON_UNESCAPED_UNICODE);
  exit;
}

// Input: JSON və ya form
$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) { $payload = $_POST; }

$pin = isset($payload['pin']) ? trim((string)$payload['pin']) : '';
if ($pin === '' || !ctype_digit($pin)) {
  out(['status'=>0,'permission'=>0,'code'=>'bad_pin','message'=>'PIN boş və ya yalnışdır']);
}

try {
  // Sadə variant: plain PIN (təhlükəsiz üçün hash istifadə etməyiniz tövsiyədir)
  $q = "SELECT id, name, surname, permission, status
        FROM admins
        WHERE pin_code = :pin
        LIMIT 1";
  $st = $db->prepare($q);
  $st->execute([':pin' => $pin]);
  $row = $st->fetch(PDO::FETCH_ASSOC);

  if (!$row) {
    out(['status'=>0,'permission'=>0,'code'=>'wrong_pin','message'=>'Yanlış PIN']);
  }

  $perm = (int)($row['permission'] ?? 0);
  $stat = (int)($row['status'] ?? 0);

  // Qayda: yalnız status=1 və permission=1 giriş edə bilər
  if ($perm !== 1 || $stat !== 1) {
    out(['status'=>0,'permission'=>$perm,'code'=>'forbidden','message'=>'İcazə yoxdur']);
  }

  out([
    'status'     => 1,
    'permission' => 1,
    'user'       => [
      'id'      => (int)$row['id'],
      'name'    => (string)$row['name'],
      'surname' => (string)$row['surname'],
    ],
  ]);

} catch (Throwable $e) {
  out(['status'=>0,'permission'=>0,'code'=>'query_error','message'=>'Sorğu xətası'], 500);
}
