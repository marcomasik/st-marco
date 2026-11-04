import { DEFAULT_MEDIA_BASE_URL, resolveMediaUrl } from './mediaUrl';
import rawMixes from './mixes.json';
import type { Mix } from './types';
import { parseMixes } from './validateMixes';

/** Validates the raw data, resolves media URLs and sorts newest first. */
export function prepareMixes(input: unknown, mediaBaseUrl: string): Mix[] {
  return parseMixes(input)
    .map((record) => ({
      ...record,
      audioUrl: resolveMediaUrl(record.audioUrl, mediaBaseUrl),
      ...(record.cover ? { cover: resolveMediaUrl(record.cover, mediaBaseUrl) } : {}),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

const mediaBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL?.trim() || DEFAULT_MEDIA_BASE_URL;

/** All mixes, newest first. This order is also the player's next/previous order. */
export const mixes: readonly Mix[] = prepareMixes(rawMixes, mediaBaseUrl);

export function getMixBySlug(slug: string | undefined): Mix | undefined {
  return mixes.find((mix) => mix.slug === slug);
}

export function getMixById(id: string | null | undefined): Mix | undefined {
  return id ? mixes.find((mix) => mix.id === id) : undefined;
}
