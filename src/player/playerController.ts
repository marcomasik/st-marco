import type { Mix } from '../data/types';
import {
  setMediaActionHandlers,
  setMediaMetadata,
  setMediaPlaybackState,
  setMediaPositionState,
} from './mediaSession';
import { createStore, type PlayerState, type Store } from './playerStore';
import {
  createPositionSaver,
  createPositionStore,
  getBrowserStorage,
  type PositionStore,
} from './positionStorage';

/** Skip buttons in the app. Lock screen buttons use the offset the phone asks for. */
export const SKIP_SECONDS = 30;
/** When a mix ends, start the next one in the list. */
export const AUTO_ADVANCE = true;

export interface PlayerController {
  readonly store: Store<PlayerState>;
  readonly mixes: readonly Mix[];
  /** Connects the one <audio> element. Returns the cleanup function. */
  attach(audio: HTMLAudioElement): () => void;
  /** Must be called from a tap (iOS only allows play() inside a user gesture). */
  playMix(mixId: string, options?: { startAt?: number }): void;
  /** Play/pause the given mix, or the current one. */
  toggle(mixId?: string): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  skip(seconds: number): void;
  next(): void;
  previous(): void;
  savedPosition(mixId: string): number | null;
}

export function createPlayerController(
  mixes: readonly Mix[],
  positions: PositionStore = createPositionStore(getBrowserStorage()),
): PlayerController {
  const restored = mixes.find((mix) => mix.id === positions.readLastMixId());
  const store = createStore<PlayerState>({
    mixId: restored?.id ?? null,
    isPlaying: false,
    isBuffering: false,
    currentTime: restored ? (positions.read(restored.id) ?? 0) : 0,
    duration: restored?.durationSeconds ?? 0,
    error: null,
  });
  const saver = createPositionSaver(positions);

  let audio: HTMLAudioElement | null = null;
  /** The mix whose file is on the audio element (null until the first tap). */
  let loadedMixId: string | null = null;
  /** Where to jump once the file's metadata is known. */
  let pendingSeek: number | null = null;

  const findMix = (id: string | null) => mixes.find((mix) => mix.id === id);

  function neighbour(offset: 1 | -1): Mix | undefined {
    const index = mixes.findIndex((mix) => mix.id === store.getState().mixId);
    return index < 0 ? undefined : mixes[index + offset];
  }

  function saveNow(): void {
    if (audio && loadedMixId) saver.flush(loadedMixId, audio.currentTime, audio.duration);
  }

  function startPlayback(): void {
    if (!audio) return;
    audio.play().catch((error: unknown) => {
      // AbortError: a newer load or pause interrupted this play() call. Not a problem.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      store.setState({
        isPlaying: false,
        isBuffering: false,
        error:
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'Tap play to start the mix.'
            : 'This mix could not be played.',
      });
    });
  }

  function load(mix: Mix, startAt: number | undefined): void {
    if (!audio) return;
    if (loadedMixId && loadedMixId !== mix.id) saveNow();
    const resumeAt = startAt ?? positions.read(mix.id) ?? 0;
    pendingSeek = resumeAt > 0 ? resumeAt : null;
    loadedMixId = mix.id;
    positions.saveLastMixId(mix.id);
    store.setState({
      mixId: mix.id,
      currentTime: resumeAt,
      duration: mix.durationSeconds,
      isBuffering: true,
      error: null,
    });
    audio.src = mix.audioUrl;
    setMediaMetadata(mix);
  }

  const controller: PlayerController = {
    store,
    mixes,

    playMix(mixId, options) {
      const mix = findMix(mixId);
      if (!mix || !audio) return;
      if (loadedMixId === mix.id) {
        if (options?.startAt !== undefined) controller.seek(options.startAt);
      } else {
        load(mix, options?.startAt);
      }
      startPlayback();
    },

    toggle(mixId) {
      const targetId = mixId ?? store.getState().mixId ?? mixes[0]?.id;
      if (!targetId || !audio) return;
      if (targetId === loadedMixId && !audio.paused) audio.pause();
      else controller.playMix(targetId);
    },

    play() {
      const id = store.getState().mixId ?? mixes[0]?.id;
      if (id) controller.playMix(id);
    },

    pause() {
      audio?.pause();
    },

    seek(time) {
      const state = store.getState();
      const known = audio && Number.isFinite(audio.duration) ? audio.duration : state.duration;
      const target = Math.min(Math.max(time, 0), Math.max(known, 0));
      store.setState({ currentTime: target });
      if (audio && loadedMixId) {
        if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) audio.currentTime = target;
        else pendingSeek = target;
      } else if (state.mixId) {
        // Restored from the last visit but not loaded yet: remember it for the first play.
        positions.save(state.mixId, target, state.duration);
      }
    },

    skip(seconds) {
      controller.seek(store.getState().currentTime + seconds);
    },

    next() {
      const mix = neighbour(1);
      if (mix) controller.playMix(mix.id);
    },

    previous() {
      const mix = neighbour(-1);
      if (mix) controller.playMix(mix.id);
    },

    savedPosition(mixId) {
      return positions.read(mixId);
    },

    attach(element) {
      audio = element;

      const listeners: [string, () => void][] = [
        [
          'play',
          () => {
            store.setState({ isPlaying: true, error: null });
            setMediaMetadata(findMix(loadedMixId));
            setMediaPlaybackState('playing');
            setMediaPositionState(element);
          },
        ],
        ['playing', () => store.setState({ isBuffering: false })],
        ['waiting', () => store.setState({ isBuffering: true })],
        ['canplay', () => store.setState({ isBuffering: false })],
        [
          'pause',
          () => {
            store.setState({ isPlaying: false, isBuffering: false });
            saveNow();
            setMediaPlaybackState('paused');
            setMediaPositionState(element);
          },
        ],
        [
          'timeupdate',
          () => {
            store.setState({ currentTime: element.currentTime });
            if (loadedMixId && !element.paused) {
              saver.tick(loadedMixId, element.currentTime, element.duration);
            }
          },
        ],
        [
          'loadedmetadata',
          () => {
            if (pendingSeek !== null) {
              element.currentTime = Math.max(Math.min(pendingSeek, element.duration - 1), 0);
              pendingSeek = null;
            }
            store.setState({ duration: element.duration, currentTime: element.currentTime });
            setMediaPositionState(element);
          },
        ],
        [
          'durationchange',
          () => {
            if (Number.isFinite(element.duration)) store.setState({ duration: element.duration });
            setMediaPositionState(element);
          },
        ],
        [
          'seeked',
          () => {
            store.setState({ currentTime: element.currentTime });
            if (loadedMixId) saver.flush(loadedMixId, element.currentTime, element.duration);
            setMediaPositionState(element);
          },
        ],
        ['ratechange', () => setMediaPositionState(element)],
        [
          'ended',
          () => {
            if (loadedMixId) positions.clear(loadedMixId);
            store.setState({ isPlaying: false });
            const upcoming = neighbour(1);
            if (AUTO_ADVANCE && upcoming) controller.playMix(upcoming.id);
          },
        ],
        [
          'error',
          () => {
            if (!loadedMixId) return;
            store.setState({
              isPlaying: false,
              isBuffering: false,
              error: 'This mix could not be loaded. Check the connection and try again.',
            });
          },
        ],
      ];
      for (const [type, handler] of listeners) element.addEventListener(type, handler);

      // Phones can close a backgrounded tab without warning: save whenever the page hides.
      const onPageHide = () => saveNow();
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') saveNow();
      };
      window.addEventListener('pagehide', onPageHide);
      document.addEventListener('visibilitychange', onVisibilityChange);

      const removeMediaHandlers = setMediaActionHandlers({
        play: () => controller.play(),
        pause: () => controller.pause(),
        seekbackward: (details) => controller.skip(-(details.seekOffset ?? SKIP_SECONDS)),
        seekforward: (details) => controller.skip(details.seekOffset ?? SKIP_SECONDS),
        seekto: (details) => {
          if (details.seekTime === undefined) return;
          if (details.fastSeek && typeof element.fastSeek === 'function') {
            element.fastSeek(details.seekTime);
          } else {
            controller.seek(details.seekTime);
          }
        },
        previoustrack: () => controller.previous(),
        nexttrack: () => controller.next(),
      });

      return () => {
        for (const [type, handler] of listeners) element.removeEventListener(type, handler);
        window.removeEventListener('pagehide', onPageHide);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        removeMediaHandlers();
        if (audio === element) audio = null;
      };
    },
  };

  return controller;
}
