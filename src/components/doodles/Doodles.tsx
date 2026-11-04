import type { CSSProperties } from 'react';
import {
  polygonPath,
  ringsPath,
  smoothPath,
  spiralPath,
  starPoints,
  wavePath,
  wobblyCircle,
  type Point,
} from '../../drawing/paths';
import { createRandom } from '../../drawing/random';

// Marker doodles. The style everywhere: a colour fill slightly offset from a soft-black ink
// outline, like a quick marker drawing. All shapes are computed once (seeded), and every
// doodle is decorative: aria-hidden, no pointer events.

interface DoodleProps {
  className?: string;
  style?: CSSProperties;
}

const svgProps = { 'aria-hidden': true, focusable: false } as const;

const cache = new Map<string, unknown>();
function once<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

const shift = (points: readonly Point[], dx: number, dy: number): Point[] =>
  points.map(([x, y]) => [x + dx, y + dy] as const);

/* Star ------------------------------------------------------------------ */

type FillColour = 'yellow' | 'orange' | 'cloud' | 'sea';

export function Star({
  className = '',
  style,
  seed = 11,
  fill = 'yellow',
}: DoodleProps & { seed?: number; fill?: FillColour }) {
  const shape = once(`star-${seed}`, () => {
    const points = starPoints(20, 21, 15, { seed });
    return { outline: polygonPath(points), fill: polygonPath(shift(points, 2.5, 3)) };
  });
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 40 40" style={style} {...svgProps}>
      <path className={`doodle__fill-${fill}`} d={shape.fill} />
      <path className="doodle__ink" strokeWidth={2.2} d={shape.outline} />
    </svg>
  );
}

/* Shooting star ----------------------------------------------------------- */

const TRAILS = [
  { d: 'M93 23 C70 29 42 43 9 56', colour: 'yellow' },
  { d: 'M97 34 C74 42 47 58 16 71', colour: 'orange' },
] as const;

export function ShootingStar({ className = '', style }: DoodleProps) {
  const shape = once('shooting-star', () => {
    const points = starPoints(104, 24, 15, { seed: 5 });
    return { outline: polygonPath(points), fill: polygonPath(shift(points, 2.5, 3)) };
  });
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 130 80" style={style} {...svgProps}>
      {TRAILS.map((trail) => (
        <g key={trail.colour}>
          <path className="doodle__ink" strokeWidth={9.5} d={trail.d} />
          <path className={`doodle__${trail.colour}`} strokeWidth={6} d={trail.d} />
        </g>
      ))}
      <path className="doodle__fill-yellow" d={shape.fill} />
      <path className="doodle__ink" strokeWidth={2.4} d={shape.outline} />
    </svg>
  );
}

/* Spiral ------------------------------------------------------------------ */

export function Spiral({ className = '', style, seed = 21 }: DoodleProps & { seed?: number }) {
  const d = once(`spiral-${seed}`, () => spiralPath(30, 30, 1.5, 24, 3.2, { seed }));
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 60 60" style={style} {...svgProps}>
      <path className="doodle__orange" strokeWidth={3.2} d={d} transform="translate(2 3)" />
      <path className="doodle__ink" strokeWidth={2.4} d={d} />
    </svg>
  );
}

/* Bird -------------------------------------------------------------------- */

export function Bird({ className = '', style }: DoodleProps) {
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 40 22" style={style} {...svgProps}>
      <path className="doodle__ink" strokeWidth={2.6} d="M3 13 C9 5 15 5 20 12 C25 5 31 4 37 9" />
    </svg>
  );
}

/* Wave -------------------------------------------------------------------- */

export function Wave({ className = '', style, seed = 3 }: DoodleProps & { seed?: number }) {
  const shape = once(`wave-${seed}`, () => ({
    top: wavePath(6, 12, 108, 5, 3, { seed }),
    under: wavePath(18, 20, 84, 3.5, 3, { seed: seed + 1 }),
  }));
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 120 28" style={style} {...svgProps}>
      <path
        className="doodle__ink"
        strokeWidth={1.6}
        d={shape.top}
        transform="translate(1.5 2.5)"
      />
      <path className="doodle__cloud" strokeWidth={3.4} d={shape.top} />
      <path className="doodle__sea" strokeWidth={2.4} d={shape.under} />
    </svg>
  );
}

/* Spiral sun (a sun that is also a record) -------------------------------- */

export function SpiralSun({ className = '', style }: DoodleProps) {
  const shape = once('sun', () => {
    const random = createRandom(77);
    const rays = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (random() - 0.5) * 0.12;
      const inner = 57 + random() * 4;
      const outer = 70 + random() * 8;
      const point = (r: number): Point => [80 + Math.cos(angle) * r, 80 + Math.sin(angle) * r];
      return { d: smoothPath([point(inner), point(outer)]), colour: i % 2 ? 'yellow' : 'orange' };
    });
    return {
      rays,
      body: wobblyCircle(80, 80, 45, { seed: 78, wobble: 0.03 }),
      spiral: spiralPath(80, 80, 3, 37, 3.4, { seed: 79 }),
    };
  });
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 160 160" style={style} {...svgProps}>
      {shape.rays.map((ray, i) => (
        <g key={i}>
          <path className="doodle__ink" strokeWidth={8} d={ray.d} />
          <path className={`doodle__${ray.colour}`} strokeWidth={5} d={ray.d} />
        </g>
      ))}
      <circle className="doodle__fill-yellow" cx={83} cy={84} r={44} />
      <path className="doodle__orange" strokeWidth={4} d={shape.spiral} />
      <path className="doodle__ink" strokeWidth={3} d={shape.body} />
    </svg>
  );
}

/* Spiral cloud: overlapping record-like puffs ----------------------------- */

const PUFFS: { cx: number; cy: number; r: number; label?: boolean }[] = [
  { cx: 70, cy: 86, r: 44 },
  { cx: 178, cy: 84, r: 40 },
  { cx: 40, cy: 108, r: 26 },
  { cx: 206, cy: 110, r: 22 },
  { cx: 122, cy: 66, r: 54, label: true },
  { cx: 150, cy: 112, r: 28 },
];

export function SpiralCloud({
  className = '',
  style,
  variant = 'white',
}: DoodleProps & { variant?: 'white' | 'gold' }) {
  const puffs = once('spiral-cloud', () =>
    PUFFS.map((puff, i) => ({
      ...puff,
      outline: wobblyCircle(puff.cx, puff.cy, puff.r, { seed: 200 + i, wobble: 0.025 }),
      grooves: ringsPath(puff.cx, puff.cy, puff.r - 6, Math.max(Math.round(puff.r / 8), 2), {
        seed: 300 + i * 7,
        wobble: 0.03,
      }),
    })),
  );
  const fill = variant === 'gold' ? 'doodle__fill-yellow' : 'doodle__fill-cloud';
  const grooves = variant === 'gold' ? 'doodle__orange' : 'doodle__ink';
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 240 140" style={style} {...svgProps}>
      {puffs.map((puff) => (
        <g key={`${puff.cx}-${puff.cy}`}>
          <circle className={fill} cx={puff.cx} cy={puff.cy} r={puff.r} />
          <path className={grooves} strokeWidth={1.5} d={puff.grooves} />
          {puff.label && (
            <>
              <circle className="doodle__fill-orange" cx={puff.cx} cy={puff.cy} r={puff.r * 0.3} />
              <circle
                className="doodle__ink"
                strokeWidth={1.8}
                cx={puff.cx}
                cy={puff.cy}
                r={puff.r * 0.3}
              />
              <circle className="doodle__ink-fill" cx={puff.cx} cy={puff.cy} r={2.6} />
            </>
          )}
          <path className="doodle__ink" strokeWidth={2.4} d={puff.outline} />
        </g>
      ))}
    </svg>
  );
}
