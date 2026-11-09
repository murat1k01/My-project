import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import type { FavoriteNotice } from '../database/favorites';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';
import SegmentedTabs from './SegmentedTabs';

export type SavedFilter = 'all' | 'unread';

type Props = {
  items: FavoriteNotice[];
  filter: SavedFilter;
  onFilterChange: (filter: SavedFilter) => void;
  busy: boolean;
  onToggleRead: (item: FavoriteNotice) => void;
  onDelete: (item: FavoriteNotice) => void;
};

/**
 * Избранные объявления в верхней части раздела «Информация». Они хранятся в SQLite на устройстве
 * и открываются без интернета. Каждое отмечено галочкой.
 */
export default function SavedNotices({ items, filter, onFilterChange, busy, onToggleRead, onDelete }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const unread = items.filter((item) => item.isRead === 0).length;
  const visible = filter === 'unread' ? items.filter((item) => item.isRead === 0) : items;

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Ionicons name="checkmark-done-circle" size={22} color={colors.success} />
        <Text style={[type.heading, styles.flex, { color: colors.text }]} accessibilityRole="header">
          {t('favTitle')}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('favUnreadCount', { count: unread })}</Text>
      </View>
      <SegmentedTabs<SavedFilter>
        options={[
          { value: 'all', label: `${t('favAll')} · ${items.length}` },
          { value: 'unread', label: `${t('favUnread')} · ${unread}` },
        ]}
        value={filter}
        onChange={onFilterChange}
      />
      {visible.length === 0 ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('favNoUnreadText')}</Text> : null}
      {visible.map((item) => (
        <GlassCard key={item.id} style={{ borderColor: colors.success }}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} accessibilityLabel={t('favSavedMark')} />
            <Text style={[type.subheading, styles.flex, { color: colors.text }]}>{item.title}</Text>
            <View style={[styles.badge, { backgroundColor: item.isRead ? colors.successSoft : colors.warningSoft }]}>
              <Text style={[type.label, { color: item.isRead ? colors.success : colors.warning }]}>{item.isRead ? t('favRead') : t('favNotRead')}</Text>
            </View>
          </View>
          <Text style={[type.body, { color: colors.textSecondary }]}>{item.body}</Text>
          <View style={styles.actions}>
            <PrimaryButton title={t('favToggle')} variant="glass" compact icon="swap-horizontal-outline" disabled={busy} onPress={() => onToggleRead(item)} />
            <PrimaryButton title={t('favDelete')} variant="danger" compact icon="trash-outline" disabled={busy} onPress={() => onDelete(item)} />
          </View>
        </GlassCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  section: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
