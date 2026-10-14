import { useState } from "react";
import { api, ErreurApi, jeton, messageErreur, type Utilisateur } from "./api";

export type Canal = "sms" | "whatsapp";

/**
 * Logique commune aux pages Connexion et Inscription : envoi du code, vérification,
 * et messages à afficher. Pas de mot de passe : le numéro prouvé par le code suffit.
 */
export function useCodeConnexion() {
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  /** Information non bloquante, par exemple le passage de WhatsApp au SMS. */
  const [info, setInfo] = useState<string | null>(null);
  /** Canal par lequel le dernier code est réellement parti. */
  const [canalEnvoye, setCanalEnvoye] = useState<Canal>("sms");

  /** Exécute un appel en gérant l'attente ; renvoie `null` si l'appel a échoué. */
  async function appeler<T>(action: () => Promise<T>, champ?: string): Promise<T | null> {
    if (occupe) return null;
    setOccupe(true);
    setErreur(null);
    try {
      return await action();
    } catch (e) {
      setErreur(e instanceof ErreurApi && champ ? e.pour(champ) : messageErreur(e));
      return null;
    } finally {
      setOccupe(false);
    }
  }

  /** Envoie un code ; vrai si l'envoi a réussi. */
  const envoyerCode = async (telephone: string, canal: Canal): Promise<boolean> => {
    if (telephone.replace(/\D/g, "").length < 8) {
      setErreur("Saisissez les 10 chiffres de votre numéro.");
      return false;
    }
    const envoi = await appeler(() => api.demanderCode(telephone, canal), "telephone");
    if (!envoi) return false;
    setCanalEnvoye(envoi.canal);
    setInfo(envoi.repli ? "WhatsApp n'a pas pu être joint : votre code vous a été envoyé par SMS." : null);
    return true;
  };

  /** Vérifie le code et ouvre la session ; renvoie le compte, ou `null` en cas d'échec. */
  const verifierCode = async (telephone: string, code: string): Promise<Utilisateur | null> => {
    if (code.replace(/\D/g, "").length < 6) {
      setErreur("Le code comporte 6 chiffres.");
      return null;
    }
    const reponse = await appeler(() => api.verifierCode(telephone, code), "code");
    if (!reponse) return null;
    jeton.ecrire(reponse.token);
    return reponse.utilisateur;
  };

  return { occupe, erreur, setErreur, info, canalEnvoye, appeler, envoyerCode, verifierCode };
}
