export interface Track {
  /** Start of the track, in seconds from the beginning of the mix. */
  time: number;
  artist: string;
  title: string;
}

/** One entry of src/data/mixes.json, exactly as stored. */
export interface MixRecord {
  /** Stable id, never changes (used for saved playback positions). */
  id: string;
  /** URL part: /mix/:slug */
  slug: string;
  title: string;
  /** Release date as YYYY-MM-DD. */
  date: string;
  durationSeconds: number;
  /** Key relative to VITE_MEDIA_BASE_URL (e.g. "2026/low-tide.mp3"), or an absolute URL. */
  audioUrl: string;
  /** Same rules as audioUrl. Root-relative paths ("/img/...") point into public/. */
  cover?: string;
  description?: string;
  /** Sorted by time, ascending. */
  tracklist?: Track[];
}

/** A mix as the app uses it: audioUrl and cover are resolved to loadable URLs. */
export type Mix = Readonly<MixRecord>;
