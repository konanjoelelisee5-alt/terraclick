import { useState } from "react";
import { api, messageErreur, type PrestationAdmin } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { useToast } from "../../components/Toast";
import { peut } from "../../lib/acces";
import { useApp } from "../../state/app";
import { EspaceAdmin, GRIS, TITRE_CARTE } from "./EspaceAdmin";

/* Catalogue et prix : les prestations de chaque service et leur prix indicatif (celui affiché
   dans les résultats quand un technicien n'a pas donné le sien). Les prix du pack pressing et
   les coefficients de service restent dans config/pressing.php. */

export function AdminCatalogue() {
  const { donnees, erreur } = useApi((signal) => api.admin.prestations(signal), []);
  const [modifiees, setModifiees] = useState<Record<number, PrestationAdmin>>({});
  const liste = (donnees ?? []).map((p) => modifiees[p.id] ?? p);
  const secteurs = [...new Map(liste.map((p) => [p.secteur.cle, p.secteur.nom])).entries()];

  return (
    <EspaceAdmin titre="Catalogue et prix" sousTitre="Prix indicatifs des prestations, en francs CFA. Chaque technicien peut afficher le sien.">
      {erreur && <p role="alert" style={{ margin: 0, color: "var(--state-danger)" }}>Le catalogue n'a pas pu être chargé.</p>}
      {secteurs.map(([cle, nom]) => (
        <section key={cle} className="sy-card" aria-label={nom}>
          <div className="sy-card__body" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={TITRE_CARTE}>{nom}</h2>
            {liste
              .filter((p) => p.secteur.cle === cle)
              .map((p) => (
                <LignePrestation key={p.id} p={p} onMaj={(m) => setModifiees((x) => ({ ...x, [p.id]: m }))} />
              ))}
          </div>
        </section>
      ))}
    </EspaceAdmin>
  );
}

function LignePrestation({ p, onMaj }: { p: PrestationAdmin; onMaj: (p: PrestationAdmin) => void }) {
  const toast = useToast();
  const { etat } = useApp();
  const modifiable = peut(etat.auth, "catalogue.prix");
  const [min, setMin] = useState(p.prix_min?.toString() ?? "");
  const [max, setMax] = useState(p.prix_max?.toString() ?? "");
  const change = min !== (p.prix_min?.toString() ?? "") || max !== (p.prix_max?.toString() ?? "");

  const enregistrer = async () => {
    try {
      const maj = await api.admin.modifierPrestation(p.id, { prix_min: min ? Number(min) : null, prix_max: max ? Number(max) : null });
      onMaj({ ...p, ...maj });
      toast("Prix enregistré", `${p.nom} : ${maj.prix_affichage ?? "sans prix"}`);
    } catch (e) {
      toast("Prix non enregistré", messageErreur(e), "danger");
    }
  };

  const champ: React.CSSProperties = { width: 104, minHeight: 40 };

  return (
    <div data-r="prestation-admin" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
      <span style={{ flex: 1, minWidth: 180 }}>
        <span style={{ display: "block", fontWeight: 600, fontSize: "14.5px" }}>{p.nom}</span>
        <span style={{ display: "block", fontSize: "12.5px", color: GRIS }}>
          {p.prix_affichage ?? "Sans prix indicatif"} · {p.prestataires} technicien{p.prestataires > 1 ? "s" : ""}
        </span>
      </span>
      <input className="sy-input" inputMode="numeric" aria-label={`Prix minimum : ${p.nom}`} placeholder="Min." value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} style={champ} />
      <span style={{ color: GRIS }}>–</span>
      <input className="sy-input" inputMode="numeric" aria-label={`Prix maximum : ${p.nom}`} placeholder="Max." value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} style={champ} />
      <button onClick={enregistrer} disabled={!change || !modifiable} className="sy-btn sy-btn--primary sy-btn--sm">
        Enregistrer
      </button>
    </div>
  );
}
