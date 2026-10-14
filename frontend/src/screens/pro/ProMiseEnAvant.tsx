import { MISES_EN_AVANT } from "../../data/pro";
import { useToast } from "../../components/Toast";
import { EspacePro, MONO, Note } from "./EspacePro";

export function ProMiseEnAvant() {
  const toast = useToast();

  return (
    <EspacePro titre="Mise en avant" sousTitre="Apparaissez en tête des résultats pour une catégorie et un quartier.">
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))" }}>
        {MISES_EN_AVANT.map((m) => (
          <div key={m.duree} className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", boxSizing: "border-box" }}>
              <strong style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>{m.duree}</strong>
              <div style={{ ...MONO, fontSize: "20px", fontWeight: 700 }}>{m.prix}</div>
              <div style={{ fontSize: "14px", color: "var(--argile-700)" }}>{m.portee}</div>
              <button
                type="button"
                className="sy-btn sy-btn--outline sy-btn--md sy-btn--block"
                style={{ marginTop: "auto" }}
                onClick={() => toast("Facture créée", `Mise en avant ${m.duree} · ${m.prix}. Elle démarre après paiement.`)}
              >
                Choisir cette mise en avant
              </button>
            </div>
          </div>
        ))}
      </div>
      <Note>
        La mise en avant ne garantit pas de demandes ou de clients. Une facture est créée avant le paiement ; la mise en
        avant démarre après confirmation du paiement.
      </Note>
    </EspacePro>
  );
}
