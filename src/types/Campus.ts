/** Личные отметки, которые хранятся только на устройстве. Всё важное (заказы, брони, заявки) лежит на сервере. */

export type SeatReservation = {
  seatId: string;
  /** День брони в формате YYYY-MM-DD */
  date: string;
};

export type CampusState = {
  seat: SeatReservation | null;
  doneTasks: string[];
  /** Корзина столовой: id блюда → количество */
  cart: Record<string, number>;
  enrolledSections: string[];
};

export const EMPTY_CAMPUS_STATE: CampusState = {
  seat: null,
  doneTasks: [],
  cart: {},
  enrolledSections: [],
};
