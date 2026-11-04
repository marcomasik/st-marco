import frondArt from '../assets/illustrations/palm-frond.svg';

/**
 * Decorative palm frond reaching in from the left, continuing the palms in the photo.
 * One image slot: replace src/assets/illustrations/palm-frond.svg (420 x 320, base at the
 * bottom left, transparent background) with your own drawing.
 */
export function PalmFrond() {
  return (
    <div className="palm-frond" aria-hidden="true">
      <img className="palm-frond__art" src={frondArt} alt="" width={420} height={320} />
    </div>
  );
}
