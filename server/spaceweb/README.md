# SpaceWeb + Robokassa payment backend

A handful of PHP scripts that:

- generate a signed Robokassa payment URL (`pay.php`),
- accept the Robokassa server-to-server callback (`result.php`),
- expose a tiny status endpoint the mobile app polls (`status.php`).

State is kept in a single JSON file (`store.json`) — no database is required.
The included `.htaccess` blocks direct HTTP access to that file and to
`config.php`.

## Files

| File | Purpose |
|---|---|
| `config.example.php` | Шаблон конфига. На сервере **переименовать** в `config.php` и заполнить. `config.php` гитом не отслеживается. |
| `store.php` | JSON-on-disk helpers (atomic writes via temp + rename). |
| `pay.php` | Builds the Robokassa redirect URL with the right signature. |
| `result.php` | Verifies Robokassa's webhook signature and marks the user paid. |
| `status.php` | Returns `{premium, expiresAt}` for a given `userId`. |
| `success.html`, `fail.html` | Landing pages Robokassa redirects users to. |
| `.htaccess` | Blocks direct access to `store.json`, `store.php`, `config.php`. |

## One-time setup

### 1. Robokassa cabinet (`partner.robokassa.ru`)
1. Зарегистрируйся как самозанятый. Робокасса предлагает специальную форму для НПД, чеки в ФНС улетают автоматически.
2. Создай "магазин" — это даст:
   - **MerchantLogin** (идентификатор магазина)
   - **Пароль #1** (для подписи исходящих платежей)
   - **Пароль #2** (для проверки входящего webhook)
3. В настройках магазина пропиши URLs:
   - **Result URL** (метод POST, кодировка UTF-8): `https://your-domain.ru/result.php`
   - **Success URL** (POST/GET, неважно): `https://your-domain.ru/success.html`
   - **Fail URL**: `https://your-domain.ru/fail.html`
4. Включи "Алгоритм расчёта хеша" → **MD5**.
5. На время теста — оставь магазин в "тестовом режиме".

### 2. SpaceWeb
1. Залей всю папку `server/spaceweb/` через ftp / файловый менеджер на свой домен. Корневая папка может быть любой — например, `public_html/pay/`.
2. Переименуй на сервере `config.example.php` → `config.php` и впиши:
   - `ROBOKASSA_LOGIN`, `ROBOKASSA_PASS1`, `ROBOKASSA_PASS2` — из кабинета.
   - `SUCCESS_URL`, `FAIL_URL` — на твой реальный домен.
   - `ROBOKASSA_TEST_MODE` — оставь `true` пока тестируешь.
   - `$PLANS` — измени цену под себя.

   **Не коммить `config.php` обратно в git** — пароли утекут. Файл уже
   в `.gitignore`, но не отключай эту защиту.
3. Создай пустой `store.json` с правами `666` (или дай папке право записи). Файл создаст и сам скрипт при первом платеже, но иногда shared hosting запрещает PHP создавать файлы — лучше подложить вручную:
   ```
   {"users":{},"invoices":{}}
   ```
4. Проверь, что `.htaccess` рядом со скриптами реально применяется (на SpaceWeb надо чтобы стоял Apache, не Nginx-only). Проверь руками: `https://your-domain.ru/pay/store.json` должен отдавать **403**.

### 3. Свяжи приложение
В корне репозитория открой `app.json` и пропиши URL:
```json
"extra": {
  "insightsUrl": "...",
  "paymentBaseUrl": "https://your-domain.ru/pay"
}
```
Без `/` на конце. Перезапусти `npx expo start --clear`.

## Тест-чеклист

1. На устройстве: открой Premium → "Перейти к оплате". Должно открыть Robokassa с тестовой карточкой.
2. Введи тестовые данные карты (Robokassa выдаёт их в кабинете).
3. После оплаты — Robokassa отдаст 200 OK на `/result.php` и редиректнет на `/success.html`.
4. Вернись в приложение. В течение нескольких секунд статус переключится на `Premium 👑`.
5. На сервере посмотри `store.json` — там должна появиться запись пользователя с `expiresAt`.

Если `result.php` Робокасса дёргает, но в JSON ничего не появляется — проверь логи PHP / права записи. Если результат проверки подписи падает в `bad signature` — убедись, что в кабинете Робокассы выставлен **MD5** и пароли скопированы без пробелов.

## Когда переключаешься в боевой режим

1. В кабинете Робокассы переведи магазин в "боевой" режим (после прохождения модерации).
2. В `config.php` поставь `ROBOKASSA_TEST_MODE = false`.
3. Залей правки на хостинг.

## Фискализация (ФЗ-54)

`pay.php` передаёт в Robokassa параметр `Receipt` — состав корзины (одна
позиция: подписка Premium на 30 дней). Это требование Robokassa для
формирования чека по ФЗ-54.

Параметры позиции:
- `payment_object: service` — услуга.
- `payment_method: full_payment` — полный расчёт.
- `tax: none` — самозанятый (НПД) не платит НДС, ставка не указывается.

Если меняешь цену или название подписки — правь и `$PLANS` в `config.php`,
и блок `$receipt` в `pay.php` (имя позиции). Сумма позиции `sum` должна
совпадать с `OutSum`.
