import { describe, expect, it } from 'vitest';
import demoMixes from '../../tests/fixtures/mixes.json';
import rawMixes from './mixes.json';
import { findMixDataProblems, MixDataError, parseMixes } from './validateMixes';

function validMix(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sm-100',
    slug: 'test-mix',
    title: 'Test Mix',
    date: '2026-01-31',
    durationSeconds: 600,
    audioUrl: 'test.mp3',
    tracklist: [
      { time: 0, artist: 'A', title: 'One' },
      { time: 120, artist: 'B', title: 'Two' },
    ],
    ...overrides,
  };
}

describe('findMixDataProblems', () => {
  it('accepts the real mixes.json', () => {
    expect(findMixDataProblems(rawMixes)).toEqual([]);
  });

  it('accepts the demo mixes used by the Playwright tests', () => {
    expect(findMixDataProblems(demoMixes)).toEqual([]);
  });

  it('accepts a minimal mix without optional fields', () => {
    const { tracklist: _tracklist, ...minimal } = validMix();
    expect(findMixDataProblems([minimal])).toEqual([]);
  });

  it('requires an array', () => {
    expect(findMixDataProblems({ mixes: [] })).toEqual([
      'The file must contain a JSON array of mixes.',
    ]);
  });

  it('reports missing required fields', () => {
    const problems = findMixDataProblems([{ slug: 'x' }]);
    expect(problems).toEqual(
      expect.arrayContaining([
        'Mix #1 ("x"): "id" must be a non-empty text.',
        'Mix #1 ("x"): "title" must be a non-empty text.',
        'Mix #1 ("x"): "audioUrl" must be a non-empty text.',
        'Mix #1 ("x"): "date" must be a real date written as YYYY-MM-DD.',
        'Mix #1 ("x"): "durationSeconds" must be a number above 0.',
      ]),
    );
  });

  it('rejects unknown fields so typos surface', () => {
    expect(findMixDataProblems([validMix({ descripton: 'oops' })])).toEqual([
      'Mix #1 ("test-mix") has an unknown field "descripton".',
    ]);
  });

  it('rejects bad slugs and impossible dates', () => {
    const problems = findMixDataProblems([validMix({ slug: 'Test Mix', date: '2026-02-30' })]);
    expect(problems).toContain(
      'Mix #1 ("Test Mix"): "slug" may only use a-z, 0-9 and single hyphens.',
    );
    expect(problems).toContain(
      'Mix #1 ("Test Mix"): "date" must be a real date written as YYYY-MM-DD.',
    );
  });

  it('rejects duplicate ids and slugs', () => {
    const problems = findMixDataProblems([validMix(), validMix()]);
    expect(problems).toEqual([
      'Mix #2 ("test-mix"): id "sm-100" is already used by Mix #1 ("test-mix").',
      'Mix #2 ("test-mix"): slug "test-mix" is already used by Mix #1 ("test-mix").',
    ]);
  });

  it('requires tracklist times to go up and stay inside the mix', () => {
    const problems = findMixDataProblems([
      validMix({
        tracklist: [
          { time: 0, artist: 'A', title: 'One' },
          { time: 0, artist: 'B', title: 'Two' },
          { time: 900, artist: 'C', title: 'Three' },
        ],
      }),
    ]);
    expect(problems).toEqual([
      'Mix #1 ("test-mix"), track 2: times must go up (got 0 after 0).',
      'Mix #1 ("test-mix"), track 3: "time" 900 is past the end of the mix (600s).',
    ]);
  });

  it('checks every track field', () => {
    const problems = findMixDataProblems([
      validMix({ tracklist: [{ time: -1, artist: '', title: 'x', bpm: 120 }] }),
    ]);
    expect(problems).toEqual([
      'Mix #1 ("test-mix"), track 1 has an unknown field "bpm".',
      'Mix #1 ("test-mix"), track 1: "time" must be a number of seconds, 0 or more.',
      'Mix #1 ("test-mix"), track 1: "artist" must be a non-empty text.',
    ]);
  });
});

describe('parseMixes', () => {
  it('throws one error that lists every problem', () => {
    expect(() => parseMixes([validMix({ durationSeconds: 0, slug: 'BAD' })])).toThrow(MixDataError);
    try {
      parseMixes([validMix({ durationSeconds: 0, slug: 'BAD' })]);
    } catch (error) {
      expect((error as MixDataError).problems).toHaveLength(2);
      expect((error as Error).message).toContain('src/data/mixes.json is invalid');
    }
  });

  it('returns the data typed when valid', () => {
    expect(parseMixes([validMix()])[0]?.slug).toBe('test-mix');
  });
});
