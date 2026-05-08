import Constants from 'expo-constants';
import { Linking } from 'react-native';

export const ENTITLEMENT_ID = 'premium';

function getBaseUrl() {
  const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
  const url = extra.paymentBaseUrl || '';
  return String(url).replace(/\/$/, '');
}

export function isPaymentConfigured() {
  return getBaseUrl().length > 0;
}

// Opens the external payment page in the system browser. The site at
// `${baseUrl}/pay.php` is responsible for redirecting to Robokassa with a
// signed URL.
export async function openCheckout(userId, plan = 'monthly') {
  const base = getBaseUrl();
  if (!base) {
    const err = new Error('payment_unconfigured');
    err.code = 'unconfigured';
    throw err;
  }
  if (!userId) {
    const err = new Error('missing_user_id');
    err.code = 'no_user_id';
    throw err;
  }
  const url = `${base}/pay.php?userId=${encodeURIComponent(userId)}&plan=${encodeURIComponent(plan)}`;
  const can = await Linking.canOpenURL(url);
  if (!can) throw new Error('cannot_open_url');
  await Linking.openURL(url);
}

// Polls the backend to learn whether the given userId has an active
// subscription. The endpoint must return `{ premium: bool, expiresAt?: string }`.
export async function checkStatus(userId, { signal } = {}) {
  const base = getBaseUrl();
  if (!base || !userId) return null;
  try {
    const url = `${base}/status.php?userId=${encodeURIComponent(userId)}`;
    const response = await fetch(url, { signal });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      premium: !!data.premium,
      expiresAt: data.expiresAt || null,
    };
  } catch {
    return null;
  }
}

// Backwards-compatible aliases used elsewhere in the app.
export const isPurchasesAvailable = isPaymentConfigured;

export async function getCurrentPremiumStatus(userId) {
  const status = await checkStatus(userId);
  if (!status) return null;
  return status.premium;
}

export async function restorePurchases(userId) {
  const status = await checkStatus(userId);
  return !!status?.premium;
}
