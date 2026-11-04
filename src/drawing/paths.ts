import { createRandom } from './random';

export type Point = readonly [number, number];

const round = (value: number) => Math.round(value * 10) / 10;

/** Smooth path through the points (Catmull-Rom converted to cubic Bezier curves). */
export function smoothPath(points: readonly Point[], closed = false): string {
  if (points.length < 2) return '';
  const pts = closed ? [...points, points[0]!, points[1]!] : points;
  const at = (i: number): Point => {
    if (closed) return pts[(i + pts.length) % pts.length]!;
    return pts[Math.min(Math.max(i, 0), pts.length - 1)]!;
  };
  const last = closed ? points.length : pts.length - 1;
  let d = `M${round(pts[0]![0])} ${round(pts[0]![1])}`;
  for (let i = 0; i < last; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(x2)} ${round(y2)}`;
  }
  return closed ? `${d} Z` : d;
}

interface WobbleOptions {
  seed: number;
  /** Radius variation as a share of the radius. */
  wobble?: number;
  steps?: number;
}

/** A circle as a marker would draw it: a bit uneven, the end overshooting the start. */
export function wobblyCircle(
  cx: number,
  cy: number,
  r: number,
  { seed, wobble = 0.05, steps = 12 }: WobbleOptions,
): string {
  const random = createRandom(seed);
  const start = random() * Math.PI * 2;
  const overshoot = 0.35 + random() * 0.35;
  const points: Point[] = [];
  const count = steps + 2;
  for (let i = 0; i <= count; i++) {
    const angle = start + ((Math.PI * 2 + overshoot) * i) / count;
    const radius = r * (1 + (random() - 0.5) * 2 * wobble) * (i === count ? 1.04 : 1);
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return smoothPath(points);
}

/** Spiral from the centre outwards, like a record groove or a doodled sun. */
export function spiralPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  turns: number,
  { seed, wobble = 0.03, steps = 10 }: WobbleOptions,
): string {
  const random = createRandom(seed);
  const total = Math.max(Math.round(turns * steps), 2);
  const start = random() * Math.PI * 2;
  const points: Point[] = [];
  for (let i = 0; i <= total; i++) {
    const progress = i / total;
    const angle = start + progress * turns * Math.PI * 2;
    const radius = (innerR + (outerR - innerR) * progress) * (1 + (random() - 0.5) * 2 * wobble);
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return smoothPath(points);
}

/** Concentric, slightly uneven rings: a doodled record or a spiral cloud puff. */
export function ringsPath(
  cx: number,
  cy: number,
  outerR: number,
  rings: number,
  { seed, wobble = 0.04 }: WobbleOptions,
): string {
  const gap = outerR / (rings + 0.6);
  return Array.from({ length: rings }, (_, i) =>
    wobblyCircle(cx, cy, outerR - i * gap, { seed: seed + i * 31, wobble, steps: 10 }),
  ).join(' ');
}

/** Wavy line, e.g. a wave on the water. */
export function wavePath(
  x: number,
  y: number,
  width: number,
  amplitude: number,
  waves: number,
  { seed, wobble = 0.25 }: WobbleOptions,
): string {
  const random = createRandom(seed);
  const points: Point[] = [];
  const count = waves * 2;
  for (let i = 0; i <= count; i++) {
    const up = i % 2 === 0 ? -1 : 1;
    const jitter = 1 + (random() - 0.5) * 2 * wobble;
    points.push([x + (width * i) / count, y + up * amplitude * jitter]);
  }
  return smoothPath(points);
}

/** Five-pointed star, slightly irregular. */
export function starPoints(
  cx: number,
  cy: number,
  outerR: number,
  { seed, wobble = 0.12 }: WobbleOptions,
): Point[] {
  const random = createRandom(seed);
  const tilt = (random() - 0.5) * 0.5;
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + tilt + (i * Math.PI) / 5;
    const r = (i % 2 === 0 ? outerR : outerR * 0.45) * (1 + (random() - 0.5) * 2 * wobble);
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  });
}

/** Straight-edged closed path through points (for stars). */
export function polygonPath(points: readonly Point[]): string {
  return `${points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join(' ')} Z`;
}
