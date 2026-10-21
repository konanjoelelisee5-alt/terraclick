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
 * Les six secteurs ouverts dans la première version (MVP). Les autres métiers sont
 * masqués, pas supprimés : le README en tient la liste, et l'API applique la même
 * règle (backend/config/mvp.php). `categorie` est le slug de l'annuaire.
 *
 * `image` : photo du secteur (public/images/secteurs/, WebP 800 px). Les six secteurs ont
 * leur photo ; sans image, l'icône prendrait le relais.
 */
export type Secteur = {
  /** Clé partagée avec l'API (config/secteurs.php). */
  cle: string;
  nom: string;
  metier: string;
  icone: string;
  categorie: string;
  image?: string;
};

const PHOTOS = `${import.meta.env.BASE_URL}images/secteurs/`;

export const SECTEURS: readonly Secteur[] = [
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
