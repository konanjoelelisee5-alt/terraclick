import { CONFIG } from "../../lib/config";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { OVERLINE } from "../../components/ui";

const EXEMPLES = [
  "Ma pompe à eau ne démarre plus",
  "La clim ne refroidit plus depuis hier",
  "Ma porte d'entrée ne ferme plus à clé",
];

const DIAGNOSTIC = [
  { titre: "Ce que nous comprenons", texte: "Panne de pompe à eau, maison individuelle, Habitat. Urgence : sous 24 h." },
  { titre: "Métier identifié", texte: "Plombier · spécialiste pompe et surpresseur" },
  { titre: "Fourchette attendue", texte: "15 000 – 45 000 F selon la pièce à changer" },
  {
    titre: "Niveau d'enjeu",
    texte: "Faible : intervention simple, un seul métier. Suivi avancé non nécessaire.",
  },
];

const CAPACITES = [
  { icon: "scan-search", texte: "Traduire un problème en métier et en caractéristiques précises" },
  { icon: "wallet", texte: "Annoncer une fourchette de prix avant tout contact" },
  ...(CONFIG.moduleConstruction
    ? [{ icon: "route", texte: "Ouvrir un projet suivi quand le besoin a plusieurs étapes" }]
    : []),
  { icon: "mic", texte: "Écouter un message vocal si écrire prend trop de temps" },
];

/**
 * « Box intelligente » : le client décrit son problème en une phrase, la Box
 * répond par ce qu'elle a compris, le métier, la fourchette de prix et le niveau
 * d'enjeu — c'est ce dernier critère qui décide de proposer un suivi avancé.
 */
export function ModeBox() {
  const { etat, set, rechercher, exigerCompte, go } = useApp();

  return (
    <section data-r="container" data-sec="" style={{ paddingTop: 44 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <span
          style={{
            width: 38,
            height: 38,
            flex: "none",
            borderRadius: "999px",
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="bot" size={20} />
        </span>
        <h2 style={{ fontSize: "29px", margin: 0 }}>Box intelligente</h2>
        <span className="sy-badge sy-badge--neutral">Assistant</span>
      </div>
      <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: "0 0 20px", maxWidth: "64ch" }}>
        Décrivez le problème avec vos mots. Nous identifions le métier, la fourchette de prix et les prestataires
        disponibles.
      </p>

      <div data-r="map-split" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "80%",
                background: "var(--color-surface)",
                borderRadius: "16px 16px 16px 4px",
                padding: "12px 15px",
                fontSize: "14.5px",
              }}
            >
              Bonjour, décrivez votre besoin. Une phrase suffit.
            </div>
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "80%",
                background: "var(--color-accent)",
                color: "var(--color-bg)",
                borderRadius: "16px 16px 4px 16px",
                padding: "12px 15px",
                fontSize: "14.5px",
              }}
            >
              Ma pompe à eau ne démarre plus depuis ce matin, à Habitat.
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "88%",
                background: "var(--color-surface)",
                borderRadius: "16px 16px 16px 4px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {DIAGNOSTIC.map((d) => (
                <div key={d.titre}>
                  <div style={OVERLINE}>{d.titre}</div>
                  <div style={{ fontSize: "14.5px", lineHeight: 1.5 }}>{d.texte}</div>
                </div>
              ))}
              <button
                onClick={() => rechercher("Plomberie", { categorie: "plombiers" })}
                className="sy-btn sy-btn--primary sy-btn--md"
                style={{ alignSelf: "flex-start", marginTop: 2 }}
              >
                Voir les plombiers disponibles
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              paddingTop: 12,
              borderTop: "1px solid var(--color-divider)",
            }}
          >
            {EXEMPLES.map((texte) => (
              <button
                key={texte}
                onClick={() => set({ boxDraft: texte })}
                className="sy-tag"
                style={{ height: 32, fontSize: "13px" }}
              >
                {texte}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="sy-input"
              value={etat.boxDraft}
              onChange={(e) => set({ boxDraft: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && rechercher(etat.boxDraft || undefined)}
              placeholder="Décrivez votre besoin en une phrase…"
              aria-label="Décrivez votre besoin"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => rechercher(etat.boxDraft || undefined)}
              className="sy-btn sy-btn--primary sy-btn--md"
              style={{ gap: 8 }}
            >
              <Icon name="send" size={16} />
              Envoyer
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "17px" }}>
              Ce que la Box sait faire
            </span>
            {CAPACITES.map((c) => (
              <div key={c.texte} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Icon name={c.icon} size={18} color="var(--color-accent)" style={{ marginTop: 2 }} />
                <span style={{ fontSize: "14px", lineHeight: 1.5 }}>{c.texte}</span>
              </div>
            ))}
          </div>

          {CONFIG.moduleConstruction && (
            <div className="sy-card sy-weave" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "17px" }}>
                Besoin en plusieurs étapes ?
              </span>
              <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--color-neutral-700)" }}>
                La Box ouvre un dossier suivi et bloque l'argent étape par étape.
              </span>
              <button
                onClick={() => exigerCompte(() => go("assistant", { assistStep: 1 }))}
                className="sy-btn sy-btn--outline sy-btn--md"
                style={{ alignSelf: "flex-start" }}
              >
                Ouvrir un projet suivi
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
