<?php
declare(strict_types=1);

function require_int($value, string $field): int
{
    if ($value === null || $value === '' || !is_numeric($value)) {
        bad_request("{$field}_must_be_integer");
    }
    return (int)$value;
}

function optional_int($value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_numeric($value)) {
        bad_request('integer_expected');
    }
    return (int)$value;
}

function require_string($value, string $field, int $maxLen = 255): string
{
    $value = trim((string)$value);
    if ($value === '') {
        bad_request("{$field}_required");
    }
    if (mb_strlen($value) > $maxLen) {
        bad_request("{$field}_too_long");
    }
    return $value;
}

function optional_string($value, int $maxLen = 255): ?string
{
    if ($value === null) {
        return null;
    }
    $value = trim((string)$value);
    if (mb_strlen($value) > $maxLen) {
        bad_request('string_too_long');
    }
    return $value === '' ? null : $value;
}

function optional_enum($value, array $allowed, string $field): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    $value = trim((string)$value);
    if (!in_array($value, $allowed, true)) {
        bad_request("invalid_{$field}", ['allowed' => $allowed]);
    }
    return $value;
}

function optional_datetime($value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    $ts = strtotime((string)$value);
    if ($ts === false) {
        bad_request('invalid_datetime');
    }

    return date('Y-m-d H:i:s', $ts);
}

function validate_pagination(): array
{
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $limit = max(1, min($limit, 200));
    $offset = ($page - 1) * $limit;

    return [$page, $limit, $offset];
}

function validate_search(): ?string
{
    $search = $_GET['search'] ?? null;
    if ($search === null || $search === '') {
        return null;
    }
    return trim((string)$search);
}