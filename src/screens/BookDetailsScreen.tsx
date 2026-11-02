import { StyleSheet, View } from 'react-native';
import type { Book } from '../api/types';
import { Text } from '../components/AppText';
import BookCover from '../components/BookCover';
import GlassCard from '../components/GlassCard';
import IconButton from '../components/IconButton';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useFavorites } from '../hooks/useFavorites';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { openExternal } from '../utils/links';

export default function BookDetailsScreen({ navigation, route }: RootStackScreenProps<'BookDetails'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data, loading, error, reload } = useApi<{ book: Book }>(`/api/books/${encodeURIComponent(route.params.bookId)}`);
  const favorites = useFavorites('book');
  const book = data?.book;
  const open = (url: string) => void openExternal(url, { title: t('linkErrorTitle'), text: t('linkErrorText', { url }) });

  const availability = book?.copies === null || book?.copies === undefined ? t('bookCopiesUnknown') : book.copies > 0 ? t('bookCopies', { count: book.copies }) : t('bookCopiesNone');

  return (
    <ScreenScroll
      title={book?.title ?? t('tabLibrary')}
      onBack={navigation.goBack}
      right={
        book ? (
          <IconButton
            icon={favorites.isFavorite(book.id) ? 'heart' : 'heart-outline'}
            variant="glass"
            iconColor={favorites.isFavorite(book.id) ? colors.danger : undefined}
            accessibilityLabel={t('filterFavorites')}
            onPress={() => void favorites.toggle(book.id)}
          />
        ) : undefined
      }
    >
      <StateView loading={loading} error={error} hasData={data !== null} onRetry={() => void reload()}>
        {book ? (
          <>
            <View style={styles.top}>
              <BookCover uri={book.coverUrl} width={130} />
              <View style={styles.flex}>
                <Fact label={t('bookAuthor')} value={book.author ?? t('notSpecified')} />
                <Fact label={t('bookYear')} value={book.year ? String(book.year) : t('notSpecified')} />
                <Fact label={t('bookCategory')} value={book.category} />
                <Fact label={t('bookAvailability')} value={availability} />
              </View>
            </View>
            <GlassCard>
              <Text style={[type.subheading, { color: colors.text }]}>{t('bookDescription')}</Text>
              <Text style={[type.body, { color: colors.textSecondary }]}>{book.description || t('bookNoDescription')}</Text>
            </GlassCard>
            {book.readUrl ? <PrimaryButton title={t('bookRead')} arrow onPress={() => open(book.readUrl!)} /> : <Text style={[type.caption, { color: colors.textMuted }]}>{t('bookNoFreeLink')}</Text>}
            {book.sourceUrl ? <PrimaryButton title={t('bookSource')} variant="glass" compact icon="open-outline" onPress={() => open(book.sourceUrl!)} /> : null}
          </>
        ) : null}
      </StateView>
    </ScreenScroll>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[type.bodyMedium, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  fact: {
    gap: 2,
  },
});
