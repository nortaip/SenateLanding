<?php
declare(strict_types=1);

function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function response_json(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function require_id(?string $id): int
{
    if (!$id || !ctype_digit($id)) {
        response_json([
            'ok' => false,
            'error' => 'invalid_id'
        ], 400);
    }
    return (int)$id;
}

function filter_fields(array $input, array $allowed): array
{
    return array_intersect_key($input, array_flip($allowed));
}

function build_update_sql(string $table, array $data, string $idField = 'id'): array
{
    if (empty($data)) {
        response_json([
            'ok' => false,
            'error' => 'no_fields_to_update'
        ], 400);
    }

    $sets = [];
    foreach ($data as $key => $value) {
        $sets[] = "`{$key}` = :{$key}";
    }

    $sql = "UPDATE `{$table}` SET " . implode(', ', $sets) . " WHERE `{$idField}` = :id";
    return [$sql, $data];
}

function get_table_config(string $entity): ?array
{
    $tables = [
        'devices' => [
            'table' => 'devices',
            'id' => 'id',
            'fields' => [
                'venue_id',
                'device_name',
                'Divace_type',   // screenshot-da bu cürdür, exact saxlayırıq
                'station',
                'login',
                'stable_id',
                'imei',
                'app_version',
                'status',
                'activated_at',
                'blocked_at',
                'block_reason',
                'last_block_reason',
                'last_block_source',
                'updated_at'
            ]
        ],
        'device_activation_codes' => [
            'table' => 'device_activation_codes',
            'id' => 'id',
            'fields' => [
                'device_id',
                'code',
                'expires_at',
                'used_at'
            ]
        ],
        'device_block_logs' => [
            'table' => 'device_block_logs',
            'id' => 'id',
            'fields' => [
                'device_id',
                'stable_id',
                'reason',
                'created_at'
            ]
        ],
        'venues' => [
            'table' => 'venues',
            'id' => 'id',
            'fields' => [
                'name',
                'status',
                'created_at',
                'updated_at'
            ]
        ],
        'venue_device_limits' => [
            'table' => 'venue_device_limits',
            'id' => 'id',
            'fields' => [
                'venue_id',
                'device_type',
                'device_limit',
                'created_at',
                'updated_at'
            ]
        ],
    ];

    return $tables[$entity] ?? null;
}