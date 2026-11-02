import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useI18n } from '../i18n/LanguageContext';
import AdminScreen from '../screens/AdminScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import InfoDetailScreen from '../screens/InfoDetailScreen';
import InfoScreen from '../screens/InfoScreen';
import JournalScreen from '../screens/JournalScreen';
import LibraryScreen from '../screens/LibraryScreen';
import LoginScreen from '../screens/LoginScreen';
import PlannerScreen from '../screens/PlannerScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RequestsScreen from '../screens/RequestsScreen';
import ServiceDetailsScreen from '../screens/ServiceDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import StudentsScreen from '../screens/StudentsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import TransportScreen from '../screens/TransportScreen';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/** Иконки вкладок: [активная, неактивная] */
const TAB_ICONS: Record<keyof MainTabParamList, [IoniconName, IoniconName]> = {
  Home: ['home', 'home-outline'],
  Library: ['library', 'library-outline'],
  Transport: ['bus', 'bus-outline'],
  Info: ['information-circle', 'information-circle-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

function MainTabs() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        // Размер подписей постоянный: при большем шрифте пять вкладок не помещаются в ряд на телефоне
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 10 },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabHome') }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: t('tabLibrary') }} />
      <Tab.Screen name="Transport" component={TransportScreen} options={{ title: t('tabTransport') }} />
      <Tab.Screen name="Info" component={InfoScreen} options={{ title: t('tabInfo') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabProfile') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();

  // Тема React Navigation синхронизирована с темой приложения
  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.tabBar,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colors, isDark]);

  // Просматривать открытые разделы можно без входа. Личные разделы закрыты компонентом AuthGate,
  // а все данные дополнительно защищает сервер.
  return (
    <NavigationContainer theme={navigationTheme} documentTitle={{ formatter: () => 'Campus Hub' }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Forgot" component={ForgotPasswordScreen} />
        <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
        <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
        <Stack.Screen name="InfoDetail" component={InfoDetailScreen} />
        <Stack.Screen name="Students" component={StudentsScreen} />
        <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
        <Stack.Screen name="Journal" component={JournalScreen} />
        <Stack.Screen name="Planner" component={PlannerScreen} />
        <Stack.Screen name="Requests" component={RequestsScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
