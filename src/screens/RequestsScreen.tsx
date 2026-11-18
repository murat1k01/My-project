import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { CampusRequest, Membership, RequestStatus } from '../api/types';
import { MEMBERSHIP_PLANS } from '../data/sport';
import { Text } from '../components/AppText';
import GlassCard from '../components/GlassCard';
import ScreenScroll from '../components/ScreenScroll';
import SegmentedTabs from '../components/SegmentedTabs';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { formatDateTime } from '../utils/format';

type Tab = 'mine' | 'incoming' | 'sport';

const STATUS_LABELS: Record<RequestStatus, TranslationKey> = { pending: 'reqPending', decision: 'reqDecision', resolved: 'reqResolved' };
const MEMBERSHIP_LABELS: Record<Membership['status'], TranslationKey> = { pending: 'sportPending', active: 'sportActive', canceled: 'sportStatusCanceled' };
const KIND_LABELS: Record<CampusRequest['kind'], TranslationKey> = { repair: 'reqKindRepair', response: 'reqKindResponse', application: 'reqKindApplication' };

export default function RequestsScreen({ navigation }: RootStackScreenProps<'Requests'>) {
  const { t } = useI18n();
  return (
    <ScreenScroll title={t('requestsTitle')} subtitle={t('requestsSubtitle')} onBack={navigation.goBack}>
      <RequestsList />
    </ScreenScroll>
  );
}

function RequestsList() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('mine');
  const focused = useIsFocused();
  const { data, loading, error, reload } = useApi<{ mine: CampusRequest[]; incoming: CampusRequest[] }>(focused ? '/api/requests' : null);
  const sport = useApi<{ items: Membership[] }>(focused && tab === 'sport' ? '/api/membership/history' : null);
  const list = tab === 'sport' ? [] : (data?.[tab] ?? []);

  return (
    <View style={styles.content}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'mine', label: t('reqMine') },
          { value: 'incoming', label: t('reqIncoming') },
          { value: 'sport', label: t('reqSport') },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'sport' ? (
        <StateView
          loading={sport.loading}
          error={sport.error}
          hasData={sport.data !== null}
          empty={(sport.data?.items.length ?? 0) === 0}
          emptyIcon="barbell-outline"
          emptyTitle={t('requestsEmptyTitle')}
          emptyText={t('sportHistoryEmpty')}
          onRetry={() => void sport.reload()}
        >
          {sport.data?.items.map((item) => (
            <MembershipCard key={item.id} item={item} />
          ))}
        </StateView>
      ) : (
      <StateView
        loading={loading}
        error={error}
        hasData={data !== null}
        empty={list.length === 0}
        emptyIcon="document-text-outline"
        emptyTitle={t('requestsEmptyTitle')}
        emptyText={t('requestsEmptyText')}
        onRetry={() => void reload()}
      >
        {list.map((item) => (
          <RequestCard key={item.id} item={item} />
        ))}
      </StateView>
      )}
    </View>
  );
}

function MembershipCard({ item }: { item: Membership }) {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === item.planId);
  const tone = item.status === 'active' ? colors.success : item.status === 'pending' ? colors.warning : colors.textMuted;
  return (
    <GlassCard>
      <View style={styles.header}>
        <Ionicons name="barbell-outline" size={20} color={colors.primary} />
        <Text style={[type.subheading, styles.flex, { color: colors.text }]}>
          {t('reqKindMembership')} · {plan ? tr(plan.name) : item.planId}
        </Text>
        <Text style={[type.label, { color: tone }]}>{t(MEMBERSHIP_LABELS[item.status])}</Text>
      </View>
      <Text style={[type.caption, { color: colors.textMuted }]}>{formatDateTime(item.createdAt, language)}</Text>
      {item.expiresAt && item.status === 'active' ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('sportValidUntil', { date: formatDateTime(item.expiresAt, language) })}</Text> : null}
    </GlassCard>
  );
}

function RequestCard({ item }: { item: CampusRequest }) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const statusColor = item.status === 'resolved' ? colors.success : item.status === 'decision' ? colors.primary : colors.warning;

  return (
    <GlassCard>
      <View style={styles.header}>
        <Text style={[type.subheading, styles.flex, { color: colors.text }]}>
          {t(KIND_LABELS[item.kind])}
          {item.category ? ` · ${item.category}` : ''}
        </Text>
        <Text style={[type.label, { color: statusColor }]}>{t(STATUS_LABELS[item.status])}</Text>
      </View>
      {item.fromFirstName ? (
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {t('reqFrom', { name: `${item.fromFirstName} ${item.fromLastName ?? ''}`.trim() })}
        </Text>
      ) : null}
      <Text style={[type.body, { color: colors.textSecondary }]}>{item.text}</Text>
      {item.history.map((entry, index) => (
        <Text key={index} style={[type.caption, { color: colors.textMuted }]}>
          {t(STATUS_LABELS[entry.status])} · {formatDateTime(entry.at, language)}
        </Text>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
