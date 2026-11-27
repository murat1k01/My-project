import { ReactNode, Ref } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { useAppear } from '../hooks/useAppear';
import { useI18n } from '../i18n/LanguageContext';
import { brand } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import ScreenContainer from './ScreenContainer';
import TopBar from './TopBar';

type Props = {
  title: string;
  subtitle?: string;
  /** Кнопка «Назад» для экранов стека; у вкладок её нет */
  onBack?: () => void;
  right?: ReactNode;
  children: ReactNode;
  /** Чтобы экран мог прокрутить себя наверх, например к карте */
  scrollRef?: Ref<ScrollViewInstance>;
};

/**
 * Единый макет обычного экрана: шапка, заголовок, прокрутка, ограничение ширины на планшетах, учёт клавиатуры.
 * У экранов стека (с кнопкой «Назад») — тёмно-синяя верхняя панель с заголовком по центру
 * и кремовая панель с содержимым, как в макетах Oxford Academic Heritage.
 */
export default function ScreenScroll({ title, subtitle, onBack, right, children, scrollRef }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const sheetStyle = useAppear(18);

  if (onBack) {
    return (
      <View style={[styles.flex, { backgroundColor: isDark ? brand.midnight : brand.navy }]}>
        <View style={[styles.navyBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('back')} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={24} color={brand.ivory} />
          </Pressable>
          <Text style={styles.navyTitle} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          <View style={styles.navyRight}>{right}</View>
        </View>
        <Animated.View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.gold }, sheetStyle]}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView ref={scrollRef} contentContainerStyle={[styles.sheetScroll, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
              <View style={styles.content}>
                {subtitle ? <Text style={[type.body, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
                {children}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <TopBar label="ALTushki" right={right} />
            <View style={styles.titleBlock}>
              <Text style={[type.title, { color: isDark ? colors.text : colors.primary }]} accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? <Text style={[type.body, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    maxWidth: 760,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  navyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING - 4,
    paddingBottom: spacing.lg + spacing.md,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  navyTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.card,
    fontSize: 20,
    lineHeight: 26,
    color: brand.ivory,
  },
  navyRight: {
    minWidth: 44,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  sheet: {
    flex: 1,
    marginTop: -spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  sheetScroll: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.xl,
  },
});
