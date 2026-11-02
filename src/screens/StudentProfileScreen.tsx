import { useState } from 'react';
import { api, errorMessage } from '../api/client';
import type { Student } from '../api/types';
import AuthGate from '../components/AuthGate';
import CallButton from '../components/CallButton';
import Chip from '../components/Chip';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ProfileCard from '../components/ProfileCard';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { formatPhone } from '../utils/format';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme/metrics';

type Kind = 'response' | 'application';

export default function StudentProfileScreen({ navigation, route }: RootStackScreenProps<'StudentProfile'>) {
  const { t } = useI18n();
  return (
    <ScreenScroll title={t('studentProfileTitle')} onBack={navigation.goBack}>
      <AuthGate>
        <StudentDetails studentId={route.params.studentId} onOpenRequests={() => navigation.navigate('Requests')} />
      </AuthGate>
    </ScreenScroll>
  );
}

function StudentDetails({ studentId, onOpenRequests }: { studentId: string; onOpenRequests: () => void }) {
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

  return (
    <StateView loading={loading} error={error} hasData={data !== null} onRetry={() => void reload()}>
      {student ? (
        <View style={styles.content}>
          <ProfileCard
            firstName={student.firstName}
            lastName={student.lastName}
            seed={student.id}
            photo={student.photo}
            badge={student.group}
            rows={[
              { icon: 'school-outline', label: t('university'), value: student.university },
              { icon: 'business-outline', label: t('faculty'), value: student.faculty },
              { icon: 'book-outline', label: t('program'), value: student.program },
              { icon: 'ribbon-outline', label: t('course'), value: String(student.course) },
              { icon: 'call-outline', label: t('phone'), value: student.phone ? formatPhone(student.phone) : t('studentPhoneHidden') },
            ]}
          />
          {student.phone ? <CallButton phone={student.phone} /> : null}
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
            {sendError ? <FormBanner text={sendError} /> : null}
            {sent ? <FormBanner kind="success" text={t('appSentText')} /> : null}
            <PrimaryButton title={t('appSend')} arrow loading={sending} onPress={send} />
            <PrimaryButton title={t('requestsTitle')} variant="glass" compact onPress={onOpenRequests} />
          </GlassCard>
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
