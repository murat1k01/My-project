import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import ExampleNotice from '../components/ExampleNotice';
import GlassCard from '../components/GlassCard';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';
import { useCampus } from '../context/CampusContext';
import { REPAIR_CATEGORIES } from '../data/dorm';
import { collectRequests, KIND_LABEL, RequestItem, RequestStage, requestTimeline, STAGE_LABEL } from '../data/requests';
import { useNow } from '../hooks/useNow';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import { formatDateTime, formatPhone } from '../utils/format';

const STAGES: RequestStage[] = ['pending', 'decision', 'resolved'];

/** «Мои заявки»: отклики и заявки по студентам + заявки на ремонт, со статусом и датами смены статуса. */
export default function RequestsScreen({ navigation }: RootStackScreenProps<'Requests'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { campus } = useCampus();
  const now = useNow(30_000);
  const requests = collectRequests(campus);

  const header = (
    <View style={styles.header}>
      <TopBar onBack={navigation.goBack} />
      <View style={styles.titleBlock}>
        <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
          {t('requestsTitle')}
        </Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{t('requestsSubtitle')}</Text>
      </View>
      <ExampleNotice textKey="reqDemoNote" />
    </View>
  );

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard item={item} now={now} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState icon="document-text-outline" title={t('requestsEmptyTitle')} message={t('requestsEmptyText')} />}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
      />
    </ScreenContainer>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function RequestCard({ item, now }: { item: RequestItem; now: Date }) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const timeline = requestTimeline(item.createdAt, now);

  const stageColor: Record<RequestStage, { background: string; text: string }> = {
    pending: { background: colors.warningSoft, text: colors.warning },
    decision: { background: colors.primarySoft, text: colors.text },
    resolved: { background: colors.successSoft, text: colors.success },
  };
  const repair = item.repairCategory ? REPAIR_CATEGORIES.find((category) => category.id === item.repairCategory) : undefined;
  const icon: IoniconName = item.kind === 'repair' ? (repair?.icon ?? 'construct-outline') : 'chatbubble-ellipses-outline';
  const subtitle = item.kind === 'repair' ? (repair ? t(repair.label) : '') : item.phone ? `${t('studentLabel')} · ${formatPhone(item.phone)}` : '';

  return (
    <GlassCard>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={18} color={colors.text} />
        </View>
        <View style={styles.flex}>
          <Text style={[type.subheading, { color: colors.text }]}>{t(KIND_LABEL[item.kind])}</Text>
          {subtitle ? <Text style={[type.caption, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
        <View style={[styles.badge, { backgroundColor: stageColor[timeline.stage].background }]}>
          <Text style={[styles.badgeText, { color: stageColor[timeline.stage].text }]}>{t(STAGE_LABEL[timeline.stage])}</Text>
        </View>
      </View>

      <Text style={[type.body, { color: colors.textSecondary }]}>{item.text}</Text>
      <Text style={[type.caption, { color: colors.textMuted }]}>
        {t('reqChanged', { date: formatDateTime(timeline.changedAt.toISOString(), language) })}
      </Text>

      {/* Шкала статусов с датой каждого перехода */}
      <Text style={[type.label, { color: colors.textMuted }]}>{t('reqTimeline').toUpperCase()}</Text>
      {STAGES.map((stage) => {
        const reached = timeline.history.find((entry) => entry.stage === stage);
        return (
          <View key={stage} style={styles.step}>
            <View style={[styles.dot, { backgroundColor: reached ? stageColor[stage].text : colors.border }]} />
            <Text style={[type.body, styles.flex, { color: reached ? colors.text : colors.textMuted }]}>{t(STAGE_LABEL[stage])}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>
              {reached ? formatDateTime(reached.date.toISOString(), language) : '—'}
            </Text>
          </View>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  separator: {
    height: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
