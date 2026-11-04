// "St. Marco", hand-lettered as marker strokes over an offset yellow fill, with a wave
// underline. Replace this component's SVG with your own lettering any time
// (aspect ratio about 10:3, transparent background).

const LETTERS = [
  // S
  'M72 44 C66 30 46 25 33 30 C17 36 14 53 27 63 C39 72 62 74 70 89 C78 105 66 126 44 128 C28 130 16 122 12 111',
  // t
  'M101 42 C100 70 99 100 103 121 C105 130 115 131 123 123',
  'M86 72 C96 70 108 69 121 71',
  // M
  'M170 128 C170 98 171 62 174 33 C187 60 200 87 214 104 C227 86 242 58 257 31 C259 63 261 98 263 128',
  // a
  'M327 83 C319 70 301 68 291 79 C279 93 281 118 297 126 C311 132 323 120 327 101',
  'M329 74 C328 92 328 112 333 128',
  // r
  'M352 75 C352 93 352 112 353 128',
  'M353 98 C358 81 370 72 387 77',
  // c
  'M443 85 C435 71 415 69 405 83 C395 97 397 121 413 128 C425 133 437 127 445 117',
  // o
  'M482 71 C463 71 455 93 459 109 C463 125 479 133 493 127 C509 119 513 95 503 81 C497 73 489 70 478 73',
];
const DOT = 'M134 124.5 L134.6 125';
const WAVE =
  'M172 146 C190 139 204 151 222 145 C240 139 254 151 272 145 C290 139 304 151 322 145 C340 139 354 151 372 145 C390 139 404 151 422 145 C440 139 454 151 472 145 C484 141 494 143 504 146';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`wordmark doodle ${className}`}
      viewBox="0 0 520 158"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(5 6)">
        {LETTERS.map((d) => (
          <path key={d} className="doodle__yellow" strokeWidth={16} d={d} />
        ))}
        <path className="doodle__yellow" strokeWidth={18} d={DOT} />
      </g>
      <path className="doodle__ink" strokeWidth={9} d={WAVE} />
      <path className="wordmark__wave" strokeWidth={5} d={WAVE} />
      {LETTERS.map((d) => (
        <path key={d} className="doodle__ink" strokeWidth={7.5} d={d} />
      ))}
      <path className="doodle__ink" strokeWidth={11} d={DOT} />
    </svg>
  );
}
