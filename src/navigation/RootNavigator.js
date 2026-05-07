import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import AddHabitScreen from '../screens/AddHabitScreen';
import PremiumScreen from '../screens/PremiumScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function tabIcon(emoji) {
  return ({ color, focused }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55, color }}>{emoji}</Text>
  );
}

function Tabs() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgElevated,
          borderTopColor: theme.border,
          height: 50 + bottomInset,
          paddingBottom: bottomInset > 0 ? bottomInset : 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textDim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t.tabs.home, tabBarIcon: tabIcon('🏠') }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: t.tabs.stats, tabBarIcon: tabIcon('📊') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t.tabs.settings, tabBarIcon: tabIcon('⚙️') }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { theme } = useTheme();
  const navTheme = {
    ...(theme.name === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.name === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.bgElevated,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen
          name="AddHabit"
          component={AddHabitScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
