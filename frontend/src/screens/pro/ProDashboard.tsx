import { useApp } from "../../state/app";
import { CONSIGNES, FACTURES, PRO, STATS } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { EspacePro, MONO, TITRE_CARTE, badge } from "./EspacePro";
import { useEtatPro } from "./store";

const LIGNE: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  background: "var(--surface-card)",
  borderRadius: 10,
  padding: "10px 12px",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  textAlign: "left",
  font: "inherit",
  color: "inherit",
};

export function ProDashboard() {
  const { go } = useApp();
  const { demandes, consignesFaites } = useEtatPro();
  const aRepondre = demandes.filter((d) => ["Nouvelles", "Vues"].includes(d.groupe)).slice(0, 3);
  const consignes = CONSIGNES.filter((c) => !consignesFaites.includes(c.ref));
  const facture = FACTURES[0];

  // Les compteurs liés aux demandes suivent l'état réel de la boîte de réception.
  const parGroupe = (...groupes: string[]) => String(demandes.filter((d) => groupes.includes(d.groupe)).length);
  const valeurs: Record<string, string> = {
    "Nouvelles demandes": parGroupe("Nouvelles"),
    "À répondre": parGroupe("Nouvelles", "Vues"),
    "Rendez-vous": parGroupe("Acceptées"),
    "À confirmer": parGroupe("À confirmer"),
  };

  return (
    <EspacePro titre="Tableau de bord" sousTitre={`Bonjour ${PRO.nom}, voici ce qui demande votre attention aujourd'hui.`}>
      {/* Indicateurs */}
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
                    {valeurs[s.libelle] ?? s.valeur}
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
        {/* Ordres de l'administration */}
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={TITRE_CARTE}>Consignes de l'administration</h2>
              <button type="button" className="sy-btn sy-btn--ghost sy-btn--sm" onClick={() => go("proConsignes")}>
                Tout voir
              </button>
            </div>
            {consignes.length === 0 && (
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Aucune consigne en attente.</p>
            )}
            {consignes.map((c) => (
              <button key={c.ref} type="button" onClick={() => go(c.ecran)} style={LIGNE}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ ...MONO, fontSize: "12px", color: "var(--kola-700)" }}>{c.ref}</span>
                  <span className={badge(c.ton)}>Priorité {c.priorite.toLowerCase()}</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>{c.titre}</span>
                <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  {c.emetteur} · échéance {c.echeance}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactions clients */}
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={TITRE_CARTE}>Demandes à répondre</h2>
              <button type="button" className="sy-btn sy-btn--ghost sy-btn--sm" onClick={() => go("proDemandes")}>
                Tout voir
              </button>
            </div>
            {aRepondre.length === 0 && (
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>Aucune demande en attente de réponse.</p>
            )}
            {aRepondre.map((d) => (
              <button key={d.ref} type="button" onClick={() => go("proDemande")} style={LIGNE}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ ...MONO, fontSize: "12px", color: "var(--kola-700)" }}>{d.ref}</span>
                  <span className={badge(d.ton)}>{d.statut}</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>
                  {d.client} · {d.categorie}
                </span>
                <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  {d.quartier} · {d.date}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
        {/* État du profil */}
        <div className="sy-card" style={{ borderColor: "var(--lagune-200)" }}>
          <div className="sy-card__body" style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
            <span
              style={{
                width: 40,
                height: 40,
                flex: "none",
                borderRadius: 10,
                background: "var(--state-success-soft)",
                color: "var(--lagune-700)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="shield-check" size={20} />
            </span>
            {/* Base de 200 px : sur téléphone, le bouton passe sous le texte au lieu de l'écraser. */}
            <div style={{ minWidth: 0, flex: "1 1 200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={TITRE_CARTE}>Profil vérifié</h2>
                <span className="sy-badge sy-badge--success">Publié</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "13.5px", lineHeight: 1.55, color: "var(--argile-700)" }}>
                Vos clients vous trouvent. Répondez vite aux demandes pour rester bien classé.
              </p>
            </div>
            <button type="button" className="sy-btn sy-btn--outline sy-btn--sm" onClick={() => go("proVerification")}>
              Aperçu de ma fiche
            </button>
          </div>
        </div>

        {/* Abonnement */}
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <h2 style={TITRE_CARTE}>Plan {PRO.plan}</h2>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Expire le {PRO.expiration}</div>
              </div>
              <button type="button" className="sy-btn sy-btn--outline sy-btn--sm" onClick={() => go("proAbonnement")}>
                Gérer
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 12px",
                background: "var(--state-warning-soft)",
                borderRadius: 10,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ ...MONO, fontSize: "13px", fontWeight: 700, color: "var(--state-warning)" }}>{facture.ref}</div>
                <div style={{ fontSize: "12.5px", color: "var(--state-warning)" }}>
                  {facture.montant} · {facture.statut.toLowerCase()}
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
