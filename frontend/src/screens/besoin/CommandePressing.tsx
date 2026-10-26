import { useEffect, useMemo, useState } from "react";
import { api, messageErreur, type AdresseApi } from "../../lib/api";
import { slugifier } from "../../lib/annuaire";
import { useApi } from "../../lib/useApi";
import { heureLisible, lignesPack } from "../../lib/pressing";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { francs } from "../client/store";
import { AIDE, CadreParcours, Choix, TITRE_ETAPE } from "./commun";

/* « Ma commande » (pressing), après le pack : quel service (lavage, repassage, nettoyage à
   sec, express), comment (collecte à domicile ou dépôt au pressing), où pour une collecte
   (adresse enregistrée ou nouvelle : domicile, bureau, autre lieu) et quand (date et heure).
   Au dépôt, aucune adresse n'est demandée : la demande prend le quartier du pressing. Le total
   estimé suit chaque choix. La suite : la confirmation, avec la facture et le paiement. */

const GRIS = "#5C5248";

const TYPES: { cle: AdresseApi["type"]; nom: string; icone: string }[] = [
  { cle: "domicile", nom: "Domicile", icone: "home" },
  { cle: "bureau", nom: "Bureau", icone: "briefcase" },
  { cle: "autre", nom: "Autre lieu", icone: "map-pin" },
];

const TITRE_SECTION: React.CSSProperties = { fontSize: "18px", margin: "28px 0 10px" };

function pastille(actif: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 999,
    border: `1.5px solid ${actif ? "var(--color-text)" : "var(--color-divider)"}`,
    background: actif ? "var(--color-text)" : "var(--color-neutral-100)",
    color: actif ? "var(--color-neutral-100)" : "var(--color-text)",
    font: "inherit",
    fontSize: "14.5px",
    fontWeight: 600,
    cursor: "pointer",
  };
}

export function CommandePressing() {
  const { etat, go, modifierBesoin, ville } = useApp();
  const b = etat.besoin;
  const { donnees: options } = useApi(() => api.optionsPressing(), []);
  const { donnees: articles } = useApi(() => api.articlesPressing(), []);
  const { donnees: villes } = useApi(() => api.villes(), []);
  const quartiers = useMemo(
    () => [...(villes?.find((v) => v.slug === slugifier(ville))?.quartiers ?? [])].sort((x, y) => x.nom.localeCompare(y.nom, "fr")),
    [villes, ville],
  );

  // Adresses enregistrées du compte ; « nouvelle » ouvre le formulaire.
  const [adresses, setAdresses] = useState<AdresseApi[] | null>(null);
  const [choisie, setChoisie] = useState<number | "nouvelle" | null>(null);
  const [type, setType] = useState<AdresseApi["type"]>("domicile");
  const [nomLieu, setNomLieu] = useState("");
  const [enregistrer, setEnregistrer] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!etat.auth) {
      setAdresses([]);
      return;
    }
    const arret = new AbortController();
    api.adresses(arret.signal).then(setAdresses, () => setAdresses([]));
    return () => arret.abort();
  }, [etat.auth]);

  const formulaire = choisie === "nouvelle" || (adresses !== null && adresses.length === 0);

  const choisirAdresse = (a: AdresseApi) => {
    setChoisie(a.id);
    modifierBesoin({ quartier: a.quartier.id, repere: a.repere ?? "", adresse: a.nom });
  };

  const lignes = lignesPack(b, articles, options);
  const total = lignes.reduce((n, l) => n + l.total, 0);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const collecte = b.depot === "collecte";
  const manque =
    (!b.depot && "Choisissez la collecte ou le dépôt au pressing.") ||
    (collecte && !b.quartier && "Indiquez l'adresse de collecte : le quartier suffit.") ||
    (collecte && formulaire && type === "autre" && nomLieu.trim().length < 2 && "Donnez un nom à ce lieu.") ||
    (!b.date && "Choisissez la date du créneau.") ||
    (!b.heure && "Choisissez l'heure du créneau.");

  const continuer = async () => {
    setErreur(null);
    const nom = type === "autre" ? nomLieu.trim() : TYPES.find((t) => t.cle === type)!.nom;
    if (!collecte) {
      // Dépôt au pressing : pas d'adresse ; l'API prend le quartier du pressing.
      modifierBesoin({ quartier: null, repere: "", adresse: "" });
    } else if (formulaire) {
      modifierBesoin({ adresse: nom });
      if (etat.auth && enregistrer && b.quartier) {
        setEnvoi(true);
        try {
          await api.ajouterAdresse({ type, nom, quartier_id: b.quartier, repere: b.repere.trim() || undefined });
        } catch (e) {
          setErreur(messageErreur(e));
          setEnvoi(false);
          return;
        }
        setEnvoi(false);
      }
    }
    modifierBesoin({ quand: "date" });
    if (b.prestataire) go("confirmation");
    else go("besoin", { besoinEtape: 5 });
  };

  return (
    <CadreParcours
      retour={() => go("pack")}
      etape={`Pressing${b.prestataire ? ` · ${b.prestataire.nom}` : ""}`}
      actions={
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <span role="status" data-r="total-commande" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>Total estimé</span>
            <strong style={{ fontSize: "18px" }}>{francs(total)}</strong>
          </span>
          <button
            onClick={continuer}
            disabled={!!manque || envoi}
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ flex: "none", minHeight: 50, justifyContent: "center", fontSize: "16px" }}
          >
            {envoi ? "Enregistrement…" : "Continuer"}
          </button>
        </div>
      }
    >
      <h1 style={TITRE_ETAPE}>Ma commande</h1>
      <p style={AIDE}>
        {lignes.reduce((n, l) => n + l.quantite, 0)} pièces dans votre pack.{" "}
        <button onClick={() => go("pack")} className="sy-btn sy-btn--ghost sy-btn--sm" style={{ padding: "0 6px", minHeight: 0 }}>
          Modifier le pack
        </button>
      </p>

      {/* ---- Service ---- */}
      <section data-r="service-commande" aria-label="Service">
        <h2 style={{ ...TITRE_SECTION, marginTop: 8 }}>Service</h2>
        <div role="radiogroup" aria-label="Service" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {options?.services.map((s) => (
            <Choix
              key={s.cle}
              actif={b.service === s.cle}
              onClick={() => modifierBesoin({ service: s.cle })}
              titre={s.nom}
              detail={s.detail}
              icone={s.cle === "repassage" ? "wind" : s.cle === "nettoyage_sec" ? "sparkles" : "droplets"}
            />
          ))}
        </div>
        {options && (
          <button
            type="button"
            role="switch"
            aria-checked={b.express}
            data-r="express"
            onClick={() => modifierBesoin({ express: !b.express })}
            style={{
              marginTop: 10,
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              minHeight: 56,
              padding: "12px 16px",
              borderRadius: "var(--radius-lg)",
              border: `1.5px solid ${b.express ? "var(--color-accent)" : "var(--color-divider)"}`,
              background: b.express ? "var(--color-accent-100)" : "var(--color-neutral-100)",
              font: "inherit",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <Icon name="zap" size={20} color="var(--color-accent-700)" />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 600, fontSize: "15px" }}>{options.express.nom}</span>
              <span style={{ display: "block", fontSize: "13px", color: "var(--color-neutral-700)" }}>
                {options.express.detail} · +{options.express.majoration} %
              </span>
            </span>
            <span aria-hidden="true" style={{ width: 44, height: 26, borderRadius: 999, background: b.express ? "var(--color-accent)" : "var(--color-neutral-300)", position: "relative", flex: "none" }}>
              <span style={{ position: "absolute", top: 3, left: b.express ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: "#fff", transition: "left .15s" }} />
            </span>
          </button>
        )}
      </section>

      {/* ---- Dépôt ---- */}
      <section data-r="depot-commande" aria-label="Mode de dépôt">
        <h2 style={TITRE_SECTION}>Mode de dépôt</h2>
        <div role="radiogroup" aria-label="Mode de dépôt" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {options?.depots.map((d) => (
            <Choix
              key={d.cle}
              actif={b.depot === d.cle}
              onClick={() => modifierBesoin({ depot: d.cle })}
              titre={d.nom}
              detail={d.detail}
              icone={d.cle === "collecte" ? "route" : "building-2"}
            />
          ))}
        </div>
      </section>

      {/* ---- Où : seulement pour la collecte ; au dépôt, le client va lui-même au pressing ---- */}
      {b.depot === "collecte" && (
        <section data-r="adresse-commande" aria-label="Adresse">
          <h2 style={TITRE_SECTION}>Adresse de collecte</h2>
          {adresses && adresses.length > 0 && (
            <div role="radiogroup" aria-label="Adresses enregistrées" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
              {adresses.map((a) => (
                <Choix
                  key={a.id}
                  actif={choisie === a.id}
                  onClick={() => choisirAdresse(a)}
                  titre={a.nom}
                  detail={[a.quartier.nom, a.repere].filter(Boolean).join(" · ")}
                  icone={TYPES.find((t) => t.cle === a.type)?.icone}
                />
              ))}
              <Choix actif={choisie === "nouvelle"} onClick={() => setChoisie("nouvelle")} titre="Ajouter une adresse" detail="Domicile, bureau ou autre lieu" icone="square-plus" />
            </div>
          )}

          {formulaire && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div role="radiogroup" aria-label="Type de lieu" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TYPES.map((t) => (
                  <button key={t.cle} type="button" role="radio" aria-checked={type === t.cle} onClick={() => setType(t.cle)} style={pastille(type === t.cle)}>
                    <Icon name={t.icone} size={17} />
                    {t.nom}
                  </button>
                ))}
              </div>
              {type === "autre" && (
                <div className="sy-field">
                  <label className="sy-field__label" htmlFor="commande-nom-lieu">
                    Nom du lieu
                  </label>
                  <input id="commande-nom-lieu" className="sy-input" maxLength={40} value={nomLieu} onChange={(e) => setNomLieu(e.target.value)} placeholder="Ex. chez maman" />
                </div>
              )}
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="commande-quartier">
                  Quartier à {ville}
                </label>
                <select
                  id="commande-quartier"
                  className="sy-input"
                  value={b.quartier ?? ""}
                  onChange={(e) => modifierBesoin({ quartier: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Choisissez le quartier</option>
                  {quartiers.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sy-field">
                <label className="sy-field__label" htmlFor="commande-repere">
                  Adresse ou point de repère (facultatif)
                </label>
                <input
                  id="commande-repere"
                  className="sy-input"
                  maxLength={160}
                  value={b.repere}
                  onChange={(e) => modifierBesoin({ repere: e.target.value })}
                  placeholder="Ex. portail bleu, derrière la pharmacie"
                />
              </div>
              {etat.auth && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, fontSize: "15px", cursor: "pointer" }}>
                  <input type="checkbox" checked={enregistrer} onChange={(e) => setEnregistrer(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--color-accent)" }} />
                  Enregistrer cette adresse pour mes prochaines commandes
                </label>
              )}
            </div>
          )}
        </section>
      )}

      {/* ---- Créneau ---- */}
      <section data-r="creneau-commande" aria-label="Créneau">
        <h2 style={TITRE_SECTION}>{b.depot === "pressing" ? "Quand passez-vous au pressing ?" : b.depot === "collecte" ? "Créneau de collecte" : "Créneau"}</h2>
        <div className="sy-field">
          <label className="sy-field__label" htmlFor="commande-date">
            Date
          </label>
          <input id="commande-date" type="date" className="sy-input" min={aujourdhui} value={b.date} onChange={(e) => modifierBesoin({ date: e.target.value })} />
        </div>
        <div role="radiogroup" aria-label="Heure" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {options?.heures.map((h) => (
            <button key={h} type="button" role="radio" aria-checked={b.heure === h} onClick={() => modifierBesoin({ heure: h })} style={pastille(b.heure === h)}>
              {heureLisible(h)}
            </button>
          ))}
        </div>
      </section>

      {(manque || erreur) && (
        <p role={erreur ? "alert" : "status"} style={{ ...AIDE, margin: "18px 0 0", color: erreur ? "var(--state-danger)" : AIDE.color }}>
          {erreur ?? manque}
        </p>
      )}
    </CadreParcours>
  );
}
