import { Alert, Linking } from 'react-native';

/**
 * Безопасное открытие внешних ссылок: разрешены только https:// и tel:.
 * Если ссылку нечем открыть, показываем понятное сообщение с адресом.
 */
export async function openExternal(url: string, messages: { title: string; text: string }): Promise<void> {
  if (!url.startsWith('https://') && !url.startsWith('tel:')) {
    Alert.alert(messages.title, messages.text);
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(messages.title, messages.text);
  }
}
