import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Chip from '../../components/Chip';
import FormField from '../../components/FormField';
import GlassCard from '../../components/GlassCard';
import IconButton from '../../components/IconButton';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';
import SectionHeader from '../../components/SectionHeader';
import SegmentedTabs from '../../components/SegmentedTabs';
import ServiceLayout from '../../components/ServiceLayout';
import { useCampus } from '../../context/CampusContext';
import { cartCount, cartSubtotal, DELIVERY_FEE, Dish, DishCategory, FOOD_CATEGORIES, getDish, getOrderStatus, MENU } from '../../data/food';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, SCREEN_PADDING, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import type { DeliveryType, FoodOrder } from '../../types/Campus';
import { createId, formatClock, formatTenge, normalizeText } from '../../utils/format';
import type { ServiceScreenProps } from './types';

/** FOOD — меню с фото и ценами в тенге, корзина, доставка или самовывоз, статус заказа. */
export default function FoodService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr } = useI18n();
  const { campus, updateCampus } = useCampus();
  const now = useNow(15_000);
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<DishCategory | 'all'>('all');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryType>('delivery');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState<string | undefined>();

  const dishes = category === 'all' ? MENU : MENU.filter((dish) => dish.category === category);
  const count = cartCount(campus.cart);
  const subtotal = cartSubtotal(campus.cart);
  const deliveryFee = delivery === 'delivery' ? DELIVERY_FEE : 0;

  const changeQty = (dishId: string, delta: number) =>
    updateCampus((prev) => {
      const cart = { ...prev.cart };
      const next = (cart[dishId] ?? 0) + delta;
      if (next <= 0) delete cart[dishId];
      else cart[dishId] = next;
      return { ...prev, cart };
    });

  const placeOrder = () => {
    const cleanAddress = normalizeText(address);
    if (delivery === 'delivery' && cleanAddress.length < 3) {
      setAddressError(t('foodAddressRequired'));
      return;
    }
    const order: FoodOrder = {
      id: createId(),
      number: 101 + campus.orders.length,
      createdAt: new Date().toISOString(),
      lines: Object.entries(campus.cart).map(([dishId, qty]) => ({ dishId, qty })),
      subtotal,
      deliveryFee,
      delivery,
      address: delivery === 'delivery' ? cleanAddress : '',
    };
    updateCampus((prev) => ({ ...prev, cart: {}, orders: [order, ...prev.orders] }));
    setCheckoutOpen(false);
    Alert.alert(t('foodOrderNo', { no: order.number }), t('foodOrderPlaced'));
  };

  const cartBar =
    count > 0 ? (
      <PrimaryButton
        title={`${t('foodCart')} · ${count} · ${formatTenge(subtotal)}`}
        icon="bag-handle-outline"
        arrow
        onPress={() => setCheckoutOpen(true)}
      />
    ) : undefined;

  return (
    <ServiceLayout service={service} onBack={onBack} footer={cartBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FOOD_CATEGORIES.map((item) => (
          <Chip key={item.id} label={t(item.label)} selected={category === item.id} onPress={() => setCategory(item.id)} />
        ))}
      </ScrollView>

      {dishes.map((dish) => (
        <DishRow key={dish.id} dish={dish} qty={campus.cart[dish.id] ?? 0} onChange={(delta) => changeQty(dish.id, delta)} />
      ))}

      {campus.orders.length > 0 ? (
        <>
          <SectionHeader title={t('foodOrders')} />
          {campus.orders.slice(0, 5).map((order) => {
            const status = getOrderStatus(order, now);
            const created = new Date(order.createdAt);
            const etaMinutes = order.delivery === 'delivery' ? 30 : 15;
            return (
              <GlassCard key={order.id}>
                <View style={styles.orderHeader}>
                  <Text style={[type.subheading, { color: colors.text }]}>{t('foodOrderNo', { no: order.number })}</Text>
                  <View style={[styles.status, { backgroundColor: status.step === status.total ? colors.successSoft : colors.primarySoft }]}>
                    <Text style={[styles.statusText, { color: status.step === status.total ? colors.success : colors.primary }]}>{t(status.label)}</Text>
                  </View>
                </View>
                <ProgressBar value={status.step / status.total} color={status.step === status.total ? colors.success : colors.primary} />
                <Text style={[type.caption, { color: colors.textSecondary }]}>
                  {formatClock(created)} · {order.delivery === 'delivery' ? `${t('foodDelivery')}: ${order.address}` : t('foodPickup')}
                </Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  {order.lines.map((line) => `${getDish(line.dishId) ? tr(getDish(line.dishId)!.name) : '?'} × ${line.qty}`).join(', ')}
                </Text>
                <View style={styles.orderFooter}>
                  <Text style={[type.caption, { color: colors.textMuted }]}>
                    {status.step < status.total ? t('foodEta', { min: etaMinutes }) : ''}
                  </Text>
                  <Text style={[type.subheading, { color: colors.text }]}>{formatTenge(order.subtotal + order.deliveryFee)}</Text>
                </View>
              </GlassCard>
            );
          })}
        </>
      ) : null}

      {/* Оформление заказа */}
      <Modal visible={checkoutOpen} animationType="slide" transparent onRequestClose={() => setCheckoutOpen(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + spacing.lg }]}>
              <View style={styles.sheetHeader}>
                <Text style={[type.title, { color: colors.text }]}>{t('foodCart')}</Text>
                <IconButton icon="close" accessibilityLabel={t('close')} onPress={() => setCheckoutOpen(false)} />
              </View>

              <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
                {count === 0 ? (
                  <Text style={[type.body, { color: colors.textSecondary }]}>{t('foodEmptyCart')}</Text>
                ) : (
                  Object.entries(campus.cart).map(([dishId, qty]) => {
                    const dish = getDish(dishId);
                    if (!dish) return null;
                    return (
                      <View key={dishId} style={styles.cartLine}>
                        <Image source={dish.image} style={styles.cartImage} />
                        <View style={styles.flex}>
                          <Text style={[type.bodyMedium, { color: colors.text }]}>{tr(dish.name)}</Text>
                          <Text style={[type.caption, { color: colors.textMuted }]}>{formatTenge(dish.price * qty)}</Text>
                        </View>
                        <Stepper qty={qty} onChange={(delta) => changeQty(dishId, delta)} />
                      </View>
                    );
                  })
                )}

                <SegmentedTabs<DeliveryType>
                  options={[
                    { value: 'delivery', label: t('foodDelivery') },
                    { value: 'pickup', label: t('foodPickup') },
                  ]}
                  value={delivery}
                  onChange={setDelivery}
                />

                {delivery === 'delivery' ? (
                  <>
                    <FormField
                      label={t('foodAddress')}
                      placeholder={t('foodAddressPlaceholder')}
                      icon="location-outline"
                      value={address}
                      onChangeText={(text) => {
                        setAddress(text);
                        if (addressError) setAddressError(undefined);
                      }}
                      error={addressError}
                    />
                    <Text style={[type.caption, { color: colors.textMuted }]}>{t('foodDeliveryFeeNote', { price: formatTenge(DELIVERY_FEE) })}</Text>
                  </>
                ) : null}

                <View style={[styles.totals, { borderColor: colors.border }]}>
                  <TotalRow label={t('foodSubtotal')} value={formatTenge(subtotal)} />
                  {delivery === 'delivery' ? <TotalRow label={t('foodDelivery')} value={formatTenge(deliveryFee)} /> : null}
                  <TotalRow label={t('foodTotal')} value={formatTenge(subtotal + deliveryFee)} bold />
                </View>

                <View style={[styles.payNote, { backgroundColor: colors.warningSoft }]}>
                  <Ionicons name="cash-outline" size={18} color={colors.warning} />
                  <Text style={[type.caption, styles.flex, { color: colors.text }]}>{t('foodPayNote')}</Text>
                </View>

                <PrimaryButton title={t('foodPlaceOrder')} arrow disabled={count === 0} onPress={placeOrder} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ServiceLayout>
  );
}

function DishRow({ dish, qty, onChange }: { dish: Dish; qty: number; onChange: (delta: number) => void }) {
  const { colors } = useTheme();
  const { t, tr } = useI18n();

  return (
    <GlassCard style={styles.dish}>
      <Image source={dish.image} style={styles.dishImage} accessibilityIgnoresInvertColors />
      <View style={styles.flex}>
        <Text style={[type.subheading, { color: colors.text }]}>{tr(dish.name)}</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={2}>
          {tr(dish.description)}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {dish.amount} {dish.unit === 'g' ? t('unitG') : t('unitMl')}
        </Text>
        <View style={styles.dishFooter}>
          <Text style={[type.heading, { color: colors.text }]}>{formatTenge(dish.price)}</Text>
          {qty > 0 ? (
            <Stepper qty={qty} onChange={onChange} />
          ) : (
            <IconButton icon="add" variant="primary" size={38} accessibilityLabel={`${t('foodAdd')}: ${tr(dish.name)}`} onPress={() => onChange(1)} />
          )}
        </View>
      </View>
    </GlassCard>
  );
}

function Stepper({ qty, onChange }: { qty: number; onChange: (delta: number) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={[styles.stepper, { backgroundColor: colors.glass, borderColor: colors.border }]}>
      <Pressable onPress={() => onChange(-1)} accessibilityRole="button" accessibilityLabel={t('foodRemove')} hitSlop={6} style={styles.stepButton}>
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <Text style={[styles.qty, { color: colors.text }]}>{qty}</Text>
      <Pressable onPress={() => onChange(1)} accessibilityRole="button" accessibilityLabel={t('foodAdd')} hitSlop={6} style={styles.stepButton}>
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

function TotalRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.totalRow}>
      <Text style={[bold ? type.subheading : type.body, { color: bold ? colors.text : colors.textSecondary }]}>{label}</Text>
      <Text style={[bold ? type.heading : type.bodyMedium, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 3,
  },
  chips: {
    gap: spacing.sm,
  },
  dish: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  dishImage: {
    width: 104,
    height: 104,
    borderRadius: radius.md,
  },
  dishFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  stepButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    minWidth: 20,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 4, 12, 0.6)',
  },
  modalWrap: {
    maxHeight: '92%',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetContent: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cartImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  totals: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
