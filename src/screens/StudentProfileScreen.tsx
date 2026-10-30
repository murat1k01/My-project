import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { formatDate, getFullName } from '../utils/format';

/** Профиль студента, выбранного в списке. Данные берутся по studentId из общего хранилища. */
export default function StudentProfileScreen({ navigation, route }: RootStackScreenProps<'StudentProfile'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { getStudent, removeStudent } = useAppData();
  const student = getStudent(route.params.studentId);

  const title = (
    <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
      {t('studentProfileTitle')}
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

  const handleDelete = () => {
    Alert.alert(t('deleteStudentTitle'), t('deleteStudentText', { name: getFullName(student) }), [
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
            firstName={student.firstName}
            lastName={student.lastName}
            seed={student.id}
            badge={student.group}
            rows={[
              { icon: 'people-outline', label: t('group'), value: student.group },
              { icon: 'school-outline', label: t('program'), value: student.program || t('programNotSet') },
              { icon: 'calendar-outline', label: t('addedOn'), value: formatDate(student.createdAt, language) },
              { icon: 'server-outline', label: t('dataSource'), value: t('dataSourceLocal') },
            ]}
          />
          <PrimaryButton title={t('backToList')} variant="glass" icon="arrow-back" onPress={navigation.goBack} />
          <PrimaryButton title={t('deleteStudent')} variant="danger" icon="trash-outline" onPress={handleDelete} />
        </View>
      </ScrollView>
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
