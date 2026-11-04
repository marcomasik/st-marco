interface ImportMetaEnv {
  /** Where the audio files live, e.g. the R2 public URL. Defaults to /mixes (local dev). */
  readonly VITE_MEDIA_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
