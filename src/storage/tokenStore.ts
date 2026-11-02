import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEY = 'campushub.session-token';

/**
 * Токен сессии на телефоне лежит в защищённом хранилище системы (Keychain / Keystore).
 * В браузере защищённого хранилища нет, поэтому используется обычное: веб-версия только для просмотра.
 */
export async function loadToken(): Promise<string | null> {
  try {
    return Platform.OS === 'web' ? await AsyncStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  } catch (error) {
    console.warn('[token] Не удалось прочитать токен', error);
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') await AsyncStorage.setItem(KEY, token);
    else await SecureStore.setItemAsync(KEY, token);
  } catch (error) {
    console.warn('[token] Не удалось сохранить токен', error);
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') await AsyncStorage.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch (error) {
    console.warn('[token] Не удалось удалить токен', error);
  }
}
