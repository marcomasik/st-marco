import type { ReactNode } from 'react';
import { Link } from 'react-router';
import boomboxArt from '../assets/illustrations/boombox.svg';
import { SKIP_SECONDS } from '../player/playerController';
import { useCurrentMix, usePlayer, usePlayerState } from '../player/usePlayer';
import {
  BackIcon,
  ForwardIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
} from './icons/PlayerIcons';
import { RoughFrame } from './RoughFrame';
import { SeekBar } from './SeekBar';

interface KeyProps {
  label: string;
  seed: number;
  onClick: () => void;
  disabled?: boolean;
  main?: boolean;
  children: ReactNode;
}

function Key({ label, seed, onClick, disabled = false, main = false, children }: KeyProps) {
  return (
    <button
      type="button"
      className={`boombox__key${main ? ' is-main' : ''}`}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <RoughFrame
        seed={seed}
        variant={main ? 'button' : 'key'}
        offset={null}
        strokeWidth={2.2}
        roughness={1}
        pad={6}
      />
      {children}
    </button>
  );
}

/**
 * The player: a boombox standing on the photo's sand (tablet/desktop), a drawn bar at the
 * bottom on phones. It only restyles the controls; all audio logic lives in src/player.
 * One image slot: src/assets/illustrations/boombox.svg (320 x 290). The screen and the keys
 * are HTML laid over two zones of that drawing (see _boombox.scss).
 */
export function Boombox() {
  const player = usePlayer();
  const mix = useCurrentMix();
  const isPlaying = usePlayerState((state) => state.isPlaying);
  const isBuffering = usePlayerState((state) => state.isBuffering);
  const error = usePlayerState((state) => state.error);

  const index = mix ? player.mixes.indexOf(mix) : -1;
  const hasPrevious = index > 0;
  const hasNext = index >= 0 && index < player.mixes.length - 1;

  return (
    <section className={`boombox${isPlaying ? ' is-playing' : ''}`} aria-label="Player">
      <RoughFrame seed={5150} variant="bar" offset={[4, 5]} strokeWidth={3} pad={12} />
      <img className="boombox__art" src={boomboxArt} alt="" width={320} height={290} />

      <div className="boombox__screen">
        <RoughFrame
          seed={88}
          variant="screen"
          offset={null}
          strokeWidth={2.2}
          roughness={0.9}
          pad={6}
        />
        <p className="boombox__now">
          {mix ? (
            <Link to={`/mix/${mix.slug}`} className="boombox__title">
              {mix.title}
            </Link>
          ) : (
            <span className="boombox__title">Pick a mix to start</span>
          )}
          {isPlaying && isBuffering && <span className="boombox__status">loading</span>}
        </p>
        <SeekBar />
      </div>

      <div className="boombox__keys">
        <Key
          label="Previous mix"
          seed={61}
          disabled={!hasPrevious}
          onClick={() => player.previous()}
        >
          <PreviousIcon />
        </Key>
        <Key
          label={`Back ${SKIP_SECONDS} seconds`}
          seed={62}
          disabled={!mix}
          onClick={() => player.skip(-SKIP_SECONDS)}
        >
          <BackIcon seconds={SKIP_SECONDS} />
        </Key>
        <Key main label={isPlaying ? 'Pause' : 'Play'} seed={63} onClick={() => player.toggle()}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </Key>
        <Key
          label={`Forward ${SKIP_SECONDS} seconds`}
          seed={64}
          disabled={!mix}
          onClick={() => player.skip(SKIP_SECONDS)}
        >
          <ForwardIcon seconds={SKIP_SECONDS} />
        </Key>
        <Key label="Next mix" seed={65} disabled={!hasNext} onClick={() => player.next()}>
          <NextIcon />
        </Key>
      </div>

      {error && (
        <p className="boombox__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
