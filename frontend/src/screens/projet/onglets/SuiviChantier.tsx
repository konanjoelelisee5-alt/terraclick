import { PHASES_CHANTIER, VALIDATIONS_CLIENT } from "../../../data/chantier";
import { Icon } from "../../../components/Icon";
import { ImageSlot } from "../../../components/ImageSlot";
import { TITRE_SECTION, badgeEtat } from "../../../components/ui";

const LIGNE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "13px 16px",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-md)",
};

function Chiffre({ label, valeur, grand = false }: { label: string; valeur: string; grand?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>{label}</div>
      <div
        style={
          grand
            ? { fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "26px" }
            : { fontSize: "15px", fontWeight: 600 }
        }
      >
        {valeur}
      </div>
    </div>
  );
}

/** Suivi de chantier : avancement, planning, photos hebdomadaires et validations. */
export function OngletSuiviChantier() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="sy-card sy-weave" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "21px" }}>
          Suivi de votre chantier
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px" }}>
          <Chiffre label="Avancement global" valeur="38 %" grand />
          <Chiffre label="Étape en cours" valeur="Élévation des murs" />
          <Chiffre label="Début" valeur="10 avril 2026" />
          <Chiffre label="Fin prévisionnelle" valeur="mars 2027" />
          <div>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Statut</div>
            <span className="sy-badge sy-badge--success">À l'heure</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-card)",
          }}
        >
          <Icon name="bell" size={18} color="var(--kola-600)" style={{ marginTop: 1 }} />
          <span style={{ fontSize: "14px", lineHeight: 1.5 }}>
            Prochaine action attendue de vous : valider le choix du carrelage avant le 20 septembre.
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={TITRE_SECTION}>Planning</span>
        {PHASES_CHANTIER.map((p) => (
          <div key={p.nom} style={LIGNE}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>{p.nom}</span>
              <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)" }}>{p.info}</span>
            </span>
            <span style={badgeEtat(p.etat)}>{p.etat}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={TITRE_SECTION}>Photos et rapports</span>
        <div data-grid="421">
          {["semaine 34", "semaine 34", "semaine 33", "semaine 33"].map((s, i) => (
            <ImageSlot key={i} placeholder={`Photo ${s}`} radius={12} style={{ height: 120 }} />
          ))}
        </div>
        <div
          style={{
            padding: 16,
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600 }}>Rapport hebdomadaire · semaine 34</span>
          <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--text-muted)" }}>
            Réalisé : élévation du mur nord et pose des linteaux. Problème : livraison de ciment retardée de 2 jours.
            Prévu la semaine prochaine : mur sud et coffrage du chaînage.
          </span>
          <button className="sy-btn sy-btn--ghost sy-btn--md" style={{ alignSelf: "flex-start" }}>
            Ouvrir le rapport complet
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={TITRE_SECTION}>Vos validations</span>
        {VALIDATIONS_CLIENT.map((v) => (
          <div key={v.nom} style={LIGNE}>
            <span style={{ flex: 1, fontSize: "15px" }}>{v.nom}</span>
            <span style={badgeEtat(v.etat)}>{v.etat}</span>
            <button className="sy-btn sy-btn--outline sy-btn--md" style={{ fontSize: "13px" }}>
              Décider
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
