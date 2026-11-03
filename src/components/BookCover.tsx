import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../api/client';
import { Text } from './AppText';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

type Props = {
  uri: string | null;
  width: number;
};

/** Обложка книги. Если обложки нет или она не загрузилась, показывается заглушка, а не случайная картинка. */
export default function BookCover({ uri, width }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const size = { width, height: Math.round(width * 1.45) };

  if (!uri || failed) {
    return (
      <View style={[styles.cover, styles.placeholder, size, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Ionicons name="book-outline" size={width * 0.3} color={colors.textMuted} />
        <Text style={[type.caption, styles.center, { color: colors.textMuted }]} numberOfLines={2}>
          {t('bookNoCover')}
        </Text>
      </View>
    );
  }
  // Обложки из папки сервера приходят с относительным адресом
  const source = { uri: uri.startsWith('/') ? `${API_URL}${uri}` : uri };
  return <Image source={source} style={[styles.cover, size, { backgroundColor: colors.surfaceAlt }]} resizeMode="cover" onError={() => setFailed(true)} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: radius.sm,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderWidth: 1,
  },
  center: {
    textAlign: 'center',
  },
});
