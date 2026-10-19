import type { Prestataire } from "../data/catalogue";
import type { PrestataireApi } from "./api";

/** Une recherche : ce qui est envoyé à l'API, à côté du titre affiché. */
export type Filtre = {
  q?: string;
  categorie?: string;
  departement?: string;
  tri?: "pertinence" | "note" | "avis" | "distance" | "reponse";
};

/** « Bouaké » → « bouake », comme les slugs du backend. */
export function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Note à la française : 4,8 */
export function noteFr(note: number): string {
  return note.toFixed(1).replace(".", ",");
}

/**
 * Convertit un prestataire de l'API vers la carte utilisée par les écrans
 * (résultats, carte, messagerie), qui manipulent des libellés prêts à afficher.
 */
export function versPrestataire(p: PrestataireApi): Prestataire {
  return {
    id: p.id,
    ini: p.initiales,
    nom: p.nom,
    metier: p.metier,
    note: noteFr(p.note),
    avis: p.nombre_avis,
    prix: p.prix.affichage ?? "Sur devis",
    delai: p.delai_reponse.affichage ?? "",
    quartier: p.quartier?.nom ?? "",
    dist: p.distance_km !== undefined ? `${String(p.distance_km).replace(".", ",")} km` : "",
    desc: p.description ?? "",
    verifie: p.verifie ?? false,
  };
}
