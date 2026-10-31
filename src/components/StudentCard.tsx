import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { Student } from '../types/Student';
import { formatPhone, phoneHref } from '../utils/format';
import { openExternal } from '../utils/links';
import GlassCard from './GlassCard';
import IconButton from './IconButton';
import PrimaryButton from './PrimaryButton';

type Props = {
  student: Student;
  /** Номер записи в списке — чтобы карточки отличались без показа личных данных */
  index: number;
  onOpenInfo: (student: Student) => void;
  onRespond: (student: Student) => void;
  onDelete: (student: Student) => void;
};

/**
 * Карточка студента. Имя, факультет, специальность, группа и курс здесь НЕ показываются —
 * они доступны по кнопке «Информация». На карточке: номер телефона (нажимаемая ссылка tel:)
 * и действия: информация, отклик/заявка, звонок, удаление.
 */
export default function StudentCard({ student, index, onOpenInfo, onRespond, onDelete }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const phone = student.phone ? formatPhone(student.phone) : '';

  const call = () => {
    const href = phoneHref(student.phone);
    void openExternal(href, { title: t('linkErrorTitle'), text: t('linkErrorText', { url: phone }) });
  };

  return (
    <GlassCard>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="person-outline" size={22} color={colors.text} />
        </View>
        <View style={styles.info}>
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {t('studentLabel')} · №{index}
          </Text>
          {phone ? (
            <Text
              style={[type.subheading, styles.link, { color: colors.text }]}
              onPress={call}
              accessibilityRole="link"
              accessibilityLabel={t('callA11y', { phone })}
            >
              {phone}
            </Text>
          ) : (
            <Text style={[type.body, { color: colors.textSecondary }]}>{t('studentNoPhone')}</Text>
          )}
        </View>
        {phone ? <IconButton icon="call-outline" variant="primary" accessibilityLabel={t('callA11y', { phone })} onPress={call} /> : null}
      </View>

      <View style={styles.actions}>
        <PrimaryButton title={t('studentInfo')} variant="glass" icon="information-circle-outline" compact onPress={() => onOpenInfo(student)} style={styles.flex} />
        <PrimaryButton title={t('studentRespond')} compact onPress={() => onRespond(student)} style={styles.flex} />
        <IconButton
          icon="trash-outline"
          variant="danger"
          accessibilityLabel={t('deleteStudentA11y', { name: phone || `№${index}` })}
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  link: {
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
