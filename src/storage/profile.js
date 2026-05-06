import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const NAME_KEY = '@profile:name';
const PREMIUM_KEY = '@profile:premium';

const ProfileContext = createContext({
  name: '',
  premium: false,
  setName: () => {},
  setPremium: () => {},
});

export function ProfileProvider({ children }) {
  const [name, setNameState] = useState('');
  const [premium, setPremiumState] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedName, storedPremium] = await Promise.all([
        AsyncStorage.getItem(NAME_KEY),
        AsyncStorage.getItem(PREMIUM_KEY),
      ]);
      if (storedName) setNameState(storedName);
      if (storedPremium === '1') setPremiumState(true);
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

  return (
    <ProfileContext.Provider value={{ name, premium, setName, setPremium }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
