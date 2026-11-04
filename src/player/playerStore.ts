export interface PlayerState {
  /** The current mix: loaded, or restored from the last visit and waiting for a tap. */
  mixId: string | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
}

/** Plain functions (no `this`), so they can be passed around, e.g. to useSyncExternalStore. */
export interface Store<T> {
  getState: () => T;
  setState: (patch: Partial<T>) => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * Tiny store for useSyncExternalStore. Components select single values, so the 4 times a
 * second time updates only re-render what shows the time.
 */
export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState(patch) {
      const changed = (Object.keys(patch) as (keyof T)[]).some(
        (key) => !Object.is(state[key], patch[key]),
      );
      if (!changed) return;
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
