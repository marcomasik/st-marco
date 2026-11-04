/**
 * Deterministic random numbers (mulberry32). Same seed, same drawing: doodles, borders and
 * card tilts never change between renders or visits.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a text (FNV-1a), e.g. to seed a mix card from its id. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** A stable value between min and max for a given text. */
export function seededBetween(value: string, min: number, max: number): number {
  return min + createRandom(hashString(value))() * (max - min);
}
