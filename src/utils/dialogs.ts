import { Alert, Platform } from 'react-native';

/** Сообщение с кнопкой «ОК». В браузере Alert из React Native не работает, поэтому там window.alert. */
export function notify(title: string, text?: string): void {
  if (Platform.OS === 'web') {
    window.alert(text ? `${title}\n\n${text}` : title);
    return;
  }
  Alert.alert(title, text);
}

/** Подтверждение действия. onConfirm вызывается, только если пользователь согласился. */
export function confirmAction(options: { title: string; text: string; confirm: string; cancel: string; onConfirm: () => void; destructive?: boolean }): void {
  const { title, text, confirm, cancel, onConfirm, destructive } = options;
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${text}`)) onConfirm();
    return;
  }
  Alert.alert(title, text, [
    { text: cancel, style: 'cancel' },
    { text: confirm, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
