import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Polyline, Stop } from 'react-native-svg';
import { Text } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import Chip from '../components/Chip';
import ExampleNotice from '../components/ExampleNotice';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import ScreenScroll from '../components/ScreenScroll';
import SegmentedTabs from '../components/SegmentedTabs';
import type { RootStackScreenProps } from '../navigation/types';
import { JOURNAL, JournalEntry } from '../data/academic';
import { useI18n } from '../i18n/LanguageContext';
import { brand } from '../theme/brand';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import {
  ADMISSION_MIN,
  averageAttendance,
  calculateGpa,
  currentScore,
  finalOf,
  hasAdmission,
  letterGrade,
  ratingOf,
} from '../utils/grades';

type Tab = 'current' | 'semester' | 'overall';

/** GPA по неделям семестра: средняя оценка каждого предмета за прошедшие недели, взвешенная по кредитам. */
function weeklyGpa(entries: JournalEntry[]): number[] {
  const weeks = Math.max(...entries.map((entry) => entry.weekly.length));
  const credits = entries.reduce((sum, entry) => sum + entry.credits, 0);
  const result: number[] = [];
  for (let week = 1; week <= weeks; week += 1) {
    const weighted = entries.reduce((sum, entry) => {
      const part = entry.weekly.slice(0, week);
      const avg = part.reduce((a, b) => a + b, 0) / Math.max(part.length, 1);
      return sum + letterGrade(avg).points * entry.credits;
    }, 0);
    result.push(Math.round((weighted / credits) * 100) / 100);
  }
  return result;
}

const CHART_W = 300;
const CHART_H = 120;

/** Тёмно-синяя карточка с золотой линией GPA по неделям. */
function GpaChart({ values, label }: { values: number[]; label: string }) {
  const min = Math.max(0, Math.min(...values) - 0.3);
  const max = Math.min(4, Math.max(...values) + 0.2);
  const x = (i: number) => 12 + (i * (CHART_W - 24)) / Math.max(values.length - 1, 1);
  const y = (v: number) => CHART_H - 14 - ((v - min) / Math.max(max - min, 0.01)) * (CHART_H - 28);
  const coords = values.map((v, i) => x(i) + ',' + y(v));
  const area = 'M' + x(0) + ',' + CHART_H + ' L' + coords.join(' L') + ' L' + x(values.length - 1) + ',' + CHART_H + ' Z';
  const last = values.length - 1;
  return (
    <View style={styles.chart} accessibilityRole="image" accessibilityLabel={label}>
      <Svg width="100%" height={CHART_H} viewBox={'0 0 ' + CHART_W + ' ' + CHART_H}>
        <Defs>
          <SvgGradient id="gpaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={brand.gold} stopOpacity={0.35} />
            <Stop offset="1" stopColor={brand.gold} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Path d={area} fill="url(#gpaFill)" />
        <Polyline points={coords.join(' ')} fill="none" stroke={brand.gold} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) =>
          i % 3 === 0 || i === last ? <Circle key={i} cx={x(i)} cy={y(v)} r={i === last ? 5 : 3.5} fill={i === last ? '#FFFFFF' : brand.gold} stroke={brand.gold} strokeWidth={2} /> : null,
        )}
      </Svg>
    </View>
  );
}

/** Журнал успеваемости «Үлгерім (GPA)»: текущий GPA с графиком, оценки за семестр и общий итог с калькулятором. */
export default function JournalScreen({ navigation }: RootStackScreenProps<'Journal'>) {
  const { colors, isDark } = useTheme();
  const { t, tr } = useI18n();
  const [tab, setTab] = useState<Tab>('current');
  // Калькулятор: ожидаемая оценка за ещё не сданные экзамены
  const [expected, setExpected] = useState<Record<string, number>>({});

  const gpa = calculateGpa(JOURNAL);
  const trend = weeklyGpa(JOURNAL);
  const average = Math.round(JOURNAL.reduce((sum, entry) => sum + currentScore(entry), 0) / JOURNAL.length);
  const credits = JOURNAL.reduce((sum, entry) => sum + entry.credits, 0);
  const pending = JOURNAL.filter((entry) => entry.exam === null);
  const predicted = calculateGpa(
    JOURNAL.map((entry) => (entry.exam === null && expected[entry.subjectId] !== undefined ? { ...entry, exam: expected[entry.subjectId] } : entry)),
  );

  const summary = [
    { label: t('journalAvg'), value: String(average) },
    { label: t('journalAttendance'), value: `${averageAttendance(JOURNAL)}%` },
    { label: t('journalCredits'), value: String(credits) },
  ];

  const links: { icon: IoniconName; label: string; onPress: () => void }[] = [
    { icon: 'reader-outline', label: t('gpaGrades'), onPress: () => setTab('semester') },
    { icon: 'calculator-outline', label: t('gpaCalculator'), onPress: () => setTab('overall') },
    { icon: 'map-outline', label: t('gpaPlan'), onPress: () => navigation.navigate('ServiceDetails', { serviceId: 'lms' }) },
    { icon: 'ribbon-outline', label: t('gpaGrant'), onPress: () => navigation.navigate('InfoDetail', { slug: 'opportunities' }) },
  ];

  return (
    <ScreenScroll title={t('gridGpa')} onBack={navigation.goBack}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'current', label: t('gpaTabCurrent') },
          { value: 'semester', label: t('gpaTabSemester') },
          { value: 'overall', label: t('gpaTabOverall') },
        ]}
        value={tab}
        onChange={setTab}
      />
      <ExampleNotice textKey="journalNote" />

      {tab === 'current' ? (
        <>
          <View style={[styles.gpaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.gpaLabel, { color: colors.textSecondary }]}>GPA</Text>
            <View style={styles.laurelRow}>
              <Ionicons name="leaf" size={34} color={colors.gold} style={styles.laurelLeft} />
              <View style={styles.gpaRow}>
                <Text style={[styles.gpaValue, { color: isDark ? colors.text : colors.primary }]}>{gpa.toFixed(2)}</Text>
                <Text style={[styles.gpaScale, { color: colors.textMuted }]}>/ 4.00</Text>
              </View>
              <Ionicons name="leaf" size={34} color={colors.gold} style={styles.laurelRight} />
            </View>
          </View>
          <GpaChart values={trend} label={t('gpaChart')} />
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('gpaChart')}</Text>
          <View style={[styles.links, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {links.map((link, index) => (
              <Pressable
                key={link.label}
                onPress={link.onPress}
                accessibilityRole="button"
                style={({ pressed }) => [styles.linkRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }, pressed && styles.pressed]}
              >
                <Ionicons name={link.icon} size={20} color={isDark ? colors.gold : colors.primary} />
                <Text style={[styles.linkLabel, { color: colors.text }]}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.gold} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {tab === 'semester' ? (
        <View style={styles.subjects}>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('journalFormula')}</Text>
          {JOURNAL.map((entry) => (
            <SubjectCard key={entry.subjectId} entry={entry} />
          ))}
        </View>
      ) : null}

      {tab === 'overall' ? (
        <View style={styles.subjects}>
          <View style={[styles.summary, { backgroundColor: brand.navy }]}>
            <View style={styles.summaryStats}>
              {summary.map((item) => (
                <View key={item.label} style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{item.value}</Text>
                  <Text style={styles.summaryStatLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={[type.heading, { color: isDark ? colors.text : colors.primary }]}>{t('gpaCalculator')}</Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>{pending.length > 0 ? t('gpaCalcHint') : t('gpaCalcNone')}</Text>
          {pending.map((entry) => (
            <GlassCard key={entry.subjectId} style={styles.calcCard}>
              <Text style={[type.subheading, { color: colors.text }]}>{tr(entry.subject)}</Text>
              <View style={styles.calcChips}>
                {[60, 70, 80, 90, 100].map((score) => (
                  <Chip
                    key={score}
                    label={String(score)}
                    selected={expected[entry.subjectId] === score}
                    onPress={() => setExpected((prev) => ({ ...prev, [entry.subjectId]: score }))}
                  />
                ))}
              </View>
            </GlassCard>
          ))}
          {pending.length > 0 ? (
            <View style={[styles.predicted, { borderColor: colors.gold, backgroundColor: colors.primarySoft }]}>
              <Text style={[type.body, styles.flex, { color: colors.text }]}>{t('gpaPredicted')}</Text>
              <Text style={[styles.predictedValue, { color: isDark ? colors.gold : colors.primary }]}>{predicted.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScreenScroll>
  );
}

/** Карточка предмета. По нажатию раскрываются оценки по неделям. */
function SubjectCard({ entry }: { entry: JournalEntry }) {
  const { colors, isDark } = useTheme();
  const { t, tr } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const rating = ratingOf(entry);
  const final = finalOf(entry);
  const admitted = hasAdmission(entry);
  const grade = letterGrade(currentScore(entry));
  const scoreColor = (value: number) => (value >= 70 ? colors.success : value >= ADMISSION_MIN ? colors.warning : colors.danger);

  const cells: { label: string; value: number | null; highlight?: boolean }[] = [
    { label: t('jRk1'), value: entry.rk1 },
    { label: t('jRk2'), value: entry.rk2 },
    { label: t('jRating'), value: rating, highlight: true },
    { label: t('jExam'), value: entry.exam },
    { label: t('jFinal'), value: final, highlight: true },
  ];

  return (
    <GlassCard style={!admitted && { borderColor: colors.danger }}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityHint={t('jShowWeekly')}
        style={styles.subjectHeader}
      >
        <View style={styles.flex}>
          <Text style={[type.subheading, { color: colors.text }]}>{tr(entry.subject)}</Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>
            {entry.teacher} · {t('jCredits', { count: entry.credits })}
          </Text>
        </View>
        <View style={[styles.letter, { backgroundColor: isDark ? colors.pill : colors.round }]}>
          <Text style={[styles.letterText, { color: isDark ? colors.onPill : colors.onRound }]}>{grade.letter}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>

      {/* Таблица оценок: РК1, РК2, рейтинг, экзамен, итог */}
      <View style={styles.cells}>
        {cells.map((cell) => (
          <View
            key={cell.label}
            style={[styles.cell, { borderColor: colors.border, backgroundColor: cell.highlight ? colors.primarySoft : colors.glass }]}
          >
            <Text style={[styles.cellLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {cell.label}
            </Text>
            <Text style={[styles.cellValue, { color: cell.value === null ? colors.textMuted : scoreColor(cell.value) }]}>
              {cell.value === null ? t('jNotYet') : cell.value}
            </Text>
          </View>
        ))}
      </View>

      {!admitted ? (
        <View style={[styles.warning, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons name="warning-outline" size={16} color={colors.danger} />
          <Text style={[type.caption, styles.flex, { color: colors.danger }]}>{t('jNoAdmission', { min: ADMISSION_MIN })}</Text>
        </View>
      ) : null}

      <View style={styles.attendanceRow}>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{t('journalAttendance')}</Text>
        <Text style={[type.caption, { color: colors.text }]}>{entry.attendance}%</Text>
      </View>
      <ProgressBar value={entry.attendance / 100} color={entry.attendance >= 80 ? colors.success : colors.warning} />

      {expanded ? (
        <View style={styles.weekly}>
          <Text style={[type.label, { color: colors.textMuted }]}>{t('jWeekly').toUpperCase()}</Text>
          <View style={styles.bars}>
            {entry.weekly.map((value, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.barFill, { height: `${value}%`, backgroundColor: scoreColor(value) }]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.textMuted }]}>{index + 1}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: brand.navy,
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.4)',
  },
  gpaCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  gpaLabel: {
    fontFamily: fonts.card,
    fontSize: 16,
  },
  links: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 54,
  },
  linkLabel: {
    flex: 1,
    fontFamily: fonts.card,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
  subjects: {
    gap: spacing.md,
  },
  calcCard: {
    gap: spacing.sm,
  },
  calcChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  predicted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  predictedValue: {
    fontFamily: fonts.serifBold,
    fontSize: 34,
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
  summary: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.55)',
  },
  laurelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  laurelLeft: {
    transform: [{ rotate: '-35deg' }, { scaleX: -1 }],
  },
  laurelRight: {
    transform: [{ rotate: '35deg' }],
  },
  summaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  gpaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  gpaValue: {
    fontFamily: fonts.serifBold,
    fontSize: 58,
    color: '#FFFFFF',
  },
  gpaScale: {
    marginBottom: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  summaryStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  summaryValue: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  summaryStatLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  letter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  cells: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  cellLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  cellValue: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekly: {
    gap: spacing.sm,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    height: 64,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontFamily: fonts.regular,
    fontSize: 9,
  },
});
