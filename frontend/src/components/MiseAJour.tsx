import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/* Mises à jour de l'application installée. À chaque ouverture (et à chaque retour au premier
   plan), on demande au navigateur s'il existe une nouvelle version. Si oui, elle se télécharge
   en arrière-plan, puis un bandeau propose « Mettre à jour » : un toucher, et l'application se
   recharge dans sa nouvelle version. Aucune réinstallation, même icône. */

let nouvelleVersion: ServiceWorker | null = null;
const signaler = (sw: ServiceWorker) => {
  nouvelleVersion = sw;
  window.dispatchEvent(new Event("tc-mise-a-jour"));
};

/** Enregistre le service worker et surveille les nouvelles versions (appelé par main.tsx). */
export function surveillerMisesAJour(urlServiceWorker: string) {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register(urlServiceWorker)
    .then((enregistrement) => {
      // Une version déjà téléchargée attend : on la propose tout de suite.
      if (enregistrement.waiting && navigator.serviceWorker.controller) signaler(enregistrement.waiting);

      enregistrement.addEventListener("updatefound", () => {
        const installation = enregistrement.installing;
        installation?.addEventListener("statechange", () => {
          // « installed » avec une version déjà active : c'est une mise à jour, pas la 1re installation.
          if (installation.state === "installed" && navigator.serviceWorker.controller) signaler(installation);
        });
      });

      // Vérification à chaque retour dans l'application (ouverte depuis l'icône ou l'onglet).
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") enregistrement.update().catch(() => {});
      });
    })
    .catch(() => {
      /* sans service worker, l'application fonctionne normalement, sans installation ni mise à jour */
    });

  // La nouvelle version a pris la main : on recharge une seule fois pour l'afficher.
  let recharge = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recharge) return;
    recharge = true;
    window.location.reload();
  });
}

export function BandeauMiseAJour() {
  const [disponible, setDisponible] = useState(!!nouvelleVersion);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    const surMiseAJour = () => setDisponible(true);
    window.addEventListener("tc-mise-a-jour", surMiseAJour);
    return () => window.removeEventListener("tc-mise-a-jour", surMiseAJour);
  }, []);

  if (!disponible) return null;

  const mettreAJour = () => {
    setEnCours(true);
    nouvelleVersion?.postMessage({ type: "PASSER_A_LA_NOUVELLE_VERSION" });
  };

  return (
    <div
      data-r="bandeau-mise-a-jour"
      role="status"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        // Au-dessus de la barre d'onglets sur téléphone, en bas de l'écran sur ordinateur.
        bottom: "calc(84px + env(safe-area-inset-bottom))",
        zIndex: 60,
        maxWidth: 520,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 12px 12px 16px",
        borderRadius: 16,
        background: "var(--color-text)",
        color: "#fff",
        boxShadow: "0 8px 24px rgba(26,22,19,.25)",
      }}
    >
      <Icon name="download" size={20} />
      <span style={{ flex: 1, minWidth: 0, fontSize: "14.5px", lineHeight: 1.35 }}>
        <strong style={{ display: "block" }}>Nouvelle version disponible</strong>
        Mettez TerraClick à jour en un toucher.
      </span>
      <button
        onClick={mettreAJour}
        disabled={enCours}
        className="sy-btn sy-btn--primary sy-btn--md"
        style={{ flex: "none", minHeight: 44, boxShadow: "none" }}
      >
        {enCours ? "Mise à jour…" : "Mettre à jour"}
      </button>
    </div>
  );
}
