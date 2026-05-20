<?php
// Диагностический скрипт. Выводит, какой URL ВЫЛО БЫ передан в Robokassa,
// но НЕ делает редирект. Сюда полезно зайти, чтобы убедиться, что
// конфигурация корректная.
// Удали этот файл после отладки — он раскрывает merchant_login.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/store.php';

global $PLANS;

header('Content-Type: text/plain; charset=utf-8');

$userId = isset($_GET['userId']) ? trim($_GET['userId']) : '';
$plan   = isset($_GET['plan'])   ? trim($_GET['plan'])   : 'monthly';

echo "=== INPUT ===\n";
echo "userId: $userId\n";
echo "plan:   $plan\n\n";

echo "=== CONFIG ===\n";
echo "ROBOKASSA_LOGIN:       " . ROBOKASSA_LOGIN . "\n";
echo "ROBOKASSA_TEST_MODE:   " . (ROBOKASSA_TEST_MODE ? 'true' : 'false') . "\n";
echo "Active password set:   " . (ROBOKASSA_TEST_MODE ? 'TEST' : 'PRODUCTION') . "\n";
echo "TEST_PASS1 defined:    " . (defined('ROBOKASSA_TEST_PASS1') && ROBOKASSA_TEST_PASS1 !== '' ? 'yes' : 'NO') . "\n";
echo "TEST_PASS2 defined:    " . (defined('ROBOKASSA_TEST_PASS2') && ROBOKASSA_TEST_PASS2 !== '' ? 'yes' : 'NO') . "\n";
echo "SUCCESS_URL:           " . SUCCESS_URL . "\n";
echo "FAIL_URL:              " . FAIL_URL . "\n";
echo "PLANS:                 " . json_encode($PLANS, JSON_UNESCAPED_UNICODE) . "\n";
echo "STORE_FILE exists:     " . (file_exists(STORE_FILE) ? 'yes' : 'no') . "\n";
echo "STORE_FILE writable:   " . (is_writable(STORE_FILE) ? 'yes' : 'no') . "\n\n";

if (!preg_match('/^[a-zA-Z0-9_-]{4,64}$/', $userId)) {
    echo "FAIL: userId failed regex (need 4-64 chars of a-zA-Z0-9_-)\n";
    exit;
}
if (!isset($PLANS[$plan])) {
    echo "FAIL: unknown plan '$plan'\n";
    exit;
}

$amount = $PLANS[$plan];
$invId  = (string)(time() % 1000000) . str_pad((string)random_int(0, 999), 3, '0', STR_PAD_LEFT);

$receipt = [
    'items' => [
        [
            'name'           => 'Подписка Premium HabitTracker Pro (30 дней)',
            'quantity'       => 1,
            'sum'            => (float) $amount,
            'payment_method' => 'full_payment',
            'payment_object' => 'service',
            'tax'            => 'none',
        ],
    ],
];
$receiptJson = json_encode($receipt, JSON_UNESCAPED_UNICODE);
$receiptEncoded = urlencode($receiptJson);

$signatureSrc = ROBOKASSA_LOGIN . ':' . $amount . ':' . $invId . ':' . $receiptEncoded
              . ':' . rk_pass1() . ':Shp_userId=' . $userId;
$signature = md5($signatureSrc);

$params = [
    'MerchantLogin'  => ROBOKASSA_LOGIN,
    'OutSum'         => $amount,
    'InvId'          => $invId,
    'Receipt'        => $receiptJson,
    'Description'    => 'Habit Tracker Premium',
    'SignatureValue' => $signature,
    'Shp_userId'     => $userId,
    'SuccessURL'     => SUCCESS_URL,
    'FailURL'        => FAIL_URL,
];
if (ROBOKASSA_TEST_MODE) {
    $params['IsTest'] = 1;
}

$url = 'https://auth.robokassa.ru/Merchant/Index.aspx?' . http_build_query($params);

echo "=== RECEIPT (fiscalization) ===\n";
echo $receiptJson . "\n\n";

echo "=== RESULT ===\n";
echo "amount:    $amount\n";
echo "invId:     $invId\n";
echo "signature: $signature\n\n";
echo "Would redirect to:\n";
echo $url . "\n";
