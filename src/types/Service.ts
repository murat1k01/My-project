import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import type { LocalizedText } from '../i18n/localized';

/** Имя иконки из набора Ionicons (проверяется TypeScript). */
export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ServiceId = 'students' | 'food' | 'dorm' | 'subscription' | 'cal' | 'lms' | 'journal' | 'sport' | 'planner' | 'lib';

export type Service = {
  id: ServiceId;
  title: LocalizedText;
  /** Краткое описание для карточки */
  description: LocalizedText;
  icon: IoniconName;
  /** Индивидуальный цветовой акцент сервиса */
  accent: string;
  image: ImageSourcePropType;
  /** Сервис со своим экраном; без этого поля он открывается в общем экране сервисов */
  route?: 'Students' | 'Subscription' | 'Journal' | 'Planner';
  /** Показывать ли карточку на главной */
  hidden?: boolean;
};
