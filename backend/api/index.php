<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$entity = $_GET['entity'] ?? null;
$id = $_GET['id'] ?? null;

if (!$entity) {
    response_json([
        'ok' => false,
        'error' => 'entity_required'
    ], 400);
}

$config = get_table_config($entity);

if (!$config) {
    response_json([
        'ok' => false,
        'error' => 'invalid_entity'
    ], 400);
}

$table = $config['table'];
$idField = $config['id'];
$allowedFields = $config['fields'];

try {
    switch ($method) {
        case 'GET':
            if ($id !== null) {
                $recordId = require_id($id);

                $stmt = $pdo->prepare("SELECT * FROM `{$table}` WHERE `{$idField}` = :id LIMIT 1");
                $stmt->execute(['id' => $recordId]);
                $row = $stmt->fetch();

                if (!$row) {
                    response_json([
                        'ok' => false,
                        'error' => 'not_found'
                    ], 404);
                }

                response_json([
                    'ok' => true,
                    'data' => $row
                ]);
            } else {
                $limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 500)) : 100;
                $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
                $offset = ($page - 1) * $limit;

                $stmt = $pdo->prepare("SELECT * FROM `{$table}` ORDER BY `{$idField}` DESC LIMIT :limit OFFSET :offset");
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll();

                $countStmt = $pdo->query("SELECT COUNT(*) as total FROM `{$table}`");
                $total = (int)$countStmt->fetch()['total'];

                response_json([
                    'ok' => true,
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'data' => $rows
                ]);
            }
            break;

        case 'POST':
            $input = json_input();
            $data = filter_fields($input, $allowedFields);

            if (empty($data)) {
                response_json([
                    'ok' => false,
                    'error' => 'no_valid_fields'
                ], 400);
            }

            $columns = array_keys($data);
            $placeholders = array_map(fn($c) => ':' . $c, $columns);

            $sql = "INSERT INTO `{$table}` (`" . implode('`,`', $columns) . "`)
                    VALUES (" . implode(',', $placeholders) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($data);

            response_json([
                'ok' => true,
                'message' => 'created',
                'id' => (int)$pdo->lastInsertId()
            ], 201);
            break;

        case 'PUT':
        case 'PATCH':
            $recordId = require_id($id);
            $input = json_input();
            $data = filter_fields($input, $allowedFields);

            // devices üçün updated_at avtomatik
            if ($table === 'devices' && !isset($data['updated_at'])) {
                $data['updated_at'] = date('Y-m-d H:i:s');
            }

            [$sql, $params] = build_update_sql($table, $data, $idField);
            $params['id'] = $recordId;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            response_json([
                'ok' => true,
                'message' => 'updated'
            ]);
            break;

        case 'DELETE':
            $recordId = require_id($id);

            $stmt = $pdo->prepare("DELETE FROM `{$table}` WHERE `{$idField}` = :id");
            $stmt->execute(['id' => $recordId]);

            response_json([
                'ok' => true,
                'message' => 'deleted'
            ]);
            break;

        default:
            response_json([
                'ok' => false,
                'error' => 'method_not_allowed'
            ], 405);
    }
} catch (PDOException $e) {
    response_json([
        'ok' => false,
        'error' => 'database_error',
        'message' => $e->getMessage()
    ], 500);
}