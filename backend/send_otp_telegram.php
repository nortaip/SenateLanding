<?php
// CORS + JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// Bot token and chat id come from the environment. See backend/.env.example.
// The previously hardcoded token was exposed publicly and must be revoked
// via @BotFather.
$BOT_TOKEN = getenv('TG_BOT_TOKEN') ?: '';
$CHAT_ID   = getenv('TG_CHAT_ID') ?: '';

if ($BOT_TOKEN === '' || $CHAT_ID === '') {
  http_response_code(500);
  echo json_encode(['ok' => false, 'message' => 'telegram_not_configured']);
  exit();
}


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'message'=>'Only POST allowed']);
  exit();
}

$raw = file_get_contents('php://input');
$in  = json_decode($raw, true);

$code = isset($in['resetCode']) ? trim($in['resetCode']) : '';
$app  = isset($in['app']) ? trim($in['app']) : 'Senate POS';

if ($code === '') {
  http_response_code(400);
  echo json_encode(['ok'=>false,'message'=>'resetCode is required']);
  exit();
}

$text = "✅ *$app* — *Root OTP*\n• Kod: {$code}\n• Etibarlılıq: 5 dəqiqə\n• Tarix: ".date('Y-m-d H:i:s');

$url = "https://api.telegram.org/bot".$BOT_TOKEN."/sendMessage";
$payload = ['chat_id'=>$CHAT_ID,'text'=>$text,'parse_mode'=>'Markdown'];

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POSTFIELDS => json_encode($payload)
]);
$res = curl_exec($ch);
$codeHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($codeHttp === 200) {
  echo json_encode(['ok'=>true,'message'=>'OTP sent to Telegram']);
} else {
  http_response_code($codeHttp);
  echo json_encode(['ok'=>false,'message'=>'Telegram send failed','raw'=>$res]);
}