import { LocalizedText, lt } from '../i18n/localized';
import type { TranslationKey } from '../i18n/translations';
import type { RepairCategory } from '../types/Campus';
import type { IoniconName } from '../types/Service';
import { hashString } from '../utils/format';

/**
 * ПРИМЕР данных общежития. Важно заменить реальными сведениями (номер общежития, комната, правила).
 */
export const MY_ROOM = { building: 2, room: '314', floor: 3, neighbors: 2 };

export const LAUNDRY_MACHINES = [1, 2, 3];
export const LAUNDRY_TIMES = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00'];

/** Занятость прачечной — пример: стабильно вычисляется из машины, времени и даты. */
export function isLaundryBusy(machine: number, time: string, date: string): boolean {
  return hashString(`${machine}|${time}|${date}`) % 100 < 40;
}

export const REPAIR_CATEGORIES: { id: RepairCategory; label: TranslationKey; icon: IoniconName }[] = [
  { id: 'plumbing', label: 'dormCatPlumbing', icon: 'water-outline' },
  { id: 'electric', label: 'dormCatElectric', icon: 'flash-outline' },
  { id: 'furniture', label: 'dormCatFurniture', icon: 'cube-outline' },
  { id: 'internet', label: 'dormCatInternet', icon: 'wifi-outline' },
];

export const DORM_RULES: LocalizedText[] = [
  lt('Тишина с 23:00 до 07:00', 'Тыныштық 23:00-ден 07:00-ге дейін', 'Quiet hours from 23:00 to 07:00'),
  lt('Гости — до 22:00 по гостевому пропуску', 'Қонақтар — 22:00-ге дейін қонақ рұқсатнамасымен', 'Guests until 22:00 with a guest pass'),
  lt('Курение и алкоголь запрещены', 'Темекі шегуге және алкогольге тыйым салынады', 'Smoking and alcohol are prohibited'),
  lt('Генеральная уборка комнаты — по субботам', 'Бөлмені жалпы тазалау — сенбі күндері', 'Room deep cleaning on Saturdays'),
  lt('Обогреватели и плитки в комнатах запрещены', 'Бөлмелерде жылытқыш пен плитаға тыйым салынады', 'Heaters and hot plates are not allowed in rooms'),
];
