// Скачивает свободно лицензированные фото блюд с Wikimedia Commons и записывает авторство.
// Запуск: node server/tools/fetch-food-photos.mjs
import { existsSync, writeFileSync } from 'node:fs';

const PHOTOS = {
  oatmeal: 'oatmeal porridge bowl',
  omelette: 'omelette on plate',
  rice: 'boiled white rice bowl',
  mash: 'mashed potatoes plate',
  vegsalad: 'cucumber tomato salad',
  samsa: 'samsa pastry',
  cheesecake: 'cheesecake slice',
  cocoa: 'hot chocolate cup',
  americano: 'black coffee cup',
  orangejuice: 'orange juice glass',
  applejuice: 'apple juice glass',
  water: 'glass of water',
  sparkling: 'sparkling water glass',
  lemonade: 'lemonade glass mint',
  ayran: 'ayran',
  milkshake: 'milkshake glass whipped cream',
  icedtea: 'iced tea glass',
};

const UA = { 'User-Agent': 'CampusHub/1.0 (student project)' };
const dir = new URL('../../assets/images/', import.meta.url);
const credits = [];

for (const [key, query] of Object.entries(PHOTOS)) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({ action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '10', gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '480' }).forEach(([k, v]) => api.searchParams.set(k, v));
  const pages = Object.values((await (await fetch(api, { headers: UA })).json()).query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const page = pages.find((p) => {
    const info = p.imageinfo?.[0];
    const license = info?.extmetadata?.LicenseShortName?.value ?? '';
    return info?.mime === 'image/jpeg' && /^(CC|Public domain|PD)/i.test(license);
  });
  if (!page) {
    console.log(`нет фото: ${key}`);
    continue;
  }
  const info = page.imageinfo[0];
  const file = new URL(`food_${key}.jpg`, dir);
  if (!existsSync(file)) {
    const res = await fetch(info.thumburl, { headers: UA });
    if (!res.ok) {
      console.log(`ошибка ${res.status}: ${key}`);
      continue;
    }
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const author = (info.extmetadata.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim();
  credits.push(`- food_${key}.jpg: ${page.title.replace('File:', '')}, ${author}, ${info.extmetadata.LicenseShortName.value}, ${info.descriptionurl}`);
  console.log(`${key}: ${page.title}`);
  // Wikimedia ограничивает частоту запросов
  await new Promise((done) => setTimeout(done, 8000));
}

writeFileSync(new URL('CREDITS.md', dir), `# Фото блюд с Wikimedia Commons\n\n${credits.join('\n')}\n`);
