import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import GlassCard from '../components/GlassCard';
import IconButton from '../components/IconButton';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import ServiceCard from '../components/ServiceCard';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { useCampus } from '../context/CampusContext';
import { getNextDepartures, getRoute } from '../data/buses';
import { NEWS } from '../data/info';
import { findCurrentOrNextLesson } from '../data/schedule';
import { SERVICES } from '../data/services';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { addDays, formatDayMonth, formatToday, getGreetingKey, minutesOfDay } from '../utils/format';

type Filter = 'all' | 'favorites';

const GRID_GAP = spacing.md;
/** Ширина, начиная с которой считаем устройство планшетом */
const TABLET_BREAKPOINT = 600;
/** На очень широких экранах контент не растягивается бесконечно */
const MAX_CONTENT_WIDTH = 960;

export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, tr, language } = useI18n();
  const { session, favorites, isFavorite, toggleFavorite } = useAppData();
  const { campus } = useCampus();
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

  // Виджеты на реальных данных расписания и выбранного маршрута
  const lessonInfo = findCurrentOrNextLesson(now);
  const myRoute = getRoute(campus.myRouteId);
  const nextBus = myRoute ? getNextDepartures(myRoute, now, 1)[0] : undefined;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.content, { maxWidth: MAX_CONTENT_WIDTH }]}>
          <TopBar
            label={t('appName')}
            right={
              <>
                <IconButton
                  icon={isDark ? 'sunny-outline' : 'moon-outline'}
                  accessibilityLabel={isDark ? t('themeLight') : t('themeDark')}
                  onPress={toggleTheme}
                />
                <IconButton icon="person-outline" accessibilityLabel={t('openProfile')} onPress={() => navigation.navigate('Profile')} />
              </>
            }
          />

          {/* Заголовок как «Search & Book Flights» в референсе */}
          <View style={styles.titleBlock}>
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              {t(getGreetingKey(now))}, {session?.login} · {formatToday(now, language)}
            </Text>
            <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
              {t('homeTitle')}
            </Text>
            <Text style={[type.caption, { color: colors.textSecondary }]}>{t('homeSubtitle')}</Text>
          </View>

          {/* Быстрый доступ: круглые иконки сервисов */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            {SERVICES.map((service) => (
              <Pressable
                key={service.id}
                onPress={() => openService(service.id)}
                accessibilityRole="button"
                accessibilityLabel={tr(service.title)}
                style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}
              >
                <View style={[styles.quickIcon, { backgroundColor: colors.glass, borderColor: colors.border }]}>
                  <Ionicons name={service.icon} size={20} color={colors.text} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>{service.code}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Виджеты: следующая пара и ближайший автобус */}
          <View style={styles.widgets}>
            <GlassCard style={styles.widget}>
              <View style={styles.widgetHeader}>
                <Text style={[type.label, { color: colors.textMuted }]}>{t('nextLesson').toUpperCase()}</Text>
                <View style={[styles.widgetIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="calendar" size={16} color={colors.onPrimary} />
                </View>
              </View>
              {lessonInfo ? (
                <View>
                  <Text style={[type.title, { color: colors.text }]}>
                    {lessonInfo.lesson.start}
                    {lessonInfo.status === 'now' ? <Text style={[type.caption, { color: colors.success }]}>  ● {t('lessonNow')}</Text> : null}
                  </Text>
                  <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={1}>
                    {tr(lessonInfo.lesson.subject)}
                  </Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]}>
                    {t('room', { room: lessonInfo.lesson.room })} · {lessonInfo.lesson.teacher}
                  </Text>
                </View>
              ) : (
                <Text style={[type.body, { color: colors.textSecondary }]}>{t('noMoreLessons')}</Text>
              )}
              <PrimaryButton title={t('openSchedule')} compact arrow onPress={() => openService('cal')} />
            </GlassCard>

            <GlassCard style={styles.widget}>
              <View style={styles.widgetHeader}>
                <Text style={[type.label, { color: colors.textMuted }]}>{t('nextBus').toUpperCase()}</Text>
                <View style={[styles.widgetIcon, { backgroundColor: myRoute?.color ?? colors.primary }]}>
                  <Ionicons name="bus" size={16} color="#FFFFFF" />
                </View>
              </View>
              {myRoute ? (
                <View>
                  <Text style={[type.title, { color: colors.text }]}>
                    №{myRoute.number}{' '}
                    <Text style={[type.caption, { color: colors.textSecondary }]}>
                      {nextBus !== undefined ? t('busIn', { min: nextBus - minutesOfDay(now) }) : '—'}
                    </Text>
                  </Text>
                  <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={1}>
                    {tr(myRoute.name)}
                  </Text>
                </View>
              ) : (
                <Text style={[type.body, { color: colors.textSecondary }]}>{t('noRouteChosen')}</Text>
              )}
              <PrimaryButton title={myRoute ? t('openService') : t('chooseRoute')} compact arrow onPress={() => openService('bus')} />
            </GlassCard>
          </View>

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
