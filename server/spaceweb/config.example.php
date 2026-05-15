<?php
// Шаблон конфигурации. На сервере скопируй этот файл в config.php и впиши
// реальные значения. config.php добавлен в .gitignore — он никогда не попадает
// в репозиторий.

// ── Robokassa ─────────────────────────────────────────────────────────────
// MerchantLogin — «Идентификатор магазина» из кабинета Робокассы.
// Pass1 — «Пароль #1» (используется для подписи исходящих платёжных URL).
// Pass2 — «Пароль #2» (используется для проверки входящего webhook).
define('ROBOKASSA_LOGIN', 'your_merchant_login');
define('ROBOKASSA_PASS1', 'your_password_1');
define('ROBOKASSA_PASS2', 'your_password_2');

// Тестовый режим Робокассы. После прохождения модерации поменяй на false.
define('ROBOKASSA_TEST_MODE', true);

// Куда Робокасса возвращает пользователя после оплаты / отмены.
define('SUCCESS_URL', 'https://your-domain.ru/success.html');
define('FAIL_URL',    'https://your-domain.ru/fail.html');

// Сколько дней длится подписка после успешной оплаты.
define('SUBSCRIPTION_DAYS', 30);

// Тарифы: id => цена в рублях (строкой).
$PLANS = [
    'monthly' => '199.00',
];

// Файл-стор. .htaccess блокирует прямой HTTP-доступ к нему.
define('STORE_FILE', __DIR__ . '/store.json');
