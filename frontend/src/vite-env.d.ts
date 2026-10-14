/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Adresse de l'API. Par défaut `/api`, relayé vers Laravel par le serveur Vite. */
  readonly VITE_API_URL?: string;
  /** Code fixe de démonstration, proposé à l'écran de saisie. À laisser vide en production. */
  readonly VITE_CODE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
