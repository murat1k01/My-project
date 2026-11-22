import { Linking } from 'react-native';

/** Ссылка на поиск в 2ГИС по Алматы. Если на телефоне есть приложение 2ГИС, система может открыть его. */
export function twoGisSearchUrl(query: string): string {
  return `https://2gis.kz/almaty/search/${encodeURIComponent(query)}`;
}

/** Ссылка на точку на карте 2ГИС (долгота, широта — так их ждёт 2ГИС). */
export function twoGisPointUrl(lat: number, lon: number): string {
  return `https://2gis.kz/almaty/geo/${lon.toFixed(6)},${lat.toFixed(6)}`;
}

export async function openTwoGis(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Адрес главного учебного корпуса ALT */
export const ALT_ADDRESS = 'Алматы, улица Шевченко, 97';
