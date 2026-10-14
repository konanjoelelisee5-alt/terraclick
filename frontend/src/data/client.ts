/* Espace client : données de démonstration reprises de la maquette servis-yakro-app,
   avec les prestataires de l'annuaire réel. Les demandes ne sont pas encore
   enregistrées par l'API ; le profil, lui, l'est. */

import type { Ton } from "./pro";

export type DemandeClient = {
  ref: string;
  prestataire: string;
  initiales: string;
  portee: string;
  statut: string;
  groupe: string;
  ton: Ton;
  date: string;
  estimation: string;
  prochaine: string;
};

export const FILTRES_DEMANDES_CLIENT = ["Toutes", "En attente", "Réponses reçues", "Rendez-vous", "Terminées", "Annulées"];

export const DEMANDES_CLIENT: DemandeClient[] = [
  { ref: "DEV-2026-00128", prestataire: "Koffi Tanoh", initiales: "KT", portee: "Plomberie · Habitat", statut: "Marquée terminée", groupe: "Rendez-vous", ton: "warning", date: "14 avril", estimation: "25 000 F", prochaine: "Confirmer la fin de prestation" },
  { ref: "DEV-2026-00124", prestataire: "Élec Yakro", initiales: "EY", portee: "Électricité · Millionnaire", statut: "Réponse reçue", groupe: "Réponses reçues", ton: "info", date: "12 avril", estimation: "18 000 F", prochaine: "Accepter ou refuser le créneau" },
  { ref: "DEV-2026-00121", prestataire: "ClimaCool CI", initiales: "CC", portee: "Climatisation · Habitat", statut: "Terminée", groupe: "Terminées", ton: "success", date: "8 avril", estimation: "12 000 F", prochaine: "Laisser un avis" },
  { ref: "DEV-2026-00119", prestataire: "Garage Bamba", initiales: "GB", portee: "Mécanique · Kokrenou", statut: "En attente", groupe: "En attente", ton: "neutral", date: "6 avril", estimation: "—", prochaine: "Attendre la réponse du prestataire" },
  { ref: "DEV-2026-00112", prestataire: "Ali Diomandé", initiales: "AD", portee: "Carrelage · Assabou", statut: "Annulée", groupe: "Annulées", ton: "neutral", date: "2 avril", estimation: "—", prochaine: "Rechercher un autre prestataire" },
];

/** Suivi détaillé de la demande DEV-2026-00128 (la seule détaillée en démonstration). */
export const SUIVI = {
  ref: "DEV-2026-00128",
  titre: "Fuite sous l'évier · Plomberie",
  prestataire: "Koffi Tanoh",
  reponse:
    "Je peux passer mardi matin. Le joint et le siphon sont à changer, l'estimation couvre la pièce et la main-d'œuvre.",
  estimation: "25 000 F",
  date: "mardi 14 avril",
  creneau: "09:00 – 11:00",
  etapes: [
    { libelle: "Demande envoyée", date: "lundi 13 avril, 08:12", fait: true },
    { libelle: "Vue par le prestataire", date: "lundi 13 avril, 08:40", fait: true },
    { libelle: "Réponse reçue", date: "lundi 13 avril, 09:05", fait: true },
    { libelle: "Rendez-vous accepté", date: "lundi 13 avril, 10:22", fait: true },
    { libelle: "Prestation marquée terminée", date: "mardi 14 avril, 11:10", fait: true },
    { libelle: "Fin de prestation confirmée", date: "en attente de votre confirmation", fait: false },
  ],
};

export const MOTIFS_SIGNALEMENT = [
  "Le travail n'est pas terminé",
  "Le prix demandé dépasse l'estimation",
  "Le prestataire ne s'est pas présenté",
  "Autre problème",
];

export const NOTIFICATIONS_CLIENT = [
  { icone: "clipboard-check", titre: "Prestation marquée terminée", texte: "Koffi Tanoh attend votre confirmation · DEV-2026-00128", date: "il y a 2 heures", nouveau: true, fond: "var(--kola-100)", encre: "var(--kola-700)" },
  { icone: "reply", titre: "Réponse reçue", texte: "Élec Yakro propose 18 000 F le vendredi 17 avril", date: "hier, 14:05", nouveau: false, fond: "var(--state-success-soft)", encre: "var(--lagune-700)" },
  { icone: "calendar-check", titre: "Rendez-vous confirmé", texte: "Mardi 14 avril, 09:00 – 11:00 · Habitat", date: "lundi 13 avril", nouveau: false, fond: "var(--state-success-soft)", encre: "var(--lagune-700)" },
  { icone: "star", titre: "Avis en attente", texte: "Notez ClimaCool CI · DEV-2026-00121", date: "8 avril", nouveau: false, fond: "var(--argile-100)", encre: "var(--argile-700)" },
];

export const PREFERENCES_NOTIFICATION = [
  { cle: "reponse", libelle: "Réponse d'un prestataire", actif: true },
  { cle: "rappel", libelle: "Rappel de rendez-vous", actif: true },
  { cle: "fin", libelle: "Demande de confirmation de fin de prestation", actif: true },
  { cle: "nouveautes", libelle: "Nouveautés Servis Yakro", actif: false },
];
