import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { checkStatus, isPaymentConfigured } from '../services/purchases';

const NAME_KEY = '@profile:name';
const PREMIUM_KEY = '@profile:premium';
const CUSTOM_ICONS_KEY = '@profile:customIcons';
const CUSTOM_COLORS_KEY = '@profile:customColors';
const USER_ID_KEY = '@profile:userId';
const PREMIUM_EXPIRES_KEY = '@profile:premiumExpiresAt';

const MAX_CUSTOM_ICONS = 5;
const MAX_CUSTOM_COLORS = 5;

function genUserId() {
  // RFC4122-ish v4 string. Random source is Math.random which is enough for
  // an opaque per-install identifier (it is not security-sensitive).
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) out += '-';
    let n = Math.floor(Math.random() * 16);
    if (i === 12) n = 4;
    if (i === 16) n = (n & 0x3) | 0x8;
    out += hex[n];
  }
  return out;
}

function normalizeHex(input) {
  if (!input) return null;
  let v = String(input).trim();
  if (v.startsWith('#')) v = v.slice(1);
  if (v.length === 3) {
    v = v
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(v)) return null;
  return '#' + v.toUpperCase();
}

const ProfileContext = createContext({
  name: '',
  premium: false,
  premiumExpiresAt: null,
  userId: '',
  customIcons: [],
  customColors: [],
  setName: () => {},
  setPremium: () => {},
  refreshPremium: async () => false,
  addCustomIcon: () => {},
  removeCustomIcon: () => {},
  addCustomColor: () => {},
  removeCustomColor: () => {},
  restorePurchases: async () => false,
});

export function ProfileProvider({ children }) {
  const [name, setNameState] = useState('');
  const [premium, setPremiumState] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAtState] = useState(null);
  const [userId, setUserIdState] = useState('');
  const [customIcons, setCustomIconsState] = useState([]);
  const [customColors, setCustomColorsState] = useState([]);

  const persistPremium = async (next, expiresAt = null) => {
    setPremiumState(!!next);
    setPremiumExpiresAtState(expiresAt);
    await AsyncStorage.setItem(PREMIUM_KEY, next ? '1' : '0');
    if (expiresAt) {
      await AsyncStorage.setItem(PREMIUM_EXPIRES_KEY, expiresAt);
    } else {
      await AsyncStorage.removeItem(PREMIUM_EXPIRES_KEY);
    }
  };

  const ensureUserId = async () => {
    let stored = await AsyncStorage.getItem(USER_ID_KEY);
    if (!stored) {
      stored = genUserId();
      await AsyncStorage.setItem(USER_ID_KEY, stored);
    }
    setUserIdState(stored);
    return stored;
  };

  const refreshPremium = async (id) => {
    const target = id || userId;
    if (!target || !isPaymentConfigured()) return null;
    const status = await checkStatus(target);
    if (!status) return null;
    await persistPremium(status.premium, status.expiresAt);
    return status.premium;
  };

  useEffect(() => {
    (async () => {
      const [storedName, storedPremium, storedExpires, storedIcons, storedColors] =
        await Promise.all([
          AsyncStorage.getItem(NAME_KEY),
          AsyncStorage.getItem(PREMIUM_KEY),
          AsyncStorage.getItem(PREMIUM_EXPIRES_KEY),
          AsyncStorage.getItem(CUSTOM_ICONS_KEY),
          AsyncStorage.getItem(CUSTOM_COLORS_KEY),
        ]);
      if (storedName) setNameState(storedName);
      if (storedPremium === '1') setPremiumState(true);
      if (storedExpires) setPremiumExpiresAtState(storedExpires);
      if (storedIcons) {
        try {
          const arr = JSON.parse(storedIcons);
          if (Array.isArray(arr)) setCustomIconsState(arr);
        } catch {}
      }
      if (storedColors) {
        try {
          const arr = JSON.parse(storedColors);
          if (Array.isArray(arr)) setCustomColorsState(arr);
        } catch {}
      }

      const id = await ensureUserId();

      if (isPaymentConfigured()) {
        const status = await checkStatus(id);
        if (status) {
          await persistPremium(status.premium, status.expiresAt);
        }
      }
    })();
  }, []);

  const setName = async (next) => {
    setNameState(next);
    await AsyncStorage.setItem(NAME_KEY, next);
  };

  const setPremium = async (next) => {
    await persistPremium(next, premiumExpiresAt);
  };

  const persistIcons = async (next) => {
    setCustomIconsState(next);
    await AsyncStorage.setItem(CUSTOM_ICONS_KEY, JSON.stringify(next));
  };

  const addCustomIcon = async (emoji) => {
    const trimmed = (emoji || '').trim();
    if (!trimmed) return false;
    if (customIcons.includes(trimmed)) return false;
    if (customIcons.length >= MAX_CUSTOM_ICONS) return false;
    const next = [...customIcons, trimmed];
    await persistIcons(next);
    return true;
  };

  const removeCustomIcon = async (emoji) => {
    const next = customIcons.filter((e) => e !== emoji);
    await persistIcons(next);
  };

  const persistColors = async (next) => {
    setCustomColorsState(next);
    await AsyncStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(next));
  };

  const addCustomColor = async (hex) => {
    const norm = normalizeHex(hex);
    if (!norm) return null;
    if (customColors.includes(norm)) return norm;
    if (customColors.length >= MAX_CUSTOM_COLORS) return null;
    await persistColors([...customColors, norm]);
    return norm;
  };

  const removeCustomColor = async (hex) => {
    await persistColors(customColors.filter((c) => c !== hex));
  };

  const restorePurchases = async () => {
    const result = await refreshPremium();
    return !!result;
  };

  return (
    <ProfileContext.Provider
      value={{
        name,
        premium,
        premiumExpiresAt,
        userId,
        customIcons,
        customColors,
        setName,
        setPremium,
        refreshPremium,
        addCustomIcon,
        removeCustomIcon,
        addCustomColor,
        removeCustomColor,
        restorePurchases,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}

export const MAX_CUSTOM = MAX_CUSTOM_ICONS;
export const MAX_COLORS = MAX_CUSTOM_COLORS;
export { normalizeHex };
