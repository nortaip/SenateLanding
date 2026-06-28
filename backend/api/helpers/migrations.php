<?php
// Idempotent schema migrations.
//
// Mövcud canlı DB-də zaman keçdikcə yeni sütunlar lazım olur (məs.
// `venues.name`, `device_activation_codes.venue_id`).  Hər endpoint
// boot-da bu funksiyaları çağırır — sütun varsa, no-op; yoxdursa
// `ALTER TABLE` icra olunur.  Beləliklə server-də manual SQL gəzişi
// olmadan yeni feature deploy edilir.
//
// Yalnız əlavə (additive) əməliyyatlara icazə verilir: kolon əlavə
// etmək, NOT NULL → NULL gevşətmək.  Drop / rename / data-migration
// üçün ayrıca skript yazılır ki, səhv runtime-da silinməsin.

declare(strict_types=1);

function ensure_column(
    PDO $db,
    string $table,
    string $column,
    string $definition
): bool {
    $q = $db->prepare("
        SELECT COUNT(*)
          FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = :t
           AND COLUMN_NAME  = :c
    ");
    $q->execute([':t' => $table, ':c' => $column]);
    if ((int)$q->fetchColumn() > 0) {
        return false;
    }
    // Backtick-li `ALTER` — kolon adı reserved keyword olarsa belə işləsin.
    $db->exec("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
    return true;
}

function ensure_column_nullable(
    PDO $db,
    string $table,
    string $column,
    string $type
): bool {
    $q = $db->prepare("
        SELECT IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = :t
           AND COLUMN_NAME  = :c
         LIMIT 1
    ");
    $q->execute([':t' => $table, ':c' => $column]);
    $isNullable = (string)$q->fetchColumn();
    if ($isNullable === '' || $isNullable === 'YES') {
        return false;
    }
    $db->exec("ALTER TABLE `{$table}` MODIFY `{$column}` {$type} NULL");
    return true;
}

/**
 * Owners cədvəlini yaradır.  Master admin obyekt sahiblərini bura
 * qeyd edir: ad/soyad/telefon + opsional email/qeyd.  Hər venue
 * `owner_id`-i ilə bir sahibə bağlanır.
 */
function ensure_owners_schema(PDO $db): void {
    try {
        $db->exec("
            CREATE TABLE IF NOT EXISTS `owners` (
                `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                `first_name` VARCHAR(100) NOT NULL DEFAULT '',
                `last_name`  VARCHAR(100) NOT NULL DEFAULT '',
                `phone`      VARCHAR(50)  NOT NULL,
                `email`      VARCHAR(255) NULL,
                `notes`      TEXT NULL,
                `status`     VARCHAR(20)  NOT NULL DEFAULT 'active',
                `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME     NULL,
                `deleted_at` DATETIME     NULL,
                UNIQUE KEY `uq_owner_phone` (`phone`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (Throwable $_) {}
    ensure_column(
        $db,
        'venues',
        'owner_id',
        'INT UNSIGNED NULL AFTER `api_base_url`'
    );
}

/**
 * Senate-spesifik miqrasiyalar — back-office aktivasiya axını üçün
 * lazım olan əlavə kolonlar.  Hər endpoint boot-da çağırır;
 * `bootstrap.php` özü çağırmır ki, miqrasiya yalnız əlaqəli
 * endpoint-lər tərəfindən tetiklensin.
 */
function ensure_senate_schema(PDO $db): void {
    // venues — admin panelində görünən etiket üçün `name`.
    ensure_column($db, 'venues', 'name', 'VARCHAR(255) NULL AFTER `code`');
    // venues — köhnə bazada `status` ola bilməyə bilər.
    ensure_column(
        $db,
        'venues',
        'status',
        "VARCHAR(20) NOT NULL DEFAULT 'active' AFTER `api_base_url`"
    );
    // device_activation_codes — venue-scoped one-time kod üçün.
    // `device_id` artıq NULL ola bilər: admin əvvəlcədən venue üçün
    // kod yaradır, redeem zamanı device_id təyin olunur.
    ensure_column(
        $db,
        'device_activation_codes',
        'venue_id',
        'INT NULL AFTER `device_id`'
    );
    ensure_column_nullable($db, 'device_activation_codes', 'device_id', 'INT');
    // device_activation_codes — `deleted_at` köhnə bazada yoxdursa.
    ensure_column(
        $db,
        'device_activation_codes',
        'deleted_at',
        'DATETIME NULL'
    );
    // Master admin panel-i üçün owners cədvəli + venues.owner_id.
    ensure_owners_schema($db);
}
