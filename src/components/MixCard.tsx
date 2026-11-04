import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import type { Mix } from '../data/types';
import { hashString, seededBetween } from '../drawing/random';
import { formatDate, formatDuration } from '../player/format';
import { useIsMixPlaying, usePlayerState } from '../player/usePlayer';
import { MixCover } from './MixCover';
import { PlayToggleButton } from './PlayToggleButton';
import { RoughFrame } from './RoughFrame';

/** Cards lean a little, each its own way, always the same way for the same mix. */
const MAX_CARD_TILT = 0.7;

export function MixCard({ mix }: { mix: Mix }) {
  const isCurrent = usePlayerState((state) => state.mixId === mix.id);
  const isPlaying = useIsMixPlaying(mix.id);
  const seed = hashString(mix.id);
  const tilt = seededBetween(mix.id, -MAX_CARD_TILT, MAX_CARD_TILT);

  return (
    <article
      className={`mix-card${isCurrent ? ' is-current' : ''}`}
      style={{ '--card-tilt': `${tilt.toFixed(2)}deg` } as CSSProperties}
    >
      <RoughFrame
        seed={seed}
        variant={isCurrent ? 'current' : 'card'}
        offset={[4, 5]}
        strokeWidth={isCurrent ? 3.2 : 2.4}
        roughness={1.2}
        pad={12}
      />
      <MixCover mix={mix} className="mix-card__cover" spinning={isPlaying} />
      <div className="mix-card__body">
        <h2 className="mix-card__title">
          <Link to={`/mix/${mix.slug}`} className="mix-card__link">
            <span className={`mix-card__name${isCurrent ? ' is-current' : ''}`}>{mix.title}</span>
          </Link>
        </h2>
        <p className="mix-card__meta">
          <time className="mix-card__date" dateTime={mix.date}>
            {formatDate(mix.date)}
          </time>
          <span aria-hidden="true"> · </span>
          <span className="mix-card__length">{formatDuration(mix.durationSeconds)}</span>
        </p>
        {isCurrent && <p className="mix-card__now">{isPlaying ? 'Now playing' : 'Paused here'}</p>}
      </div>
      <PlayToggleButton mix={mix} />
    </article>
  );
}
