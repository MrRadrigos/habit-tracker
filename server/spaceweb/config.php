<?php
// Robokassa credentials. Fill these in from your Robokassa cabinet.
// MerchantLogin is the "Идентификатор магазина".
// Pass1 is "Пароль #1" (used to sign outgoing payment URL).
// Pass2 is "Пароль #2" (used to verify Robokassa's webhook).
define('ROBOKASSA_LOGIN', 'your_merchant_login');
define('ROBOKASSA_PASS1', 'your_password_1');
define('ROBOKASSA_PASS2', 'your_password_2');

// Toggle to false once tests pass and you switch to live payments.
define('ROBOKASSA_TEST_MODE', true);

// Where the user lands after success / failure on Robokassa.
// Robokassa sends the user to these URLs (with query params), so they must be
// publicly reachable on the same domain.
define('SUCCESS_URL', 'https://your-domain.ru/success.html');
define('FAIL_URL',    'https://your-domain.ru/fail.html');

// Subscription duration after a successful payment.
define('SUBSCRIPTION_DAYS', 30);

// Plans: id => price in rubles.
$PLANS = [
    'monthly' => '299.00',
];

// Path to the JSON file used as a tiny database. Anywhere outside the
// public webroot is preferred; if you cannot do that on shared hosting,
// keep it next to these scripts and rely on the included .htaccess
// to block direct HTTP access.
define('STORE_FILE', __DIR__ . '/store.json');
