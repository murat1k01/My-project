/** Данные, которые пользователь создаёт в сервисах кампуса. Всё хранится локально. */

export type SeatReservation = {
  seatId: string;
  /** День брони в формате YYYY-MM-DD */
  date: string;
};

export type DeliveryType = 'delivery' | 'pickup';

export type OrderLine = {
  dishId: string;
  qty: number;
};

export type FoodOrder = {
  id: string;
  number: number;
  createdAt: string;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  delivery: DeliveryType;
  address: string;
};

export type Membership = {
  planId: string;
  startedAt: string;
  endsAt: string;
};

export type LaundryBooking = {
  machine: number;
  time: string;
  date: string;
};

export type RepairCategory = 'plumbing' | 'electric' | 'furniture' | 'internet';

export type RepairRequest = {
  id: string;
  category: RepairCategory;
  text: string;
  createdAt: string;
};

export type GuestPass = {
  id: string;
  guestName: string;
  code: string;
  date: string;
};

export type CampusState = {
  seat: SeatReservation | null;
  myRouteId: string | null;
  doneTasks: string[];
  /** Корзина столовой: id блюда → количество */
  cart: Record<string, number>;
  orders: FoodOrder[];
  membership: Membership | null;
  enrolledSections: string[];
  laundry: LaundryBooking | null;
  repairs: RepairRequest[];
  guestPasses: GuestPass[];
};

export const EMPTY_CAMPUS_STATE: CampusState = {
  seat: null,
  myRouteId: null,
  doneTasks: [],
  cart: {},
  orders: [],
  membership: null,
  enrolledSections: [],
  laundry: null,
  repairs: [],
  guestPasses: [],
};
