import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Book } from '../api/types';
import { Text } from '../components/AppText';
import BookCover from '../components/BookCover';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useFavorites } from '../hooks/useFavorites';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { brand } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

type Sort = 'title' | 'year';
type Mode = 'all' | 'favorites' | 'ebooks';

/**
 * «Кітапхана»: тёмно-синяя шапка с поиском, категории, полка рекомендуемых книг с настоящими обложками,
 * быстрые действия (бронирование места, электронные книги, мои книги) и весь каталог с сервера.
 */
export default function LibraryScreen({ navigation }: RootStackScreenProps<'Library'>) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('title');
  const [mode, setMode] = useState<Mode>('all');
  const search = useDebounced(query.trim());
  const favorites = useFavorites('book');

  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (category) params.set('category', category);
  if (sort === 'year') params.set('sort', 'year');
  const suffix = params.toString();
  const { data, loading, error, reload } = useApi<{ books: Book[]; categories: string[] }>(`/api/books${suffix ? `?${suffix}` : ''}`);

  const all = data?.books ?? [];
  const books = all.filter((book) => (mode === 'favorites' ? favorites.isFavorite(book.id) : mode === 'ebooks' ? Boolean(book.readUrl) : true));
  // Полка: книги с обложками из текущей выборки
  const shelf = all.filter((book) => book.coverUrl).slice(0, 10);
  const heading = isDark ? colors.text : colors.primary;

  const actions: { icon: IoniconName; label: string; badge?: string; active?: boolean; onPress: () => void }[] = [
    { icon: 'calendar-outline', label: t('libActionBook'), onPress: () => navigation.navigate('ServiceDetails', { serviceId: 'lib' }) },
    { icon: 'tablet-portrait-outline', label: t('libActionEbooks'), active: mode === 'ebooks', badge: String(all.filter((b) => b.readUrl).length), onPress: () => setMode(mode === 'ebooks' ? 'all' : 'ebooks') },
    { icon: 'heart-outline', label: t('libActionMine'), active: mode === 'favorites', badge: String(all.filter((b) => favorites.isFavorite(b.id)).length), onPress: () => setMode(mode === 'favorites' ? 'all' : 'favorites') },
  ];

  const header = (
    <View style={styles.header}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t('filterAll')} selected={category === null} onPress={() => setCategory(null)} />
        {data?.categories.map((name) => <Chip key={name} label={name} selected={category === name} onPress={() => setCategory(name)} />)}
      </ScrollView>

      {shelf.length > 0 && mode === 'all' ? (
        <View style={styles.section}>
          <Text style={[type.heading, { color: heading }]}>{t('libRecommended')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
            {shelf.map((book) => (
              <Pressable key={book.id} onPress={() => navigation.navigate('BookDetails', { bookId: book.id })} accessibilityRole="button" accessibilityLabel={book.title} style={({ pressed }) => [styles.shelfBook, pressed && styles.pressed]}>
                <BookCover uri={book.coverUrl} width={104} />
                <Text style={[styles.shelfTitle, { color: colors.text }]} numberOfLines={2}>
                  {book.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* Деревянная полка с золотой кромкой */}
          <View style={styles.plank} />
        </View>
      ) : null}

      <View style={[styles.actions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {actions.map((action, index) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: action.active }}
            style={({ pressed }) => [styles.actionRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }, pressed && styles.pressed]}
          >
            <Ionicons name={action.icon} size={21} color={isDark ? colors.gold : colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
            {action.badge ? (
              <View style={[styles.badge, { backgroundColor: action.active ? colors.primary : colors.primarySoft }]}>
                <Text style={[styles.badgeText, { color: action.active ? colors.onPrimary : heading }]}>{action.badge}</Text>
              </View>
            ) : null}
            <Ionicons name={action.active ? 'close' : 'chevron-forward'} size={18} color={colors.gold} />
          </Pressable>
        ))}
      </View>

      <View style={styles.catalogHead}>
        <Text style={[type.heading, styles.flex, { color: heading }]}>{mode === 'favorites' ? t('libActionMine') : mode === 'ebooks' ? t('libActionEbooks') : t('libCatalog')}</Text>
        <Chip label={t('sortTitle')} selected={sort === 'title'} onPress={() => setSort('title')} />
        <Chip label={t('sortYear')} selected={sort === 'year'} onPress={() => setSort('year')} />
      </View>
      {data ? <Text style={[type.caption, { color: colors.textSecondary }]}>{t('libCount', { count: books.length })}</Text> : null}
      <StateView loading={loading} error={error} hasData={data !== null} onRetry={() => void reload()}>
        {null}
      </StateView>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: isDark ? brand.midnight : brand.navy }]}>
      <View style={[styles.navy, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.navyRow}>
          <Pressable onPress={navigation.goBack} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('back')} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={brand.ivory} />
          </Pressable>
          <Text style={styles.navyTitle} accessibilityRole="header">
            {t('gridLibrary')}
          </Text>
          <View style={styles.back} />
        </View>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={19} color={brand.navy} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('libSearch')}
            placeholderTextColor="#77746D"
            accessibilityLabel={t('libSearch')}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('close')}>
              <Ionicons name="close-circle" size={18} color="#77746D" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.gold }]}>
        <FlatList
          data={data ? books : []}
          keyExtractor={(book) => book.id}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xxl }]}
          ListEmptyComponent={
            data ? (
              <EmptyState
                icon={mode === 'favorites' ? 'heart-outline' : 'search-outline'}
                title={mode === 'favorites' ? t('libFavEmptyTitle') : t('noResultsTitle')}
                message={mode === 'favorites' ? t('libFavEmptyText') : t('libNoResults')}
              />
            ) : undefined
          }
          renderItem={({ item }) => (
            <BookRow book={item} favorite={favorites.isFavorite(item.id)} onToggleFavorite={() => void favorites.toggle(item.id)} onPress={() => navigation.navigate('BookDetails', { bookId: item.id })} />
          )}
        />
      </View>
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
  navy: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xl + spacing.md,
    gap: spacing.md,
  },
  navyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navyTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.card,
    fontSize: 20,
    color: brand.ivory,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: brand.ivory,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#17212B',
    paddingVertical: spacing.sm,
  },
  sheet: {
    flex: 1,
    marginTop: -spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  section: {
    gap: spacing.sm,
  },
  shelf: {
    gap: spacing.md,
    paddingHorizontal: 4,
    paddingTop: spacing.xs,
  },
  shelfBook: {
    width: 104,
    gap: 6,
  },
  shelfTitle: {
    fontFamily: fonts.card,
    fontSize: 12,
    lineHeight: 16,
  },
  plank: {
    height: 8,
    borderRadius: 3,
    backgroundColor: '#5B3A1E',
    borderBottomWidth: 2,
    borderBottomColor: brand.antiqueGold,
  },
  actions: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 54,
  },
  actionLabel: {
    flex: 1,
    fontFamily: fonts.card,
    fontSize: 15,
  },
  badge: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  catalogHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    gap: spacing.lg,
    paddingTop: spacing.xl,
    marginBottom: spacing.md,
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
