import { useEffect, useState } from "react";
import type { Compte } from "../state/types";
import { peut } from "./acces";
import { api, type TableauPro } from "./api";

/* Entrée de l'espace prestataire depuis l'espace client (profil sur téléphone, en-tête sur
   ordinateur) : le nom de sa fiche, s'il s'agit d'un pressing, et les demandes qui attendent sa
   réponse. Chargé une fois par compte, partagé entre les écrans. */

export type EspacePro = { nom: string; pressing: boolean; aTraiter: number };

let cache: { cle: string; promesse: Promise<EspacePro> } | null = null;

function charger(cle: string): Promise<EspacePro> {
  if (cache?.cle !== cle) {
    const promesse = api.tableauPro(0).then((t: TableauPro) => ({
      nom: t.fiche.nom,
      pressing: t.fiche.pressing,
      // « À traiter » : les demandes envoyées, encore sans réponse.
      aTraiter: t.suivi.filter((s) => s.statut === "envoyee").length,
    }));
    // Un échec ne reste pas en cache : la prochaine ouverture réessaie.
    promesse.catch(() => cache?.promesse === promesse && (cache = null));
    cache = { cle, promesse };
  }
  return cache.promesse;
}

/** `null` pour un compte qui n'est pas prestataire (ou tant que rien n'est chargé). */
export function useEspacePro(compte: Compte | null | undefined): EspacePro | null {
  const prestataire = peut(compte, "pro.demandes");
  const cle = prestataire && compte ? compte.tel : null;
  const [espace, setEspace] = useState<EspacePro | null>(null);

  useEffect(() => {
    if (!cle) {
      setEspace(null);
      return;
    }
    let actif = true;
    charger(cle).then((e) => actif && setEspace(e), () => actif && setEspace(null));
    return () => {
      actif = false;
    };
  }, [cle]);

  return espace;
}

/** « Mon espace pressing », « Mon espace pro ». */
export const libelleEspacePro = (e: EspacePro | null) => (e?.pressing ? "Mon espace pressing" : "Mon espace pro");
