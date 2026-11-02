import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Student, StudentFilters } from '../api/types';
import { Text } from '../components/AppText';
import AuthGate from '../components/AuthGate';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import ScreenScroll from '../components/ScreenScroll';
import SearchField from '../components/SearchField';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

type FilterKey = 'faculty' | 'program' | 'course' | 'group';
type Selected = Partial<Record<FilterKey, string>>;

export default function StudentsScreen({ navigation }: RootStackScreenProps<'Students'>) {
  const { t } = useI18n();
  return (
    <ScreenScroll title={t('studentsTitle')} subtitle={t('studentsSubtitle')} onBack={navigation.goBack}>
      <AuthGate>
        <StudentsList onOpen={(studentId) => navigation.navigate('StudentProfile', { studentId })} />
      </AuthGate>
    </ScreenScroll>
  );
}

function StudentsList({ onOpen }: { onOpen: (id: string) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Selected>({});
  const search = useDebounced(query.trim());

  const params = new URLSearchParams();
  if (search) params.set('q', search);
  for (const [key, value] of Object.entries(selected)) if (value) params.set(key, value);
  const suffix = params.toString();
  const { data, loading, error, reload } = useApi<{ students: Student[]; filters: StudentFilters }>(`/api/students${suffix ? `?${suffix}` : ''}`);

  const hasFilters = search !== '' || Object.values(selected).some(Boolean);
  const toggle = (key: FilterKey, value: string) => setSelected((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));

  const filterRow = (key: FilterKey, label: string, values: (string | number)[] | undefined) =>
    values && values.length > 0 ? (
      <View style={styles.filter}>
        <Text style={[type.label, { color: colors.textSecondary }]}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {values.map((value) => (
            <Chip key={value} label={String(value)} selected={selected[key] === String(value)} onPress={() => toggle(key, String(value))} />
          ))}
        </ScrollView>
      </View>
    ) : null;

  return (
    <View style={styles.content}>
      <SearchField value={query} onChangeText={setQuery} placeholder={t('searchPlaceholder')} />
      {filterRow('faculty', t('faculty'), data?.filters.faculty)}
      {filterRow('program', t('program'), data?.filters.program)}
      {filterRow('course', t('course'), data?.filters.course)}
      {filterRow('group', t('group'), data?.filters.group)}

      <StateView
        loading={loading}
        error={error}
        hasData={data !== null}
        empty={data?.students.length === 0}
        emptyIcon={hasFilters ? 'search-outline' : 'people-outline'}
        emptyTitle={hasFilters ? t('noResultsTitle') : t('studentsEmpty')}
        emptyText={hasFilters ? t('studentsNoResults') : t('studentsEmptyText')}
        onRetry={() => void reload()}
      >
        {data?.students.map((student) => (
          <Pressable
            key={student.id}
            onPress={() => onOpen(student.id)}
            accessibilityRole="button"
            accessibilityLabel={`${student.firstName} ${student.lastName}`}
            style={({ pressed }) => [styles.card, { backgroundColor: colors.glass, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <Avatar firstName={student.firstName} lastName={student.lastName} seed={student.id} photo={student.photo} />
            <View style={styles.flex}>
              <Text style={[type.subheading, { color: colors.text }]}>
                {student.firstName} {student.lastName}
              </Text>
              <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {student.program}
              </Text>
              <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
                {student.group} · {t('courseN', { n: student.course })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </StateView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
  },
  filter: {
    gap: spacing.xs,
  },
  chips: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
