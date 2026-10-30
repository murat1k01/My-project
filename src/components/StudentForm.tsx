import { useRef, useState } from 'react';
import { StyleSheet, TextInputInstance, View } from 'react-native';
import { useI18n } from '../i18n/LanguageContext';
import { spacing } from '../theme/metrics';
import type { StudentDraft } from '../types/Student';
import { cleanStudentDraft, hasErrors, StudentErrors, validateStudent } from '../utils/validation';
import FormField from './FormField';
import PrimaryButton from './PrimaryButton';

type Props = {
  submitLabel: string;
  /** Возвращает true, если данные сохранены (форма тогда очищается) */
  onSubmit: (draft: StudentDraft) => Promise<boolean>;
};

const EMPTY_DRAFT: StudentDraft = { firstName: '', lastName: '', group: '', program: '' };

/** Форма добавления студента с проверкой обязательных полей. */
export default function StudentForm({ submitLabel, onSubmit }: Props) {
  const { t } = useI18n();
  const [values, setValues] = useState<StudentDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<StudentErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const lastNameRef = useRef<TextInputInstance>(null);
  const groupRef = useRef<TextInputInstance>(null);
  const programRef = useRef<TextInputInstance>(null);

  const updateField = (field: keyof StudentDraft, text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    // Ошибку поля убираем, как только пользователь начал её исправлять
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const errorText = (field: keyof StudentDraft) => {
    const key = errors[field];
    return key ? t(key) : undefined;
  };

  const handleSubmit = async () => {
    const nextErrors = validateStudent(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    const saved = await onSubmit(cleanStudentDraft(values));
    setSubmitting(false);
    if (saved) setValues(EMPTY_DRAFT);
  };

  return (
    <View style={styles.form}>
      <FormField
        label={`${t('firstName')} *`}
        placeholder={t('firstNamePlaceholder')}
        icon="person-outline"
        value={values.firstName}
        onChangeText={(text) => updateField('firstName', text)}
        error={errorText('firstName')}
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => lastNameRef.current?.focus()}
      />
      <FormField
        ref={lastNameRef}
        label={`${t('lastName')} *`}
        placeholder={t('lastNamePlaceholder')}
        icon="person-outline"
        value={values.lastName}
        onChangeText={(text) => updateField('lastName', text)}
        error={errorText('lastName')}
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => groupRef.current?.focus()}
      />
      <FormField
        ref={groupRef}
        label={`${t('group')} *`}
        placeholder={t('groupPlaceholder')}
        icon="people-outline"
        value={values.group}
        onChangeText={(text) => updateField('group', text)}
        error={errorText('group')}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => programRef.current?.focus()}
      />
      <FormField
        ref={programRef}
        label={t('program')}
        placeholder={t('programPlaceholder')}
        icon="school-outline"
        value={values.program}
        onChangeText={(text) => updateField('program', text)}
        error={errorText('program')}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
      <PrimaryButton title={submitLabel} arrow onPress={handleSubmit} loading={submitting} style={styles.submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  submit: {
    marginTop: spacing.xs,
  },
});
