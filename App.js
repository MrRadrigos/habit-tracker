import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { I18nProvider } from './src/i18n';
import { ProfileProvider } from './src/storage/profile';
import { HabitsProvider } from './src/storage/habits-store';
import RootNavigator from './src/navigation/RootNavigator';

function ThemedStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <ProfileProvider>
              <HabitsProvider>
                <ThemedStatusBar />
                <RootNavigator />
              </HabitsProvider>
            </ProfileProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
