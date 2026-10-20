import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// En développement et en prévisualisation, /api est relayé vers Laravel :
// le navigateur reste sur une seule origine, sans réglage CORS.
// API_URL permet de viser un autre port quand 8000 est déjà occupé.
const API = process.env.API_URL ?? "http://127.0.0.1:8000";

/**
 * Chaque construction donne au service worker un numéro de version unique (__VERSION__ dans
 * public/sw.js). Le navigateur voit ainsi un nouveau service worker à chaque mise en ligne,
 * et l'application peut proposer « Mettre à jour ».
 */
function versionServiceWorker(): Plugin {
  let sortie = "dist";
  return {
    name: "terraclick-version-sw",
    apply: "build",
    configResolved(config) {
      sortie = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const chemin = resolve(sortie, "sw.js");
      const version = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
      writeFileSync(chemin, readFileSync(chemin, "utf8").replace('"terraclick-__VERSION__"', `"terraclick-${version}"`));
    },
  };
}

export default defineConfig({
  plugins: [react(), versionServiceWorker()],
  server: { port: 5173, proxy: { "/api": API } },
  preview: { proxy: { "/api": API } },
});
