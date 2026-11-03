// Собирает демо-версию для артефакта: node artifact/build.mjs <папка>
// Берёт веб-сборку приложения, начальные данные из настоящей базы и обложки книг из проекта.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAUNDRY_SLOTS, PLANS } from '../server/api.js';
import { openDatabase } from '../server/db.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = resolve(process.argv[2] ?? join(here, 'dist'));
const web = join(out, '_web');

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'js'), { recursive: true });
mkdirSync(join(out, 'covers'), { recursive: true });

execSync(`npx expo export --platform web --output-dir "${web}"`, { cwd: root, stdio: 'inherit' });

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

// Пути к картинкам и шрифтам должны быть относительными: страница открывается не из корня сайта
const bundle = walk(join(web, '_expo')).find((f) => f.endsWith('.js'));
writeFileSync(join(out, 'js/campus-app.js'), readFileSync(bundle, 'utf8').replaceAll('"/assets/', '"assets/'));
if (existsSync(join(web, 'assets'))) cpSync(join(web, 'assets'), join(out, 'assets'), { recursive: true });
rmSync(web, { recursive: true, force: true });

// Те же начальные данные, что получает настоящий сервер
const db = openDatabase(':memory:', { demoDorm: true });
const camel = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_(\w)/g, (_, c) => c.toUpperCase()), v]));
const all = (sql) => db.prepare(sql).all().map(camel);

const books = all('SELECT * FROM books');
for (const book of books) {
  const name = `${book.id.replace(/[^\w-]/g, '_')}.jpg`;
  const cover = join(root, 'server/data/covers', name);
  if (existsSync(cover)) {
    cpSync(cover, join(out, 'covers', name));
    book.coverUrl = `covers/${name}`;
  } else {
    book.coverUrl = null; // внешние картинки на странице артефакта заблокированы
  }
}

const data = {
  books,
  menu: all('SELECT * FROM menu_items ORDER BY name').map((item) => ({ ...item, available: !!item.available })),
  pages: all('SELECT * FROM info_pages ORDER BY sort'),
  dorms: all('SELECT * FROM dorms ORDER BY name'),
  machines: all('SELECT * FROM machines ORDER BY floor, name'),
  slots: LAUNDRY_SLOTS,
  plans: PLANS,
  transport: JSON.parse(readFileSync(join(root, 'server/data/almaty-bus-routes.json'), 'utf8')),
};
writeFileSync(join(out, 'js/demo-data.js'), `window.__CAMPUS_DATA__ = ${JSON.stringify(data)};\n`);
cpSync(join(here, 'demo-api.js'), join(out, 'js/demo-api.js'));
cpSync(join(here, 'page.html'), join(out, 'page.html'));

const files = walk(out).map((f) => relative(out, f).replaceAll('\\', '/')).filter((f) => f !== 'page.html');
writeFileSync(join(out, 'files.json'), JSON.stringify(files.filter((f) => f !== 'files.json')));
console.log(`Готово: ${files.length} файлов, обложек: ${books.filter((b) => b.coverUrl).length} из ${books.length}`);
