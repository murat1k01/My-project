import { Platform } from 'react-native';
import Constants from 'expo-constants';

const SERVER_PORT = 3000;

/**
 * Адрес сервера:
 * 1. EXPO_PUBLIC_API_URL, если задан (например, адрес хостинга).
 * 2. В Expo Go — тот же компьютер, с которого загружено приложение.
 * 3. В браузере — тот же хост, порт 3000.
 */
function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${SERVER_PORT}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:${SERVER_PORT}`;
  }
  return `http://localhost:${SERVER_PORT}`;
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }

  /** Сервер недоступен: нет интернета или он не запущен */
  get isNetwork(): boolean {
    return this.code === 'network';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Вызывается, когда сервер перестал принимать токен (сессия истекла или отозвана). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const REQUEST_TIMEOUT_MS = 15_000;

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  // Недоступный адрес в локальной сети может «висеть» минутами, поэтому запрос ограничен по времени
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Нет связи с сервером. Проверьте интернет и что сервер запущен.', 'network', 0);
  } finally {
    clearTimeout(timer);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Пустой или неверный ответ обрабатывается ниже по коду статуса
  }

  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string } } | null)?.error;
    if (response.status === 401 && authToken && error?.code === 'unauthorized') onUnauthorized?.();
    throw new ApiError(error?.message ?? 'Не удалось выполнить запрос', error?.code ?? 'unknown', response.status);
  }
  return data as T;
}

/** Текст ошибки для показа пользователю. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Что-то пошло не так';
}
