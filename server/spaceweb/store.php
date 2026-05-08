<?php
// Tiny JSON-on-disk store. Single shared lock to avoid lost writes when
// two webhooks arrive at the same time.

require_once __DIR__ . '/config.php';

function store_load() {
    $path = STORE_FILE;
    if (!file_exists($path)) {
        return ['users' => [], 'invoices' => []];
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return ['users' => [], 'invoices' => []];
    }
    if (!isset($data['users'])) $data['users'] = [];
    if (!isset($data['invoices'])) $data['invoices'] = [];
    return $data;
}

function store_save($data) {
    $path = STORE_FILE;
    $tmp = $path . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    rename($tmp, $path);
}

function store_record_invoice($userId, $plan, $amount, $invId) {
    $data = store_load();
    $data['invoices'][$invId] = [
        'userId' => $userId,
        'plan' => $plan,
        'amount' => $amount,
        'createdAt' => date('c'),
        'paid' => false,
    ];
    store_save($data);
}

function store_mark_paid($invId) {
    $data = store_load();
    if (!isset($data['invoices'][$invId])) return null;
    $invoice = $data['invoices'][$invId];
    if (!empty($invoice['paid'])) return $invoice;

    $userId = $invoice['userId'];
    $data['invoices'][$invId]['paid'] = true;
    $data['invoices'][$invId]['paidAt'] = date('c');

    $now = time();
    $current = $data['users'][$userId]['expiresAt'] ?? null;
    $base = $current ? max($now, strtotime($current)) : $now;
    $expiresAt = date('c', strtotime('+' . SUBSCRIPTION_DAYS . ' days', $base));

    $data['users'][$userId] = [
        'expiresAt' => $expiresAt,
        'lastInvoice' => $invId,
        'updatedAt' => date('c'),
    ];

    store_save($data);
    return $data['invoices'][$invId];
}

function store_get_user($userId) {
    $data = store_load();
    return $data['users'][$userId] ?? null;
}
