import type { TranslationKey } from '../i18n/translations';
import type { CampusState, RepairCategory } from '../types/Campus';

/**
 * Статусы заявок: ожидание → принято решение → исправлено.
 * Сервера пока нет, поэтому это ДЕМО: статус меняется автоматически по прошедшему времени.
 */
export type RequestStage = 'pending' | 'decision' | 'resolved';

export const STAGE_LABEL: Record<RequestStage, TranslationKey> = {
  pending: 'reqPending',
  decision: 'reqDecision',
  resolved: 'reqResolved',
};

const DECISION_AFTER_MIN = 10;
const RESOLVED_AFTER_MIN = 60;

export type RequestTimeline = {
  stage: RequestStage;
  /** Когда заявка перешла в текущий статус */
  changedAt: Date;
  /** Все уже пройденные статусы с датами */
  history: { stage: RequestStage; date: Date }[];
};

export function requestTimeline(createdAt: string, now: Date): RequestTimeline {
  const start = new Date(createdAt);
  const minutes = (now.getTime() - start.getTime()) / 60_000;
  const at = (offsetMin: number) => new Date(start.getTime() + offsetMin * 60_000);

  const history: RequestTimeline['history'] = [{ stage: 'pending', date: start }];
  if (minutes >= DECISION_AFTER_MIN) history.push({ stage: 'decision', date: at(DECISION_AFTER_MIN) });
  if (minutes >= RESOLVED_AFTER_MIN) history.push({ stage: 'resolved', date: at(RESOLVED_AFTER_MIN) });

  const last = history[history.length - 1];
  return { stage: last.stage, changedAt: last.date, history };
}

export type RequestKind = 'response' | 'application' | 'repair';

export const KIND_LABEL: Record<RequestKind, TranslationKey> = {
  response: 'reqKindResponse',
  application: 'reqKindApplication',
  repair: 'reqKindRepair',
};

/** Заявка в общем списке «Мои заявки» — из раздела «Студенты» или из общежития. */
export type RequestItem = {
  id: string;
  kind: RequestKind;
  text: string;
  createdAt: string;
  /** Телефон студента для откликов */
  phone?: string;
  /** Категория ремонта для заявок общежития */
  repairCategory?: RepairCategory;
};

/** Собирает все заявки пользователя, новые — первыми. */
export function collectRequests(campus: CampusState): RequestItem[] {
  const items: RequestItem[] = [
    ...campus.applications.map((app) => ({
      id: app.id,
      kind: app.kind,
      text: app.text,
      createdAt: app.createdAt,
      phone: app.studentPhone,
    })),
    ...campus.repairs.map((repair) => ({
      id: repair.id,
      kind: 'repair' as const,
      text: repair.text,
      createdAt: repair.createdAt,
      repairCategory: repair.category,
    })),
  ];
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
