<?php
// Credentials are read from the environment. See backend/.env.example.
// Do NOT hardcode DB passwords here — the previous plaintext values were
// exposed publicly and must be rotated.
$host   = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'posssistemadmin';
$user   = getenv('DB_USER') ?: '';
$pass   = getenv('DB_PASS') ?: '';

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
