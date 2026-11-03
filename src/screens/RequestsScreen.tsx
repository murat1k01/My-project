import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { CampusRequest, RequestStatus } from '../api/types';
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

type Tab = 'mine' | 'incoming';

const STATUS_LABELS: Record<RequestStatus, TranslationKey> = { pending: 'reqPending', decision: 'reqDecision', resolved: 'reqResolved' };
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
  const list = data?.[tab] ?? [];

  return (
    <View style={styles.content}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'mine', label: t('reqMine') },
          { value: 'incoming', label: t('reqIncoming') },
        ]}
        value={tab}
        onChange={setTab}
      />
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
    </View>
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
