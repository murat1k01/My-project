import { useState } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LaundryBooking } from '../api/types';
import AcademicTile from '../components/AcademicTile';
import { LogoMark } from '../components/AnimatedLogo';
import { Text } from '../components/AppText';
import Avatar from '../components/Avatar';
import FormBanner from '../components/FormBanner';
import PhotoCarousel, { Slide } from '../components/PhotoCarousel';
import SectionHeader from '../components/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { images } from '../data/images';
import { useApi } from '../hooks/useApi';
import { useAppear } from '../hooks/useAppear';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { brand, SLOGAN } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import { formatDayMonth, getGreetingKey } from '../utils/format';

const GRID_GAP = spacing.sm + 2;
/** На очень широких экранах контент не растягивается бесконечно */
const MAX_CONTENT_WIDTH = 760;

/**
 * Главный экран Oxford Academic Heritage: тёмно-синяя полоса с логотипом, приветствие студента,
 * баннер с фото Оксфорда, сетка 3 × 3 основных сервисов, студенческий билет и университетские разделы.
 */
export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { colors, isDark } = useTheme();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const focused = useIsFocused();
  const appear = useAppear(16);
  // Напоминание о ближайшей стирке и непрочитанные сообщения: запрашиваем, когда экран открыт
  const bookings = useApi<{ bookings: LaundryBooking[] }>(user && focused ? '/api/laundry/bookings' : null);
  const nextBooking = user ? bookings.data?.bookings[0] : undefined;
  const chats = useApi<{ chats: { unread: number }[] }>(user && focused ? '/api/messages' : null);
  const unread = (chats.data?.chats ?? []).reduce((sum, chat) => sum + chat.unread, 0);

  // Параллакс баннера: фото сдвигается медленнее, чем прокручивается экран
  const [scrollY] = useState(() => new Animated.Value(0));
  const photoShift = scrollY.interpolate({ inputRange: [-100, 0, 300], outputRange: [-30, 0, 90], extrapolate: 'clamp' });

  const { width } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const availableWidth = gridWidth || Math.min(width, MAX_CONTENT_WIDTH) - SCREEN_PADDING * 2;
  const tileWidth = Math.floor((availableWidth - GRID_GAP * 2) / 3);
  const heading = isDark ? colors.text : colors.primary;

  const slides: Slide[] = [
    { image: isDark ? images.oxfordEvening : images.oxfordDay, title: 'ALTushki', subtitle: SLOGAN },
    { image: images.oxfordSunset, title: t('slideStudyTitle'), subtitle: t('slideStudyText') },
    { image: images.serviceLib, title: t('slideLibTitle'), subtitle: t('slideLibText') },
    { image: images.serviceDorm, title: t('slideCampusTitle'), subtitle: t('slideCampusText') },
  ];

  const grid: { icon: IoniconName; label: string; onPress: () => void }[] = [
    { icon: 'calendar-outline', label: t('gridSchedule'), onPress: () => navigation.navigate('ServiceDetails', { serviceId: 'cal' }) },
    { icon: 'book-outline', label: t('gridLibrary'), onPress: () => navigation.navigate('Library') },
    { icon: 'stats-chart-outline', label: t('gridGpa'), onPress: () => navigation.navigate('Journal') },
    { icon: 'bus-outline', label: t('gridTransport'), onPress: () => navigation.navigate('Transport') },
    { icon: 'restaurant-outline', label: t('gridFood'), onPress: () => navigation.navigate('ServiceDetails', { serviceId: 'food' }) },
    { icon: 'bed-outline', label: t('gridDorm'), onPress: () => navigation.navigate('ServiceDetails', { serviceId: 'dorm' }) },
    { icon: 'briefcase-outline', label: t('gridCareers'), onPress: () => navigation.navigate('Careers') },
    { icon: 'sparkles-outline', label: t('gridAi'), onPress: () => navigation.navigate('Assistant') },
    { icon: 'grid-outline', label: t('gridAll'), onPress: () => navigation.navigate('AllServices') },
  ];

  const campus: { image: typeof images.serviceInfo; title: string; text: string; onPress: () => void }[] = [
    { image: images.serviceInfo, title: t('homeNewsTitle'), text: t('homeNewsText'), onPress: () => navigation.navigate('Info') },
    { image: images.news2, title: t('homeEventsTitle'), text: t('homeEventsText'), onPress: () => navigation.navigate('EventRegistration') },
    { image: images.serviceDorm, title: t('homeStudentsTitle'), text: t('homeStudentsText'), onPress: () => navigation.navigate('Students') },
  ];

  // Студенческие сервисы: объявления, комнаты, кошелёк, документы и список студентов
  const extra: { icon: IoniconName; label: string; onPress: () => void }[] = [
    { icon: 'storefront-outline', label: t('mpTitle'), onPress: () => navigation.navigate('Marketplace') },
    { icon: 'search-circle-outline', label: t('lfTitle'), onPress: () => navigation.navigate('LostFound') },
    { icon: 'easel-outline', label: t('srTitle'), onPress: () => navigation.navigate('StudyRoom') },
    { icon: 'wallet-outline', label: t('walletTitle'), onPress: () => navigation.navigate('Wallet') },
    { icon: 'document-text-outline', label: t('docTitle'), onPress: () => navigation.navigate('Documents') },
    { icon: 'map-outline', label: t('mapTitle'), onPress: () => navigation.navigate('CampusMap') },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Тёмно-синяя полоса с логотипом */}
      <View style={[styles.bar, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? brand.midnight : brand.navy }]}>
        <LogoMark size={38} />
        <View style={styles.flex}>
          <Text style={styles.barTitle}>ALTushki</Text>
          <Text style={styles.barSubtitle}>ALT UNIVERSITY</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Inbox')} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('msgTitle')} style={styles.bell}>
          <Ionicons name="notifications-outline" size={24} color={brand.ivory} />
          {unread > 0 ? <View style={styles.bellDot} /> : null}
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Animated.View style={[styles.content, appear]}>
          {/* Приветствие студента */}
          <View style={styles.greeting}>
            <View style={styles.flex}>
              <Text style={[styles.hello, { color: heading }]}>{t(getGreetingKey(now))},</Text>
              <Text style={[styles.name, { color: heading }]} numberOfLines={1}>
                {user ? `${user.firstName}!` : 'ALTushki'}
              </Text>
              {user ? (
                <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[t('courseN', { n: user.course }), user.faculty].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            {user ? (
              <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel={t('tabProfile')} style={[styles.avatarRing, { borderColor: colors.gold }]}>
                <Avatar firstName={user.firstName} lastName={user.lastName} seed={user.id} size={58} photo={user.photo} />
              </Pressable>
            ) : null}
          </View>

          <PhotoCarousel slides={slides} parallax={photoShift} />

          {nextBooking ? (
            <FormBanner
              kind="info"
              text={t('laundryReminder', { date: formatDayMonth(new Date(`${nextBooking.date}T00:00:00`), language), time: nextBooking.slot, machine: nextBooking.machine })}
            />
          ) : null}

          {/* Основные сервисы: сетка 3 × 3 */}
          <View style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
            {grid.map((item) => (
              <AcademicTile key={item.label} icon={item.icon} label={item.label} width={tileWidth} onPress={item.onPress} />
            ))}
          </View>

          {/* Быстрый доступ к студенческому билету */}
          <Pressable onPress={() => navigation.navigate('StudentCard')} accessibilityRole="button" accessibilityLabel={t('cardTitle')} style={({ pressed }) => [styles.cardLink, pressed && styles.pressed]}>
            <LinearGradient colors={[brand.deepNavy, brand.navy] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardLinkInner}>
              <LogoMark size={46} />
              <View style={styles.flex}>
                <Text style={styles.cardLinkTitle}>{t('cardTitle')}</Text>
                <Text style={styles.cardLinkText} numberOfLines={1}>
                  {t('cardHomeText')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={brand.gold} />
            </LinearGradient>
          </Pressable>

          {/* Студенческие сервисы */}
          <SectionHeader title={t('homeExtraTitle')} />
          <View style={styles.grid}>
            {extra.map((item) => (
              <AcademicTile key={item.label} icon={item.icon} label={item.label} width={tileWidth} onPress={item.onPress} />
            ))}
          </View>

          {/* Университетская жизнь */}
          <SectionHeader title={t('homeCampusTitle')} />
          <View style={styles.campusList}>
            {campus.map((item) => (
              <Pressable key={item.title} onPress={item.onPress} accessibilityRole="button" accessibilityLabel={item.title} style={({ pressed }) => [styles.campusRow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
                <ImageBackground source={item.image} style={styles.campusPhoto} imageStyle={styles.campusPhotoRadius} />
                <View style={styles.flex}>
                  <Text style={[styles.campusTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.text}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gold} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 183, 124, 0.45)',
  },
  barTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    lineHeight: 24,
    color: brand.ivory,
  },
  barSubtitle: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 3,
    color: brand.gold,
  },
  bell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#B94A48',
    borderWidth: 1.5,
    borderColor: brand.navy,
  },
  scroll: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hello: {
    fontFamily: fonts.greeting,
    fontSize: 22,
    lineHeight: 28,
  },
  name: {
    fontFamily: fonts.greeting,
    fontSize: 30,
    lineHeight: 36,
  },
  avatarRing: {
    borderWidth: 1.5,
    borderRadius: 34,
    padding: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardLink: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.5)',
  },
  cardLinkTitle: {
    fontFamily: fonts.card,
    fontSize: 17,
    lineHeight: 23,
    color: brand.ivory,
  },
  cardLinkText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(248, 243, 232, 0.78)',
  },
  campusList: {
    gap: spacing.sm,
  },
  campusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  campusPhoto: {
    width: 84,
    height: 64,
  },
  campusPhotoRadius: {
    borderRadius: radius.sm,
  },
  campusTitle: {
    fontFamily: fonts.card,
    fontSize: 15,
    lineHeight: 20,
  },
});
