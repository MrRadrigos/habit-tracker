<?php
// Robokassa server-to-server webhook (ResultURL).
// Robokassa expects a plain "OK<InvId>" body on success.
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/store.php';

header('Content-Type: text/plain; charset=utf-8');

$payload = $_POST ?: $_GET;

$outSum = isset($payload['OutSum']) ? trim($payload['OutSum']) : '';
$invId  = isset($payload['InvId'])  ? trim($payload['InvId'])  : '';
$sig    = isset($payload['SignatureValue']) ? strtolower(trim($payload['SignatureValue'])) : '';
$shpUserId = isset($payload['Shp_userId']) ? trim($payload['Shp_userId']) : '';

if ($outSum === '' || $invId === '' || $sig === '' || $shpUserId === '') {
    http_response_code(400);
    echo 'missing params';
    exit;
}

// Verification signature: md5(OutSum:InvId:Pass2:Shp_userId=<id>)
// rk_pass2() picks the test password when ROBOKASSA_TEST_MODE is on.
$expectedSrc = $outSum . ':' . $invId . ':' . rk_pass2() . ':Shp_userId=' . $shpUserId;
$expected = md5($expectedSrc);

if (!hash_equals($expected, $sig)) {
    http_response_code(400);
    echo 'bad signature';
    exit;
}

$invoice = store_mark_paid($invId);
if ($invoice === null) {
    // Unknown invoice id. Still respond OK so Robokassa stops retrying;
    // payment is captured by them, just not in our local store.
    echo 'OK' . $invId;
    exit;
}

echo 'OK' . $invId;
