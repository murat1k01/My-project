import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import Chip from './Chip';
import IconButton from './IconButton';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Быстрое меню из круглой кнопки «≡»: язык и тема. Изменения применяются сразу. */
export default function AppMenu({ visible, onClose }: Props) {
  const { colors, isDark, setMode } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('close')} />
      <View
        style={[
          styles.sheet,
          { top: insets.top + spacing.sm, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.header}>
          <Text style={[type.heading, { color: colors.text }]}>{t('menu')}</Text>
          <IconButton icon="close" variant="glass" size={38} accessibilityLabel={t('close')} onPress={onClose} />
        </View>

        <Text style={[type.label, { color: colors.textMuted }]}>{t('language').toUpperCase()}</Text>
        <View style={styles.row}>
          {LANGUAGES.map((item) => (
            <Chip key={item.code} label={item.name} selected={language === item.code} onPress={() => setLanguage(item.code)} />
          ))}
        </View>

        <Text style={[type.label, { color: colors.textMuted }]}>{t('theme').toUpperCase()}</Text>
        <View style={styles.row}>
          <Chip label={t('themeDark')} icon="moon-outline" selected={isDark} onPress={() => setMode('dark')} />
          <Chip label={t('themeLight')} icon="sunny-outline" selected={!isDark} onPress={() => setMode('light')} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 4, 12, 0.55)',
  },
  sheet: {
    position: 'absolute',
    right: spacing.lg,
    width: '90%',
    maxWidth: 420,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
