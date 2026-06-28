<?php
declare(strict_types=1);

function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function method_not_allowed(array $allowed): void
{
    header('Allow: ' . implode(', ', $allowed));
    json_response([
        'ok' => false,
        'error' => 'method_not_allowed',
        'allowed' => $allowed,
    ], 405);
}

function bad_request(string $message, array $details = []): void
{
    json_response([
        'ok' => false,
        'error' => 'bad_request',
        'message' => $message,
        'details' => $details,
    ], 400);
}

function not_found(string $message = 'record_not_found'): void
{
    json_response([
        'ok' => false,
        'error' => 'not_found',
        'message' => $message,
    ], 404);
}

function server_error(string $message = 'server_error'): void
{
    json_response([
        'ok' => false,
        'error' => 'server_error',
        'message' => $message,
    ], 500);
}