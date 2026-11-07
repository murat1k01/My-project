import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/AppText';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { DESCRIPTION_MAX, EVENT_TYPES, EventErrors, EventField, EventForm, EventType, hasEventErrors, validateEventForm } from '../utils/eventValidation';

const TYPE_LABELS: Record<EventType, TranslationKey> = { hackathon: 'evTypeHackathon', seminar: 'evTypeSeminar', masterclass: 'evTypeMasterclass' };

const EMPTY_FORM: EventForm = { fullName: '', group: '', eventType: null, date: '', participants: '', description: '', agreed: false };

/** Лабораторная работа №9: регистрация на мероприятие с проверкой каждого поля. */
export default function EventRegistrationScreen({ navigation }: RootStackScreenProps<'EventRegistration'>) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<EventErrors>({});
  const [done, setDone] = useState(false);

  /** Изменение поля сразу убирает его ошибку и прежнее сообщение об успехе */
  const update = <K extends EventField>(field: K, value: EventForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setDone(false);
  };

  const submit = () => {
    const next = validateEventForm(form);
    setErrors(next);
    if (hasEventErrors(next)) {
      setDone(false);
      return;
    }
    Keyboard.dismiss();
    setDone(true);
    setForm(EMPTY_FORM);
  };

  const error = (field: EventField) => (errors[field] ? t(errors[field]!) : undefined);
  const selected = isDark ? { background: colors.pill, text: colors.onPill } : { background: colors.round, text: colors.onRound };

  return (
    <ScreenScroll title={t('evTitle')} subtitle={t('evSubtitle')} onBack={navigation.goBack}>
      {done ? <FormBanner kind="success" text={t('evSuccess')} /> : null}
      <GlassCard>
        <FormField label={t('evName')} value={form.fullName} onChangeText={(v) => update('fullName', v)} autoComplete="name" error={error('fullName')} />
        <FormField label={t('evGroup')} value={form.group} onChangeText={(v) => update('group', v)} error={error('group')} />

        <View style={styles.block}>
          <Text style={[type.label, { color: colors.textSecondary }]}>{t('evType')}</Text>
          <View style={styles.options} accessibilityRole="radiogroup">
            {EVENT_TYPES.map((value) => {
              const active = form.eventType === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => update('eventType', value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.option,
                    { borderColor: active ? selected.background : colors.border, backgroundColor: active ? selected.background : colors.glass },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.optionText, { color: active ? selected.text : colors.text }]}>{t(TYPE_LABELS[value])}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.eventType ? <ErrorText text={t(errors.eventType)} /> : null}
        </View>

        <FormField label={t('evDate')} placeholder={t('evDateHint')} value={form.date} onChangeText={(v) => update('date', v)} keyboardType="numbers-and-punctuation" maxLength={10} error={error('date')} />
        <FormField label={t('evParticipants')} placeholder="1–5" value={form.participants} onChangeText={(v) => update('participants', v)} keyboardType="number-pad" maxLength={2} error={error('participants')} />

        <View style={styles.block}>
          <FormField
            label={t('evDescription')}
            value={form.description}
            onChangeText={(v) => update('description', v)}
            multiline
            maxLength={DESCRIPTION_MAX}
            error={error('description')}
          />
          <Text style={[type.caption, styles.counter, { color: colors.textMuted }]}>
            {form.description.length}/{DESCRIPTION_MAX}
          </Text>
        </View>

        <View style={styles.block}>
          <Pressable
            onPress={() => update('agreed', !form.agreed)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.agreed }}
            style={({ pressed }) => [styles.agree, pressed && styles.pressed]}
          >
            <Ionicons name={form.agreed ? 'checkbox' : 'square-outline'} size={24} color={form.agreed ? colors.primary : colors.textMuted} />
            <Text style={[type.body, styles.flex, { color: colors.text }]}>{t('evAgree')}</Text>
          </Pressable>
          {errors.agreed ? <ErrorText text={t(errors.agreed)} /> : null}
        </View>

        <PrimaryButton title={t('evSubmit')} arrow onPress={submit} />
      </GlassCard>
    </ScreenScroll>
  );
}

function ErrorText({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.error} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={15} color={colors.danger} />
      <Text style={[type.caption, styles.flex, { color: colors.danger }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  block: {
    gap: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
  },
  counter: {
    alignSelf: 'flex-end',
  },
  agree: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
});
