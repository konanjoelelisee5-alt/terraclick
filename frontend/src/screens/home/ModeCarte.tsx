import { useApp } from "../../state/app";
import { api } from "../../lib/api";
import { slugifier, versPrestataire } from "../../lib/annuaire";
import { useApi } from "../../lib/useApi";
import { MapCanvas } from "../../components/MapCanvas";
import { Rating } from "../../components/Rating";
import { CARTE, pill } from "../../components/ui";

const FILTRES = ["Tout", "Ouvert maintenant", "Urgence", "Bien noté"];
const BIEN_NOTE = 3;

/**
 * « Autour de moi » : la carte et la liste des pros proches, côte à côte.
 * La distance est mesurée depuis le centre de la ville choisie ; la position réelle
 * de l'appareil viendra avec le bouton « Me localiser ».
 */
export function ModeCarte() {
  const { etat, set, ouvrirChat, rechercher, ville } = useApp();

  const { donnees: villes } = useApi(() => api.villes(), []);
  const centre = villes?.find((v) => v.slug === slugifier(ville))?.position;
  const tri = etat.filtreCarte === BIEN_NOTE ? "note" : "distance";

  const proches = useApi(
    (signal) =>
      centre
        ? api.rechercher({ lat: centre.lat, lng: centre.lng, tri, par_page: 20 }, signal)
        : Promise.resolve(undefined),
    [centre?.lat, centre?.lng, tri],
  );
  const pros = proches.donnees?.data.map(versPrestataire) ?? [];
  const total = proches.donnees?.meta.total ?? 0;

  return (
    <section data-r="container" data-sec="" style={{ paddingTop: 44 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <h2 style={{ fontSize: "29px", margin: 0 }}>Autour de moi</h2>
        <span role="status" style={{ color: "var(--color-neutral-700)", fontSize: "14px" }}>
          {proches.erreur ??
            (proches.donnees ? `${total} ${total > 1 ? "pros" : "pro"} près de ${ville}` : "Recherche des pros proches…")}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTRES.map((nom, i) => (
          <button key={nom} onClick={() => set({ filtreCarte: i })} style={pill(i === etat.filtreCarte)}>
            {nom}
          </button>
        ))}
      </div>

      <div
        data-r="map-split"
        style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16, alignItems: "start" }}
      >
        <MapCanvas pros={pros} hauteur={440} reperes onPin={ouvrirChat} />

        <div
          data-r="map-list"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 11,
            maxHeight: 440,
            overflow: "auto",
            paddingRight: 4,
          }}
        >
          {pros.slice(0, 4).map((p, i) => (
            <div key={p.id ?? p.nom} style={{ ...CARTE, padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    flex: "none",
                    borderRadius: "999px",
                    background: "var(--color-accent)",
                    color: "var(--color-bg)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "14px",
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px" }}>{p.nom}</div>
                  <div style={{ color: "var(--color-neutral-700)", fontSize: "12.5px" }}>
                    {[p.metier, p.quartier, p.dist].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <Rating
                  value={Number(p.note.replace(",", "."))}
                  showValue
                  style={{ marginLeft: "auto", whiteSpace: "nowrap" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => ouvrirChat(p)}
                  className="sy-btn sy-btn--primary sy-btn--md"
                  style={{ flex: 1, fontSize: "13px", padding: 7 }}
                >
                  Chat
                </button>
                <button
                  onClick={() => ouvrirChat(p)}
                  className="sy-btn sy-btn--outline sy-btn--md"
                  style={{ flex: 1, fontSize: "13px", padding: 7 }}
                >
                  Appeler
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => rechercher("Tous les prestataires proches", {})}
            className="sy-btn sy-btn--ghost sy-btn--md"
            style={{ alignSelf: "flex-start" }}
          >
            Voir tous les résultats
          </button>
        </div>
      </div>
    </section>
  );
}
