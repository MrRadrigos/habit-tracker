import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export const palettes = {
  dark: {
    name: 'dark',
    bg: '#0F0F12',
    bgElevated: '#17171C',
    card: '#1C1C24',
    cardAlt: '#23232E',
    border: '#2A2A36',
    text: '#F5F5F7',
    textMuted: '#9A9AA8',
    textDim: '#6A6A78',
    accent: '#7C5CFF',
    success: '#3DDC97',
    warning: '#FFB454',
    danger: '#FF6B6B',
    shadow: '#000000',
  },
  light: {
    name: 'light',
    bg: '#F4F5F8',
    bgElevated: '#FFFFFF',
    card: '#FFFFFF',
    cardAlt: '#F0F1F5',
    border: '#E4E5EB',
    text: '#15151B',
    textMuted: '#5E5F6B',
    textDim: '#9698A3',
    accent: '#6A48F0',
    success: '#1FAE74',
    warning: '#E08A2B',
    danger: '#E04F4F',
    shadow: '#A0A4B8',
  },
};

export const habitColors = [
  '#7C5CFF',
  '#3DDC97',
  '#FFB454',
  '#FF6B6B',
  '#4DA8FF',
  '#FF7AD9',
  '#FFD166',
  '#26C6DA',
  '#A78BFA',
  '#F472B6',
];

export const habitIcons = ['💧', '🏃', '📚', '🧘', '🥗', '💤', '✍️', '🎯', '🎨', '🎵', '🧠', '🌱'];

const STORAGE_KEY = '@settings:theme';

const ThemeContext = createContext({
  theme: palettes.dark,
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') setModeState(stored);
    });
  }, []);

  const setMode = async (next) => {
    setModeState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const resolved = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;
  const theme = palettes[resolved];

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
