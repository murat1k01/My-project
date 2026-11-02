type Point = [number, number];

/** В OpenStreetMap линия маршрута может иметь разрывы; скачок больше этого значения (в градусах) считаем разрывом. */
const GAP_DEGREES = 0.015;

/** Разбивает линию на непрерывные участки, чтобы на карте не появлялись прямые линии через весь город. */
export function routeSegments(line: Point[]): Point[][] {
  const segments: Point[][] = [];
  let current: Point[] = [];
  for (const point of line) {
    const last = current[current.length - 1];
    if (last && (Math.abs(point[0] - last[0]) > GAP_DEGREES || Math.abs(point[1] - last[1]) > GAP_DEGREES)) {
      if (current.length > 1) segments.push(current);
      current = [];
    }
    current.push(point);
  }
  if (current.length > 1) segments.push(current);
  return segments;
}
