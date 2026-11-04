import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Bird, SpiralCloud, SpiralSun, Wave } from './doodles/Doodles';

// The photo itself is static HTML in index.html (so it paints before JavaScript runs): a
// cover-scaled frame with the photo's 1920 x 1279 aspect ratio. The doodles are placed in
// photo pixels inside that frame, so they stay next to the real birds and on the real water
// at every screen size.
const PHOTO_W = 1920;
const PHOTO_H = 1279;

/** x, y, width in photo pixels. */
function place(x: number, y: number, width: number, extra?: CSSProperties): CSSProperties {
  return {
    left: `${(x / PHOTO_W) * 100}%`,
    top: `${(y / PHOTO_H) * 100}%`,
    width: `${(width / PHOTO_W) * 100}%`,
    ...extra,
  };
}

export function PhotoDoodles() {
  const frame = typeof document === 'undefined' ? null : document.getElementById('photo-frame');
  if (!frame) return null;

  return createPortal(
    <>
      {/* Sun (a record too) in the open sky, top left. */}
      <SpiralSun className="photo__doodle" style={place(190, 120, 170)} />
      {/* Spiral clouds: one in the top right corner, a gold one at the horizon. */}
      <SpiralCloud className="photo__doodle" style={place(1650, 70, 280)} />
      <SpiralCloud
        className="photo__doodle"
        variant="gold"
        style={place(-60, 540, 230, { rotate: '-4deg' })}
      />
      {/* Drawn birds flying with the real ones. */}
      <Bird className="photo__doodle" style={place(100, 262, 46, { rotate: '-8deg' })} />
      <Bird className="photo__doodle" style={place(1585, 236, 38, { rotate: '6deg' })} />
      <Bird className="photo__doodle" style={place(1805, 150, 54, { rotate: '-4deg' })} />
      <Bird className="photo__doodle" style={place(1420, 430, 30, { rotate: '10deg' })} />
      {/* Waves on the real water. */}
      <Wave className="photo__doodle" seed={3} style={place(120, 790, 160)} />
      <Wave className="photo__doodle" seed={9} style={place(360, 880, 120)} />
      <Wave className="photo__doodle" seed={15} style={place(80, 960, 110)} />
      <Wave className="photo__doodle" seed={21} style={place(760, 1110, 140)} />
      <Wave className="photo__doodle" seed={27} style={place(980, 1040, 100)} />
    </>,
    frame,
  );
}
