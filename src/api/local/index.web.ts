import type { RouterResponse } from '../../../server/core/router';

/** В браузере встроенной базы нет: веб-версия работает через сервер (или демо-режим артефакта). */
export const LOCAL_AVAILABLE = false;

export async function localRequest(): Promise<RouterResponse> {
  return { status: 503, data: { error: { code: 'network', message: 'Встроенная база доступна только в приложении на телефоне' } } };
}
