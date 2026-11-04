import { use, useSyncExternalStore } from 'react';
import { getMixById } from '../data/mixes';
import type { Mix } from '../data/types';
import { PlayerContext } from './playerContext';
import type { PlayerController } from './playerController';
import type { PlayerState } from './playerStore';

export function usePlayer(): PlayerController {
  const controller = use(PlayerContext);
  if (!controller) throw new Error('usePlayer must be used inside <PlayerProvider>.');
  return controller;
}

/** Subscribes to one piece of player state. Return primitives or stable references. */
export function usePlayerState<T>(selector: (state: PlayerState) => T): T {
  const { store } = usePlayer();
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

export function useCurrentMix(): Mix | undefined {
  return getMixById(usePlayerState((state) => state.mixId));
}

/** True while this mix is the current one and playing. */
export function useIsMixPlaying(mixId: string): boolean {
  return usePlayerState((state) => state.mixId === mixId && state.isPlaying);
}
