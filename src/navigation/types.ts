import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ServiceId } from '../types/Service';

/** Вкладки нижней навигации */
export type MainTabParamList = {
  Home: undefined;
  Students: undefined;
  Profile: undefined;
  Settings: undefined;
};

/**
 * Корневой стек. Экраны с параметрами требуют их на уровне типов,
 * поэтому открыть профиль студента без studentId невозможно — TypeScript не даст.
 */
export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ServiceDetails: { serviceId: ServiceId };
  StudentProfile: { studentId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
