import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { ShootingStar, Spiral, SpiralCloud, Star } from './doodles/Doodles';
import { RoughFrame } from './RoughFrame';

/** Resting tilt of the panel in degrees. */
const REST_TILT = 0.9;
/** How far the bottom of the panel may drift sideways because of the tilt, in px. */
const MAX_DRIFT_NARROW = 5;
const MAX_DRIFT_WIDE = 22;
/** Swing on page load: start angle, limited so long panels do not sweep far on screen. */
const MAX_SWING = 2.4;
const MAX_SWING_SWEEP = 70;

const degrees = (radians: number) => (radians * 180) / Math.PI;

const STRING_PATH = 'M9 0 C12 22 6 46 9 68 C11 82 8 92 9 100';

function HangingString({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      className={`hanging__string is-${side}`}
      viewBox="0 0 18 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={STRING_PATH} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function PanelOrnaments() {
  return (
    <div className="panel-ornaments" aria-hidden="true">
      <Spiral className="panel-ornaments__spiral" />
      <ShootingStar className="panel-ornaments__shooting-star" />
      <Star className="panel-ornaments__star is-left" seed={23} fill="orange" />
      <Star className="panel-ornaments__star is-right" seed={37} fill="sea" />
      <SpiralCloud className="panel-ornaments__cloud" variant="gold" />
    </div>
  );
}

/**
 * The content panel hanging from two strings at the top of the page. Strings and panel
 * rotate together around the top edge, like a sign on a nail: a damped swing on load
 * (none with reduced motion), then a slight resting tilt.
 */
export function HangingPanel({ children }: { children: ReactNode }) {
  const hangingRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const hanging = hangingRef.current;
    const panel = panelRef.current;
    if (!hanging || !panel) return;

    const update = () => {
      // From the pivot (top of the page) to the bottom of the panel.
      const length = Math.max(panel.offsetTop + panel.offsetHeight, 1);
      const maxDrift = panel.offsetWidth < 560 ? MAX_DRIFT_NARROW : MAX_DRIFT_WIDE;
      const tilt = Math.min(REST_TILT, degrees(Math.atan(maxDrift / length)));
      const visible = Math.min(length, window.innerHeight);
      const swing = Math.min(MAX_SWING, degrees(Math.atan(MAX_SWING_SWEEP / visible)));
      hanging.style.setProperty('--tilt', `${tilt.toFixed(3)}deg`);
      hanging.style.setProperty('--swing', `${swing.toFixed(3)}deg`);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="hanging" ref={hangingRef}>
      <HangingString side="left" />
      <HangingString side="right" />
      <div className="panel" ref={panelRef}>
        <RoughFrame
          seed={1977}
          variant="panel"
          offset={[8, 9]}
          strokeWidth={6}
          roughness={1}
          bowing={0.6}
          pad={22}
        />
        <span className="panel__knot is-left" aria-hidden="true" />
        <span className="panel__knot is-right" aria-hidden="true" />
        <PanelOrnaments />
        {children}
      </div>
    </div>
  );
}
