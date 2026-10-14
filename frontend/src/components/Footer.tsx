import { useApp } from "../state/app";
import { Wordmark } from "./Header";

const COLONNES = [
  { titre: "Pour les particuliers", liens: ["Comment ça marche", "Départements", "Demander un devis", "Aide & support"] },
  { titre: "Pour les prestataires", liens: ["Devenir partenaire", "Vérification CNI", "Tarifs", "Espace pro"] },
  { titre: "Villes", liens: ["Yamoussoukro", "Abidjan", "Bouaké", "Daloa"] },
];

/** Liens menant à l'espace prestataire. */
const LIENS_PRO = ["Devenir partenaire", "Espace pro"];

export function Footer() {
  const { etat, go, exigerCompte } = useApp();

  return (
    <footer
      data-r="footer"
      style={{
        marginTop: 64,
        background: "var(--color-surface)",
        // Sur mobile, le pied de page n'est conservé que sur l'accueil : ailleurs
        // il éloigne inutilement la barre d'onglets du contenu.
        ...(etat.screen === "home" ? {} : ({ "--sy-footer-mobile": "none" } as React.CSSProperties)),
      }}
    >
      <div
        data-r="footer container"
        style={{
          paddingTop: 44,
          paddingBottom: 44,
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 28,
        }}
      >
        <div data-r="footer-brand">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Wordmark size={19} />
          </div>
          <p style={{ color: "var(--color-neutral-700)", fontSize: "13.5px", margin: 0, maxWidth: "34ch" }}>
            La plateforme de recherche de prestataires locaux. Rapide, fiable, et proche de vous.
          </p>
        </div>

        {COLONNES.map((col) => (
          <div key={col.titre} style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "13.5px" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "15px" }}>{col.titre}</span>
            {col.liens.map((lien) =>
              LIENS_PRO.includes(lien) ? (
                <button
                  key={lien}
                  type="button"
                  className="text-muted"
                  onClick={() => exigerCompte(() => go("proDashboard"))}
                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit", textAlign: "left" }}
                >
                  {lien}
                </button>
              ) : (
                <span key={lien} className="text-muted">
                  {lien}
                </span>
              ),
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--color-divider)" }}>
        <div
          data-r="container"
          style={{
            paddingTop: 16,
            paddingBottom: 16,
            fontSize: "12.5px",
            color: "var(--color-neutral-700)",
            textAlign: "center",
          }}
        >
          © 2026 Servis Yakro — Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
