import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { Student } from '../types/Student';
import { getFullName } from '../utils/format';
import Avatar from './Avatar';
import GlassCard from './GlassCard';
import IconButton from './IconButton';
import PrimaryButton from './PrimaryButton';

type Props = {
  student: Student;
  onOpenProfile: (student: Student) => void;
  onDelete: (student: Student) => void;
};

/**
 * Карточка студента (лабораторная работа №2):
 * ФИО, группа, специальность и кнопка «Открыть профиль».
 */
export default function StudentCard({ student, onOpenProfile, onDelete }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const fullName = getFullName(student);

  return (
    <GlassCard>
      <View style={styles.header}>
        <Avatar firstName={student.firstName} lastName={student.lastName} seed={student.id} size={52} />
        <View style={styles.info}>
          <Text style={[type.subheading, { color: colors.text }]} numberOfLines={2}>
            {fullName}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.groupPill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.groupText, { color: colors.primary }]}>{student.group}</Text>
            </View>
            <Text style={[type.caption, styles.program, { color: colors.textSecondary }]} numberOfLines={1}>
              {student.program || t('programNotSet')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title={t('openProfile')} compact arrow onPress={() => onOpenProfile(student)} style={styles.open} />
        <IconButton
          icon="trash-outline"
          variant="danger"
          accessibilityLabel={t('deleteStudentA11y', { name: fullName })}
          onPress={() => onDelete(student)}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  groupText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  program: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  open: {
    flex: 1,
  },
});
