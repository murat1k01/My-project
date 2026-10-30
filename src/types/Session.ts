/**
 * Учебная локальная сессия. Пароль здесь НЕ хранится —
 * только логин и время входа.
 */
export type Session = {
  login: string;
  signedInAt: string;
};
