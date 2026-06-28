<?php
declare(strict_types=1);

function audit_log(PDO $db, string $entity, ?int $entityId, string $action, array $payload = []): void
{
    try {
        $stmt = $db->prepare("
            INSERT INTO api_audit_logs
            (entity, entity_id, action, request_method, request_ip, payload)
            VALUES
            (:entity, :entity_id, :action, :request_method, :request_ip, :payload)
        ");

        $stmt->execute([
            ':entity' => $entity,
            ':entity_id' => $entityId,
            ':action' => $action,
            ':request_method' => $_SERVER['REQUEST_METHOD'] ?? null,
            ':request_ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    } catch (Throwable $e) {
        api_log('audit_log_failed', ['error' => $e->getMessage()]);
    }
}