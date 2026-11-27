import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/AppText';
import EmptyState from '../components/EmptyState';
import ScreenScroll from '../components/ScreenScroll';
import { SERVICES } from '../data/services';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

type Entry = { key: string; icon: IoniconName; title: string; text: string; onPress: () => void };

/** «Ізденіс»: единый поиск по всем разделам приложения. */
export default function SearchScreen({ navigation }: MainTabScreenProps<'Search'>) {
  const { colors, isDark } = useTheme();
  const { t, tr } = useI18n();
  const [query, setQuery] = useState('');

  const entries = useMemo<Entry[]>(
    () => [
      ...SERVICES.filter((s) => !s.hidden).map((s) => ({
        key: s.id,
        icon: s.icon,
        title: tr(s.title),
        text: tr(s.description),
        onPress: () => (s.route ? navigation.navigate(s.route) : navigation.navigate('ServiceDetails', { serviceId: s.id })),
      })),
      { key: 'journal', icon: 'stats-chart-outline', title: t('gridGpa'), text: t('journalSubtitle'), onPress: () => navigation.navigate('Journal') },
      { key: 'card', icon: 'id-card-outline', title: t('cardTitle'), text: t('cardHomeText'), onPress: () => navigation.navigate('StudentCard') },
      { key: 'careers', icon: 'briefcase-outline', title: t('gridCareers'), text: t('careersSubtitle'), onPress: () => navigation.navigate('Careers') },
      { key: 'ai', icon: 'sparkles-outline', title: t('gridAi'), text: t('homeAiText'), onPress: () => navigation.navigate('Assistant') },
      { key: 'market', icon: 'storefront-outline', title: t('mpTitle'), text: t('mpSubtitle'), onPress: () => navigation.navigate('Marketplace') },
      { key: 'lostfound', icon: 'search-circle-outline', title: t('lfTitle'), text: t('lfSubtitle'), onPress: () => navigation.navigate('LostFound') },
      { key: 'study', icon: 'easel-outline', title: t('srTitle'), text: t('srSubtitle'), onPress: () => navigation.navigate('StudyRoom') },
      { key: 'wallet', icon: 'wallet-outline', title: t('walletTitle'), text: t('walletSearchText'), onPress: () => navigation.navigate('Wallet') },
      { key: 'docs', icon: 'document-text-outline', title: t('docTitle'), text: t('docSubtitle'), onPress: () => navigation.navigate('Documents') },
      { key: 'students', icon: 'people-outline', title: t('studentsTitle'), text: t('studentsSubtitle'), onPress: () => navigation.navigate('Students') },
      { key: 'messages', icon: 'mail-outline', title: t('msgTitle'), text: t('msgSubtitle'), onPress: () => navigation.navigate('Inbox') },
      { key: 'requests', icon: 'document-text-outline', title: t('requestsTitle'), text: t('searchRequestsText'), onPress: () => navigation.navigate('Requests') },
      { key: 'settings', icon: 'settings-outline', title: t('settingsTitle'), text: t('searchSettingsText'), onPress: () => navigation.navigate('Settings') },
    ],
    [navigation, t, tr],
  );

  const q = query.trim().toLowerCase();
  const found = q ? entries.filter((e) => `${e.title} ${e.text}`.toLowerCase().includes(q)) : entries;

  return (
    <ScreenScroll title={t('tabSearch')} subtitle={t('searchSubtitle')}>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={isDark ? colors.gold : colors.primary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('searchPlaceholder')}
          style={[styles.input, { color: colors.text }]}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('close')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {found.length === 0 ? (
        <EmptyState icon="search-outline" title={t('searchEmptyTitle')} message={t('searchEmptyText')} />
      ) : (
        <View style={styles.list}>
          {found.map((entry) => (
            <Pressable
              key={entry.key}
              onPress={entry.onPress}
              accessibilityRole="button"
              accessibilityLabel={entry.title}
              style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
            >
              <View style={[styles.icon, { borderColor: colors.gold, backgroundColor: colors.primarySoft }]}>
                <Ionicons name={entry.icon} size={20} color={isDark ? colors.gold : colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.title, { color: colors.text }]}>{entry.title}</Text>
                <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {entry.text}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gold} />
            </Pressable>
          ))}
        </View>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.card,
    fontSize: 15,
    lineHeight: 20,
  },
});
