import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../api/client';
import { Text } from '../components/AppText';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { formatDateTime } from '../utils/format';

type DocType = 'enrollment' | 'academic' | 'transcript' | 'grant' | 'statement';
type DocRequest = { id: string; docType: DocType; comment: string | null; status: 'pending' | 'ready' | 'rejected'; history: { status: string; at: string }[]; createdAt: string };

const DOCS: { type: DocType; title: TranslationKey; text: TranslationKey }[] = [
  { type: 'enrollment', title: 'docEnrollment', text: 'docEnrollmentText' },
  { type: 'academic', title: 'docAcademic', text: 'docAcademicText' },
  { type: 'grant', title: 'docGrant', text: 'docGrantText' },
  { type: 'transcript', title: 'docTranscript', text: 'docTranscriptText' },
  { type: 'statement', title: 'docStatement', text: 'docStatementText' },
];
const STATUS: Record<DocRequest['status'], TranslationKey> = { pending: 'docPending', ready: 'docReady', rejected: 'docRejected' };

/**
 * ALT Documents: запрос справок и заявлений. Документ готовит университет (администратор приложения меняет статус),
 * приложение не создаёт и не подделывает официальные документы.
 */
export default function DocumentsScreen({ navigation }: RootStackScreenProps<'Documents'>) {
  const { colors, isDark } = useTheme();
  const { t, language } = useI18n();
  const focused = useIsFocused();
  const requests = useApi<{ requests: DocRequest[] }>(focused ? '/api/documents' : null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<DocType | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const heading = isDark ? colors.text : colors.primary;
  const q = query.trim().toLowerCase();
  const docs = DOCS.filter((d) => !q || `${t(d.title)} ${t(d.text)}`.toLowerCase().includes(q));

  const submit = async (docType: DocType) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api('POST', '/api/documents', { docType, comment });
      setSuccess(t('docSent'));
      setOpen(null);
      setComment('');
      await requests.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScroll title={t('docTitle')} subtitle={t('docSubtitle')} onBack={navigation.goBack}>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={19} color={heading} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t('docSearch')} placeholderTextColor={colors.textMuted} accessibilityLabel={t('docSearch')} style={[styles.searchInput, { color: colors.text }]} />
      </View>

      <View style={styles.list}>
        {docs.map((d) => {
          const active = open === d.type;
          return (
            <View key={d.type} style={[styles.doc, { backgroundColor: colors.surface, borderColor: active ? colors.gold : colors.border }]}>
              <Pressable onPress={() => setOpen(active ? null : d.type)} accessibilityRole="button" accessibilityState={{ expanded: active }} style={({ pressed }) => [styles.docRow, pressed && styles.pressed]}>
                <View style={[styles.icon, { backgroundColor: colors.primarySoft, borderColor: colors.gold }]}>
                  <Ionicons name={d.type === 'statement' ? 'create-outline' : 'document-text-outline'} size={20} color={isDark ? colors.gold : colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.docTitle, { color: colors.text }]}>{t(d.title)}</Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{t(d.text)}</Text>
                </View>
                <Ionicons name={active ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.gold} />
              </Pressable>
              {active ? (
                <View style={styles.form}>
                  <FormField label={d.type === 'statement' ? t('docStatementLabel') : t('docCommentLabel')} value={comment} onChangeText={setComment} multiline placeholder={d.type === 'statement' ? t('docStatementPlaceholder') : t('docCommentPlaceholder')} />
                  <PrimaryButton title={t('docRequest')} arrow loading={busy} onPress={() => void submit(d.type)} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {error ? <FormBanner text={error} /> : null}
      {success ? <FormBanner kind="success" text={success} /> : null}

      <Text style={[type.heading, { color: heading }]}>{t('docHistory')}</Text>
      <StateView
        loading={requests.loading}
        error={requests.error}
        hasData={requests.data !== null}
        empty={requests.data?.requests.length === 0}
        emptyIcon="folder-open-outline"
        emptyTitle={t('docEmpty')}
        emptyText={t('docEmptyText')}
        onRetry={() => void requests.reload()}
      >
        {requests.data?.requests.map((r) => {
          const doc = DOCS.find((d) => d.type === r.docType);
          const color = r.status === 'ready' ? colors.success : r.status === 'rejected' ? colors.danger : colors.warning;
          const soft = r.status === 'ready' ? colors.successSoft : r.status === 'rejected' ? colors.dangerSoft : colors.warningSoft;
          return (
            <View key={r.id} style={[styles.docRow, styles.history, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.flex}>
                <Text style={[styles.docTitle, { color: colors.text }]}>{doc ? t(doc.title) : r.docType}</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>{formatDateTime(r.createdAt, language)}</Text>
                {r.comment ? <Text style={[type.caption, { color: colors.textSecondary }]}>{r.comment}</Text> : null}
              </View>
              <View style={[styles.status, { backgroundColor: soft }]}>
                <Text style={[styles.statusText, { color }]}>{t(STATUS[r.status])}</Text>
              </View>
            </View>
          );
        })}
      </StateView>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('docNote')}</Text>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  doc: {
    borderRadius: radius.md,
    borderWidth: 1,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  history: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontFamily: fonts.card,
    fontSize: 15,
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
