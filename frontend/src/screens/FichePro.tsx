import { useState } from "react";
import { api, ErreurApi } from "../lib/api";
import { versPrestataire } from "../lib/annuaire";
import { useApi } from "../lib/useApi";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { ImageSlot } from "../components/ImageSlot";
import { Rating } from "../components/Rating";

const TITRE_BLOC: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "20px",
  margin: 0,
};

const TITRE_LATERAL: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: "17px",
};

const STATUT_DOCUMENT = {
  verifie: { texte: "Vérifié", classe: "sy-badge--success" },
  en_attente: { texte: "En cours de vérification", classe: "sy-badge--neutral" },
  refuse: { texte: "Refusé", classe: "sy-badge--neutral" },
} as const;

/**
 * Fiche professionnelle : l'écran le plus consulté d'une place de marché, et le
 * seul endroit où la confiance se joue avant le premier contact. La barre
 * d'action reste fixe en bas, au-dessus de la barre d'onglets sur mobile.
 */
export function FichePro() {
  const { etat, go, ouvrirChat, exigerCompte, poserSujetMaison } = useApp();
  const [essai, setEssai] = useState(0);

  // Rechargée à la connexion : le numéro du prestataire n'est donné qu'aux comptes connectés.
  const { donnees: p, erreur } = useApi(
    async (signal) => {
      // Sans identifiant, la fiche vient des offres du module projet, encore fictif :
      // on montre l'entreprise de démonstration.
      const id = etat.fiche ?? (await api.rechercher({ q: "Bakayoko", par_page: 1 }, signal)).data[0]?.id;
      if (!id) throw new ErreurApi("Cette fiche n'est plus disponible.", 404);
      return api.fiche(id, signal);
    },
    [etat.fiche, essai, !!etat.auth],
  );

  const retour = (
    <button onClick={() => go("results")} className="sy-btn sy-btn--ghost sy-btn--md" style={{ marginBottom: 14 }}>
      ← Retour
    </button>
  );

  if (!p) {
    return (
      <main data-r="container" style={{ paddingTop: 26, paddingBottom: 80 }}>
        {retour}
        <div
          role={erreur ? "alert" : "status"}
          style={{
            textAlign: "center",
            padding: "56px 20px",
            background: "var(--color-surface)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
          }}
        >
          <p style={{ color: "var(--color-neutral-700)", fontSize: "14.5px", margin: erreur ? "0 0 16px" : 0 }}>
            {erreur ?? "Chargement de la fiche…"}
          </p>
          {erreur && (
            <button onClick={() => setEssai((n) => n + 1)} className="sy-btn sy-btn--primary sy-btn--md">
              Réessayer
            </button>
          )}
        </div>
      </main>
    );
  }

  const zone = p.zone_intervention ?? [p.quartier?.nom, p.quartier?.ville].filter(Boolean).join(", ");
  // Sans grille tarifaire détaillée, la fourchette de la carte de recherche en tient lieu.
  const tarifs = p.tarifs.length
    ? p.tarifs
    : p.prix.affichage
      ? [{ libelle: "Intervention", affichage: p.prix.affichage }]
      : [];

  return (
    <>
      <main data-r="container" style={{ paddingTop: 26, paddingBottom: 180 }}>
        {retour}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <span
            style={{
              width: 72,
              height: 72,
              flex: "none",
              borderRadius: "var(--radius-md)",
              background: "var(--kola-50)",
              color: "var(--kola-600)",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "24px",
            }}
          >
            {p.initiales}
          </span>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                fontSize: "clamp(26px,4.5vw,36px)",
                margin: "0 0 6px",
              }}
            >
              {p.nom}
            </h1>
            <p style={{ fontSize: "15px", margin: "0 0 4px", color: "var(--text-muted)" }}>{p.metier}</p>
            {zone && <p style={{ fontSize: "14px", margin: 0, color: "var(--text-muted)" }}>{zone}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 12 }}>
              <Rating value={p.note} count={p.nombre_avis} />
              {p.verifie && (
                <span className="sy-badge sy-badge--success">
                  <Icon name="shield-check" size={13} />
                  Profil vérifié
                </span>
              )}
              {p.accepte_suivi && (
                <span className="sy-badge sy-badge--brand">
                  <Icon name="route" size={13} />
                  Accepte les projets suivis
                </span>
              )}
              {p.experience && (
                <span className="sy-badge sy-badge--neutral">
                  Depuis {p.experience.depuis} · {p.experience.annees} ans
                </span>
              )}
            </div>
            {p.description && (
              <p style={{ fontSize: "14.5px", lineHeight: 1.55, margin: "14px 0 0", maxWidth: "66ch" }}>
                {p.description}
              </p>
            )}
          </div>
        </div>

        <div data-r="promo" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {p.realisations.length > 0 && (
              <div>
                <h2 style={{ ...TITRE_BLOC, marginBottom: 10 }}>Réalisations</h2>
                <div data-grid="421">
                  {p.realisations.map((r) => (
                    <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <ImageSlot placeholder={r.legende} radius={12} style={{ height: 130 }} />
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>{r.legende}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.prestations.length > 0 && (
              <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={TITRE_BLOC}>Prestations</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {p.prestations.map((x) => (
                    <span key={x} className="sy-badge sy-badge--neutral">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tarifs.length > 0 && (
              <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={TITRE_BLOC}>Tarifs indicatifs</h2>
                {tarifs.map((t) => (
                  <div
                    key={t.libelle}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      paddingBottom: 9,
                      borderBottom: "1px solid var(--border-subtle)",
                      fontSize: "14.5px",
                    }}
                  >
                    <span>{t.libelle}</span>
                    <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{t.affichage ?? "Sur devis"}</span>
                  </div>
                ))}
                <p style={{ fontSize: "13px", margin: 0, color: "var(--text-muted)" }}>
                  Prix donnés à titre indicatif. Le devis est établi après visite.
                </p>
              </div>
            )}

            <div className="sy-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <h2 style={TITRE_BLOC}>Avis clients</h2>
              {p.avis_recents.length === 0 && (
                <p style={{ fontSize: "14px", margin: 0, color: "var(--text-muted)" }}>
                  Pas encore d'avis publié sur Servis Yakro.
                </p>
              )}
              {p.avis_recents.map((a) => (
                <div
                  key={a.id}
                  style={{ display: "flex", gap: 12, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      flex: "none",
                      borderRadius: "999px",
                      background: "var(--kola-50)",
                      color: "var(--kola-600)",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {a.auteur.initiales}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14.5px", fontWeight: 600 }}>{a.auteur.nom}</span>
                      <Rating value={a.note} size={13} />
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>{a.date_affichage}</span>
                    </div>
                    {a.commentaire && (
                      <p style={{ fontSize: "14px", lineHeight: 1.5, margin: 0, color: "var(--text-muted)" }}>
                        {a.commentaire}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {p.horaires.length > 0 && (
              <div className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={TITRE_LATERAL}>Disponibilités</span>
                {p.horaires.map((d) => (
                  <div key={d.jours} style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: "14px" }}>
                    <span style={{ color: "var(--text-muted)" }}>{d.jours}</span>
                    <span>{d.ouverture && d.fermeture ? `${d.ouverture} – ${d.fermeture}` : "Fermé"}</span>
                  </div>
                ))}
              </div>
            )}

            {p.garanties.length > 0 && (
              <div className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={TITRE_LATERAL}>Garanties</span>
                {p.garanties.map((g) => (
                  <div key={g} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Icon name="shield-check" size={17} color="var(--state-success)" />
                    <span style={{ fontSize: "14px" }}>{g}</span>
                  </div>
                ))}
              </div>
            )}

            {p.documents.length > 0 && (
              <div className="sy-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={TITRE_LATERAL}>Documents</span>
                {p.documents.map((d) => (
                  <div key={d.type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: 1, fontSize: "14px" }}>{d.libelle}</span>
                    <span className={`sy-badge ${STATUT_DOCUMENT[d.statut].classe}`}>
                      {STATUT_DOCUMENT[d.statut].texte}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <div
        data-r="fiche-bar"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          background: "var(--surface-card)",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "0 -6px 20px rgba(26,22,19,.07)",
        }}
      >
        <div
          data-r="container"
          style={{
            paddingTop: 12,
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => ouvrirChat(versPrestataire(p))}
            className="sy-btn sy-btn--outline sy-btn--md"
            style={{ minHeight: 48 }}
          >
            Contacter directement
          </button>
          {p.telephone ? (
            <a
              href={`tel:+225${p.telephone.replace(/\D/g, "")}`}
              className="sy-btn sy-btn--outline sy-btn--md"
              style={{ minHeight: 48, gap: 7 }}
            >
              <Icon name="phone" size={16} strokeWidth={2.75} />
              {p.telephone}
            </a>
          ) : (
            p.joignable_par_telephone &&
            !etat.auth && (
              <button
                onClick={() => exigerCompte(() => {})}
                className="sy-btn sy-btn--ghost sy-btn--md"
                style={{ minHeight: 48, gap: 7 }}
              >
                <Icon name="phone" size={16} strokeWidth={2.75} />
                Voir le numéro
              </button>
            )
          )}
          {p.accepte_suivi && (
            <button
              onClick={() => poserSujetMaison({ onglet: 1 })}
              className="sy-btn sy-btn--ghost sy-btn--md"
              style={{ minHeight: 48 }}
            >
              Ajouter à mon projet suivi
            </button>
          )}
          <button
            onClick={() => exigerCompte(() => go("assistant", { assistStep: 1 }))}
            className="sy-btn sy-btn--primary sy-btn--md"
            style={{ flex: 1, minWidth: 180, justifyContent: "center", minHeight: 48, fontSize: "16px" }}
          >
            Demander un devis
          </button>
        </div>
      </div>
    </>
  );
}
