/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_EXERCISE_MEDIA_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
