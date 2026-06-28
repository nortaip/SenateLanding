<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/cors.php';
require_once __DIR__ . '/helpers/auth.php';
require_once __DIR__ . '/helpers/logger.php';
require_once __DIR__ . '/helpers/validation.php';
require_once __DIR__ . '/helpers/audit.php';
require_once __DIR__ . '/helpers/migrations.php';

handle_cors($ALLOWED_ORIGINS);

$disableAuth = isset($_GET['no_auth']) && $_GET['no_auth'] === '1';

if (!$disableAuth) {
    require_bearer_auth($API_TOKENS);
}