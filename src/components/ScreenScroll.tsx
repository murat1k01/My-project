import { ReactNode, Ref } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { useTheme } from '../theme/ThemeContext';
import { SCREEN_PADDING, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
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

/** Единый макет обычного экрана: шапка, заголовок, прокрутка, ограничение ширины на планшетах, учёт клавиатуры. */
export default function ScreenScroll({ title, subtitle, onBack, right, children, scrollRef }: Props) {
  const { colors } = useTheme();

  return (
    <ScreenContainer edges={onBack ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <TopBar label="Campus Hub" onBack={onBack} right={right} />
            <View style={styles.titleBlock}>
              <Text style={[type.title, { color: colors.text }]} accessibilityRole="header">
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
});
