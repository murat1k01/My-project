import { Pressable, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Text } from '../components/AppText';
import Avatar from '../components/Avatar';
import GlassCard from '../components/GlassCard';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { formatDateTime } from '../utils/format';

export type ChatSummary = {
  userId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  unread: number;
  last: { text: string; createdAt: string; mine: boolean };
};

/** Список переписок со студентами: последнее сообщение и число непрочитанных. */
export default function MessagesScreen({ navigation }: RootStackScreenProps<'Messages'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const focused = useIsFocused();
  const { data, loading, error, reload } = useApi<{ chats: ChatSummary[] }>(focused ? '/api/messages' : null);
  const chats = data?.chats ?? [];

  return (
    <ScreenScroll title={t('msgTitle')} subtitle={t('msgSubtitle')} onBack={navigation.goBack}>
      <StateView
        loading={loading}
        error={error}
        hasData={data !== null}
        empty={chats.length === 0}
        emptyIcon="chatbubbles-outline"
        emptyTitle={t('msgEmptyTitle')}
        emptyText={t('msgEmptyText')}
        onRetry={() => void reload()}
      >
        {chats.map((chat) => {
          const name = `${chat.firstName} ${chat.lastName}`;
          return (
            <Pressable key={chat.userId} accessibilityRole="button" accessibilityLabel={name} onPress={() => navigation.navigate('Chat', { userId: chat.userId, name })}>
              <GlassCard style={styles.row}>
                <Avatar firstName={chat.firstName} lastName={chat.lastName} seed={chat.userId} photo={chat.photo} size={46} />
                <View style={styles.flex}>
                  <Text style={[type.subheading, { color: colors.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                    {chat.last.mine ? `${t('msgYou')}: ` : ''}
                    {chat.last.text}
                  </Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{formatDateTime(chat.last.createdAt, language)}</Text>
                </View>
                {chat.unread > 0 ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{chat.unread}</Text>
                  </View>
                ) : null}
              </GlassCard>
            </Pressable>
          );
        })}
      </StateView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
