import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';

// Only the generator is used: it returns path data, no DOM or canvas. Paths are computed once
// per size and seed, then rendered as static SVG, so there is no per-frame drawing cost.
const generator = rough.generator();
type Drawable = ReturnType<typeof generator.rectangle>;

export interface RoughPath {
  d: string;
  kind: 'fill' | 'stroke';
  strokeWidth: number;
}

const BASE: Options = {
  roughness: 1.3,
  bowing: 1.1,
  strokeWidth: 3,
  fillStyle: 'solid',
  preserveVertices: false,
};

function toPaths(drawable: Drawable): RoughPath[] {
  return generator.toPaths(drawable).map((info) => ({
    d: info.d,
    kind: info.fill && info.fill !== 'none' ? 'fill' : 'stroke',
    strokeWidth: info.strokeWidth,
  }));
}

export function roughRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  options: Options & { seed: number; filled?: boolean },
): RoughPath[] {
  const { filled = false, ...rest } = options;
  return toPaths(
    generator.rectangle(x, y, width, height, {
      ...BASE,
      ...rest,
      stroke: '#000',
      ...(filled ? { fill: '#000' } : {}),
    }),
  );
}

export function roughEllipse(
  cx: number,
  cy: number,
  width: number,
  height: number,
  options: Options & { seed: number; filled?: boolean },
): RoughPath[] {
  const { filled = false, ...rest } = options;
  return toPaths(
    generator.ellipse(cx, cy, width, height, {
      ...BASE,
      ...rest,
      stroke: '#000',
      ...(filled ? { fill: '#000' } : {}),
    }),
  );
}
