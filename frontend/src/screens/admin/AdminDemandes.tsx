import { useEffect, useState } from "react";
import { SECTEURS } from "../../data/catalogue";
import { api, messageErreur, type DemandeAdmin } from "../../lib/api";
import { Icon } from "../../components/Icon";
import { EspaceAdmin, Filtres, GRIS, Recherche, TITRE_CARTE, Vide, dateHeure } from "./EspaceAdmin";

/* Toutes les demandes et commandes : filtrées par statut et par service, cherchées par
   référence, client ou prestataire ; le détail montre le suivi et les signalements. */

const STATUTS = [
  { cle: "", nom: "Toutes" },
  { cle: "envoyee", nom: "En attente" },
  { cle: "acceptee", nom: "Acceptées" },
  { cle: "en_cours", nom: "En cours" },
  { cle: "terminee", nom: "À confirmer" },
  { cle: "confirmee", nom: "Accomplies" },
  { cle: "annulee", nom: "Annulées" },
  { cle: "refusee", nom: "Refusées" },
];

const TON: Record<string, string> = { envoyee: "warning", acceptee: "info", en_cours: "info", terminee: "warning", confirmee: "success", annulee: "neutral", refusee: "neutral" };

export function AdminDemandes() {
  const [statut, setStatut] = useState("");
  const [secteur, setSecteur] = useState("");
  const [q, setQ] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [resultat, setResultat] = useState<{ data: DemandeAdmin[]; meta: { page: number; derniere: number; total: number } } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<DemandeAdmin | null>(null);

  // La recherche part un instant après la dernière frappe.
  useEffect(() => {
    const t = setTimeout(() => {
      setRecherche(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const arret = new AbortController();
    api.admin.demandes({ statut: statut || undefined, secteur: secteur || undefined, q: recherche || undefined, page }, arret.signal).then(setResultat, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [statut, secteur, recherche, page]);

  const ouvrir = async (d: DemandeAdmin) => {
    setOuverte(d);
    try {
      setOuverte(await api.admin.demande(d.id));
    } catch {
      /* le résumé de la liste suffit */
    }
  };

  if (ouverte) return <DetailDemande d={ouverte} onRetour={() => setOuverte(null)} />;

  return (
    <EspaceAdmin titre="Demandes et commandes" sousTitre={resultat ? `${resultat.meta.total} au total avec ces filtres.` : undefined}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Recherche valeur={q} onChange={setQ} placeholder="Référence, client ou prestataire" />
        <div className="sy-select-wrap" style={{ flex: "none", minWidth: 170 }}>
          <select className="sy-select" aria-label="Service" value={secteur} onChange={(e) => (setSecteur(e.target.value), setPage(1))}>
            <option value="">Tous les services</option>
            {SECTEURS.map((s) => (
              <option key={s.cle} value={s.cle}>
                {s.nom}
              </option>
            ))}
          </select>
          <span className="sy-select-wrap__caret">
            <Icon name="chevron-down" size={18} />
          </span>
        </div>
      </div>
      <Filtres options={STATUTS} valeur={statut} onChange={(v) => (setStatut(v), setPage(1))} />
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}
      {resultat?.data.length === 0 && <Vide texte="Aucune demande avec ces filtres." />}

      {resultat && resultat.data.length > 0 && (
        <div className="sy-card" style={{ overflow: "hidden" }}>
          {resultat.data.map((d, i) => (
            <button
              key={d.id}
              data-r="demande-admin"
              onClick={() => ouvrir(d)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: 0, borderTop: i ? "1px solid var(--border-subtle)" : 0, background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}
            >
              <span style={{ width: 38, height: 38, flex: "none", borderRadius: 999, background: "var(--argile-100)", display: "grid", placeItems: "center" }}>
                <Icon name={SECTEURS.find((s) => s.cle === d.secteur.cle)?.icone ?? "wrench"} size={18} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: "14.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.resume}</span>
                <span style={{ display: "block", fontSize: "12.5px", color: GRIS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {d.reference} · {d.client.nom ?? "Client"} → {d.prestataire?.nom ?? "—"} · {dateHeure(d.cree_le)}
                </span>
              </span>
              <span className={`sy-badge sy-badge--${TON[d.statut] ?? "neutral"}`} style={{ flex: "none" }}>
                {d.commande?.etape_libelle ?? d.statut_libelle}
              </span>
            </button>
          ))}
        </div>
      )}

      {resultat && resultat.meta.derniere > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button className="sy-btn sy-btn--outline sy-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédentes
          </button>
          <span style={{ fontSize: "13.5px", color: GRIS }}>
            Page {resultat.meta.page} sur {resultat.meta.derniere}
          </span>
          <button className="sy-btn sy-btn--outline sy-btn--sm" disabled={page >= resultat.meta.derniere} onClick={() => setPage((p) => p + 1)}>
            Suivantes
          </button>
        </div>
      )}
    </EspaceAdmin>
  );
}

function DetailDemande({ d, onRetour }: { d: DemandeAdmin; onRetour: () => void }) {
  const suivi = d.commande?.suivi ?? d.suivi ?? [];
  const lignes: [string, string | null | undefined][] = [
    ["Référence", d.reference],
    ["Service", d.secteur.nom],
    ["Demande", d.resume],
    ["Détail", d.precision],
    ["Client", [d.client.nom, d.client.telephone].filter(Boolean).join(" · ")],
    ["Prestataire", d.prestataire ? `${d.prestataire.nom} · ${d.prestataire.metier}` : null],
    ["Adresse", [d.commande?.adresse, d.quartier?.nom, d.repere].filter(Boolean).join(" · ")],
    ["Montant", d.pack?.total_affichage ?? (d.estimation !== null ? `${d.estimation.toLocaleString("fr-FR")} F (estimation)` : null)],
    ["Paiement", d.paiement_libelle],
    ["Statut", d.commande?.etape_libelle ?? d.statut_libelle],
    ["Créée le", dateHeure(d.cree_le)],
  ];

  return (
    <EspaceAdmin titre={d.reference}>
      <button onClick={onRetour} className="sy-btn sy-btn--ghost sy-btn--sm" style={{ alignSelf: "flex-start", gap: 6 }}>
        <Icon name="arrow-left" size={16} />
        Toutes les demandes
      </button>
      <div data-r="detail-demande-admin" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
        <div className="sy-card">
          <dl className="sy-card__body" style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: "14px" }}>
            {lignes
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt style={{ color: GRIS }}>{k}</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{v}</dd>
                </div>
              ))}
          </dl>
        </div>
        <div className="sy-card">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={TITRE_CARTE}>Suivi</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {suivi.map((e) => (
                <li key={e.cle} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "14px", color: e.fait ? "var(--color-text)" : GRIS }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, flex: "none", background: e.fait ? "var(--state-success)" : "var(--argile-200, #DDD3C8)" }} />
                  <span style={{ flex: 1 }}>{e.libelle}</span>
                  {e.date && <span style={{ fontSize: "12.5px", color: GRIS }}>{dateHeure(e.date)}</span>}
                </li>
              ))}
            </ol>
            {d.pack && (
              <>
                <h3 style={{ ...TITRE_CARTE, marginTop: 8 }}>Articles</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "14px" }}>
                  {d.pack.articles.map((a) => (
                    <li key={a.cle}>
                      {a.quantite} × {a.nom}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(d.signalements ?? []).length > 0 && (
              <>
                <h3 style={{ ...TITRE_CARTE, marginTop: 8 }}>Signalements</h3>
                {d.signalements!.map((s) => (
                  <p key={s.id} style={{ margin: 0, padding: "8px 12px", borderRadius: 10, background: "var(--state-danger-soft)", fontSize: "13.5px" }}>
                    <strong>{s.motif_libelle}</strong>
                    {s.message ? ` — ${s.message}` : ""} · {s.statut === "ouvert" ? "à traiter" : "traité"}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </EspaceAdmin>
  );
}
