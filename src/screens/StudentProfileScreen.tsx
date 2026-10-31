import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import ApplicationModal from '../components/ApplicationModal';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import ProfileCard from '../components/ProfileCard';
import ScreenContainer from '../components/ScreenContainer';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { SCREEN_PADDING, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { Student } from '../types/Student';
import { formatDate, formatPhone, phoneHref } from '../utils/format';
import { openExternal } from '../utils/links';

/**
 * Раздел «Информация о студенте»: здесь (а не на карточке в списке) показаны
 * имя, факультет, специальность, группа и курс. Отсюда же можно позвонить и отправить отклик.
 */
export default function StudentProfileScreen({ navigation, route }: RootStackScreenProps<'StudentProfile'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { getStudent, removeStudent } = useAppData();
  const [respondTo, setRespondTo] = useState<Student | null>(null);
  const student = getStudent(route.params.studentId);

  const title = (
    <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
      {t('studentInfoTitle')}
    </Text>
  );

  if (!student) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.content}>
          <TopBar onBack={navigation.goBack} />
          {title}
          <EmptyState
            icon="person-remove-outline"
            title={t('studentNotFoundTitle')}
            message={t('studentNotFoundText')}
            actionLabel={t('backToList')}
            onAction={navigation.goBack}
          />
        </View>
      </ScreenContainer>
    );
  }

  const value = (text: string) => text || t('notSpecified');
  const phone = student.phone ? formatPhone(student.phone) : '';

  const call = () =>
    void openExternal(phoneHref(student.phone), { title: t('linkErrorTitle'), text: t('linkErrorText', { url: phone }) });

  const handleDelete = () => {
    Alert.alert(t('deleteStudentTitle'), t('deleteStudentText', { name: phone || t('studentLabel') }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
          void removeStudent(student.id);
        },
      },
    ]);
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <TopBar onBack={navigation.goBack} />
          {title}
          <ProfileCard
            firstName={student.firstName || t('studentLabel')}
            lastName={student.lastName}
            seed={student.id}
            badge={value(student.group)}
            rows={[
              { icon: 'call-outline', label: t('phone'), value: phone || t('studentNoPhone') },
              { icon: 'business-outline', label: t('faculty'), value: value(student.faculty) },
              { icon: 'school-outline', label: t('program'), value: value(student.program) },
              { icon: 'people-outline', label: t('group'), value: value(student.group) },
              { icon: 'ribbon-outline', label: t('course'), value: value(student.course) },
              { icon: 'calendar-outline', label: t('addedOn'), value: formatDate(student.createdAt, language) },
            ]}
          />
          {phone ? <PrimaryButton title={`${t('callStudent')} · ${phone}`} icon="call-outline" onPress={call} /> : null}
          <PrimaryButton title={t('studentRespond')} variant="glass" icon="chatbubble-ellipses-outline" onPress={() => setRespondTo(student)} />
          <PrimaryButton title={t('deleteStudent')} variant="danger" icon="trash-outline" onPress={handleDelete} />
        </View>
      </ScrollView>
      <ApplicationModal student={respondTo} onClose={() => setRespondTo(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.lg,
  },
});
