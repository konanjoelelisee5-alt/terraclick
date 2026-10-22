import { useEffect, useState, type CSSProperties } from "react";
import { api, messageErreur, type FinancesAdmin } from "../../lib/api";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Dialogue } from "../../components/Dialogue";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, Filtres, GRIS, TITRE_CARTE, Vide, dateCourte } from "./EspaceAdmin";
import { Stats } from "./Gabarit";

/* Finances : commission globale et par secteur, négociation directe, moyens de paiement proposés
   aux clients ; montants encaissés par les prestataires, commissions dues, paiements reçus,
   prestataires qui n'ont pas payé ; rapports CSV (Excel). Aucun argent ne passe par TerraClick :
   le prestataire verse sa commission, l'équipe enregistre le versement. */

const francs = (n: number) => `${n.toLocaleString("fr-FR")} F`;
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const debutDuMois = () => aujourdhui().slice(0, 8) + "01";

export function AdminFinances() {
  const { etat } = useApp();
  const toast = useToast();
  const gerer = peut(etat.auth, "finances.gerer");
  const [du, setDu] = useState(debutDuMois());
  const [au, setAu] = useState(aujourdhui());
  const [f, setF] = useState<FinancesAdmin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [vue, setVue] = useState<"impayes" | "tous">("impayes");
  const [version, setVersion] = useState(0);
  const [paiement, setPaiement] = useState<{ id: number; nom: string; solde: number } | null>(null);

  useEffect(() => {
    const arret = new AbortController();
    setErreur(null);
    api.admin.finances({ du, au }, arret.signal).then(setF, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [du, au, version]);

  const recharger = () => setVersion((v) => v + 1);
  const exporter = async (rapport: "missions" | "prestataires" | "paiements") => {
    try {
      await api.admin.exporterFinances(rapport, { du, au });
    } catch (e) {
      toast("Export impossible", messageErreur(e), "danger");
    }
  };

  const tuiles: [string, string, string?][] = f
    ? [
        ["Missions accomplies", String(f.totaux.missions)],
        ["Encaissé par les prestataires", francs(f.totaux.encaisse)],
        ["Commissions de la période", francs(f.totaux.commissions)],
        ["Commissions payées", francs(f.totaux.paye)],
        ["Reste dû (tout)", francs(f.totaux.reste_du), `${f.totaux.impayes} prestataire${f.totaux.impayes > 1 ? "s" : ""}`],
      ]
    : [];
  const prestataires = (f?.prestataires ?? []).filter((p) => vue === "tous" || p.solde > 0);

  return (
    <EspaceAdmin titre="Finances" sousTitre="Aucun argent ne passe par TerraClick : le client paie le prestataire, qui verse ensuite sa commission.">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", color: GRIS }}>
          Du
          <input className="sy-input" type="date" aria-label="Du" value={du} onChange={(e) => setDu(e.target.value)} style={{ minHeight: 40 }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", color: GRIS }}>
          Au
          <input className="sy-input" type="date" aria-label="Au" value={au} onChange={(e) => setAu(e.target.value)} style={{ minHeight: 40 }} />
        </label>
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          {(
            [
              ["missions", "Missions"],
              ["prestataires", "Prestataires"],
              ["paiements", "Paiements"],
            ] as const
          ).map(([cle, nom]) => (
            <button key={cle} data-r={`export-${cle}`} onClick={() => exporter(cle)} className="sy-btn sy-btn--outline sy-btn--sm" style={{ gap: 6 }}>
              <Icon name="download" size={15} />
              {nom} (CSV)
            </button>
          ))}
        </span>
      </div>
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}

      {f && (
        <div data-r="totaux-finances">
          <Stats
            colonnes={5}
            items={tuiles.map(([libelle, valeur, detail]) => ({
              libelle,
              valeur,
              detail,
              badge: detail && f.totaux.impayes ? { texte: "Impayés", ton: "danger" as const } : undefined,
            }))}
          />
        </div>
      )}

      {f && <Reglages f={f} gerer={gerer} onMaj={recharger} />}

      {f && (
        <section className="sy-card" aria-label="Prestataires et commissions">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={TITRE_CARTE}>Prestataires et commissions</h2>
            <Filtres
              options={[
                { cle: "impayes" as const, nom: `Commission impayée (${f.totaux.impayes})` },
                { cle: "tous" as const, nom: "Tous" },
              ]}
              valeur={vue}
              onChange={setVue}
            />
            {!prestataires.length && <Vide texte={vue === "impayes" ? "Aucun prestataire ne doit de commission." : "Aucune mission ni aucun paiement sur la période."} />}
            {prestataires.map((p) => (
              <div key={p.id} data-r="solde-prestataire" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: "14.5px" }}>{p.nom}</span>
                  <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
                    {p.missions} mission{p.missions > 1 ? "s" : ""} · encaissé {francs(p.encaisse)} · commissions {francs(p.commissions)} · payé {francs(p.paye)}
                    {p.dernier_paiement ? ` · dernier paiement le ${dateCourte(p.dernier_paiement)}` : ""}
                  </span>
                </span>
                <span className={`sy-badge sy-badge--${p.solde > 0 ? "danger" : "success"}`}>{p.solde > 0 ? `Doit ${francs(p.solde)}` : "À jour"}</span>
                {gerer && (
                  <button data-r="enregistrer-paiement" onClick={() => setPaiement({ id: p.id, nom: p.nom, solde: p.solde })} className="sy-btn sy-btn--outline sy-btn--sm">
                    Enregistrer un paiement
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {f && f.paiements.length > 0 && (
        <section className="sy-card" aria-label="Paiements reçus">
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={TITRE_CARTE}>Paiements de commission reçus</h2>
            {f.paiements.map((x) => (
              <div key={x.id} data-r="paiement-commission" style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border-subtle)", fontSize: "14px", flexWrap: "wrap" }}>
                <strong style={{ minWidth: 100 }}>{francs(x.montant)}</strong>
                <span style={{ flex: 1 }}>
                  {x.prestataire} · {x.moyen_libelle}
                  {x.reference ? ` · réf. ${x.reference}` : ""}
                </span>
                <span style={{ color: GRIS, fontSize: "12.5px" }}>
                  {x.paye_le ? dateCourte(x.paye_le) : ""}
                  {x.par ? ` · ${x.par}` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {paiement && f && (
        <DialoguePaiement
          p={paiement}
          moyens={f.moyens}
          onFermer={() => setPaiement(null)}
          onFait={() => {
            setPaiement(null);
            recharger();
          }}
        />
      )}
    </EspaceAdmin>
  );
}

function Reglages({ f, gerer, onMaj }: { f: FinancesAdmin; gerer: boolean; onMaj: () => void }) {
  const toast = useToast();
  const [taux, setTaux] = useState(f.reglages.commission_taux?.toString() ?? "");
  const [negociation, setNegociation] = useState(f.reglages.negociation_directe);
  const [paiements, setPaiements] = useState(f.reglages.paiements);
  const [seuil, setSeuil] = useState(String(f.reglages.seuil_recidive));
  const [parSecteur, setParSecteur] = useState<Record<string, string>>(Object.fromEntries(f.secteurs.map((s) => [s.cle, s.commission?.toString() ?? ""])));

  const enregistrer = async () => {
    try {
      await api.admin.reglagesFinances({ commission_taux: taux === "" ? null : Number(taux.replace(",", ".")), negociation_directe: negociation, paiements, seuil_recidive: Number(seuil) || 0 });
      await api.admin.commissionsSecteurs(Object.fromEntries(Object.entries(parSecteur).map(([cle, v]) => [cle, v === "" ? null : Number(v.replace(",", "."))])));
      toast("Réglages enregistrés", taux ? `Commission globale : ${taux} %` : "Aucune commission globale");
      onMaj();
    } catch (e) {
      toast("Réglages non enregistrés", messageErreur(e), "danger");
    }
  };

  const champ: CSSProperties = { width: 90, minHeight: 38 };

  return (
    <section className="sy-card" aria-label="Commissions et règles">
      <div data-r="reglages-finances" className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={TITRE_CARTE}>Commissions et règles</h2>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px", flexWrap: "wrap" }}>
          <strong>Commission globale</strong>
          <input className="sy-input" inputMode="decimal" aria-label="Commission globale (%)" disabled={!gerer} value={taux} placeholder="Aucune" onChange={(e) => setTaux(e.target.value.replace(/[^\d.,]/g, ""))} style={champ} />
          % de chaque mission accomplie
        </label>
        <div>
          <strong style={{ fontSize: "14px" }}>Commission par secteur</strong>
          <span style={{ display: "block", fontSize: "12.5px", color: GRIS, marginBottom: 6 }}>Laissez vide pour appliquer la commission globale.</span>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 210px), 1fr))" }}>
            {f.secteurs.map((s) => (
              <label key={s.cle} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13.5px" }}>
                <span style={{ flex: 1 }}>{s.nom}</span>
                <input className="sy-input" inputMode="decimal" aria-label={`Commission : ${s.nom}`} disabled={!gerer} value={parSecteur[s.cle] ?? ""} placeholder={taux || "—"} onChange={(e) => setParSecteur((x) => ({ ...x, [s.cle]: e.target.value.replace(/[^\d.,]/g, "") }))} style={champ} />
                %
              </label>
            ))}
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "14px", cursor: gerer ? "pointer" : undefined }}>
          <input type="checkbox" aria-label="Négociation directe autorisée" disabled={!gerer} checked={negociation} onChange={(e) => setNegociation(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--kola-500)" }} />
          <span>
            <strong>Négociation directe autorisée</strong>
            <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
              Décochée : le prestataire doit proposer un prix dans la grille des prix indicatifs du secteur (écran « Catalogue et prix »).
            </span>
          </span>
        </label>
        <div>
          <strong style={{ fontSize: "14px" }}>Moyens de paiement proposés aux clients</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {f.moyens.map((m) => {
              const actif = paiements.includes(m.cle);
              return (
                <button key={m.cle} type="button" disabled={!gerer} aria-pressed={actif} title={m.detail} onClick={() => setPaiements((x) => (actif ? x.filter((y) => y !== m.cle) : [...x, m.cle]))} className={`sy-tag${actif ? " sy-tag--selected" : ""}`}>
                  {m.libelle}
                </button>
              );
            })}
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px", flexWrap: "wrap" }}>
          <strong>Récidive</strong> à partir de
          <input className="sy-input" inputMode="numeric" aria-label="Seuil de récidive" disabled={!gerer} value={seuil} onChange={(e) => setSeuil(e.target.value.replace(/\D/g, ""))} style={{ width: 70, minHeight: 38 }} />
          litiges tranchés contre un prestataire en 90 jours
        </label>
        {gerer && (
          <button data-r="enregistrer-reglages" onClick={enregistrer} disabled={!paiements.length} className="sy-btn sy-btn--primary sy-btn--sm" style={{ alignSelf: "flex-start" }}>
            Enregistrer les réglages
          </button>
        )}
      </div>
    </section>
  );
}

function DialoguePaiement({ p, moyens, onFermer, onFait }: { p: { id: number; nom: string; solde: number }; moyens: FinancesAdmin["moyens"]; onFermer: () => void; onFait: () => void }) {
  const toast = useToast();
  const [montant, setMontant] = useState(p.solde > 0 ? String(p.solde) : "");
  const [moyen, setMoyen] = useState("mobile_money");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(aujourdhui());

  return (
    <Dialogue
      titre={`Paiement de ${p.nom}`}
      description={p.solde > 0 ? `Il doit ${francs(p.solde)} de commission.` : "Aucune commission due pour l'instant."}
      icone="wallet"
      fond="var(--kola-100)"
      encre="var(--kola-700)"
      confirmer="Enregistrer le paiement"
      onFermer={onFermer}
      onConfirmer={async () => {
        if (!Number(montant)) return toast("Montant manquant", "Indiquez le montant reçu.", "danger");
        try {
          const r = await api.admin.enregistrerPaiement({ prestataire_id: p.id, montant: Number(montant), moyen, reference: reference.trim() || undefined, paye_le: date });
          toast("Paiement enregistré", r.solde > 0 ? `Il reste ${francs(r.solde)} à payer.` : "Commission à jour.");
          onFait();
        } catch (e) {
          toast("Paiement non enregistré", messageErreur(e), "danger");
        }
      }}
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <label style={{ fontSize: "13px" }}>
          Montant reçu (F)
          <input className="sy-input" inputMode="numeric" aria-label="Montant reçu" value={montant} onChange={(e) => setMontant(e.target.value.replace(/\D/g, ""))} />
        </label>
        <label style={{ fontSize: "13px" }}>
          Moyen
          <select className="sy-input" aria-label="Moyen de paiement" value={moyen} onChange={(e) => setMoyen(e.target.value)}>
            {moyens.map((m) => (
              <option key={m.cle} value={m.cle}>
                {m.libelle}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: "13px" }}>
          Référence (facultatif)
          <input className="sy-input" aria-label="Référence" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° de transaction" />
        </label>
        <label style={{ fontSize: "13px" }}>
          Reçu le
          <input className="sy-input" type="date" aria-label="Reçu le" value={date} max={aujourdhui()} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
    </Dialogue>
  );
}
