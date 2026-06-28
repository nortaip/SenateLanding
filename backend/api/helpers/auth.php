<?php
declare(strict_types=1);

function get_bearer_token(): ?string
{
    $headers = [];

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    }

    $header =
        $headers['Authorization'] ??
        $headers['authorization'] ??
        $_SERVER['HTTP_AUTHORIZATION'] ??
        $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ??
        $_SERVER['Authorization'] ??
        null;

    if (!$header) {
        return null;
    }

    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim($matches[1]);
    }

    return null;
}

function require_bearer_auth(array $validTokens): void
{
    $token = get_bearer_token();

    if (!$token) {
        json_response([
            'ok' => false,
            'error' => 'unauthorized',
            'message' => 'missing_bearer_token',
        ], 401);
    }

    if (!in_array($token, $validTokens, true)) {
        json_response([
            'ok' => false,
            'error' => 'unauthorized',
            'message' => 'invalid_bearer_token',
        ], 401);
    }
}