import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LaundryBooking } from '../api/types';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import FormBanner from '../components/FormBanner';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import ServiceCard from '../components/ServiceCard';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { images } from '../data/images';
import { SERVICES } from '../data/services';
import { useApi } from '../hooks/useApi';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { Service } from '../types/Service';
import { formatDayMonth, formatToday, getGreetingKey } from '../utils/format';

type Filter = 'all' | 'favorites';

const GRID_GAP = spacing.md;
/** Ширина, начиная с которой считаем устройство планшетом */
const TABLET_BREAKPOINT = 600;
/** На очень широких экранах контент не растягивается бесконечно */
const MAX_CONTENT_WIDTH = 960;

const HOME_SERVICES = SERVICES.filter((service) => !service.hidden);

export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { favorites, isFavorite, toggleFavorite } = useAppData();
  const [filter, setFilter] = useState<Filter>('all');
  const now = useNow();
  const focused = useIsFocused();
  // Напоминание о ближайшей стирке: запрашиваем, когда экран открыт и пользователь вошёл
  const bookings = useApi<{ bookings: LaundryBooking[] }>(user && focused ? '/api/laundry/bookings' : null);
  const nextBooking = user ? bookings.data?.bookings[0] : undefined;

  // Адаптивная сетка: число колонок зависит от ширины экрана (2 — телефон, 3 — планшет),
  // а ширина карточки считается от фактической ширины сетки (onLayout) — так учитываются
  // любые отступы и полосы прокрутки. При повороте экрана всё пересчитывается.
  const { width } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const columns = width >= TABLET_BREAKPOINT ? 3 : 2;
  const availableWidth = gridWidth || Math.min(width, MAX_CONTENT_WIDTH) - SCREEN_PADDING * 2;
  const cardWidth = Math.floor((availableWidth - GRID_GAP * (columns - 1)) / columns);

  const visibleServices = filter === 'favorites' ? HOME_SERVICES.filter((service) => isFavorite(service.id)) : HOME_SERVICES;

  const openService = (service: Service) => {
    if (service.route) navigation.navigate(service.route);
    else navigation.navigate('ServiceDetails', { serviceId: service.id });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.content, { maxWidth: MAX_CONTENT_WIDTH }]}>
          <TopBar label={t('appName')} />

          <View style={styles.titleBlock}>
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              {t(getGreetingKey(now))}
              {user ? `, ${user.firstName}` : ''} · {formatToday(now, language)}
            </Text>
            <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
              {t('homeTitle')}
            </Text>
            <Text style={[type.caption, { color: colors.textSecondary }]}>{t('homeSubtitle')}</Text>
          </View>

          {nextBooking ? (
            <FormBanner
              kind="info"
              text={t('laundryReminder', { date: formatDayMonth(new Date(`${nextBooking.date}T00:00:00`), language), time: nextBooking.slot, machine: nextBooking.machine })}
            />
          ) : null}

          {/* Самое нужное сверху, чтобы не прокручивать главную вниз */}
          <View style={styles.quickRow}>
            {[
              { title: t('quickSchedule'), image: images.serviceCal, onPress: () => navigation.navigate('ServiceDetails', { serviceId: 'cal' }) },
              { title: t('quickReading'), image: images.serviceLib, onPress: () => navigation.navigate('ServiceDetails', { serviceId: 'lib' }) },
              { title: t('quickPlan'), image: images.news2, onPress: () => navigation.navigate('ServiceDetails', { serviceId: 'lib', tab: 'plan' }) },
            ].map((item) => (
              <Pressable key={item.title} onPress={item.onPress} accessibilityRole="button" accessibilityLabel={item.title} style={({ pressed }) => [styles.quickCard, pressed && styles.quickPressed]}>
                <ImageBackground source={item.image} style={styles.quickImage} imageStyle={styles.quickRadius}>
                  <LinearGradient colors={['rgba(4, 6, 15, 0.1)', 'rgba(4, 6, 15, 0.88)'] as const} style={[StyleSheet.absoluteFill, styles.quickRadius]} />
                  <Text style={styles.quickTitle}>{item.title}</Text>
                </ImageBackground>
              </Pressable>
            ))}
          </View>

          <SectionHeader
            title={t('servicesTitle')}
            right={
              <>
                <Chip label={`${t('filterAll')} ${HOME_SERVICES.length}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
                <Chip label={`${t('filterFavorites')} ${favorites.filter((id) => HOME_SERVICES.some((s) => s.id === id)).length}`} icon="star" selected={filter === 'favorites'} onPress={() => setFilter('favorites')} />
              </>
            }
          />

          {/* Адаптивная сетка карточек: flexDirection row + flexWrap wrap + gap */}
          {visibleServices.length > 0 ? (
            <View style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
              {visibleServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  width={cardWidth}
                  isFavorite={isFavorite(service.id)}
                  onPress={() => openService(service)}
                  onToggleFavorite={() => toggleFavorite(service.id)}
                />
              ))}
            </View>
          ) : (
            <EmptyState icon="star-outline" title={t('emptyFavTitle')} message={t('emptyFavText')} actionLabel={t('showAll')} onAction={() => setFilter('all')} />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.xl,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickCard: {
    flex: 1,
    borderRadius: radius.md,
  },
  quickPressed: {
    opacity: 0.85,
  },
  quickImage: {
    width: '100%',
    height: 112,
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  quickRadius: {
    borderRadius: radius.md,
  },
  quickTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
});
