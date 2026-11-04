import { describe, expect, it } from 'vitest';
import { findCurrentTrackIndex } from './tracklist';

const tracks = [{ time: 0 }, { time: 300 }, { time: 690 }, { time: 1080 }];

describe('findCurrentTrackIndex', () => {
  it('returns -1 without a tracklist', () => {
    expect(findCurrentTrackIndex(undefined, 100)).toBe(-1);
    expect(findCurrentTrackIndex([], 100)).toBe(-1);
  });

  it('returns -1 before the first track starts', () => {
    expect(findCurrentTrackIndex([{ time: 60 }, { time: 120 }], 30)).toBe(-1);
  });

  it('finds the track that is playing', () => {
    expect(findCurrentTrackIndex(tracks, 0)).toBe(0);
    expect(findCurrentTrackIndex(tracks, 299)).toBe(0);
    expect(findCurrentTrackIndex(tracks, 450)).toBe(1);
    expect(findCurrentTrackIndex(tracks, 1000)).toBe(2);
  });

  it('switches exactly at a timestamp', () => {
    expect(findCurrentTrackIndex(tracks, 300)).toBe(1);
    expect(findCurrentTrackIndex(tracks, 690)).toBe(2);
  });

  it('allows for imprecise MP3 seeks just before a timestamp', () => {
    expect(findCurrentTrackIndex(tracks, 299.8)).toBe(1);
    expect(findCurrentTrackIndex(tracks, 299.4)).toBe(0);
  });

  it('stays on the last track until the end', () => {
    expect(findCurrentTrackIndex(tracks, 1080)).toBe(3);
    expect(findCurrentTrackIndex(tracks, 99999)).toBe(3);
  });

  it('handles a single track and odd times', () => {
    expect(findCurrentTrackIndex([{ time: 0 }], 5)).toBe(0);
    expect(findCurrentTrackIndex(tracks, Number.NaN)).toBe(-1);
    expect(findCurrentTrackIndex(tracks, -10)).toBe(-1);
  });
});
