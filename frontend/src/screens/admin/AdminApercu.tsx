import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { api, messageErreur, type TableauAdmin } from "../../lib/api";
import { useApp } from "../../state/app";
import type { Ecran } from "../../state/types";
import { Icon } from "../../components/Icon";
import { EspaceAdmin, GRIS } from "./EspaceAdmin";

/* Vue d'ensemble, disposée comme un tableau de bord d'analyse : en haut la période et la ville ;
   ce qui attend l'équipe ; cinq indicateurs comparés à la période précédente ; la courbe des
   demandes et des annulations jour par jour à côté du parcours d'une demande (envoyée → confirmée) ;
   puis les clients actifs, les demandes par secteur et les quartiers. Tout vient de la base. */

/** Couleurs des secteurs, dans un ordre fixe (validées : daltonisme, contraste). La couleur suit le
    secteur — celle choisie par l'administrateur, sinon celle de sa place dans le catalogue. */
const PALETTE = ["#E25B1A", "#1F5FA8", "#1F7A57", "#B88700", "#8E3B8A", "#3A8FB7"];
const SERIE = "var(--kola-500)";
const SERIE_2 = "var(--argile-400, #A89D8F)";

const CARTE: CSSProperties = { background: "var(--surface-card)", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 };
const TITRE: CSSProperties = { margin: 0, fontSize: "14.5px", fontWeight: 600, color: GRIS };
const CHIFFRE: CSSProperties = { fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 };

const nombre = (n: number) => n.toLocaleString("fr-FR");
const valeur = (n: number, format: TableauAdmin["kpis"][number]["format"]) => (format === "francs" ? `${nombre(n)} F` : format === "pourcent" ? `${n.toLocaleString("fr-FR")} %` : nombre(n));
// Trop peu d'éléments la période d'avant : un pourcentage n'aurait pas de sens (« +8000 % »).
const ecart = (v: number, avant: number) => (avant >= 5 ? Math.round(((v - avant) * 100) / avant) : null);

export function AdminApercu() {
  const { go } = useApp();
  const [jours, setJours] = useState(7);
  const [ville, setVille] = useState("");
  const [t, setT] = useState<TableauAdmin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const arret = new AbortController();
    setErreur(null);
    api.admin.tableau({ jours, ville: ville ? Number(ville) : undefined }, arret.signal).then(setT, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [jours, ville]);

  const urgentes: { libelle: string; n: number | undefined; icone: string; ecran: Ecran }[] = [
    { libelle: "candidatures à vérifier", n: t?.a_traiter.candidatures, icone: "badge-check", ecran: "adminCandidatures" },
    { libelle: "signalements ouverts", n: t?.a_traiter.signalements, icone: "flag", ecran: "adminSignalements" },
    { libelle: "demandes sans réponse depuis 2 h", n: t?.a_traiter.demandes_sans_reponse, icone: "clock", ecran: "adminDemandes" },
  ];

  const selecteur: CSSProperties = { minHeight: 40, borderRadius: 999, padding: "0 14px", fontSize: "13.5px", fontWeight: 600, background: "var(--surface-card)", border: "1px solid var(--border-subtle)" };

  return (
    <EspaceAdmin
      titre="Vue d'ensemble"
      actions={
        <span data-r="filtres-tableau" className="tableau-filtres">
          <select aria-label="Période" value={jours} onChange={(e) => setJours(Number(e.target.value))} style={selecteur}>
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
          </select>
          <select aria-label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} style={selecteur}>
            <option value="">Toutes les villes</option>
            {t?.villes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nom}
              </option>
            ))}
          </select>
        </span>
      }
    >
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}

      {/* Ce qui attend l'équipe */}
      <div data-r="admin-a-traiter" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {urgentes.map((u) => (
          <button
            key={u.libelle}
            onClick={() => go(u.ecran)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, border: 0, cursor: "pointer", font: "inherit", fontSize: "13.5px", background: u.n ? "var(--kola-100)" : "var(--surface-card)", color: u.n ? "var(--kola-700)" : GRIS }}
          >
            <Icon name={u.icone} size={16} />
            <strong data-r="valeur-tuile" style={{ fontFamily: "var(--font-mono)" }}>{u.n ?? "…"}</strong>
            {u.libelle}
          </button>
        ))}
      </div>

      {/* Indicateurs */}
      <div data-r="admin-chiffres" className="tableau-kpis">
        {(t?.kpis ?? Array.from({ length: 5 }, () => null)).map((k, i) => (
          <Indicateur key={k?.cle ?? i} k={k} jours={jours} />
        ))}
      </div>

      {t && (
        <>
          <div className="tableau-ligne tableau-ligne--courbe">
            <Courbe t={t} />
            <Parcours t={t} />
          </div>
          <div className="tableau-ligne tableau-ligne--bas">
            <Clients t={t} />
            <Secteurs t={t} />
            <Quartiers t={t} />
          </div>
        </>
      )}
    </EspaceAdmin>
  );
}

/* ---- Indicateur : libellé, écart, valeur, phrase ---- */

function Indicateur({ k, jours }: { k: TableauAdmin["kpis"][number] | null; jours: number }) {
  if (!k) return <div style={{ ...CARTE, minHeight: 112 }} aria-busy="true" />;
  const e = ecart(k.valeur, k.precedent);
  const monte = k.valeur > k.precedent;
  const bien = k.valeur === k.precedent ? null : (monte ? k.bon === "hausse" : k.bon === "baisse");
  const ton = bien === null ? "neutral" : bien ? "success" : "danger";

  return (
    <div data-r="indicateur" style={CARTE}>
      <span style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={TITRE}>{k.libelle}</span>
        {e !== null && e !== 0 && <span className={`sy-badge sy-badge--${ton}`}>{`${e > 0 ? "+" : ""}${e} %`}</span>}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span data-r="valeur-tuile" className="tableau-valeur" style={CHIFFRE}>
          {valeur(k.valeur, k.format)}
        </span>
        {k.valeur !== k.precedent && (
          <span aria-hidden style={{ width: 20, height: 20, borderRadius: 999, display: "grid", placeItems: "center", background: `var(--state-${ton === "neutral" ? "warning" : ton}-soft)`, color: `var(--state-${ton === "neutral" ? "warning" : ton})` }}>
            <Icon name="arrow-right" size={12} style={{ transform: `rotate(${monte ? -90 : 90}deg)` }} />
          </span>
        )}
      </span>
      <span style={{ fontSize: "12.5px", color: GRIS }}>
        {k.valeur === k.precedent
          ? `Stable sur ${jours} jours`
          : e === null
            ? `${valeur(k.precedent, k.format)} la période d'avant`
            : `${monte ? "En hausse" : "En baisse"} de ${Math.abs(e)} % sur ${jours} jours`}
      </span>
    </div>
  );
}

/* ---- Courbe : demandes et annulations, jour par jour ---- */

function lisse(points: [number, number][]): string {
  if (!points.length) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

function Courbe({ t }: { t: TableauAdmin }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const L = 640;
  const H = 210;
  const G = 34;
  const B = 24;
  const n = t.courbe.length;
  const plafond = useMemo(() => {
    const m = Math.max(4, ...t.courbe.map((c) => c.demandes));
    const pas = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / pas) * pas;
  }, [t.courbe]);
  const x = (i: number) => G + (n > 1 ? (i * (L - G - 8)) / (n - 1) : 0);
  const y = (v: number) => H - B - (v / plafond) * (H - B - 10);
  const serie = (cle: "demandes" | "annulees") => t.courbe.map((c, i) => [x(i), y(c[cle])] as [number, number]);
  const principale = lisse(serie("demandes"));
  const pasEtiquettes = n <= 7 ? 1 : n <= 30 ? 5 : 15;
  const etiquette = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", n <= 7 ? { weekday: "short" } : { day: "numeric", month: "short" });
  const tc = t.totaux_courbe;
  const ed = ecart(tc.demandes, tc.demandes_avant);
  const ea = ecart(tc.annulees, tc.annulees_avant);
  const point = survol !== null ? t.courbe[survol] : null;

  return (
    <section style={CARTE} aria-label="Demandes et annulations">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={TITRE}>Demandes et annulations</h2>
          <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
            {ed === null ? "Trop peu de demandes la période d'avant pour comparer." : `Demandes ${ed >= 0 ? "en hausse" : "en baisse"} de ${Math.abs(ed)} %${ea === null ? "" : `, annulations ${ea >= 0 ? "en hausse" : "en baisse"} de ${Math.abs(ea)} %`}.`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          {(
            [
              ["Demandes", tc.demandes, ed, SERIE, "hausse"],
              ["Annulations", tc.annulees, ea, SERIE_2, "baisse"],
            ] as const
          ).map(([nom, v, e, couleur, bon]) => (
            <span key={nom} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12.5px" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: couleur }} />
                {nom}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...CHIFFRE, fontSize: "28px" }}>{nombre(v)}</span>
                {e !== null && e !== 0 && <span className={`sy-badge sy-badge--${(e > 0) === (bon === "hausse") ? "success" : "danger"}`}>{`${e > 0 ? "+" : ""}${e} %`}</span>}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }} onMouseLeave={() => setSurvol(null)}>
        <svg viewBox={`0 0 ${L} ${H}`} width="100%" role="img" aria-label={`Demandes par jour, du ${t.periode.du} au ${t.periode.au}`} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="tableau-aire" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--kola-500)" stopOpacity="0.16" />
              <stop offset="1" stopColor="var(--kola-500)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={G} x2={L - 4} y1={y(plafond * f)} y2={y(plafond * f)} stroke="var(--border-subtle)" strokeDasharray="4 5" />
              <text x={G - 8} y={y(plafond * f) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted, #8A8076)">
                {nombre(Math.round(plafond * f))}
              </text>
            </g>
          ))}
          {principale && <path d={`${principale} L${x(n - 1)},${H - B} L${x(0)},${H - B} Z`} fill="url(#tableau-aire)" />}
          <path d={lisse(serie("annulees"))} fill="none" stroke={SERIE_2} strokeWidth={2} />
          <path d={principale} fill="none" stroke={SERIE} strokeWidth={2} />
          {t.courbe.map((c, i) =>
            i % pasEtiquettes === 0 || i === n - 1 ? (
              <text key={c.date} x={x(i)} y={H - 4} textAnchor="middle" fontSize="11" fontWeight={survol === i ? 700 : 400} fill="var(--text-muted, #8A8076)">
                {etiquette(c.date)}
              </text>
            ) : null,
          )}
          {survol !== null && point && (
            <g>
              <line x1={x(survol)} x2={x(survol)} y1={8} y2={H - B} stroke="var(--border-subtle)" />
              <circle cx={x(survol)} cy={y(point.annulees)} r={5} fill={SERIE_2} stroke="var(--surface-card)" strokeWidth={2} />
              <circle cx={x(survol)} cy={y(point.demandes)} r={5} fill={SERIE} stroke="var(--surface-card)" strokeWidth={2} />
            </g>
          )}
          {t.courbe.map((c, i) => (
            <rect key={c.date} x={x(i) - (L - G) / n / 2} y={0} width={(L - G) / n} height={H - B} fill="transparent" onMouseEnter={() => setSurvol(i)} onFocus={() => setSurvol(i)} />
          ))}
        </svg>
        {survol !== null && point && (
          <div
            role="tooltip"
            style={{
              position: "absolute",
              top: 4,
              left: `${(x(survol) / L) * 100}%`,
              transform: `translateX(${survol > n / 2 ? "calc(-100% - 12px)" : "12px"})`,
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: "12.5px",
              boxShadow: "0 6px 18px rgba(26,22,19,.08)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ display: "block", color: GRIS }}>{new Date(point.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
            <strong style={{ display: "block" }}>{nombre(point.demandes)} demande{point.demandes > 1 ? "s" : ""}</strong>
            <span style={{ display: "block" }}>{nombre(point.annulees)} annulée{point.annulees > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---- Parcours d'une demande : envoyée → acceptée → terminée → confirmée ---- */

function Parcours({ t }: { t: TableauAdmin }) {
  const finale = t.entonnoir[t.entonnoir.length - 1];

  return (
    <section style={CARTE} aria-label="Parcours d'une demande">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={TITRE}>Parcours des demandes</h2>
          <p style={{ margin: "6px 0 0", fontSize: "13px" }}>De l'envoi à la confirmation par le client</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ display: "block", fontSize: "12.5px" }}>Taux de réussite</span>
          <span style={{ ...CHIFFRE, fontSize: "28px" }}>{finale.part} %</span>
        </div>
      </div>
      <div data-r="parcours-demandes" style={{ display: "grid", gridTemplateColumns: `repeat(${t.entonnoir.length}, 1fr)`, gap: 10, alignItems: "end", flex: 1, minHeight: 170 }}>
        {t.entonnoir.map((e) => (
          <div key={e.libelle} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }} title={`${e.libelle} : ${e.nombre} (${e.part} %)`}>
            <span style={{ fontSize: "12.5px", fontWeight: 600 }}>{e.part} %</span>
            <span style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120 }}>
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(e.part, 3)}%`,
                    borderRadius: "4px 4px 0 0",
                    background: i === 0 ? "var(--kola-500)" : "var(--argile-100)",
                  }}
                />
              ))}
            </span>
            <span style={{ fontSize: "12.5px", color: GRIS }}>{e.libelle}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700 }}>{nombre(e.nombre)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---- Clients actifs : jauge ---- */

function Clients({ t }: { t: TableauAdmin }) {
  const part = t.clients.inscrits ? Math.min(1, t.clients.actifs / t.clients.inscrits) : 0;
  const R = 80;
  const longueur = Math.PI * R;

  return (
    <section style={CARTE} aria-label="Clients actifs">
      <h2 style={TITRE}>Clients actifs</h2>
      <div style={{ position: "relative", display: "grid", placeItems: "center", flex: 1 }}>
        <svg viewBox="0 0 200 112" width="100%" style={{ maxWidth: 240 }} role="img" aria-label={`${t.clients.actifs} clients actifs sur ${t.clients.inscrits} inscrits`}>
          <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="var(--argile-100)" strokeWidth={14} strokeLinecap="round" />
          <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="var(--kola-500)" strokeWidth={14} strokeLinecap="round" strokeDasharray={`${longueur * part} ${longueur}`} />
        </svg>
        <span style={{ position: "absolute", bottom: 4, textAlign: "center" }}>
          <span style={{ ...CHIFFRE, display: "block", fontSize: "28px" }}>{nombre(t.clients.actifs)}</span>
          <span style={{ fontSize: "12.5px", color: GRIS }}>ont fait une demande</span>
        </span>
      </div>
      <span style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
        <span style={{ color: GRIS }}>Comptes inscrits</span>
        <strong style={{ fontFamily: "var(--font-mono)" }}>{nombre(t.clients.inscrits)}</strong>
      </span>
    </section>
  );
}

/* ---- Demandes par secteur : barre empilée et légende ---- */

function Secteurs({ t }: { t: TableauAdmin }) {
  const total = t.secteurs.reduce((n, s) => n + s.nombre, 0);
  const couleur = (cle: string, i: number) => t.secteurs.find((s) => s.cle === cle)?.couleur ?? PALETTE[i % PALETTE.length];
  // L'ordre des couleurs suit le catalogue, pas le classement de la période.
  const ordre = useMemo(() => [...t.secteurs].sort((a, b) => a.cle.localeCompare(b.cle)).map((s) => s.cle), [t.secteurs]);
  const teinte = (cle: string) => couleur(cle, ordre.indexOf(cle));
  const entetes: [string, string][] = [
    ["Encaissé", `${nombre(t.activite.encaisse)} F`],
    ["Panier moyen", `${nombre(t.activite.panier_moyen)} F`],
    ["Recherches", nombre(t.activite.recherches)],
    ["Avis publiés", nombre(t.activite.avis)],
  ];

  return (
    <section style={CARTE} aria-label="Demandes par secteur">
      <h2 style={TITRE}>Demandes par secteur</h2>
      <div className="tableau-entetes">
        {entetes.map(([libelle, v]) => (
          <span key={libelle} style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "12px", color: GRIS }}>{libelle}</span>
            <strong style={{ display: "block", fontSize: "13.5px", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</strong>
          </span>
        ))}
      </div>
      <div data-r="barre-secteurs" style={{ display: "flex", gap: 2, height: 8 }}>
        {total ? (
          t.secteurs
            .filter((s) => s.nombre)
            .map((s) => <span key={s.cle} title={`${s.nom} : ${s.nombre}`} style={{ width: `${(s.nombre / total) * 100}%`, borderRadius: 4, background: teinte(s.cle) }} />)
        ) : (
          <span style={{ flex: 1, borderRadius: 4, background: "var(--argile-100)" }} />
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 18px" }}>
        {t.secteurs.map((s) => (
          <span key={s.cle} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px" }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: teinte(s.cle), flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0, color: GRIS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.nom}</span>
            <strong style={{ fontFamily: "var(--font-mono)" }}>{nombre(s.nombre)}</strong>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---- Demandes par quartier ---- */

function Quartiers({ t }: { t: TableauAdmin }) {
  const cellule = (contenu: ReactNode, droite = false): CSSProperties => ({ padding: "9px 0", borderTop: "1px solid var(--border-subtle)", textAlign: droite ? "right" : "left", fontSize: "13.5px", ...(contenu ? {} : {}) });

  return (
    <section style={CARTE} aria-label="Demandes par quartier">
      <h2 style={TITRE}>Demandes par quartier</h2>
      {!t.quartiers.length ? (
        <p style={{ margin: 0, fontSize: "13.5px", color: GRIS }}>Aucune demande sur la période.</p>
      ) : (
        <table data-r="quartiers-tableau" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ fontSize: "12.5px", color: GRIS }}>
              <th style={{ textAlign: "left", fontWeight: 500, paddingBottom: 4 }}>Quartier</th>
              <th style={{ textAlign: "left", fontWeight: 500, paddingBottom: 4 }}>Demandes</th>
              <th style={{ textAlign: "right", fontWeight: 500, paddingBottom: 4 }}>Encaissé</th>
            </tr>
          </thead>
          <tbody>
            {t.quartiers.map((q) => (
              <tr key={q.nom}>
                <td style={cellule(q.nom)}>{q.nom}</td>
                <td style={cellule(q.demandes)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)" }}>
                    {nombre(q.demandes)}
                    {q.tendance !== 0 && (
                      <span aria-label={q.tendance > 0 ? "en hausse" : "en baisse"} style={{ color: q.tendance > 0 ? "var(--state-success)" : "var(--state-danger)", display: "inline-flex" }}>
                        <Icon name="arrow-right" size={12} style={{ transform: `rotate(${q.tendance > 0 ? -90 : 90}deg)` }} />
                      </span>
                    )}
                  </span>
                </td>
                <td style={{ ...cellule(q.encaisse, true), fontFamily: "var(--font-mono)" }}>{nombre(q.encaisse)} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
