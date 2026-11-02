import { ReactNode } from 'react';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { Service } from '../types/Service';
import ExampleNotice from './ExampleNotice';
import IconButton from './IconButton';

type Props = {
  service: Service;
  onBack: () => void;
  children: ReactNode;
  /** Закреплённая снизу панель (например, корзина столовой) */
  footer?: ReactNode;
  /** Пометка о примерных данных; null — на экране только настоящие данные */
  notice?: TranslationKey | null;
};

/**
 * Общий макет экранов сервисов: большое фото с плавным переходом в фон,
 * кнопки «назад» и «избранное», заголовок и содержимое.
 */
export default function ServiceLayout({ service, onBack, children, footer, notice = 'exampleNotice' }: Props) {
  const { colors } = useTheme();
  const { t, tr } = useI18n();
  const { isFavorite, toggleFavorite } = useAppData();
  const insets = useSafeAreaInsets();
  const favorite = isFavorite(service.id);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: (footer ? 110 : spacing.xxl) + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <ImageBackground source={service.image} style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
          <LinearGradient
            colors={['rgba(4, 6, 15, 0.35)', 'rgba(4, 6, 15, 0.15)', colors.background] as const}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroButtons}>
            <IconButton icon="chevron-back" variant="glass" iconColor="#FFFFFF" accessibilityLabel={t('back')} onPress={onBack} />
            <IconButton
              icon={favorite ? 'star' : 'star-outline'}
              variant="glass"
              iconColor={favorite ? '#FBBF24' : '#FFFFFF'}
              accessibilityLabel={favorite ? t('removeFavoriteA11y', { name: tr(service.title) }) : t('addFavoriteA11y', { name: tr(service.title) })}
              onPress={() => toggleFavorite(service.id)}
            />
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <View style={[styles.codeChip, { backgroundColor: service.accent }]}>
              <Ionicons name={service.icon} size={18} color="#04060F" />
            </View>
            <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
              {tr(service.title)}
            </Text>
            <Text style={[type.body, { color: colors.textSecondary }]}>{tr(service.description)}</Text>
          </View>
          {notice ? <ExampleNotice textKey={notice} /> : null}
          {children}
        </View>
      </ScrollView>

      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
    paddingHorizontal: SCREEN_PADDING,
  },
  heroButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    marginTop: -70,
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  codeChip: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: radius.pill,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.md,
  },
});
