export const POSITIONS_KEY = 'stmarco:positions:v1';
export const LAST_MIX_KEY = 'stmarco:last-mix:v1';

/** Below this, there is nothing worth resuming. */
export const MIN_RESUME_SECONDS = 5;
/** This close to the end, the mix counts as finished and starts over next time. */
export const END_MARGIN_SECONDS = 20;
/** How often the position is saved while playing (it is also saved on pause and page hide). */
export const SAVE_INTERVAL_MS = 5000;
/** Oldest positions are dropped beyond this. */
export const MAX_SAVED_POSITIONS = 100;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** localStorage, or null where it is blocked (some private modes throw on access). */
export function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function shouldKeepPosition(time: number, duration: number): boolean {
  if (!Number.isFinite(time) || time < MIN_RESUME_SECONDS) return false;
  if (Number.isFinite(duration) && duration > 0 && duration - time < END_MARGIN_SECONDS) {
    return false;
  }
  return true;
}

interface SavedPosition {
  /** Position in seconds. */
  t: number;
  /** When it was saved (ms since epoch), used to drop the oldest entries. */
  at: number;
}

export interface PositionStore {
  read(mixId: string): number | null;
  /** Keeps the position, or forgets it when it is too close to the start or the end. */
  save(mixId: string, time: number, duration: number): void;
  clear(mixId: string): void;
  readLastMixId(): string | null;
  saveLastMixId(mixId: string): void;
}

export function createPositionStore(
  storage: StorageLike | null,
  now: () => number = Date.now,
): PositionStore {
  function readAll(): Record<string, SavedPosition> {
    if (!storage) return {};
    try {
      const raw = storage.getItem(POSITIONS_KEY);
      if (!raw) return {};
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
      const result: Record<string, SavedPosition> = {};
      for (const [mixId, value] of Object.entries(parsed as Record<string, unknown>)) {
        const entry = value as Partial<SavedPosition> | null;
        if (entry && typeof entry.t === 'number' && Number.isFinite(entry.t) && entry.t >= 0) {
          result[mixId] = { t: entry.t, at: typeof entry.at === 'number' ? entry.at : 0 };
        }
      }
      return result;
    } catch {
      return {};
    }
  }

  function writeAll(all: Record<string, SavedPosition>): void {
    if (!storage) return;
    try {
      const entries = Object.entries(all)
        .sort(([, a], [, b]) => b.at - a.at)
        .slice(0, MAX_SAVED_POSITIONS);
      if (entries.length === 0) storage.removeItem(POSITIONS_KEY);
      else storage.setItem(POSITIONS_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      // Storage full or blocked: playback matters more than remembering the spot.
    }
  }

  return {
    read(mixId) {
      return readAll()[mixId]?.t ?? null;
    },
    save(mixId, time, duration) {
      const all = readAll();
      if (shouldKeepPosition(time, duration)) {
        all[mixId] = { t: Math.round(time * 10) / 10, at: now() };
      } else if (mixId in all) {
        delete all[mixId];
      } else {
        return;
      }
      writeAll(all);
    },
    clear(mixId) {
      const all = readAll();
      if (!(mixId in all)) return;
      delete all[mixId];
      writeAll(all);
    },
    readLastMixId() {
      try {
        return storage?.getItem(LAST_MIX_KEY) ?? null;
      } catch {
        return null;
      }
    },
    saveLastMixId(mixId) {
      try {
        storage?.setItem(LAST_MIX_KEY, mixId);
      } catch {
        // Ignore: see writeAll.
      }
    },
  };
}

export interface PositionSaver {
  /** Call on every timeupdate: saves at most once per interval. */
  tick(mixId: string, time: number, duration: number): void;
  /** Saves right away (pause, seek, page hide, switching mixes). */
  flush(mixId: string, time: number, duration: number): void;
}

export function createPositionSaver(
  store: PositionStore,
  {
    intervalMs = SAVE_INTERVAL_MS,
    now = Date.now,
  }: { intervalMs?: number; now?: () => number } = {},
): PositionSaver {
  let lastSave = Number.NEGATIVE_INFINITY;

  function flush(mixId: string, time: number, duration: number): void {
    lastSave = now();
    store.save(mixId, time, duration);
  }

  return {
    tick(mixId, time, duration) {
      if (now() - lastSave >= intervalMs) flush(mixId, time, duration);
    },
    flush,
  };
}
