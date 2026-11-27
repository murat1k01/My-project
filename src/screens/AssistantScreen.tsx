import { useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errorMessage } from '../api/client';
import { answer, AssistantAction, showDate, Todo } from '../assistant/engine';
import { LogoMark } from '../components/AnimatedLogo';
import { Text } from '../components/AppText';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { images } from '../data/images';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { brand } from '../theme/brand';
import { radius, SCREEN_PADDING, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

type Bubble = { id: number; from: 'me' | 'bot'; text: string; actions?: AssistantAction[] };

/**
 * Помощник ALT AI в тёмно-синем стиле: фото университета, приветствие с логотипом, быстрые действия и поле вопроса внизу.
 * Помощник работает по правилам на устройстве (задачи и план недели), а не через нейросеть.
 */
export default function AssistantScreen({ navigation }: RootStackScreenProps<'Assistant'>) {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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

  const suggestions: { icon: IoniconName; text: string }[] = [
    { icon: 'add-circle-outline', text: t('aiSuggestAdd') },
    { icon: 'calendar-outline', text: t('aiSuggestPlan') },
    { icon: 'list-outline', text: t('aiSuggestTasks') },
    { icon: 'checkmark-done-outline', text: t('aiSuggestDone') },
  ];
  const items = todos.data?.items ?? [];

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={navigation.goBack} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('back')} style={styles.barButton}>
            <Ionicons name="chevron-back" size={24} color={brand.ivory} />
          </Pressable>
          <Text style={styles.barTitle} accessibilityRole="header">
            {t('aiTitle')}
          </Text>
          <View style={styles.barButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Кинематографичное фото университета */}
            <ImageBackground source={images.oxfordEvening} style={styles.photo} imageStyle={styles.photoRadius}>
              <LinearGradient colors={['rgba(7, 22, 38, 0.1)', 'rgba(7, 22, 38, 0.95)'] as const} style={[StyleSheet.absoluteFill, styles.photoRadius]} />
            </ImageBackground>

            {/* Приветствие с логотипом как аватаром помощника */}
            <View style={styles.greeting}>
              <LogoMark size={52} />
              <View style={styles.flex}>
                <Text style={styles.greetingTitle}>{t('aiGreeting', { name: user?.firstName ?? '' })}</Text>
                <Text style={styles.greetingText}>{t('aiHowHelp')}</Text>
              </View>
            </View>

            {/* Быстрые действия: то, что помощник действительно умеет */}
            <View style={styles.actions}>
              {suggestions.map((item) => (
                <Pressable key={item.text} onPress={() => void ask(item.text)} accessibilityRole="button" accessibilityLabel={item.text} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                  <Ionicons name={item.icon} size={20} color={brand.gold} />
                  <Text style={styles.actionText}>{item.text}</Text>
                </Pressable>
              ))}
            </View>

            {chat.length > 1 ? (
              <View style={styles.thread}>
                {chat.slice(1).map((bubble) => (
                  <View key={bubble.id} style={[styles.bubble, bubble.from === 'me' ? styles.mine : styles.bot]}>
                    {bubble.from === 'bot' ? (
                      <View style={styles.botHead}>
                        <LogoMark size={20} />
                        <Text style={styles.botName}>ALT AI</Text>
                      </View>
                    ) : null}
                    <Text style={[type.body, { color: bubble.from === 'me' ? brand.navy : brand.ivory }]}>{bubble.text}</Text>
                    {bubble.actions?.map((action) => (
                      <PrimaryButton key={action.label} title={action.label} compact variant="glass" arrow onPress={() => openAction(action)} />
                    ))}
                  </View>
                ))}
                {busy ? <Text style={styles.typing}>{t('aiTyping')}</Text> : null}
              </View>
            ) : null}

            <View style={styles.tasks}>
              <Text style={styles.tasksTitle}>{t('aiTasks')}</Text>
              {items.length === 0 ? <Text style={styles.muted}>{t('aiTasksEmpty')}</Text> : null}
              {items.map((todo) => (
                <View key={todo.id} style={styles.todo}>
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: todo.done }} accessibilityLabel={todo.title} onPress={() => void toggle(todo)} style={styles.check} hitSlop={6}>
                    <Ionicons name={todo.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={todo.done ? '#7DB98B' : brand.gold} />
                  </Pressable>
                  <View style={styles.flex}>
                    <Text style={[type.body, { color: todo.done ? 'rgba(248, 243, 232, 0.5)' : brand.ivory, textDecorationLine: todo.done ? 'line-through' : 'none' }]}>{todo.title}</Text>
                    <Text style={styles.muted}>{todo.dueDate ? showDate(todo.dueDate) : t('aiNoDate')}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={t('delete')} onPress={() => void remove(todo)} hitSlop={6} style={styles.check}>
                    <Ionicons name="trash-outline" size={20} color="rgba(248, 243, 232, 0.55)" />
                  </Pressable>
                </View>
              ))}
            </View>
            <Text style={styles.muted}>{t('aiNote')}</Text>
          </View>
        </ScrollView>

        {/* Поле вопроса внизу */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.inputPill}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => void ask(input)}
              returnKeyType="send"
              placeholder={t('aiPlaceholder')}
              placeholderTextColor="#77746D"
              accessibilityLabel={t('aiPlaceholder')}
              style={styles.input}
            />
            <Pressable onPress={() => void ask(input)} disabled={!input.trim() || busy} accessibilityRole="button" accessibilityLabel={t('aiSend')} style={({ pressed }) => [styles.send, (!input.trim() || busy) && styles.sendDisabled, pressed && styles.pressed]}>
              <Ionicons name="arrow-forward" size={20} color={brand.ivory} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.midnight,
  },
  flex: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING - 4,
    paddingBottom: spacing.sm,
    backgroundColor: brand.navy,
  },
  barButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.card,
    fontSize: 20,
    color: brand.ivory,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.lg,
  },
  photo: {
    width: '100%',
    height: 170,
    marginTop: spacing.md,
  },
  photoRadius: {
    borderRadius: radius.lg,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: -spacing.xl - spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: brand.ivory,
  },
  greetingTitle: {
    fontFamily: fonts.card,
    fontSize: 17,
    color: brand.navy,
  },
  greetingText: {
    fontFamily: fonts.greeting,
    fontSize: 15,
    color: '#17212B',
  },
  actions: {
    gap: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(248, 243, 232, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.25)',
  },
  actionText: {
    flex: 1,
    fontFamily: fonts.card,
    fontSize: 15,
    color: brand.ivory,
  },
  pressed: {
    opacity: 0.75,
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
    backgroundColor: brand.ivory,
  },
  bot: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    backgroundColor: '#12294A',
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.3)',
  },
  botHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botName: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: brand.gold,
  },
  typing: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: brand.gold,
  },
  tasks: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(248, 243, 232, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.2)',
  },
  tasksTitle: {
    fontFamily: fonts.card,
    fontSize: 18,
    color: brand.ivory,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(248, 243, 232, 0.6)',
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
  inputBar: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.sm,
    backgroundColor: brand.midnight,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: 6,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: brand.ivory,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#17212B',
    paddingVertical: spacing.sm,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.navy,
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
