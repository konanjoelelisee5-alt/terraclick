import { useState, type ReactNode } from "react";
import type { FicheApi } from "../lib/api";
import { versPrestataire } from "../lib/annuaire";
import { lienWhatsApp, noterContact } from "../lib/contacts";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";
import { ImageSlot } from "../components/ImageSlot";
import { Rating } from "../components/Rating";

/* Fiche du technicien sur téléphone (CONFIG.ficheMobile = « profil ») : un profil centré —
   bouton pour quitter en haut à droite, photo ronde, nom et informations —, puis un bloc
   présentation et tarifs portant en bas à droite les deux actions en icônes (Contacter et
   Demander). Pour un pressing, deux vrais boutons à la place : « Composer mon pack » et
   « Contacter ». Les autres blocs suivent ; les avis clients ferment la page. */

const GRIS = "#5C5248";

const BLOC: React.CSSProperties = {
  background: "var(--color-neutral-100)",
  borderRadius: 24,
  padding: "18px 18px 16px",
  boxShadow: "0 1px 3px rgba(26,22,19,.06)",
};

const TITRE: React.CSSProperties = { margin: "0 0 10px", fontSize: "17px", fontWeight: 700 };

const STATUT_DOCUMENT = {
  verifie: { texte: "Vérifié", classe: "sy-badge--success" },
  en_attente: { texte: "En cours de vérification", classe: "sy-badge--neutral" },
  refuse: { texte: "Refusé", classe: "sy-badge--neutral" },
} as const;

export function FicheMobile({ p, onDemander, onComposerPack }: { p: FicheApi; onDemander: () => void; /** Pressing : ouvre la page du pack à la place de « Demander ». */ onComposerPack?: () => void }) {
  const { go, ouvrirChat } = useApp();
  const [contact, setContact] = useState(false);

  const zone = p.zone_intervention ?? [p.quartier?.nom, p.quartier?.ville].filter(Boolean).join(", ");
  // Un pressing facture à la pièce, sans déplacement ni diagnostic.
  const pressing = !!onComposerPack;
  const tarifs = p.tarifs.length ? p.tarifs : p.prix.affichage ? [{ libelle: pressing ? "Prix par pièce" : "Intervention", affichage: p.prix.affichage }] : [];
  // Quitter : revenir là d'où l'on vient (résultats, accueil, onglet…).
  const quitter = () => (window.history.length > 1 ? window.history.back() : go("home"));

  return (
    <main data-r="fiche-mobile" style={{ minHeight: "100vh", padding: "calc(12px + env(safe-area-inset-top)) 16px calc(100px + env(safe-area-inset-bottom))", background: "var(--color-surface)", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ---- Quitter, en haut à droite ---- */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={quitter}
          aria-label="Quitter la fiche"
          style={{ width: 44, height: 44, display: "grid", placeItems: "center", border: 0, borderRadius: 999, background: "var(--color-neutral-100)", boxShadow: "0 2px 8px rgba(26,22,19,.10)", color: "var(--color-text)", cursor: "pointer" }}
        >
          <Icon name="x" size={22} />
        </button>
      </div>

      {/* ---- Photo ronde, nom et informations ---- */}
      <section aria-label="Profil" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", marginTop: -20 }}>
        <span style={{ position: "relative" }}>
          {/* La photo du technicien prendra cette place ; ses initiales en attendant. */}
          <span
            data-r="photo-technicien"
            style={{ width: 112, height: 112, borderRadius: 999, background: "var(--color-accent-100)", color: "var(--color-accent-700)", border: "4px solid var(--color-neutral-100)", boxShadow: "0 4px 16px rgba(26,22,19,.12)", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "38px" }}
          >
            {p.initiales}
          </span>
          {p.verifie && (
            <span aria-label="Profil vérifié" style={{ position: "absolute", right: 2, bottom: 6, width: 30, height: 30, borderRadius: 999, background: "var(--state-success)", color: "#fff", border: "3px solid var(--color-surface)", display: "grid", placeItems: "center" }}>
              <Icon name="check" size={15} strokeWidth={3} />
            </span>
          )}
        </span>
        <h1 style={{ margin: "8px 0 0", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "26px", lineHeight: 1.15 }}>{p.nom}</h1>
        <span style={{ fontSize: "15px", color: GRIS }}>{p.metier}</span>
        {zone && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "14px", color: GRIS }}>
            <Icon name="map-pin" size={14} />
            {zone}
          </span>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 6 }}>
          <Rating value={p.note} count={p.nombre_avis} />
          {p.experience && (
            <span className="sy-badge sy-badge--neutral">
              Depuis {p.experience.depuis} · {p.experience.annees} ans
            </span>
          )}
        </div>
      </section>

      {/* ---- Présentation et tarifs, actions en bas à droite ---- */}
      <section data-r="bloc-presentation" aria-label="Présentation et tarifs" style={BLOC}>
        {p.description && <p style={{ margin: "0 0 14px", fontSize: "15px", lineHeight: 1.55 }}>{p.description}</p>}
        {tarifs.length > 0 && (
          <>
            <h2 style={TITRE}>Tarifs indicatifs</h2>
            {tarifs.map((t) => (
              <div key={t.libelle} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "8px 0", borderBottom: "1px solid var(--color-divider)", fontSize: "14.5px" }}>
                <span>{t.libelle}</span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{t.affichage ?? "Sur devis"}</span>
              </div>
            ))}
            <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: GRIS }}>
              {pressing ? "Prix indicatifs. Le pressing confirme le total à la réception du linge." : "Prix indicatifs. Le technicien confirme après diagnostic."}
            </p>
          </>
        )}
        {onComposerPack ? (
          // Pressing : l'action principale est un vrai bouton, lisible d'un coup d'œil.
          // Sur un écran étroit, les deux boutons passent l'un sous l'autre plutôt que de déborder.
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            <button onClick={onComposerPack} className="sy-btn sy-btn--primary sy-btn--md" style={{ flex: "1 1 auto", minHeight: 52, justifyContent: "center", gap: 8, padding: "0 16px" }}>
              <Icon name="shopping-basket" size={20} strokeWidth={2} />
              Composer mon pack
            </button>
            <button onClick={() => setContact(true)} aria-label="Contacter directement" className="sy-btn sy-btn--outline sy-btn--md" style={{ flex: "1 1 auto", minHeight: 52, justifyContent: "center", padding: "0 16px" }}>
              Contacter
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 18, marginTop: 14 }}>
            <Action libelle="Contacter" aria="Contacter directement" variante="contour" onClick={() => setContact(true)}>
              <Icon name="message-circle" size={24} strokeWidth={2} />
            </Action>
            <Action libelle="Demander" aria="Demander ce technicien" variante="plein" onClick={onDemander}>
              <Icon name="calendar-check" size={24} strokeWidth={2} />
            </Action>
          </div>
        )}
      </section>

      {p.prestations.length > 0 && (
        <section style={BLOC}>
          <h2 style={TITRE}>Prestations</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {p.prestations.map((x) => (
              <span key={x} className="sy-badge sy-badge--neutral">
                {x}
              </span>
            ))}
          </div>
        </section>
      )}

      {p.realisations.length > 0 && (
        <section style={BLOC}>
          <h2 style={TITRE}>Réalisations</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {p.realisations.map((r) => (
              <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <ImageSlot placeholder={r.legende} radius={12} style={{ height: 110 }} />
                <span style={{ fontSize: "12.5px", color: GRIS }}>{r.legende}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {p.horaires.length > 0 && (
        <section style={BLOC}>
          <h2 style={TITRE}>Disponibilités</h2>
          {p.horaires.map((d) => (
            <div key={d.jours} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "4px 0", fontSize: "14px" }}>
              <span style={{ color: GRIS }}>{d.jours}</span>
              <span>{d.ouverture && d.fermeture ? `${d.ouverture} – ${d.fermeture}` : "Fermé"}</span>
            </div>
          ))}
        </section>
      )}

      {(p.garanties.length > 0 || p.documents.length > 0) && (
        <section style={BLOC}>
          {p.garanties.length > 0 && (
            <>
              <h2 style={TITRE}>Garanties</h2>
              {p.garanties.map((g) => (
                <div key={g} style={{ display: "flex", alignItems: "center", gap: 9, padding: "3px 0" }}>
                  <Icon name="shield-check" size={17} color="var(--state-success)" />
                  <span style={{ fontSize: "14px" }}>{g}</span>
                </div>
              ))}
            </>
          )}
          {p.documents.length > 0 && (
            <>
              <h2 style={{ ...TITRE, marginTop: p.garanties.length ? 14 : 0 }}>Documents</h2>
              {p.documents.map((d) => (
                <div key={d.type} style={{ display: "flex", alignItems: "center", gap: 10, padding: "3px 0" }}>
                  <span style={{ flex: 1, fontSize: "14px" }}>{d.libelle}</span>
                  <span className={`sy-badge ${STATUT_DOCUMENT[d.statut].classe}`}>{STATUT_DOCUMENT[d.statut].texte}</span>
                </div>
              ))}
            </>
          )}
        </section>
      )}

      {/* ---- Avis clients, en bas ---- */}
      <section data-r="avis-clients" style={BLOC}>
        <h2 style={TITRE}>Avis clients</h2>
        {p.avis_recents.length === 0 && <p style={{ margin: 0, fontSize: "14px", color: GRIS }}>Pas encore d'avis publié sur TerraClick.</p>}
        {p.avis_recents.map((a, i) => (
          <div key={a.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--color-divider)" : 0 }}>
            <span style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: "var(--color-surface)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "14px" }}>
              {a.auteur.initiales}
            </span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 600 }}>{a.auteur.nom}</span>
                <Rating value={a.note} size={13} />
              </div>
              <span style={{ fontSize: "12.5px", color: GRIS }}>{a.date_affichage}</span>
              {a.commentaire && <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: GRIS }}>{a.commentaire}</p>}
            </div>
          </div>
        ))}
      </section>

      {/* ---- Contacter directement : appel, WhatsApp ou message ---- */}
      {contact && (
        <div onClick={() => setContact(false)} role="dialog" aria-modal="true" aria-label="Contacter directement" style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(26,22,19,.45)", display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "var(--color-neutral-100)", borderRadius: "24px 24px 0 0", padding: "18px 16px calc(18px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 6 }}>
            <strong style={{ fontSize: "17px", padding: "0 6px 6px" }}>Contacter {p.nom}</strong>
            {p.telephone && (
              <a href={`tel:+225${p.telephone.replace(/\D/g, "")}`} onClick={() => noterContact(p, "appel")} style={LIGNE}>
                <Icon name="phone" size={21} />
                Appeler · {p.telephone}
              </a>
            )}
            {p.telephone && (
              <a href={lienWhatsApp(p.telephone)} target="_blank" rel="noopener noreferrer" onClick={() => noterContact(p, "whatsapp")} style={LIGNE}>
                <Icon name="message-square" size={21} />
                WhatsApp
              </a>
            )}
            <button
              onClick={() => {
                setContact(false);
                noterContact(p, "message");
                ouvrirChat(versPrestataire(p));
              }}
              style={{ ...LIGNE, border: 0, background: "none", font: "inherit", textAlign: "left", cursor: "pointer" }}
            >
              <Icon name="message-circle" size={21} />
              Message dans TerraClick
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const LIGNE: React.CSSProperties = {
  minHeight: 54,
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "0 8px",
  borderRadius: 14,
  color: "var(--color-text)",
  fontSize: "16px",
  textDecoration: "none",
};

/** Action en icône ronde, avec un court libellé dessous. */
function Action(props: { libelle: string; aria: string; variante: "plein" | "contour"; onClick: () => void; children: ReactNode }) {
  const plein = props.variante === "plein";
  return (
    <button
      onClick={props.onClick}
      aria-label={props.aria}
      title={props.aria}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 0, border: 0, background: "none", font: "inherit", cursor: "pointer", color: "var(--color-text)" }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: plein ? "var(--color-accent)" : "var(--color-neutral-100)",
          color: plein ? "#fff" : "var(--color-accent-700)",
          border: plein ? 0 : "1.5px solid var(--color-accent)",
          boxShadow: plein ? "0 6px 16px rgba(227,90,27,.25)" : "none",
        }}
      >
        {props.children}
      </span>
      <span style={{ fontSize: "12.5px", fontWeight: 600 }}>{props.libelle}</span>
    </button>
  );
}
