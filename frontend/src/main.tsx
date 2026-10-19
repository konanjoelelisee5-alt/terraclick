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

// Application installable : le service worker n'est actif qu'en production, pour qu'en
// développement le rechargement à chaud ne soit jamais servi depuis un cache.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* sans service worker, l'application fonctionne normalement, simplement sans installation */
    });
  });
}
