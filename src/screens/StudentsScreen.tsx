import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { api, errorMessage } from '../api/client';
import type { Student } from '../api/types';
import { Text } from '../components/AppText';
import Avatar from '../components/Avatar';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import SearchField from '../components/SearchField';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useDebounced } from '../hooks/useDebounced';
import { useI18n } from '../i18n/LanguageContext';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

export default function StudentsScreen({ navigation }: MainTabScreenProps<'Students'>) {
  const { t } = useI18n();
  return (
    <ScreenScroll title={t('studentsTitle')} subtitle={t('studentsSubtitle')}>
      <StudentsList onOpen={(studentId) => navigation.navigate('StudentProfile', { studentId })} />
    </ScreenScroll>
  );
}

function StudentsList({ onOpen }: { onOpen: (id: string) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const search = useDebounced(query.trim());
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // При возврате на вкладку список обновляется: запись могли удалить на экране профиля
  const focused = useIsFocused();

  const params = new URLSearchParams();
  if (search) params.set('q', search);
  const suffix = params.toString();
  const { data, loading, error, reload } = useApi<{ students: Student[] }>(focused ? `/api/students${suffix ? `?${suffix}` : ''}` : null);

  const hasFilters = search !== '';


  return (
    <View style={styles.content}>
      <PrimaryButton
        title={adding ? t('cancel') : t('addStudent')}
        icon={adding ? undefined : 'person-add-outline'}
        variant={adding ? 'glass' : 'light'}
        onPress={() => {
          setAdding((prev) => !prev);
          setAdded(false);
        }}
      />
      {adding ? (
        <AddStudentForm
          onAdded={() => {
            setAdding(false);
            setAdded(true);
            void reload();
          }}
        />
      ) : null}
      {added ? <FormBanner kind="success" text={t('studentAdded')} /> : null}
      <SearchField value={query} onChangeText={setQuery} placeholder={t('searchPlaceholder')} />

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
              {student.program ? (
                <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {student.program}
                </Text>
              ) : null}
              <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
                {[student.group, student.course ? t('courseN', { n: student.course }) : null, student.addedByMe ? t('studentAddedByMe') : null].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </StateView>
    </View>
  );
}

const EMPTY_FORM = { firstName: '', lastName: '', group: '', program: '', faculty: '', course: '', phone: '' };

/** Запись, которую студент добавляет сам. Её видит только он, проверяет и хранит сервер. */
function AddStudentForm({ onAdded }: { onAdded: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof EMPTY_FORM) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await api('POST', '/api/students', form);
      onAdded();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('addStudentNote')}</Text>
      <FormField label={t('firstName')} value={form.firstName} onChangeText={set('firstName')} />
      <FormField label={t('lastName')} value={form.lastName} onChangeText={set('lastName')} />
      <FormField label={t('group')} value={form.group} onChangeText={set('group')} />
      <FormField label={t('program')} value={form.program} onChangeText={set('program')} />
      <FormField label={t('faculty')} value={form.faculty} onChangeText={set('faculty')} />
      <FormField label={t('course')} value={form.course} onChangeText={set('course')} keyboardType="number-pad" />
      <FormField label={t('phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      {error ? <FormBanner text={error} /> : null}
      <PrimaryButton title={t('add')} arrow loading={saving} onPress={save} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
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
