import { useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApplicationModal from '../components/ApplicationModal';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import IconButton from '../components/IconButton';
import ScreenContainer from '../components/ScreenContainer';
import StudentCard from '../components/StudentCard';
import StudentForm from '../components/StudentForm';
import TopBar from '../components/TopBar';
import { useAppData } from '../context/AppDataContext';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { SCREEN_PADDING, spacing, TOUCH_SIZE } from '../theme/metrics';
import { type } from '../theme/typography';
import type { Student, StudentDraft } from '../types/Student';
import { formatPhone, matchesStudentQuery, normalizeText } from '../utils/format';

export default function StudentsScreen({ navigation }: MainTabScreenProps<'Students'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { students, addStudent, removeStudent } = useAppData();

  const [query, setQuery] = useState('');
  // Если студентов ещё нет — сразу показываем форму добавления
  const [formOpen, setFormOpen] = useState(students.length === 0);
  // Студент, которому сейчас пишем отклик/заявку (null — окно закрыто)
  const [respondTo, setRespondTo] = useState<Student | null>(null);

  // Порядковый номер записи: первый добавленный студент — №1
  const numberOf = (student: Student) => students.length - students.indexOf(student);

  const filteredStudents = useMemo(
    () => students.filter((student) => matchesStudentQuery(student, query)),
    [students, query],
  );
  const isSearching = normalizeText(query).length > 0;

  const handleAdd = async (draft: StudentDraft) => {
    const saved = await addStudent(draft);
    if (!saved) Alert.alert(t('saveFailedTitle'), t('saveFailedText'));
    setQuery('');
    setFormOpen(false);
    return true;
  };

  const handleDelete = (student: Student) => {
    const name = student.phone ? formatPhone(student.phone) : `№${numberOf(student)}`;
    Alert.alert(t('deleteStudentTitle'), t('deleteStudentText', { name }), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => void removeStudent(student.id) },
    ]);
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <TopBar
        label={t('appName')}
        right={
          <>
            <IconButton icon="document-text-outline" accessibilityLabel={t('requestsTitle')} onPress={() => navigation.navigate('Requests')} />
            <IconButton
              icon={formOpen ? 'close' : 'add'}
              variant={formOpen ? 'glass' : 'primary'}
              accessibilityLabel={formOpen ? t('hideForm') : t('addStudent')}
              onPress={() => setFormOpen((prev) => !prev)}
            />
          </>
        }
      />
      <View style={styles.titleBlock}>
        <Text style={[type.display, { color: colors.text }]} accessibilityRole="header">
          {t('studentsTitle')}
        </Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{t('studentsCount', { count: students.length })}</Text>
      </View>

      {formOpen ? (
        <GlassCard>
          <Text style={[type.heading, { color: colors.text }]}>{t('newStudent')}</Text>
          <StudentForm submitLabel={t('add')} onSubmit={handleAdd} />
        </GlassCard>
      ) : null}

      {students.length > 0 ? (
        <FormField
          placeholder={t('searchPlaceholder')}
          icon="search"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
          rightAccessory={
            query ? (
              <Pressable
                onPress={() => setQuery('')}
                accessibilityRole="button"
                accessibilityLabel={t('clearSearch')}
                hitSlop={8}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            ) : null
          }
        />
      ) : null}

      {isSearching && filteredStudents.length > 0 ? (
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('found', { count: filteredStudents.length })}</Text>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              index={numberOf(item)}
              onOpenInfo={(student) => navigation.navigate('StudentProfile', { studentId: student.id })}
              onRespond={setRespondTo}
              onDelete={handleDelete}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            isSearching ? (
              <EmptyState
                icon="search-outline"
                title={t('noResultsTitle')}
                message={t('noResultsText', { query: normalizeText(query) })}
                actionLabel={t('resetSearch')}
                onAction={() => setQuery('')}
              />
            ) : (
              <EmptyState
                icon="people-outline"
                title={t('emptyStudentsTitle')}
                message={t('emptyStudentsText')}
                actionLabel={formOpen ? undefined : t('addStudent')}
                onAction={formOpen ? undefined : () => setFormOpen(true)}
              />
            )
          }
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </KeyboardAvoidingView>
      <ApplicationModal student={respondTo} onClose={() => setRespondTo(null)} />
    </ScreenContainer>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxl,
  },
  headerBlock: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  clearButton: {
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    marginRight: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: spacing.md,
  },
});
