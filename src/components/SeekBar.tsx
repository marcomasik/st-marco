import { useState, type CSSProperties } from 'react';
import { describeTime, formatTime } from '../player/format';
import { usePlayer, usePlayerState } from '../player/usePlayer';

/**
 * Range input for the position. While dragging it only shows the target time; the seek
 * happens on release, so a remote file does not get a burst of range requests.
 */
export function SeekBar() {
  const player = usePlayer();
  const currentTime = usePlayerState((state) => state.currentTime);
  const duration = usePlayerState((state) => state.duration);
  const hasMix = usePlayerState((state) => state.mixId !== null);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const max = Math.max(Math.floor(duration), 0);
  const value = Math.min(scrubTime ?? currentTime, max);

  function commit() {
    if (scrubTime === null) return;
    player.seek(scrubTime);
    setScrubTime(null);
  }

  return (
    <div className="seek-bar">
      <span className="seek-bar__time">{formatTime(value)}</span>
      <input
        type="range"
        className="seek-bar__input"
        min={0}
        max={max}
        step={1}
        value={Math.floor(value)}
        disabled={!hasMix}
        aria-label="Position in the mix"
        aria-valuetext={`${describeTime(value)} of ${describeTime(duration)}`}
        style={{ '--progress': max > 0 ? value / max : 0 } as CSSProperties}
        onChange={(event) => setScrubTime(Number(event.currentTarget.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <span className="seek-bar__time">{formatTime(duration)}</span>
    </div>
  );
}
