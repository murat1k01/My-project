import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import AdminScreen from '../screens/AdminScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import EventRegistrationScreen from '../screens/EventRegistrationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import InfoDetailScreen from '../screens/InfoDetailScreen';
import InfoScreen from '../screens/InfoScreen';
import JournalScreen from '../screens/JournalScreen';
import LibraryScreen from '../screens/LibraryScreen';
import LoginScreen from '../screens/LoginScreen';
import PaymentScreen from '../screens/PaymentScreen';
import AssistantScreen from '../screens/AssistantScreen';
import ChatScreen from '../screens/ChatScreen';
import MessagesScreen, { MessagesView } from '../screens/MessagesScreen';
import SearchScreen from '../screens/SearchScreen';
import StudentCardScreen from '../screens/StudentCardScreen';
import CareersScreen from '../screens/CareersScreen';
import AllServicesScreen from '../screens/AllServicesScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import LostFoundScreen from '../screens/LostFoundScreen';
import StudyRoomScreen from '../screens/StudyRoomScreen';
import WalletScreen from '../screens/WalletScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import CampusMapScreen from '../screens/CampusMapScreen';
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
import { useFontScale } from '../theme/FontScaleContext';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import type { MainTabParamList, MainTabScreenProps, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/** Иконки вкладок: [активная, неактивная] */
const TAB_ICONS: Record<keyof MainTabParamList, [IoniconName, IoniconName]> = {
  Home: ['home', 'home-outline'],
  Inbox: ['mail-unread', 'mail-unread-outline'],
  Search: ['search', 'search-outline'],
  Profile: ['person', 'person-outline'],
};

/** Вкладка «Хабарлама»: тот же список переписок, что и экран сообщений, но без кнопки «Назад». */
function InboxTab({ navigation }: MainTabScreenProps<'Inbox'>) {
  return <MessagesView onOpenChat={(userId, name) => navigation.navigate('Chat', { userId, name })} />;
}

function MainTabs() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { scale } = useFontScale();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // Плавный переход между вкладками
        animation: 'shift',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        // Подписи следуют настройке размера текста, но ограничены, чтобы пять вкладок помещались в ряд
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: Math.min(11 * scale, 13) },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name];
          // Активная вкладка отмечена тонкой золотой чертой над иконкой
          return (
            <View style={tabStyles.iconWrap}>
              {focused ? <View style={[tabStyles.indicator, { backgroundColor: colors.gold }]} /> : null}
              <Ionicons name={focused ? active : inactive} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabHome') }} />
      <Tab.Screen name="Inbox" component={InboxTab} options={{ title: t('tabInbox') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t('tabSearch') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabProfile') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

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

  // Без входа доступны только экраны входа и регистрации. Как только пользователь вошёл или вышел,
  // навигатор сам переключает набор экранов. Все данные дополнительно защищает сервер.
  return (
    <NavigationContainer theme={navigationTheme} documentTitle={{ formatter: () => 'ALTushki' }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
            <Stack.Screen name="Library" component={LibraryScreen} />
            <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
            <Stack.Screen name="Transport" component={TransportScreen} />
            <Stack.Screen name="Info" component={InfoScreen} />
            <Stack.Screen name="InfoDetail" component={InfoDetailScreen} />
            <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
            <Stack.Screen name="Requests" component={RequestsScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="EventRegistration" component={EventRegistrationScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Assistant" component={AssistantScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Journal" component={JournalScreen} />
            <Stack.Screen name="Students" component={StudentsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="StudentCard" component={StudentCardScreen} />
            <Stack.Screen name="Careers" component={CareersScreen} />
            <Stack.Screen name="AllServices" component={AllServicesScreen} />
            <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
            <Stack.Screen name="LostFound" component={LostFoundScreen} />
            <Stack.Screen name="StudyRoom" component={StudyRoomScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
            <Stack.Screen name="CampusMap" component={CampusMapScreen} />
          </>
        ) : (
          <>
            {/* При выходе экран входа появляется с анимацией «назад» */}
            <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Forgot" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: -9,
    width: 22,
    height: 2,
    borderRadius: 1,
  },
});
