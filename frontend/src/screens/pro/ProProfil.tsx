import { useState } from "react";
import { useApp } from "../../state/app";
import {
  CONTROLES_OBLIGATOIRES,
  CONTROLES_RECOMMANDES,
  PRO,
  QUARTIERS_YAKRO,
  REALISATIONS_MAX,
  SERVICES,
  SERVICES_ACTIFS,
  ZONES_ACTIVES,
} from "../../data/pro";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspacePro, MONO, OVERLINE, TITRE_CARTE } from "./EspacePro";
import { useEtatPro } from "./store";

const GRILLE = (min: number): React.CSSProperties => ({
  display: "grid",
  gap: 12,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`,
});

/** Liste de pastilles à cocher (services, quartiers). */
function Pastilles({ choix, actifs, onChange }: { choix: string[]; actifs: string[]; onChange: (v: string[]) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {choix.map((c) => {
        const actif = actifs.includes(c);
        return (
          <button
            key={c}
            type="button"
            className={`sy-tag${actif ? " sy-tag--selected" : ""}`}
            aria-pressed={actif}
            onClick={() => onChange(actif ? actifs.filter((x) => x !== c) : [...actifs, c])}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

export function ProProfil() {
  const { go } = useApp();
  const toast = useToast();
  const { realisations } = useEtatPro();
  const [services, setServices] = useState(SERVICES_ACTIFS);
  const [zones, setZones] = useState(ZONES_ACTIVES);

  const enregistrer = () => {
    if (services.length === 0 || zones.length === 0) {
      toast("Profil incomplet", "Gardez au moins un service et un quartier d'intervention.", "danger");
      return;
    }
    toast("Modifications enregistrées", "Votre profil public est à jour.");
  };

  return (
    <EspacePro titre="Mon profil professionnel" sousTitre="Ce que les clients voient sur votre fiche.">
      <div data-r="pro-split">
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={TITRE_CARTE}>Activité</h2>
              <div style={GRILLE(220)}>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="pro-nom">
                    Nom de l'activité
                  </label>
                  <input id="pro-nom" className="sy-input" defaultValue={PRO.nom} />
                </div>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="pro-type">
                    Type
                  </label>
                  <div className="sy-select-wrap">
                    <select id="pro-type" className="sy-select">
                      <option>Artisan indépendant</option>
                      <option>Petite entreprise</option>
                    </select>
                    <span className="sy-select-wrap__caret">
                      <Icon name="chevron-down" size={18} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="pro-description">
                  Description
                </label>
                <textarea id="pro-description" className="sy-textarea" defaultValue={PRO.description} />
              </div>
            </div>
          </div>

          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={TITRE_CARTE}>Contact et périmètre</h2>
              <div style={GRILLE(200)}>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="pro-tel">
                    Téléphone
                  </label>
                  <input id="pro-tel" className="sy-input" defaultValue={PRO.telephone} inputMode="tel" />
                </div>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="pro-wa">
                    WhatsApp (facultatif)
                  </label>
                  <input id="pro-wa" className="sy-input" placeholder="07 00 00 00 00" inputMode="tel" />
                </div>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="pro-ville">
                    Ville
                  </label>
                  <input id="pro-ville" className="sy-input" defaultValue="Yamoussoukro" readOnly />
                </div>
              </div>
              <div className="sy-field">
                <span className="sy-field__label">Services proposés</span>
                <Pastilles choix={SERVICES} actifs={services} onChange={setServices} />
              </div>
              <div className="sy-field">
                <span className="sy-field__label">Zones d'intervention</span>
                <Pastilles choix={QUARTIERS_YAKRO} actifs={zones} onChange={setZones} />
              </div>
            </div>
          </div>

          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <h2 style={TITRE_CARTE}>Mes réalisations</h2>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  <span style={MONO}>{realisations.length}</span> photos sur {REALISATIONS_MAX}
                </span>
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                {realisations.map((r, i) => (
                  <div key={i} className="sy-card sy-card--flat">
                    <div className="sy-slot" style={{ aspectRatio: "4 / 3", border: 0 }}>
                      Photo de chantier
                    </div>
                    <div style={{ padding: "8px 10px", fontSize: "12px", color: "var(--argile-800)" }}>{r.legende}</div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => go("proRealisations")}
                  style={{
                    aspectRatio: "4 / 3",
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
                  Ajouter
                </button>
              </div>
              <button type="button" className="sy-btn sy-btn--primary sy-btn--md" style={{ alignSelf: "flex-start" }} onClick={enregistrer}>
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>

        <aside>
          <div className="sy-card">
            <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={OVERLINE}>État du profil</span>
              <span className="sy-badge sy-badge--success" style={{ alignSelf: "flex-start" }}>
                Vérifié
              </span>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--argile-700)" }}>
                Toute modification sensible (téléphone, nom de l'activité) peut nécessiter une nouvelle vérification.
              </p>
              <div style={{ height: 1, background: "var(--border-subtle)" }} />
              {[...CONTROLES_OBLIGATOIRES, ...CONTROLES_RECOMMANDES.slice(1, 2)].map((c) => (
                <div key={c.libelle} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", color: "var(--argile-800)" }}>
                  <Icon
                    name={c.ok ? "circle-check" : "circle-dashed"}
                    size={16}
                    color={c.ok ? "var(--secondary)" : "var(--argile-400)"}
                  />
                  {c.libelle}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </EspacePro>
  );
}
