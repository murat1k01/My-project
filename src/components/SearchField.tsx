import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import FormField from './FormField';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

/** Поле поиска с кнопкой очистки. */
export default function SearchField({ value, onChangeText, placeholder }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <FormField
      icon="search-outline"
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      returnKeyType="search"
      rightAccessory={
        value ? (
          <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel={t('clearSearch')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null
      }
    />
  );
}
