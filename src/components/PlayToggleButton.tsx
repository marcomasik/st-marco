import type { Mix } from '../data/types';
import { hashString } from '../drawing/random';
import { formatTime } from '../player/format';
import { useIsMixPlaying, usePlayer, usePlayerState } from '../player/usePlayer';
import { PauseIcon, PlayIcon } from './icons/PlayerIcons';
import { RoughFrame } from './RoughFrame';

interface PlayToggleButtonProps {
  mix: Mix;
  /** Show a text label next to the icon ("Play", "Resume at 12:04", "Pause"). */
  withLabel?: boolean;
}

export function PlayToggleButton({ mix, withLabel = false }: PlayToggleButtonProps) {
  const player = usePlayer();
  const isPlaying = useIsMixPlaying(mix.id);
  // Also re-renders when this mix stops, so the saved spot below is fresh.
  const isCurrent = usePlayerState((state) => state.mixId === mix.id);
  const resumeAt = !isPlaying && withLabel ? player.savedPosition(mix.id) : null;
  const seed = hashString(`${mix.id}:play`);

  const text = isPlaying ? 'Pause' : resumeAt ? `Resume at ${formatTime(resumeAt)}` : 'Play';
  const label = isPlaying ? `Pause ${mix.title}` : `${text}: ${mix.title}`;

  return (
    <button
      type="button"
      className={[
        'play-toggle',
        withLabel ? 'has-label' : '',
        isPlaying ? 'is-playing' : '',
        isCurrent ? 'is-current' : '',
      ].join(' ')}
      aria-label={label}
      onClick={() => player.toggle(mix.id)}
    >
      <RoughFrame
        seed={seed}
        variant="button"
        shape={withLabel ? 'rect' : 'ellipse'}
        offset={[2, 3]}
        strokeWidth={2.4}
        roughness={1}
        pad={8}
      />
      {isCurrent && !withLabel && (
        <span className="play-toggle__ring" aria-hidden="true">
          <RoughFrame
            seed={seed + 7}
            variant="highlight"
            shape="ellipse"
            filled={false}
            offset={null}
            strokeWidth={3}
            roughness={1.8}
            pad={10}
          />
        </span>
      )}
      <span className="play-toggle__icon">{isPlaying ? <PauseIcon /> : <PlayIcon />}</span>
      {withLabel && <span className="play-toggle__label">{text}</span>}
    </button>
  );
}
