import { useSyncExternalStore } from "react";
import { DEMANDES, REALISATIONS, type Demande, type Realisation } from "../../data/pro";

/* État partagé entre les écrans de l'espace prestataire, le temps de la session :
   une photo ajoutée dans « Mes réalisations » apparaît aussi dans « Mon profil »,
   une réponse envoyée change le statut de la demande. Rien n'est encore enregistré. */

type EtatPro = {
  realisations: Realisation[];
  demandes: Demande[];
  notificationsLues: boolean;
};

let etat: EtatPro = { realisations: REALISATIONS, demandes: DEMANDES, notificationsLues: false };
const abonnes = new Set<() => void>();

export function modifierPro(patch: Partial<EtatPro> | ((e: EtatPro) => Partial<EtatPro>)) {
  etat = { ...etat, ...(typeof patch === "function" ? patch(etat) : patch) };
  abonnes.forEach((f) => f());
}

export function useEtatPro(): EtatPro {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => etat,
  );
}
