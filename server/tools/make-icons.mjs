// Рисует значки приложения (логотип: академическая шапочка на синем фоне) без внешних библиотек.
// Запуск: node server/tools/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BLUE = [47, 107, 255, 255];
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(8 + body.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), out.length - 4);
  return out;
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    for (let x = 0; x < size; x += 1) Buffer.from(pixel(x + 0.5, y + 0.5)).copy(raw, row + 1 + x * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const inPoly = (x, y, pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/** Шапочка в координатах 0..1: верхний ромб, основание и кисточка. */
function isCap(u, v) {
  if (inPoly(u, v, [[0.5, 0.2], [0.98, 0.42], [0.5, 0.64], [0.02, 0.42]])) return true;
  if (inPoly(u, v, [[0.22, 0.56], [0.5, 0.69], [0.78, 0.56], [0.78, 0.74], [0.5, 0.86], [0.22, 0.74]])) return true;
  if (u > 0.9 && u < 0.94 && v > 0.45 && v < 0.74) return true;
  return Math.hypot(u - 0.92, v - 0.78) < 0.045;
}

const roundedSquare = (x, y, size, radius) => {
  const dx = Math.max(radius - x, x - (size - radius), 0);
  const dy = Math.max(radius - y, y - (size - radius), 0);
  return Math.hypot(dx, dy) <= radius;
};

/** Шапочка занимает scale от размера значка и стоит по центру */
const capPixel = (x, y, size, scale) => {
  const offset = (size * (1 - scale)) / 2;
  return isCap((x - offset) / (size * scale), (y - offset) / (size * scale));
};

const assets = new URL('../../assets/', import.meta.url);
const save = (name, size, pixel) => writeFileSync(new URL(name, assets), png(size, pixel));

// Значок iOS и общий значок: без прозрачности, углы скругляет система
save('icon.png', 1024, (x, y) => (capPixel(x, y, 1024, 0.68) ? WHITE : BLUE));
save('favicon.png', 48, (x, y) => (!roundedSquare(x, y, 48, 12) ? CLEAR : capPixel(x, y, 48, 0.72) ? WHITE : BLUE));
// Адаптивный значок Android: содержимое должно поместиться в центральной безопасной зоне
save('android-icon-foreground.png', 512, (x, y) => (capPixel(x, y, 512, 0.5) ? WHITE : CLEAR));
save('android-icon-background.png', 512, () => BLUE);
save('android-icon-monochrome.png', 432, (x, y) => (capPixel(x, y, 432, 0.5) ? WHITE : CLEAR));
console.log('Значки сохранены в assets/');
