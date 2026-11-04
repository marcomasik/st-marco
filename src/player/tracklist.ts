import type { Track } from '../data/types';

/**
 * A track counts as started this many seconds before its timestamp. MP3 seeking is not
 * sample exact, so a jump to 5:00 can land at 4:59.8; the highlight should still move.
 */
export const TRACK_START_TOLERANCE = 0.5;

/**
 * Index of the track playing at `time` (the last track whose start time has passed),
 * or -1 before the first track or when there is no tracklist. Expects tracks sorted by time.
 */
export function findCurrentTrackIndex(
  tracklist: readonly Pick<Track, 'time'>[] | undefined,
  time: number,
): number {
  if (!tracklist || tracklist.length === 0 || !Number.isFinite(time)) return -1;

  const position = time + TRACK_START_TOLERANCE;
  let low = 0;
  let high = tracklist.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const track = tracklist[middle];
    if (track && track.time <= position) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}
