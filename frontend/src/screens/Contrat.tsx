import { RESERVES } from "../data/chantier";
import {
  CLAUSES_CONTRAT,
  ETAPES_CONTRAT,
  ETAPES_PV,
  JALONS_CONTRAT,
  LIGNES_DEVIS,
  MOYENS_PAIEMENT,
  MOYENS_SIGNATURE,
} from "../data/contrat";
import { PROS } from "../data/catalogue";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { canal } from "../components/ui";

const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

/**
 * Du devis accepté au chantier lancé, en cinq étapes.
 *
 * Le même écran sert à signer le procès-verbal de réserves : dans ce contexte
 * le rail disparaît et il ne reste que la signature, pour qu'aucune étape
 * contractuelle ne soit atteignable depuis le PV. Dans les deux cas, rien ne
 * continue tant que la signature n'est pas apposée.
 */
export function Contrat() {
  const { etat, set, ouvrirChat, poserSujetMaison } = useApp();
  const pv = etat.sujetPv;
  const n = etat.contratStep;
  const etapes = pv ? ETAPES_PV : ETAPES_CONTRAT;

  const signer = () => set({ signe: true });

  const taperSign = (t: string) => {
    if (t === "←") {
      set({ signCode: etat.signCode.slice(0, -1) });
      return;
    }
    const c = (etat.signCode + t).slice(0, 6);
    set({ signCode: c, signe: c.length === 6 ? true : etat.signe });
  };

  const continuer = () => {
    // L'étape 5 reste inatteignable tant que le contrat n'est pas signé.
    if (n === 3 && !etat.signe) return;
    set({ contratStep: Math.min(5, n + 1) });
    window.scrollTo(0, 0);
  };

  const retour = () => {
    if (!pv && n > 1) {
      set({ contratStep: n - 1 });
      window.scrollTo(0, 0);
    } else {
      poserSujetMaison({ onglet: pv ? 3 : 1 });
    }
  };

  const historique = [
    { qui: pv ? "Agent Traoré" : "Ent. Bakayoko", quand: "5 septembre 2026 · 09:14", moyen: "Code SMS", etat: "Signé" },
    ...(pv ? [{ qui: "Ent. Bakayoko", quand: "5 septembre 2026 · 10:02", moyen: "Code SMS", etat: "Signé" }] : []),
    etat.signe
      ? { qui: "Aya Konan", quand: "5 septembre 2026 · 11:42", moyen: "Code SMS", etat: "Signé" }
      : { qui: "Aya Konan", quand: "en attente", moyen: "—", etat: "À signer" },
  ];

  const texteActive = pv
    ? etat.signe
      ? "Le PV de réserves est signé par les trois parties. Les réserves doivent être levées dans les délais indiqués, puis la réception devient définitive et le dernier jalon se libère."
      : "Votre signature du PV reste à apposer : revenez à l'étape 3 pour signer, la réception ne peut pas être prononcée sans elle."
    : etat.signe
      ? "Le contrat est signé par les deux parties, l'échéancier est en place. Vous recevrez les rapports hebdomadaires et les demandes de validation dans le projet."
      : "L'échéancier est en place. Votre signature reste à apposer : revenez à l'étape 3 pour signer, le chantier ne démarre qu'ensuite.";

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "26px 20px 80px" }}>
      {!pv && (
        <div data-r="steprail" style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }}>
          {etapes.map((nom, i) => {
            const courante = i + 1 === n;
            const faite = i + 1 < n;
            return (
              <span
                key={nom}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  color: courante ? "var(--kola-600)" : faite ? "var(--state-success)" : "var(--text-muted)",
                  fontWeight: courante ? 700 : 400,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    flex: "none",
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: courante
                      ? "var(--color-accent)"
                      : faite
                        ? "var(--state-success)"
                        : "var(--color-surface)",
                    color: courante || faite ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {i + 1}
                </span>
                {nom}
              </span>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: "13px", margin: "0 0 6px", color: "var(--text-muted)" }}>
        {pv ? "Procès-verbal PV-2026-00458 · visite du mardi 14 avril" : `Étape ${n} sur 5 · ${etapes[n - 1]}`}
      </p>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          fontSize: "clamp(24px,4vw,32px)",
          margin: "0 0 20px",
        }}
      >
        {pv ? "Signature du PV de réserves" : etapes[n - 1]}
      </h1>

      <div className="sy-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ---- 1 · Validation du devis ---- */}
        {!pv && n === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  flex: "none",
                  borderRadius: "var(--radius-md)",
                  background: "var(--kola-50)",
                  color: "var(--kola-600)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                }}
              >
                EB
              </span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "18px" }}>
                  Ent. Bakayoko
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Devis du 2 septembre 2026 · valable 30 jours
                </div>
              </div>
              <span className="sy-badge sy-badge--success">Profil vérifié</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {LIGNES_DEVIS.map((l) => (
                <div
                  key={l.nom}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "11px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "14.5px",
                  }}
                >
                  <span>{l.nom}</span>
                  <span style={{ whiteSpace: "nowrap" }}>{l.montant}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "baseline",
                  paddingTop: 14,
                }}
              >
                <span style={{ fontSize: "15px", color: "var(--text-muted)" }}>Total</span>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 800,
                    fontSize: "26px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  38 500 000 F
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="sy-badge sy-badge--neutral">Délai 6 mois</span>
              <span className="sy-badge sy-badge--neutral">Matériaux inclus</span>
              <span className="sy-badge sy-badge--neutral">6 jalons de paiement</span>
              <span className="sy-badge sy-badge--success">Garantie décennale</span>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => ouvrirChat(PROS[0])} className="sy-btn sy-btn--ghost sy-btn--md">
                Poser une question
              </button>
            </div>
          </div>
        )}

        {/* ---- 2 · Contrat généré ---- */}
        {!pv && n === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--kola-50)",
              }}
            >
              <Icon name="file-signature" size={18} color="var(--kola-600)" style={{ marginTop: 1 }} />
              <span style={{ fontSize: "14px", lineHeight: 1.5 }}>
                Contrat généré à partir du devis accepté et de votre fiche besoin. Relisez chaque clause avant de
                signer.
              </span>
            </div>
            {CLAUSES_CONTRAT.map((c) => (
              <div key={c.titre} style={{ paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--kola-600)",
                    marginBottom: 4,
                  }}
                >
                  {c.titre}
                </div>
                <div style={{ fontSize: "14.5px", lineHeight: 1.55 }}>{c.texte}</div>
              </div>
            ))}
            <button className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start", gap: 8 }}>
              <Icon name="download" size={16} />
              Télécharger le contrat en PDF
            </button>
          </div>
        )}

        {/* ---- Contexte PV : ce que le procès-verbal constate ---- */}
        {pv && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              paddingBottom: 18,
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "18px" }}>
                Ce que le PV constate
              </span>
              <span style={{ flex: "none", whiteSpace: "nowrap", fontSize: "13.5px", color: "var(--text-muted)" }}>
                35 points sur 38 conformes
              </span>
            </div>
            {RESERVES.map((r) => (
              <div
                key={r.ref}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12.5px",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.ref}
                </span>
                <span style={{ flex: 1, minWidth: 170 }}>
                  <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600 }}>{r.titre}</span>
                  <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>
                    {r.resp} · à lever {r.delai}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 11px",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                    background: r.gravite === "Bloquante" ? "var(--state-danger-soft)" : "var(--color-surface)",
                    color: r.gravite === "Bloquante" ? "var(--state-danger)" : "var(--text-muted)",
                  }}
                >
                  {r.gravite}
                </span>
              </div>
            ))}
            <span className="sy-badge sy-badge--brand" style={{ alignSelf: "flex-start" }}>
              <Icon name="lock" size={13} />1 925 000 F retenus jusqu'à la levée
            </span>
          </div>
        )}

        {/* ---- 3 · Signature électronique ---- */}
        {n === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: "14.5px", lineHeight: 1.5, color: "var(--text-muted)" }}>
              {pv
                ? "Signez le procès-verbal de réserves. Le dernier jalon de 5 % reste bloqué jusqu'à la levée des réserves bloquantes."
                : "Choisissez votre moyen de signature."}
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MOYENS_SIGNATURE.map((m, i) => (
                <button key={m.nom} onClick={() => set({ signMoyen: i })} style={canal(etat.signMoyen === i)}>
                  <Icon name={m.icon} size={20} color="var(--kola-600)" />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: "14.5px" }}>{m.nom}</span>
                    <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>{m.info}</span>
                  </span>
                </button>
              ))}
            </div>

            {etat.signMoyen === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Entrez le code reçu par SMS pour signer.
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 52,
                        borderRadius: "var(--radius-md)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        fontSize: "22px",
                        border:
                          etat.signCode.length === i
                            ? "1.5px solid var(--color-accent)"
                            : "1.5px solid var(--border-subtle)",
                        background: etat.signCode.length === i ? "var(--kola-50)" : "var(--surface-card)",
                      }}
                    >
                      {etat.signCode[i] || ""}
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {TOUCHES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => t && taperSign(t)}
                      aria-label={t === "←" ? "Effacer" : t || undefined}
                      style={{
                        minHeight: 46,
                        borderRadius: "var(--radius-md)",
                        font: "inherit",
                        fontSize: "19px",
                        cursor: t ? "pointer" : "default",
                        border: t ? "1px solid var(--border-subtle)" : 0,
                        background: t ? "var(--surface-card)" : "transparent",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {etat.signMoyen === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="sign-mail">
                    Votre adresse e-mail
                  </label>
                  <input id="sign-mail" className="sy-input" placeholder="aya.konan@exemple.ci" style={{ minHeight: 48 }} />
                </div>
                <button onClick={signer} className="sy-btn sy-btn--outline sy-btn--md" style={{ alignSelf: "flex-start" }}>
                  Envoyer le lien de validation
                </button>
              </div>
            )}

            {etat.signMoyen === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    height: 150,
                    border: "1.5px dashed var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--surface-card)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                    Signez ici au doigt ou à la souris
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={signer} className="sy-btn sy-btn--outline sy-btn--md">
                    Valider ma signature
                  </button>
                  <button className="sy-btn sy-btn--ghost sy-btn--md">Effacer</button>
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                paddingTop: 14,
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "16px" }}>
                Historique des signatures
              </span>
              {historique.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "14px" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600 }}>{h.qui}</span>
                    <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>
                      {h.quand} · {h.moyen}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 11px",
                      borderRadius: "999px",
                      whiteSpace: "nowrap",
                      background: h.etat === "Signé" ? "var(--state-success-soft)" : "var(--state-warning-soft)",
                      color: h.etat === "Signé" ? "var(--state-success)" : "var(--state-warning)",
                    }}
                  >
                    {h.etat}
                  </span>
                </div>
              ))}
              <span style={{ fontSize: "12.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Horodatage conservé · archive PDF téléchargeable
              </span>
            </div>
          </div>
        )}

        {/* ---- 4 · Échéancier ---- */}
        {!pv && n === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: "14.5px", color: "var(--text-muted)" }}>
              Échéancier repris du contrat. Chaque jalon est validé après vérification de l'agent.
            </span>
            {JALONS_CONTRAT.map((j) => (
              <div
                key={j.nom}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  flexWrap: "wrap",
                }}
              >
                <span className="sy-badge sy-badge--neutral">{j.pct}</span>
                <span style={{ flex: 1, minWidth: 150 }}>
                  <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>{j.nom}</span>
                  <span style={{ display: "block", fontSize: "12.5px", color: "var(--text-muted)" }}>{j.cond}</span>
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: "16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {j.montant}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MOYENS_PAIEMENT.map((m) => (
                <span key={m} className="sy-badge sy-badge--neutral">
                  {m}
                </span>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--state-warning-soft)",
              }}
            >
              <Icon name="info" size={18} color="var(--state-warning)" style={{ marginTop: 1 }} />
              <span style={{ fontSize: "14px", lineHeight: 1.5 }}>
                Paiement par étapes sécurisé — bientôt disponible. En attendant, chaque jalon est validé manuellement
                par Servis Yakro.
              </span>
            </div>
          </div>
        )}

        {/* ---- 5 · Suivi activé ---- */}
        {!pv && n === 5 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              textAlign: "center",
              padding: "12px 0",
            }}
          >
            <span
              style={{
                width: 60,
                height: 60,
                borderRadius: "999px",
                background: "var(--state-success)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="check" size={30} strokeWidth={2.25} />
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "22px" }}>
              Suivi de chantier activé
            </span>
            <p style={{ fontSize: "14.5px", lineHeight: 1.55, margin: 0, maxWidth: "52ch", color: "var(--text-muted)" }}>
              {texteActive}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => poserSujetMaison({ onglet: 2 })}
                className="sy-btn sy-btn--primary sy-btn--md"
                style={{ minHeight: 48 }}
              >
                Ouvrir le suivi de chantier
              </button>
              <button className="sy-btn sy-btn--outline sy-btn--md" style={{ minHeight: 48, gap: 8 }}>
                <Icon name="download" size={16} />
                Archive PDF
              </button>
            </div>
          </div>
        )}

        {pv && etat.signe && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--state-success-soft)",
              }}
            >
              <Icon name="check" size={18} strokeWidth={2} color="var(--state-success)" style={{ marginTop: 1 }} />
              <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--state-success)" }}>
                PV signé par les trois parties. La réception devient définitive et le dernier jalon se libère dès la
                levée des réserves bloquantes.
              </span>
            </div>
            <button
              onClick={() => poserSujetMaison({ onglet: 3 })}
              className="sy-btn sy-btn--primary sy-btn--md"
              style={{ alignSelf: "flex-start", minHeight: 46 }}
            >
              Suivre la levée des réserves
            </button>
          </>
        )}

        {pv && !etat.signe && (
          <p style={{ fontSize: "13.5px", margin: 0, color: "var(--text-muted)" }}>
            Sans votre signature, la réception ne peut pas être prononcée.
          </p>
        )}

        {!pv && n === 3 && !etat.signe && (
          <p style={{ fontSize: "13.5px", margin: 0, color: "var(--text-muted)" }}>
            Signez le contrat pour continuer : le chantier ne démarre qu'après votre signature.
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            paddingTop: 6,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <button onClick={retour} className="sy-btn sy-btn--outline sy-btn--md" style={{ minHeight: 46 }}>
            Retour
          </button>
          {!pv && n < 5 && (
            <button
              onClick={continuer}
              className="sy-btn sy-btn--primary sy-btn--md"
              disabled={n === 3 && !etat.signe}
              style={{
                flex: 1,
                minWidth: 170,
                justifyContent: "center",
                minHeight: 46,
                ...(n === 3 && !etat.signe ? { opacity: 0.45 } : {}),
              }}
            >
              Continuer
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
