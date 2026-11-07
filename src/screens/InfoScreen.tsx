import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { InfoPage } from '../api/types';
import { Text } from '../components/AppText';
import FormBanner from '../components/FormBanner';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import SearchField from '../components/SearchField';
import StateView from '../components/StateView';
import { infoImage } from '../data/images';
import { saveFavorite } from '../database/favorites';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

type SaveState = 'saving' | 'saved' | 'exists' | 'error';

/**
 * Раздел «Информация» — объявления проекта: карточки с фото и началом текста. Текст редактирует администратор.
 * Каждое объявление можно сохранить в SQLite на устройстве, чтобы читать его без интернета (лабораторная №10).
 */
export default function InfoScreen({ navigation }: RootStackScreenProps<'Info'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const search = useDebounced(query.trim());
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  const saveOffline = async (page: InfoPage) => {
    setSaveStates((prev) => ({ ...prev, [page.slug]: 'saving' }));
    try {
      const result = await saveFavorite({ id: page.slug, title: page.title, body: page.body });
      setSaveStates((prev) => ({ ...prev, [page.slug]: result }));
    } catch {
      setSaveStates((prev) => ({ ...prev, [page.slug]: 'error' }));
    }
  };

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
          {data?.pages.map((page) => {
            const state = saveStates[page.slug];
            return (
              <View key={page.slug} style={styles.item}>
                <Pressable
                    onPress={() => navigation.navigate('InfoDetail', { slug: page.slug })}
                  accessibilityRole="button"
                  accessibilityLabel={page.title}
                  style={({ pressed }) => [styles.card, { backgroundColor: colors.glass, borderColor: colors.border }, pressed && styles.pressed]}
                >
                  <View style={styles.photo}>
                    <Image source={infoImage(page.slug)} style={styles.photoImage} resizeMode="cover" accessibilityIgnoresInvertColors />
                  </View>
                  <View style={styles.texts}>
                    <Text style={[type.subheading, { color: colors.text }]}>{page.title}</Text>
                    <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={3}>
                      {page.body}
                    </Text>
                  </View>
                </Pressable>
                {/* Кнопка стоит рядом с карточкой, а не внутри её Pressable */}
                <PrimaryButton title={t('favSave')} variant="glass" compact icon="download-outline" loading={state === 'saving'} onPress={() => void saveOffline(page)} />
                {state === 'saved' ? <FormBanner kind="success" text={t('favSaved')} /> : null}
                {state === 'exists' ? <FormBanner kind="info" text={t('favExists')} /> : null}
                {state === 'error' ? <FormBanner text={t('favSaveError')} /> : null}
              </View>
            );
          })}
        </View>
      </StateView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  item: {
    gap: spacing.sm,
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
    overflow: 'hidden',
  },
  // В браузере картинка без явных размеров берёт свой натуральный размер, поэтому width и height заданы
  photoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
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
