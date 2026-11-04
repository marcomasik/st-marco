import type { Mix } from '../data/types';
import { ringsPath } from '../drawing/paths';
import { createRandom, hashString } from '../drawing/random';
import { RoughFrame } from './RoughFrame';

const LABEL_COLOURS = ['orange', 'yellow', 'sea', 'sky', 'palm'] as const;

interface MixCoverProps {
  mix: Mix;
  className?: string;
  /** The record turns while this mix plays (not with reduced motion). */
  spinning?: boolean;
}

/** The mix cover photo in a drawn frame, or a doodled record when there is no cover. */
export function MixCover({ mix, className = '', spinning = false }: MixCoverProps) {
  const seed = hashString(mix.id);

  if (mix.cover) {
    return (
      <span className={`mix-cover is-photo ${className}`}>
        <img
          className="mix-cover__img"
          src={mix.cover}
          alt=""
          width={300}
          height={300}
          loading="lazy"
          decoding="async"
        />
        <RoughFrame
          seed={seed}
          variant="card"
          filled={false}
          offset={[3, 4]}
          strokeWidth={2.4}
          pad={6}
        />
      </span>
    );
  }

  const label = LABEL_COLOURS[Math.floor(createRandom(seed)() * LABEL_COLOURS.length)];
  return (
    <span className={`mix-cover is-vinyl ${className}`}>
      <svg
        className="mix-cover__record doodle"
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
      >
        <g className={`mix-cover__disc${spinning ? ' is-spinning' : ''}`}>
          <circle className="doodle__ink-fill" cx={50} cy={50} r={48} />
          <path
            className="mix-cover__groove"
            strokeWidth={0.9}
            d={ringsPath(50, 50, 44, 6, { seed })}
          />
          <circle className={`mix-cover__label is-${label}`} cx={50} cy={50} r={16} />
          <path className="doodle__ink" strokeWidth={1.4} d="M41 44 C44 41 49 40 53 41" />
          <circle className="doodle__fill-paper" cx={50} cy={50} r={2.3} />
        </g>
        <path className="mix-cover__shine" strokeWidth={3} d="M20 32 C25 22 34 15 45 12" />
      </svg>
    </span>
  );
}
