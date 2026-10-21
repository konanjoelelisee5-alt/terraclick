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
   *  - « riche »  : la même chose, plus problèmes fréquents, « Comment ça marche » et l'appel aux techniciens ;
   *  - « fil »    : disposition d'une page d'accueil de navigateur (screens/home/AccueilFil.tsx) :
   *                 nom TerraClick au centre, grande barre de recherche, raccourcis des secteurs
   *                 récents, puis le fil d'actualité de la plateforme.
   */
  accueilMobile: "fil" as "epuree" | "riche" | "fil",
  /**
   * Boutons « Urgence » et « Programmer » sous l'en-tête de l'accueil mobile. Masqués pour
   * le moment (voir le README) ; `true` les rebranche.
   */
  actionsAccueilMobile: false as boolean,
  /**
   * Résultats de recherche sur téléphone : « moteur » (screens/ResultatsMobile.tsx) les met en
   * page comme un moteur de recherche (onglets, conseil, résultats en liste) ; « cartes » rebranche
   * les cartes de prestataires d'avant (voir le README).
   */
  resultatsMobile: "moteur" as "moteur" | "cartes",
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
  /**
   * Vérification du numéro par code (SMS ou WhatsApp) à l'inscription. Désactivée : le compte
   * est créé directement, sans envoi ni frais. `true` la rebranche, avec
   * OTP_VERIFICATION_INSCRIPTION=true côté API (voir le README).
   */
  verificationTelephone: false as boolean,
  /**
   * Profil sur téléphone : `false` n'y garde que la carte d'identité, les tuiles, « Paramètres
   * du compte » et la déconnexion ; la carte « Devenir prestataire » et les lignes Moyens de
   * paiement, Aide & support, Parrainer un ami, Adresses enregistrées et Mentions légales sont
   * masquées (voir le README). `true` les rebranche.
   */
  profilComplet: false as boolean,
  /**
   * Fiche du technicien sur téléphone : « profil » (screens/FicheMobile.tsx) la présente comme un
   * profil centré (photo ronde, bouton pour quitter en haut à droite, actions Contacter et
   * Demander en icônes dans le bloc des tarifs) ; « page » rebranche la page d'avant avec sa
   * barre d'actions fixe en bas.
   */
  ficheMobile: "profil" as "profil" | "page",
  /**
   * Bouton rond au centre de la barre du bas (téléphone), entre Favoris et Messages : il ouvre
   * « Mes onglets » (relations conclues). La ligne de la barre plonge en arrondi sous lui.
   * `false` revient à la barre simple.
   */
  ongletCentral: true as boolean,
  /**
   * Après « Confirmer ma demande » / « Valider la commande » :
   * - « envol » : le parcours s'arrête là. Une fenêtre « Demande envoyée » se plie en avion en
   *   papier qui vole jusqu'au bouton « Mes onglets », où la demande se suit désormais ;
   * - « ecran » : l'ancien écran « Demande envoyée » (facture, « Suivre ma demande », « Accueil »).
   */
  envoiDemande: "envol" as "envol" | "ecran",
} as const;
