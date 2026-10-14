import { useApp } from "../../state/app";
import { api } from "../../lib/api";
import { FACTURES, PRO, STATS } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspacePro, MONO, TITRE_CARTE, badge } from "./EspacePro";
import { useEtatPro } from "./store";

export function ProDashboard() {
  const { go } = useApp();
  const toast = useToast();
  const { demandes } = useEtatPro();
  const aRepondre = demandes.slice(0, 3);
  const facture = FACTURES[0];

  // La fiche publique est celle de l'annuaire réel : on la retrouve par son nom.
  const voirFichePublique = async () => {
    const id = await api
      .rechercher({ q: PRO.nom, par_page: 1 })
      .then((r) => r.data[0]?.id)
      .catch(() => undefined);
    if (id) go("fiche", { fiche: id });
    else toast("Fiche introuvable", "Votre fiche publique n'a pas pu être chargée.", "danger");
  };

  return (
    <EspacePro titre={`Bonjour, ${PRO.nom}`} sousTitre="Voici ce qui demande votre attention aujourd'hui.">
      <div className="sy-card" style={{ borderColor: "var(--lagune-200)" }}>
        <div className="sy-card__body" style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <span
            style={{
              width: 44,
              height: 44,
              flex: "none",
              borderRadius: 12,
              background: "var(--state-success-soft)",
              color: "var(--lagune-700)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="shield-check" size={22} />
          </span>
          {/* Base de 220 px : sur téléphone, le bouton passe sous le texte au lieu de l'écraser. */}
          <div style={{ minWidth: 0, flex: "1 1 220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontFamily: "var(--font-heading)", fontSize: "17px" }}>Profil vérifié</strong>
              <span className="sy-badge sy-badge--success">Publié</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "14px", lineHeight: 1.6, color: "var(--argile-700)" }}>
              Votre profil est visible par les visiteurs. Répondez vite aux demandes pour rester bien classé.
            </p>
          </div>
          <button type="button" className="sy-btn sy-btn--outline sy-btn--sm" onClick={voirFichePublique}>
            Voir mon profil public
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))" }}>
        {STATS.map((s) => (
          <div key={s.libelle} className="sy-card">
            <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  flex: "none",
                  borderRadius: 10,
                  background: s.fond,
                  color: s.encre,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name={s.icone} size={18} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "24px", lineHeight: 1 }}>
                    {s.valeur}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{s.aide}</span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--argile-700)", marginTop: 3 }}>{s.libelle}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={TITRE_CARTE}>Demandes à répondre</h2>
              <button type="button" className="sy-btn sy-btn--ghost sy-btn--sm" onClick={() => go("proDemandes")}>
                Tout voir
              </button>
            </div>
            {aRepondre.map((d) => (
              <button
                key={d.ref}
                type="button"
                onClick={() => go("proDemande")}
                style={{
                  border: "1px solid var(--border-subtle)",
                  background: "var(--surface-card)",
                  borderRadius: 12,
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  textAlign: "left",
                  font: "inherit",
                  color: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ ...MONO, fontSize: "12px", color: "var(--kola-700)" }}>{d.ref}</span>
                  <span className={badge(d.ton)}>{d.statut}</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>
                  {d.client} · {d.categorie}
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {d.quartier} · {d.date}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={TITRE_CARTE}>Abonnement et facture</h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: 12,
                background: "var(--argile-50)",
                borderRadius: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>Plan {PRO.plan}</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Expire le {PRO.expiration}</div>
              </div>
              <button type="button" className="sy-btn sy-btn--outline sy-btn--sm" onClick={() => go("proAbonnement")}>
                Voir
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: 12,
                background: "var(--state-warning-soft)",
                borderRadius: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ ...MONO, fontSize: "13px", fontWeight: 700, color: "var(--state-warning)" }}>{facture.ref}</div>
                <div style={{ fontSize: "13px", color: "var(--state-warning)" }}>
                  {facture.type} · {facture.montant} · échéance {facture.echeance}
                </div>
              </div>
              <button type="button" className="sy-btn sy-btn--primary sy-btn--sm" onClick={() => go("proAbonnement")}>
                Voir la facture
              </button>
            </div>
          </div>
        </div>
      </div>
    </EspacePro>
  );
}
