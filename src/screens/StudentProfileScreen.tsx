import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { api, errorMessage } from '../api/client';
import type { Student } from '../api/types';
import CallButton from '../components/CallButton';
import Chip from '../components/Chip';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ProfileCard, { ProfileRow } from '../components/ProfileCard';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { spacing } from '../theme/metrics';
import { confirmAction } from '../utils/dialogs';
import { formatPhone } from '../utils/format';

type Kind = 'response' | 'application';

export default function StudentProfileScreen({ navigation, route }: RootStackScreenProps<'StudentProfile'>) {
  const { t } = useI18n();
  return (
    <ScreenScroll title={t('studentProfileTitle')} onBack={navigation.goBack}>
      <StudentDetails studentId={route.params.studentId} onOpenRequests={() => navigation.navigate('Requests')} onDeleted={navigation.goBack} />
    </ScreenScroll>
  );
}

type DetailsProps = {
  studentId: string;
  onOpenRequests: () => void;
  onDeleted: () => void;
};

function StudentDetails({ studentId, onOpenRequests, onDeleted }: DetailsProps) {
  const { t } = useI18n();
  const { data, loading, error, reload } = useApi<{ student: Student }>(`/api/students/${encodeURIComponent(studentId)}`);
  const student = data?.student;
  const [kind, setKind] = useState<Kind>('response');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (sending) return;
    if (text.trim().length < 5) {
      setSendError(t('errAppText'));
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await api('POST', '/api/requests', { kind, targetUserId: studentId, text });
      setText('');
      setSent(true);
    } catch (e) {
      setSendError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const remove = (name: string) => {
    confirmAction({
      title: t('deleteStudentTitle'),
      text: t('deleteStudentText', { name }),
      confirm: t('delete'),
      cancel: t('cancel'),
      destructive: true,
      onConfirm: () => {
        void api('DELETE', `/api/students/${encodeURIComponent(studentId)}`)
          .then(onDeleted)
          .catch((e) => setSendError(errorMessage(e)));
      },
    });
  };

  // В записи, добавленной вручную, часть полей может быть пустой: такие строки не показываем
  const rows: ProfileRow[] = student
    ? [
        ...(student.university ? [{ icon: 'school-outline' as const, label: t('university'), value: student.university }] : []),
        ...(student.faculty ? [{ icon: 'business-outline' as const, label: t('faculty'), value: student.faculty }] : []),
        ...(student.program ? [{ icon: 'book-outline' as const, label: t('program'), value: student.program }] : []),
        ...(student.course ? [{ icon: 'ribbon-outline' as const, label: t('course'), value: String(student.course) }] : []),
        ...(student.phone || !student.addedByMe ? [{ icon: 'call-outline' as const, label: t('phone'), value: student.phone ? formatPhone(student.phone) : t('studentPhoneHidden') }] : []),
      ]
    : [];

  return (
    <StateView loading={loading} error={error} hasData={data !== null} onRetry={() => void reload()}>
      {student ? (
        <View style={styles.content}>
          <ProfileCard
            firstName={student.firstName}
            lastName={student.lastName}
            seed={student.id}
            photo={student.photo}
            badge={student.addedByMe ? t('studentAddedByMe') : (student.group ?? t('studentProfileTitle'))}
            rows={student.addedByMe && student.group ? [{ icon: 'people-outline', label: t('group'), value: student.group }, ...rows] : rows}
          />
          {student.phone ? <CallButton phone={student.phone} /> : null}
          {sendError ? <FormBanner text={sendError} /> : null}
          {student.addedByMe ? (
            <PrimaryButton title={t('deleteStudent')} variant="danger" icon="trash-outline" onPress={() => remove(`${student.firstName} ${student.lastName}`)} />
          ) : (
            <GlassCard>
              <View style={styles.kinds}>
                <Chip label={t('reqKindResponse')} selected={kind === 'response'} onPress={() => setKind('response')} />
                <Chip label={t('reqKindApplication')} selected={kind === 'application'} onPress={() => setKind('application')} />
              </View>
              <FormField
                placeholder={t('appTextPlaceholder')}
                value={text}
                multiline
                onChangeText={(value) => {
                  setText(value);
                  setSent(false);
                }}
              />
              {sent ? <FormBanner kind="success" text={t('appSentText')} /> : null}
              <PrimaryButton title={t('appSend')} arrow loading={sending} onPress={send} />
              <PrimaryButton title={t('requestsTitle')} variant="glass" compact onPress={onOpenRequests} />
            </GlassCard>
          )}
        </View>
      ) : null}
    </StateView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  kinds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
