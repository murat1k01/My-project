import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { getJournalEntry, JOURNAL } from '../../data/academic';
import { ASSIGNMENTS, COURSES, MOODLE_URL } from '../../data/lms';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { addDays, formatDayMonth } from '../../utils/format';
import { calculateGpa, currentScore, letterGrade } from '../../utils/grades';
import { openExternal } from '../../utils/links';
import type { ServiceScreenProps } from './types';

type Tab = 'courses' | 'tasks' | 'grades';

/** LMS — курсы с прогрессом, задания с отметкой выполнения и оценки с расчётом GPA. */
export default function LmsService({ service, onBack }: ServiceScreenProps) {
  const { colors, isDark } = useTheme();
  const { t, tr, language } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('courses');

  const isDone = (id: string) => campus.doneTasks.includes(id);
  const toggleTask = (id: string) =>
    updateCampus((prev) => ({
      ...prev,
      doneTasks: prev.doneTasks.includes(id) ? prev.doneTasks.filter((item) => item !== id) : [...prev.doneTasks, id],
    }));

  const tasksLeft = ASSIGNMENTS.filter((task) => !isDone(task.id)).length;
  const sortedTasks = [...ASSIGNMENTS].sort((a, b) => Number(isDone(a.id)) - Number(isDone(b.id)) || a.dueInDays - b.dueInDays);
  const courseById = (id: string) => COURSES.find((course) => course.id === id);

  return (
    <ServiceLayout service={service} onBack={onBack}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'courses', label: t('lmsCourses') },
          { value: 'tasks', label: t('lmsTasks') },
          { value: 'grades', label: t('lmsGrades') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'courses'
        ? COURSES.map((course) => (
            <GlassCard key={course.id}>
              <View style={styles.courseHeader}>
                <View style={[styles.courseIcon, { backgroundColor: course.color }]}>
                  <Ionicons name="book-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.flex}>
                  <Text style={[type.subheading, { color: colors.text }]}>{tr(course.title)}</Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{course.teacher}</Text>
                </View>
              </View>
              <ProgressBar value={course.progress / 100} color={course.color} />
              <Text style={[type.caption, { color: colors.textMuted }]}>{t('lmsProgress', { value: course.progress })}</Text>
            </GlassCard>
          ))
        : null}

      {tab === 'tasks' ? (
        <>
          <Text style={[type.caption, { color: colors.textSecondary }]}>{t('lmsTasksLeft', { count: tasksLeft })}</Text>
          {sortedTasks.map((task) => {
            const done = isDone(task.id);
            const overdue = !done && task.dueInDays < 0;
            const course = courseById(task.courseId);
            return (
              <GlassCard key={task.id} style={[styles.task, overdue && { borderColor: colors.danger }]}>
                <Pressable
                  onPress={() => toggleTask(task.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={`${t('lmsMarkDone')}: ${tr(task.title)}`}
                  hitSlop={8}
                  style={[styles.checkbox, { borderColor: done ? colors.success : colors.border, backgroundColor: done ? colors.success : 'transparent' }]}
                >
                  {done ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
                </Pressable>
                <View style={styles.flex}>
                  <Text style={[type.bodyMedium, { color: colors.text }, done && styles.doneText]}>{tr(task.title)}</Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{course ? tr(course.title) : ''}</Text>
                  <Text style={[type.caption, { color: done ? colors.success : overdue ? colors.danger : colors.textMuted }]}>
                    {done
                      ? t('lmsDone')
                      : overdue
                        ? t('lmsOverdue')
                        : t('lmsDue', { date: formatDayMonth(addDays(now, task.dueInDays), language) })}
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </>
      ) : null}

      {tab === 'grades' ? (
        <>
          <LinearGradient colors={[colors.cardStart, colors.cardEnd] as const} style={styles.gpaCard}>
            <Text style={styles.gpaLabel}>{t('lmsGpa')}</Text>
            <Text style={styles.gpaValue}>{calculateGpa(JOURNAL).toFixed(2)}</Text>
            <Text style={styles.gpaScale}>/ 4.00</Text>
          </LinearGradient>
          {COURSES.map((course) => {
            const entry = getJournalEntry(course.id);
            if (!entry) return null;
            const score = currentScore(entry);
            const grade = letterGrade(score);
            return (
              <GlassCard key={course.id} style={styles.gradeRow}>
                <View style={styles.flex}>
                  <Text style={[type.bodyMedium, { color: colors.text }]}>{tr(course.title)}</Text>
                  <ProgressBar value={score / 100} color={course.color} />
                </View>
                <Text style={[type.subheading, { color: colors.textSecondary }]}>{score}</Text>
                <View style={[styles.letter, { backgroundColor: isDark ? colors.pill : colors.round }]}>
                  <Text style={[styles.letterText, { color: isDark ? colors.onPill : colors.onRound }]}>{grade.letter}</Text>
                </View>
              </GlassCard>
            );
          })}
        </>
      ) : null}

      <PrimaryButton
        title={t('lmsOpenMoodle')}
        variant="primary"
        arrow
        onPress={() => openExternal(MOODLE_URL, { title: t('linkErrorTitle'), text: t('linkErrorText', { url: MOODLE_URL }) })}
      />
    </ServiceLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 4,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  task: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  doneText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  gpaCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  gpaLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  gpaValue: {
    fontFamily: fonts.light,
    fontSize: 56,
    letterSpacing: -2,
    color: '#FFFFFF',
  },
  gpaScale: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  gradeRow: {
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
});
