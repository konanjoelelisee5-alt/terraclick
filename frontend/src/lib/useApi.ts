import { useEffect, useState } from "react";
import { messageErreur } from "./api";

export type Chargement<T> = { donnees?: T; erreur?: string; chargement: boolean };

/**
 * Charge une donnée de l'API et la recharge quand une dépendance change. La requête
 * précédente est annulée, pour qu'une réponse lente n'écrase pas une plus récente.
 */
export function useApi<T>(charger: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]): Chargement<T> {
  const [etat, setEtat] = useState<Chargement<T>>({ chargement: true });

  useEffect(() => {
    const controle = new AbortController();
    setEtat((e) => ({ donnees: e.donnees, chargement: true }));
    charger(controle.signal)
      .then((donnees) => setEtat({ donnees, chargement: false }))
      .catch((e) => {
        if (!controle.signal.aborted) setEtat({ erreur: messageErreur(e), chargement: false });
      });
    return () => controle.abort();
    // Les dépendances sont celles de l'appelant, comme pour useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return etat;
}
