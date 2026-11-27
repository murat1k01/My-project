import { useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '../../api/client';
import type { MenuItem, Order, OrderStatus } from '../../api/types';
import { Text } from '../../components/AppText';
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
import { brand } from '../../theme/brand';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import type { IoniconName } from '../../types/Service';
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

/** Иконка категории меню по её названию (на любом из языков). */
function categoryIcon(name: string): IoniconName {
  const n = name.toLowerCase();
  if (/напит|сусын|drink|кофе|чай/.test(n)) return 'cafe-outline';
  if (/салат|salad/.test(n)) return 'leaf-outline';
  if (/десерт|выпеч|dessert|тәтті/.test(n)) return 'ice-cream-outline';
  if (/завтрак|таңғы|breakfast/.test(n)) return 'sunny-outline';
  if (/суп|сорпа|soup/.test(n)) return 'water-outline';
  return 'restaurant-outline';
}

/**
 * «Асхана»: баннер «Бүгінгі мәзір», категории с иконками, блюда строками с фото и золотой кнопкой «+»,
 * тёмно-синяя панель корзины снизу. Меню и цены с сервера, корзина на устройстве, заказ и статус на сервере.
 */
export default function FoodService({ service, onBack }: ServiceScreenProps) {
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
    <ServiceLayout
      service={service}
      onBack={onBack}
      notice="foodExampleNote"
      footer={
        cartCount > 0 && tab !== 'cart' ? (
          <Pressable onPress={() => setTab('cart')} accessibilityRole="button" accessibilityLabel={t('foodCart')} style={({ pressed }) => [styles.cartBar, pressed && styles.pressed]}>
            <Ionicons name="cart-outline" size={24} color={brand.gold} />
            <View style={styles.flex}>
              <Text style={styles.cartBarTitle}>{t('foodCart')}</Text>
              <Text style={styles.cartBarText}>{t('foodCartSummary', { count: cartCount, total: formatMoney(total, t('currency')) })}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={brand.ivory} />
          </Pressable>
        ) : undefined
      }
    >
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
          <ImageBackground source={images.foodPlov} style={styles.todayBanner} imageStyle={styles.todayImage}>
            <LinearGradient colors={['rgba(7, 22, 38, 0.9)', 'rgba(7, 22, 38, 0.35)'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, styles.todayImage]} />
            <Text style={styles.todayTitle}>{t('foodToday')}</Text>
            <Text style={styles.todayText}>{t('foodTodayText')}</Text>
          </ImageBackground>
          <SearchField value={query} onChangeText={setQuery} placeholder={t('foodSearch')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            <Chip label={t('filterAll')} icon="grid-outline" selected={category === null} onPress={() => setCategory(null)} />
            {menu.data?.categories.map((name) => <Chip key={name} label={name} icon={categoryIcon(name)} selected={category === name} onPress={() => setCategory(name)} />)}
          </ScrollView>
          <Text style={[type.heading, { color: colors.text }]}>{t('foodPopular')}</Text>
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
                <PrimaryButton title={t('foodPlaceOrder')} arrow loading={submitting} onPress={placeOrder} />
              </GlassCard>
            </>
          )}
        </>
      ) : null}

      {tab === 'orders' ? (
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
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const image = item.imageKey ? images[item.imageKey as keyof typeof images] : undefined;

  return (
    <View style={[styles.dish, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
          <Text style={[styles.dishName, styles.flex, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Pressable onPress={onToggleFavorite} hitSlop={8} accessibilityRole="button" accessibilityLabel={favorite ? t('removeFavoriteA11y', { name: item.name }) : t('addFavoriteA11y', { name: item.name })}>
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? colors.danger : colors.textMuted} />
          </Pressable>
        </View>
        {item.description ? (
          <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
        {item.allergens ? <Text style={[type.caption, { color: colors.warning }]}>{t('foodAllergens', { list: item.allergens })}</Text> : null}
        <View style={styles.cartRow}>
          <Text style={[styles.price, styles.flex, { color: isDark ? colors.gold : colors.primary }]}>{formatMoney(item.price, t('currency'))}</Text>
          {!item.available ? (
            <Text style={[type.label, { color: colors.textMuted }]}>{t('foodUnavailable')}</Text>
          ) : qty > 0 ? (
            <Stepper qty={qty} name={item.name} onChange={onChangeQty} />
          ) : (
            <Pressable onPress={() => onChangeQty(1)} accessibilityRole="button" accessibilityLabel={`${t('foodAdd')}: ${item.name}`} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
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
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  dishImage: {
    width: 92,
    height: 80,
    borderRadius: radius.sm,
  },
  dishName: {
    fontFamily: fonts.card,
    fontSize: 15,
    lineHeight: 20,
  },
  price: {
    fontFamily: fonts.card,
    fontSize: 16,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.antiqueGold,
  },
  todayBanner: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: 4,
  },
  todayImage: {
    borderRadius: radius.lg,
  },
  todayTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    lineHeight: 34,
    color: brand.ivory,
  },
  todayText: {
    fontFamily: fonts.greeting,
    fontSize: 14,
    color: '#EDE3D2',
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: brand.navy,
    borderWidth: 1,
    borderColor: 'rgba(212, 183, 124, 0.5)',
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  cartBarTitle: {
    fontFamily: fonts.card,
    fontSize: 16,
    color: brand.ivory,
  },
  cartBarText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(248, 243, 232, 0.8)',
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
