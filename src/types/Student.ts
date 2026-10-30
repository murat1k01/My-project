/**
 * Единый тип студента. Используется в списке, карточке, профиле и хранилище.
 * Поле `program` — специальность (название взято из лабораторной работы №2).
 */
export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  program: string;
  /** Дата создания записи в формате ISO */
  createdAt: string;
};

/** Данные, которые пользователь вводит в форму (id и дату создаёт приложение). */
export type StudentDraft = Pick<Student, 'firstName' | 'lastName' | 'group' | 'program'>;
