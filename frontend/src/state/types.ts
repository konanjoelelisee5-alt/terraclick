import type { Prestataire } from "../data/catalogue";
import type { Sujet } from "../data/projet";
import type { CleCanal } from "../data/compte";
import type { Filtre } from "../lib/annuaire";

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
  /* Espace prestataire */
  | "proDashboard"
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

export type Compte = { prenom: string; tel: string; quartier: string };

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
>;
