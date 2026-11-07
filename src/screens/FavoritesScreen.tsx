import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from '../components/AppText';
import EmptyState from '../components/EmptyState';
import FormBanner from '../components/FormBanner';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import SegmentedTabs from '../components/SegmentedTabs';
import { deleteFavorite, FavoriteNotice, loadFavorites, toggleFavoriteRead } from '../database/favorites';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { confirmAction } from '../utils/dialogs';

type Filter = 'all' | 'unread';

/** Лабораторная работа №10: объявления, сохранённые в SQLite на устройстве. Работает без интернета. */
export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [items, setItems] = useState<FavoriteNotice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);

  /** Выполняет действие с базой и перечитывает список; пока идёт работа, кнопки выключены */
  const run = useCallback(
    async (action?: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        if (action) await action();
        setItems(await loadFavorites());
      } catch {
        setError(t('favDbError'));
      } finally {
        setLoaded(true);
        setBusy(false);
      }
    },
    [t],
  );

  // Каждый раз при открытии вкладки список читается из базы заново
  useFocusEffect(
    useCallback(() => {
      void run();
    }, [run]),
  );

  const remove = (item: FavoriteNotice) => {
    confirmAction({
      title: t('favDeleteTitle'),
      text: t('favDeleteText', { title: item.title }),
      confirm: t('favDelete'),
      cancel: t('cancel'),
      destructive: true,
      onConfirm: () => void run(() => deleteFavorite(item.id)),
    });
  };

  const unreadCount = items.filter((item) => item.isRead === 0).length;
  const visible = filter === 'unread' ? items.filter((item) => item.isRead === 0) : items;

  return (
    <ScreenScroll title={t('favTitle')} subtitle={t('favUnreadCount', { count: unreadCount })}>
      <SegmentedTabs<Filter>
        options={[
          { value: 'all', label: `${t('favAll')} · ${items.length}` },
          { value: 'unread', label: `${t('favUnread')} · ${unreadCount}` },
        ]}
        value={filter}
        onChange={setFilter}
      />
      {error ? <FormBanner text={error} /> : null}

      {loaded && visible.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title={filter === 'unread' && items.length > 0 ? t('favNoUnread') : t('favEmptyTitle')}
          message={filter === 'unread' && items.length > 0 ? t('favNoUnreadText') : t('favEmptyText')}
        />
      ) : null}

      {visible.map((item) => (
        <GlassCard key={item.id}>
          <View style={styles.header}>
            <Text style={[type.subheading, styles.flex, { color: colors.text }]}>{item.title}</Text>
            <View style={[styles.badge, { backgroundColor: item.isRead ? colors.successSoft : colors.warningSoft }]}>
              <Text style={[type.label, { color: item.isRead ? colors.success : colors.warning }]}>{item.isRead ? t('favRead') : t('favNotRead')}</Text>
            </View>
          </View>
          <Text style={[type.body, { color: colors.textSecondary }]}>{item.body}</Text>
          <View style={styles.actions}>
            <PrimaryButton title={t('favToggle')} variant="glass" compact icon="swap-horizontal-outline" disabled={busy} onPress={() => void run(() => toggleFavoriteRead(item.id))} />
            <PrimaryButton title={t('favDelete')} variant="danger" compact icon="trash-outline" disabled={busy} onPress={() => remove(item)} />
          </View>
        </GlassCard>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
