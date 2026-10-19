import { useSyncExternalStore } from "react";

/** Même seuil que app.css : sous 1080 px, la barre d'onglets remplace la navigation d'en-tête. */
const REQUETE = "(max-width: 1079px)";

/** Vrai sur téléphone et tablette, mis à jour quand la fenêtre change de taille. */
export function useEstMobile(): boolean {
  return useSyncExternalStore(
    (rappel) => {
      const mq = window.matchMedia(REQUETE);
      mq.addEventListener("change", rappel);
      return () => mq.removeEventListener("change", rappel);
    },
    () => window.matchMedia(REQUETE).matches,
    () => false,
  );
}
