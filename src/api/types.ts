/** Типы данных, которые приходят с сервера. */
export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  university: string;
  faculty: string;
  program: string;
  group: string;
  course: number;
  photo: string | null;
  showInDirectory: boolean;
  showPhone: boolean;
  role: 'student' | 'admin';
  createdAt: string;
};

export type ProfileDraft = Pick<User, 'firstName' | 'lastName' | 'university' | 'faculty' | 'program' | 'group'> & {
  course: number | string;
  photo?: string | null;
  showInDirectory?: boolean;
  showPhone?: boolean;
};

export type PlanId = 'free' | 'premium' | 'plus';

export type SubscriptionInfo = {
  plan: PlanId;
  status: 'none' | 'active' | 'canceled' | 'expired';
  expiresAt: string | null;
  previousPlan: PlanId | null;
};

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  period: string | null;
  features: string[];
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  university: string | null;
  faculty: string | null;
  program: string | null;
  group: string | null;
  course: number | null;
  photo: string | null;
  phone: string | null;
  /** Запись добавил сам пользователь: её видит только он */
  addedByMe?: boolean;
};

export type StudentFilters = {
  faculty: string[];
  program: string[];
  group: string[];
  course: number[];
};

export type Book = {
  id: string;
  isbn: string | null;
  title: string;
  author: string | null;
  year: number | null;
  category: string;
  description: string | null;
  coverUrl: string | null;
  sourceUrl: string | null;
  readUrl: string | null;
  copies: number | null;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  available: boolean;
  allergens: string | null;
  imageKey: string | null;
};

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'delivering' | 'done' | 'canceled';

export type Order = {
  id: string;
  number: number;
  lines: { id: string; name: string; price: number; qty: number }[];
  total: number;
  delivery: 'delivery' | 'pickup';
  address: string | null;
  status: OrderStatus;
  etaAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Dorm = {
  id: string;
  name: string;
  address: string | null;
  contacts: string | null;
  services: string | null;
  rules: string | null;
  hours: string | null;
};

export type Machine = {
  id: string;
  dormId: string;
  floor: number | null;
  name: string;
  status: 'ok' | 'maintenance';
};

export type LaundrySlot = { slot: string; state: 'free' | 'busy' | 'mine' | 'past' };

export type LaundryBooking = { id: string; date: string; slot: string; machine: string; floor: number | null; dorm: string };

export type RequestStatus = 'pending' | 'decision' | 'resolved';

export type CampusRequest = {
  id: string;
  kind: 'repair' | 'response' | 'application';
  category: string | null;
  text: string;
  status: RequestStatus;
  history: { status: RequestStatus; at: string }[];
  createdAt: string;
  fromFirstName?: string;
  fromLastName?: string;
};

export type BusRouteSummary = {
  id: string;
  number: string;
  name: string;
  from: string | null;
  to: string | null;
  operator: string | null;
  interval: string | null;
  hours: string | null;
  lengthKm: number | null;
  stopCount: number;
  hasLine: boolean;
};

export type BusStop = { name: string; lat: number; lon: number };

export type BusRoute = Omit<BusRouteSummary, 'stopCount' | 'hasLine'> & {
  stops: BusStop[];
  /** Линия маршрута: пары [широта, долгота] */
  line: [number, number][];
};

export type FoundStop = BusStop & { routes: { id: string; number: string }[] };

export type Vehicle = { routeNumber: string; lat: number; lon: number; updatedAt?: string };

export type InfoPage = { slug: string; title: string; body: string; sort: number };

export type Membership = { id: string; planId: string; status: 'pending' | 'active' | 'canceled'; expiresAt: string | null; createdAt: string };
