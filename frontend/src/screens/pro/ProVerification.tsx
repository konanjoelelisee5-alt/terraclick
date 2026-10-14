import { CONTROLES_OBLIGATOIRES, CONTROLES_RECOMMANDES, PRO, type Controle } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspacePro, OVERLINE } from "./EspacePro";

function Ligne({ c }: { c: Controle }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--border-subtle)",
        flexWrap: "wrap",
      }}
    >
      <Icon name={c.ok ? "circle-check" : "circle-dashed"} size={18} color={c.ok ? "var(--secondary)" : "var(--argile-400)"} />
      <span style={{ fontSize: "15px", color: "var(--argile-800)", flex: 1, minWidth: 140 }}>{c.libelle}</span>
      <span className={`sy-badge ${c.ok ? "sy-badge--success" : "sy-badge--neutral"}`}>{c.ok ? "Conforme" : "À compléter"}</span>
    </div>
  );
}

export function ProVerification() {
  const toast = useToast();
  const obligatoiresOk = CONTROLES_OBLIGATOIRES.every((c) => c.ok);

  return (
    <EspacePro titre="Soumettre à vérification" sousTitre="Un manager vérifie votre profil avant publication.">
      <div data-r="pro-split">
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={OVERLINE}>Obligatoire</span>
            {CONTROLES_OBLIGATOIRES.map((c) => (
              <Ligne key={c.libelle} c={c} />
            ))}
            <span style={{ ...OVERLINE, marginTop: 14 }}>Recommandé</span>
            {CONTROLES_RECOMMANDES.map((c) => (
              <Ligne key={c.libelle} c={c} />
            ))}
            <button
              type="button"
              className="sy-btn sy-btn--primary sy-btn--lg"
              style={{ marginTop: 14, alignSelf: "flex-start" }}
              disabled={!obligatoiresOk}
              onClick={() => toast("Profil soumis", "Un manager l'examine, en général sous 48 h. Vous serez prévenu.")}
            >
              Soumettre mon profil
            </button>
          </div>
        </div>

        <aside>
          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={OVERLINE}>Aperçu public</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span
                  style={{
                    width: 52,
                    height: 52,
                    flex: "none",
                    borderRadius: 12,
                    background: "var(--kola-100)",
                    color: "var(--kola-700)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 800,
                    fontSize: "17px",
                  }}
                >
                  {PRO.initiales}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{PRO.nom}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {PRO.metier} · {PRO.quartier}
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--argile-700)" }}>
                Voici ce que verront les visiteurs une fois votre profil approuvé.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </EspacePro>
  );
}
