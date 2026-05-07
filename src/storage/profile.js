import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  getCurrentPremiumStatus,
  initPurchases,
  restorePurchases as restorePurchasesService,
} from '../services/purchases';

const NAME_KEY = '@profile:name';
const PREMIUM_KEY = '@profile:premium';
const CUSTOM_ICONS_KEY = '@profile:customIcons';
const CUSTOM_COLORS_KEY = '@profile:customColors';

const MAX_CUSTOM_ICONS = 5;
const MAX_CUSTOM_COLORS = 5;

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
  customIcons: [],
  customColors: [],
  setName: () => {},
  setPremium: () => {},
  addCustomIcon: () => {},
  removeCustomIcon: () => {},
  addCustomColor: () => {},
  removeCustomColor: () => {},
  restorePurchases: async () => false,
});

export function ProfileProvider({ children }) {
  const [name, setNameState] = useState('');
  const [premium, setPremiumState] = useState(false);
  const [customIcons, setCustomIconsState] = useState([]);
  const [customColors, setCustomColorsState] = useState([]);

  const persistPremium = async (next) => {
    setPremiumState(next);
    await AsyncStorage.setItem(PREMIUM_KEY, next ? '1' : '0');
  };

  useEffect(() => {
    (async () => {
      const [storedName, storedPremium, storedIcons, storedColors] = await Promise.all([
        AsyncStorage.getItem(NAME_KEY),
        AsyncStorage.getItem(PREMIUM_KEY),
        AsyncStorage.getItem(CUSTOM_ICONS_KEY),
        AsyncStorage.getItem(CUSTOM_COLORS_KEY),
      ]);
      if (storedName) setNameState(storedName);
      if (storedPremium === '1') setPremiumState(true);
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

      // RevenueCat is the source of truth when configured.
      const ok = await initPurchases();
      if (ok) {
        const status = await getCurrentPremiumStatus();
        if (status !== null) {
          setPremiumState(status);
          await AsyncStorage.setItem(PREMIUM_KEY, status ? '1' : '0');
        }
      }
    })();
  }, []);

  const setName = async (next) => {
    setNameState(next);
    await AsyncStorage.setItem(NAME_KEY, next);
  };

  const setPremium = async (next) => {
    await persistPremium(next);
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
    const ok = await restorePurchasesService();
    await persistPremium(!!ok);
    return !!ok;
  };

  return (
    <ProfileContext.Provider
      value={{
        name,
        premium,
        customIcons,
        customColors,
        setName,
        setPremium,
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
