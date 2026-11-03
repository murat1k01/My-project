// Скачивает обложки книг в server/data/covers, чтобы сервер отдавал их сам и они не зависели от внешних сайтов.
// Источник: Google Books по ISBN, затем обложка из Open Library. Запуск: npm run data:covers
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const { books } = JSON.parse(readFileSync(new URL('../data/books.json', import.meta.url)));
const dir = new URL('../data/covers/', import.meta.url);
mkdirSync(dir, { recursive: true });

/** Настоящая обложка всегда JPEG заметного размера: заглушки «нет изображения» меньше или в другом формате */
async function fetchImage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'CampusHub/1.0' } });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('jpeg')) return null;
    const data = Buffer.from(await res.arrayBuffer());
    return data.length > 3000 ? data : null;
  } catch {
    return null;
  }
}

let saved = 0;
for (const book of books) {
  const file = new URL(`${book.id.replace(/[^\w-]/g, '_')}.jpg`, dir);
  if (existsSync(file)) {
    saved += 1;
    continue;
  }
  const google = book.isbn ? await fetchImage(`https://books.google.com/books/content?vid=ISBN${book.isbn}&printsec=frontcover&img=1&zoom=1`) : null;
  const image = google ?? (book.coverUrl ? await fetchImage(book.coverUrl) : null);
  if (image) {
    writeFileSync(file, image);
    saved += 1;
  } else {
    console.log(`нет обложки: ${book.title}`);
  }
  await new Promise((done) => setTimeout(done, 300));
}
console.log(`Обложек: ${saved} из ${books.length}`);
