import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ExampleNotice from '../components/ExampleNotice';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';
import { JOURNAL, JournalEntry } from '../data/academic';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
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

/** Журнал успеваемости: РК1, РК2, рейтинг, экзамен, итог, буквенная оценка, GPA и посещаемость. */
export default function JournalScreen(_props: MainTabScreenProps<'Journal'>) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const gpa = calculateGpa(JOURNAL);
  const average = Math.round(JOURNAL.reduce((sum, entry) => sum + currentScore(entry), 0) / JOURNAL.length);
  const credits = JOURNAL.reduce((sum, entry) => sum + entry.credits, 0);

  const summary = [
    { label: t('journalAvg'), value: String(average) },
    { label: t('journalAttendance'), value: `${averageAttendance(JOURNAL)}%` },
    { label: t('journalCredits'), value: String(credits) },
  ];

  const header = (
    <View style={styles.header}>
      <TopBar label={t('appName')} />
      <View style={styles.titleBlock}>
        <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
          {t('journalTitle')}
        </Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{t('journalSubtitle')}</Text>
      </View>

      <ExampleNotice />

      <LinearGradient colors={[colors.cardStart, colors.cardEnd] as const} style={styles.summary}>
        <Text style={styles.summaryLabel}>{t('journalGpa')}</Text>
        <View style={styles.gpaRow}>
          <Text style={styles.gpaValue}>{gpa.toFixed(2)}</Text>
          <Text style={styles.gpaScale}>/ 4.00</Text>
        </View>
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
      </LinearGradient>

      <Text style={[type.caption, { color: colors.textMuted }]}>{t('journalFormula')}</Text>
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList
        data={JOURNAL}
        keyExtractor={(item) => item.subjectId}
        renderItem={({ item }) => <SubjectCard entry={item} />}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
      />
    </ScreenContainer>
  );
}

function Separator() {
  return <View style={styles.separator} />;
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
    fontFamily: fonts.light,
    fontSize: 56,
    letterSpacing: -2,
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
