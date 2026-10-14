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
};

export const VILLES = ["Yamoussoukro", "Abidjan", "Bouaké", "Daloa"];

export const POPULAIRES: ReadonlyArray<readonly [string, string]> = [
  ["Mécanicien", "wrench"],
  ["Réparation climatisation", "snowflake"],
  ["Panneaux solaires", "sun"],
  ["Plomberie", "droplets"],
  ["Électricité", "zap"],
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

export const CATS = ["Plomberie", "Électricité", "Climatisation", "Menuiserie"];
export const DELAIS = ["Aujourd'hui", "Demain", "Cette semaine"];

export const QUICKIES = ["Plombier", "Mécanicien", "Cyber", "Point Wave", "Maquis"];

export const URGENCES = [
  { nom: "Sapeurs-pompiers", num: "180", icon: "flame" },
  { nom: "Police / Gendarmerie", num: "170", icon: "shield" },
  { nom: "SAMU / Clinique", num: "185", icon: "ambulance" },
  { nom: "Pharmacie de garde", num: "3 ouvertes ce soir", icon: "pill" },
];

export const DEPANNAGE = [
  { ini: "EN", nom: "Électricien de nuit", info: "Kokrenou · 2,4 km · répond en 5 min" },
  { ini: "RM", nom: "Remorquage auto 24/24", info: "Centre-ville · 1,1 km · répond en 12 min" },
  { ini: "SD", nom: "Serrurier dépannage", info: "Habitat · 1,8 km · répond en 20 min" },
];

/** Une recherche relève du BTP : elle déclenche le bloc d'accompagnement construction. */
export const REGEX_BTP =
  /construction|maçon|plombier|électricien|carreleur|peintre|menuisier|vitrier|quincaill|cimenter|architecte|maison|bâtiment/i;
