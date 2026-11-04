/** Used when VITE_MEDIA_BASE_URL is not set: files in public/mixes/ (local dev only). */
export const DEFAULT_MEDIA_BASE_URL = '/mixes';

const HAS_SCHEME = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Turns a media key from mixes.json into a loadable URL.
 * - Absolute URLs ("https://...") and root-relative paths ("/img/...") are kept as they are.
 * - Anything else is a key in the media bucket and gets the base URL in front of it.
 */
export function resolveMediaUrl(pathOrUrl: string, baseUrl: string): string {
  const value = pathOrUrl.trim();
  if (HAS_SCHEME.test(value) || value.startsWith('/')) return value;

  const base = baseUrl.trim().replace(/\/+$/, '');
  const key = value
    .replace(/^(?:\.\/)+/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(safeDecode(segment)))
    .join('/');
  return `${base}/${key}`;
}
