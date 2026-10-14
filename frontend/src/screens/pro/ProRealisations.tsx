import { REALISATIONS_MAX } from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspacePro, MONO } from "./EspacePro";
import { modifierPro, useEtatPro } from "./store";

export function ProRealisations() {
  const toast = useToast();
  const { realisations } = useEtatPro();

  const ajouter = () => {
    if (realisations.length >= REALISATIONS_MAX) {
      toast("Limite atteinte", `${REALISATIONS_MAX} réalisations maximum : supprimez une photo pour en ajouter une.`, "danger");
      return;
    }
    modifierPro((e) => ({ realisations: [...e.realisations, { legende: "Légende à compléter", date: "octobre 2026" }] }));
  };

  const supprimer = (index: number) =>
    modifierPro((e) => ({ realisations: e.realisations.filter((_, i) => i !== index) }));

  return (
    <EspacePro titre="Mes réalisations" sousTitre="Les profils avec photos reçoivent plus de demandes.">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>
          <span style={MONO}>{realisations.length}</span> photos sur {REALISATIONS_MAX}
        </p>
        <button type="button" className="sy-btn sy-btn--primary sy-btn--md" onClick={ajouter} style={{ gap: 8 }}>
          <Icon name="image-plus" size={18} />
          Ajouter une photo
        </button>
      </div>

      {realisations.length === 0 && (
        <div className="sy-card sy-weave" style={{ backgroundColor: "var(--argile-50)" }}>
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
            <p style={{ margin: 0, fontSize: "15px", color: "var(--argile-800)" }}>Vous n'avez pas encore ajouté de réalisation.</p>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--argile-700)" }}>
              Une photo de chantier terminé rassure le client avant le premier appel.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 190px), 1fr))" }}>
        {realisations.map((r, i) => (
          <div key={i} className="sy-card">
            <div className="sy-slot" style={{ aspectRatio: "4 / 3", border: 0 }}>
              Photo de chantier
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{r.legende}</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{r.date}</span>
                <button
                  type="button"
                  className="sy-iconbtn sy-iconbtn--sm"
                  onClick={() => supprimer(i)}
                  aria-label={`Supprimer la photo « ${r.legende} »`}
                  style={{ color: "var(--state-danger)" }}
                >
                  <Icon name="trash-2" size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {realisations.length < REALISATIONS_MAX && (
          <button
            type="button"
            onClick={ajouter}
            style={{
              minHeight: 160,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-card)",
              border: "1.5px dashed var(--border-strong)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
              color: "var(--kola-600)",
              font: "inherit",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Icon name="image-plus" size={28} />
            Ajouter une photo
          </button>
        )}
      </div>
    </EspacePro>
  );
}
