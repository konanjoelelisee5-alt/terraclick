/* Contenu statique de l'interface. L'annuaire lui-même (départements, catégories,
   quartiers, prestataires) est servi par l'API ; PROS ne nourrit plus que les écrans
   encore fictifs (messagerie, projets). */

export type Prestataire = {
  /** Identifiant dans l'API ; absent pour les exemples statiques ci-dessous. */
  id?: number;
  ini: string;
  nom: string;
  metier: string;
  note: string;
  avis: number;
  prix: string;
  delai: string;
  quartier: string;
  dist: string;
  desc: string;
  /** Toutes les pièces justificatives ont été contrôlées. */
  verifie?: boolean;
  /** Prestation recherchée (« Réparation de tuyau cassé ») : `prix` est alors son prix. */
  prestation?: string;
};

export const VILLES = ["Yamoussoukro", "Abidjan", "Bouaké", "Daloa"];

/**
 * Les secteurs ouverts aux clients. L'administrateur les gère depuis son tableau de bord
 * (création, activation, ordre, icône, couleur) : la liste ci-dessous n'est que celle du
 * premier affichage, remplacée au démarrage par celle de l'API (GET /api/secteurs), puis
 * gardée sur l'appareil pour la visite suivante. `categorie` est le slug de l'annuaire.
 *
 * `image` : photo du secteur (public/images/secteurs/, WebP 800 px). Les six secteurs ont
 * leur photo ; sans image, l'icône prendrait le relais.
 */
export type Secteur = {
  /** Clé partagée avec l'API (table `secteurs`). */
  cle: string;
  nom: string;
  metier: string;
  icone: string;
  categorie: string;
  image?: string;
  /** Couleur choisie par l'administrateur (#RRGGBB), pour un secteur sans photo. */
  couleur?: string | null;
  description?: string | null;
};

const PHOTOS = `${import.meta.env.BASE_URL}images/secteurs/`;

export const SECTEURS: Secteur[] = [
  { cle: "plomberie", nom: "Plomberie", metier: "Plombier", icone: "droplets", categorie: "plombiers", image: `${PHOTOS}plomberie.webp` },
  { cle: "electricite", nom: "Électricité", metier: "Électricien", icone: "zap", categorie: "electriciens", image: `${PHOTOS}electricite.webp` },
  {
    cle: "climatisation",
    nom: "Climatisation",
    metier: "Climaticien",
    icone: "snowflake",
    categorie: "climatisation-vente-et-reparation",
    image: `${PHOTOS}climatisation.webp`,
  },
  { cle: "serrurerie", nom: "Serrurerie", metier: "Serrurier", icone: "key-round", categorie: "serruriers", image: `${PHOTOS}serrurerie.webp` },
  { cle: "menuiserie", nom: "Menuiserie", metier: "Menuisier", icone: "hammer", categorie: "menuisiers", image: `${PHOTOS}menuiserie.webp` },
  { cle: "pressing", nom: "Pressing", metier: "Pressing", icone: "shirt", categorie: "pressing", image: `${PHOTOS}pressing.webp` },
];

export const PROS: Prestataire[] = [
  {
    ini: "KT",
    nom: "Koffi Tanoh",
    metier: "Plombier",
    note: "4,8",
    avis: 63,
    prix: "5 000 – 15 000 F",
    delai: "10 min",
    quartier: "Habitat",
    dist: "1,2 km",
    desc: "Fuites, chauffe-eau, installation sanitaire. Déplacement dans tout Yakro.",
  },
  {
    ini: "AD",
    nom: "Ali Diomandé",
    metier: "Plombier · Carreleur",
    note: "4,5",
    avis: 21,
    prix: "8 000 – 20 000 F",
    delai: "1 h",
    quartier: "Assabou",
    dist: "3,0 km",
    desc: "Salle de bain complète, carrelage et raccordement. Travail garanti 6 mois.",
  },
  {
    ini: "GB",
    nom: "Garage Bamba",
    metier: "Mécanicien auto",
    note: "4,6",
    avis: 148,
    prix: "10 000 – 60 000 F",
    delai: "30 min",
    quartier: "Kokrenou",
    dist: "2,0 km",
    desc: "Diagnostic, vidange, embrayage. Spécialiste Toyota et Hyundai.",
  },
  {
    ini: "EY",
    nom: "Élec Yakro",
    metier: "Électricien",
    note: "4,9",
    avis: 37,
    prix: "6 000 – 25 000 F",
    delai: "20 min",
    quartier: "Millionnaire",
    dist: "2,6 km",
    desc: "Installation, tableau, dépannage de nuit. Devis sur place gratuit.",
  },
  {
    ini: "SM",
    nom: "Solar Mamadou",
    metier: "Panneaux solaires",
    note: "4,7",
    avis: 52,
    prix: "À partir de 150 000 F",
    delai: "2 h",
    quartier: "Dioulakro",
    dist: "4,1 km",
    desc: "Kits solaires maison et boutique, onduleurs, batteries. Pose et suivi.",
  },
];

export const CATS = SECTEURS.map((s) => s.nom);

/** Photos des secteurs d'origine ; un secteur créé plus tard s'affiche avec son icône et sa couleur. */
const PHOTOS_SECTEURS: Record<string, string> = Object.fromEntries(SECTEURS.map((s) => [s.cle, s.image ?? ""]));

export type SecteurApi = { cle: string; nom: string; metier?: string; description?: string | null; icone?: string; couleur?: string | null; categorie?: string; problemes: string[] };

const CLE_SECTEURS = "terraclick.secteurs";

/**
 * Remplace la liste des secteurs par celle de l'API (ordre, noms, icônes, activation).
 * Rend vrai si quelque chose a changé, pour que l'application se redessine.
 */
export function appliquerSecteurs(liste: SecteurApi[], memoriser = true): boolean {
  const neufs: Secteur[] = liste
    .filter((s) => s.categorie)
    .map((s) => ({
      cle: s.cle,
      nom: s.nom,
      metier: s.metier ?? s.nom,
      icone: s.icone ?? "wrench",
      categorie: s.categorie!,
      image: PHOTOS_SECTEURS[s.cle] || undefined,
      couleur: s.couleur ?? null,
      description: s.description ?? null,
    }));
  const forme = (l: Secteur[]) =>
    JSON.stringify(l.map((s) => [s.cle, s.nom, s.metier, s.icone, s.categorie, s.image ?? null, s.couleur ?? null, s.description ?? null]));
  if (!neufs.length || forme(neufs) === forme(SECTEURS)) return false;
  SECTEURS.splice(0, SECTEURS.length, ...neufs);
  CATS.splice(0, CATS.length, ...neufs.map((s) => s.nom));
  if (memoriser) {
    try {
      localStorage.setItem(CLE_SECTEURS, JSON.stringify(liste));
    } catch {
      /* stockage indisponible : la liste sera relue à la prochaine visite */
    }
  }
  return true;
}

// La liste de la visite précédente, tant que l'API n'a pas répondu.
try {
  const gardee = localStorage.getItem(CLE_SECTEURS);
  if (gardee) appliquerSecteurs(JSON.parse(gardee), false);
} catch {
  /* rien de gardé */
}

export const secteurParCle = (cle: string | null) => SECTEURS.find((s) => s.cle === cle);

/* ---- Parcours de demande : textes de la confirmation (à valider côté produit) ---- */

export const PAIEMENTS = [
  { valeur: "especes" as const, libelle: "Espèces", detail: "Réglées au technicien, à la fin de l'intervention." },
  {
    valeur: "mobile_money" as const,
    libelle: "Mobile Money",
    detail: "Wave, Orange Money ou MTN, directement au technicien.",
  },
];

/** Pressing : un troisième choix, le moyen que le pressing accepte (carte, virement…). */
export const PAIEMENT_AUTRE = { valeur: "autre" as const, libelle: "Autre moyen", detail: "Carte, virement… à convenir avec le pressing." };

export const FRAIS_DEPLACEMENT =
  "Le technicien vous annonce ses éventuels frais de déplacement avant de venir. Rien n'est dû sans votre accord.";

export const POLITIQUE_ANNULATION =
  "Annulation gratuite tant que le technicien n'est pas en route. Prévenez-le au plus tôt s'il s'est déjà déplacé.";

/* Commande au pressing : les mêmes informations, dans les mots du pressing. */
export const POLITIQUE_ANNULATION_PRESSING = "Annulation gratuite tant que l'agent du pressing n'est pas parti chercher votre linge.";
export const POLITIQUE_ANNULATION_DEPOT = "Annulation gratuite tant que vous n'avez pas déposé votre linge.";
export const APRES_ENVOI_PRESSING = "Le pressing confirme votre commande. Vous la suivez ensuite dans « Mes commandes », étape par étape, et la cloche vous prévient.";
/** Détail des moyens de paiement pour une commande au pressing (ceux de l'API parlent du prestataire). */
export const PAIEMENTS_PRESSING: Partial<Record<string, string>> = {
  especes: "Réglées au pressing, à la remise de votre linge.",
  mobile_money: "Wave, Orange Money ou MTN, directement au pressing.",
};

export const APRES_ENVOI = "Votre demande sera envoyée. Vous recevrez une réponse dans environ 10 minutes.";
export const DELAIS = ["Aujourd'hui", "Demain", "Cette semaine"];

export const URGENCES = [
  { nom: "Sapeurs-pompiers", num: "180", icon: "flame" },
  { nom: "Police / Gendarmerie", num: "170", icon: "shield" },
  { nom: "SAMU / Clinique", num: "185", icon: "ambulance" },
  { nom: "Pharmacie de garde", num: "3 ouvertes ce soir", icon: "pill" },
];

export const DEPANNAGE = [
  { ini: "EN", nom: "Électricien de nuit", info: "Kokrenou · 2,4 km · répond en 5 min" },
  { ini: "PU", nom: "Plombier d'urgence", info: "Habitat · 1,2 km · répond en 10 min" },
  { ini: "SD", nom: "Serrurier dépannage", info: "Centre-ville · 1,1 km · répond en 15 min" },
];

/**
 * Une recherche relève du BTP : elle déclenche le bloc d'accompagnement construction
 * (seulement si CONFIG.moduleConstruction).
 */
export const REGEX_BTP =
  /construction|maçon|plombier|électricien|carreleur|peintre|menuisier|vitrier|quincaill|cimenter|architecte|maison|bâtiment/i;
