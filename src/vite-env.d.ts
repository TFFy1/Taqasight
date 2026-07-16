/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for all pipeline calls; defaults to /api (Netlify proxy). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
