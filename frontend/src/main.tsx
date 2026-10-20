import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/ds/index.css";
import "./styles/app.css";

const racine = document.getElementById("root");
if (!racine) throw new Error("Élément #root introuvable");

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Écran de démarrage (index.html) : il laisse la reconstitution du logo se terminer
// (1,3 s depuis le début de l'animation), puis s'efface en fondu, l'application étant prête.
// Si le code a mis plus longtemps à arriver, l'animation est déjà finie : il s'efface aussitôt.
const splash = document.getElementById("splash");
if (splash) {
  const DUREE_ANIMATION = 1300;
  const debut = (window as Window & { __tcSplashDebut?: number }).__tcSplashDebut ?? 0;
  const reste = Math.max(0, DUREE_ANIMATION - (performance.now() - debut));
  requestAnimationFrame(() => {
    window.setTimeout(() => {
      splash.classList.add("splash--fin");
      window.setTimeout(() => splash.remove(), 400);
    }, reste);
  });
}

// Application installable : le service worker n'est actif qu'en production, pour qu'en
// développement le rechargement à chaud ne soit jamais servi depuis un cache.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* sans service worker, l'application fonctionne normalement, simplement sans installation */
    });
  });
}
