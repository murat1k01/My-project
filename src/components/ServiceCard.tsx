import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useAppear } from '../hooks/useAppear';
import { useI18n } from '../i18n/LanguageContext';
import { withAlpha } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import type { Service, ServiceId } from '../types/Service';

type Props = {
  service: Service;
  /** Ширина рассчитывается на главном экране под 2 или 3 колонки */
  width: number;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

/** Пастельный фон плитки и цвет значка: у каждого сервиса свой (светлый минимал) */
const TILE: Partial<Record<ServiceId, { background: string; tone: string }>> = {
  library: { background: '#E8EEFF', tone: '#1F5CFF' },
  transport: { background: '#E5F7EC', tone: '#15803D' },
  food: { background: '#FFF0E3', tone: '#C2410C' },
  dorm: { background: '#F3E8FF', tone: '#7E22CE' },
  info: { background: '#FFF7D6', tone: '#A16207' },
  cal: { background: '#E0F2FE', tone: '#0369A1' },
  events: { background: '#FCE7F3', tone: '#BE185D' },
  lms: { background: '#E0F7F4', tone: '#0F766E' },
  sport: { background: '#FDE8E8', tone: '#B91C1C' },
  lib: { background: '#E8EEFF', tone: '#1F5CFF' },
};
const DEFAULT_TILE = { background: '#EEF0F4', tone: '#3D4350' };

/** Плитка сервиса: пастельный фон, значок, название и короткое описание. */
export default function ServiceCard({ service, width, isFavorite, onPress, onToggleFavorite }: Props) {
  const { t, tr } = useI18n();
  const { colors, isDark } = useTheme();
  const appear = useAppear();
  const title = tr(service.title);
  const tile = TILE[service.id] ?? DEFAULT_TILE;
  // В тёмной теме плитка — тот же цвет, но полупрозрачный
  const background = isDark ? withAlpha(tile.tone, 0.22) : tile.background;
  const tone = isDark ? '#FFFFFF' : tile.tone;

  // Кнопка «избранное» лежит рядом с карточкой, а не внутри неё:
  // так два нажимаемых элемента не вложены друг в друга (важно для экранного диктора).
  return (
    <Animated.View style={[{ width }, appear]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${tr(service.description)}`}
        style={({ pressed }) => [styles.card, { backgroundColor: background }, pressed && styles.pressed]}
      >
        <View style={[styles.iconChip, { backgroundColor: isDark ? withAlpha('#FFFFFF', 0.12) : '#FFFFFF' }]}>
          <Ionicons name={service.icon} size={22} color={tone} />
        </View>
        <View style={styles.texts}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {tr(service.description)}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onToggleFavorite}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? t('removeFavoriteA11y', { name: title }) : t('addFavoriteA11y', { name: title })}
        accessibilityState={{ selected: isFavorite }}
        style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}
      >
        <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={18} color={tone} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 138,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  favorite: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
