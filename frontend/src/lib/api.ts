/* Client de l'API Laravel (backend/). Les types reprennent les ressources JSON
   de backend/app/Http/Resources ; les noms de champs restent ceux de l'API. */

import type { SecteurApi } from "../data/catalogue";

const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const CLE_JETON = "sy.jeton";

/* ---------- Types renvoyés par l'API ---------- */

export type Position = { lat: number; lng: number };

export type Quartier = { id: number; nom: string; slug: string; ville?: string };

export type Ville = { id: number; nom: string; slug: string; position: Position | null; quartiers: Quartier[] };

export type Categorie = { id: number; nom: string; slug: string };

export type Departement = {
  id: number;
  nom: string;
  slug: string;
  icone: string;
  apercu: string | null;
  nombre_prestataires: number;
  rubriques: { id: number; nom: string; slug: string; categories: Categorie[] }[];
};

export type PrestataireApi = {
  id: number;
  nom: string;
  initiales: string;
  metier: string;
  description: string | null;
  note: number;
  nombre_avis: number;
  prix: { min: number | null; max: number | null; affichage: string | null };
  delai_reponse: { minutes: number | null; affichage: string | null };
  quartier?: Quartier | null;
  position: Position | null;
  distance_km?: number;
  categories?: string[];
  verifie?: boolean;
  accepte_suivi: boolean;
  en_vedette: boolean;
};

export type AvisApi = {
  id: number;
  auteur: { nom: string; initiales: string };
  notes: { ponctualite: number; qualite: number; prix: number };
  note: number;
  commentaire: string | null;
  date: string;
  date_affichage: string;
};

export type FicheApi = PrestataireApi & {
  zone_intervention: string | null;
  experience: { depuis: number; annees: number } | null;
  joignable_par_telephone: boolean;
  /** Visible par tous : un visiteur peut appeler un technicien. */
  telephone: string | null;
  prestations: string[];
  tarifs: { libelle: string; montant: number | null; a_partir_de?: boolean; affichage: string | null }[];
  horaires: { jours: string; ouverture: string | null; fermeture: string | null }[];
  garanties: string[];
  documents: { type: string; libelle: string; statut: "en_attente" | "verifie" | "refuse" }[];
  realisations: { id: number; legende: string; image: string | null }[];
  avis_recents: AvisApi[];
};

export type Utilisateur = {
  id: number;
  telephone: string;
  telephone_affichage: string;
  nom: string | null;
  email: string | null;
  /** Photo de profil (data URL), ou null. */
  photo: string | null;
  ville: { id: number; nom: string } | null;
  quartier: Quartier | null;
  profil_complet: boolean;
  /** Faux pour un compte créé par code seul : il se donne un mot de passe par « Mot de passe oublié ». */
  a_mot_de_passe: boolean;
  /** Ancien champ : vrai si le compte ouvre l'espace administrateur. */
  est_admin: boolean;
  /** Rôles (client, prestataire, manager, admin) et permissions du compte (config/acces.php côté API). */
  roles: string[];
  permissions: string[];
};

/** Ce que demande « Devenir prestataire », selon le type (GET /api/candidature/exigences). */
export type ExigencesCandidature = {
  types: { cle: TypePrestataire; nom: string; detail: string; icone: string }[];
  documents: Record<TypePrestataire, { cle: string; nom: string; obligatoire: boolean; aide: string | null }[]>;
  secteurs: { cle: string; nom: string }[];
  services_pressing: { cle: string; nom: string }[];
  paiements: { cle: string; nom: string }[];
};

export type TypePrestataire = "artisan" | "entreprise" | "pressing";

/** Une candidature « Devenir prestataire » et son statut. */
export type CandidatureApi = {
  id: number;
  reference: string;
  type: { cle: TypePrestataire; nom: string };
  statut: "en_attente" | "validee" | "refusee";
  statut_libelle: string;
  nom_activite: string;
  responsable: string;
  telephone: string;
  secteurs: { cle: string; nom: string }[];
  quartier: Quartier | null;
  quartiers: string[];
  description: string;
  experience_annees: number | null;
  horaires: string | null;
  prix: string | null;
  paiements: string[];
  details: Record<string, unknown>;
  /** `url` : seulement pour l'équipe, lue avec le jeton (disque privé). */
  documents: { type: string; libelle: string; mime: string; url: string | null }[];
  motif_refus: string | null;
  prestataire_id: number | null;
  traite_le: string | null;
  cree_le: string;
};

/* ---------- Espace administrateur ---------- */

export type ApercuAdmin = {
  a_traiter: { candidatures: number; signalements: number; demandes_sans_reponse: number };
  chiffres: { utilisateurs: number; prestataires_actifs: number; demandes_30j: number; commandes_pressing_30j: number; depannages_accomplis_30j: number; avis_30j: number };
  demandes_par_secteur: { cle: string; nom: string; nombre: number }[];
  periode: { depuis: string; jusqu_au: string };
};

export type SignalementAdmin = {
  id: number;
  motif: string;
  motif_libelle: string;
  message: string | null;
  statut: "ouvert" | "traite";
  reponse: string | null;
  client: { nom: string | null; telephone: string | null };
  demande: { id: number; reference: string; secteur: string; statut_libelle: string } | null;
  prestataire: { nom: string; telephone: string | null } | null;
  date: string;
  traite_le: string | null;
};

export type DemandeAdmin = DemandeApi & { client: { nom: string | null; telephone: string | null } };

export type PrestataireAdmin = {
  id: number;
  nom: string;
  metier: string;
  quartier: string | null;
  telephone: string | null;
  note: number;
  nombre_avis: number;
  demandes: number;
  verifie: boolean;
  actif: boolean;
  en_vedette: boolean;
  compte: { nom: string | null; telephone: string } | null;
};

export type UtilisateurAdmin = {
  id: number;
  nom: string | null;
  telephone: string;
  email: string | null;
  quartier: string | null;
  demandes: number;
  prestataire: string | null;
  roles: { cle: string; nom: string }[];
  inscrit_le: string;
};

/** La matrice « Rôles et permissions » (GET /api/admin/roles). */
export type RolesAdmin = {
  roles: { id: number; cle: string; nom: string; description: string | null; utilisateurs: number; modifiable: boolean; equipe: boolean; permissions: string[] }[];
  groupes: { nom: string; permissions: { cle: string; nom: string }[] }[];
};

/** Secteur d'activité vu par l'équipe : affichage, activation, ordre, sous-services et chiffres. */
export type SousService = { id: number; nom: string; description: string | null; actif: boolean; prix_min: number | null; prix_max: number | null; prix_affichage: string | null; prestataires: number };
export type SecteurAdmin = {
  id: number;
  cle: string;
  nom: string;
  metier: string | null;
  description: string | null;
  icone: string;
  couleur: string | null;
  actif: boolean;
  ordre: number;
  categories: string[];
  problemes: string[];
  mots: string[];
  chiffres: { demandes: number; reussies: number; montant_reussies: number; prestataires: number };
  prestations: SousService[];
};
export type SecteursAdmin = {
  secteurs: SecteurAdmin[];
  icones: string[];
  couleurs: { hex: string; nom: string }[];
  categories: { slug: string; nom: string; rubrique: string }[];
};
export type SecteurSaisie = Partial<Pick<SecteurAdmin, "nom" | "metier" | "description" | "icone" | "couleur" | "actif" | "categories" | "problemes" | "mots">>;

export type PrestationAdmin = {
  id: number;
  secteur: { cle: string; nom: string };
  nom: string;
  prix_min: number | null;
  prix_max: number | null;
  prix_affichage: string | null;
  unite: string | null;
  prestataires: number;
};

export type ActiviteAdmin = { id: string; type: "demande" | "candidature" | "signalement"; titre: string; texte: string; date: string };

/** Session ouverte par l'API : le jeton à garder et le compte. */
export type Session = { token: string; utilisateur: Utilisateur };

/** Un onglet : relation aboutie avec un technicien, confirmée par le client (GET /api/accords). */
export type AccordApi = {
  id: number;
  reference: string;
  objet: string;
  recherche: string | null;
  canal: "appel" | "whatsapp" | "message" | "demande";
  canal_libelle: string;
  montant: number | null;
  montant_affichage: string | null;
  date_intervention: string | null;
  statut: "conclu" | "termine" | "annule";
  statut_libelle: string;
  prestation: { slug: string; nom: string; secteur: string } | null;
  prestataire: { id: number; nom: string; initiales: string; metier: string; telephone: string | null; quartier: string | null; categorie: string | null };
  demande_reference: string | null;
  /** Commande pressing : tout son détail, son suivi et ses signalements. */
  demande: DemandeApi | null;
  /** Le client a déjà noté ce prestataire (un avis par prestataire). */
  deja_note: boolean;
  etapes: { libelle: string; date: string }[];
  /** Terminé et confirmé par le client : rangé dans l'historique, plus dans les onglets. */
  accompli: boolean;
  termine_le: string | null;
  cree_le: string;
};

/** Une recherche de l'historique (POST /api/recherches, GET /api/moi/recherches). */
export type RechercheApi = {
  id: number;
  texte: string;
  categorie: string | null;
  secteur: string | null;
  ville: string | null;
  appareil_id: string | null;
  appareil: string | null;
  date: string;
};

/** Élément du fil d'actualité de l'accueil (GET /api/actualites). */
export type ActualiteApi = {
  id: string;
  type: "nouveau" | "avis" | "realisation";
  titre: string;
  texte: string | null;
  note: number | null;
  date: string;
  /** « 8 h », « 3 j » : prêt à afficher. */
  date_relative: string;
  prestataire: { id: number; nom: string; metier: string; initiales: string; quartier: string | null; categorie: string | null };
};

export type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } };

/** Un service ouvert, de quoi le dessiner, et ses problèmes types (première question de l'assistant). */
export type { SecteurApi } from "../data/catalogue";

/** Ce que la barre de recherche a compris d'une saisie libre. */
export type Analyse = { secteurs: { cle: string; nom: string }[]; probleme: string | null };

export type DemandeApi = {
  id: number;
  reference: string;
  secteur: { cle: string; nom: string };
  probleme: string;
  precision: string | null;
  quartier: Quartier | null;
  repere: string | null;
  quand: "maintenant" | "aujourdhui" | "demain" | "date";
  date_souhaitee: string | null;
  /** « Plomberie · Fuite d'eau · Habitat · Maintenant » */
  resume: string;
  mode: "recommande" | "choisi";
  prestataire: PrestataireApi | null;
  paiement: Paiement;
  paiement_libelle: string;
  photos: string[];
  /** Pack pressing : articles, pièces et total estimé (prix indicatifs du catalogue). */
  pack: { articles: { cle: string; nom: string; quantite: number; prix_unitaire: number; total: number }[]; pieces: number; total: number; total_affichage: string } | null;
  /** Commande pressing : service, dépôt, créneau, adresse, suivi et signalements. */
  commande: CommandePressing | null;
  /** Suivi d'une intervention (hors pressing : celui-ci est dans `commande`). */
  suivi: { cle: string; libelle: string; fait: boolean; date: string | null }[] | null;
  /** Problèmes signalés (présents sur le détail et dans les onglets). */
  signalements?: { id: number; motif: string; motif_libelle: string; message: string | null; statut: string; date: string }[];
  /** Ce que le client peut signaler : motifs du pressing ou d'une intervention. */
  motifs_signalement: { cle: string; nom: string }[];
  /** L'onglet de la demande (présent à la création et sur le détail). */
  accord_id?: number | null;
  statut: StatutDemande;
  /** « Envoyée », « Marquée terminée »… */
  statut_libelle: string;
  /** Réponse du technicien quand il accepte. */
  estimation: number | null;
  creneau: string | null;
  /** Journal de suivi (présent sur le détail d'une demande). */
  evenements?: { statut: string; libelle: string; auteur: "client" | "technicien" | "systeme"; message: string | null; date: string }[];
  cree_le: string;
};

export type Paiement = "especes" | "mobile_money" | "autre";

export type CommandePressing = {
  service: { cle: string; nom: string } | null;
  express: boolean;
  depot: { cle: "collecte" | "pressing"; nom: string } | null;
  heure: string | null;
  adresse: string | null;
  etape: string | null;
  etape_libelle: string | null;
  /** Prochaine étape, pour le bouton du pressing. */
  etape_suivante: { cle: string; libelle: string } | null;
  suivi: { cle: string; libelle: string; fait: boolean; date: string | null }[];
  signalements?: { id: number; motif: string; motif_libelle: string; message: string | null; statut: string; date: string }[];
};

/** Réglages de la commande pressing (GET /api/pressing/options). */
export type OptionsPressing = {
  services: { cle: string; nom: string; detail: string; coef: number }[];
  express: { nom: string; detail: string; majoration: number };
  depots: { cle: "collecte" | "pressing"; nom: string; detail: string }[];
  heures: string[];
  motifs: { cle: string; nom: string }[];
};

/** Adresse enregistrée du client. */
export type AdresseApi = { id: number; type: "domicile" | "bureau" | "autre"; nom: string; quartier: { id: number; nom: string | null }; repere: string | null };

/** Notification de la cloche : ce qu'un prestataire a fait sur une demande ou une commande. */
export type NotificationApi = {
  id: number;
  statut: string;
  titre: string;
  texte: string;
  pressing: boolean;
  demande_id: number;
  accord_id: number | null;
  date: string;
};

/** Demande reçue par le prestataire connecté (GET /api/pro/demandes). */
export type DemandeProApi = DemandeApi & { client: { nom: string; telephone: string | null } };

/** Article du pack pressing et son prix indicatif par pièce. */
export type ArticlePressing = { cle: string; nom: string; prix: number; prix_affichage: string; categorie: string; categorie_nom: string };

export type StatutDemande = "envoyee" | "acceptee" | "refusee" | "en_cours" | "terminee" | "confirmee" | "annulee";

/** Résultats de recherche, avec les secteurs que le serveur a reconnus dans la demande. */
/** Une prestation du catalogue et son prix (indicatif, ou celui du technicien). */
export type PrestationApi = { slug: string; nom: string; prix: { min: number | null; max: number | null; affichage: string | null } };

export type Resultats = Page<PrestataireApi & { prestation?: PrestationApi | null }> & {
  analyse?: {
    secteurs: string[];
    /** Secteur en jeu (recherche, prestation ou catégorie choisie). */
    secteur?: { cle: string; nom: string; categorie: string } | null;
    /** Prestation reconnue dans la recherche (« tuyau cassé ») ou choisie en onglet. */
    prestation?: PrestationApi | null;
    /** Faute de frappe corrigée : les résultats portent sur `corrigee`. */
    correction?: { originale: string; corrigee: string } | null;
    /** Prestations du secteur en jeu, proposées en onglets. */
    prestations?: PrestationApi[];
  };
};

export type CriteresRecherche = {
  q?: string;
  exact?: boolean;
  categorie?: string;
  /** Slug d'une prestation : techniciens qui la proposent, avec leur prix pour elle. */
  prestation?: string;
  departement?: string;
  ville?: string;
  quartier?: number;
  lat?: number;
  lng?: number;
  rayon_km?: number;
  tri?: "pertinence" | "note" | "avis" | "distance" | "reponse";
  par_page?: number;
};

/* ---------- Erreurs ---------- */

export class ErreurApi extends Error {
  constructor(
    message: string,
    public statut: number,
    /** Erreurs de validation par champ, telles que Laravel les renvoie. */
    public champs: Record<string, string[]> = {},
  ) {
    super(message);
  }

  /** Premier message d'un champ, sinon le message général. */
  pour(champ: string): string {
    return this.champs[champ]?.[0] ?? this.message;
  }
}

export function messageErreur(e: unknown): string {
  return e instanceof ErreurApi ? e.message : "Une erreur inattendue est survenue.";
}

/* ---------- Jeton de session ---------- */

// Le stockage peut être indisponible (navigation privée) : l'application fonctionne
// alors sans mémoriser la session.
export const jeton = {
  lire(): string | null {
    try {
      return localStorage.getItem(CLE_JETON);
    } catch {
      return null;
    }
  },
  ecrire(valeur: string) {
    try {
      localStorage.setItem(CLE_JETON, valeur);
    } catch {
      /* session limitée à l'onglet */
    }
  },
  effacer() {
    try {
      localStorage.removeItem(CLE_JETON);
    } catch {
      /* rien à effacer */
    }
  },
};

/* ---------- Requêtes ---------- */

type Options = { methode?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; corps?: unknown; signal?: AbortSignal };

async function requete<T>(chemin: string, { methode = "GET", corps, signal }: Options = {}): Promise<T> {
  const entetes: Record<string, string> = { Accept: "application/json" };
  // Un FormData (photos jointes) fixe lui-même son type multipart et sa frontière.
  const multipart = corps instanceof FormData;
  if (corps !== undefined && !multipart) entetes["Content-Type"] = "application/json";
  const j = jeton.lire();
  if (j) entetes.Authorization = `Bearer ${j}`;

  let reponse: Response;
  try {
    reponse = await fetch(BASE + chemin, {
      method: methode,
      headers: entetes,
      body: corps === undefined ? undefined : multipart ? corps : JSON.stringify(corps),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ErreurApi("Impossible de joindre TerraClick. Vérifiez votre connexion.", 0);
  }

  const contenu = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    // Jeton expiré ou révoqué : on l'oublie, la prochaine action redemandera un code.
    if (reponse.status === 401) jeton.effacer();
    const message =
      contenu?.message && reponse.status < 500 ? contenu.message : "Le service est momentanément indisponible.";
    throw new ErreurApi(message, reponse.status, contenu?.errors ?? {});
  }

  return contenu as T;
}

function parametres(criteres: Record<string, string | number | boolean | null | undefined>): string {
  const p = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(criteres)) {
    // Laravel lit 1 / 0 comme booléens, pas « true » / « false ».
    if (valeur !== undefined && valeur !== null && valeur !== "") p.set(cle, typeof valeur === "boolean" ? (valeur ? "1" : "0") : String(valeur));
  }
  const texte = p.toString();
  return texte ? `?${texte}` : "";
}

/* Les référentiels changent rarement : une seule requête par session. */
const memoire = new Map<string, Promise<unknown>>();
function memoriser<T>(cle: string, charger: () => Promise<T>): Promise<T> {
  if (!memoire.has(cle)) {
    memoire.set(
      cle,
      charger().catch((e) => {
        memoire.delete(cle);
        throw e;
      }),
    );
  }
  return memoire.get(cle) as Promise<T>;
}

export const api = {
  /* Annuaire */
  villes: () => memoriser("villes", () => requete<{ data: Ville[] }>("/villes").then((r) => r.data)),
  departements: () =>
    memoriser("departements", () => requete<{ data: Departement[] }>("/departements").then((r) => r.data)),
  rechercher: (criteres: CriteresRecherche, signal?: AbortSignal) =>
    requete<Resultats>(`/prestataires${parametres(criteres)}`, { signal }),
  vedettes: (signal?: AbortSignal) =>
    requete<{ data: PrestataireApi[] }>("/prestataires/vedettes", { signal }).then((r) => r.data),
  /** « onglets » : en cours ; « historique » : dépannages terminés et confirmés par le client. */
  accords: (etat: "onglets" | "historique", signal?: AbortSignal) =>
    requete<{ data: AccordApi[] }>(`/accords?etat=${etat}`, { signal }).then((r) => r.data),
  accord: (id: number, signal?: AbortSignal) => requete<{ data: AccordApi }>(`/accords/${id}`, { signal }).then((r) => r.data),
  creerAccord: (accord: {
    prestataire_id: number;
    canal: AccordApi["canal"];
    prestation?: string | null;
    objet?: string | null;
    recherche?: string | null;
    montant?: number | null;
    date_intervention?: string | null;
  }) => requete<{ data: AccordApi }>("/accords", { methode: "POST", corps: accord }).then((r) => r.data),
  terminerAccord: (id: number) => requete<{ data: AccordApi }>(`/accords/${id}/terminer`, { methode: "POST" }).then((r) => r.data),
  enregistrerRecherche: (recherche: { texte: string; categorie?: string | null; ville?: string | null; appareil_id: string; appareil: string }) =>
    requete<{ data: RechercheApi }>("/recherches", { methode: "POST", corps: recherche }).then((r) => r.data),
  mesRecherches: (signal?: AbortSignal) => requete<{ data: RechercheApi[] }>("/moi/recherches", { signal }).then((r) => r.data),
  effacerRecherches: () => requete<{ message: string }>("/moi/recherches", { methode: "DELETE" }),
  actualites: (page: number, signal?: AbortSignal) =>
    requete<{ data: ActualiteApi[]; meta: { page: number; suivante: number | null } }>(`/actualites?page=${page}`, { signal }),
  fiche: (id: number, signal?: AbortSignal) =>
    requete<{ data: FicheApi }>(`/prestataires/${id}`, { signal }).then((r) => r.data),
  /* Assistant de besoin et demandes */
  secteurs: () => memoriser("secteurs", () => requete<{ data: SecteurApi[] }>("/secteurs").then((r) => r.data)),
  analyser: (q: string) => requete<Analyse>(`/analyse?${new URLSearchParams({ q })}`),
  recommandations: (criteres: { secteur: string; quartier?: number | null; exclure?: number[] }, signal?: AbortSignal) => {
    const p = new URLSearchParams({ secteur: criteres.secteur });
    if (criteres.quartier) p.set("quartier", String(criteres.quartier));
    criteres.exclure?.forEach((id) => p.append("exclure[]", String(id)));
    return requete<{ data: PrestataireApi[] }>(`/recommandations?${p}`, { signal }).then((r) => r.data);
  },
  creerDemande: (formulaire: FormData) =>
    requete<{ data: DemandeApi; message: string }>("/demandes", { methode: "POST", corps: formulaire }),
  articlesPressing: () =>
    requete<{ data: ArticlePressing[] }>("/pressing/articles").then((r) => r.data),
  optionsPressing: () => memoriser("options-pressing", () => requete<{ data: OptionsPressing }>("/pressing/options").then((r) => r.data)),
  adresses: (signal?: AbortSignal) => requete<{ data: AdresseApi[] }>("/moi/adresses", { signal }).then((r) => r.data),
  ajouterAdresse: (adresse: { type: AdresseApi["type"]; nom?: string; quartier_id: number; repere?: string }) =>
    requete<{ data: AdresseApi }>("/moi/adresses", { methode: "POST", corps: adresse }).then((r) => r.data),
  supprimerAdresse: (id: number) => requete<null>(`/moi/adresses/${id}`, { methode: "DELETE" }),
  signaler: (id: number, signalement: { motif: string; message?: string }) =>
    requete<{ data: DemandeApi }>(`/demandes/${id}/signalements`, { methode: "POST", corps: signalement }).then((r) => r.data),
  notifications: (signal?: AbortSignal) => requete<{ data: NotificationApi[] }>("/notifications", { signal }).then((r) => r.data),
  /* « Devenir prestataire » */
  exigencesCandidature: () => memoriser("exigences-candidature", () => requete<{ data: ExigencesCandidature }>("/candidature/exigences").then((r) => r.data)),
  maCandidature: (signal?: AbortSignal) => requete<{ data: CandidatureApi | null }>("/moi/candidature", { signal }).then((r) => r.data),
  envoyerCandidature: (formulaire: FormData) =>
    requete<{ data: CandidatureApi; message: string }>("/moi/candidature", { methode: "POST", corps: formulaire }).then((r) => r.data),
  /* Équipe TerraClick : vérification des candidatures */
  candidatures: (statut: CandidatureApi["statut"], signal?: AbortSignal) =>
    requete<Page<CandidatureApi>>(`/admin/candidatures?statut=${statut}`, { signal }).then((r) => r.data),
  validerCandidature: (id: number) => requete<{ data: CandidatureApi }>(`/admin/candidatures/${id}/valider`, { methode: "POST" }).then((r) => r.data),
  refuserCandidature: (id: number, motif: string) =>
    requete<{ data: CandidatureApi }>(`/admin/candidatures/${id}/refuser`, { methode: "POST", corps: { motif } }).then((r) => r.data),
  /** Pièce jointe d'une candidature : lue avec le jeton, rendue en adresse locale (blob). */
  pieceCandidature: async (url: string): Promise<string> => {
    const j = jeton.lire();
    const reponse = await fetch(url.replace(/^https?:\/\/[^/]+\/api/, BASE), { headers: j ? { Authorization: `Bearer ${j}` } : {} });
    if (!reponse.ok) throw new ErreurApi("La pièce n'a pas pu être ouverte.", reponse.status);
    return URL.createObjectURL(await reponse.blob());
  },
  /* Espace administrateur */
  admin: {
    apercu: (signal?: AbortSignal) => requete<{ data: ApercuAdmin }>("/admin/apercu", { signal }).then((r) => r.data),
    signalements: (statut: SignalementAdmin["statut"], signal?: AbortSignal) =>
      requete<{ data: SignalementAdmin[] }>(`/admin/signalements?statut=${statut}`, { signal }).then((r) => r.data),
    traiterSignalement: (id: number, reponse: string) =>
      requete<{ data: SignalementAdmin }>(`/admin/signalements/${id}/traiter`, { methode: "POST", corps: { reponse } }).then((r) => r.data),
    demandes: (filtres: { statut?: string; secteur?: string; q?: string; page?: number }, signal?: AbortSignal) =>
      requete<{ data: DemandeAdmin[]; meta: { page: number; derniere: number; total: number } }>(`/admin/demandes${parametres(filtres)}`, { signal }),
    demande: (id: number, signal?: AbortSignal) => requete<{ data: DemandeAdmin }>(`/admin/demandes/${id}`, { signal }).then((r) => r.data),
    prestataires: (filtres: { q?: string; etat?: "actifs" | "suspendus" }, signal?: AbortSignal) =>
      requete<{ data: PrestataireAdmin[] }>(`/admin/prestataires${parametres(filtres)}`, { signal }).then((r) => r.data),
    modifierPrestataire: (id: number, patch: { actif?: boolean; en_vedette?: boolean }) =>
      requete<{ data: PrestataireAdmin }>(`/admin/prestataires/${id}`, { methode: "PATCH", corps: patch }).then((r) => r.data),
    utilisateurs: (q: string, signal?: AbortSignal) => requete<{ data: UtilisateurAdmin[] }>(`/admin/utilisateurs${parametres({ q })}`, { signal }).then((r) => r.data),
    modifierUtilisateur: (id: number, roles: string[]) =>
      requete<{ data: UtilisateurAdmin }>(`/admin/utilisateurs/${id}`, { methode: "PATCH", corps: { roles } }).then((r) => r.data),
    roles: (signal?: AbortSignal) => requete<{ data: RolesAdmin }>("/admin/roles", { signal }).then((r) => r.data),
    modifierRole: (id: number, permissions: string[]) =>
      requete<{ data: { id: number; cle: string; permissions: string[] } }>(`/admin/roles/${id}`, { methode: "PUT", corps: { permissions } }).then((r) => r.data),
    prestations: (signal?: AbortSignal) => requete<{ data: PrestationAdmin[] }>("/admin/prestations", { signal }).then((r) => r.data),
    modifierPrestation: (id: number, prix: { prix_min: number | null; prix_max: number | null }) =>
      requete<{ data: Pick<PrestationAdmin, "id" | "prix_min" | "prix_max" | "prix_affichage"> }>(`/admin/prestations/${id}`, { methode: "PATCH", corps: prix }).then((r) => r.data),
    activite: (signal?: AbortSignal) => requete<{ data: ActiviteAdmin[] }>("/admin/activite", { signal }).then((r) => r.data),
    secteurs: (signal?: AbortSignal) => requete<{ data: SecteursAdmin }>("/admin/secteurs", { signal }).then((r) => r.data),
    creerSecteur: (saisie: SecteurSaisie) => requete<{ data: SecteurAdmin }>("/admin/secteurs", { methode: "POST", corps: saisie }).then((r) => r.data),
    modifierSecteur: (id: number, saisie: SecteurSaisie) => requete<{ data: SecteurAdmin }>(`/admin/secteurs/${id}`, { methode: "PATCH", corps: saisie }).then((r) => r.data),
    ordonnerSecteurs: (ordre: number[]) => requete<{ data: number[] }>("/admin/secteurs/ordre", { methode: "PUT", corps: { ordre } }).then((r) => r.data),
    ajouterSousService: (secteur: number, saisie: { nom: string; prix_min?: number | null; prix_max?: number | null }) =>
      requete<{ data: SousService }>(`/admin/secteurs/${secteur}/prestations`, { methode: "POST", corps: saisie }).then((r) => r.data),
    modifierSousService: (id: number, saisie: { nom?: string; actif?: boolean }) =>
      requete<{ data: SousService }>(`/admin/sous-services/${id}`, { methode: "PATCH", corps: saisie }).then((r) => r.data),
  },
  /* Espace prestataire : demandes et commandes reçues */
  demandesRecues: (signal?: AbortSignal) => requete<Page<DemandeProApi>>("/pro/demandes", { signal }).then((r) => r.data),
  agirSurDemande: (id: number, action: "accepter" | "refuser" | "demarrer" | "terminer" | "etape", corps?: Record<string, unknown>) =>
    requete<{ data: DemandeProApi }>(`/pro/demandes/${id}/${action}`, { methode: "POST", corps: corps ?? {} }).then((r) => r.data),
  mesDemandes: (signal?: AbortSignal) => requete<Page<DemandeApi>>("/demandes?par_page=100", { signal }).then((r) => r.data),
  demande: (id: number, signal?: AbortSignal) => requete<{ data: DemandeApi }>(`/demandes/${id}`, { signal }).then((r) => r.data),
  annulerDemande: (id: number, motif: string | null) =>
    requete<{ data: DemandeApi }>(`/demandes/${id}/annuler`, { methode: "POST", corps: { motif } }).then((r) => r.data),
  confirmerDemande: (id: number) => requete<{ data: DemandeApi }>(`/demandes/${id}/confirmer`, { methode: "POST" }).then((r) => r.data),

  publierAvis: (id: number, avis: { ponctualite: number; qualite: number; prix: number; commentaire?: string }) =>
    requete<{ data: AvisApi }>(`/prestataires/${id}/avis`, { methode: "POST", corps: avis }).then((r) => r.data),

  /* Compte */
  demanderCode: (telephone: string, canal: "sms" | "whatsapp") =>
    requete<{
      message: string;
      /** Canal réellement utilisé : SMS si WhatsApp n'a pas pu être joint. */
      canal: "sms" | "whatsapp";
      repli: boolean;
      expire_dans_secondes: number;
    }>("/auth/code", {
      methode: "POST",
      corps: { telephone, canal },
    }),
  verifierCode: (telephone: string, code: string) =>
    requete<{ token: string; nouveau_compte: boolean; utilisateur: Utilisateur }>("/auth/verifier", {
      methode: "POST",
      corps: { telephone, code, appareil: navigator.userAgent.slice(0, 100) },
    }),
  inscrire: (compte: {
    telephone: string;
    /** Seulement si la vérification du numéro est activée. */
    code?: string;
    nom: string;
    email: string | null;
    ville_id: number | null;
    quartier_id: number | null;
    mot_de_passe: string;
    mot_de_passe_confirmation: string;
  }) =>
    requete<Session>("/auth/inscription", {
      methode: "POST",
      corps: { ...compte, appareil: navigator.userAgent.slice(0, 100) },
    }),
  connecter: (telephone: string, mot_de_passe: string) =>
    requete<Session>("/auth/connexion", {
      methode: "POST",
      corps: { telephone, mot_de_passe, appareil: navigator.userAgent.slice(0, 100) },
    }),
  reinitialiserMotDePasse: (telephone: string, code: string, mot_de_passe: string, mot_de_passe_confirmation: string) =>
    requete<Session>("/auth/mot-de-passe", {
      methode: "POST",
      corps: { telephone, code, mot_de_passe, mot_de_passe_confirmation, appareil: navigator.userAgent.slice(0, 100) },
    }),
  moi: () => requete<{ data: Utilisateur }>("/moi").then((r) => r.data),
  modifierProfil: (profil: {
    nom?: string;
    email?: string | null;
    ville_id?: number | null;
    quartier_id?: number | null;
  }) =>
    requete<{ data: Utilisateur }>("/moi", { methode: "PATCH", corps: profil }).then((r) => r.data),
  modifierPhoto: (photo: string) =>
    requete<{ data: Utilisateur }>("/moi/photo", { methode: "PUT", corps: { photo } }).then((r) => r.data),
  supprimerPhoto: () => requete<{ data: Utilisateur }>("/moi/photo", { methode: "DELETE" }).then((r) => r.data),
  deconnexion: () => requete<{ message: string }>("/auth/deconnexion", { methode: "POST" }),
};
