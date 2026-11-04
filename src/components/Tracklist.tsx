import type { Mix } from '../data/types';
import { formatTime } from '../player/format';
import { findCurrentTrackIndex } from '../player/tracklist';
import { usePlayer, usePlayerState } from '../player/usePlayer';
import { RoughFrame } from './RoughFrame';

export function Tracklist({ mix }: { mix: Mix }) {
  const player = usePlayer();
  const tracks = mix.tracklist ?? [];
  const currentIndex = usePlayerState((state) =>
    state.mixId === mix.id ? findCurrentTrackIndex(tracks, state.currentTime) : -1,
  );

  return (
    <section className="tracklist" aria-labelledby="tracklist-title">
      <h2 id="tracklist-title" className="tracklist__heading">
        Tracklist
      </h2>
      <ol className="tracklist__items" role="list">
        {tracks.map((track, index) => {
          const isCurrent = index === currentIndex;
          return (
            <li
              key={track.time}
              className={`tracklist__item${isCurrent ? ' is-current' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <button
                type="button"
                className="tracklist__button"
                aria-label={`Play from ${formatTime(track.time)}: ${track.artist}, ${track.title}`}
                onClick={() => player.playMix(mix.id, { startAt: track.time })}
              >
                <span className={`tracklist__time${isCurrent ? ' is-current' : ''}`}>
                  {isCurrent && (
                    <span className="tracklist__ring" aria-hidden="true">
                      <RoughFrame
                        seed={track.time + 5}
                        variant="highlight"
                        shape="ellipse"
                        filled={false}
                        offset={null}
                        strokeWidth={2.6}
                        roughness={1.6}
                        pad={8}
                      />
                    </span>
                  )}
                  {formatTime(track.time)}
                </span>
                <span className="tracklist__track">
                  <span className="tracklist__artist">{track.artist}</span>
                  <span className={`tracklist__name${isCurrent ? ' is-current' : ''}`}>
                    {track.title}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
