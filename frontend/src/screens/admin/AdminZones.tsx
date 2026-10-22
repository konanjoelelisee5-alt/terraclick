import { useEffect, useState } from "react";
import { api, messageErreur, type QuartierAdmin, type ZonesAdmin } from "../../lib/api";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { EspaceAdmin, Filtres, GRIS, TITRE_CARTE, Vide } from "./EspaceAdmin";
import { Stats, chiffre } from "./Gabarit";

/* Zones et quartiers : l'équipe ajoute les quartiers, les active ou les désactive (désactivé, un
   quartier n'est plus proposé aux clients), choisit les services proposés dans chacun et ses
   frais de déplacement. La couverture montre, secteur par secteur, combien de prestataires
   actifs interviennent dans chaque quartier ; « Mal couverts » met les trous en avant. Les
   zones d'intervention de chaque prestataire se règlent dans son dossier. */

type Vue = "tous" | "trous" | "desactives";

export function AdminZones() {
  const { etat } = useApp();
  const toast = useToast();
  const gerer = peut(etat.auth, "zones.gerer");
  const [donnees, setDonnees] = useState<ZonesAdmin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [vue, setVue] = useState<Vue>("tous");
  const [version, setVersion] = useState(0);
  const [ville, setVille] = useState("");
  const [nom, setNom] = useState("");
  const [frais, setFrais] = useState("");

  useEffect(() => {
    const arret = new AbortController();
    api.admin.zones(arret.signal).then(setDonnees, (e) => e?.name !== "AbortError" && setErreur(messageErreur(e)));
    return () => arret.abort();
  }, [version]);

  const recharger = () => setVersion((v) => v + 1);
  const villeChoisie = ville || String(donnees?.villes[0]?.id ?? "");

  const ajouter = async () => {
    try {
      const q = await api.admin.ajouterQuartier({ ville_id: Number(villeChoisie), nom: nom.trim(), frais_deplacement: frais ? Number(frais) : null });
      toast("Quartier ajouté", `${q.nom} est ouvert aux clients.`);
      setNom("");
      setFrais("");
      recharger();
    } catch (e) {
      toast("Quartier non ajouté", messageErreur(e), "danger");
    }
  };

  const garder = (q: QuartierAdmin) => (vue === "trous" ? q.manques.length > 0 : vue === "desactives" ? !q.actif : true);

  return (
    <EspaceAdmin
      titre="Zones et quartiers"
      sousTitre={
        donnees
          ? donnees.trous
            ? `${donnees.trous} manque${donnees.trous > 1 ? "s" : ""} de couverture : un service proposé sans aucun prestataire dans le quartier.`
            : "Chaque service proposé a au moins un prestataire dans chaque quartier ouvert."
          : undefined
      }
    >
      {donnees && (
        <Stats
          items={(() => {
            const tous = donnees.villes.flatMap((v) => v.quartiers);
            return [
              { libelle: "Quartiers ouverts", valeur: chiffre(tous.filter((q) => q.actif).length), icone: "map-pin", detail: `${tous.filter((q) => !q.actif).length} désactivé(s)` },
              { libelle: "Manques de couverture", valeur: chiffre(donnees.trous), icone: "alert-triangle", badge: donnees.trous ? { texte: "À combler", ton: "danger" as const } : undefined },
              { libelle: "Quartiers mal couverts", valeur: chiffre(tous.filter((q) => q.manques.length).length), icone: "scan-search" },
              { libelle: "Demandes en 30 jours", valeur: chiffre(tous.reduce((n, q) => n + q.demandes_30j, 0)), icone: "file-text" },
            ];
          })()}
        />
      )}
      {gerer && donnees && (
        <section className="sy-card" aria-label="Ajouter un quartier">
          <div className="sy-card__body" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <h2 style={{ ...TITRE_CARTE, width: "100%" }}>Ajouter un quartier</h2>
            {donnees.villes.length > 1 && (
              <select className="sy-input" aria-label="Ville" value={villeChoisie} onChange={(e) => setVille(e.target.value)} style={{ flex: "1 1 150px", minHeight: 42 }}>
                {donnees.villes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nom}
                  </option>
                ))}
              </select>
            )}
            <input className="sy-input" aria-label="Nom du quartier" placeholder="Nom du quartier" value={nom} onChange={(e) => setNom(e.target.value)} style={{ flex: "2 1 200px", minHeight: 42 }} />
            <input className="sy-input" inputMode="numeric" aria-label="Frais de déplacement (F)" placeholder="Frais de déplacement (F)" value={frais} onChange={(e) => setFrais(e.target.value.replace(/\D/g, ""))} style={{ flex: "1 1 170px", minHeight: 42 }} />
            <button data-r="ajouter-quartier" onClick={ajouter} disabled={nom.trim().length < 2} className="sy-btn sy-btn--primary sy-btn--md">
              Ajouter
            </button>
          </div>
        </section>
      )}

      <Filtres
        options={[
          { cle: "tous" as const, nom: "Tous les quartiers" },
          { cle: "trous" as const, nom: `Mal couverts${donnees ? ` (${donnees.villes.flatMap((v) => v.quartiers).filter((q) => q.manques.length).length})` : ""}` },
          { cle: "desactives" as const, nom: "Désactivés" },
        ]}
        valeur={vue}
        onChange={setVue}
      />
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>{erreur}</p>}

      {donnees?.villes.map((v) => {
        const quartiers = v.quartiers.filter(garder);
        if (!quartiers.length) return null;
        return (
          <div key={v.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {donnees.villes.length > 1 && <h2 style={TITRE_CARTE}>{v.nom}</h2>}
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))" }}>
              {quartiers.map((q) => (
                <CarteQuartier key={q.id} q={q} secteurs={donnees.secteurs} gerer={gerer} onMaj={recharger} />
              ))}
            </div>
          </div>
        );
      })}
      {donnees && !donnees.villes.some((v) => v.quartiers.some(garder)) && <Vide texte={vue === "trous" ? "Aucun manque : tous les quartiers ouverts sont couverts." : "Aucun quartier ici."} />}
    </EspaceAdmin>
  );
}

function CarteQuartier({ q, secteurs, gerer, onMaj }: { q: QuartierAdmin; secteurs: ZonesAdmin["secteurs"]; gerer: boolean; onMaj: () => void }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [frais, setFrais] = useState(q.frais_deplacement?.toString() ?? "");
  const [choix, setChoix] = useState<string[] | null>(q.secteurs);

  const modifier = async (saisie: Parameters<typeof api.admin.modifierQuartier>[1], titre: string) => {
    try {
      await api.admin.modifierQuartier(q.id, saisie);
      toast(titre, q.nom);
      setOuvert(false);
      onMaj();
    } catch (e) {
      toast("Quartier non modifié", messageErreur(e), "danger");
    }
  };

  const basculerSecteur = (cle: string) => {
    const base = choix ?? secteurs.map((s) => s.cle);
    const suite = base.includes(cle) ? base.filter((x) => x !== cle) : [...base, cle];
    // Tous cochés : plus de limite.
    setChoix(suite.length === secteurs.length ? null : suite);
  };

  return (
    <section data-r="quartier-admin" aria-label={q.nom} className="sy-card" style={{ opacity: q.actif ? 1 : 0.8 }}>
      <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Icon name="map-pin" size={18} />
          <h3 style={{ ...TITRE_CARTE, flex: 1 }}>{q.nom}</h3>
          <span className={`sy-badge sy-badge--${q.actif ? "success" : "neutral"}`}>{q.actif ? "Ouvert" : "Désactivé"}</span>
        </div>
        <span style={{ fontSize: "13px", color: GRIS }}>
          {q.prestataires} prestataire{q.prestataires > 1 ? "s" : ""} y interviennent · {q.demandes_30j} demande{q.demandes_30j > 1 ? "s" : ""} en 30 jours
          {q.frais_deplacement ? ` · déplacement ${q.frais_deplacement.toLocaleString("fr-FR")} F` : ""}
          {q.secteurs ? ` · ${q.secteurs.length} service${q.secteurs.length > 1 ? "s" : ""} proposé${q.secteurs.length > 1 ? "s" : ""}` : ""}
        </span>
        {q.manques.length > 0 && (
          <div data-r="manques-quartier" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {q.manques.map((m) => (
              <span key={m} className="sy-badge sy-badge--danger">
                Aucun {m.toLowerCase()}
              </span>
            ))}
          </div>
        )}
        <div data-r="couverture-quartier" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {q.couverture.map((c) => (
            <span
              key={c.cle}
              title={c.propose ? `${c.prestataires} prestataire(s)` : "Service non proposé dans ce quartier"}
              style={{
                fontSize: "12.5px",
                padding: "3px 9px",
                borderRadius: 999,
                border: "1px solid var(--border-subtle)",
                background: !c.propose ? "transparent" : c.prestataires ? "var(--surface-sunken)" : "var(--state-danger-soft)",
                color: c.propose ? "var(--color-text)" : GRIS,
                textDecoration: c.propose ? undefined : "line-through",
              }}
            >
              {c.nom} · {c.prestataires}
            </span>
          ))}
        </div>

        {gerer && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button data-r="basculer-quartier" onClick={() => modifier({ actif: !q.actif }, q.actif ? "Quartier désactivé" : "Quartier ouvert")} className={`sy-btn sy-btn--sm ${q.actif ? "sy-btn--outline" : "sy-btn--primary"}`}>
              {q.actif ? "Désactiver" : "Activer"}
            </button>
            <button data-r="regler-quartier" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} className="sy-btn sy-btn--ghost sy-btn--sm" style={{ gap: 6 }}>
              <Icon name="sliders-horizontal" size={15} />
              Services et frais
            </button>
          </div>
        )}

        {ouvert && (
          <div data-r="reglages-quartier" style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>Services proposés dans ce quartier</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {secteurs.map((s) => {
                const actif = choix === null || choix.includes(s.cle);
                return (
                  <button key={s.cle} type="button" aria-pressed={actif} onClick={() => basculerSecteur(s.cle)} className={`sy-tag${actif ? " sy-tag--selected" : ""}`}>
                    {s.nom}
                  </button>
                );
              })}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13.5px" }}>
              Frais de déplacement
              <input className="sy-input" inputMode="numeric" aria-label={`Frais de déplacement : ${q.nom}`} placeholder="Aucuns" value={frais} onChange={(e) => setFrais(e.target.value.replace(/\D/g, ""))} style={{ width: 120, minHeight: 40 }} />
              F
            </label>
            <button
              data-r="enregistrer-quartier"
              onClick={() => modifier({ secteurs: choix, frais_deplacement: frais ? Number(frais) : null }, "Quartier enregistré")}
              disabled={choix !== null && !choix.length}
              className="sy-btn sy-btn--primary sy-btn--sm"
              style={{ alignSelf: "flex-start" }}
            >
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
