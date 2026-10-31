/**
 * Единый тип студента. Используется в списке, карточке, разделе «Информация» и хранилище.
 * Обязателен только телефон; остальные сведения необязательны (пустая строка — «не указано»).
 * Поле `program` — специальность (название взято из лабораторной работы №2).
 */
export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  program: string;
  faculty: string;
  course: string;
  /** Номер в виде цифр, например 77471543655 */
  phone: string;
  /** Дата создания записи в формате ISO */
  createdAt: string;
};

/** Данные, которые пользователь вводит в форму (id и дату создаёт приложение). */
export type StudentDraft = Omit<Student, 'id' | 'createdAt'>;
