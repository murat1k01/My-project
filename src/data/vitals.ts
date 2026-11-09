import type { TranslationKey } from '../i18n/translations';
import type { IoniconName } from '../types/Service';

/**
 * Показатели здоровья в стиле фитнес-часов. Цвет кольца: зелёный — норма, жёлтый — стоит обратить внимание,
 * красный — вне нормы. Пороги — общепринятые ориентиры для взрослых (не медицинская оценка).
 */
export type VitalId = 'pulse' | 'sleep' | 'steps' | 'water' | 'activity';
export type VitalLevel = 'good' | 'warning' | 'bad';
export type Vitals = Partial<Record<VitalId, number>> & { updatedAt?: string };

export type VitalDefinition = {
  id: VitalId;
  label: TranslationKey;
  unit: TranslationKey;
  icon: IoniconName;
  /** Значение, при котором кольцо заполнено полностью */
  ringMax: number;
  step: number;
  min: number;
  max: number;
  /** Значение по умолчанию, когда пользователь начинает ввод */
  start: number;
  level: (value: number) => VitalLevel;
};

export const VITALS: VitalDefinition[] = [
  {
    id: 'pulse',
    label: 'vitalPulse',
    unit: 'vitalPulseUnit',
    icon: 'heart',
    ringMax: 120,
    step: 1,
    min: 30,
    max: 220,
    start: 72,
    // Пульс в покое: 60–90 норма, 50–59 и 91–100 на границе, остальное вне нормы
    level: (v) => (v >= 60 && v <= 90 ? 'good' : v >= 50 && v <= 100 ? 'warning' : 'bad'),
  },
  {
    id: 'sleep',
    label: 'vitalSleep',
    unit: 'vitalSleepUnit',
    icon: 'moon',
    ringMax: 9,
    step: 0.5,
    min: 0,
    max: 16,
    start: 7,
    // Сон: 7–9 часов норма, 6–7 и 9–10 на границе
    level: (v) => (v >= 7 && v <= 9 ? 'good' : v >= 6 && v <= 10 ? 'warning' : 'bad'),
  },
  {
    id: 'steps',
    label: 'vitalSteps',
    unit: 'vitalStepsUnit',
    icon: 'footsteps',
    ringMax: 10000,
    step: 500,
    min: 0,
    max: 60000,
    start: 5000,
    level: (v) => (v >= 8000 ? 'good' : v >= 5000 ? 'warning' : 'bad'),
  },
  {
    id: 'activity',
    label: 'vitalActivity',
    unit: 'vitalActivityUnit',
    icon: 'flame',
    ringMax: 30,
    step: 5,
    min: 0,
    max: 600,
    start: 15,
    // ВОЗ советует не меньше 150 минут активности в неделю — около 30 минут в день
    level: (v) => (v >= 30 ? 'good' : v >= 15 ? 'warning' : 'bad'),
  },
  {
    id: 'water',
    label: 'vitalWater',
    unit: 'vitalWaterUnit',
    icon: 'water',
    ringMax: 8,
    step: 1,
    min: 0,
    max: 20,
    start: 4,
    level: (v) => (v >= 7 ? 'good' : v >= 4 ? 'warning' : 'bad'),
  },
];

/** Яркие цвета колец, как на фитнес-часах; одинаково заметны в светлой и тёмной теме */
export const LEVEL_COLORS: Record<VitalLevel, string> = { good: '#22C55E', warning: '#FACC15', bad: '#EF4444' };

export const clampVital = (definition: VitalDefinition, value: number) =>
  Math.min(definition.max, Math.max(definition.min, Math.round(value / definition.step) * definition.step));
