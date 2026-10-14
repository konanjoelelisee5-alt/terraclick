import { useSyncExternalStore } from "react";
import { DEMANDES_CLIENT, type DemandeClient } from "../../data/client";

/* État partagé des écrans clients, le temps de la session : une demande envoyée
   apparaît dans « Mes demandes », une fin de prestation confirmée change le statut. */

type EtatClient = { demandes: DemandeClient[]; notificationsLues: boolean };

let etat: EtatClient = { demandes: DEMANDES_CLIENT, notificationsLues: false };
const abonnes = new Set<() => void>();

export function modifierClient(patch: Partial<EtatClient> | ((e: EtatClient) => Partial<EtatClient>)) {
  etat = { ...etat, ...(typeof patch === "function" ? patch(etat) : patch) };
  abonnes.forEach((f) => f());
}

export function useEtatClient(): EtatClient {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => etat,
  );
}
