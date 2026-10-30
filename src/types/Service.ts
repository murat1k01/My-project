import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import type { LocalizedText } from '../i18n/localized';

/** Имя иконки из набора Ionicons (проверяется TypeScript). */
export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ServiceId = 'lib' | 'cal' | 'lms' | 'bus' | 'food' | 'info' | 'sport' | 'dorm';

export type Service = {
  id: ServiceId;
  /** Короткий код: LIB, CAL, ... */
  code: string;
  title: LocalizedText;
  /** Краткое описание для карточки */
  description: LocalizedText;
  icon: IoniconName;
  /** Индивидуальный цветовой акцент сервиса */
  accent: string;
  image: ImageSourcePropType;
};
