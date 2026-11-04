import type { Mix } from '../data/types';

// Lock screen and notification controls. Every call is optional: older browsers have no
// Media Session API, and some browsers throw for actions they do not support.

const ARTIST = 'St. Marco';
/** Round avatar crops made by scripts/make-images.mjs, used when a mix has no cover. */
const AVATAR_ARTWORK_SIZES = [96, 192, 256, 384, 512];

function getSession(): MediaSession | null {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator
    ? navigator.mediaSession
    : null;
}

function imageType(url: string): string {
  const extension = /\.(\w+)(?:[?#].*)?$/.exec(url)?.[1]?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    default:
      return 'image/jpeg';
  }
}

export function artworkFor(mix: Mix, baseUrl: string): MediaImage[] {
  if (mix.cover) {
    return [
      { src: new URL(mix.cover, baseUrl).href, sizes: '512x512', type: imageType(mix.cover) },
    ];
  }
  return AVATAR_ARTWORK_SIZES.map((size) => ({
    src: new URL(`/icons/artwork-${size}.png`, baseUrl).href,
    sizes: `${size}x${size}`,
    type: 'image/png',
  }));
}

export function setMediaMetadata(mix: Mix | undefined): void {
  const session = getSession();
  if (!session || typeof MediaMetadata === 'undefined') return;
  try {
    session.metadata = mix
      ? new MediaMetadata({
          title: mix.title,
          artist: ARTIST,
          artwork: artworkFor(mix, window.location.href),
        })
      : null;
  } catch {
    // Ignore: the lock screen just shows less.
  }
}

type ActionHandlers = Partial<Record<MediaSessionAction, MediaSessionActionHandler>>;

/** Registers the handlers and returns a function that removes them again. */
export function setMediaActionHandlers(handlers: ActionHandlers): () => void {
  const session = getSession();
  if (!session) return () => {};
  const registered: MediaSessionAction[] = [];
  for (const [action, handler] of Object.entries(handlers) as [
    MediaSessionAction,
    MediaSessionActionHandler,
  ][]) {
    try {
      session.setActionHandler(action, handler);
      registered.push(action);
    } catch {
      // This browser does not support the action.
    }
  }
  return () => {
    for (const action of registered) {
      try {
        session.setActionHandler(action, null);
      } catch {
        // Ignore.
      }
    }
  };
}

export function setMediaPlaybackState(state: MediaSessionPlaybackState): void {
  const session = getSession();
  if (!session) return;
  try {
    session.playbackState = state;
  } catch {
    // Ignore.
  }
}

/** Keeps the lock screen progress bar in sync. Browsers extrapolate between updates. */
export function setMediaPositionState(audio: HTMLAudioElement): void {
  const session = getSession();
  if (!session || typeof session.setPositionState !== 'function') return;
  const { duration } = audio;
  if (!Number.isFinite(duration) || duration <= 0) return;
  try {
    session.setPositionState({
      duration,
      playbackRate: audio.playbackRate || 1,
      position: Math.min(Math.max(audio.currentTime, 0), duration),
    });
  } catch {
    // Ignore.
  }
}
