import { api } from '../api/client';
import type { Language } from '../i18n/translations';

/**
 * Помощник ALT AI работает прямо в приложении, без внешнего ИИ и без интернета:
 * понимает простые команды на русском, казахском и английском и ведёт список задач в базе данных.
 */

export type Todo = { id: string; title: string; dueDate: string | null; done: boolean };
export type AssistantAction = { label: string; screen: 'Schedule' | 'Messages' };
export type AssistantReply = { text: string; actions?: AssistantAction[]; changed?: boolean };

type Say = (ru: string, kk: string, en: string) => string;

const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
export const showDate = (key: string) => `${key.slice(8, 10)}.${key.slice(5, 7)}.${key.slice(0, 4)}`;

const WEEKDAYS: [RegExp, number][] = [
  [/понедельник|дүйсенбі|monday/, 1],
  [/вторник|сейсенбі|tuesday/, 2],
  [/сред[уа]|сәрсенбі|wednesday/, 3],
  [/четверг|бейсенбі|thursday/, 4],
  [/пятниц[уа]|жұма|friday/, 5],
  [/суббот[уа]|сенбі|saturday/, 6],
  [/воскресенье|жексенбі|sunday/, 0],
];

/** Находит дату в тексте и возвращает её вместе с текстом без даты */
export function extractDate(text: string, now = new Date()): { date: string | null; rest: string } {
  let rest = text;
  const take = (pattern: RegExp, date: Date) => {
    rest = rest.replace(pattern, ' ');
    return dateKey(date);
  };
  const lower = text.toLowerCase();
  if (/послезавтра|бүрсігүні|day after tomorrow/.test(lower)) return { date: take(/(на )?(послезавтра|бүрсігүні|day after tomorrow)/i, addDays(now, 2)), rest: rest.trim() };
  if (/завтра|ертең|tomorrow/.test(lower)) return { date: take(/(на )?(завтра|ертең|tomorrow)/i, addDays(now, 1)), rest: rest.trim() };
  if (/сегодня|бүгін|today/.test(lower)) return { date: take(/(на )?(сегодня|бүгін|today)/i, now), rest: rest.trim() };
  const numeric = text.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    let year = numeric[3] ? Number(numeric[3]) : now.getFullYear();
    let date = new Date(year, month - 1, day);
    // Без года и уже прошедшая дата — значит следующий год
    if (!numeric[3] && date < addDays(now, 0)) date = new Date(++year, month - 1, day);
    if (date.getDate() === day && date.getMonth() === month - 1) return { date: take(/(на |к |до )?\d{1,2}\.\d{1,2}(\.\d{4})?/, date), rest: rest.trim() };
  }
  for (const [pattern, weekday] of WEEKDAYS) {
    if (pattern.test(lower)) {
      const shift = (weekday - now.getDay() + 7) % 7 || 7;
      return { date: take(new RegExp(`(в |на |к )?${pattern.source}`, 'i'), addDays(now, shift)), rest: rest.trim() };
    }
  }
  return { date: null, rest: text.trim() };
}

const todoLine = (todo: Todo, index: number, say: Say) => `${index + 1}. ${todo.done ? '✓ ' : ''}${todo.title}${todo.dueDate ? ` — ${showDate(todo.dueDate)}` : ` — ${say('без срока', 'мерзімсіз', 'no date')}`}`;

async function listTodos(say: Say): Promise<AssistantReply> {
  const { items } = await api<{ items: Todo[] }>('GET', '/api/todos');
  const open = items.filter((item) => !item.done);
  if (open.length === 0) {
    return { text: say('Открытых задач нет. Напишите, например: «добавь задачу сдать отчёт завтра».', 'Ашық тапсырма жоқ. Мысалы, жазыңыз: «тапсырма қос есеп тапсыру ертең».', 'No open tasks. Try: "add task submit the report tomorrow".') };
  }
  return { text: `${say('Ваши задачи:', 'Сіздің тапсырмаларыңыз:', 'Your tasks:')}\n${open.map((todo, i) => todoLine(todo, i, say)).join('\n')}` };
}

/** Раскладывает задачи без срока по ближайшим учебным дням (Пн–Сб), не больше двух в день */
async function planWeek(say: Say, now = new Date()): Promise<AssistantReply> {
  const { items } = await api<{ items: Todo[] }>('GET', '/api/todos');
  const open = items.filter((item) => !item.done);
  const free = open.filter((item) => !item.dueDate);
  if (open.length === 0) return listTodos(say);
  const perDay = new Map<string, number>();
  for (const item of open) if (item.dueDate) perDay.set(item.dueDate, (perDay.get(item.dueDate) ?? 0) + 1);
  let day = addDays(now, 1);
  for (const item of free) {
    while (day.getDay() === 0 || (perDay.get(dateKey(day)) ?? 0) >= 2) day = addDays(day, 1);
    const key = dateKey(day);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
    await api('PATCH', `/api/todos/${encodeURIComponent(item.id)}`, { dueDate: key });
  }
  const result = await api<{ items: Todo[] }>('GET', '/api/todos');
  const planned = result.items.filter((item) => !item.done);
  return {
    text: `${free.length ? say('Распределил задачи без срока по учебным дням, не больше двух в день:', 'Мерзімсіз тапсырмаларды оқу күндеріне бөлдім, күніне екіден аспайды:', 'I spread undated tasks over study days, at most two a day:') : say('У всех задач уже есть срок. Вот план:', 'Барлық тапсырманың мерзімі бар. Жоспар:', 'Every task already has a date. Here is the plan:')}\n${planned.map((todo, i) => todoLine(todo, i, say)).join('\n')}`,
    changed: free.length > 0,
  };
}

export async function answer(input: string, language: Language): Promise<AssistantReply> {
  const say: Say = (ru, kk, en) => (language === 'kk' ? kk : language === 'en' ? en : ru);
  const text = input.trim();
  const lower = text.toLowerCase();

  const addMatch = text.match(/^(добавь|добавить|запиши|напомни|создай|қос|жаз|add)\s+(задачу|задача|тапсырма|task)?\s*:?\s*(.+)$/i);
  if (addMatch) {
    const { date, rest } = extractDate(addMatch[3]);
    const title = rest.replace(/\s{2,}/g, ' ').replace(/^(что|чтобы|to)\s+/i, '').trim();
    if (title.length < 2) return { text: say('Опишите задачу: например, «добавь задачу сдать лабораторную в пятницу».', 'Тапсырманы жазыңыз: мысалы, «тапсырма қос зертханалық жұмыс жұма».', 'Describe the task, e.g. "add task lab report on friday".') };
    await api('POST', '/api/todos', { title, dueDate: date });
    return { text: `${say('Добавил задачу', 'Тапсырма қосылды', 'Task added')}: «${title}»${date ? ` — ${showDate(date)}` : ''}.`, changed: true };
  }

  const doneMatch = lower.match(/^(готово|сделал|сделала|выполнил|выполнила|дайын|done)\s*№?\s*(\d+)/);
  if (doneMatch) {
    const { items } = await api<{ items: Todo[] }>('GET', '/api/todos');
    const open = items.filter((item) => !item.done);
    const todo = open[Number(doneMatch[2]) - 1];
    if (!todo) return { text: say('Нет задачи с таким номером. Напишите «мои задачи», чтобы увидеть список.', 'Мұндай нөмірлі тапсырма жоқ. «тапсырмаларым» деп жазыңыз.', 'No task with that number. Type "my tasks" to see the list.') };
    await api('PATCH', `/api/todos/${encodeURIComponent(todo.id)}`, { done: true });
    return { text: `${say('Отметил как выполненную', 'Орындалды деп белгіледім', 'Marked as done')}: «${todo.title}».`, changed: true };
  }

  if (/спланир|распредел|план на неделю|жоспарла|plan my|plan the week/.test(lower)) return planWeek(say);
  if (/мои задачи|задачи|что сделать|тапсырма|tasks|to.?do/.test(lower)) return listTodos(say);
  if (/расписан|пара|сабақ|schedule|lesson/.test(lower)) {
    return {
      text: say('Расписание занятий открывается в разделе «Расписание». Оно пока не связано с системой ALT, поэтому сверяйте его с офисом регистратора.', 'Сабақ кестесі «Сабақ кестесі» бөлімінде. Ол ALT жүйесімен әлі байланыспаған, тіркеу офисімен тексеріңіз.', 'The timetable is in the Schedule section. It is not connected to the ALT system yet, so check with the registrar.'),
      actions: [{ label: say('Открыть расписание', 'Кестені ашу', 'Open schedule'), screen: 'Schedule' }],
    };
  }
  if (/сообщен|написать|хабарлама|message/.test(lower)) {
    return { text: say('Написать студенту можно во вкладке «Студенты»: откройте профиль и нажмите «Написать сообщение».', 'Студентке «Студенттер» бөлімінен жаза аласыз: профильді ашып, «Хабарлама жазу» басыңыз.', 'Open a student in the Students tab and tap "Write a message".'), actions: [{ label: say('Мои сообщения', 'Хабарламаларым', 'My messages'), screen: 'Messages' }] };
  }
  return {
    text: say(
      'Я помощник ALT AI. Умею:\n• записать задачу — «добавь задачу сдать отчёт завтра»;\n• показать задачи — «мои задачи»;\n• распределить задачи по дням — «спланируй неделю»;\n• отметить выполненное — «готово 1».',
      'Мен ALT AI көмекшісімін. Істей аламын:\n• тапсырма жазу — «тапсырма қос есеп тапсыру ертең»;\n• тапсырмаларды көрсету — «тапсырмаларым»;\n• күндерге бөлу — «аптаны жоспарла»;\n• орындалғанын белгілеу — «дайын 1».',
      'I am the ALT AI assistant. I can:\n• add a task — "add task submit the report tomorrow";\n• show tasks — "my tasks";\n• spread tasks over days — "plan the week";\n• mark done — "done 1".',
    ),
  };
}
