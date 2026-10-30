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
import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import { CampusProvider, useCampus } from './src/context/CampusContext';
import { LanguageProvider, useI18n } from './src/i18n/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

/** Минимальное время показа экрана загрузки, чтобы анимация успела проиграться */
const MIN_SPLASH_MS = 1800;

/**
 * Точка входа Campus Hub.
 * App.tsx только подключает шрифты, провайдеры (безопасные области, тема, язык, данные)
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
        <LanguageProvider>
          <AppDataProvider>
            <CampusProvider>
              <Root />
            </CampusProvider>
          </AppDataProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { isDark, ready: themeReady } = useTheme();
  const { ready: languageReady } = useI18n();
  const { ready: dataReady } = useAppData();
  const { ready: campusReady } = useCampus();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = themeReady && languageReady && dataReady && campusReady && minTimePassed;

  return (
    <>
      <StatusBar style={!ready || isDark ? 'light' : 'dark'} />
      {ready ? <AppNavigator /> : <LoadingScreen />}
    </>
  );
}
