import type { Compte } from "../state/types";

/* Ce que le compte connecté peut ouvrir : les permissions viennent de l'API (rôles et
   permissions, config/acces.php). L'application n'affiche que le permis ; l'API vérifie
   de toute façon chaque requête. */

export function peut(compte: Compte | null | undefined, permission: string): boolean {
  return !!compte?.permissions?.includes(permission);
}
