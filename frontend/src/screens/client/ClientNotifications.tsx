import { useEffect } from "react";
import { useApp } from "../../state/app";
import { estNonLue, marquerNotificationsLues, useNotifications } from "../../lib/pressing";
import type { NotificationApi } from "../../lib/api";
import { Icon } from "../../components/Icon";
import { choisirOnglet } from "../menu/EcransMenu";
import { EspaceClient } from "./EspaceClient";

/* Cloche : ce que les prestataires ont fait sur les demandes et les commandes du client
   (commande confirmée, agent en route, linge prêt, livraison en cours…). Ouvrir l'écran les
   marque lues ; toucher une notification ouvre l'onglet de la commande, ou la demande. */

const ICONES: Record<string, [string, string, string]> = {
  acceptee: ["circle-check", "var(--state-success-soft)", "var(--state-success)"],
  refusee: ["x", "var(--state-danger-soft)", "var(--state-danger)"],
  agent_en_route: ["route", "var(--color-accent-100)", "var(--color-accent-700)"],
  prete: ["shirt", "var(--state-success-soft)", "var(--state-success)"],
  en_livraison: ["route", "var(--color-accent-100)", "var(--color-accent-700)"],
  livree: ["circle-check", "var(--state-success-soft)", "var(--state-success)"],
};

const quand = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(":", " h ");

export function ClientNotifications() {
  const { etat, go } = useApp();
  const { liste, erreur, vue } = useNotifications(!!etat.auth);

  // Ouvertes = lues ; le point « Nouveau » reste visible le temps de cette visite.
  useEffect(() => {
    if (liste?.length) marquerNotificationsLues(liste);
  }, [liste]);

  const ouvrir = (n: NotificationApi) => {
    if (n.accord_id) {
      choisirOnglet(n.accord_id);
      go("accord");
    } else go("clientDemandes");
  };

  return (
    <EspaceClient titre="Notifications" sousTitre="Réponses des prestataires et étapes de vos commandes.">
      <div data-r="notifications" style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 900 }}>
        {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>Les notifications n'ont pas pu être chargées.</p>}
        {liste?.length === 0 && (
          <div role="status" className="sy-card" style={{ padding: "32px 20px", textAlign: "center" }}>
            <Icon name="bell" size={40} strokeWidth={1.5} color="var(--color-neutral-700)" />
            <h2 style={{ margin: "8px 0 4px", fontSize: "18px" }}>Aucune notification pour l'instant</h2>
            <p style={{ margin: 0, fontSize: "14.5px", color: "var(--color-neutral-700)" }}>
              Quand un prestataire répond ou que votre commande avance, vous le verrez ici.
            </p>
          </div>
        )}
        {liste?.map((n) => {
          const nouveau = estNonLue(n, vue);
          const [icone, fond, encre] = ICONES[n.statut] ?? ["bell", "var(--color-neutral-200, #EFEAE4)", "var(--color-text)"];
          return (
            <button
              key={n.id}
              data-r="notification"
              onClick={() => ouvrir(n)}
              className="sy-card"
              style={{
                padding: "14px 16px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                textAlign: "left",
                font: "inherit",
                color: "inherit",
                cursor: "pointer",
                background: nouveau ? "var(--color-accent-100)" : undefined,
              }}
            >
              <span style={{ width: 40, height: 40, flex: "none", borderRadius: 12, background: fond, color: encre, display: "grid", placeItems: "center" }}>
                <Icon name={icone} size={19} />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700 }}>{n.titre}</span>
                  {nouveau && <span className="sy-badge sy-badge--brand">Nouveau</span>}
                </span>
                <span style={{ display: "block", fontSize: "14px", lineHeight: 1.5, color: "var(--color-neutral-700)", marginTop: 2 }}>{n.texte}</span>
                <span style={{ display: "block", fontSize: "12.5px", color: "var(--color-neutral-700)", marginTop: 4 }}>{quand(n.date)}</span>
              </span>
              <Icon name="chevron-right" size={18} color="var(--color-neutral-700)" />
            </button>
          );
        })}
      </div>
    </EspaceClient>
  );
}
