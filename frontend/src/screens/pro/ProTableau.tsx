import { useEffect, useState, type CSSProperties } from "react";
import { api, messageErreur, type TableauPro } from "../../lib/api";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { EspacePro } from "./EspacePro";

/* Tableau de bord du prestataire, selon son secteur : trois indicateurs (un pressing suit ses
   commandes et ses pièces, un technicien les demandes à répondre et ses missions, chacun sa note),
   les demandes reçues jour par jour sur la semaine, ses clients récents, et le suivi de ses
   dernières demandes. Tout vient de la base ; on agit sur une demande dans « Demandes reçues ». */

const GRIS = "var(--argile-700)";
const CARTE: CSSProperties = { background: "var(--surface-card)", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 };
const TEINTES = ["var(--kola-50, #FEF3EC)", "var(--soleil-50, #FFF9E5)", "var(--lagune-50, #E9F5EF)"];
const nombre = (n: number) => n.toLocaleString("fr-FR");
const TON_STATUT: Record<string, string> = { envoyee: "warning", acceptee: "info", en_cours: "info", terminee: "success", confirmee: "success", refusee: "neutral", annulee: "neutral" };

export function ProTableau() {
  const { go } = useApp();
  const [semaine, setSemaine] = useState<0 | 1>(0);
  const [t, setT] = useState<TableauPro | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const arret = new AbortController();
    setErreur(null);
    api.tableauPro(semaine, arret.signal).then(setT, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [semaine]);

  return (
    <EspacePro titre={t ? `Bonjour, ${t.prenom} !` : "Tableau de bord"} sousTitre={t ? `${t.fiche.nom} · ${t.fiche.secteurs.map((s) => s.nom).join(", ") || t.fiche.metier}` : undefined}>
      <div data-r="tableau-pro" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}

        {t && t.commission_due > 0 && (
          <p data-r="commission-due" style={{ margin: 0, padding: "12px 16px", borderRadius: 14, background: "var(--state-warning-soft)", fontSize: "14px" }}>
            <strong>Commission à verser à TerraClick : {nombre(t.commission_due)} F.</strong> L'équipe l'enregistre dès réception.
          </p>
        )}

        {/* Trois indicateurs */}
        <div className="pro-kpis">
          {(t?.kpis ?? [null, null, null]).map((k, i) => (
            <div key={k?.cle ?? i} data-r="indicateur-pro" style={{ ...CARTE, background: TEINTES[i % TEINTES.length], flexDirection: "row", alignItems: "center", padding: 16 }}>
              <span style={{ width: 44, height: 44, flex: "none", borderRadius: 999, background: "var(--surface-card)", display: "grid", placeItems: "center" }}>
                <Icon name={k?.icone ?? "circle-dashed"} size={20} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "13px", color: GRIS }}>{k?.libelle ?? "…"}</span>
                <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <strong style={{ fontFamily: "var(--font-mono)", fontSize: "24px", letterSpacing: "-0.02em" }}>{k ? (k.cle === "note" ? k.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : nombre(k.valeur)) : ""}</strong>
                  {k?.unite && <span style={{ fontSize: "13px", color: GRIS }}>{k.unite}</span>}
                  {k?.detail && <span style={{ fontSize: "12.5px", color: GRIS }}>· {k.detail}</span>}
                </span>
              </span>
            </div>
          ))}
        </div>

        {t && (
          <div className="pro-ligne">
            <Semaine t={t} semaine={semaine} onSemaine={setSemaine} />
            <Clients t={t} onTout={() => go("demandesRecues")} />
          </div>
        )}

        {t && <Suivi t={t} onOuvrir={() => go("demandesRecues")} />}
      </div>
    </EspacePro>
  );
}

/* ---- Les demandes reçues, jour par jour ---- */

function Semaine({ t, semaine, onSemaine }: { t: TableauPro; semaine: 0 | 1; onSemaine: (s: 0 | 1) => void }) {
  const plafond = Math.max(4, t.semaine.max + 1);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const H = 190;
  // Hauteur utile des barres : la pastille de valeur (30 px) tient au-dessus de la plus haute.
  const utile = H - 30;

  return (
    <section style={CARTE} aria-label="Demandes reçues dans la semaine">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "var(--font-heading)", fontWeight: 800 }}>{t.fiche.pressing ? "Commandes reçues" : "Demandes reçues"}</h2>
        <select aria-label="Semaine" value={semaine} onChange={(e) => onSemaine(Number(e.target.value) as 0 | 1)} style={{ border: 0, borderLeft: "1px solid var(--border-subtle)", paddingLeft: 10, background: "transparent", font: "inherit", fontSize: "13.5px", color: GRIS }}>
          <option value={0}>Cette semaine</option>
          <option value={1}>Semaine dernière</option>
        </select>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 6 }}>
          <strong style={{ fontFamily: "var(--font-mono)", fontSize: "22px" }}>{t.semaine.moyenne.toLocaleString("fr-FR")}</strong>
          <span style={{ fontSize: "12.5px", color: GRIS }}>par jour en moyenne</span>
        </span>
      </div>

      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, alignItems: "end", height: H }}>
        {t.semaine.max > 0 && (
          <span aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: `${(t.semaine.max / plafond) * utile}px`, borderTop: "1.5px dashed var(--state-danger)" }}>
            <span style={{ position: "absolute", left: 0, top: -11, fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "var(--state-danger)", color: "#fff" }}>max</span>
          </span>
        )}
        {t.semaine.jours.map((j) => {
          const actif = j.date === aujourdhui;
          const hauteur = j.nombre === null ? 0 : Math.max(6, (j.nombre / plafond) * utile);
          return (
            <div key={j.date} title={j.nombre === null ? "À venir" : `${j.nombre} le ${new Date(j.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 6 }}>
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: actif ? "var(--kola-500)" : "var(--surface-card)", color: actif ? "#fff" : "var(--color-text)", boxShadow: actif ? undefined : "0 0 0 1px var(--border-subtle)" }}>
                {j.nombre === null ? "–" : j.nombre}
              </span>
              <span
                style={{
                  width: "100%",
                  height: hauteur,
                  borderRadius: "10px 10px 4px 4px",
                  background: actif ? "var(--kola-500)" : "repeating-linear-gradient(135deg, var(--argile-100) 0 6px, var(--surface-sunken) 6px 12px)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, textAlign: "center", fontSize: "12.5px", color: GRIS }}>
        {t.semaine.jours.map((j) => (
          <span key={j.date} style={j.date === aujourdhui ? { color: "var(--kola-700)", fontWeight: 700 } : undefined}>
            {new Date(j.date).toLocaleDateString("fr-FR", { weekday: "short" })}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---- Clients récents ---- */

function Clients({ t, onTout }: { t: TableauPro; onTout: () => void }) {
  return (
    <section style={CARTE} aria-label="Mes clients récents">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "var(--font-heading)", fontWeight: 800 }}>Mes clients récents</h2>
      </div>
      {!t.clients.length && <p style={{ margin: 0, fontSize: "14px", color: GRIS }}>Pas encore de client.</p>}
      {t.clients.map((c, i) => (
        <div key={`${c.nom}-${i}`} data-r="client-recent" style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: "var(--argile-100)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "13px" }}>
            {c.nom.slice(0, 2).toUpperCase()}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 600, fontSize: "14.5px" }}>{c.nom}</span>
            <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>{[c.quartier, c.statut_libelle].filter(Boolean).join(" · ")}</span>
          </span>
          {c.telephone && (
            <a href={`tel:+225${c.telephone.replace(/\D/g, "")}`} aria-label={`Appeler ${c.nom}`} className="sy-iconbtn sy-iconbtn--sm">
              <Icon name="phone" size={17} />
            </a>
          )}
        </div>
      ))}
      <button onClick={onTout} className="sy-btn sy-btn--outline sy-btn--md" style={{ marginTop: "auto", gap: 8 }}>
        <Icon name="inbox" size={17} />
        Toutes mes demandes
      </button>
    </section>
  );
}

/* ---- Suivi des dernières demandes ---- */

function Anneau({ part }: { part: number }) {
  const R = 11;
  const C = 2 * Math.PI * R;
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" aria-hidden style={{ flex: "none" }}>
      <circle cx={14} cy={14} r={R} fill="none" stroke="var(--argile-100)" strokeWidth={4} />
      {part > 0 && <circle cx={14} cy={14} r={R} fill="none" stroke="var(--kola-500)" strokeWidth={4} strokeDasharray={`${(C * part) / 100} ${C}`} strokeLinecap="round" transform="rotate(-90 14 14)" />}
    </svg>
  );
}

function Suivi({ t, onOuvrir }: { t: TableauPro; onOuvrir: () => void }) {
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const nouvelles = t.suivi.filter((s) => s.statut === "envoyee").length;
  const lignes = t.suivi.filter((s) => (!statut || s.statut === statut) && (!q.trim() || `${s.intitule} ${s.reference} ${s.quartier ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())));
  const th: CSSProperties = { textAlign: "left", fontWeight: 500, fontSize: "12.5px", color: GRIS, padding: "0 10px 10px 0", whiteSpace: "nowrap" };
  const td: CSSProperties = { padding: "12px 10px 12px 0", borderTop: "1px solid var(--border-subtle)", fontSize: "14px", whiteSpace: "nowrap" };

  return (
    <section style={{ ...CARTE, background: "transparent", padding: "4px 0 0" }} aria-label="Suivi de mes demandes">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "var(--font-heading)", fontWeight: 800 }}>{t.fiche.pressing ? "Suivi de mes commandes" : "Suivi de mes demandes"}</h2>
        {nouvelles > 0 && <span className="sy-badge sy-badge--success">+{nouvelles} nouvelle{nouvelles > 1 ? "s" : ""}</span>}
        <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="sy-input" type="search" aria-label="Chercher une demande" placeholder="Chercher…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minHeight: 38, width: 180 }} />
          <select className="sy-input" aria-label="Statut" value={statut} onChange={(e) => setStatut(e.target.value)} style={{ minHeight: 38, width: 160 }}>
            <option value="">Tous les statuts</option>
            <option value="envoyee">À répondre</option>
            <option value="acceptee">Acceptées</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">À confirmer</option>
            <option value="confirmee">Terminées</option>
          </select>
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table data-r="suivi-pro" style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
          <thead>
            <tr>
              <th style={th}>Demande</th>
              <th style={th}>Avancement</th>
              <th style={th}>Reçue le</th>
              <th style={th}>Créneau</th>
              <th style={th}>Statut</th>
              <th style={{ ...th, textAlign: "right" }}>Montant</th>
              <th style={th} aria-label="Ouvrir" />
            </tr>
          </thead>
          <tbody>
            {lignes.map((s) => (
              <tr key={s.id} data-r="ligne-suivi-pro">
                <td style={td}>
                  <strong>{s.intitule}</strong>
                  <span style={{ color: GRIS, fontSize: "12.5px" }}> · {s.quartier ?? s.reference}</span>
                </td>
                <td style={td}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Anneau part={s.avancement} />
                    {s.avancement} %
                  </span>
                </td>
                <td style={td}>{s.recue_le ? new Date(s.recue_le).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</td>
                <td style={td}>{s.creneau ?? "—"}</td>
                <td style={td}>
                  <span className={`sy-badge sy-badge--${TON_STATUT[s.statut] ?? "neutral"}`}>{s.statut_libelle}</span>
                </td>
                <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.montant ? `${nombre(s.montant)} F` : "—"}</td>
                <td style={{ ...td, width: 40 }}>
                  <button onClick={onOuvrir} className="sy-iconbtn sy-iconbtn--sm" aria-label={`Ouvrir ${s.reference}`}>
                    <Icon name="ellipsis-vertical" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lignes.length && <p style={{ margin: 0, padding: "18px 0", color: GRIS, fontSize: "14px" }}>Rien ici pour l'instant.</p>}
      </div>
    </section>
  );
}
