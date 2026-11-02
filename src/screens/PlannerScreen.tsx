import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../api/client';
import type { PlannerTask } from '../api/types';
import { Text } from '../components/AppText';
import AuthGate from '../components/AuthGate';
import EmptyState from '../components/EmptyState';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { formatDate } from '../utils/format';

/** Планировщик: доступен по Premium, проекты — по Premium Plus. Настоящая проверка тарифа — на сервере. */
export default function PlannerScreen({ navigation }: RootStackScreenProps<'Planner'>) {
  const { t } = useI18n();
  const { subscription } = useAuth();
  return (
    <ScreenScroll title={t('plannerTitle')} subtitle={t('plannerSubtitle')} onBack={navigation.goBack}>
      <AuthGate>
        {subscription.plan === 'free' ? (
          <EmptyState icon="sparkles-outline" title={t('plannerLockedTitle')} message={t('plannerLockedText')} actionLabel={t('subOpen')} onAction={() => navigation.navigate('Subscription')} />
        ) : (
          <Planner withProjects={subscription.plan === 'plus'} />
        )}
      </AuthGate>
    </ScreenScroll>
  );
}

function Planner({ withProjects }: { withProjects: boolean }) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { data, loading, error, reload } = useApi<{ tasks: PlannerTask[] }>('/api/tasks');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [project, setProject] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setFormError(null);
    try {
      await action();
    } catch (e) {
      setFormError(errorMessage(e));
    }
    await reload();
  };

  const add = async () => {
    if (saving) return;
    setSaving(true);
    await run(async () => {
      await api('POST', '/api/tasks', { title, due: due.trim() || null, project: withProjects ? project : '' });
      setTitle('');
      setDue('');
      setProject('');
    });
    setSaving(false);
  };

  return (
    <View style={styles.content}>
      <GlassCard>
        <FormField label={t('plannerTask')} value={title} onChangeText={setTitle} />
        <FormField label={t('plannerDue')} placeholder={t('plannerDueHint')} value={due} onChangeText={setDue} keyboardType="numbers-and-punctuation" />
        {withProjects ? <FormField label={t('plannerProject')} value={project} onChangeText={setProject} /> : null}
        {formError ? <FormBanner text={formError} /> : null}
        <PrimaryButton title={t('add')} arrow loading={saving} onPress={add} />
      </GlassCard>

      <StateView
        loading={loading}
        error={error}
        hasData={data !== null}
        empty={data?.tasks.length === 0}
        emptyIcon="checkbox-outline"
        emptyTitle={t('plannerEmpty')}
        emptyText={t('plannerEmptyText')}
        onRetry={() => void reload()}
      >
        {data?.tasks.map((task) => (
          <GlassCard key={task.id} style={styles.task}>
            <Pressable
              onPress={() => void run(() => api('PATCH', `/api/tasks/${task.id}`, { done: !task.done }))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: task.done }}
              accessibilityLabel={task.title}
              style={styles.taskMain}
            >
              <Ionicons name={task.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={task.done ? colors.success : colors.textMuted} />
              <View style={styles.flex}>
                <Text style={[type.bodyMedium, { color: task.done ? colors.textMuted : colors.text }]}>{task.title}</Text>
                {task.due || task.project ? (
                  <Text style={[type.caption, { color: colors.textMuted }]}>{[task.project, task.due ? formatDate(`${task.due}T00:00:00`, language) : null].filter(Boolean).join(' · ')}</Text>
                ) : null}
              </View>
            </Pressable>
            <Pressable onPress={() => void run(() => api('DELETE', `/api/tasks/${task.id}`))} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('delete')}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </GlassCard>
        ))}
      </StateView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
