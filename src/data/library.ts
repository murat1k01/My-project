import { LocalizedText, lt } from '../i18n/localized';
import type { IoniconName } from '../types/Service';
import { dayKey, hashString } from '../utils/format';

/**
 * ПРИМЕР данных читального зала: места, этажи и план комнат.
 * Важно заменить реальной планировкой библиотеки университета.
 */

// ---------- Места в читальном зале ----------

/** Читальный зал (2 этаж): 5 рядов по 6 мест. */
export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E'];
export const SEATS_PER_ROW = 6;

/**
 * Реального датчика занятости нет, поэтому занятость — ПРИМЕР: она стабильно
 * вычисляется из номера места, дня и часа (меняется каждый час).
 */
export function isSeatBusy(seatId: string, now: Date): boolean {
  const seed = `${seatId}|${dayKey(now)}|${now.getHours()}`;
  return hashString(seed) % 100 < 45;
}

// ---------- Этажи и комнаты ----------

export type LibraryRoom = {
  id: string;
  floor: number;
  name: LocalizedText;
  description: LocalizedText;
  hours: string;
  icon: IoniconName;
  /** Положение на плане этажа в процентах: x, y — левый верхний угол, w, h — размер */
  x: number;
  y: number;
  w: number;
  h: number;
};

export const LIBRARY_FLOORS = [1, 2, 3];

/** Где находится вход («Вы здесь» на плане первого этажа). */
export const ENTRANCE_ROOM_ID = 'entrance';

export const LIBRARY_ROOMS: LibraryRoom[] = [
  // 1 этаж
  { id: 'stairs1', floor: 1, x: 0, y: 0, w: 20, h: 35, icon: 'swap-vertical-outline', hours: '08:00–22:00', name: lt('Лестница и лифт', 'Баспалдақ пен лифт', 'Stairs & lift'), description: lt('Подъём на 2 и 3 этажи.', '2 және 3 қабатқа көтерілу.', 'Up to floors 2 and 3.') },
  { id: 'lobby', floor: 1, x: 20, y: 0, w: 50, h: 60, icon: 'search-outline', hours: '08:00–22:00', name: lt('Холл и электронный каталог', 'Фойе және электрондық каталог', 'Lobby & e-catalog'), description: lt('Терминалы поиска книг и стойка консультанта.', 'Кітап іздеу терминалдары және кеңесші.', 'Book search terminals and help desk.') },
  { id: 'wc1', floor: 1, x: 70, y: 0, w: 30, h: 30, icon: 'water-outline', hours: '08:00–22:00', name: lt('Туалеты', 'Дәретханалар', 'Restrooms'), description: lt('Туалеты и умывальники.', 'Дәретханалар мен қолжуғыштар.', 'Restrooms and sinks.') },
  { id: 'cafe', floor: 1, x: 70, y: 30, w: 30, h: 30, icon: 'cafe-outline', hours: '09:00–18:00', name: lt('Буфет', 'Буфет', 'Snack bar'), description: lt('Кофе и перекусы. С едой в залы нельзя.', 'Кофе мен тағамдар. Залдарға тамақпен кіруге болмайды.', 'Coffee and snacks. No food in the halls.') },
  { id: ENTRANCE_ROOM_ID, floor: 1, x: 0, y: 60, w: 30, h: 40, icon: 'enter-outline', hours: '08:00–22:00', name: lt('Вход и гардероб', 'Кіреберіс және гардероб', 'Entrance & cloakroom'), description: lt('Оставьте верхнюю одежду и крупные сумки.', 'Сырт киім мен үлкен сөмкелерді қалдырыңыз.', 'Leave coats and large bags here.') },
  { id: 'abonement', floor: 1, x: 30, y: 60, w: 70, h: 40, icon: 'book-outline', hours: '09:00–19:00', name: lt('Абонемент — выдача книг', 'Абонемент — кітап беру', 'Lending desk'), description: lt('Выдача и возврат книг на дом по студенческому билету.', 'Студенттік билет бойынша кітап беру және қабылдау.', 'Borrow and return books with your student ID.') },
  // 2 этаж
  { id: 'reading', floor: 2, x: 0, y: 0, w: 60, h: 65, icon: 'reader-outline', hours: '09:00–22:00', name: lt('Читальный зал', 'Оқу залы', 'Reading hall'), description: lt('30 мест, бронь — во вкладке «Места».', '30 орын, брондау — «Орындар» қойындысында.', '30 seats, book one in the “Seats” tab.') },
  { id: 'periodicals', floor: 2, x: 60, y: 0, w: 40, h: 40, icon: 'newspaper-outline', hours: '09:00–19:00', name: lt('Зал периодики', 'Мерзімді басылымдар залы', 'Periodicals'), description: lt('Журналы и газеты, научные вестники.', 'Журналдар, газеттер, ғылыми хабаршылар.', 'Magazines, newspapers, journals.') },
  { id: 'quiet', floor: 2, x: 60, y: 40, w: 40, h: 25, icon: 'volume-mute-outline', hours: '09:00–22:00', name: lt('Тихие кабинки', 'Тыныш кабиналар', 'Quiet booths'), description: lt('Индивидуальные места для подготовки к экзаменам.', 'Емтиханға дайындалуға арналған жеке орындар.', 'Single desks for exam preparation.') },
  { id: 'stairs2', floor: 2, x: 0, y: 65, w: 20, h: 35, icon: 'swap-vertical-outline', hours: '08:00–22:00', name: lt('Лестница и лифт', 'Баспалдақ пен лифт', 'Stairs & lift'), description: lt('Спуск к выходу на 1 этаж.', '1 қабаттағы шығысқа түсу.', 'Down to the exit on floor 1.') },
  { id: 'shelves', floor: 2, x: 20, y: 65, w: 60, h: 35, icon: 'library-outline', hours: '09:00–19:00', name: lt('Открытый фонд', 'Ашық қор', 'Open stacks'), description: lt('Учебная и художественная литература, полки A–M.', 'Оқу және көркем әдебиет, A–M сөрелері.', 'Textbooks and fiction, shelves A–M.') },
  { id: 'wc2', floor: 2, x: 80, y: 65, w: 20, h: 35, icon: 'water-outline', hours: '08:00–22:00', name: lt('Туалеты', 'Дәретханалар', 'Restrooms'), description: lt('Туалеты и умывальники.', 'Дәретханалар мен қолжуғыштар.', 'Restrooms and sinks.') },
  // 3 этаж
  { id: 'computers', floor: 3, x: 0, y: 0, w: 45, h: 50, icon: 'desktop-outline', hours: '09:00–20:00', name: lt('Компьютерный класс', 'Компьютер сыныбы', 'Computer lab'), description: lt('20 компьютеров, печать и сканирование.', '20 компьютер, басып шығару және сканерлеу.', '20 computers, printing and scanning.') },
  { id: 'coworking', floor: 3, x: 45, y: 0, w: 55, h: 50, icon: 'people-outline', hours: '09:00–22:00', name: lt('Коворкинг', 'Коворкинг', 'Coworking'), description: lt('Групповая работа, можно говорить.', 'Топтық жұмыс, сөйлесуге болады.', 'Group work, talking allowed.') },
  { id: 'stairs3', floor: 3, x: 0, y: 50, w: 20, h: 50, icon: 'swap-vertical-outline', hours: '08:00–22:00', name: lt('Лестница и лифт', 'Баспалдақ пен лифт', 'Stairs & lift'), description: lt('Спуск на 2 и 1 этажи.', '2 және 1 қабатқа түсу.', 'Down to floors 2 and 1.') },
  { id: 'itfund', floor: 3, x: 20, y: 50, w: 30, h: 50, icon: 'code-slash-outline', hours: '09:00–19:00', name: lt('IT-фонд', 'IT қоры', 'IT stacks'), description: lt('Книги по программированию, полки IT.', 'Бағдарламалау кітаптары, IT сөрелері.', 'Programming books, IT shelves.') },
  { id: 'meeting', floor: 3, x: 50, y: 50, w: 30, h: 50, icon: 'chatbubbles-outline', hours: '09:00–20:00', name: lt('Переговорные', 'Келіссөз бөлмелері', 'Meeting rooms'), description: lt('Комнаты на 4–6 человек для проектов.', 'Жобаларға арналған 4–6 адамдық бөлмелер.', 'Rooms for 4–6 people for projects.') },
  { id: 'archive', floor: 3, x: 80, y: 50, w: 20, h: 50, icon: 'archive-outline', hours: '10:00–17:00', name: lt('Архив', 'Мұрағат', 'Archive'), description: lt('Редкие книги — только в читальном зале.', 'Сирек кітаптар — тек оқу залында.', 'Rare books — reading hall only.') },
];

export function getRoom(id: string | null): LibraryRoom | undefined {
  return LIBRARY_ROOMS.find((room) => room.id === id);
}
