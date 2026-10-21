import type { Prestataire } from "../data/catalogue";
import type { Sujet } from "../data/projet";
import type { CleCanal } from "../data/compte";
import type { Filtre } from "../lib/annuaire";
import type { DemandeApi, PrestataireApi } from "../lib/api";

export type Ecran =
  | "home"
  | "results"
  | "chat"
  | "devis"
  | "urgence"
  | "construction"
  | "assistant"
  | "publie"
  | "mesProjets"
  | "projMode"
  | "projQuest"
  | "projDash"
  | "projOffres"
  | "projSuivi"
  | "projLitige"
  | "contrat"
  | "fiche"
  | "compte"
  | "recu"
  | "avis"
  | "connexion"
  | "inscription"
  /* Parcours de demande : assistant, recommandations, confirmation, accusé d'envoi */
  | "besoin"
  | "recommandations"
  | "confirmation"
  | "demandeEnvoyee"
  | "favoris"
  /* Menu ⋮ de l'accueil mobile */
  | "onglets"
  | "accord"
  | "historique"
  | "ongletsRecents"
  | "telechargements"
  | "parametres"
  /* Espace client (dans le site public) */
  | "clientDashboard"
  | "clientDemandes"
  | "clientSuivi"
  | "clientDevis"
  | "clientNotifications"
  | "clientProfil"
  /* Espace prestataire */
  | "proDashboard"
  | "proConsignes"
  | "proDemandes"
  | "proDemande"
  | "proProfil"
  | "proRealisations"
  | "proVerification"
  | "proAbonnement"
  | "proMiseEnAvant"
  | "proAvis"
  | "proNotifications";

/** Les trois entrées de l'accueil. */
export type ModeAccueil = "recherche" | "carte" | "box";

export type EtapeAuth = "tel" | "code" | "profil";

export type Compte = { prenom: string; tel: string; quartier: string; photo: string | null };

export type Message = { moi: boolean; texte: string };

/** Réponses de l'assistant de création de projet (étapes 1 à 7). */
export type Formulaire = {
  type?: string;
  bien?: string;
  terrain?: string;
  delai?: string;
  finition?: string;
  accomp?: string;
  conducteur?: string;
  sansPlan?: string;
  apres?: string;
  equip: string[];
  entretien: string[];
};

export type Notes = { ponct: number; qual: number; prix: number };

export type Quand = "maintenant" | "aujourdhui" | "demain" | "date";

/**
 * Le besoin du client, rempli par l'assistant en 4 questions puis complété par le choix
 * du technicien et du paiement. Public jusqu'à « Confirmer ma demande ».
 */
export type Besoin = {
  /** Clé du secteur (« plomberie »), comme dans config/secteurs.php côté API. */
  secteur: string | null;
  /** Secteurs suggérés par une recherche ambiguë (« porte ») : l'assistant demande lequel. */
  suggestions: string[];
  probleme: string | null;
  /** Description libre, obligatoire avec « Autre ». */
  precision: string;
  quartier: number | null;
  repere: string;
  quand: Quand | null;
  /** AAAA-MM-JJ, avec quand = « date ». */
  date: string;
  photos: File[];
  mode: "recommande" | "choisi" | null;
  prestataire: PrestataireApi | null;
  paiement: "especes" | "mobile_money";
};

export type Etat = {
  screen: Ecran;

  /* Recherche et annuaire */
  /** Index dans VILLES ; `null` tant que l'utilisateur n'a pas choisi. */
  ville: number | null;
  query: string;
  titre: string;
  /** Critères envoyés à l'API pour la recherche affichée sous `titre`. */
  filtre: Filtre;
  /** Identifiant du quartier filtré ; 0 = tous les quartiers. */
  quartier: number;
  /** `null` = valeur de configuration ; sinon choix explicite liste/carte. */
  carte: boolean | null;
  deptsOpen: boolean;
  deptHover: number;
  modeAccueil: ModeAccueil;
  filtreCarte: number;
  boxDraft: string;

  /* Messagerie */
  active: Prestataire;
  messages: Message[];
  draft: string;

  /* Demande de devis en 3 étapes */
  step: number;
  cat: number;
  quand: number;

  /* Compte */
  auth: Compte | null;
  /** Écran ouvert après une connexion ou une inscription réussie. */
  apresConnexion: Ecran;
  authOpen: boolean;
  authStep: EtapeAuth;
  authCanal: "sms" | "whatsapp";
  telDraft: string;
  code: string;
  prenomDraft: string;
  quartierDraft: string;
  notifOpen: boolean;
  canaux: Record<CleCanal, boolean>;

  /* Avis */
  notes: Notes;
  avisTexte: string;

  /* Suivi avancé */
  sujet: Sujet;
  mode: "guide" | "cle";
  rep: number[];
  triOffres: number;
  filtreProjet: number;
  onglet: number;
  sousProp: number;

  /* Assistant de projet */
  assistStep: number;
  accepte: boolean;
  form: Formulaire;

  /* Contrat et signature */
  contratStep: number;
  signMoyen: number;
  /** Le parcours de signature porte sur le PV de réserves, pas sur le contrat. */
  sujetPv: boolean;
  signCode: string;
  signe: boolean;

  /* Fiche professionnelle */
  /** Identifiant du prestataire affiché ; `null` = fiche de démonstration du module projet. */
  fiche: number | null;

  /* Parcours de demande */
  besoin: Besoin;
  /** 0 = choix du service, 1 à 4 = les quatre questions, 5 = résumé et choix du mode. */
  besoinEtape: number;
  /** La demande que l'API vient d'enregistrer, pour l'accusé d'envoi. */
  demandeEnvoyee: DemandeApi | null;
};

/** Champs restaurés lors d'un retour navigateur. */
export type Navigation = Pick<
  Etat,
  | "screen"
  | "sujet"
  | "onglet"
  | "titre"
  | "filtre"
  | "quartier"
  | "carte"
  | "assistStep"
  | "contratStep"
  | "sujetPv"
  | "modeAccueil"
  | "fiche"
  | "besoinEtape"
>;
