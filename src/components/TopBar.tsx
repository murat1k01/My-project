import { ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { fonts } from '../theme/typography';
import AppMenu from './AppMenu';
import IconButton from './IconButton';

type Props = {
  /** Небольшая подпись слева (например, «Campus Hub»), если нет кнопки «Назад» */
  label?: string;
  onBack?: () => void;
  /** Дополнительные кнопки справа перед кнопкой меню */
  right?: ReactNode;
};

/** Верхняя панель как в референсе: подпись слева, белая круглая кнопка меню «≡» справа. */
export default function TopBar({ label, onBack, right }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.row}>
      {onBack ? (
        <IconButton icon="chevron-back" variant="glass" accessibilityLabel={t('back')} onPress={onBack} />
      ) : (
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
          {label}
        </Text>
      )}
      <View style={styles.right}>
        {right}
        <IconButton icon="menu" variant="light" accessibilityLabel={t('menu')} onPress={() => setMenuOpen(true)} />
      </View>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  label: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  right: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
