import type { SqlDatabase } from './router';

export const SCHEMA: string;
export function migrate(db: SqlDatabase): void;
