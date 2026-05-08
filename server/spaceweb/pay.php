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

if (!preg_match('/^[a-f0-9-]{8,64}$/', $userId)) {
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

// Signature for outgoing payment URL: md5(login:amount:invId:pass1:Shp_userId=<id>)
// Shp_ parameters MUST be appended sorted by name.
$signatureSrc = ROBOKASSA_LOGIN . ':' . $amount . ':' . $invId . ':' . ROBOKASSA_PASS1
              . ':Shp_userId=' . $shpUserId;
$signature = md5($signatureSrc);

$params = [
    'MerchantLogin'  => ROBOKASSA_LOGIN,
    'OutSum'         => $amount,
    'InvId'          => $invId,
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
