import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../i18n/LanguageContext';
import { radius, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import type { Service } from '../types/Service';

type Props = {
  service: Service;
  /** Ширина рассчитывается на главном экране под 2 или 3 колонки */
  width: number;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

/** Фото-карточка сервиса в стиле «Popular destination» из референса. */
export default function ServiceCard({ service, width, isFavorite, onPress, onToggleFavorite }: Props) {
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
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <ImageBackground source={service.image} style={[styles.image, { height: Math.max(190, width * 1.22) }]} imageStyle={styles.imageRadius}>
          <LinearGradient
            colors={['rgba(4, 6, 15, 0.05)', 'rgba(4, 6, 15, 0.35)', 'rgba(4, 6, 15, 0.92)'] as const}
            style={[StyleSheet.absoluteFill, styles.imageRadius]}
          />
          <View style={styles.codeChip}>
            <Ionicons name={service.icon} size={13} color="#FFFFFF" />
            <Text style={styles.code}>{service.code}</Text>
          </View>
          <View>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {title}
            </Text>
            <View style={styles.bottom}>
              <Text style={[styles.description, styles.texts]} numberOfLines={2}>
                {tr(service.description)}
              </Text>
              <View style={styles.arrow}>
                <Feather name="arrow-up-right" size={16} color="#0A0F24" />
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      <Pressable
        onPress={onToggleFavorite}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? t('removeFavoriteA11y', { name: title }) : t('addFavoriteA11y', { name: title })}
        accessibilityState={{ selected: isFavorite }}
        style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}
      >
        <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={18} color={isFavorite ? '#FBBF24' : '#FFFFFF'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  image: {
    width: '100%',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  imageRadius: {
    borderRadius: radius.lg,
  },
  codeChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(4, 6, 15, 0.55)',
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#FFFFFF',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 16,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  description: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  favorite: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 6, 15, 0.55)',
  },
});
