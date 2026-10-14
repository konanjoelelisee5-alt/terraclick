import type { Variante } from "./theme";

/**
 * Réglages d'affichage arbitrés pendant la conception. Ils étaient exposés
 * comme réglages de maquette ; ici ils constituent la configuration par défaut
 * de l'application, à brancher plus tard sur une administration.
 */
export const CONFIG = {
  /** Habillage appliqué à l'ensemble de l'application. */
  variante: "Servis Yakro (officiel)" as Variante,
  /** Ville proposée avant tout choix de l'utilisateur. */
  villeParDefaut: "Yamoussoukro",
  /** Affiche la section « Prestataires à la une » sur l'accueil. */
  afficherVedettes: true,
  /** Vue ouverte par défaut sur les résultats de recherche. */
  vueResultats: "Liste" as "Liste" | "Carte",
} as const;
