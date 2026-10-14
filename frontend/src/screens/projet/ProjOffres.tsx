import { PROS } from "../../data/catalogue";
import { FILTRES_OFFRES, OFFRES_ACHAT, OFFRES_ETAPE } from "../../data/projet";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { Rating } from "../../components/Rating";
import { pill } from "../../components/ui";

/** Offres reçues pour l'étape en cours, ou équipements correspondant à la demande. */
export function ProjOffres() {
  const { etat, set, go, ouvrirChat } = useApp();
  const maison = etat.sujet.type === "etape";
  const offres = maison ? OFFRES_ETAPE : OFFRES_ACHAT;

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "30px 20px 70px" }}>
      <button
        onClick={() => go("projDash")}
        className="sy-btn sy-btn--ghost sy-btn--md"
        style={{ marginBottom: 10 }}
      >
        ← {etat.sujet.ref}
      </button>
      <h1 style={{ fontSize: "clamp(26px,4.5vw,34px)", margin: "0 0 16px" }}>
        {maison ? "3 offres reçues" : "3 équipements qui correspondent"}
      </h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {FILTRES_OFFRES.map((nom, i) => (
          <button key={nom} onClick={() => set({ triOffres: i })} style={pill(i === etat.triOffres)}>
            {nom}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {offres.map((o) => (
          <div
            key={o.nom}
            style={{
              border: o.top ? "2px solid var(--color-accent)" : "1px solid var(--color-divider)",
              background: "var(--color-neutral-100)",
              borderRadius: "calc(var(--radius-lg) * 1.15)",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  flex: "none",
                  borderRadius: "999px",
                  background: "var(--color-accent-200)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-heading)",
                  fontSize: "17px",
                  color: "var(--color-accent-800)",
                }}
              >
                {o.ini}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "19px" }}>{o.nom}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Rating value={Number(o.note.replace(",", "."))} size={13} />
                  <span style={{ color: "var(--color-neutral-700)", fontSize: "13px" }}>
                    {o.chantiers} {maison ? "chantiers" : "ventes"} · CNI vérifiée
                  </span>
                </div>
              </div>
              <span
                style={{
                  flex: "none",
                  fontSize: "14px",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                  background: o.top ? "var(--color-accent)" : "var(--color-surface)",
                  color: o.top ? "var(--color-bg)" : "var(--color-text)",
                }}
              >
                {o.prix}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <span className="sy-badge sy-badge--neutral">{o.delai}</span>
              {o.tags.map((t) => (
                <span key={t} className="sy-badge sy-badge--neutral">
                  {t}
                </span>
              ))}
            </div>

            <div data-r="chat-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  go("projSuivi", {
                    sujet: { ...etat.sujet, montant: o.prix, titre: `${o.nom} · ${o.delai}` },
                  })
                }
                className="sy-btn sy-btn--primary sy-btn--md"
                style={{ flex: 1 }}
              >
                Valider cette offre
              </button>
              <button onClick={() => ouvrirChat(PROS[0])} className="sy-btn sy-btn--outline sy-btn--md">
                Chat
              </button>
              <button className="sy-btn sy-btn--ghost sy-btn--md">Détail</button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          background: "var(--color-surface)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: 16,
          marginTop: 16,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            flex: "none",
            borderRadius: "999px",
            background: "var(--color-accent-200)",
            display: "grid",
            placeItems: "center",
            color: "var(--color-accent-800)",
          }}
        >
          <Icon name="shield-check" size={17} strokeWidth={2.75} />
        </span>
        <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", margin: 0 }}>
          En validant, l'argent part en séquestre. Il n'est versé au prestataire qu'après vérification de l'agent et
          votre confirmation. Vous choisissez aussi la pénalité en cas de retard.
        </p>
      </div>
    </main>
  );
}
