<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/store.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$userId = isset($_GET['userId']) ? trim($_GET['userId']) : '';
if (!preg_match('/^[a-zA-Z0-9_-]{4,64}$/', $userId)) {
    http_response_code(400);
    echo json_encode(['error' => 'userId required']);
    exit;
}

$user = store_get_user($userId);

$active = false;
$expiresAt = null;
if ($user && !empty($user['expiresAt'])) {
    $expiresAt = $user['expiresAt'];
    $active = strtotime($expiresAt) > time();
}

echo json_encode([
    'premium' => $active,
    'expiresAt' => $expiresAt,
]);
