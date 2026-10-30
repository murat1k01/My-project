import type { ImageSourcePropType } from 'react-native';
import { LocalizedText, lt } from '../i18n/localized';
import type { TranslationKey } from '../i18n/translations';
import type { FoodOrder } from '../types/Campus';
import { images } from './images';

/**
 * ПРИМЕР меню столовой с ценами в тенге. Важно заменить реальным меню и ценами.
 */
export type DishCategory = 'soups' | 'mains' | 'salads' | 'drinks' | 'bakery';

export type Dish = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  amount: number;
  unit: 'g' | 'ml';
  category: DishCategory;
  image: ImageSourcePropType;
};

export const FOOD_CATEGORIES: { id: DishCategory | 'all'; label: TranslationKey }[] = [
  { id: 'all', label: 'catAll' },
  { id: 'soups', label: 'catSoups' },
  { id: 'mains', label: 'catMains' },
  { id: 'salads', label: 'catSalads' },
  { id: 'bakery', label: 'catBakery' },
  { id: 'drinks', label: 'catDrinks' },
];

export const MENU: Dish[] = [
  {
    id: 'plov',
    name: lt('Плов', 'Палау', 'Plov'),
    description: lt('Рис, говядина, морковь, специи', 'Күріш, сиыр еті, сәбіз, дәмдеуіштер', 'Rice, beef, carrots, spices'),
    price: 1600,
    amount: 350,
    unit: 'g',
    category: 'mains',
    image: images.foodPlov,
  },
  {
    id: 'shashlik',
    name: lt('Шашлык ассорти', 'Шашлық ассорти', 'Mixed shashlik'),
    description: lt('Говядина и курица, овощи гриль, лаваш', 'Сиыр және тауық еті, грильдегі көкөністер, лаваш', 'Beef and chicken, grilled vegetables, lavash'),
    price: 2900,
    amount: 350,
    unit: 'g',
    category: 'mains',
    image: images.foodShashlik,
  },
  {
    id: 'dumplings',
    name: lt('Пельмени на пару', 'Буға пісірілген тұшпара', 'Steamed dumplings'),
    description: lt('С говядиной и кунжутом', 'Сиыр еті мен күнжіт қосылған', 'With beef and sesame'),
    price: 1400,
    amount: 250,
    unit: 'g',
    category: 'mains',
    image: images.foodManty,
  },
  {
    id: 'burger',
    name: lt('Бургер', 'Бургер', 'Burger'),
    description: lt('Говяжья котлета, сыр, овощи', 'Сиыр котлеті, ірімшік, көкөністер', 'Beef patty, cheese, vegetables'),
    price: 1800,
    amount: 300,
    unit: 'g',
    category: 'mains',
    image: images.foodBurger,
  },
  {
    id: 'pizza',
    name: lt('Пицца «Маргарита»', '«Маргарита» пиццасы', 'Margherita pizza'),
    description: lt('Томаты, моцарелла, базилик', 'Қызанақ, моцарелла, базилик', 'Tomatoes, mozzarella, basil'),
    price: 2200,
    amount: 450,
    unit: 'g',
    category: 'mains',
    image: images.foodPizza,
  },
  {
    id: 'tomato-soup',
    name: lt('Томатный крем-суп', 'Қызанақ крем-сорпасы', 'Tomato cream soup'),
    description: lt('С семечками тыквы и зеленью', 'Асқабақ дәні мен көк шөп қосылған', 'With pumpkin seeds and herbs'),
    price: 950,
    amount: 300,
    unit: 'g',
    category: 'soups',
    image: images.foodSoup,
  },
  {
    id: 'noodles',
    name: lt('Лапша с креветками', 'Асшаян қосылған кеспе', 'Noodles with shrimp'),
    description: lt('Бульон, яйцо, стручковый горох', 'Сорпа, жұмыртқа, бұршақ', 'Broth, egg, snap peas'),
    price: 1900,
    amount: 400,
    unit: 'g',
    category: 'soups',
    image: images.foodLagman,
  },
  {
    id: 'bowl',
    name: lt('Овощной боул', 'Көкөніс боулы', 'Veggie bowl'),
    description: lt('Нут, авокадо, капуста, морковь', 'Ноқат, авокадо, қырыққабат, сәбіз', 'Chickpeas, avocado, cabbage, carrot'),
    price: 1500,
    amount: 280,
    unit: 'g',
    category: 'salads',
    image: images.foodSalad,
  },
  {
    id: 'pancakes',
    name: lt('Панкейки', 'Панкейктер', 'Pancakes'),
    description: lt('С ягодами и мёдом', 'Жидек пен бал қосылған', 'With berries and honey'),
    price: 1100,
    amount: 200,
    unit: 'g',
    category: 'bakery',
    image: images.foodPancakes,
  },
  {
    id: 'croissant',
    name: lt('Круассан', 'Круассан', 'Croissant'),
    description: lt('Сливочный, свежая выпечка', 'Кілегейлі, жаңа піскен', 'Buttery, freshly baked'),
    price: 650,
    amount: 90,
    unit: 'g',
    category: 'bakery',
    image: images.foodCroissant,
  },
  {
    id: 'cappuccino',
    name: lt('Капучино', 'Капучино', 'Cappuccino'),
    description: lt('Двойной эспрессо и молоко', 'Қос эспрессо және сүт', 'Double espresso and milk'),
    price: 800,
    amount: 300,
    unit: 'ml',
    category: 'drinks',
    image: images.foodCoffee,
  },
  {
    id: 'tea',
    name: lt('Чай с лимоном', 'Лимон қосылған шай', 'Tea with lemon'),
    description: lt('Чёрный чай, лимон, мята', 'Қара шай, лимон, жалбыз', 'Black tea, lemon, mint'),
    price: 350,
    amount: 400,
    unit: 'ml',
    category: 'drinks',
    image: images.foodTea,
  },
];

export const DELIVERY_FEE = 300;

export function getDish(id: string): Dish | undefined {
  return MENU.find((dish) => dish.id === id);
}

/** Сумма корзины в тенге */
export function cartSubtotal(cart: Record<string, number>): number {
  return Object.entries(cart).reduce((sum, [dishId, qty]) => sum + (getDish(dishId)?.price ?? 0) * qty, 0);
}

export function cartCount(cart: Record<string, number>): number {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

/**
 * Статус демо-заказа по прошедшему времени:
 * доставка — принят → готовится → в пути → доставлен; самовывоз — … → готов → выдан.
 */
export function getOrderStatus(order: FoodOrder, now: Date): { label: TranslationKey; step: number; total: number } {
  const minutes = (now.getTime() - new Date(order.createdAt).getTime()) / 60_000;
  if (order.delivery === 'delivery') {
    if (minutes < 5) return { label: 'foodStatusAccepted', step: 1, total: 4 };
    if (minutes < 15) return { label: 'foodStatusCooking', step: 2, total: 4 };
    if (minutes < 30) return { label: 'foodStatusDelivering', step: 3, total: 4 };
    return { label: 'foodStatusDone', step: 4, total: 4 };
  }
  if (minutes < 5) return { label: 'foodStatusAccepted', step: 1, total: 4 };
  if (minutes < 15) return { label: 'foodStatusCooking', step: 2, total: 4 };
  if (minutes < 60) return { label: 'foodStatusReady', step: 3, total: 4 };
  return { label: 'foodStatusPickedUp', step: 4, total: 4 };
}
