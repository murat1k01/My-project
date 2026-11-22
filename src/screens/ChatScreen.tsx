import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { api, errorMessage } from '../api/client';
import { Text } from '../components/AppText';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { formatDateTime } from '../utils/format';

type Message = { id: string; text: string; createdAt: string; mine: boolean; read: boolean };

const MAX_LENGTH = 1000;
/** Как часто проверять новые сообщения, пока переписка открыта */
const REFRESH_MS = 5000;

/** Переписка с одним студентом. */
export default function ChatScreen({ navigation, route }: RootStackScreenProps<'Chat'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { userId, name } = route.params;
  const focused = useIsFocused();
  const path = `/api/messages/${encodeURIComponent(userId)}`;
  const { data, loading, error, reload } = useApi<{ messages: Message[] }>(focused ? path : null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!focused) return;
    const timer = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [focused, reload]);

  const send = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await api('POST', path, { text: value });
      setText('');
      await reload();
    } catch (e) {
      setSendError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const messages = data?.messages ?? [];

  return (
    <ScreenScroll title={name} subtitle={t('msgChatSubtitle')} onBack={navigation.goBack}>
      <StateView loading={loading && !data} error={error} hasData={data !== null} empty={messages.length === 0} emptyIcon="chatbubble-ellipses-outline" emptyTitle={t('msgStartTitle')} emptyText={t('msgStartText')} onRetry={() => void reload()}>
        <View style={styles.thread}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.bubble,
                message.mine ? [styles.mine, { backgroundColor: colors.primary }] : [styles.theirs, { backgroundColor: colors.glass, borderColor: colors.border }],
              ]}
            >
              <Text style={[type.body, { color: message.mine ? colors.onPrimary : colors.text }]}>{message.text}</Text>
              <Text style={[type.caption, { color: message.mine ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                {formatDateTime(message.createdAt, language)}
                {message.mine && message.read ? ` · ${t('msgRead')}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </StateView>
      {sendError ? <FormBanner text={sendError} /> : null}
      <FormField placeholder={t('msgPlaceholder')} value={text} onChangeText={(value) => setText(value.slice(0, MAX_LENGTH))} multiline />
      <PrimaryButton title={t('msgSend')} icon="send" loading={sending} disabled={!text.trim()} onPress={() => void send()} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  thread: {
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: 2,
  },
  mine: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  theirs: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
});
