import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import type { Service } from '../types/Service';

type Props = {
  service: Service;
  /** Ширина рассчитывается на главном экране под 3 или 4 колонки */
  width: number;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

/**
 * Плитка сервиса в стиле Oxford Academic Premium: кремовая карточка, тёмно-синяя иконка в золотом кольце.
 * При нажатии плитка слегка уменьшается.
 */
export default function ServiceCard({ service, width, isFavorite, onPress, onToggleFavorite }: Props) {
  const { colors, isDark } = useTheme();
  const { t, tr } = useI18n();
  const title = tr(service.title);

  // Кнопка «избранное» лежит рядом с карточкой, а не внутри неё:
  // так два нажимаемых элемента не вложены друг в друга (важно для экранного диктора).
  return (
    <View style={{ width }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${tr(service.description)}`}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.ring, { borderColor: colors.gold, backgroundColor: colors.primarySoft }]}>
          <Ionicons name={service.icon} size={24} color={isDark ? colors.gold : colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
      </Pressable>

      <Pressable
        onPress={onToggleFavorite}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? t('removeFavoriteA11y', { name: title }) : t('addFavoriteA11y', { name: title })}
        accessibilityState={{ selected: isFavorite }}
        style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}
      >
        <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={15} color={isFavorite ? colors.gold : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 118,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  ring: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  favorite: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
