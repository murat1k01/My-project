import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashView from './src/components/SplashView';
import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CampusProvider, useCampus } from './src/context/CampusContext';
import { LanguageProvider, useI18n } from './src/i18n/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { FontScaleProvider, useFontScale } from './src/theme/FontScaleContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

/** Минимальное время показа логотипа, чтобы анимация успела проиграться */
const MIN_SPLASH_MS = 1600;

/**
 * Точка входа Campus Hub.
 * App.tsx только подключает шрифты, провайдеры (безопасные области, тема, язык, вход, данные)
 * и навигацию — вся логика вынесена в папку src/.
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Пока шрифты грузятся (доли секунды) — просто фирменный тёмный фон.
  // Если шрифты не загрузились, приложение всё равно запускается с системным шрифтом.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#04060F' }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FontScaleProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppDataProvider>
                <CampusProvider>
                  <Root />
                </CampusProvider>
              </AppDataProvider>
            </AuthProvider>
          </LanguageProvider>
        </FontScaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { isDark, ready: themeReady } = useTheme();
  const { ready: fontScaleReady } = useFontScale();
  const { ready: languageReady, t } = useI18n();
  const { ready: authReady } = useAuth();
  const { ready: dataReady } = useAppData();
  const { ready: campusReady } = useCampus();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = themeReady && fontScaleReady && languageReady && authReady && dataReady && campusReady && minTimePassed;

  return (
    <>
      <StatusBar style={!ready || isDark ? 'light' : 'dark'} />
      {ready ? <AppNavigator /> : <SplashView message={t('loading')} />}
    </>
  );
}
