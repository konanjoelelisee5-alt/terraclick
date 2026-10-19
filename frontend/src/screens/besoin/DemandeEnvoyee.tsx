import { APRES_ENVOI } from "../../data/catalogue";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { CARTE } from "../../components/ui";
import { CadreParcours } from "./commun";
import { CarteTechnicien } from "./CarteTechnicien";

/** Accusé d'envoi : la demande est enregistrée, voici sa référence et ce qui va suivre. */
export function DemandeEnvoyee() {
  const { etat, go } = useApp();
  const d = etat.demandeEnvoyee;

  return (
    <CadreParcours
      retour={() => go("home")}
      actions={
        <>
          <button onClick={() => go("clientDemandes")} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: 1, minHeight: 50, justifyContent: "center" }}>
            Suivre mes demandes
          </button>
          <button onClick={() => go("home")} className="sy-btn sy-btn--outline sy-btn--md" style={{ flex: 1, minHeight: 50, justifyContent: "center" }}>
            Accueil
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, marginBottom: 22 }}>
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "var(--state-success-soft)",
            color: "var(--state-success)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="check" size={32} strokeWidth={2.5} />
        </span>
        <h1 style={{ fontSize: "clamp(24px,4vw,30px)", margin: 0 }}>Demande envoyée</h1>
        {d && <span style={{ fontSize: "14px", color: "var(--color-neutral-700)" }}>Référence {d.reference}</span>}
        <p style={{ margin: 0, fontSize: "15px", maxWidth: "46ch" }}>{APRES_ENVOI}</p>
      </div>

      {d && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...CARTE, padding: 16 }}>
            <span style={{ display: "block", fontWeight: 700, fontSize: "15px", marginBottom: 2 }}>Votre demande</span>
            <span style={{ fontSize: "14.5px" }}>{d.resume}</span>
          </div>
          {d.prestataire && <CarteTechnicien p={d.prestataire} badge="En attente de réponse" />}
        </div>
      )}
    </CadreParcours>
  );
}
