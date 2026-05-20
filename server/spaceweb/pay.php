<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/store.php';

global $PLANS;

function bad_request($msg) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo $msg;
    exit;
}

$userId = isset($_GET['userId']) ? trim($_GET['userId']) : '';
$plan = isset($_GET['plan']) ? trim($_GET['plan']) : 'monthly';

if (!preg_match('/^[a-zA-Z0-9_-]{4,64}$/', $userId)) {
    bad_request('userId required');
}
if (!isset($PLANS[$plan])) {
    bad_request('unknown plan');
}

$amount = $PLANS[$plan];
// Robokassa requires a numeric InvId. Mix time with random bits for uniqueness.
$invId = (string)(time() % 1000000) . str_pad((string)random_int(0, 999), 3, '0', STR_PAD_LEFT);

store_record_invoice($userId, $plan, $amount, $invId);

$description = 'Habit Tracker Premium';

// Custom Shp_ params travel through Robokassa unchanged. We tunnel userId
// so the webhook can attach the payment to the right user.
$shpUserId = $userId;

// Fiscalization (ФЗ-54). Robokassa requires the cart contents (номенклатура).
// payment_object "service" — это услуга; tax "none" — самозанятый (НПД) не
// является плательщиком НДС, поэтому ставка не указывается.
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
// Robokassa требует Receipt в URL-кодировке как в подписи, так и в URL.
$receiptEncoded = urlencode($receiptJson);

// Signature for outgoing payment URL, with Receipt:
//   md5(login:OutSum:InvId:Receipt:Pass1:Shp_userId=<id>)
// Shp_ parameters MUST be appended sorted by name.
$signatureSrc = ROBOKASSA_LOGIN . ':' . $amount . ':' . $invId . ':' . $receiptEncoded
              . ':' . rk_pass1() . ':Shp_userId=' . $shpUserId;
$signature = md5($signatureSrc);

// http_build_query применяет urlencode() к каждому значению, поэтому в
// $params['Receipt'] кладём СЫРОЙ json — он закодируется ровно один раз и
// совпадёт с $receiptEncoded, использованным в подписи.
$params = [
    'MerchantLogin'  => ROBOKASSA_LOGIN,
    'OutSum'         => $amount,
    'InvId'          => $invId,
    'Receipt'        => $receiptJson,
    'Description'    => $description,
    'SignatureValue' => $signature,
    'Shp_userId'     => $shpUserId,
    'SuccessURL'     => SUCCESS_URL,
    'FailURL'        => FAIL_URL,
];
if (ROBOKASSA_TEST_MODE) {
    $params['IsTest'] = 1;
}

$url = 'https://auth.robokassa.ru/Merchant/Index.aspx?' . http_build_query($params);

header('Location: ' . $url);
exit;
