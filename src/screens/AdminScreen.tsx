import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { api, errorMessage } from '../api/client';
import type { Order, OrderStatus, RequestStatus } from '../api/types';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useAuth } from '../context/AuthContext';
import { MEMBERSHIP_PLANS } from '../data/sport';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import { confirmAction } from '../utils/dialogs';
import { formatDateTime, formatMoney } from '../utils/format';

type FieldKind = 'text' | 'long' | 'number' | 'bool';
type Field = { key: string; label: TranslationKey; kind?: FieldKind };
type Resource = { id: string; label: TranslationKey; pk: string; titleKey: string; subtitleKey?: string; fields: Field[] };
type Row = Record<string, unknown>;

/** Что можно редактировать: поля совпадают со списком разрешённых полей на сервере (server/api.js). */
const RESOURCES: Resource[] = [
  {
    id: 'books', label: 'adminBooks', pk: 'id', titleKey: 'title', subtitleKey: 'author',
    fields: [
      { key: 'title', label: 'adminFTitle' }, { key: 'author', label: 'bookAuthor' }, { key: 'year', label: 'bookYear', kind: 'number' }, { key: 'category', label: 'bookCategory' },
      { key: 'description', label: 'bookDescription', kind: 'long' }, { key: 'coverUrl', label: 'adminFCover' }, { key: 'readUrl', label: 'adminFReadUrl' }, { key: 'sourceUrl', label: 'adminFSourceUrl' }, { key: 'copies', label: 'adminFCopies', kind: 'number' },
    ],
  },
  {
    id: 'menu', label: 'adminMenu', pk: 'id', titleKey: 'name', subtitleKey: 'category',
    fields: [
      { key: 'name', label: 'adminFName' }, { key: 'category', label: 'bookCategory' }, { key: 'price', label: 'adminFPrice', kind: 'number' }, { key: 'description', label: 'bookDescription', kind: 'long' },
      { key: 'allergens', label: 'adminFAllergens' }, { key: 'imageKey', label: 'adminFImage' }, { key: 'available', label: 'adminFAvailable', kind: 'bool' },
    ],
  },
  {
    id: 'pages', label: 'adminPages', pk: 'slug', titleKey: 'title',
    fields: [{ key: 'slug', label: 'adminFSlug' }, { key: 'title', label: 'adminFTitle' }, { key: 'body', label: 'adminFBody', kind: 'long' }, { key: 'sort', label: 'adminFSort', kind: 'number' }],
  },
  {
    id: 'dorms', label: 'adminDorms', pk: 'id', titleKey: 'name', subtitleKey: 'address',
    fields: [
      { key: 'name', label: 'adminFName' }, { key: 'address', label: 'dormAddress' }, { key: 'contacts', label: 'dormContacts' }, { key: 'services', label: 'dormServices', kind: 'long' },
      { key: 'hours', label: 'dormHours' }, { key: 'rules', label: 'dormRules', kind: 'long' },
    ],
  },
  {
    id: 'machines', label: 'adminMachines', pk: 'id', titleKey: 'name', subtitleKey: 'status',
    fields: [{ key: 'dormId', label: 'adminFDormId' }, { key: 'floor', label: 'laundryFloor', kind: 'number' }, { key: 'name', label: 'adminFName' }, { key: 'status', label: 'adminFMachineStatus' }],
  },
  {
    id: 'catalog', label: 'adminCatalog', pk: 'id', titleKey: 'name', subtitleKey: 'kind',
    fields: [{ key: 'kind', label: 'adminFKind' }, { key: 'name', label: 'adminFName' }],
  },
];

type Section = string;

const ORDER_STATUSES: OrderStatus[] = ['new', 'cooking', 'ready', 'delivering', 'done', 'canceled'];
const ORDER_LABELS: Record<OrderStatus, TranslationKey> = { new: 'orderNew', cooking: 'foodStatusCooking', ready: 'foodStatusReady', delivering: 'foodStatusDelivering', done: 'orderDone', canceled: 'orderCanceled' };
const REQUEST_STATUSES: RequestStatus[] = ['pending', 'decision', 'resolved'];
const REQUEST_LABELS: Record<RequestStatus, TranslationKey> = { pending: 'reqPending', decision: 'reqDecision', resolved: 'reqResolved' };

/**
 * Панель администратора. Скрытая кнопка здесь не является защитой:
 * каждый запрос /api/admin/* проверяет роль на сервере, и обычный пользователь получит ошибку 403.
 */
export default function AdminScreen({ navigation }: RootStackScreenProps<'Admin'>) {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [section, setSection] = useState<Section>('books');
  const resource = RESOURCES.find((item) => item.id === section);

  const sections: { id: Section; label: TranslationKey }[] = [
    ...RESOURCES.map((item) => ({ id: item.id, label: item.label })),
    { id: 'orders', label: 'adminOrders' },
    { id: 'requests', label: 'adminRequests' },
    { id: 'bookings', label: 'adminBookings' },
    { id: 'subscriptions', label: 'adminSubscriptions' },
    { id: 'memberships', label: 'adminMemberships' },
  ];

  return (
    <ScreenScroll title={t('adminTitle')} onBack={navigation.goBack}>
      {!isAdmin ? (
        <EmptyState icon="shield-outline" title={t('adminForbiddenTitle')} message={t('adminForbiddenText')} />
      ) : (
        <View style={styles.content}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {sections.map((item) => (
              <Chip key={item.id} label={t(item.label)} selected={item.id === section} onPress={() => setSection(item.id)} />
            ))}
          </ScrollView>
          {resource ? <ResourceEditor key={resource.id} resource={resource} /> : null}
          {section === 'orders' ? <OrdersAdmin /> : null}
          {section === 'requests' ? <RequestsAdmin /> : null}
          {section === 'bookings' ? <BookingsAdmin /> : null}
          {section === 'subscriptions' ? <SubscriptionsAdmin /> : null}
          {section === 'memberships' ? <MembershipsAdmin /> : null}
        </View>
      )}
    </ScreenScroll>
  );
}

function ResourceEditor({ resource }: { resource: Resource }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data, loading, error, reload } = useApi<{ items: Row[] }>(`/api/admin/${resource.id}`);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const startEdit = (row: Row | null) => {
    setMessage(null);
    setIsNew(row === null);
    setEditing(row ? { ...row } : {});
  };

  const save = async () => {
    if (!editing || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const body = Object.fromEntries(resource.fields.filter((field) => field.key in editing).map((field) => [field.key, editing[field.key]]));
      if (isNew) await api('POST', `/api/admin/${resource.id}`, body);
      else await api('PUT', `/api/admin/${resource.id}/${encodeURIComponent(String(editing[resource.pk]))}`, body);
      setEditing(null);
      setMessage({ kind: 'success', text: t('adminSaved') });
      await reload();
    } catch (e) {
      setMessage({ kind: 'error', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const remove = (row: Row) => {
    confirmAction({
      title: t('adminDeleteTitle'),
      text: String(row[resource.titleKey] ?? ''),
      confirm: t('delete'),
      cancel: t('cancel'),
      destructive: true,
      onConfirm: () => {
        void api('DELETE', `/api/admin/${resource.id}/${encodeURIComponent(String(row[resource.pk]))}`)
          .then(() => reload())
          .catch((e) => setMessage({ kind: 'error', text: errorMessage(e) }));
      },
    });
  };

  return (
    <View style={styles.content}>
      {message ? <FormBanner kind={message.kind} text={message.text} /> : null}
      {editing ? (
        <GlassCard>
          {resource.fields.map((field) =>
            field.kind === 'bool' ? (
              <View key={field.key} style={styles.row}>
                <Text style={[type.body, styles.flex, { color: colors.text }]}>{t(field.label)}</Text>
                <Switch value={!!editing[field.key]} onValueChange={(value) => setEditing((prev) => ({ ...prev, [field.key]: value }))} accessibilityLabel={t(field.label)} />
              </View>
            ) : (
              <FormField
                key={field.key}
                label={t(field.label)}
                value={editing[field.key] === null || editing[field.key] === undefined ? '' : String(editing[field.key])}
                multiline={field.kind === 'long'}
                keyboardType={field.kind === 'number' ? 'number-pad' : 'default'}
                autoCapitalize={field.key.toLowerCase().includes('url') || field.key === 'slug' ? 'none' : 'sentences'}
                // Поле адреса страницы нельзя менять у существующей записи: это её ключ
                editable={!(field.key === resource.pk && !isNew)}
                onChangeText={(value) => setEditing((prev) => ({ ...prev, [field.key]: value }))}
              />
            ),
          )}
          <PrimaryButton title={t('save')} arrow loading={saving} onPress={save} />
          <PrimaryButton title={t('cancel')} variant="glass" compact onPress={() => setEditing(null)} />
        </GlassCard>
      ) : (
        <PrimaryButton title={t('adminAdd')} icon="add" variant="glass" onPress={() => startEdit(null)} />
      )}

      <StateView loading={loading} error={error} hasData={data !== null} empty={data?.items.length === 0} emptyTitle={t('adminEmpty')} onRetry={() => void reload()}>
        {data?.items.map((row) => (
          <GlassCard key={String(row[resource.pk])}>
            <Text style={[type.bodyMedium, { color: colors.text }]}>{String(row[resource.titleKey] ?? '—')}</Text>
            {resource.subtitleKey && row[resource.subtitleKey] ? <Text style={[type.caption, { color: colors.textMuted }]}>{String(row[resource.subtitleKey])}</Text> : null}
            {resource.id === 'machines' || resource.id === 'dorms' ? <Text style={[type.caption, { color: colors.textMuted }]}>id: {String(row[resource.pk])}</Text> : null}
            <View style={styles.actions}>
              <PrimaryButton title={t('adminEdit')} variant="glass" compact icon="create-outline" onPress={() => startEdit(row)} />
              <PrimaryButton title={t('delete')} variant="danger" compact icon="trash-outline" onPress={() => remove(row)} />
            </View>
          </GlassCard>
        ))}
      </StateView>
    </View>
  );
}

function OrdersAdmin() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { data, loading, error, reload } = useApi<{ orders: (Order & { firstName: string; lastName: string })[] }>('/api/admin/orders');
  const [actionError, setActionError] = useState<string | null>(null);

  const setStatus = (id: string, status: OrderStatus) => {
    setActionError(null);
    void api('PATCH', `/api/admin/orders/${id}`, { status })
      .then(() => reload())
      .catch((e) => setActionError(errorMessage(e)));
  };

  return (
    <StateView loading={loading} error={error} hasData={data !== null} empty={data?.orders.length === 0} emptyTitle={t('adminEmpty')} onRetry={() => void reload()}>
      {actionError ? <FormBanner text={actionError} /> : null}
      {data?.orders.map((order) => (
        <GlassCard key={order.id}>
          <Text style={[type.subheading, { color: colors.text }]}>
            {t('foodOrderNo', { no: order.number })} · {formatMoney(order.total, t('currency'))}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {order.firstName} {order.lastName} · {formatDateTime(order.createdAt, language)}
          </Text>
          <Text style={[type.body, { color: colors.textSecondary }]}>{order.lines.map((line) => `${line.name} × ${line.qty}`).join(', ')}</Text>
          {order.address ? <Text style={[type.caption, { color: colors.textMuted }]}>{order.address}</Text> : null}
          <View style={styles.actions}>
            {ORDER_STATUSES.map((status) => (
              <Chip key={status} label={t(ORDER_LABELS[status])} selected={order.status === status} onPress={() => setStatus(order.id, status)} />
            ))}
          </View>
        </GlassCard>
      ))}
    </StateView>
  );
}

function RequestsAdmin() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { data, loading, error, reload } = useApi<{ items: { id: string; kind: string; category: string | null; text: string; status: RequestStatus; createdAt: string; fromFirstName: string; fromLastName: string }[] }>('/api/admin/requests');
  const [actionError, setActionError] = useState<string | null>(null);

  const setStatus = (id: string, status: RequestStatus) => {
    setActionError(null);
    void api('PATCH', `/api/admin/requests/${id}`, { status })
      .then(() => reload())
      .catch((e) => setActionError(errorMessage(e)));
  };

  return (
    <StateView loading={loading} error={error} hasData={data !== null} empty={data?.items.length === 0} emptyTitle={t('adminEmpty')} onRetry={() => void reload()}>
      {actionError ? <FormBanner text={actionError} /> : null}
      {data?.items.map((item) => (
        <GlassCard key={item.id}>
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {item.fromFirstName} {item.fromLastName} · {formatDateTime(item.createdAt, language)}
            {item.category ? ` · ${item.category}` : ''}
          </Text>
          <Text style={[type.body, { color: colors.textSecondary }]}>{item.text}</Text>
          <View style={styles.actions}>
            {REQUEST_STATUSES.map((status) => (
              <Chip key={status} label={t(REQUEST_LABELS[status])} selected={item.status === status} onPress={() => setStatus(item.id, status)} />
            ))}
          </View>
        </GlassCard>
      ))}
    </StateView>
  );
}

function BookingsAdmin() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data, loading, error, reload } = useApi<{ bookings: { id: string; date: string; slot: string; machine: string; dorm: string; firstName: string; lastName: string }[] }>('/api/admin/bookings');

  return (
    <StateView loading={loading} error={error} hasData={data !== null} empty={data?.bookings.length === 0} emptyTitle={t('adminEmpty')} onRetry={() => void reload()}>
      {data?.bookings.map((item) => (
        <GlassCard key={item.id}>
          <Text style={[type.bodyMedium, { color: colors.text }]}>
            {item.date}, {item.slot} · {item.machine}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {item.dorm} · {item.firstName} {item.lastName}
          </Text>
        </GlassCard>
      ))}
    </StateView>
  );
}

function MembershipsAdmin() {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const { data, loading, error, reload } = useApi<{ items: { id: string; planId: string; status: 'pending' | 'active' | 'canceled'; firstName: string; lastName: string; createdAt: string }[] }>('/api/admin/memberships');
  const [actionError, setActionError] = useState<string | null>(null);

  const setStatus = (id: string, status: 'active' | 'canceled') => {
    setActionError(null);
    void api('PATCH', `/api/admin/memberships/${id}`, { status })
      .then(() => reload())
      .catch((e) => setActionError(errorMessage(e)));
  };

  return (
    <StateView loading={loading} error={error} hasData={data !== null} empty={data?.items.length === 0} emptyTitle={t('adminEmpty')} onRetry={() => void reload()}>
      {actionError ? <FormBanner text={actionError} /> : null}
      {data?.items.map((item) => {
        const plan = MEMBERSHIP_PLANS.find((p) => p.id === item.planId);
        return (
          <GlassCard key={item.id}>
            <Text style={[type.bodyMedium, { color: colors.text }]}>{plan ? tr(plan.name) : item.planId}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>
              {item.firstName} {item.lastName} · {formatDateTime(item.createdAt, language)}
            </Text>
            <View style={styles.actions}>
              <Chip label={t('adminMembershipActivate')} selected={item.status === 'active'} onPress={() => setStatus(item.id, 'active')} />
              <Chip label={t('orderCanceled')} selected={item.status === 'canceled'} onPress={() => setStatus(item.id, 'canceled')} />
            </View>
          </GlassCard>
        );
      })}
    </StateView>
  );
}

function SubscriptionsAdmin() {
  const { t } = useI18n();
  const [contact, setContact] = useState('');
  const [plan, setPlan] = useState<'premium' | 'plus'>('premium');
  const [days, setDays] = useState('30');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const grant = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await api('POST', '/api/admin/subscriptions', { contact, plan, days: Number(days) });
      setMessage({ kind: 'success', text: t('adminSaved') });
    } catch (e) {
      setMessage({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard>
      <FormBanner kind="info" text={t('adminGrantNote')} />
      <FormField label={t('contactLabel')} value={contact} onChangeText={setContact} autoCapitalize="none" autoCorrect={false} />
      <View style={styles.actions}>
        <Chip label="Premium" selected={plan === 'premium'} onPress={() => setPlan('premium')} />
        <Chip label="Premium Plus" selected={plan === 'plus'} onPress={() => setPlan('plus')} />
      </View>
      <FormField label={t('adminDays')} value={days} onChangeText={setDays} keyboardType="number-pad" />
      {message ? <FormBanner kind={message.kind} text={message.text} /> : null}
      <PrimaryButton title={t('adminGrant')} arrow loading={busy} onPress={grant} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
  },
  chips: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
