// Типы для общего модуля API (сам модуль написан на JavaScript и работает и в Node.js, и в приложении).
export type SqlStatement = {
  get: (...params: unknown[]) => Record<string, unknown> | undefined;
  all: (...params: unknown[]) => Record<string, unknown>[];
  run: (...params: unknown[]) => { changes: number; lastInsertRowid?: number };
};

export type SqlDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqlStatement;
};

export type Security = {
  hashPassword: (password: string) => string | Promise<string>;
  verifyPassword: (password: string, stored: string) => boolean | Promise<boolean>;
  sha256: (value: string) => string;
  newToken: () => string;
  newResetCode: () => string;
  newId: () => string;
};

export type RouterRequest = {
  method: string;
  path: string;
  query?: { get: (name: string) => string | null };
  token?: string | null;
  body?: unknown;
  ip?: string;
};

export type RouterResponse = { status: number; data: unknown };

export function createRouter(
  db: SqlDatabase,
  deps: {
    security: Security;
    transport: unknown;
    hasCover?: (fileName: string) => boolean;
    onResetCode?: (contact: string, code: string) => void;
    adminEmail?: string | null;
    positionsUrl?: string | null;
  },
): (request: RouterRequest) => Promise<RouterResponse>;

export const LAUNDRY_SLOTS: string[];
export const PLANS: unknown[];
export class ApiError extends Error {}
