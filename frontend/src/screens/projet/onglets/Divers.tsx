import {
  DOCUMENTS_PROJET,
  ENTRETIEN_PROJET,
  EQUIPEMENTS_PROJET,
  JALONS,
  MATERIAUX,
  TICKETS,
} from "../../../data/chantier";
import { MOYENS_PAIEMENT } from "../../../data/contrat";
import { useApp } from "../../../state/app";
import { Icon } from "../../../components/Icon";
import { TITRE_SECTION, badgeEtat } from "../../../components/ui";

const TITRE_CARTE: React.CSSProperties = { fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "17px" };
const MONTANT: React.CSSProperties = {
  marginLeft: "auto",
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "16px",
  whiteSpace: "nowrap",
};

function Encart({ texte }: { texte: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--state-warning-soft)",
      }}
    >
      <Icon name="info" size={18} color="var(--state-warning)" style={{ marginTop: 1 }} />
      <span style={{ fontSize: "14px", lineHeight: 1.5 }}>{texte}</span>
    </div>
  );
}

/** Paiements : six jalons, chacun libéré sur condition vérifiée. */
export function OngletPaiements() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Encart texte="Paiement par étapes sécurisé — bientôt disponible. En attendant, chaque jalon est validé manuellement par TerraClick après vérification de l'agent." />
      {JALONS.map((j) => (
        <div key={j.nom} className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={TITRE_CARTE}>{j.nom}</span>
            <span className="sy-badge sy-badge--neutral">{j.pct}</span>
            <span style={badgeEtat(j.etat)}>{j.etat}</span>
            <span style={{ ...MONTANT, fontSize: "17px" }}>{j.montant}</span>
          </div>
          <div style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>
            Prévu le {j.date} · Déblocage : {j.cond}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="sy-btn sy-btn--primary sy-btn--md" style={{ fontSize: "13.5px" }}>
              Valider l'étape
            </button>
            <button className="sy-btn sy-btn--ghost sy-btn--md" style={{ fontSize: "13.5px" }}>
              Signaler un problème
            </button>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {MOYENS_PAIEMENT.map((m) => (
          <span key={m} className="sy-badge sy-badge--neutral">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Matériaux commandés, avec leurs pièces justificatives. */
export function OngletMateriaux() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {MATERIAUX.map((m) => (
        <div key={m.mat} className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={TITRE_CARTE}>{m.mat}</span>
            <span style={badgeEtat(m.etat)}>{m.etat}</span>
            <span style={MONTANT}>{m.total}</span>
          </div>
          <div style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>
            {m.fourn} · {m.qte} · {m.pu}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Bon de commande", "Facture", "Bon de livraison"].map((b) => (
              <button key={b} className="sy-btn sy-btn--ghost sy-btn--md" style={{ fontSize: "13px" }}>
                {b}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Équipements du projet et moment d'installation. */
export function OngletEquipements() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {EQUIPEMENTS_PROJET.map((e) => (
        <div key={e.nom} className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={TITRE_CARTE}>{e.nom}</span>
            <span style={badgeEtat(e.etat)}>{e.etat}</span>
            <span style={MONTANT}>{e.prix}</span>
          </div>
          <div style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>{e.info}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="sy-btn sy-btn--outline sy-btn--md" style={{ fontSize: "13.5px" }}>
              Voir les devis
            </button>
            <button className="sy-btn sy-btn--ghost sy-btn--md" style={{ fontSize: "13.5px" }}>
              Contrat de maintenance
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Fil de discussion du projet, avec le chef de projet. */
export function OngletMessages() {
  return (
    <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={TITRE_SECTION}>Messages du projet</span>
      <div
        style={{
          alignSelf: "flex-start",
          maxWidth: "80%",
          background: "var(--color-surface)",
          borderRadius: "16px 16px 16px 4px",
          padding: "12px 15px",
          fontSize: "14.5px",
        }}
      >
        Le mur nord est monté. Photos envoyées dans le rapport.
      </div>
      <div
        style={{
          alignSelf: "flex-end",
          maxWidth: "80%",
          background: "var(--color-accent)",
          color: "#fff",
          borderRadius: "16px 16px 4px 16px",
          padding: "12px 15px",
          fontSize: "14.5px",
        }}
      >
        Merci. Je valide le carrelage cette semaine.
      </div>
      <div style={{ display: "flex", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
        <input className="sy-input" placeholder="Écrivez au chef de projet…" aria-label="Message au chef de projet" style={{ flex: 1 }} />
        <button className="sy-btn sy-btn--primary sy-btn--md">Envoyer</button>
      </div>
    </div>
  );
}

/** Documents du projet, du contrat aux rapports de l'agent. */
export function OngletDocuments() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {DOCUMENTS_PROJET.map((d) => (
        <div
          key={d.nom}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              flex: "none",
              borderRadius: "var(--radius-md)",
              background: "var(--kola-50)",
              color: "var(--kola-600)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name={d.icon} size={19} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>{d.nom}</span>
            <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)" }}>{d.meta}</span>
          </span>
          <button className="sy-btn sy-btn--ghost sy-btn--md" style={{ fontSize: "13px" }}>
            Télécharger
          </button>
        </div>
      ))}
    </div>
  );
}

/** Incidents et service après-vente, y compris le renvoi vers les réserves. */
export function OngletSav() {
  const { set } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button className="sy-btn sy-btn--primary sy-btn--md" style={{ alignSelf: "flex-start" }}>
        Signaler un incident
      </button>
      {TICKETS.map((t) => (
        <div key={t.titre} className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={TITRE_CARTE}>{t.titre}</span>
            <span style={badgeEtat(t.etat)}>{t.etat}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span className="sy-badge sy-badge--neutral">{t.cat}</span>
            <span className="sy-badge sy-badge--neutral">Priorité {t.prio}</span>
            <span className="sy-badge sy-badge--neutral">{t.quand}</span>
          </div>
          <button className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start", fontSize: "13.5px" }}>
            Ouvrir le ticket
          </button>
        </div>
      ))}
      <div
        style={{
          padding: 16,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: 600 }}>Réserves de pré-réception</span>
        <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--text-muted)" }}>
          Trois réserves relevées à la visite du 14 avril, dont une bloquante. Elles se suivent dans l'onglet
          Pré-réception.
        </span>
        <button
          onClick={() => set({ onglet: 3 })}
          className="sy-btn sy-btn--outline sy-btn--md"
          style={{ alignSelf: "flex-start", fontSize: "13.5px" }}
        >
          Voir la pré-réception
        </button>
      </div>
    </div>
  );
}

/** Entretien : réservable une fois le chantier réceptionné. */
export function OngletEntretien() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: "14.5px", lineHeight: 1.55, margin: 0, color: "var(--text-muted)" }}>
        Ces services deviennent réservables après la réception du chantier. Vous pouvez déjà voir les prestataires
        vérifiés proches du bien.
      </p>
      {ENTRETIEN_PROJET.map((e) => (
        <div
          key={e.nom}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              flex: "none",
              borderRadius: "var(--radius-md)",
              background: "var(--kola-50)",
              color: "var(--kola-600)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name={e.icon} size={19} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>{e.nom}</span>
            <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)" }}>{e.info}</span>
          </span>
          <button className="sy-btn sy-btn--outline sy-btn--md" style={{ fontSize: "13px" }}>
            Voir les prestataires
          </button>
        </div>
      ))}
    </div>
  );
}
