import type { MixRecord } from './types.ts';

const MIX_KEYS = new Set([
  'id',
  'slug',
  'title',
  'date',
  'durationSeconds',
  'audioUrl',
  'cover',
  'description',
  'tracklist',
]);
const TRACK_KEYS = new Set(['time', 'artist', 'title']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class MixDataError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(`src/data/mixes.json is invalid:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'MixDataError';
    this.problems = problems;
  }
}

type Entry = Record<string, unknown>;

function isEntry(value: unknown): value is Entry {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function label(entry: unknown, index: number): string {
  const slug = isEntry(entry) && typeof entry.slug === 'string' ? ` ("${entry.slug}")` : '';
  return `Mix #${index + 1}${slug}`;
}

function checkTracklist(entry: Entry, where: string, problems: string[]): void {
  const { tracklist, durationSeconds } = entry;
  if (tracklist === undefined) return;
  if (!Array.isArray(tracklist)) {
    problems.push(`${where}: "tracklist" must be an array.`);
    return;
  }
  const duration =
    typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds : null;
  let previousTime = -1;
  tracklist.forEach((track: unknown, trackIndex) => {
    const at = `${where}, track ${trackIndex + 1}`;
    if (!isEntry(track)) {
      problems.push(`${at} must be an object with time, artist and title.`);
      return;
    }
    for (const key of Object.keys(track)) {
      if (!TRACK_KEYS.has(key)) problems.push(`${at} has an unknown field "${key}".`);
    }
    const { time } = track;
    if (typeof time !== 'number' || !Number.isFinite(time) || time < 0) {
      problems.push(`${at}: "time" must be a number of seconds, 0 or more.`);
    } else {
      if (time <= previousTime) {
        problems.push(`${at}: times must go up (got ${time} after ${previousTime}).`);
      }
      if (duration !== null && time >= duration) {
        problems.push(`${at}: "time" ${time} is past the end of the mix (${duration}s).`);
      }
      previousTime = time;
    }
    if (!isNonEmptyString(track.artist)) problems.push(`${at}: "artist" must be a non-empty text.`);
    if (!isNonEmptyString(track.title)) problems.push(`${at}: "title" must be a non-empty text.`);
  });
}

/** Returns every problem in the mixes data, or an empty list when it is valid. */
export function findMixDataProblems(input: unknown): string[] {
  if (!Array.isArray(input)) return ['The file must contain a JSON array of mixes.'];

  const problems: string[] = [];
  const seenIds = new Map<string, string>();
  const seenSlugs = new Map<string, string>();

  input.forEach((entry: unknown, index) => {
    const where = label(entry, index);
    if (!isEntry(entry)) {
      problems.push(`${where} must be an object.`);
      return;
    }

    for (const key of Object.keys(entry)) {
      if (!MIX_KEYS.has(key)) problems.push(`${where} has an unknown field "${key}".`);
    }

    for (const key of ['id', 'slug', 'title', 'audioUrl'] as const) {
      if (!isNonEmptyString(entry[key]))
        problems.push(`${where}: "${key}" must be a non-empty text.`);
    }

    const { id, slug, date, durationSeconds, cover, description } = entry;

    if (typeof slug === 'string' && slug.length > 0 && !SLUG_PATTERN.test(slug)) {
      problems.push(`${where}: "slug" may only use a-z, 0-9 and single hyphens.`);
    }
    if (typeof date !== 'string' || !isValidIsoDate(date)) {
      problems.push(`${where}: "date" must be a real date written as YYYY-MM-DD.`);
    }
    if (
      typeof durationSeconds !== 'number' ||
      !Number.isFinite(durationSeconds) ||
      durationSeconds <= 0
    ) {
      problems.push(`${where}: "durationSeconds" must be a number above 0.`);
    }
    if (cover !== undefined && !isNonEmptyString(cover)) {
      problems.push(`${where}: "cover" must be a non-empty text when present.`);
    }
    if (description !== undefined && typeof description !== 'string') {
      problems.push(`${where}: "description" must be text when present.`);
    }
    checkTracklist(entry, where, problems);

    if (typeof id === 'string' && id) {
      const other = seenIds.get(id);
      if (other) problems.push(`${where}: id "${id}" is already used by ${other}.`);
      else seenIds.set(id, where);
    }
    if (typeof slug === 'string' && slug) {
      const other = seenSlugs.get(slug);
      if (other) problems.push(`${where}: slug "${slug}" is already used by ${other}.`);
      else seenSlugs.set(slug, where);
    }
  });

  return problems;
}

/** Validates the mixes data and returns it typed, or throws a MixDataError listing every problem. */
export function parseMixes(input: unknown): MixRecord[] {
  const problems = findMixDataProblems(input);
  if (problems.length > 0) throw new MixDataError(problems);
  return input as MixRecord[];
}
