import { useEffect, useSyncExternalStore } from "react";
import type { DemandeClient } from "../../data/client";
import type { Ton } from "../../data/pro";
import { api, type DemandeApi, type StatutDemande } from "../../lib/api";

/* État partagé des écrans clients : les demandes du compte, lues dans l'API, et la demande
   dont on affiche le suivi. Une action (annuler, confirmer) recharge la liste. */

type EtatClient = {
  demandes: DemandeClient[];
  /** Compte pour lequel la liste a été chargée (un autre compte la recharge). */
  pour: string | null;
  chargement: boolean;
  erreur: boolean;
  notificationsLues: boolean;
  /** Demande ouverte dans l'écran de suivi. */
  suivie: number | null;
};

let etat: EtatClient = { demandes: [], pour: null, chargement: false, erreur: false, notificationsLues: false, suivie: null };
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

/** Présentation de chaque statut : groupe des filtres, couleur du badge, prochaine action. */
const PRESENTATION: Record<StatutDemande, { groupe: string; ton: Ton; prochaine: string }> = {
  envoyee: { groupe: "En attente", ton: "neutral", prochaine: "Attendre la réponse du technicien" },
  acceptee: { groupe: "Réponses reçues", ton: "info", prochaine: "Le technicien vient au créneau convenu" },
  en_cours: { groupe: "Rendez-vous", ton: "info", prochaine: "Intervention en cours" },
  terminee: { groupe: "Rendez-vous", ton: "warning", prochaine: "Confirmer la fin de prestation" },
  confirmee: { groupe: "Terminées", ton: "success", prochaine: "Laisser un avis" },
  refusee: { groupe: "Annulées", ton: "danger", prochaine: "Choisir un autre technicien" },
  annulee: { groupe: "Annulées", ton: "neutral", prochaine: "Rechercher un autre technicien" },
};

export const francs = (montant: number | null) => (montant === null ? "—" : `${montant.toLocaleString("fr-FR").replace(/ | /g, " ")} F`);

export function versDemandeClient(d: DemandeApi): DemandeClient {
  const p = PRESENTATION[d.statut] ?? PRESENTATION.envoyee;
  return {
    id: d.id,
    ref: d.reference,
    prestataire: d.prestataire?.nom ?? "Technicien à confirmer",
    initiales: d.prestataire?.initiales ?? "TC",
    portee: [d.secteur.nom, d.quartier?.nom].filter(Boolean).join(" · "),
    statut: d.statut_libelle,
    groupe: p.groupe,
    ton: p.ton,
    date: new Date(d.cree_le).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
    estimation: francs(d.estimation),
    prochaine: p.prochaine,
  };
}

/** Recharge les demandes du compte depuis l'API. */
export async function chargerDemandes(pour: string) {
  modifierClient({ chargement: true, erreur: false, pour });
  try {
    const liste = await api.mesDemandes();
    modifierClient({ demandes: liste.map(versDemandeClient), chargement: false });
  } catch {
    modifierClient({ chargement: false, erreur: true });
  }
}

/** Les demandes du compte connecté, chargées une fois par compte. */
export function useDemandesClient(compte: string | null) {
  const e = useEtatClient();
  useEffect(() => {
    if (!compte) {
      if (etat.pour) modifierClient({ demandes: [], pour: null });
      return;
    }
    if (etat.pour !== compte && !etat.chargement) chargerDemandes(compte);
  }, [compte]);
  return e;
}
