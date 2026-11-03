import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { InfoPage } from '../api/types';
import { Text } from '../components/AppText';
import ScreenScroll from '../components/ScreenScroll';
import SearchField from '../components/SearchField';
import StateView from '../components/StateView';
import { infoImage } from '../data/images';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

/** Раздел «Информация»: карточки с фото и началом текста. Текст редактирует администратор. */
export default function InfoScreen({ navigation }: RootStackScreenProps<'Info'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const search = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi<{ pages: InfoPage[] }>(`/api/info${search ? `?q=${encodeURIComponent(search)}` : ''}`);

  return (
    <ScreenScroll title={t('infoTitle')} subtitle={t('infoSubtitle')} onBack={navigation.goBack}>
      <SearchField value={query} onChangeText={setQuery} placeholder={t('infoSearch')} />
      <StateView
        loading={loading}
        error={error}
        hasData={data !== null}
        empty={data?.pages.length === 0}
        emptyIcon="search-outline"
        emptyTitle={t('noResultsTitle')}
        emptyText={t('infoNoResults')}
        onRetry={() => void reload()}
      >
        <View style={styles.list}>
          {data?.pages.map((page) => (
            <Pressable
              key={page.slug}
              onPress={() => navigation.navigate('InfoDetail', { slug: page.slug })}
              accessibilityRole="button"
              accessibilityLabel={page.title}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.glass, borderColor: colors.border }, pressed && styles.pressed]}
            >
              <View style={styles.photo}>
                <Image source={infoImage(page.slug)} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
              </View>
              <View style={styles.texts}>
                <Text style={[type.subheading, { color: colors.text }]}>{page.title}</Text>
                <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={3}>
                  {page.body}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </StateView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photo: {
    width: 104,
    minHeight: 104,
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
});
