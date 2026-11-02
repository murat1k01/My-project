import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../../api/client';
import type { MenuItem, Order, OrderStatus } from '../../api/types';
import { Text } from '../../components/AppText';
import AuthGate from '../../components/AuthGate';
import Chip from '../../components/Chip';
import EmptyState from '../../components/EmptyState';
import FormBanner from '../../components/FormBanner';
import FormField from '../../components/FormField';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import SearchField from '../../components/SearchField';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import StateView from '../../components/StateView';
import { useAuth } from '../../context/AuthContext';
import { useCampus } from '../../context/CampusContext';
import { images } from '../../data/images';
import { useApi } from '../../hooks/useApi';
import { useFavorites } from '../../hooks/useFavorites';
import { useI18n } from '../../i18n/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { type } from '../../theme/typography';
import { formatClock, formatDateTime, formatMoney } from '../../utils/format';
import type { ServiceScreenProps } from './types';

type Tab = 'menu' | 'cart' | 'orders';
type Sort = 'name' | 'priceAsc' | 'priceDesc';

const STATUS_LABELS: Record<OrderStatus, TranslationKey> = {
  new: 'orderNew',
  cooking: 'foodStatusCooking',
  ready: 'foodStatusReady',
  delivering: 'foodStatusDelivering',
  done: 'orderDone',
  canceled: 'orderCanceled',
};

/** Столовая: меню и цены с сервера, корзина на устройстве, заказ и его статус на сервере. */
export default function FoodService({ service, onBack, openScreen }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const { campus, updateCampus } = useCampus();
  const [tab, setTab] = useState<Tab>('menu');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('name');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [delivery, setDelivery] = useState<'delivery' | 'pickup'>('pickup');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<number | null>(null);

  const menu = useApi<{ items: MenuItem[]; categories: string[] }>('/api/menu');
  const orders = useApi<{ orders: Order[] }>(user && tab === 'orders' ? '/api/orders' : null);
  const favorites = useFavorites('dish');
  const items = menu.data?.items ?? [];

  const search = query.trim().toLowerCase();
  const visible = items
    .filter((item) => (!category || item.category === category) && (!search || item.name.toLowerCase().includes(search)) && (!onlyFavorites || favorites.isFavorite(item.id)))
    .sort((a, b) => (sort === 'priceAsc' ? a.price - b.price : sort === 'priceDesc' ? b.price - a.price : a.name.localeCompare(b.name)));

  // Блюдо могли убрать из меню, пока оно лежало в корзине: такие строки не показываем и не отправляем
  const cartLines = items.filter((item) => campus.cart[item.id]).map((item) => ({ item, qty: campus.cart[item.id] }));
  const cartCount = cartLines.reduce((sum, line) => sum + line.qty, 0);
  const total = cartLines.reduce((sum, line) => sum + line.item.price * line.qty, 0);

  const changeQty = (id: string, delta: number) => {
    setPlaced(null);
    updateCampus((prev) => {
      const qty = Math.min(50, (prev.cart[id] ?? 0) + delta);
      const cart = { ...prev.cart };
      if (qty > 0) cart[id] = qty;
      else delete cart[id];
      return { ...prev, cart };
    });
  };

  const placeOrder = async () => {
    if (submitting) return;
    if (!user) {
      openScreen('Login');
      return;
    }
    setSubmitting(true);
    setOrderError(null);
    try {
      const response = await api<{ order: Order }>('POST', '/api/orders', { delivery, address, lines: cartLines.map((line) => ({ id: line.item.id, qty: line.qty })) });
      updateCampus((prev) => ({ ...prev, cart: {} }));
      setPlaced(response.order.number);
      setAddress('');
    } catch (e) {
      setOrderError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ServiceLayout service={service} onBack={onBack} notice="foodExampleNote">
      <SegmentedTabs<Tab>
        options={[
          { value: 'menu', label: t('foodMenu') },
          { value: 'cart', label: cartCount > 0 ? `${t('foodCart')} · ${cartCount}` : t('foodCart') },
          { value: 'orders', label: t('foodOrders') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'menu' ? (
        <>
          <SearchField value={query} onChangeText={setQuery} placeholder={t('foodSearch')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            <Chip label={t('filterAll')} selected={category === null} onPress={() => setCategory(null)} />
            {menu.data?.categories.map((name) => <Chip key={name} label={name} selected={category === name} onPress={() => setCategory(name)} />)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label={t('sortTitle')} selected={sort === 'name'} onPress={() => setSort('name')} />
            <Chip label={t('sortPriceAsc')} selected={sort === 'priceAsc'} onPress={() => setSort('priceAsc')} />
            <Chip label={t('sortPriceDesc')} selected={sort === 'priceDesc'} onPress={() => setSort('priceDesc')} />
            <Chip label={t('filterFavorites')} icon="heart" selected={onlyFavorites} onPress={() => setOnlyFavorites((prev) => !prev)} />
          </ScrollView>

          <StateView
            loading={menu.loading}
            error={menu.error}
            hasData={menu.data !== null}
            empty={visible.length === 0}
            emptyIcon="restaurant-outline"
            emptyTitle={t('noResultsTitle')}
            emptyText={t('foodNoResults')}
            onRetry={() => void menu.reload()}
          >
            {visible.map((item) => (
              <DishCard key={item.id} item={item} qty={campus.cart[item.id] ?? 0} favorite={favorites.isFavorite(item.id)} onToggleFavorite={() => void favorites.toggle(item.id)} onChangeQty={(delta) => changeQty(item.id, delta)} />
            ))}
          </StateView>
        </>
      ) : null}

      {tab === 'cart' ? (
        <>
          {placed !== null ? <FormBanner kind="success" text={t('foodOrderPlaced', { no: placed })} /> : null}
          {cartLines.length === 0 ? (
            <EmptyState icon="cart-outline" title={t('foodEmptyCart')} message={t('foodEmptyCartText')} actionLabel={t('foodMenu')} onAction={() => setTab('menu')} />
          ) : (
            <>
              <GlassCard>
                {cartLines.map(({ item, qty }) => (
                  <View key={item.id} style={styles.cartRow}>
                    <View style={styles.flex}>
                      <Text style={[type.bodyMedium, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[type.caption, { color: colors.textMuted }]}>{formatMoney(item.price, t('currency'))}</Text>
                    </View>
                    <Stepper qty={qty} name={item.name} onChange={(delta) => changeQty(item.id, delta)} />
                  </View>
                ))}
                <View style={styles.cartRow}>
                  <Text style={[type.subheading, styles.flex, { color: colors.text }]}>{t('foodTotal')}</Text>
                  <Text style={[type.heading, { color: colors.text }]}>{formatMoney(total, t('currency'))}</Text>
                </View>
              </GlassCard>
              <GlassCard>
                <SegmentedTabs<'delivery' | 'pickup'>
                  options={[
                    { value: 'pickup', label: t('foodPickup') },
                    { value: 'delivery', label: t('foodDelivery') },
                  ]}
                  value={delivery}
                  onChange={setDelivery}
                />
                {delivery === 'delivery' ? <FormField label={t('foodAddress')} placeholder={t('foodAddressPlaceholder')} value={address} onChangeText={setAddress} /> : null}
                <Text style={[type.caption, { color: colors.textMuted }]}>{t('foodPayNote')}</Text>
                {orderError ? <FormBanner text={orderError} /> : null}
                <PrimaryButton title={user ? t('foodPlaceOrder') : t('foodSignInToOrder')} arrow loading={submitting} onPress={placeOrder} />
              </GlassCard>
            </>
          )}
        </>
      ) : null}

      {tab === 'orders' ? (
        <AuthGate>
          <StateView
            loading={orders.loading}
            error={orders.error}
            hasData={orders.data !== null}
            empty={orders.data?.orders.length === 0}
            emptyIcon="receipt-outline"
            emptyTitle={t('foodNoOrders')}
            emptyText={t('foodNoOrdersText')}
            onRetry={() => void orders.reload()}
          >
            {orders.data?.orders.map((order) => <OrderCard key={order.id} order={order} />)}
          </StateView>
        </AuthGate>
      ) : null}
    </ServiceLayout>
  );
}

function OrderCard({ order }: { order: Order }) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const active = order.status !== 'done' && order.status !== 'canceled';
  return (
    <GlassCard>
      <View style={styles.cartRow}>
        <Text style={[type.subheading, styles.flex, { color: colors.text }]}>{t('foodOrderNo', { no: order.number })}</Text>
        <Text style={[type.label, { color: active ? colors.primary : colors.textMuted }]}>{t(STATUS_LABELS[order.status])}</Text>
      </View>
      <Text style={[type.caption, { color: colors.textMuted }]}>{formatDateTime(order.createdAt, language)}</Text>
      {order.lines.map((line) => (
        <Text key={line.id} style={[type.body, { color: colors.textSecondary }]}>
          {line.name} × {line.qty}
        </Text>
      ))}
      <Text style={[type.bodyMedium, { color: colors.text }]}>{formatMoney(order.total, t('currency'))}</Text>
      {active && order.etaAt ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('foodEtaAt', { time: formatClock(new Date(order.etaAt)) })}</Text> : null}
    </GlassCard>
  );
}

type DishProps = {
  item: MenuItem;
  qty: number;
  favorite: boolean;
  onToggleFavorite: () => void;
  onChangeQty: (delta: number) => void;
};

function DishCard({ item, qty, favorite, onToggleFavorite, onChangeQty }: DishProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const image = item.imageKey ? images[item.imageKey as keyof typeof images] : undefined;

  return (
    <GlassCard style={styles.dish}>
      {image ? (
        <Image source={image} style={styles.dishImage} accessibilityIgnoresInvertColors />
      ) : (
        // Для блюда без своего фото не подставляем чужое
        <View style={[styles.dishImage, styles.dishPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="restaurant-outline" size={26} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.dishInfo}>
        <View style={styles.cartRow}>
          <Text style={[type.subheading, styles.flex, { color: colors.text }]}>{item.name}</Text>
          <Pressable onPress={onToggleFavorite} hitSlop={8} accessibilityRole="button" accessibilityLabel={favorite ? t('removeFavoriteA11y', { name: item.name }) : t('addFavoriteA11y', { name: item.name })}>
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? colors.danger : colors.textMuted} />
          </Pressable>
        </View>
        {item.description ? <Text style={[type.caption, { color: colors.textSecondary }]}>{item.description}</Text> : null}
        {item.allergens ? <Text style={[type.caption, { color: colors.warning }]}>{t('foodAllergens', { list: item.allergens })}</Text> : null}
        <View style={styles.cartRow}>
          <Text style={[type.bodyMedium, styles.flex, { color: colors.text }]}>{formatMoney(item.price, t('currency'))}</Text>
          {!item.available ? (
            <Text style={[type.label, { color: colors.textMuted }]}>{t('foodUnavailable')}</Text>
          ) : qty > 0 ? (
            <Stepper qty={qty} name={item.name} onChange={onChangeQty} />
          ) : (
            <PrimaryButton title={t('foodAdd')} compact onPress={() => onChangeQty(1)} />
          )}
        </View>
      </View>
    </GlassCard>
  );
}

function Stepper({ qty, name, onChange }: { qty: number; name: string; onChange: (delta: number) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const button = (icon: 'remove' | 'add', delta: number, label: string) => (
    <Pressable onPress={() => onChange(delta)} accessibilityRole="button" accessibilityLabel={`${label}: ${name}`} style={({ pressed }) => [styles.stepButton, { backgroundColor: colors.primarySoft }, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      {button('remove', -1, t('foodRemove'))}
      <Text style={[type.bodyMedium, { color: colors.text }]}>{qty}</Text>
      {button('add', 1, t('foodAdd'))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chips: {
    gap: spacing.sm,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dish: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dishImage: {
    width: 84,
    height: 84,
    borderRadius: radius.sm,
  },
  dishPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
