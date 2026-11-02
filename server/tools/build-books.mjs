// Проверяет список книг по Open Library и сохраняет только подтверждённые записи
// в server/data/books.json. Автор, год и наличие обложки берутся из каталога, а не «из головы».
// Запуск: npm run data:books
import { writeFileSync } from 'node:fs';

// [раздел, ISBN, ожидаемое слово в названии, описание]
const BOOKS = [
  ['Python', '9781593279288', 'crash', 'Практическое введение в Python: основы языка и небольшие проекты.'],
  ['Python', '9781491946008', 'fluent', 'Углублённое изучение возможностей Python для опытных разработчиков.'],
  ['Python', '9781449355739', 'python', 'Подробный справочник и учебник по языку Python.'],
  ['Python', '9781593275990', 'automate', 'Автоматизация повседневных задач с помощью Python.'],
  ['Java', '9780134685991', 'effective', 'Лучшие практики программирования на Java.'],
  ['Java', '9780596009205', 'head first', 'Учебник по Java с наглядным объяснением основ.'],
  ['Java', '9780321349606', 'concurrency', 'Многопоточное программирование на Java.'],
  ['C++', '9780321563842', 'c++', 'Классическая книга автора языка C++.'],
  ['C++', '9780321714114', 'primer', 'Подробный учебник по современному C++.'],
  ['C++', '9780321334879', 'effective', 'Советы по грамотному использованию C++.'],
  ['JavaScript', '9781593279509', 'eloquent', 'Введение в JavaScript и основы программирования.'],
  ['JavaScript', '9780596517748', 'good parts', 'Сильные стороны языка JavaScript и как ими пользоваться.'],
  ['JavaScript', '9781491952023', 'javascript', 'Полное руководство по языку JavaScript.'],
  ['TypeScript', '9781492037651', 'typescript', 'Система типов и практика TypeScript.'],
  ['TypeScript', '9781492053743', 'effective', 'Конкретные способы улучшить код на TypeScript.'],
  ['C#', '9781617294532', 'c#', 'Глубокое изучение языка C#.'],
  ['C#', '9781492051473', 'c#', 'Подробное введение в программирование на C#.'],
  ['Go', '9780134190440', 'go', 'Основополагающий учебник по языку Go.'],
  ['Go', '9781492077213', 'go', 'Идиоматичный Go для опытных разработчиков.'],
  ['PHP', '9781491905012', 'php', 'Современные приёмы разработки на PHP.'],
  ['PHP', '9781492054139', 'php', 'Основы языка PHP и его применение.'],
  ['React Native', '9781492029397', 'native', 'Создание мобильных приложений на React Native.'],
  ['React Native', '9781617293948', 'native', 'Практическое руководство по React Native.'],
  ['React', '9781492051725', 'react', 'Современные шаблоны разработки на React.'],
  ['React', '9781491954621', 'react', 'Введение в React и экосистему Redux.'],
  ['Разработка под Android', '9780135245125', 'android', 'Подробное руководство по созданию Android-приложений.'],
  ['Разработка под Android', '9781492082941', 'kotlin', 'Программирование на Kotlin под Android.'],
  ['Разработка под iOS', '9781492074533', 'ios', 'Основы разработки под iOS на Swift.'],
  ['Разработка под iOS', '9780135264027', 'ios', 'Руководство по программированию для iOS.'],
  ['Flutter', '9781617296147', 'flutter', 'Разработка кроссплатформенных приложений на Flutter.'],
  ['Мобильная разработка', '9781119792024', 'mobile', 'Основы разработки мобильных приложений.'],
  ['HTML и CSS', '9781118008188', 'html', 'Наглядное введение в HTML и CSS.'],
  ['HTML и CSS', '9781098124052', 'css', 'Подробно о современных возможностях CSS.'],
  ['Фронтенд-разработка', '9780596527334', 'javascript', 'Руководство по клиентскому JavaScript.'],
  ['Фронтенд-разработка', '9781492041207', 'web', 'Основы построения современных веб-страниц.'],
  ['Бэкенд-разработка', '9781449373320', 'data-intensive', 'Проектирование систем, работающих с большими данными.'],
  ['Бэкенд-разработка', '9781617296895', 'web', 'Основы серверной разработки и веб-API.'],
  ['Node.js', '9781492056898', 'node', 'Создание серверных приложений на Node.js.'],
  ['Node.js', '9781492041023', 'node', 'Разработка на Node.js и Express.'],
  ['Разработка API', '9781492026921', 'api', 'Проектирование удобных веб-API.'],
  ['Разработка API', '9781617295102', 'api', 'Как проектировать хорошие веб-API.'],
  ['Фулстек-разработка', '9781617294846', 'full', 'Полный цикл разработки веб-приложения.'],
  ['Алгоритмы и структуры данных', '9780262033848', 'algorithms', 'Классический учебник по алгоритмам.'],
  ['Алгоритмы и структуры данных', '9781617292231', 'algorithms', 'Простое и наглядное объяснение алгоритмов.'],
  ['Алгоритмы и структуры данных', '9780321573513', 'algorithms', 'Алгоритмы и структуры данных с примерами на Java.'],
  ['Базы данных', '9780073523323', 'database', 'Университетский учебник по системам баз данных.'],
  ['Базы данных', '9781449373320', 'data-intensive', 'Устройство и выбор систем хранения данных.'],
  ['SQL', '9781492057611', 'sql', 'Практическое изучение языка SQL.'],
  ['SQL', '9780596526849', 'sql', 'Приёмы решения задач на SQL.'],
  ['Компьютерные сети', '9780133594140', 'computer networking', 'Учебник по сетям «сверху вниз».'],
  ['Компьютерные сети', '9780132126953', 'computer networks', 'Классический учебник по компьютерным сетям.'],
  ['Операционные системы', '9780133591620', 'operating systems', 'Устройство современных операционных систем.'],
  ['Операционные системы', '9781118063330', 'operating system', 'Основные понятия операционных систем.'],
  ['Информационная безопасность', '9781118026472', 'web application', 'Поиск и устранение уязвимостей веб-приложений.'],
  ['Информационная безопасность', '9781119096726', 'security', 'Основы инженерии безопасности.'],
  ['Искусственный интеллект', '9780134610993', 'artificial intelligence', 'Самый известный учебник по искусственному интеллекту.'],
  ['Машинное обучение', '9781098125974', 'machine learning', 'Практика машинного обучения на Python.'],
  ['Машинное обучение', '9780262035613', 'deep learning', 'Теория глубокого обучения.'],
  ['Наука о данных', '9781492041139', 'data', 'Основы анализа данных на Python.'],
  ['Наука о данных', '9781491957660', 'python', 'Обработка и анализ данных с pandas.'],
  ['Программная инженерия', '9780132350884', 'clean code', 'Как писать понятный и поддерживаемый код.'],
  ['Программная инженерия', '9780135957059', 'pragmatic', 'Практические советы профессиональному программисту.'],
  ['Программная инженерия', '9780735619678', 'code complete', 'Подробное руководство по написанию качественного кода.'],
  ['Git и GitHub', '9781484200773', 'git', 'Полное бесплатное руководство по Git.'],
  ['Git и GitHub', '9781492091196', 'git', 'Управление версиями с помощью Git.'],
  ['Архитектура ПО', '9780134494166', 'clean architecture', 'Принципы построения архитектуры программ.'],
  ['Архитектура ПО', '9780201633610', 'design patterns', 'Классический каталог шаблонов проектирования.'],
  ['Архитектура ПО', '9781492043454', 'architecture', 'Основы архитектуры программного обеспечения.'],
];

// Open Library разрешает запросы к API книг; просим партиями, чтобы не нагружать сервис.
const results = [];
const rejected = [];
const unique = [...new Map(BOOKS.map((b) => [`${b[0]}|${b[1]}`, b])).values()];
for (let i = 0; i < unique.length; i += 20) {
  const batch = unique.slice(i, i + 20);
  const keys = batch.map((b) => `ISBN:${b[1]}`).join(',');
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=${keys}&format=json&jscmd=data`, {
    headers: { 'User-Agent': 'CampusHub-student-project/1.0' },
  });
  const data = await res.json();
  for (const [category, isbn, expected, description] of batch) {
    const entry = data[`ISBN:${isbn}`];
    if (!entry) {
      rejected.push(`${isbn} нет в каталоге`);
      continue;
    }
    const title = entry.subtitle ? `${entry.title}: ${entry.subtitle}` : entry.title;
    if (!title.toLowerCase().includes(expected)) {
      rejected.push(`${isbn} ожидалось «${expected}», в каталоге «${title}»`);
      continue;
    }
    const year = Number((entry.publish_date ?? '').match(/\d{4}/)?.[0]) || null;
    results.push({
      id: `isbn-${isbn}-${category.replace(/[^\p{L}\d]+/gu, '').toLowerCase()}`,
      isbn,
      title,
      author: (entry.authors ?? []).map((a) => a.name).join(', ') || null,
      year,
      category,
      description,
      coverUrl: entry.cover?.medium ?? null,
      sourceUrl: entry.url ?? null,
    });
  }
}

// Книги, которые ищем в каталоге по названию и автору: [раздел, название, автор, описание]
const BY_SEARCH = [
  ['React Native', 'Learning React Native', 'Eisenman', 'Создание мобильных приложений на React Native.'],
  ['React Native', 'React Native in Action', 'Dabit', 'Практическое руководство по React Native.'],
  ['Разработка под Android', 'Kotlin in Action', 'Jemerov', 'Язык Kotlin, основной для разработки под Android.'],
  ['Мобильная разработка', 'Mobile Design Pattern Gallery', 'Neil', 'Шаблоны интерфейсов мобильных приложений.'],
  ['Мобильная разработка', 'Head First Mobile Web', 'Gardner', 'Введение в разработку для мобильных устройств.'],
  ['Фронтенд-разработка', "Don't Make Me Think", 'Krug', 'Удобство интерфейсов для пользователя.'],
  ['Фронтенд-разработка', 'Refactoring UI', 'Wathan', 'Практические приёмы улучшения интерфейсов.'],
  ['HTML и CSS', 'CSS: The Definitive Guide', 'Meyer', 'Подробное руководство по CSS.'],
  ['Бэкенд-разработка', 'Building Microservices', 'Newman', 'Проектирование серверных систем из микросервисов.'],
  ['Node.js', 'Node.js Design Patterns', 'Casciaro', 'Шаблоны проектирования для приложений на Node.js.'],
  ['Node.js', 'Web Development with Node and Express', 'Brown', 'Веб-разработка на Node.js и Express.'],
  ['Фулстек-разработка', 'Pro MERN Stack', 'Subramanian', 'Полный цикл разработки на MongoDB, Express, React и Node.'],
  ['Фулстек-разработка', 'Fullstack React', 'Accomazzo', 'Создание полноценных приложений на React.'],
  ['Информационная безопасность', 'Applied Cryptography', 'Schneier', 'Классическая книга по криптографии.'],
];
for (const [category, title, author, description] of BY_SEARCH) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=5&fields=title,author_name,first_publish_year,cover_i,key,isbn`;
  const res = await fetch(url, { headers: { 'User-Agent': 'CampusHub-student-project/1.0' } });
  const data = await res.json();
  const words = title.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const doc = (data.docs ?? []).find((d) => words.every((w) => d.title.toLowerCase().includes(w)));
  if (!doc) {
    rejected.push(`поиск: «${title}» (${author}) не найдено`);
    continue;
  }
  results.push({
    id: `ol-${doc.key.split('/').pop()}-${category.replace(/[^\p{L}\d]+/gu, '').toLowerCase()}`,
    isbn: doc.isbn?.[0] ?? null,
    title: doc.title,
    author: (doc.author_name ?? []).join(', ') || null,
    year: doc.first_publish_year ?? null,
    category,
    description,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    sourceUrl: `https://openlibrary.org${doc.key}`,
  });
}

writeFileSync(
  new URL('../data/books.json', import.meta.url),
  JSON.stringify({ source: 'Open Library (openlibrary.org)', fetchedAt: new Date().toISOString(), books: results }, null, 1),
);
console.log(`Подтверждено: ${results.length}, с обложкой: ${results.filter((b) => b.coverUrl).length}, с автором: ${results.filter((b) => b.author).length}`);
console.log(`Разделов: ${new Set(results.map((b) => b.category)).size}`);
console.log(`Отклонено ${rejected.length}:\n${rejected.join('\n')}`);
