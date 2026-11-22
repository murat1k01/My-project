import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../api/client';
import { answer, AssistantAction, showDate, Todo } from '../assistant/engine';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';

type Bubble = { id: number; from: 'me' | 'bot'; text: string; actions?: AssistantAction[] };

/** Помощник ALT AI: поиск мест в университете и планирование задач. Работает без интернета. */
export default function AssistantScreen({ navigation }: RootStackScreenProps<'Assistant'>) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const todos = useApi<{ items: Todo[] }>('/api/todos');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState<Bubble[]>(() => [{ id: 0, from: 'bot', text: t('aiHello') }]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    const base = Date.now();
    setChat((prev) => [...prev, { id: base, from: 'me', text }]);
    try {
      const reply = await answer(text, language);
      setChat((prev) => [...prev, { id: base + 1, from: 'bot', text: reply.text, actions: reply.actions }]);
      if (reply.changed) await todos.reload();
    } catch (e) {
      setChat((prev) => [...prev, { id: base + 1, from: 'bot', text: errorMessage(e) }]);
    } finally {
      setBusy(false);
    }
  };

  const openAction = (action: AssistantAction) => {
    if (action.screen === 'Schedule') navigation.navigate('ServiceDetails', { serviceId: 'cal' });
    else navigation.navigate(action.screen);
  };

  const toggle = async (todo: Todo) => {
    try {
      await api('PATCH', `/api/todos/${encodeURIComponent(todo.id)}`, { done: !todo.done });
    } finally {
      await todos.reload();
    }
  };

  const remove = async (todo: Todo) => {
    try {
      await api('DELETE', `/api/todos/${encodeURIComponent(todo.id)}`);
    } finally {
      await todos.reload();
    }
  };

  const suggestions = [t('aiSuggestAdd'), t('aiSuggestPlan'), t('aiSuggestTasks'), t('aiSuggestDone')];
  const items = todos.data?.items ?? [];

  return (
    <ScreenScroll title={t('aiTitle')} subtitle={t('aiSubtitle')} onBack={navigation.goBack}>
      <View style={styles.thread}>
        {chat.map((bubble) => (
          <View key={bubble.id} style={[styles.bubble, bubble.from === 'me' ? [styles.mine, { backgroundColor: colors.primary }] : [styles.bot, { backgroundColor: colors.glass, borderColor: colors.border }]]}>
            {bubble.from === 'bot' ? (
              <View style={styles.botHead}>
                <Ionicons name="sparkles" size={14} color={colors.primary} />
                <Text style={[type.label, { color: colors.primary }]}>ALT AI</Text>
              </View>
            ) : null}
            <Text style={[type.body, { color: bubble.from === 'me' ? colors.onPrimary : colors.text }]}>{bubble.text}</Text>
            {bubble.actions?.map((action) => (
              <PrimaryButton key={action.label} title={action.label} compact variant="glass" arrow onPress={() => openAction(action)} />
            ))}
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
        {suggestions.map((item) => (
          <Chip key={item} label={item} onPress={() => void ask(item)} />
        ))}
      </ScrollView>
      <FormField placeholder={t('aiPlaceholder')} value={input} onChangeText={setInput} onSubmitEditing={() => void ask(input)} returnKeyType="send" />
      <PrimaryButton title={t('aiSend')} icon="sparkles" loading={busy} disabled={!input.trim()} onPress={() => void ask(input)} />

      <GlassCard>
        <Text style={[type.heading, { color: colors.text }]}>{t('aiTasks')}</Text>
        {items.length === 0 ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('aiTasksEmpty')}</Text> : null}
        {items.map((todo) => (
          <View key={todo.id} style={styles.todo}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: todo.done }} accessibilityLabel={todo.title} onPress={() => void toggle(todo)} style={styles.check} hitSlop={6}>
              <Ionicons name={todo.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={todo.done ? colors.success : colors.textMuted} />
            </Pressable>
            <View style={styles.flex}>
              <Text style={[type.body, { color: todo.done ? colors.textMuted : colors.text, textDecorationLine: todo.done ? 'line-through' : 'none' }]}>{todo.title}</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>{todo.dueDate ? showDate(todo.dueDate) : t('aiNoDate')}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('delete')} onPress={() => void remove(todo)} hitSlop={6} style={styles.check}>
              <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
      </GlassCard>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('aiNote')}</Text>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  thread: {
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '88%',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  mine: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  bot: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  botHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestions: {
    gap: spacing.sm,
  },
  todo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
