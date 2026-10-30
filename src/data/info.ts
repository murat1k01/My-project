import type { ImageSourcePropType } from 'react-native';
import { LocalizedText, lt } from '../i18n/localized';
import { images } from './images';

/**
 * ПРИМЕР новостей, контактов и ответов. Важно заменить реальной информацией университета.
 * Номера телефонов вымышленные.
 */
export type NewsItem = {
  id: string;
  title: LocalizedText;
  text: LocalizedText;
  /** Сколько дней назад опубликована */
  daysAgo: number;
  image: ImageSourcePropType;
};

export const NEWS: NewsItem[] = [
  {
    id: 'career',
    title: lt('Неделя карьеры: ярмарка вакансий', 'Мансап апталығы: бос орындар жәрмеңкесі', 'Career week: job fair'),
    text: lt(
      'Компании-партнёры проведут собеседования и мастер-классы для студентов старших курсов.',
      'Серіктес компаниялар жоғары курс студенттеріне сұхбат пен шеберлік сабақтарын өткізеді.',
      'Partner companies will hold interviews and workshops for senior students.',
    ),
    daysAgo: 1,
    image: images.news2,
  },
  {
    id: 'council',
    title: lt('Открыт набор в студенческий совет', 'Студенттік кеңеске қабылдау басталды', 'Student council applications are open'),
    text: lt(
      'Подайте заявку до конца месяца и предложите свою идею для жизни кампуса.',
      'Ай соңына дейін өтінім беріп, кампус өміріне өз идеяңызды ұсыныңыз.',
      'Apply by the end of the month and suggest your idea for campus life.',
    ),
    daysAgo: 3,
    image: images.news3,
  },
  {
    id: 'library',
    title: lt('Читальный зал работает дольше', 'Оқу залы ұзағырақ жұмыс істейді', 'The reading hall is open longer'),
    text: lt(
      'В период сессии читальный зал открыт до 22:00. Бронируйте места в приложении.',
      'Сессия кезінде оқу залы 22:00-ге дейін ашық. Орындарды қосымшада брондаңыз.',
      'During exams the reading hall is open until 22:00. Book seats in the app.',
    ),
    daysAgo: 6,
    image: images.serviceLib,
  },
];

export type Contact = {
  id: string;
  name: LocalizedText;
  hours: LocalizedText;
  phone: string;
};

export const CONTACTS: Contact[] = [
  { id: 'dean', name: lt('Деканат', 'Деканат', "Dean's office"), hours: lt('Пн–Пт, 09:00–18:00', 'Дс–Жм, 09:00–18:00', 'Mon–Fri, 09:00–18:00'), phone: '+7 700 000 00 01' },
  { id: 'registrar', name: lt('Офис регистратора', 'Тіркеу кеңсесі', "Registrar's office"), hours: lt('Пн–Пт, 09:00–17:00', 'Дс–Жм, 09:00–17:00', 'Mon–Fri, 09:00–17:00'), phone: '+7 700 000 00 02' },
  { id: 'medical', name: lt('Медпункт', 'Медпункт', 'Medical center'), hours: lt('Ежедневно, 08:00–20:00', 'Күн сайын, 08:00–20:00', 'Daily, 08:00–20:00'), phone: '+7 700 000 00 03' },
  { id: 'it', name: lt('IT-поддержка', 'IT қолдау', 'IT support'), hours: lt('Пн–Сб, 09:00–19:00', 'Дс–Сн, 09:00–19:00', 'Mon–Sat, 09:00–19:00'), phone: '+7 700 000 00 04' },
];

export const FAQ: { id: string; question: LocalizedText; answer: LocalizedText }[] = [
  {
    id: 'certificate',
    question: lt('Как получить справку с места учёбы?', 'Оқу орнынан анықтаманы қалай алуға болады?', 'How do I get a certificate of enrollment?'),
    answer: lt('Обратитесь в офис регистратора со студенческим билетом. Обычно справка готова за 1–2 рабочих дня.', 'Студенттік билетпен тіркеу кеңсесіне барыңыз. Әдетте анықтама 1–2 жұмыс күнінде дайын болады.', "Visit the registrar's office with your student ID. It is usually ready in 1–2 working days."),
  },
  {
    id: 'password',
    question: lt('Забыл пароль от Moodle. Что делать?', 'Moodle құпиясөзін ұмыттым. Не істеу керек?', 'I forgot my Moodle password. What should I do?'),
    answer: lt('Напишите или позвоните в IT-поддержку — пароль сбросят после проверки личности.', 'IT қолдауға жазыңыз немесе қоңырау шалыңыз — жеке басыңыз тексерілгеннен кейін құпиясөз қалпына келтіріледі.', 'Contact IT support — they will reset it after verifying your identity.'),
  },
  {
    id: 'dorm',
    question: lt('Как заселиться в общежитие?', 'Жатақханаға қалай орналасуға болады?', 'How do I move into the dormitory?'),
    answer: lt('Подайте заявление в деканат, затем получите направление и заключите договор на проживание.', 'Деканатқа өтініш беріп, жолдама алыңыз және тұру шартын жасаңыз.', "Apply at the dean's office, then get a referral and sign a housing contract."),
  },
];
