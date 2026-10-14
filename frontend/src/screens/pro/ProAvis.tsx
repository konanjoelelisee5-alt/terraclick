import { useState } from "react";
import { AVIS_RECUS } from "../../data/pro";
import { Rating } from "../../components/Rating";
import { useToast } from "../../components/Toast";
import { EspacePro } from "./EspacePro";

export function ProAvis() {
  const toast = useToast();
  const [signales, setSignales] = useState<string[]>([]);

  return (
    <EspacePro titre="Mes avis" sousTitre="Ce que vos clients disent de vous, critère par critère.">
      <div className="sy-card">
        <div className="sy-card__body" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "34px", lineHeight: 1 }}>4,8</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 4 }}>63 avis publics</div>
          </div>
          <Rating value={4.8} showValue={false} size={20} />
        </div>
      </div>

      {AVIS_RECUS.map((a) => {
        const signale = signales.includes(a.nom);
        return (
          <div key={a.nom} className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ fontSize: "14px" }}>{a.nom}</strong>
                <Rating value={a.note} showValue={false} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{a.date}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span className="sy-badge sy-badge--neutral">Ponctualité {a.ponctualite}</span>
                <span className="sy-badge sy-badge--neutral">Qualité {a.qualite}</span>
                <span className="sy-badge sy-badge--neutral">Prix respecté {a.prix}</span>
              </div>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--argile-700)" }}>{a.texte}</p>
              <button
                type="button"
                className="sy-btn sy-btn--ghost sy-btn--sm"
                style={{ alignSelf: "flex-start", gap: 6 }}
                disabled={signale}
                onClick={() => {
                  setSignales((s) => [...s, a.nom]);
                  toast("Avis signalé", "Un manager l'examinera. L'avis reste visible en attendant.");
                }}
              >
                {signale ? "Avis signalé" : "Signaler cet avis"}
              </button>
            </div>
          </div>
        );
      })}
    </EspacePro>
  );
}
