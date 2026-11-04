import { useMemo, useRef } from 'react';
import { roughEllipse, roughRectangle, type RoughPath } from '../drawing/rough';
import { useParentSize } from '../drawing/useParentSize';

interface RoughFrameProps {
  /** Same seed, same wobble. Use a stable value (e.g. hashed from the mix id). */
  seed: number;
  /** Colour scheme, see _doodle.scss: panel, card, current, button, key, screen, highlight, bar. */
  variant?: string;
  shape?: 'rect' | 'ellipse';
  /** Paint the paper fill inside the outline. */
  filled?: boolean;
  /** Offset of the second line in another colour; null for none. */
  offset?: readonly [number, number] | null;
  roughness?: number;
  bowing?: number;
  strokeWidth?: number;
  /** Room around the parent for overshooting lines, in px. */
  pad?: number;
}

/**
 * Hand-drawn border behind its parent's content. The parent needs `position: relative` and
 * `isolation: isolate`. Purely decorative.
 */
export function RoughFrame({
  seed,
  variant = 'card',
  shape = 'rect',
  filled = true,
  offset = [4, 5],
  roughness = 1.3,
  bowing = 1.1,
  strokeWidth = 3,
  pad = 14,
}: RoughFrameProps) {
  const ref = useRef<SVGSVGElement>(null);
  const size = useParentSize(ref);
  const offsetX = offset?.[0] ?? null;
  const offsetY = offset?.[1] ?? 0;

  const paths = useMemo(() => {
    if (!size || size.width < 4 || size.height < 4) return null;
    const draw = shape === 'ellipse' ? roughEllipseBox : roughRectangle;
    const main = draw(pad, pad, size.width, size.height, {
      seed,
      roughness,
      bowing,
      strokeWidth,
      filled,
    });
    const second =
      offsetX !== null
        ? draw(pad + offsetX, pad + offsetY, size.width, size.height, {
            seed: seed + 101,
            roughness: roughness * 1.1,
            bowing,
            strokeWidth: Math.max(strokeWidth - 0.5, 1.5),
            disableMultiStroke: true,
          })
        : [];
    return { main, second };
  }, [size, shape, pad, seed, roughness, bowing, strokeWidth, filled, offsetX, offsetY]);

  const width = (size?.width ?? 0) + pad * 2;
  const height = (size?.height ?? 0) + pad * 2;

  return (
    <svg
      ref={ref}
      className={`rough-frame is-${variant}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ left: -pad, top: -pad }}
      aria-hidden="true"
      focusable="false"
    >
      {paths && (
        <>
          {paths.second.map((path, i) => (
            <path
              key={`s${i}`}
              className="rough-frame__second"
              strokeWidth={path.strokeWidth}
              d={path.d}
            />
          ))}
          {paths.main.map((path, i) => (
            <path
              key={`m${i}`}
              className={path.kind === 'fill' ? 'rough-frame__fill' : 'rough-frame__line'}
              strokeWidth={path.kind === 'fill' ? undefined : path.strokeWidth}
              d={path.d}
            />
          ))}
        </>
      )}
    </svg>
  );
}

function roughEllipseBox(
  x: number,
  y: number,
  width: number,
  height: number,
  options: Parameters<typeof roughEllipse>[4],
): RoughPath[] {
  return roughEllipse(x + width / 2, y + height / 2, width, height, options);
}
