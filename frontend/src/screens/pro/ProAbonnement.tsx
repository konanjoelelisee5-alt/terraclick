import { FACTURES, PLANS, PRO } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspacePro, MONO, OVERLINE, badge } from "./EspacePro";

const COLONNES = "1.1fr 1.4fr .9fr 1.1fr 1fr 90px";

export function ProAbonnement() {
  const toast = useToast();
  const payer = (ref: string) =>
    toast("Paiement de la facture", `Le paiement mobile money de ${ref} sera proposé ici.`, "info");

  return (
    <EspacePro titre="Abonnement et factures" sousTitre="Votre plan, vos factures plateforme et leur paiement.">
      <div className="sy-card">
        <div
          className="sy-card__body"
          style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}
        >
          <div>
            <span style={OVERLINE}>Plan actuel</span>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "22px", marginTop: 2 }}>{PRO.plan}</div>
            <div style={{ fontSize: "14px", color: "var(--argile-700)", marginTop: 4 }}>
              Actif jusqu'au {PRO.expiration} · 5 réponses par jour
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span className="sy-badge sy-badge--success">Actif</span>
            <button
              type="button"
              className="sy-btn sy-btn--primary sy-btn--md"
              onClick={() => toast("Renouvellement", "Une facture de 15 000 F sera créée pour le mois suivant.", "info")}
            >
              Renouveler
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
        {PLANS.map((p) => (
          <div key={p.nom} className="sy-card" style={{ borderColor: p.actuel ? "var(--kola-200)" : undefined }}>
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>{p.nom}</strong>
                {p.actuel && <span className="sy-badge sy-badge--success">Plan actuel</span>}
              </div>
              <div style={{ ...MONO, fontSize: "20px", fontWeight: 700 }}>{p.prix}</div>
              {p.avantages.map((a) => (
                <div key={a} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "14px", color: "var(--argile-700)" }}>
                  <Icon name="check" size={16} color="var(--secondary)" style={{ marginTop: 2 }} />
                  {a}
                </div>
              ))}
              <button
                type="button"
                className={`sy-btn ${p.actuel ? "sy-btn--primary" : "sy-btn--outline"} sy-btn--md sy-btn--block`}
                style={{ marginTop: "auto" }}
                onClick={() => toast(p.action, `Plan ${p.nom} : la facture correspondante sera créée avant paiement.`, "info")}
              >
                {p.action}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ margin: "8px 0 0", fontSize: "19px" }}>Factures plateforme</h2>

      {/* Tableau sur grand écran */}
      <div data-r="factures-table" className="sy-card">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLONNES,
            gap: 12,
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: ".08em",
            color: "var(--text-muted)",
          }}
        >
          <span>RÉFÉRENCE</span>
          <span>TYPE</span>
          <span>MONTANT</span>
          <span>STATUT</span>
          <span>ÉCHÉANCE</span>
          <span />
        </div>
        {FACTURES.map((f) => (
          <div
            key={f.ref}
            style={{
              display: "grid",
              gridTemplateColumns: COLONNES,
              gap: 12,
              padding: "14px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              alignItems: "center",
            }}
          >
            <span style={{ ...MONO, fontSize: "13px" }}>{f.ref}</span>
            <span style={{ fontSize: "14px", color: "var(--argile-800)" }}>{f.type}</span>
            <span style={{ ...MONO, fontSize: "13px", fontWeight: 700 }}>{f.montant}</span>
            <span>
              <span className={badge(f.ton)}>{f.statut}</span>
            </span>
            <span style={{ fontSize: "14px", color: "var(--argile-700)" }}>{f.echeance}</span>
            {f.payable ? (
              <button type="button" className="sy-btn sy-btn--primary sy-btn--sm" onClick={() => payer(f.ref)}>
                Payer
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      {/* Cartes sur tablette et mobile */}
      <div data-r="factures-cartes" style={{ flexDirection: "column", gap: 10 }}>
        {FACTURES.map((f) => (
          <div key={f.ref} className="sy-card">
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ ...MONO, fontSize: "13px" }}>{f.ref}</span>
                <span className={badge(f.ton)}>{f.statut}</span>
              </div>
              <span style={{ fontSize: "14px", color: "var(--argile-800)" }}>{f.type}</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ ...MONO, fontSize: "13px", fontWeight: 700 }}>{f.montant}</span>
                <span style={{ fontSize: "13px", color: "var(--argile-700)" }}>Échéance {f.echeance}</span>
              </div>
              {f.payable && (
                <button
                  type="button"
                  className="sy-btn sy-btn--primary sy-btn--sm"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => payer(f.ref)}
                >
                  Payer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
        Le paiement d'un abonnement ne vérifie pas automatiquement votre profil : la vérification reste faite par un
        manager.
      </p>
    </EspacePro>
  );
}
