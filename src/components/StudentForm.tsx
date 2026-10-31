import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import type { StudentDraft } from '../types/Student';
import { cleanStudentDraft, hasErrors, StudentErrors, validateStudent } from '../utils/validation';
import FormField from './FormField';
import PrimaryButton from './PrimaryButton';

type Props = {
  submitLabel: string;
  /** Возвращает true, если данные сохранены (форма тогда очищается) */
  onSubmit: (draft: StudentDraft) => Promise<boolean>;
};

const EMPTY_DRAFT: StudentDraft = { firstName: '', lastName: '', group: '', program: '', faculty: '', course: '', phone: '' };

/** Описание полей формы: какой ключ перевода, иконка и тип клавиатуры у каждого. */
const OPTIONAL_FIELDS: { field: keyof StudentDraft; label: TranslationKey; placeholder?: TranslationKey; icon: IoniconName }[] = [
  { field: 'firstName', label: 'firstName', placeholder: 'firstNamePlaceholder', icon: 'person-outline' },
  { field: 'lastName', label: 'lastName', placeholder: 'lastNamePlaceholder', icon: 'person-outline' },
  { field: 'faculty', label: 'faculty', icon: 'business-outline' },
  { field: 'program', label: 'program', placeholder: 'programPlaceholder', icon: 'school-outline' },
  { field: 'group', label: 'group', placeholder: 'groupPlaceholder', icon: 'people-outline' },
  { field: 'course', label: 'course', icon: 'ribbon-outline' },
];

/**
 * Форма добавления студента. Обязателен только телефон —
 * имя, группа, специальность и остальное можно не заполнять.
 */
export default function StudentForm({ submitLabel, onSubmit }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [values, setValues] = useState<StudentDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<StudentErrors>({});
  const [submitting, setSubmitting] = useState(false);

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
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('optionalHint')}</Text>

      <FormField
        label={`${t('phone')} *`}
        placeholder={t('phonePlaceholder')}
        icon="call-outline"
        value={values.phone}
        onChangeText={(text) => updateField('phone', text)}
        error={errorText('phone')}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
      />

      {OPTIONAL_FIELDS.map((item) => (
        <FormField
          key={item.field}
          label={t(item.label)}
          placeholder={item.placeholder ? t(item.placeholder) : undefined}
          icon={item.icon}
          value={values[item.field]}
          onChangeText={(text) => updateField(item.field, text)}
          error={errorText(item.field)}
          autoCapitalize={item.field === 'group' ? 'characters' : 'words'}
          keyboardType={item.field === 'course' ? 'number-pad' : 'default'}
        />
      ))}

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
