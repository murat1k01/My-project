import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { LaundryBooking } from '../api/types';
import { Text } from '../components/AppText';
import CallButton, { PROJECT_PHONE } from '../components/CallButton';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import FormBanner from '../components/FormBanner';
import GlassCard from '../components/GlassCard';
import IconButton from '../components/IconButton';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import ServiceCard from '../components/ServiceCard';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { SERVICES } from '../data/services';
import { useApi } from '../hooks/useApi';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { SCREEN_PADDING, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { Service } from '../types/Service';
import { formatDayMonth, formatPhone, formatToday, getGreetingKey } from '../utils/format';

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
          <TopBar label={t('appName')} right={<IconButton icon="settings-outline" variant="glass" accessibilityLabel={t('settingsTitle')} onPress={() => navigation.navigate('Settings')} />} />

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

          {!user ? <PrimaryButton title={t('signIn')} arrow onPress={() => navigation.navigate('Login')} /> : null}

          {nextBooking ? (
            <FormBanner
              kind="info"
              text={t('laundryReminder', { date: formatDayMonth(new Date(`${nextBooking.date}T00:00:00`), language), time: nextBooking.slot, machine: nextBooking.machine })}
            />
          ) : null}

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

          <GlassCard>
            <Text style={[type.subheading, { color: colors.text }]}>{t('contactProject')}</Text>
            <Text style={[type.body, { color: colors.textSecondary }]}>{formatPhone(PROJECT_PHONE)}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('contactProjectNote')}</Text>
            <CallButton compact />
          </GlassCard>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
});
