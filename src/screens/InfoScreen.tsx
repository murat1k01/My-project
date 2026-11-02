import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InfoPage } from '../api/types';
import { Text } from '../components/AppText';
import ScreenScroll from '../components/ScreenScroll';
import SearchField from '../components/SearchField';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

const ICONS: Record<string, IoniconName> = {
  about: 'apps-outline',
  university: 'school-outline',
  faculties: 'business-outline',
  programs: 'book-outline',
  groups: 'people-outline',
  study: 'reader-outline',
  schedule: 'calendar-outline',
  library: 'library-outline',
  food: 'restaurant-outline',
  dormitory: 'bed-outline',
  transport: 'bus-outline',
  sport: 'barbell-outline',
  events: 'megaphone-outline',
  contacts: 'call-outline',
  faq: 'help-circle-outline',
  terms: 'document-text-outline',
  privacy: 'lock-closed-outline',
  support: 'chatbubbles-outline',
};

/** Раздел «Информация»: карточки-страницы, которые редактирует администратор. */
export default function InfoScreen({ navigation }: MainTabScreenProps<'Info'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const search = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi<{ pages: InfoPage[] }>(`/api/info${search ? `?q=${encodeURIComponent(search)}` : ''}`);

  return (
    <ScreenScroll title={t('infoTitle')} subtitle={t('infoSubtitle')}>
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
        <View style={styles.grid}>
          {data?.pages.map((page) => (
            <Pressable
              key={page.slug}
              onPress={() => navigation.navigate('InfoDetail', { slug: page.slug })}
              accessibilityRole="button"
              accessibilityLabel={page.title}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.glass, borderColor: colors.border }, pressed && styles.pressed]}
            >
              <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={ICONS[page.slug] ?? 'information-circle-outline'} size={22} color={colors.primary} />
              </View>
              <Text style={[type.bodyMedium, { color: colors.text }]}>{page.title}</Text>
            </Pressable>
          ))}
        </View>
      </StateView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
