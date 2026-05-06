import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const NAME_KEY = '@profile:name';
const PREMIUM_KEY = '@profile:premium';
const CUSTOM_ICONS_KEY = '@profile:customIcons';

const MAX_CUSTOM_ICONS = 5;

const ProfileContext = createContext({
  name: '',
  premium: false,
  customIcons: [],
  setName: () => {},
  setPremium: () => {},
  addCustomIcon: () => {},
  removeCustomIcon: () => {},
});

export function ProfileProvider({ children }) {
  const [name, setNameState] = useState('');
  const [premium, setPremiumState] = useState(false);
  const [customIcons, setCustomIconsState] = useState([]);

  useEffect(() => {
    (async () => {
      const [storedName, storedPremium, storedIcons] = await Promise.all([
        AsyncStorage.getItem(NAME_KEY),
        AsyncStorage.getItem(PREMIUM_KEY),
        AsyncStorage.getItem(CUSTOM_ICONS_KEY),
      ]);
      if (storedName) setNameState(storedName);
      if (storedPremium === '1') setPremiumState(true);
      if (storedIcons) {
        try {
          const arr = JSON.parse(storedIcons);
          if (Array.isArray(arr)) setCustomIconsState(arr);
        } catch {}
      }
    })();
  }, []);

  const setName = async (next) => {
    setNameState(next);
    await AsyncStorage.setItem(NAME_KEY, next);
  };

  const setPremium = async (next) => {
    setPremiumState(next);
    await AsyncStorage.setItem(PREMIUM_KEY, next ? '1' : '0');
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

  return (
    <ProfileContext.Provider
      value={{
        name,
        premium,
        customIcons,
        setName,
        setPremium,
        addCustomIcon,
        removeCustomIcon,
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
