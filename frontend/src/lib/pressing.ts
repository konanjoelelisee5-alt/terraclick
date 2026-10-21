import { useEffect, useState } from "react";
import { api, type ArticlePressing, type NotificationApi, type OptionsPressing } from "./api";
import type { Besoin } from "../state/types";

/* Commande au pressing, côté application : calcul du prix (le même que l'API, qui reste
   seule juge du total enregistré) et notifications de la cloche. */

/** Prix d'une pièce : prix de base × coefficient du service, majoré en express, arrondi à 25 F (Demande::prixPressing). */
export function prixPressing(base: number, options: OptionsPressing | null | undefined, service: string, express: boolean): number {
  const coef = (options?.services.find((s) => s.cle === service)?.coef ?? 100) / 100;
  const majoration = express ? 1 + (options?.express.majoration ?? 0) / 100 : 1;
  return Math.round((base * coef * majoration) / 25) * 25;
}

export type LigneFacture = { cle: string; nom: string; quantite: number; prix_unitaire: number; total: number };

/** Lignes du pack en cours, aux prix du service choisi. */
export function lignesPack(b: Besoin, articles?: ArticlePressing[] | null, options?: OptionsPressing | null): LigneFacture[] {
  return b.pack.flatMap((a) => {
    const article = articles?.find((x) => x.cle === a.cle);
    if (!article) return [];
    const prix = prixPressing(article.prix, options, b.service, b.express);
    return [{ cle: a.cle, nom: article.nom, quantite: a.quantite, prix_unitaire: prix, total: prix * a.quantite }];
  });
}

/** « 10:00 » → « 10 h » */
export const heureLisible = (h: string) => h.replace(":00", " h").replace(":", " h ");

/** Créneau lisible : « mardi 22 octobre à 10 h ». */
export function creneauLisible(date: string | null, heure: string | null): string | null {
  if (!date) return null;
  const jour = new Date(`${date}T12:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return heure ? `${jour} à ${heureLisible(heure)}` : jour;
}

/* ---------- Cloche : notifications et non lues ---------- */

const CLE_VUES = "tc.notifications-vues";

function derniereVue(): number {
  try {
    return Number(localStorage.getItem(CLE_VUES)) || 0;
  } catch {
    return 0;
  }
}

/** Marque toutes les notifications comme lues sur cet appareil. */
export function marquerNotificationsLues(liste: NotificationApi[]) {
  const max = Math.max(0, ...liste.map((n) => n.id));
  try {
    localStorage.setItem(CLE_VUES, String(Math.max(max, derniereVue())));
  } catch {
    /* stockage indisponible : elles resteront marquées non lues */
  }
  window.dispatchEvent(new Event("tc-notifications"));
}

export const estNonLue = (n: NotificationApi, vue = derniereVue()) => n.id > vue;

/** Notifications du compte connecté (rechargées quand on les marque lues). */
export function useNotifications(connecte: boolean) {
  const [liste, setListe] = useState<NotificationApi[] | null>(null);
  const [vue, setVue] = useState(derniereVue);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!connecte) {
      setListe(null);
      return;
    }
    const arret = new AbortController();
    api.notifications(arret.signal).then(setListe, (e) => e?.name !== "AbortError" && setErreur(true));
    return () => arret.abort();
  }, [connecte]);

  useEffect(() => {
    const maj = () => setVue(derniereVue());
    window.addEventListener("tc-notifications", maj);
    return () => window.removeEventListener("tc-notifications", maj);
  }, []);

  return { liste, erreur, vue, nonLues: (liste ?? []).filter((n) => estNonLue(n, vue)).length };
}
