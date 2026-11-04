import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Mix } from '../data/types';
import { PlayerContext } from './playerContext';
import { createPlayerController } from './playerController';

interface PlayerProviderProps {
  mixes: readonly Mix[];
  children: ReactNode;
}

/**
 * Owns the app's one and only <audio> element. It sits outside the router and never
 * unmounts, so playback keeps going across route changes. Plain <audio> (no Web Audio API)
 * because phones keep media elements playing in the background and on the lock screen.
 */
export function PlayerProvider({ mixes, children }: PlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [controller] = useState(() => createPlayerController(mixes));

  useEffect(() => {
    const audio = audioRef.current;
    return audio ? controller.attach(audio) : undefined;
  }, [controller]);

  return (
    <PlayerContext value={controller}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext>
  );
}
