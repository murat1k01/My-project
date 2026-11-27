import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../api/client';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import FormBanner from '../components/FormBanner';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import SegmentedTabs from '../components/SegmentedTabs';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import { formatMoney } from '../utils/format';

export type ListingKind = 'market' | 'lost' | 'found';

export type Listing = {
  id: string;
  kind: ListingKind;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  place: string | null;
  eventDate: string | null;
  photo: string | null;
  status: 'active' | 'closed';
  createdAt: string;
  ownerId: string;
  ownerName: string | null;
  mine: boolean;
};

/** Категории маркетплейса: ключ хранится в базе, подпись переводится */
const MARKET_CATEGORIES: { key: string; label: TranslationKey; icon: IoniconName }[] = [
  { key: 'books', label: 'mpCatBooks', icon: 'book-outline' },
  { key: 'electronics', label: 'mpCatElectronics', icon: 'laptop-outline' },
  { key: 'study', label: 'mpCatStudy', icon: 'pencil-outline' },
  { key: 'other', label: 'mpCatOther', icon: 'grid-outline' },
];

type Props = {
  /** 'market' — маркетплейс; 'lostfound' — бюро находок с вкладками «Потеряно / Найдено» */
  mode: 'market' | 'lostfound';
  onBack: () => void;
  onWrite: (userId: string, name: string) => void;
};

/**
 * Объявления студентов: маркетплейс (учебники, техника, канцелярия) и Lost & Found.
 * Данные — только то, что разместили сами студенты; написать автору можно во встроенном чате.
 */
export default function ListingsView({ mode, onBack, onWrite }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const focused = useIsFocused();
  const [lfKind, setLfKind] = useState<'lost' | 'found'>('lost');
  const kind: ListingKind = mode === 'market' ? 'market' : lfKind;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const q = query.trim();
  const list = useApi<{ listings: Listing[] }>(focused ? `/api/listings?kind=${kind}${q ? `&q=${encodeURIComponent(q)}` : ''}` : null);
  const listings = (list.data?.listings ?? []).filter((l) => !category || l.category === category);
  const heading = isDark ? colors.text : colors.primary;

  const run = async (action: () => Promise<unknown>, done?: string) => {
    setError(null);
    setNotice(null);
    try {
      await action();
      if (done) setNotice(done);
      await list.reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <ScreenScroll title={mode === 'market' ? t('mpTitle') : t('lfTitle')} subtitle={mode === 'market' ? t('mpSubtitle') : t('lfSubtitle')} onBack={onBack}>
      {mode === 'lostfound' ? (
        <SegmentedTabs<'lost' | 'found'>
          options={[
            { value: 'lost', label: t('lfLost') },
            { value: 'found', label: t('lfFound') },
          ]}
          value={lfKind}
          onChange={setLfKind}
        />
      ) : null}

      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={19} color={heading} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t('lsSearch')} placeholderTextColor={colors.textMuted} accessibilityLabel={t('lsSearch')} style={[styles.searchInput, { color: colors.text }]} />
      </View>

      {mode === 'market' ? (
        <View style={styles.categories}>
          {MARKET_CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(active ? null : c.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.category, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }, pressed && styles.pressed]}
              >
                <Ionicons name={c.icon} size={22} color={active ? colors.onPrimary : isDark ? colors.gold : colors.primary} />
                <Text style={[styles.categoryText, { color: active ? colors.onPrimary : colors.text }]} numberOfLines={1}>
                  {t(c.label)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <PrimaryButton title={creating ? t('lsCancelCreate') : mode === 'market' ? t('mpCreate') : t('lfCreate')} icon={creating ? 'close' : 'add-circle-outline'} variant={creating ? 'glass' : undefined} onPress={() => setCreating((v) => !v)} />
      {creating ? (
        <CreateForm
          kind={kind}
          onCreated={() => {
            setCreating(false);
            setNotice(t('lsCreated'));
            void list.reload();
          }}
        />
      ) : null}

      {notice ? <FormBanner kind="success" text={notice} /> : null}
      {error ? <FormBanner text={error} /> : null}

      <StateView
        loading={list.loading}
        error={list.error}
        hasData={list.data !== null}
        empty={listings.length === 0}
        emptyIcon={mode === 'market' ? 'storefront-outline' : 'search-outline'}
        emptyTitle={t('lsEmptyTitle')}
        emptyText={t('lsEmptyText')}
        onRetry={() => void list.reload()}
      >
        {listings.map((item) => (
          <ListingCard
            key={item.id}
            item={item}
            onWrite={() => item.ownerName && onWrite(item.ownerId, item.ownerName)}
            onToggle={() => void run(() => api('PATCH', `/api/listings/${item.id}`, { status: item.status === 'active' ? 'closed' : 'active' }))}
            onDelete={() => void run(() => api('DELETE', `/api/listings/${item.id}`), t('lsDeleted'))}
            onReport={() => void run(() => api('POST', `/api/listings/${item.id}/report`), t('lsReported'))}
          />
        ))}
      </StateView>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('lsSafety')}</Text>
    </ScreenScroll>
  );
}

function ListingCard({ item, onWrite, onToggle, onDelete, onReport }: { item: Listing; onWrite: () => void; onToggle: () => void; onDelete: () => void; onReport: () => void }) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const statusText = item.kind === 'market' ? null : item.kind === 'lost' ? t('lfLostBadge') : t('lfFoundBadge');
  const category = MARKET_CATEGORIES.find((c) => c.key === item.category);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, item.status === 'closed' && styles.closed]}>
      <View style={styles.cardRow}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.photo} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.photo, styles.photoEmpty, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name={category?.icon ?? (item.kind === 'market' ? 'pricetag-outline' : 'help-circle-outline')} size={30} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.flex}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.price !== null ? <Text style={[styles.price, { color: isDark ? colors.gold : colors.primary }]}>{formatMoney(item.price, t('currency'))}</Text> : null}
          {statusText ? (
            <View style={[styles.badge, { backgroundColor: item.kind === 'lost' ? colors.dangerSoft : colors.successSoft }]}>
              <Text style={[styles.badgeText, { color: item.kind === 'lost' ? colors.danger : colors.success }]}>{statusText}</Text>
            </View>
          ) : null}
          <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {[item.eventDate?.split('-').reverse().join('.'), item.place, category ? t(category.label) : item.category].filter(Boolean).join(' · ')}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {item.mine ? t('lsMine') : item.ownerName}
            {item.status === 'closed' ? ` · ${t('lsClosed')}` : ''}
          </Text>
        </View>
      </View>
      {item.description ? <Text style={[type.body, { color: colors.textSecondary }]}>{item.description}</Text> : null}
      <View style={styles.actions}>
        {item.mine ? (
          <>
            <Chip label={item.status === 'active' ? t('lsClose') : t('lsReopen')} icon={item.status === 'active' ? 'checkmark-done-outline' : 'refresh-outline'} onPress={onToggle} />
            <Chip label={t('delete')} icon="trash-outline" onPress={onDelete} />
          </>
        ) : (
          <>
            <Chip label={t('lsWrite')} icon="chatbubble-ellipses-outline" selected onPress={onWrite} />
            <Chip label={t('lsReport')} icon="flag-outline" onPress={onReport} />
          </>
        )}
      </View>
    </View>
  );
}

function CreateForm({ kind, onCreated }: { kind: ListingKind; onCreated: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('other');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.4, base64: true });
      const asset = result.canceled ? null : result.assets[0];
      if (asset?.base64) setPhoto(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    // Дата в форме — ДД.ММ.ГГГГ, на сервер уходит ГГГГ-ММ-ДД
    const m = date.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    const eventDate = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
    try {
      await api('POST', '/api/listings', {
        kind,
        title,
        description,
        category: kind === 'market' ? category : null,
        price: kind === 'market' ? Number(price.replace(/\s/g, '')) : undefined,
        place: kind === 'market' ? undefined : place,
        eventDate: kind === 'market' ? undefined : eventDate,
        photo,
      });
      onCreated();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.gold }]}>
      <FormField label={t('lsTitleLabel')} value={title} onChangeText={setTitle} placeholder={kind === 'market' ? t('mpTitlePlaceholder') : t('lfTitlePlaceholder')} />
      <FormField label={t('lsDescription')} value={description} onChangeText={setDescription} multiline />
      {kind === 'market' ? (
        <>
          <FormField label={t('mpPrice')} value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="5000" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {MARKET_CATEGORIES.map((c) => (
              <Chip key={c.key} label={t(c.label)} icon={c.icon} selected={category === c.key} onPress={() => setCategory(c.key)} />
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <FormField label={t('lfPlace')} value={place} onChangeText={setPlace} placeholder={t('lfPlacePlaceholder')} />
          <FormField label={t('lfDate')} value={date} onChangeText={setDate} placeholder="25.11.2026" keyboardType="numbers-and-punctuation" />
        </>
      )}
      <View style={styles.photoRow}>
        {photo ? <Image source={{ uri: photo }} style={styles.preview} /> : null}
        <PrimaryButton title={photo ? t('lsPhotoChange') : t('lsPhotoAdd')} icon="image-outline" variant="glass" compact onPress={() => void pick()} />
      </View>
      {kind !== 'market' ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('lfPrivacy')}</Text> : null}
      {error ? <FormBanner text={error} /> : null}
      <PrimaryButton title={t('lsPublish')} arrow loading={busy} onPress={() => void submit()} />
    </View>
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
  categories: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  category: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: fonts.card,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.8,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  closed: {
    opacity: 0.6,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photo: {
    width: 92,
    height: 92,
    borderRadius: radius.sm,
  },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.card,
    fontSize: 16,
    lineHeight: 21,
  },
  price: {
    fontFamily: fonts.card,
    fontSize: 16,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginVertical: 3,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chips: {
    gap: spacing.sm,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  preview: {
    width: 64,
    height: 48,
    borderRadius: radius.sm,
  },
});
