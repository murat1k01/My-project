import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/AppText';
import EmptyState from '../../components/EmptyState';
import ExampleNotice from '../../components/ExampleNotice';
import ScreenScroll from '../../components/ScreenScroll';
import SegmentedTabs from '../../components/SegmentedTabs';
import { JOURNAL } from '../../data/academic';
import { getLessons, LessonType } from '../../data/schedule';
import { useApi } from '../../hooks/useApi';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { dateNames, TranslationKey } from '../../i18n/translations';
import { brand } from '../../theme/brand';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import type { IoniconName } from '../../types/Service';
import { addDays, minutesOfDay, toMinutes } from '../../utils/format';
import { finalOf, letterGrade } from '../../utils/grades';
import type { ServiceScreenProps } from './types';

type Tab = 'schedule' | 'exams' | 'tasks';
type Todo = { id: string; title: string; dueDate: string | null; done: boolean };

const LESSON_TYPE_LABEL: Record<LessonType, TranslationKey> = {
  lecture: 'lessonLecture',
  practice: 'lessonPractice',
  lab: 'lessonLab',
};
const LESSON_ICON: Record<LessonType, IoniconName> = {
  lecture: 'school-outline',
  practice: 'people-outline',
  lab: 'laptop-outline',
};

/**
 * «Сабақ кестесі»: тёмно-синяя шапка, вкладки «Кесте / Емтихандар / Тапсырмалар», переключение дней стрелками,
 * текущая пара — тёмно-синяя карточка с золотой меткой «Қазір», внизу — обратный отсчёт до следующей пары.
 */
export default function ScheduleService({ onBack, initialTab }: ServiceScreenProps) {
  const { colors, isDark } = useTheme();
  const { t, tr, language } = useI18n();
  const now = useNow();
  const focused = useIsFocused();
  const [tab, setTab] = useState<Tab>(initialTab === 'exams' || initialTab === 'tasks' ? initialTab : 'schedule');
  const [offset, setOffset] = useState(0);
  const todos = useApi<{ items: Todo[] }>(focused && tab === 'tasks' ? '/api/todos' : null);

  const date = addDays(now, offset);
  const weekday = date.getDay();
  const lessons = getLessons(weekday);
  const isToday = offset === 0;
  const nowMinutes = minutesOfDay(now);
  const heading = isDark ? colors.text : colors.primary;
  const dateLabel = `${isToday ? `${t('today')}, ` : `${dateNames[language].weekdays[weekday]}, `}${date.getDate()} ${dateNames[language].months[date.getMonth()]}`;

  // Обратный отсчёт до ближайшей пары сегодня
  const upcoming = getLessons(now.getDay()).find((lesson) => toMinutes(lesson.start) > nowMinutes);
  const left = upcoming ? toMinutes(upcoming.start) - nowMinutes : null;

  return (
    <ScreenScroll title={t('gridSchedule')} onBack={onBack}>
      <SegmentedTabs<Tab>
        options={[
          { value: 'schedule', label: t('schTabSchedule') },
          { value: 'exams', label: t('schTabExams') },
          { value: 'tasks', label: t('schTabTasks') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'schedule' ? (
        <>
          <View style={styles.dateRow}>
            <Pressable onPress={() => setOffset((v) => v - 1)} accessibilityRole="button" accessibilityLabel={t('schPrevDay')} style={[styles.arrow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="chevron-back" size={18} color={heading} />
            </Pressable>
            <Pressable onPress={() => setOffset(0)} accessibilityRole="button" accessibilityLabel={t('today')} style={styles.dateCenter}>
              <Ionicons name="calendar-outline" size={18} color={isDark ? colors.gold : colors.primary} />
              <Text style={[styles.dateText, { color: heading }]}>{dateLabel}</Text>
            </Pressable>
            <Pressable onPress={() => setOffset((v) => v + 1)} accessibilityRole="button" accessibilityLabel={t('schNextDay')} style={[styles.arrow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="chevron-forward" size={18} color={heading} />
            </Pressable>
          </View>

          {lessons.length === 0 ? (
            <EmptyState icon="cafe-outline" title={t('noLessons')} message={dateNames[language].weekdays[weekday]} />
          ) : (
            lessons.map((lesson) => {
              const current = isToday && nowMinutes >= toMinutes(lesson.start) && nowMinutes < toMinutes(lesson.end);
              const fg = current ? brand.ivory : colors.text;
              const sub = current ? 'rgba(248, 243, 232, 0.75)' : colors.textSecondary;
              return (
                <View key={lesson.id} style={[styles.lessonRow, current && { backgroundColor: brand.navy, borderColor: brand.gold }, !current && { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <View style={styles.time}>
                    <Text style={[styles.timeText, { color: fg }]}>{lesson.start}</Text>
                    <Text style={[styles.timeText, { color: sub }]}>{lesson.end}</Text>
                  </View>
                  <View style={[styles.lessonCard, current ? { borderLeftColor: brand.gold } : { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name={LESSON_ICON[lesson.type]} size={22} color={current ? brand.gold : isDark ? colors.gold : colors.primary} />
                    <View style={styles.flex}>
                      <Text style={[styles.subject, { color: fg }]} numberOfLines={2}>
                        {tr(lesson.subject)}
                      </Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={13} color={sub} />
                        <Text style={[type.caption, { color: sub }]}>{lesson.room}</Text>
                        <Text style={[type.caption, { color: sub }]}>· {t(LESSON_TYPE_LABEL[lesson.type])}</Text>
                      </View>
                      <Text style={[type.caption, { color: sub }]} numberOfLines={1}>
                        {lesson.teacher}
                      </Text>
                    </View>
                    {current ? (
                      <View style={styles.nowPill}>
                        <View style={styles.nowDot} />
                        <Text style={styles.nowText}>{t('lessonNow')}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}

          <View style={[styles.countdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="hourglass-outline" size={30} color={colors.gold} />
            <View style={styles.flex}>
              <Text style={[type.caption, { color: colors.textSecondary }]}>{left !== null ? t('schUntilNext') : t('schNoMoreToday')}</Text>
              {left !== null ? (
                <Text style={[styles.countValue, { color: heading }]}>
                  {left >= 60 ? t('schHoursMinutes', { h: Math.floor(left / 60), m: left % 60 }) : t('schMinutes', { m: left })}
                </Text>
              ) : null}
            </View>
          </View>
          <ExampleNotice textKey="sectionNote" />
        </>
      ) : null}

      {tab === 'exams' ? (
        <View style={styles.list}>
          <Text style={[type.caption, { color: colors.textSecondary }]}>{t('schExamsHint')}</Text>
          {JOURNAL.map((entry) => {
            const final = finalOf(entry);
            return (
              <View key={entry.subjectId} style={[styles.examRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name={entry.exam === null ? 'time-outline' : 'checkmark-circle-outline'} size={22} color={entry.exam === null ? colors.gold : colors.success} />
                <View style={styles.flex}>
                  <Text style={[styles.subject, { color: colors.text }]}>{tr(entry.subject)}</Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{entry.exam === null ? t('schExamPending') : t('schExamScore', { score: entry.exam })}</Text>
                </View>
                {final !== null ? (
                  <View style={[styles.letter, { backgroundColor: isDark ? colors.gold : colors.primary }]}>
                    <Text style={[styles.letterText, { color: isDark ? colors.onPrimary : '#FFFFFF' }]}>{letterGrade(final).letter}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          <ExampleNotice textKey="journalNote" />
        </View>
      ) : null}

      {tab === 'tasks' ? (
        <View style={styles.list}>
          <Text style={[type.caption, { color: colors.textSecondary }]}>{t('schTasksHint')}</Text>
          {(todos.data?.items ?? []).length === 0 ? (
            <EmptyState icon="checkbox-outline" title={t('schTasksEmpty')} message={t('schTasksEmptyText')} />
          ) : (
            (todos.data?.items ?? []).map((item) => (
              <View key={item.id} style={[styles.examRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name={item.done ? 'checkbox' : 'square-outline'} size={22} color={item.done ? colors.success : colors.gold} />
                <View style={styles.flex}>
                  <Text style={[styles.subject, { color: colors.text }, item.done && styles.done]}>{item.title}</Text>
                  {item.dueDate ? <Text style={[type.caption, { color: colors.textSecondary }]}>{item.dueDate.split('-').reverse().join('.')}</Text> : null}
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  dateText: {
    fontFamily: fonts.card,
    fontSize: 16,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  time: {
    width: 54,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: fonts.card,
    fontSize: 14,
  },
  lessonCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    borderLeftWidth: 1,
  },
  subject: {
    fontFamily: fonts.card,
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: brand.gold,
  },
  nowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brand.navy,
  },
  nowText: {
    fontFamily: fonts.card,
    fontSize: 12,
    color: brand.navy,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  countValue: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    lineHeight: 34,
  },
  list: {
    gap: spacing.sm,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  letter: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  letterText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  done: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
