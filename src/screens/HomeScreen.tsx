import { useState } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { LaundryBooking } from '../api/types';
import { LogoMark } from '../components/AnimatedLogo';
import { Text } from '../components/AppText';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import FormBanner from '../components/FormBanner';
import IconButton from '../components/IconButton';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import ServiceCard from '../components/ServiceCard';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { images } from '../data/images';
import { SERVICES } from '../data/services';
import { useApi } from '../hooks/useApi';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { brand, SLOGAN } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { Service } from '../types/Service';
import { formatDayMonth, formatToday, getGreetingKey } from '../utils/format';

type Filter = 'all' | 'favorites';

const GRID_GAP = spacing.sm + 2;
/** Ширина, начиная с которой считаем устройство планшетом */
const TABLET_BREAKPOINT = 600;
/** На очень широких экранах контент не растягивается бесконечно */
const MAX_CONTENT_WIDTH = 960;
const BANNER_HEIGHT = 210;

const HOME_SERVICES = SERVICES.filter((service) => !service.hidden);

/** Главный экран в стиле Oxford Academic Premium: шапка студента, баннер с фото Оксфорда, быстрые карточки и плитки сервисов. */
export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { colors, isDark } = useTheme();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { favorites, isFavorite, toggleFavorite } = useAppData();
  const [filter, setFilter] = useState<Filter>('all');
  const now = useNow();
  const focused = useIsFocused();
  // Напоминание о ближайшей стирке: запрашиваем, когда экран открыт и пользователь вошёл
  const bookings = useApi<{ bookings: LaundryBooking[] }>(user && focused ? '/api/laundry/bookings' : null);
  const nextBooking = user ? bookings.data?.bookings[0] : undefined;
  // Непрочитанные сообщения — значок на колокольчике
  const chats = useApi<{ chats: { unread: number }[] }>(user && focused ? '/api/messages' : null);
  const unread = (chats.data?.chats ?? []).reduce((sum, chat) => sum + chat.unread, 0);

  // Параллакс баннера: фото сдвигается медленнее, чем прокручивается экран
  const [scrollY] = useState(() => new Animated.Value(0));
  const photoShift = scrollY.interpolate({ inputRange: [-100, 0, 300], outputRange: [-30, 0, 90], extrapolate: 'clamp' });

  // Адаптивная сетка: 3 колонки на телефоне, 4 на планшете; ширина плитки считается от фактической ширины сетки
  const { width } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const columns = width >= TABLET_BREAKPOINT ? 4 : 3;
  const availableWidth = gridWidth || Math.min(width, MAX_CONTENT_WIDTH) - SCREEN_PADDING * 2;
  const cardWidth = Math.floor((availableWidth - GRID_GAP * (columns - 1)) / columns);

  const visibleServices = filter === 'favorites' ? HOME_SERVICES.filter((service) => isFavorite(service.id)) : HOME_SERVICES;
  const headingColor = isDark ? colors.text : colors.primary;

  const openService = (service: Service) => {
    if (service.route) navigation.navigate(service.route);
    else navigation.navigate('ServiceDetails', { serviceId: service.id });
  };

  return (
    <ScreenContainer>
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <View style={[styles.content, { maxWidth: MAX_CONTENT_WIDTH }]}>
          {/* Шапка: логотип, приветствие, уведомления и фото профиля */}
          <View style={styles.header}>
            <LogoMark size={40} />
            <View style={styles.headerText}>
              <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {t(getGreetingKey(now))} · {formatToday(now, language)}
              </Text>
              <Text style={[styles.name, { color: headingColor }]} numberOfLines={1}>
                {user ? `${user.firstName} ${user.lastName}` : 'ALTushki'}
              </Text>
              {user ? (
                <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
                  {[user.faculty, t('courseN', { n: user.course })].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            {user ? <IconButton icon="notifications-outline" variant="glass" badge={unread} accessibilityLabel={t('msgTitle')} onPress={() => navigation.navigate('Messages')} /> : null}
            {user ? (
              <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel={t('tabProfile')} style={[styles.avatarRing, { borderColor: colors.gold }]}>
                <Avatar firstName={user.firstName} lastName={user.lastName} seed={user.id} size={40} photo={user.photo} />
              </Pressable>
            ) : null}
          </View>

          {/* Баннер с фото Оксфорда: дневное в светлой теме, вечернее в тёмной */}
          <View style={[styles.banner, { shadowColor: colors.shadow }]}>
            <Animated.Image
              source={isDark ? images.oxfordEvening : images.oxfordDay}
              style={[styles.bannerPhoto, { transform: [{ translateY: photoShift }, { scale: 1.15 }] }]}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <LinearGradient colors={brand.photoShade} style={StyleSheet.absoluteFill} />
            <View style={[styles.bannerFrame, { borderColor: 'rgba(197, 164, 109, 0.55)' }]} pointerEvents="none" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>ALTushki</Text>
              <View style={styles.goldRule} />
              <Text style={styles.bannerSlogan}>{SLOGAN}</Text>
            </View>
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
              <Pressable key={item.title} onPress={item.onPress} accessibilityRole="button" accessibilityLabel={item.title} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
                <ImageBackground source={item.image} style={styles.quickImage} imageStyle={styles.quickRadius}>
                  <LinearGradient colors={['rgba(12, 35, 63, 0.05)', 'rgba(12, 35, 63, 0.9)'] as const} style={[StyleSheet.absoluteFill, styles.quickRadius]} />
                  <View style={styles.quickRule} />
                  <Text style={styles.quickTitle}>{item.title}</Text>
                </ImageBackground>
              </Pressable>
            ))}
          </View>

          {/* Помощник ALT AI */}
          <Pressable onPress={() => navigation.navigate('Assistant')} accessibilityRole="button" accessibilityLabel={t('aiTitle')} style={({ pressed }) => [styles.aiCard, pressed && styles.pressed]}>
            <LinearGradient colors={['#1A3557', '#0C233F'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiInner}>
              <View style={styles.aiIcon}>
                <Ionicons name="sparkles-outline" size={22} color={brand.gold} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.aiTitle}>{t('aiTitle')}</Text>
                <Text style={styles.aiText} numberOfLines={2}>
                  {t('homeAiText')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={brand.gold} />
            </LinearGradient>
          </Pressable>

          <SectionHeader
            title={t('servicesTitle')}
            right={
              <>
                <Chip label={`${t('filterAll')} ${HOME_SERVICES.length}`} selected={filter === 'all'} onPress={() => setFilter('all')} />
                <Chip label={`${t('filterFavorites')} ${favorites.filter((id) => HOME_SERVICES.some((s) => s.id === id)).length}`} icon="star" selected={filter === 'favorites'} onPress={() => setFilter('favorites')} />
              </>
            }
          />

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
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontFamily: fonts.serifBold,
    fontSize: 24,
    lineHeight: 28,
  },
  avatarRing: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 2,
  },
  banner: {
    height: BANNER_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  bannerPhoto: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT + 80,
    width: '100%',
  },
  bannerFrame: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderRadius: radius.lg - 8,
  },
  bannerText: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  bannerTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 38,
    lineHeight: 42,
    color: brand.ivory,
  },
  goldRule: {
    width: 56,
    height: 1,
    backgroundColor: brand.gold,
  },
  bannerSlogan: {
    fontFamily: fonts.serif,
    fontSize: 19,
    lineHeight: 24,
    color: '#EDE3CF',
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickCard: {
    flex: 1,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  quickImage: {
    width: '100%',
    height: 112,
    justifyContent: 'flex-end',
    padding: spacing.sm,
    gap: 6,
  },
  quickRadius: {
    borderRadius: radius.md,
  },
  quickRule: {
    width: 18,
    height: 1,
    backgroundColor: brand.gold,
  },
  quickTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  aiCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  aiInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.45)',
  },
  aiIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 21,
    lineHeight: 25,
    color: brand.ivory,
  },
  aiText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(245, 240, 230, 0.8)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
});
