import type { SqlDatabase } from './router';

export function seed(db: SqlDatabase, options: { demoDorm?: boolean; books: unknown[]; newId: () => string }): void;
