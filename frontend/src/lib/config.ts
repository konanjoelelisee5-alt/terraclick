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
  /**
   * Module Construction : page Construction & travaux, assistant de projet, « Mes projets »,
   * suivi avancé avec séquestre, contrat et PV de réserves. Masqué dans le MVP (voir le
   * README) ; les écrans restent dans le code, `true` les rebranche partout.
   */
  moduleConstruction: false as boolean,
  /**
   * Modes de l'accueil : la bascule Recherche / Autour de moi / Box intelligente sous la
   * barre de recherche, et l'onglet « Carte » de la barre mobile. Masqués dans le MVP
   * (voir le README) ; `true` les rebranche.
   */
  modesAccueil: false as boolean,
  /**
   * Bascule Liste / Carte des résultats de recherche. Masquée dans le MVP : les résultats
   * s'affichent toujours en liste (voir le README) ; `true` la rebranche.
   */
  carteResultats: false as boolean,
  /**
   * Accueil sur téléphone (screens/home/AccueilMobile.tsx) :
   *  - « epuree » : accroche, recherche, deux actions, services, prestataires à la une, confiance ;
   *  - « riche »  : la même chose, plus problèmes fréquents, « Comment ça marche » et l'appel aux techniciens.
   */
  accueilMobile: "epuree" as "epuree" | "riche",
  /**
   * Boutons « Urgence » et « Programmer » sous l'en-tête de l'accueil mobile. Masqués pour
   * le moment (voir le README) ; `true` les rebranche.
   */
  actionsAccueilMobile: false as boolean,
  /**
   * À l'ouverture, sans session mémorisée sur l'appareil : la page de connexion d'abord
   * (la flèche retour mène à l'accueil en visiteur). Avec une session, l'accueil directement.
   */
  connexionAuDemarrage: true as boolean,
  /**
   * Comptes avec mot de passe : inscription (nom, téléphone, e-mail, mot de passe, numéro
   * vérifié par code), connexion par numéro et mot de passe, « Mot de passe oublié » par code.
   * `false` rebranche la connexion par code seul, sans mot de passe (voir le README).
   */
  motDePasse: true as boolean,
} as const;
