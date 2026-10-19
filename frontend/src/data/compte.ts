/* Espace client : conversations, demandes, favoris, équipements posés,
   abonnements d'entretien, reçus, et canaux de notification. */

export type CleCanal = "app" | "sms" | "wa" | "mail" | "push";

export const CANAUX: ReadonlyArray<readonly [CleCanal, string, string, string]> = [
  ["app", "Dans l'application", "bell", "Cloche et pastille sur l'écran"],
  ["sms", "SMS", "message-square", "Arrive sans internet"],
  ["wa", "WhatsApp", "message-circle", "Réponses des prestataires"],
  ["mail", "E-mail", "mail", "Reçus et récapitulatifs"],
  ["push", "Notification navigateur", "monitor", "Sur ordinateur, onglet fermé"],
];

export const NOTIFICATIONS = [
  {
    icon: "message-circle",
    titre: "Koffi Tanoh a répondu",
    texte: "« Je passe ce soir vers 17h, 12 000 F »",
    quand: "il y a 4 min",
    canal: "WhatsApp",
    neuf: true,
  },
  {
    icon: "file-text",
    titre: "3 offres reçues",
    texte: "Changement de serrure · à partir de 15 000 F",
    quand: "il y a 1 h",
    canal: "SMS",
    neuf: true,
  },
  {
    icon: "calendar-check",
    titre: "Rendez-vous confirmé",
    texte: "Élec Yakro passe jeudi à 10 h · Millionnaire",
    quand: "hier",
    canal: "Dans l'application",
    neuf: true,
  },
  {
    icon: "receipt",
    titre: "Reçu disponible",
    texte: "12 000 F réglés à Koffi Tanoh · fuite de douche",
    quand: "il y a 3 j",
    canal: "E-mail",
    neuf: false,
  },
];

export const CONVERSATIONS = [
  { ini: "KT", nom: "Koffi Tanoh", texte: "Je passe ce soir vers 17h, 12 000 F", quand: "4 min" },
  { ini: "MK", nom: "Menuiserie Konaté", texte: "Les deux portes sont prêtes, je pose samedi", quand: "hier" },
];

export const DEMANDES = [
  { titre: "Plomberie · fuite douche", info: "Habitat · aujourd'hui · 3 réponses", etat: "3 offres", ok: true },
  { titre: "Serrurerie · porte d'entrée", info: "Kokrenou · cette semaine · en attente", etat: "En attente", ok: false },
];

export const FAVORIS = [
  { ini: "KT", nom: "Koffi Tanoh", metier: "Plombier · Habitat" },
  { ini: "AD", nom: "Ali Diomandé", metier: "Électricien · Assabou" },
];

export const EQUIPEMENTS_POSES = [
  {
    nom: "Climatisation LG 12 000 BTU",
    info: "Salon · installée le 12 mars 2026",
    garantie: "Garantie jusqu'au 12 mars 2028",
    etat: "Sous garantie",
    prochain: "Entretien prévu en octobre",
  },
  {
    nom: "Serrure multipoint",
    info: "Porte d'entrée · posée le 4 janvier 2026",
    garantie: "Garantie jusqu'au 4 janvier 2028",
    etat: "Sous garantie",
    prochain: "Graissage conseillé en janvier",
  },
  {
    nom: "Chauffe-eau 100 L",
    info: "Salle de bain · installé le 20 août 2024",
    garantie: "Garantie expirée",
    etat: "Hors garantie",
    prochain: "Contrôle recommandé",
  },
];

export const ABONNEMENTS = [
  {
    nom: "Entretien climatisation",
    info: "Deux visites par an · Froid Services Yakro",
    prochain: "Mardi 13 octobre 2026",
    prix: "35 000 F par visite",
    actif: true,
  },
  {
    nom: "Contrôle de l'installation électrique",
    info: "Une visite par an · Élec Yakro",
    prochain: "Novembre 2026",
    prix: "20 000 F par visite",
    actif: true,
  },
  {
    nom: "Entretien plomberie",
    info: "Suspendu depuis juillet",
    prochain: "Aucune visite planifiée",
    prix: "10 000 F par passage",
    actif: false,
  },
];

export const RECUS = [
  { ref: "REC-2841", titre: "Changement de serrure · Serrurerie N'Guessan", montant: "18 000 F", date: "12 août 2026" },
  { ref: "REC-2790", titre: "Fuite douche · Koffi Tanoh", montant: "12 000 F", date: "3 août 2026" },
];

export const CRITERES_AVIS = [
  { cle: "ponct" as const, titre: "Ponctualité" },
  { cle: "qual" as const, titre: "Qualité du travail" },
  { cle: "prix" as const, titre: "Prix tenu" },
];
