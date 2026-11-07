import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ServiceId } from '../types/Service';

/** Вкладки нижней навигации */
export type MainTabParamList = {
  Home: undefined;
  Journal: undefined;
  Students: undefined;
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
};

/**
 * Корневой стек. Экраны с параметрами требуют их на уровне типов,
 * поэтому открыть профиль студента без studentId невозможно — TypeScript не даст.
 */
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Login: undefined;
  Register: undefined;
  Forgot: undefined;
  ServiceDetails: { serviceId: ServiceId; tab?: string };
  BookDetails: { bookId: string };
  Library: undefined;
  Transport: undefined;
  Info: undefined;
  InfoDetail: { slug: string };
  StudentProfile: { studentId: string };
  Requests: undefined;
  Subscription: undefined;
  ProfileEdit: undefined;
  Admin: undefined;
  EventRegistration: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
