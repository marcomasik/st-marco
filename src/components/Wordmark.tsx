import { HEIGHT, PATH, WIDTH } from './wordmarkPath';

// "St. Marco" in Marco's own marker lettering (docs/drawings/StMarcoTitle.png), traced to
// SVG by scripts/trace-drawing.mjs. Drawn in the site's ink over an offset marker-yellow fill.
// To use a new drawing: replace the photo and run
//   node scripts/trace-drawing.mjs docs/drawings/StMarcoTitle.png src/components/wordmarkPath.ts --rotate=-90

/** Offset of the yellow fill behind the ink, in drawing units (about 1% of the width). */
const FILL_OFFSET = 16;

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`wordmark doodle ${className}`}
      viewBox={`0 0 ${WIDTH + FILL_OFFSET} ${HEIGHT + FILL_OFFSET}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="doodle__fill-yellow"
        fillRule="evenodd"
        d={PATH}
        transform={`translate(${FILL_OFFSET} ${FILL_OFFSET})`}
      />
      <path className="doodle__ink-fill" fillRule="evenodd" d={PATH} />
    </svg>
  );
}
