<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Credentials are read from the environment. See backend/.env.example.
// Do NOT hardcode secrets here — the previous plaintext DB password and
// API tokens were exposed publicly and must be rotated.
$host   = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'posssistemadmin';
$user   = getenv('DB_USER') ?: '';
$pass   = getenv('DB_PASS') ?: '';

try {
    $db = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'db_connection_failed',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * API bearer tokens — comma-separated in the API_TOKENS env var.
 */
$envTokens = getenv('API_TOKENS') ?: '';
$API_TOKENS = $envTokens !== ''
    ? array_values(array_filter(array_map('trim', explode(',', $envTokens))))
    : [];

/**
 * Allowed CORS origins — comma-separated in CORS_ORIGINS env var,
 * otherwise the sensible local defaults below.
 */
$envOrigins = getenv('CORS_ORIGINS') ?: '';
$ALLOWED_ORIGINS = $envOrigins !== ''
    ? array_values(array_filter(array_map('trim', explode(',', $envOrigins))))
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://yourdomain.com',
    ];
