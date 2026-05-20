<?php
// Шаблон конфигурации. На сервере скопируй этот файл в config.php и впиши
// реальные значения. config.php добавлен в .gitignore — он никогда не попадает
// в репозиторий.

// ── Robokassa ─────────────────────────────────────────────────────────────
// MerchantLogin — «Идентификатор магазина» из кабинета Робокассы.
//
// БОЕВЫЕ пароли — раздел «Технические настройки».
define('ROBOKASSA_LOGIN', 'your_merchant_login');
define('ROBOKASSA_PASS1', 'your_production_password_1');
define('ROBOKASSA_PASS2', 'your_production_password_2');

// ТЕСТОВЫЕ пароли — блок «Параметры проведения тестовых платежей»
// в тех же «Технических настройках». Это ОТДЕЛЬНАЯ пара, не совпадает
// с боевой. Когда ROBOKASSA_TEST_MODE = true, скрипт подписывает запросы
// именно этими паролями.
define('ROBOKASSA_TEST_PASS1', 'your_test_password_1');
define('ROBOKASSA_TEST_PASS2', 'your_test_password_2');

// Тестовый режим Робокассы. После прохождения модерации поменяй на false —
// тогда автоматически используются боевые пароли выше.
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
