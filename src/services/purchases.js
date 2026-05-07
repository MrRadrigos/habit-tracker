import Constants from 'expo-constants';
import { Platform } from 'react-native';

let Purchases = null;
try {
  // In Expo Go this module is missing; require lazily so the app still boots.
  Purchases = require('react-native-purchases').default;
} catch {
  Purchases = null;
}

export const ENTITLEMENT_ID = 'premium';

let initialized = false;

function getApiKey() {
  const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
  if (Platform.OS === 'android') return extra.revenueCatAndroidKey || '';
  if (Platform.OS === 'ios') return extra.revenueCatIosKey || '';
  return '';
}

export function isPurchasesAvailable() {
  return !!Purchases && !!getApiKey();
}

export async function initPurchases() {
  if (!isPurchasesAvailable() || initialized) return false;
  try {
    if (Purchases.setLogLevel) {
      Purchases.setLogLevel('error');
    }
    await Purchases.configure({ apiKey: getApiKey() });
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

function entitlementActive(info) {
  return !!info?.entitlements?.active?.[ENTITLEMENT_ID];
}

export async function getCurrentPremiumStatus() {
  if (!isPurchasesAvailable()) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    return entitlementActive(info);
  } catch {
    return null;
  }
}

export async function getCurrentOffering() {
  if (!isPurchasesAvailable()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings?.current || null;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg) {
  if (!isPurchasesAvailable()) {
    const err = new Error('purchases_unavailable');
    err.code = 'unavailable';
    throw err;
  }
  const result = await Purchases.purchasePackage(pkg);
  return entitlementActive(result?.customerInfo);
}

export async function restorePurchases() {
  if (!isPurchasesAvailable()) return false;
  try {
    const info = await Purchases.restorePurchases();
    return entitlementActive(info);
  } catch {
    return false;
  }
}
