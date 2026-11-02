import { Linking } from 'react-native';
import { notify } from './dialogs';

/**
 * Безопасное открытие внешних ссылок: разрешены только https:// и tel:.
 * Если ссылку нечем открыть, показываем понятное сообщение с адресом.
 */
export async function openExternal(url: string, messages: { title: string; text: string }): Promise<void> {
  if (!url.startsWith('https://') && !url.startsWith('tel:')) {
    notify(messages.title, messages.text);
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    notify(messages.title, messages.text);
  }
}
