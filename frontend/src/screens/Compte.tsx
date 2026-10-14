import { ABONNEMENTS, CANAUX, CONVERSATIONS, DEMANDES, EQUIPEMENTS_POSES, FAVORIS, RECUS } from "../data/compte";
import { PROS } from "../data/catalogue";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { TITRE_SECTION } from "../components/ui";

const LIGNE_CLIQUABLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 12,
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-md)",
  background: "var(--surface-card)",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
  color: "inherit",
};

const PASTILLE: React.CSSProperties = {
  width: 38,
  height: 38,
  flex: "none",
  borderRadius: "999px",
  background: "var(--kola-50)",
  color: "var(--kola-600)",
  display: "grid",
  placeItems: "center",
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "13px",
};

/** État d'un équipement ou d'un abonnement : vert tant qu'il est couvert. */
function badgeDouceur(actif: boolean): React.CSSProperties {
  return {
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 11px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
    background: actif ? "var(--state-success-soft)" : "var(--color-surface)",
    color: actif ? "var(--state-success)" : "var(--text-muted)",
  };
}

/**
 * Espace client : conversations, demandes de devis, favoris, équipements posés,
 * abonnements d'entretien, reçus, canaux de notification et coordonnées.
 */
export function Compte() {
  const { etat, set, go, ouvrirChat, deconnecter } = useApp();
  const prenom = etat.auth?.prenom ?? "";
  const initiales = prenom
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);

  return (
    <main data-r="container" style={{ paddingTop: 30, paddingBottom: 70 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26, flexWrap: "wrap" }}>
        <span style={{ ...PASTILLE, width: 56, height: 56, fontSize: "19px" }}>{initiales}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              fontSize: "clamp(26px,4.5vw,34px)",
              margin: 0,
            }}
          >
            {prenom}
          </h1>
          <p style={{ fontSize: "14px", margin: "2px 0 0", color: "var(--text-muted)" }}>
            {etat.auth?.tel} · {etat.auth?.quartier}, Yamoussoukro
          </p>
        </div>
        <button onClick={deconnecter} className="sy-btn sy-btn--ghost sy-btn--md">
          Se déconnecter
        </button>
      </div>

      <div data-r="promo" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={TITRE_SECTION}>Mes conversations</span>
            {CONVERSATIONS.map((c) => (
              <button key={c.nom} onClick={() => ouvrirChat(PROS[0])} style={LIGNE_CLIQUABLE}>
                <span style={PASTILLE}>{c.ini}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600 }}>{c.nom}</span>
                  <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)" }}>{c.texte}</span>
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{c.quand}</span>
              </button>
            ))}
          </div>

          <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={TITRE_SECTION}>Mes demandes de devis</span>
            {DEMANDES.map((d) => (
              <div
                key={d.titre}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600 }}>{d.titre}</span>
                  <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)" }}>{d.info}</span>
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    padding: "5px 12px",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                    background: d.ok ? "var(--kola-50)" : "var(--color-surface)",
                    color: d.ok ? "var(--kola-600)" : "var(--text-muted)",
                  }}
                >
                  {d.etat}
                </span>
              </div>
            ))}
          </div>

          <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={TITRE_SECTION}>Favoris</span>
            {FAVORIS.map((f) => (
              <button key={f.nom} onClick={() => ouvrirChat(PROS[0])} style={LIGNE_CLIQUABLE}>
                <span style={PASTILLE}>{f.ini}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600 }}>{f.nom}</span>
                  <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)" }}>{f.metier}</span>
                </span>
                <Icon name="heart" size={18} color="var(--kola-600)" fill="currentColor" />
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={{ ...TITRE_SECTION, display: "block" }}>Mes équipements</span>
              <span style={{ display: "block", fontSize: "13.5px", color: "var(--text-muted)", marginTop: 4 }}>
                Ce qui a été installé chez vous, avec les garanties et les entretiens à venir.
              </span>
            </div>
            {EQUIPEMENTS_POSES.map((e) => (
              <div
                key={e.nom}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 14,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ flex: 1, minWidth: 150, fontSize: "14.5px", fontWeight: 600 }}>{e.nom}</span>
                  <span style={badgeDouceur(e.etat === "Sous garantie")}>{e.etat}</span>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{e.info}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span className="sy-badge sy-badge--neutral">{e.garantie}</span>
                  <span className="sy-badge sy-badge--neutral">{e.prochain}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="sy-btn sy-btn--outline sy-btn--md" style={{ fontSize: "13px", gap: 7 }}>
                    <Icon name="file-text" size={15} />
                    Notice
                  </button>
                  <button className="sy-btn sy-btn--ghost sy-btn--md" style={{ fontSize: "13px" }}>
                    Programmer un entretien
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={{ ...TITRE_SECTION, display: "block" }}>Mes réservations entretien</span>
              <span style={{ display: "block", fontSize: "13.5px", color: "var(--text-muted)", marginTop: 4 }}>
                Abonnements en cours et prochains passages.
              </span>
            </div>
            {ABONNEMENTS.map((a) => (
              <div
                key={a.nom}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 14,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ flex: 1, minWidth: 150, fontSize: "14.5px", fontWeight: 600 }}>{a.nom}</span>
                  <span style={badgeDouceur(a.actif)}>{a.actif ? "Actif" : "Suspendu"}</span>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{a.info}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span className="sy-badge sy-badge--brand">{a.prochain}</span>
                  <span className="sy-badge sy-badge--neutral">{a.prix}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="sy-btn sy-btn--outline sy-btn--md" style={{ fontSize: "13px" }}>
                    Déplacer la visite
                  </button>
                  <button className="sy-btn sy-btn--ghost sy-btn--md" style={{ fontSize: "13px" }}>
                    Factures
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={TITRE_SECTION}>Reçus et paiements</span>
            {RECUS.map((r) => (
              <button key={r.ref} onClick={() => go("recu")} style={LIGNE_CLIQUABLE}>
                <span style={{ ...PASTILLE, borderRadius: "var(--radius-md)" }}>
                  <Icon name="receipt" size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600 }}>{r.titre}</span>
                  <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)" }}>
                    {r.ref} · {r.date}
                  </span>
                </span>
                <span
                  style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "15px", whiteSpace: "nowrap" }}
                >
                  {r.montant}
                </span>
              </button>
            ))}
          </div>

          <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <span style={{ ...TITRE_SECTION, display: "block" }}>Comment vous prévenir</span>
              <span style={{ display: "block", fontSize: "13.5px", color: "var(--text-muted)", marginTop: 4 }}>
                Une réponse de prestataire, une étape validée, un séquestre libéré.
              </span>
            </div>
            {CANAUX.map(([cle, nom, icon, aide]) => {
              const actif = etat.canaux[cle];
              return (
                <div key={cle} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ ...PASTILLE, borderRadius: "var(--radius-md)" }}>
                    <Icon name={icon} size={18} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "14.5px" }}>{nom}</span>
                    <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>{aide}</span>
                  </span>
                  <button
                    onClick={() => set({ canaux: { ...etat.canaux, [cle]: !actif } })}
                    role="switch"
                    aria-checked={actif}
                    aria-label={nom}
                    style={{
                      width: 46,
                      height: 27,
                      flex: "none",
                      borderRadius: "999px",
                      border: 0,
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 140ms",
                      background: actif ? "var(--state-success)" : "var(--argile-200)",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: actif ? 22 : 3,
                        width: 21,
                        height: 21,
                        borderRadius: "999px",
                        background: "#fff",
                        transition: "left 140ms",
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={TITRE_SECTION}>Mes coordonnées</span>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="c-nom">
                Nom
              </label>
              <input id="c-nom" className="sy-input" defaultValue={prenom} />
            </div>
            <div className="sy-field">
              <label className="sy-field__label" htmlFor="c-quartier">
                Quartier
              </label>
              <input id="c-quartier" className="sy-input" defaultValue={etat.auth?.quartier ?? "Habitat"} />
            </div>
            <button className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start" }}>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
