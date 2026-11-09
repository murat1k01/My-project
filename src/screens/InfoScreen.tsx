import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { InfoPage } from '../api/types';
import { Text } from '../components/AppText';
import FormBanner from '../components/FormBanner';
import PrimaryButton from '../components/PrimaryButton';
import SavedNotices, { SavedFilter } from '../components/SavedNotices';
import ScreenScroll from '../components/ScreenScroll';
import SearchField from '../components/SearchField';
import StateView from '../components/StateView';
import { infoImageSource } from '../data/images';
import { deleteFavorite, FavoriteNotice, loadFavorites, saveFavorite, toggleFavoriteRead } from '../database/favorites';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { confirmAction } from '../utils/dialogs';

type SaveState = 'saving' | 'saved' | 'exists' | 'error';

/**
 * Раздел «Информация»: сверху избранные объявления, сохранённые на устройстве (SQLite, работают без интернета),
 * ниже — все страницы. Текст и фото страниц задаёт администратор.
 */
export default function InfoScreen({ navigation }: RootStackScreenProps<'Info'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const search = useDebounced(query.trim());
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [saved, setSaved] = useState<FavoriteNotice[]>([]);
  const [savedFilter, setSavedFilter] = useState<SavedFilter>('all');
  const [savedBusy, setSavedBusy] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  /** Действие с базой на устройстве и повторное чтение списка; пока идёт работа, кнопки выключены */
  const runSaved = useCallback(
    async (action?: () => Promise<void>) => {
      setSavedBusy(true);
      setSavedError(null);
      try {
        if (action) await action();
        setSaved(await loadFavorites());
      } catch {
        setSavedError(t('favDbError'));
      } finally {
        setSavedBusy(false);
      }
    },
    [t],
  );

  // Избранное перечитывается при каждом открытии раздела
  useFocusEffect(
    useCallback(() => {
      void runSaved();
    }, [runSaved]),
  );

  const saveOffline = async (page: InfoPage) => {
    setSaveStates((prev) => ({ ...prev, [page.slug]: 'saving' }));
    try {
      const result = await saveFavorite({ id: page.slug, title: page.title, body: page.body });
      setSaveStates((prev) => ({ ...prev, [page.slug]: result }));
      await runSaved();
    } catch {
      setSaveStates((prev) => ({ ...prev, [page.slug]: 'error' }));
    }
  };

  const removeSaved = (item: FavoriteNotice) => {
    confirmAction({
      title: t('favDeleteTitle'),
      text: t('favDeleteText', { title: item.title }),
      confirm: t('favDelete'),
      cancel: t('cancel'),
      destructive: true,
      onConfirm: () => {
        setSaveStates((prev) => ({ ...prev, [item.id]: undefined as unknown as SaveState }));
        void runSaved(() => deleteFavorite(item.id));
      },
    });
  };

  const { data, loading, error, reload } = useApi<{ pages: InfoPage[] }>(`/api/info${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  const savedIds = new Set(saved.map((item) => item.id));

  return (
    <ScreenScroll title={t('infoTitle')} subtitle={t('infoSubtitle')} onBack={navigation.goBack}>
      {savedError ? <FormBanner text={savedError} /> : null}
      <SavedNotices
        items={saved}
        filter={savedFilter}
        onFilterChange={setSavedFilter}
        busy={savedBusy}
        onToggleRead={(item) => void runSaved(() => toggleFavoriteRead(item.id))}
        onDelete={removeSaved}
      />

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
            const isSaved = savedIds.has(page.slug);
            return (
              <View key={page.slug} style={styles.item}>
                <Pressable
                  onPress={() => navigation.navigate('InfoDetail', { slug: page.slug })}
                  accessibilityRole="button"
                  accessibilityLabel={page.title}
                  style={({ pressed }) => [styles.card, { backgroundColor: colors.glass, borderColor: isSaved ? colors.success : colors.border }, pressed && styles.pressed]}
                >
                  <View style={styles.photo}>
                    <Image source={infoImageSource(page)} style={styles.photoImage} resizeMode="cover" accessibilityIgnoresInvertColors />
                  </View>
                  <View style={styles.texts}>
                    <Text style={[type.subheading, { color: colors.text }]}>{page.title}</Text>
                    <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={3}>
                      {page.body}
                    </Text>
                  </View>
                </Pressable>
                {/* Кнопка стоит рядом с карточкой, а не внутри её Pressable */}
                <PrimaryButton
                  title={isSaved ? t('favSavedMark') : t('favSave')}
                  variant="glass"
                  compact
                  icon={isSaved ? 'checkmark-circle' : 'download-outline'}
                  loading={state === 'saving'}
                  onPress={() => void saveOffline(page)}
                />
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
