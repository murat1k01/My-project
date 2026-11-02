// Загружает реальные автобусные маршруты Алматы из OpenStreetMap (Overpass API)
// и сохраняет их в server/data/almaty-bus-routes.json.
// Данные © участники OpenStreetMap, лицензия ODbL. Запуск: npm run data:bus
import { writeFileSync } from 'node:fs';

const QUERY = `[out:json][timeout:170];
area["name:en"="Almaty"]["boundary"="administrative"]->.a;
rel(area.a)["type"="route"]["route"="bus"];
out body;
>;
out body qt;`;

const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'CampusHub-student-project/1.0' },
  body: new URLSearchParams({ data: QUERY }),
});
if (!response.ok) throw new Error(`Overpass ответил ${response.status}`);
const data = await response.json();

const nodes = new Map();
const ways = new Map();
for (const el of data.elements) {
  if (el.type === 'node') nodes.set(el.id, el);
  if (el.type === 'way') ways.set(el.id, el);
}

const round = (n) => Math.round(n * 1e5) / 1e5;

/** Склеивает участки дорог в одну линию, разворачивая те, что идут в обратную сторону. */
function buildLine(relation) {
  const parts = relation.members
    .filter((m) => m.type === 'way' && (!m.role || m.role === 'forward' || m.role === 'backward'))
    .map((m) => ways.get(m.ref)?.nodes)
    .filter(Boolean);
  const line = [];
  let gaps = 0;
  parts.forEach((part, index) => {
    let ids = part;
    const last = line[line.length - 1];
    if (last === undefined) {
      // Первый участок разворачиваем так, чтобы он стыковался со вторым
      const next = parts[index + 1];
      if (next && (ids[0] === next[0] || ids[0] === next[next.length - 1])) ids = [...ids].reverse();
    } else if (ids[ids.length - 1] === last) {
      ids = [...ids].reverse();
    } else if (ids[0] !== last) {
      gaps += 1; // участки не стыкуются — в данных OSM есть разрыв; берём ближайший конец
      const from = nodes.get(last);
      const a = nodes.get(ids[0]);
      const b = nodes.get(ids[ids.length - 1]);
      if (from && a && b && Math.hypot(b.lat - from.lat, b.lon - from.lon) < Math.hypot(a.lat - from.lat, a.lon - from.lon)) {
        ids = [...ids].reverse();
      }
    }
    for (const id of ids) if (id !== line[line.length - 1]) line.push(id);
  });
  const points = line.map((id) => nodes.get(id)).filter(Boolean);
  return { points, gaps };
}

/** Упрощает линию: оставляет точки не ближе ~60 м друг к другу, чтобы файл и карта были лёгкими. */
function simplify(points) {
  const out = [];
  for (const p of points) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p.lat - q.lat, p.lon - q.lon) > 0.0006) out.push(p);
  }
  if (points.length && out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]);
  return out.map((p) => [round(p.lat), round(p.lon)]);
}

function lengthKm(points) {
  let km = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dLat = (points[i].lat - points[i - 1].lat) * 111.32;
    const dLon = (points[i].lon - points[i - 1].lon) * 111.32 * Math.cos((points[i].lat * Math.PI) / 180);
    km += Math.hypot(dLat, dLon);
  }
  return Math.round(km * 10) / 10;
}

const routes = [];
for (const rel of data.elements) {
  if (rel.type !== 'relation' || !rel.tags?.ref) continue;
  const seen = new Set();
  const stops = [];
  for (const member of rel.members) {
    if (member.type !== 'node' || !/^(stop|platform)/.test(member.role)) continue;
    const node = nodes.get(member.ref);
    const name = node?.tags?.name ?? node?.tags?.['name:ru'];
    if (!node || !name || seen.has(name)) continue;
    seen.add(name);
    stops.push({ name, lat: round(node.lat), lon: round(node.lon) });
  }
  const { points: line, gaps } = buildLine(rel);
  if (line.length < 2 && stops.length < 2) continue; // маршрут без геометрии и остановок показать нельзя
  routes.push({
    id: `osm-${rel.id}`,
    number: rel.tags.ref,
    name: rel.tags.name ?? rel.tags.ref,
    from: rel.tags.from ?? stops[0]?.name ?? null,
    to: rel.tags.to ?? stops[stops.length - 1]?.name ?? null,
    operator: rel.tags.operator ?? null,
    interval: rel.tags.interval ?? null,
    hours: rel.tags.opening_hours ?? null,
    // Длину показываем только для непрерывной линии от 3 км: короче — это неполные данные OSM
    lengthKm: gaps === 0 && line.length > 1 && lengthKm(line) >= 3 ? lengthKm(line) : null,
    stops,
    line: simplify(line),
  });
}

routes.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10) || a.number.localeCompare(b.number) || a.id.localeCompare(b.id));

const output = {
  source: 'OpenStreetMap (Overpass API), © участники OpenStreetMap, лицензия ODbL',
  fetchedAt: new Date().toISOString(),
  osmTimestamp: data.osm3s?.timestamp_osm_base ?? null,
  routes,
};
writeFileSync(new URL('../data/almaty-bus-routes.json', import.meta.url), JSON.stringify(output));
console.log(`Маршрутов: ${routes.length}, номеров: ${new Set(routes.map((r) => r.number)).size}, с остановками: ${routes.filter((r) => r.stops.length > 1).length}`);
