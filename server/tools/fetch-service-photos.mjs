// Ищет на Wikimedia Commons свободно лицензированные фото для разделов ALTushki и скачивает кандидатов.
// Запуск: node server/tools/fetch-service-photos.mjs <папка>
// В папке появятся <ключ>_<n>.jpg и candidates.json с автором, лицензией и ссылкой.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const QUERIES = process.env.QUERIES_FILE ? JSON.parse(readFileSync(process.env.QUERIES_FILE, 'utf8')) : process.env.ROUND === '2' ? {
  alt: ['Tynyshpayev', 'KazATK', 'Shevchenko Street Almaty'],
  food: ['student cafeteria interior', 'canteen interior tables', 'self-service canteen'],
  lib: ['library bookshelves interior', 'library interior reading tables', 'National Academic Library Kazakhstan'],
  sport: ['fitness center interior', 'weight training room', 'sports hall basketball'],
  lms: ['student with laptop', 'woman working on laptop', 'online learning laptop'],
  campus: ['university students group outdoors', 'students campus lawn'],
} : {
  alt: ['Kazakh Academy of Transport and Communications', 'Almaty University of Transport', 'Казахская академия транспорта и коммуникаций'],
  bus: ['Almaty bus', 'Almaty trolleybus'],
  food: ['university canteen students', 'cafeteria food counter'],
  lib: ['university library reading room', 'library reading hall students'],
  cal: ['lecture hall students', 'university classroom lecture'],
  lms: ['students studying laptop', 'student laptop study'],
  sport: ['university gym fitness', 'gym dumbbells'],
  dorm: ['student dormitory room', 'dormitory room beds'],
  city: ['Almaty panorama mountains', 'Almaty city view'],
  campus: ['students university campus Kazakhstan', 'students university hallway'],
};

const UA = { 'User-Agent': 'ALTushki/1.0 (student project; photo credits kept in assets/images/CREDITS.md)' };
const out = process.argv[2];
if (!out) throw new Error('Укажите папку');
mkdirSync(out, { recursive: true });
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const candidates = [];

for (const [key, queries] of Object.entries(QUERIES)) {
  let n = 0;
  for (const query of queries) {
    if (n >= 4) break;
    const api = new URL('https://commons.wikimedia.org/w/api.php');
    Object.entries({ action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '12', gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '800' }).forEach(([k, v]) => api.searchParams.set(k, v));
    const res = await fetch(api, { headers: UA });
    if (!res.ok) {
      console.log(`поиск ${res.status}: ${query}`);
      await wait(8000);
      continue;
    }
    const pages = Object.values((await res.json()).query?.pages ?? {}).sort((a, b) => a.index - b.index);
    for (const page of pages) {
      if (n >= 4) break;
      const info = page.imageinfo?.[0];
      const license = info?.extmetadata?.LicenseShortName?.value ?? '';
      // Только JPEG, свободная лицензия и альбомная ориентация
      if (info?.mime !== 'image/jpeg' || !/^(CC|Public domain|PD)/i.test(license) || info.width < info.height || info.width < 800) continue;
      await wait(1500);
      const img = await fetch(info.thumburl, { headers: UA });
      if (!img.ok) continue;
      const name = `${process.env.ROUND === '2' ? 'r2_' : ''}${key}_${n}.jpg`;
      writeFileSync(join(out, name), Buffer.from(await img.arrayBuffer()));
      const author = (info.extmetadata.Artist?.value ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      candidates.push({ file: name, key, title: page.title.replace('File:', ''), author, license, url: info.descriptionurl });
      console.log(`${name}: ${page.title}`);
      n += 1;
    }
    await wait(6000);
  }
}

writeFileSync(join(out, process.env.ROUND === '2' ? 'candidates2.json' : 'candidates.json'), JSON.stringify(candidates, null, 2));
