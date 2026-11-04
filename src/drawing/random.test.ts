import { describe, expect, it } from 'vitest';
import { wobblyCircle } from './paths';
import { createRandom, hashString, seededBetween } from './random';

describe('seeded drawing', () => {
  it('gives the same numbers for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(createRandom(43)()).not.toBe(createRandom(42)());
  });

  it('hashes texts to stable seeds', () => {
    expect(hashString('sm-004')).toBe(hashString('sm-004'));
    expect(hashString('sm-004')).not.toBe(hashString('sm-003'));
  });

  it('keeps per-mix values stable and in range', () => {
    const tilt = seededBetween('sm-004', -0.6, 0.6);
    expect(tilt).toBe(seededBetween('sm-004', -0.6, 0.6));
    expect(tilt).toBeGreaterThanOrEqual(-0.6);
    expect(tilt).toBeLessThanOrEqual(0.6);
  });

  it('draws the same shape for the same seed', () => {
    expect(wobblyCircle(50, 50, 20, { seed: 7 })).toBe(wobblyCircle(50, 50, 20, { seed: 7 }));
    expect(wobblyCircle(50, 50, 20, { seed: 7 })).not.toBe(wobblyCircle(50, 50, 20, { seed: 8 }));
  });
});
