import { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Book } from '../api/types';
import { Text } from '../components/AppText';
import BookCover from '../components/BookCover';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import IconButton from '../components/IconButton';
import PrimaryButton from '../components/PrimaryButton';
import SearchField from '../components/SearchField';
import StateView from '../components/StateView';
import { images } from '../data/images';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useFavorites } from '../hooks/useFavorites';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { withAlpha } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

type Sort = 'title' | 'year';

/** Библиотека: каталог с сервера, поиск, категории, сортировка и избранное на фоне книжных полок. */
export default function LibraryScreen({ navigation }: RootStackScreenProps<'Library'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('title');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const search = useDebounced(query.trim());
  const favorites = useFavorites('book');

  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (category) params.set('category', category);
  if (sort === 'year') params.set('sort', 'year');
  const suffix = params.toString();
  const { data, loading, error, reload } = useApi<{ books: Book[]; categories: string[] }>(`/api/books${suffix ? `?${suffix}` : ''}`);

  const books = (data?.books ?? []).filter((book) => !onlyFavorites || favorites.isFavorite(book.id));

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <IconButton icon="chevron-back" variant="glass" accessibilityLabel={t('back')} onPress={navigation.goBack} />
        <View style={styles.flex}>
          <Text style={[type.title, { color: colors.text }]} accessibilityRole="header">
            {t('tabLibrary')}
          </Text>
          {data ? <Text style={[type.caption, { color: colors.textSecondary }]}>{t('libCount', { count: books.length })}</Text> : null}
        </View>
        <IconButton icon={onlyFavorites ? 'heart' : 'heart-outline'} variant="glass" accessibilityLabel={t('filterFavorites')} onPress={() => setOnlyFavorites((prev) => !prev)} />
      </View>
      <SearchField value={query} onChangeText={setQuery} placeholder={t('libSearch')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t('filterAll')} selected={category === null} onPress={() => setCategory(null)} />
        {data?.categories.map((name) => <Chip key={name} label={name} selected={category === name} onPress={() => setCategory(name)} />)}
      </ScrollView>
      <View style={styles.sortRow}>
        <Chip label={t('sortTitle')} icon="text-outline" selected={sort === 'title'} onPress={() => setSort('title')} />
        <Chip label={t('sortYear')} icon="calendar-outline" selected={sort === 'year'} onPress={() => setSort('year')} />
      </View>
      <StateView loading={loading} error={error} hasData={data !== null} onRetry={() => void reload()}>
        {null}
      </StateView>
    </View>
  );

  return (
    <View style={styles.flex}>
      <Image source={images.serviceLib} style={styles.background} resizeMode="cover" />
      {/* Тёплый оттенок поверх фото библиотеки; текст остаётся читаемым в обеих темах */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(colors.background, 0.88) }]} />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.flex}>
        <FlatList
          data={data ? books : []}
          keyExtractor={(book) => book.id}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            data ? (
              <EmptyState
                icon={onlyFavorites ? 'heart-outline' : 'search-outline'}
                title={onlyFavorites ? t('libFavEmptyTitle') : t('noResultsTitle')}
                message={onlyFavorites ? t('libFavEmptyText') : t('libNoResults')}
              />
            ) : undefined
          }
          ListFooterComponent={
            <PrimaryButton title={t('libReadingRoom')} variant="glass" icon="map-outline" style={styles.footer} onPress={() => navigation.navigate('ServiceDetails', { serviceId: 'lib' })} />
          }
          renderItem={({ item }) => (
            <BookRow book={item} favorite={favorites.isFavorite(item.id)} onToggleFavorite={() => void favorites.toggle(item.id)} onPress={() => navigation.navigate('BookDetails', { bookId: item.id })} />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

type RowProps = {
  book: Book;
  favorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
};

function BookRow({ book, favorite, onToggleFavorite, onPress }: RowProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={book.title} style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
        <BookCover uri={book.coverUrl} width={78} />
        <View style={styles.flex}>
          <Text style={[type.subheading, { color: colors.text }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {book.author ?? t('notSpecified')}
            {book.year ? ` · ${book.year}` : ''}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {book.category}
          </Text>
          {book.readUrl ? <Text style={[type.label, { color: colors.success }]}>{t('bookFreeRead')}</Text> : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onToggleFavorite}
        hitSlop={8}
        style={styles.heart}
        accessibilityRole="button"
        accessibilityLabel={favorite ? t('removeFavoriteA11y', { name: book.title }) : t('addFavoriteA11y', { name: book.title })}
        accessibilityState={{ selected: favorite }}
      >
        <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? colors.danger : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  flex: {
    flex: 1,
  },
  list: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chips: {
    gap: spacing.sm,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  heart: {
    padding: spacing.xs,
  },
});
