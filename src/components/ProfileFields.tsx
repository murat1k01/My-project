import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { api } from '../api/client';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { ProfileErrors } from '../utils/validation';
import Chip from './Chip';
import FormField from './FormField';

export type StudyDraft = { firstName: string; lastName: string; university: string; faculty: string; program: string; group: string; course: number };

export const EMPTY_STUDY_DRAFT: StudyDraft = { firstName: '', lastName: '', university: '', faculty: '', program: '', group: '', course: 0 };

type Catalog = { university: string[]; faculty: string[]; program: string[]; group: string[] };

const COURSES = [1, 2, 3, 4, 5, 6];

type Props = {
  draft: StudyDraft;
  errors: ProfileErrors;
  onChange: (patch: Partial<StudyDraft>) => void;
};

/** Поля учебных данных для регистрации и редактирования профиля. Подсказки — из справочника, который ведёт администратор. */
export default function ProfileFields({ draft, errors, onChange }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Без справочника поля всё равно работают: значения вводятся вручную
    api<Catalog>('GET', '/api/catalog')
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const text = (key: keyof Catalog, field: 'university' | 'faculty' | 'program' | 'group', label: string) => (
    <View style={styles.block}>
      <FormField label={label} value={draft[field]} onChangeText={(value) => onChange({ [field]: value })} error={errors[field] ? t(errors[field]!) : undefined} />
      {catalog && catalog[key].length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
          {catalog[key].map((name) => (
            <Chip key={name} label={name} selected={draft[field] === name} onPress={() => onChange({ [field]: name })} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <>
      <FormField label={t('firstName')} value={draft.firstName} autoComplete="given-name" onChangeText={(firstName) => onChange({ firstName })} error={errors.firstName ? t(errors.firstName) : undefined} />
      <FormField label={t('lastName')} value={draft.lastName} autoComplete="family-name" onChangeText={(lastName) => onChange({ lastName })} error={errors.lastName ? t(errors.lastName) : undefined} />
      {text('university', 'university', t('university'))}
      {text('faculty', 'faculty', t('faculty'))}
      {text('program', 'program', t('program'))}
      {text('group', 'group', t('group'))}
      <View style={styles.block}>
        <Text style={[type.label, { color: colors.textSecondary }]}>{t('course')}</Text>
        <View style={styles.courses}>
          {COURSES.map((course) => (
            <Chip key={course} label={String(course)} selected={draft.course === course} onPress={() => onChange({ course })} />
          ))}
        </View>
        {errors.course ? <Text style={[type.caption, { color: colors.danger }]}>{t(errors.course)}</Text> : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.sm,
  },
  chips: {
    gap: spacing.sm,
  },
  courses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
