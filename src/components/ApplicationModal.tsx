import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCampus } from '../context/CampusContext';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { ApplicationKind } from '../types/Campus';
import type { Student } from '../types/Student';
import { createId, formatPhone, normalizeText } from '../utils/format';
import FormField from './FormField';
import IconButton from './IconButton';
import PrimaryButton from './PrimaryButton';
import SegmentedTabs from './SegmentedTabs';

type Props = {
  /** Студент, которому отправляется отклик; null — окно закрыто */
  student: Student | null;
  onClose: () => void;
  /** Вызывается после успешной отправки (например, чтобы открыть «Мои заявки») */
  onSent?: () => void;
};

/** Окно отправки отклика или заявки по студенту. Запись сохраняется и видна в «Мои заявки». */
export default function ApplicationModal({ student, onClose, onSent }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { updateCampus } = useCampus();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<ApplicationKind>('response');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();

  const close = () => {
    setText('');
    setError(undefined);
    onClose();
  };

  const send = () => {
    if (!student) return;
    const message = normalizeText(text);
    if (message.length < 5) {
      setError(t('errAppText'));
      return;
    }
    updateCampus((prev) => ({
      ...prev,
      applications: [
        { id: createId(), kind, studentId: student.id, studentPhone: student.phone, text: message, createdAt: new Date().toISOString() },
        ...prev.applications,
      ],
    }));
    close();
    Alert.alert(t('appSentTitle'), t('appSentText'));
    onSent?.();
  };

  return (
    <Modal visible={student !== null} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text style={[type.heading, { color: colors.text }]}>{t('appModalTitle')}</Text>
                {student?.phone ? (
                  <Text style={[type.caption, { color: colors.textMuted }]}>
                    {t('studentLabel')} · {formatPhone(student.phone)}
                  </Text>
                ) : null}
              </View>
              <IconButton icon="close" accessibilityLabel={t('close')} onPress={close} />
            </View>

            <Text style={[type.label, { color: colors.textMuted }]}>{t('appKind').toUpperCase()}</Text>
            <SegmentedTabs<ApplicationKind>
              options={[
                { value: 'response', label: t('reqKindResponse') },
                { value: 'application', label: t('reqKindApplication') },
              ]}
              value={kind}
              onChange={setKind}
            />

            <FormField
              placeholder={t('appTextPlaceholder')}
              icon="chatbubble-ellipses-outline"
              value={text}
              onChangeText={(value) => {
                setText(value);
                if (error) setError(undefined);
              }}
              error={error}
              multiline
            />

            <PrimaryButton title={t('appSend')} arrow onPress={send} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
