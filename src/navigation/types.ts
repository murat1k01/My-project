import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ServiceId } from '../types/Service';

/** Вкладки нижней навигации */
export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Transport: undefined;
  Info: undefined;
  Profile: undefined;
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
  ServiceDetails: { serviceId: ServiceId };
  BookDetails: { bookId: string };
  InfoDetail: { slug: string };
  Students: undefined;
  StudentProfile: { studentId: string };
  Journal: undefined;
  Planner: undefined;
  Requests: undefined;
  Subscription: undefined;
  Settings: undefined;
  ProfileEdit: undefined;
  Admin: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
