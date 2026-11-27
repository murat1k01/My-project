import { ReactNode } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { brand } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import type { Service } from '../types/Service';
import ExampleNotice from './ExampleNotice';

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
 * Общий макет экранов сервисов в стиле Oxford Academic Heritage: тёмно-синяя шапка с заголовком,
 * кнопками «назад» и «избранное», кремовая панель с фото-баннером раздела и содержимым.
 */
export default function ServiceLayout({ service, onBack, children, footer, notice = 'sectionNote' }: Props) {
  const { colors, isDark } = useTheme();
  const { t, tr } = useI18n();
  const { isFavorite, toggleFavorite } = useAppData();
  const insets = useSafeAreaInsets();
  const favorite = isFavorite(service.id);
  const title = tr(service.title);

  return (
    <View style={[styles.flex, { backgroundColor: isDark ? brand.midnight : brand.navy }]}>
      <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('back')} style={styles.barButton}>
          <Ionicons name="chevron-back" size={24} color={brand.ivory} />
        </Pressable>
        <Text style={styles.barTitle} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          onPress={() => toggleFavorite(service.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={favorite ? t('removeFavoriteA11y', { name: title }) : t('addFavoriteA11y', { name: title })}
          style={styles.barButton}
        >
          <Ionicons name={favorite ? 'star' : 'star-outline'} size={22} color={favorite ? brand.gold : brand.ivory} />
        </Pressable>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.gold }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: (footer ? 110 : spacing.xxl) + insets.bottom }} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <ImageBackground source={service.image} style={styles.banner} imageStyle={styles.bannerImage}>
              <LinearGradient colors={brand.photoShade} style={[StyleSheet.absoluteFill, styles.bannerImage]} />
              <View style={styles.bannerFrame} pointerEvents="none" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>{title}</Text>
                <View style={styles.rule} />
                <Text style={styles.bannerSubtitle} numberOfLines={2}>
                  {tr(service.description)}
                </Text>
              </View>
            </ImageBackground>
            {notice ? <ExampleNotice textKey={notice} /> : null}
            {children}
          </View>
        </ScrollView>
      </View>

      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View> : null}
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
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING - 4,
    paddingBottom: spacing.lg + spacing.md,
  },
  barButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.card,
    fontSize: 20,
    lineHeight: 26,
    color: brand.ivory,
  },
  sheet: {
    flex: 1,
    marginTop: -spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  banner: {
    height: 170,
    justifyContent: 'flex-end',
  },
  bannerImage: {
    borderRadius: radius.lg,
  },
  bannerFrame: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderRadius: radius.lg - 6,
    borderColor: 'rgba(212, 183, 124, 0.5)',
  },
  bannerText: {
    padding: spacing.lg,
    gap: 6,
  },
  bannerTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    lineHeight: 34,
    color: brand.ivory,
  },
  rule: {
    width: 40,
    height: 1,
    backgroundColor: brand.gold,
  },
  bannerSubtitle: {
    fontFamily: fonts.greeting,
    fontSize: 14,
    lineHeight: 19,
    color: '#EDE3D2',
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
