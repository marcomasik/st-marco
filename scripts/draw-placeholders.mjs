// Draws the two replaceable placeholder illustrations as SVG files:
//   src/assets/illustrations/boombox.svg     320 x 290 (player body, controls are laid over it)
//   src/assets/illustrations/palm-frond.svg  420 x 320 (decorative frond, base at bottom left)
// Run `node scripts/draw-placeholders.mjs` after tweaking. Replace the files with your own
// drawings any time (same name and aspect ratio, transparent background).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'illustrations');
mkdirSync(out, { recursive: true });

// Palette (same values as src/scss/base/_tokens.scss).
const C = {
  ink: '#2b2b2b',
  orange: '#f29a2e',
  yellow: '#f6c945',
  sand: '#f5d9c5',
  paper: '#fffaf0',
  sea: '#08b2ba',
  seaLight: '#8fdde0',
  palm: '#57792f',
  palmLight: '#9db04c',
  palmDark: '#3d5a24',
  groove: '#727272',
};

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (v) => Math.round(v * 10) / 10;

function smooth(points, closed = false) {
  const pts = closed ? [...points, points[0], points[1]] : points;
  const at = (i) =>
    closed ? pts[(i + pts.length) % pts.length] : pts[Math.min(Math.max(i, 0), pts.length - 1)];
  const last = closed ? points.length : pts.length - 1;
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < last; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    d += ` C${r1(x1 + (x2 - x0) / 6)} ${r1(y1 + (y2 - y0) / 6)} ${r1(x2 - (x3 - x1) / 6)} ${r1(y2 - (y3 - y1) / 6)} ${r1(x2)} ${r1(y2)}`;
  }
  return closed ? `${d} Z` : d;
}

function wobblyCircle(cx, cy, r, seed, wobble = 0.03) {
  const random = createRandom(seed);
  const start = random() * Math.PI * 2;
  const points = [];
  const steps = 12;
  for (let i = 0; i <= steps + 1; i++) {
    const a = start + ((Math.PI * 2 + 0.4) * i) / (steps + 1);
    const rr = r * (1 + (random() - 0.5) * 2 * wobble);
    points.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return smooth(points);
}

/* Boombox ------------------------------------------------------------------ */

function speaker(cx, cy, r, label, seed) {
  const grooves = [0.86, 0.72, 0.6, 0.48]
    .map(
      (f, i) =>
        `<path d="${wobblyCircle(cx, cy, r * f, seed + i)}" stroke="${C.groove}" stroke-width="1.3" fill="none"/>`,
    )
    .join('');
  return `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.ink}"/>
  ${grooves}
  <circle cx="${cx}" cy="${cy}" r="${r * 0.32}" fill="${label}" stroke="${C.ink}" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="2.4" fill="${C.paper}"/>
  <path d="M${cx - r * 0.62} ${cy - r * 0.35} C${cx - r * 0.5} ${cy - r * 0.62} ${cx - r * 0.25} ${cy - r * 0.75} ${cx} ${cy - r * 0.78}" stroke="${C.paper}" stroke-opacity="0.45" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <path d="${wobblyCircle(cx, cy, r + 1.5, seed + 9, 0.02)}" stroke="${C.ink}" stroke-width="3" fill="none"/>`;
}

function reel(cx, cy) {
  const spokes = [0, 120, 240]
    .map((deg) => {
      const a = (deg * Math.PI) / 180;
      return `<path d="M${r1(cx + Math.cos(a) * 3)} ${r1(cy + Math.sin(a) * 3)} L${r1(cx + Math.cos(a) * 8)} ${r1(cy + Math.sin(a) * 8)}" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
    })
    .join('');
  return `<circle cx="${cx}" cy="${cy}" r="9.5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.5"/>${spokes}`;
}

const body =
  'M40 44 C90 41 236 40 284 43 C303 44 312 55 312 75 C313 135 314 225 311 252 C309 270 298 279 280 279 C218 281 92 282 38 279 C20 278 9 268 9 250 C7 196 7 122 10 72 C11 54 22 45 40 44 Z';

const boombox = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 290" width="320" height="290">
  <!-- St. Marco placeholder boombox. Controls are HTML laid over two zones:
       screen: x 20-300, y 46-152  (title, seek bar, times)
       keys:   x 20-300, y 158-210 (5 buttons)
       Keep those zones calm if you draw your own. -->
  <path d="M256 46 C266 33 280 17 292 7" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <circle cx="294" cy="6" r="4.6" fill="${C.ink}"/>
  <path d="M78 48 C76 26 86 15 106 14 L214 13 C234 13 246 25 244 48" stroke="${C.ink}" stroke-width="13" stroke-linecap="round" fill="none"/>
  <path d="M78 48 C76 26 86 15 106 14 L214 13 C234 13 246 25 244 48" stroke="${C.sand}" stroke-width="6.5" stroke-linecap="round" fill="none"/>
  <path d="${body}" fill="${C.sea}" transform="translate(6 7)"/>
  <path d="${body}" fill="${C.orange}" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M28 46 C100 44 220 44 292 46 C297 46 299 49 299 54 L299 145 C299 149 296 152 291 152 C220 154 100 154 29 153 C24 153 21 150 21 145 L21 54 C21 49 24 46 28 46 Z" fill="${C.ink}" fill-opacity="0.85"/>
  <path d="M30 158 C100 156 220 156 290 157 C294 157 296 160 296 164 L297 204 C297 208 294 210 290 210 C220 212 100 212 30 211 C26 211 24 208 24 204 L23 164 C23 160 26 158 30 158 Z" fill="${C.ink}"/>
  ${speaker(64, 245, 28, C.yellow, 40)}
  ${speaker(256, 245, 28, C.seaLight, 60)}
  <path d="M120 222 C140 220 182 220 200 222 C205 222 207 225 207 229 L207 260 C207 265 204 267 199 267 C180 268 140 268 121 267 C116 267 114 264 114 260 L114 229 C114 225 116 222 120 222 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>
  ${reel(143, 244)}
  ${reel(178, 244)}
  <path d="M152 244 L169 244" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>
  <path d="M40 278 C42 284 64 285 68 279" fill="${C.ink}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M252 279 C255 285 277 284 279 278" fill="${C.ink}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
</svg>
`;

/* Palm frond ---------------------------------------------------------------- */

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const point = (i) =>
    u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i];
  const tangent = (i) =>
    3 * u * u * (p1[i] - p0[i]) + 6 * u * t * (p2[i] - p1[i]) + 3 * t * t * (p3[i] - p2[i]);
  return { x: point(0), y: point(1), tx: tangent(0), ty: tangent(1) };
}

function frond() {
  const random = createRandom(2024);
  // Midrib: from the bottom-left corner, rising to the right, drooping at the tip.
  const rib = [
    [-6, 318],
    [90, 200],
    [250, 96],
    [414, 134],
  ];
  const leaves = { back: [], front: [] };
  const count = 21;
  for (let i = 0; i < count; i++) {
    const t = 0.1 + (0.88 * i) / (count - 1);
    const { x, y, tx, ty } = bezier(...rib, t);
    const len = Math.hypot(tx, ty);
    const ux = tx / len;
    const uy = ty / len;
    for (const side of [-1, 1]) {
      // Normal pointing to this side; lower-side leaflets hang down more.
      const nx = -uy * side;
      const ny = ux * side;
      const droop = side === 1 ? 1.05 : 0.5;
      let dx = ux * 0.5 + nx * 0.85;
      let dy = uy * 0.5 + ny * 0.85 + droop;
      const dl = Math.hypot(dx, dy);
      dx /= dl;
      dy /= dl;
      const length = 150 * (1 - 0.6 * t) * (0.85 + random() * 0.3);
      const width = 8.5 * (1 - 0.45 * t);
      const tip = [x + dx * length, y + dy * length + length * 0.34];
      const mid = [x + dx * length * 0.5, y + dy * length * 0.5 + length * 0.02];
      const px = -dy;
      const py = dx;
      const shape = smooth(
        [
          [x + px * width * 0.35, y + py * width * 0.35],
          [mid[0] + px * width, mid[1] + py * width],
          tip,
          [mid[0] - px * width, mid[1] - py * width],
          [x - px * width * 0.35, y - py * width * 0.35],
        ],
        true,
      );
      const fill = (i + (side === 1 ? 1 : 0)) % 3 === 0 ? C.palmLight : C.palm;
      (side === -1 ? leaves.back : leaves.front).push(
        `<path d="${shape}" fill="${fill}" transform="translate(2 3)"/><path d="${shape}" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`,
      );
    }
  }
  const ribPath = `M${rib[0][0]} ${rib[0][1]} C${rib[1][0]} ${rib[1][1]} ${rib[2][0]} ${rib[2][1]} ${rib[3][0]} ${rib[3][1]}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320" width="420" height="320">
  <!-- St. Marco placeholder palm frond. Base at the bottom-left corner, transparent background. -->
  ${leaves.back.join('\n  ')}
  <path d="${ribPath}" stroke="${C.ink}" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="${ribPath}" stroke="${C.palmLight}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  ${leaves.front.join('\n  ')}
</svg>
`;
}

writeFileSync(join(out, 'boombox.svg'), boombox);
writeFileSync(join(out, 'palm-frond.svg'), frond());
console.log('Wrote boombox.svg and palm-frond.svg to src/assets/illustrations/');
