import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import ServiceCard from '../components/ServiceCard';
import SubscriptionBanner from '../components/SubscriptionBanner';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { NEWS } from '../data/info';
import { SERVICES } from '../data/services';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { addDays, formatDayMonth, formatToday, getGreetingKey } from '../utils/format';

type Filter = 'all' | 'favorites';

const GRID_GAP = spacing.md;
/** Ширина, начиная с которой считаем устройство планшетом */
const TABLET_BREAKPOINT = 600;
/** На очень широких экранах контент не растягивается бесконечно */
const MAX_CONTENT_WIDTH = 960;

export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const { session, favorites, isFavorite, toggleFavorite } = useAppData();
  const [filter, setFilter] = useState<Filter>('all');
  const now = useNow();

  // Адаптивная сетка: число колонок зависит от ширины экрана (2 — телефон, 3 — планшет),
  // а ширина карточки считается от фактической ширины сетки (onLayout) — так учитываются
  // любые отступы и полосы прокрутки. При повороте экрана всё пересчитывается.
  const { width } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const columns = width >= TABLET_BREAKPOINT ? 3 : 2;
  const availableWidth = gridWidth || Math.min(width, MAX_CONTENT_WIDTH) - SCREEN_PADDING * 2;
  const cardWidth = Math.floor((availableWidth - GRID_GAP * (columns - 1)) / columns);

  const visibleServices = filter === 'favorites' ? SERVICES.filter((service) => isFavorite(service.id)) : SERVICES;
  const openService = (serviceId: (typeof SERVICES)[number]['id']) => navigation.navigate('ServiceDetails', { serviceId });

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.content, { maxWidth: MAX_CONTENT_WIDTH }]}>
          {/* Профиль и настройки — только в нижней навигации, поэтому в шапке лишь название */}
          <TopBar label={t('appName')} />

          {/* Крупный заголовок, как в примерах дизайна */}
          <View style={styles.titleBlock}>
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              {t(getGreetingKey(now))}, {session?.login} · {formatToday(now, language)}
            </Text>
            <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
              {t('homeTitle')}
            </Text>
            <Text style={[type.caption, { color: colors.textSecondary }]}>{t('homeSubtitle')}</Text>
          </View>

          {/* Точка входа в подписку */}
          <SubscriptionBanner onPress={() => navigation.navigate('Subscription')} />

          {/* Новости кампуса: горизонтальная лента, по нажатию открывается раздел «Информация» */}
          <SectionHeader title={t('homeNews')} right={<Chip label={t('allNews')} onPress={() => openService('info')} />} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newsRow}>
            {NEWS.map((news) => (
              <Pressable
                key={news.id}
                onPress={() => openService('info')}
                accessibilityRole="button"
                accessibilityLabel={tr(news.title)}
                style={({ pressed }) => [styles.newsCard, pressed && styles.pressed]}
              >
                <ImageBackground source={news.image} style={styles.newsImage} imageStyle={styles.newsImageRadius}>
                  <LinearGradient
                    colors={['rgba(4,6,15,0.05)', 'rgba(4,6,15,0.9)'] as const}
                    style={[StyleSheet.absoluteFill, styles.newsImageRadius]}
                  />
                  <Text style={styles.newsDate}>{formatDayMonth(addDays(now, -news.daysAgo), language)}</Text>
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {tr(news.title)}
                  </Text>
                </ImageBackground>
              </Pressable>
            ))}
          </ScrollView>

          <SectionHeader
            title={t('servicesTitle')}
            right={
              <>
                <Chip label={`${t('filterAll')} ${SERVICES.length}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
                <Chip
                  label={`${t('filterFavorites')} ${favorites.length}`}
                  icon="star"
                  selected={filter === 'favorites'}
                  onPress={() => setFilter('favorites')}
                />
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
                  onPress={() => openService(service.id)}
                  onToggleFavorite={() => toggleFavorite(service.id)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="star-outline"
              title={t('emptyFavTitle')}
              message={t('emptyFavText')}
              actionLabel={t('showAll')}
              onAction={() => setFilter('all')}
            />
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
    gap: spacing.md,
  },
  quickItem: {
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.7,
  },
  widgets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  widget: {
    flexGrow: 1,
    flexBasis: 260,
    justifyContent: 'space-between',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  newsRow: {
    gap: GRID_GAP,
  },
  newsCard: {
    width: 260,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 150,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    gap: 4,
  },
  newsImageRadius: {
    borderRadius: radius.lg,
  },
  newsDate: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  newsTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 19,
    color: '#FFFFFF',
  },
});
