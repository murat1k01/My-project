import { ReactNode, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { Service } from '../types/Service';
import AppMenu from './AppMenu';
import ExampleNotice from './ExampleNotice';
import IconButton from './IconButton';

type Props = {
  service: Service;
  onBack: () => void;
  children: ReactNode;
  /** Закреплённая снизу панель (например, корзина столовой) */
  footer?: ReactNode;
};

/**
 * Общий макет экранов сервисов: большое фото с плавным переходом в фон,
 * кнопки «назад», «избранное», «меню», заголовок и содержимое.
 */
export default function ServiceLayout({ service, onBack, children, footer }: Props) {
  const { colors } = useTheme();
  const { t, tr } = useI18n();
  const { isFavorite, toggleFavorite } = useAppData();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
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
            <View style={styles.heroRight}>
              <IconButton
                icon={favorite ? 'star' : 'star-outline'}
                variant="glass"
                iconColor={favorite ? '#FBBF24' : '#FFFFFF'}
                accessibilityLabel={favorite ? t('removeFavoriteA11y', { name: tr(service.title) }) : t('addFavoriteA11y', { name: tr(service.title) })}
                onPress={() => toggleFavorite(service.id)}
              />
              <IconButton icon="menu" variant="light" accessibilityLabel={t('menu')} onPress={() => setMenuOpen(true)} />
            </View>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <View style={[styles.codeChip, { backgroundColor: service.accent }]}>
              <Ionicons name={service.icon} size={14} color="#04060F" />
              <Text style={styles.code}>{service.code}</Text>
            </View>
            <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
              {tr(service.title)}
            </Text>
            <Text style={[type.body, { color: colors.textSecondary }]}>{tr(service.description)}</Text>
          </View>
          <ExampleNotice />
          {children}
        </View>
      </ScrollView>

      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View> : null}
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    color: '#04060F',
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
