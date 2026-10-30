import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Chip from '../../components/Chip';
import EmptyState from '../../components/EmptyState';
import GlassCard from '../../components/GlassCard';
import ServiceLayout from '../../components/ServiceLayout';
import { getLessons, LessonType, STUDY_DAYS } from '../../data/schedule';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { dateNames, TranslationKey } from '../../i18n/translations';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { addDays, minutesOfDay, toMinutes } from '../../utils/format';
import type { ServiceScreenProps } from './types';

const LESSON_TYPE_LABEL: Record<LessonType, TranslationKey> = {
  lecture: 'lessonLecture',
  practice: 'lessonPractice',
  lab: 'lessonLab',
};

/** CAL — расписание занятий на неделю с подсветкой текущей и следующей пары. */
export default function ScheduleService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const now = useNow();
  const today = now.getDay();
  const [day, setDay] = useState(STUDY_DAYS.includes(today) ? today : 1);

  // Даты текущей недели: понедельник = сегодня − (номер дня − 1)
  const monday = addDays(now, -((today + 6) % 7));
  const lessons = getLessons(day);
  const isToday = day === today;
  const nowMinutes = minutesOfDay(now);
  const nextIndex = isToday ? lessons.findIndex((lesson) => nowMinutes < toMinutes(lesson.end)) : -1;

  return (
    <ServiceLayout service={service} onBack={onBack}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {STUDY_DAYS.map((weekday) => (
          <Chip
            key={weekday}
            label={`${dateNames[language].weekdaysShort[weekday]} ${addDays(monday, weekday - 1).getDate()}${weekday === today ? ' •' : ''}`}
            selected={weekday === day}
            onPress={() => setDay(weekday)}
          />
        ))}
      </ScrollView>

      <Text style={[type.caption, { color: colors.textSecondary }]}>
        {dateNames[language].weekdays[day]}
        {isToday ? ` · ${t('today')}` : ''} · {t('lessonsCount', { count: lessons.length })}
      </Text>

      {lessons.length === 0 ? (
        <EmptyState icon="cafe-outline" title={t('noLessons')} message={dateNames[language].weekdays[day]} />
      ) : (
        lessons.map((lesson, index) => {
          const current = isToday && nowMinutes >= toMinutes(lesson.start) && nowMinutes < toMinutes(lesson.end);
          const next = !current && index === nextIndex;
          return (
            <GlassCard key={lesson.id} style={[styles.lesson, (current || next) && { borderColor: current ? colors.success : colors.primary }]}>
              <View style={styles.time}>
                <Text style={[type.subheading, { color: colors.text }]}>{lesson.start}</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>{lesson.end}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: current ? colors.success : colors.border }]} />
              <View style={styles.info}>
                <View style={styles.tags}>
                  <View style={[styles.tag, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>{t(LESSON_TYPE_LABEL[lesson.type])}</Text>
                  </View>
                  {current || next ? (
                    <View style={[styles.tag, { backgroundColor: current ? colors.successSoft : colors.glass }]}>
                      <Text style={[styles.tagText, { color: current ? colors.success : colors.text }]}>
                        {current ? t('lessonNow') : t('lessonNext')}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[type.bodyMedium, { color: colors.text }]}>{tr(lesson.subject)}</Text>
                <Text style={[type.caption, { color: colors.textSecondary }]}>
                  {t('room', { room: lesson.room })} · {lesson.teacher}
                </Text>
              </View>
            </GlassCard>
          );
        })
      )}
    </ServiceLayout>
  );
}

const styles = StyleSheet.create({
  days: {
    gap: spacing.sm,
  },
  lesson: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  time: {
    width: 56,
  },
  divider: {
    width: 2,
    borderRadius: 1,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  tagText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
});
