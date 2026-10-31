import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCampus } from '../context/CampusContext';
import { isSubscriptionActive } from '../data/subscription';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import { formatDate } from '../utils/format';

type Props = {
  onPress: () => void;
  /** Короткий текст вместо стандартного описания (например, для столовой) */
  text?: string;
};

/**
 * Заметная точка входа в оформление подписки ALTushki Plus.
 * Используется на главной, в профиле, в настройках и в столовой.
 */
export default function SubscriptionBanner({ onPress, text }: Props) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { campus } = useCampus();
  const active = isSubscriptionActive(campus.subscription, new Date());

  const subtitle = active
    ? t('subActiveUntil', { date: formatDate(campus.subscription!.endsAt, language) })
    : text ?? t('subBannerText');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('subName')}. ${subtitle}`}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient colors={[colors.cardStart, colors.cardEnd] as const} style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name={active ? 'checkmark-circle' : 'sparkles'} size={22} color="#111111" />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>{t('subName')}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText} numberOfLines={1}>
            {active ? t('subManage') : t('subOpen')}
          </Text>
          <Feather name="arrow-up-right" size={16} color="#111111" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  texts: {
    flex: 1,
    minWidth: 150,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: '#111111',
  },
});
