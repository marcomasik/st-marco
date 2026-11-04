import { describe, expect, it, vi } from 'vitest';
import {
  createPositionSaver,
  createPositionStore,
  LAST_MIX_KEY,
  MAX_SAVED_POSITIONS,
  POSITIONS_KEY,
  shouldKeepPosition,
  type StorageLike,
} from './positionStorage';

function memoryStorage(
  initial: Record<string, string> = {},
): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

function throwingStorage(): StorageLike {
  const fail = () => {
    throw new DOMException('blocked', 'SecurityError');
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

describe('shouldKeepPosition', () => {
  it('ignores the first seconds and the last part of a mix', () => {
    expect(shouldKeepPosition(4.9, 3600)).toBe(false);
    expect(shouldKeepPosition(5, 3600)).toBe(true);
    expect(shouldKeepPosition(3579, 3600)).toBe(true);
    expect(shouldKeepPosition(3581, 3600)).toBe(false);
  });

  it('keeps positions when the duration is still unknown', () => {
    expect(shouldKeepPosition(120, Number.NaN)).toBe(true);
    expect(shouldKeepPosition(Number.NaN, 3600)).toBe(false);
  });
});

describe('createPositionStore', () => {
  it('saves and reads positions per mix', () => {
    const store = createPositionStore(memoryStorage());
    store.save('a', 125.37, 3600);
    store.save('b', 900, 3600);
    expect(store.read('a')).toBe(125.4);
    expect(store.read('b')).toBe(900);
    expect(store.read('c')).toBeNull();
  });

  it('forgets a position that moved back to the start or reached the end', () => {
    const storage = memoryStorage();
    const store = createPositionStore(storage);
    store.save('a', 600, 3600);
    store.save('a', 2, 3600);
    expect(store.read('a')).toBeNull();
    store.save('a', 600, 3600);
    store.save('a', 3595, 3600);
    expect(store.read('a')).toBeNull();
    expect(storage.data.has(POSITIONS_KEY)).toBe(false);
  });

  it('clears a single mix and keeps the others', () => {
    const store = createPositionStore(memoryStorage());
    store.save('a', 100, 3600);
    store.save('b', 200, 3600);
    store.clear('a');
    expect(store.read('a')).toBeNull();
    expect(store.read('b')).toBe(200);
  });

  it('survives corrupted data and starts over', () => {
    const storage = memoryStorage({ [POSITIONS_KEY]: '{not json' });
    const store = createPositionStore(storage);
    expect(store.read('a')).toBeNull();
    store.save('a', 100, 3600);
    expect(store.read('a')).toBe(100);
  });

  it('skips malformed entries', () => {
    const storage = memoryStorage({
      [POSITIONS_KEY]: JSON.stringify({
        a: { t: 'x' },
        b: { t: -3 },
        c: { t: 42, at: 1 },
        d: null,
      }),
    });
    const store = createPositionStore(storage);
    expect(['a', 'b', 'c', 'd'].map((id) => store.read(id))).toEqual([null, null, 42, null]);
  });

  it('never throws when storage is blocked', () => {
    const store = createPositionStore(throwingStorage());
    expect(() => store.save('a', 100, 3600)).not.toThrow();
    expect(store.read('a')).toBeNull();
    expect(() => store.clear('a')).not.toThrow();
    expect(() => store.saveLastMixId('a')).not.toThrow();
    expect(store.readLastMixId()).toBeNull();
  });

  it('never throws when the quota is full', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
    const store = createPositionStore(storage);
    expect(() => store.save('a', 100, 3600)).not.toThrow();
  });

  it('works without any storage', () => {
    const store = createPositionStore(null);
    store.save('a', 100, 3600);
    expect(store.read('a')).toBeNull();
  });

  it('drops the oldest positions beyond the limit', () => {
    let clock = 0;
    const store = createPositionStore(memoryStorage(), () => ++clock);
    for (let i = 0; i <= MAX_SAVED_POSITIONS; i++) store.save(`mix-${i}`, 100, 3600);
    expect(store.read('mix-0')).toBeNull();
    expect(store.read('mix-1')).toBe(100);
    expect(store.read(`mix-${MAX_SAVED_POSITIONS}`)).toBe(100);
  });

  it('remembers the last played mix', () => {
    const storage = memoryStorage();
    const store = createPositionStore(storage);
    expect(store.readLastMixId()).toBeNull();
    store.saveLastMixId('sm-004');
    expect(storage.data.get(LAST_MIX_KEY)).toBe('sm-004');
    expect(createPositionStore(storage).readLastMixId()).toBe('sm-004');
  });
});

describe('createPositionSaver', () => {
  it('saves at most once per interval while playing', () => {
    let clock = 0;
    const store = createPositionStore(memoryStorage());
    const save = vi.spyOn(store, 'save');
    const saver = createPositionSaver(store, { intervalMs: 5000, now: () => clock });

    saver.tick('a', 10, 3600);
    clock = 1000;
    saver.tick('a', 11, 3600);
    clock = 4999;
    saver.tick('a', 14, 3600);
    clock = 5000;
    saver.tick('a', 15, 3600);

    expect(save.mock.calls).toEqual([
      ['a', 10, 3600],
      ['a', 15, 3600],
    ]);
    expect(store.read('a')).toBe(15);
  });

  it('flush saves right away and restarts the interval', () => {
    let clock = 0;
    const store = createPositionStore(memoryStorage());
    const saver = createPositionSaver(store, { intervalMs: 5000, now: () => clock });

    saver.tick('a', 10, 3600);
    clock = 2000;
    saver.flush('a', 12, 3600);
    expect(store.read('a')).toBe(12);

    clock = 6000;
    saver.tick('a', 16, 3600);
    expect(store.read('a')).toBe(12);
    clock = 7000;
    saver.tick('a', 17, 3600);
    expect(store.read('a')).toBe(17);
  });
});
