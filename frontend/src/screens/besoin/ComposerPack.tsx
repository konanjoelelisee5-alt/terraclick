import { useState } from "react";
import { api, type ArticlePressing } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { useApp } from "../../state/app";
import { Icon } from "../../components/Icon";
import { francs } from "../client/store";
import { PACK } from "./commun";

/* Page « Composer mon pack » (pressing), ouverte depuis la fiche d'un pressing ou par
   l'assistant : catégories en onglets, articles en cartes (icône, prix par pièce, − / +),
   et une barre fixe avec le nombre de pièces, le total estimé et « Continuer ». La suite —
   quartier, moment, confirmation — est celle de toute demande. Seuls les articles et leur
   nombre partent à l'API, qui recalcule les prix. */

const GRIS = "#5C5248";

const ICONE_CATEGORIE: Record<string, string> = { vetements: "shirt", tenues: "sparkles", maison: "bed-double" };

/** Photo de chaque catégorie, en bannière au-dessus des articles. */
const PHOTOS = `${import.meta.env.BASE_URL}images/secteurs/`;
const PHOTO_CATEGORIE: Record<string, string> = {
  vetements: `${PHOTOS}pressing-vetements.webp`,
  tenues: `${PHOTOS}pressing.webp`,
  maison: `${PHOTOS}pressing-linge.webp`,
};

const ROND: React.CSSProperties = {
  width: 36,
  height: 36,
  flex: "none",
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  font: "inherit",
  fontSize: "20px",
  lineHeight: 1,
  cursor: "pointer",
};

export function ComposerPack() {
  const { etat, go, modifierBesoin } = useApp();
  const b = etat.besoin;
  const { donnees: articles, erreur } = useApi(() => api.articlesPressing(), []);
  const categories = [...new Map((articles ?? []).map((a) => [a.categorie, a.categorie_nom])).entries()];
  const [categorie, setCategorie] = useState<string | null>(null);
  const active = categorie ?? categories[0]?.[0] ?? null;

  const quantite = (cle: string) => b.pack.find((a) => a.cle === cle)?.quantite ?? 0;
  const changer = (cle: string, delta: number) => {
    const suivant = Math.max(0, Math.min(200, quantite(cle) + delta));
    const reste = b.pack.filter((a) => a.cle !== cle);
    modifierBesoin({ pack: suivant ? [...reste, { cle, quantite: suivant }] : reste });
  };

  const prix = (cle: string) => articles?.find((a) => a.cle === cle)?.prix ?? 0;
  const pieces = b.pack.reduce((n, a) => n + a.quantite, 0);
  const total = b.pack.reduce((n, a) => n + a.quantite * prix(a.cle), 0);
  const parCategorie = (c: string) => b.pack.filter((a) => articles?.find((x) => x.cle === a.cle)?.categorie === c).reduce((n, a) => n + a.quantite, 0);

  const quitter = () => (window.history.length > 1 ? window.history.back() : go("home"));
  const continuer = () => {
    modifierBesoin({ probleme: PACK, secteur: "pressing" });
    go("besoin", { besoinEtape: 2 });
  };

  return (
    <main data-r="composer-pack" style={{ minHeight: "100vh", background: "var(--color-surface)", paddingBottom: "calc(200px + env(safe-area-inset-bottom))" }}>
      {/* ---- En-tête : le pressing choisi, et quitter ---- */}
      <div style={{ padding: "calc(14px + env(safe-area-inset-top)) 16px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "13.5px", color: GRIS }}>
            <Icon name="shirt" size={15} />
            {b.prestataire?.nom ?? "Pressing"}
          </span>
          <h1 style={{ margin: "4px 0 0", fontSize: "28px", lineHeight: 1.15 }}>Mon pack pressing</h1>
          <p style={{ margin: "6px 0 0", fontSize: "15px", color: GRIS }}>Choisissez ce que vous confiez au pressing. Prix indicatifs par pièce.</p>
        </div>
        <button
          onClick={quitter}
          aria-label="Quitter le pack"
          style={{ width: 44, height: 44, flex: "none", display: "grid", placeItems: "center", border: 0, borderRadius: 999, background: "var(--color-neutral-100)", boxShadow: "0 2px 8px rgba(26,22,19,.10)", color: "var(--color-text)", cursor: "pointer" }}
        >
          <Icon name="x" size={22} />
        </button>
      </div>

      {erreur && (
        <p role="alert" style={{ margin: "16px", color: "var(--state-danger)" }}>
          La liste des articles n'a pas pu être chargée.
        </p>
      )}

      {/* ---- Catégories ---- */}
      <nav aria-label="Catégories d'articles" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", padding: "18px 16px 4px" }}>
        {categories.map(([cle, nom]) => {
          const actif = cle === active;
          const n = parCategorie(cle);
          return (
            <button
              key={cle}
              aria-pressed={actif}
              onClick={() => setCategorie(cle)}
              style={{
                flex: "none",
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
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Icon name={ICONE_CATEGORIE[cle] ?? "shirt"} size={17} />
              {nom}
              {n > 0 && (
                <span style={{ minWidth: 22, height: 22, padding: "0 6px", borderRadius: 999, background: "var(--color-accent)", color: "#fff", fontSize: "12px", display: "grid", placeItems: "center" }}>{n}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ---- Photo de la catégorie ---- */}
      {active && PHOTO_CATEGORIE[active] && (
        <div style={{ padding: "12px 16px 0" }}>
          <div data-r="photo-categorie" style={{ position: "relative", height: 140, borderRadius: 22, overflow: "hidden" }}>
            <img src={PHOTO_CATEGORIE[active]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(26,22,19,.55))" }} />
            <strong style={{ position: "absolute", left: 16, bottom: 12, color: "#fff", fontSize: "18px" }}>{categories.find(([c]) => c === active)?.[1]}</strong>
          </div>
        </div>
      )}

      {/* ---- Articles en cartes ---- */}
      <div data-r="pack-pressing" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, padding: "12px 16px 0" }}>
        {(articles ?? [])
          .filter((a) => a.categorie === active)
          .map((a) => (
            <CarteArticle key={a.cle} article={a} quantite={quantite(a.cle)} onChanger={(d) => changer(a.cle, d)} />
          ))}
      </div>

      {/* ---- Barre fixe : pièces, total, continuer ---- */}
      <div
        data-r="total-pack"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          // Au-dessus de la barre du bas et de son bouton central surélevé.
          bottom: "calc(100px + env(safe-area-inset-bottom))",
          zIndex: 30,
          margin: "0 12px",
          padding: "12px 12px 12px 18px",
          borderRadius: 22,
          background: "var(--color-text)",
          color: "var(--color-neutral-100)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 10px 30px rgba(26,22,19,.25)",
        }}
      >
        <span role="status" style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "13px", opacity: 0.8 }}>
            {pieces} pièce{pieces > 1 ? "s" : ""}
          </span>
          <strong style={{ display: "block", fontSize: "18px" }}>Total estimé : {francs(total)}</strong>
        </span>
        <button
          onClick={continuer}
          disabled={!pieces}
          className="sy-btn sy-btn--primary sy-btn--md"
          style={{ flex: "none", minHeight: 48, opacity: pieces ? 1 : 0.5 }}
        >
          Continuer
        </button>
      </div>
    </main>
  );
}

/** Carte d'un article : icône, nom, prix par pièce, puis − nombre +. */
function CarteArticle({ article: a, quantite: n, onChanger }: { article: ArticlePressing; quantite: number; onChanger: (delta: number) => void }) {
  return (
    <div
      data-r="article-pack"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 14,
        borderRadius: 20,
        background: "var(--color-neutral-100)",
        border: `2px solid ${n ? "var(--color-accent)" : "transparent"}`,
        boxShadow: "0 1px 3px rgba(26,22,19,.06)",
      }}
    >
      <span style={{ width: 52, height: 52, borderRadius: 16, background: n ? "var(--color-accent-100)" : "var(--color-surface)", color: n ? "var(--color-accent-700)" : "var(--color-text)", display: "grid", placeItems: "center" }}>
        <Icon name={ICONE_CATEGORIE[a.categorie] ?? "shirt"} size={26} strokeWidth={1.75} />
      </span>
      <span>
        <span style={{ display: "block", fontSize: "15px", fontWeight: 700, lineHeight: 1.25 }}>{a.nom}</span>
        <span style={{ display: "block", fontSize: "13px", color: GRIS, marginTop: 2 }}>{a.prix_affichage} / pièce</span>
      </span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => onChanger(-1)}
          disabled={!n}
          aria-label={`Retirer : ${a.nom}`}
          style={{ ...ROND, border: "1.5px solid var(--color-divider)", background: "var(--color-neutral-100)", color: "var(--color-text)", opacity: n ? 1 : 0.35 }}
        >
          <span aria-hidden="true">−</span>
        </button>
        <span aria-label={`${n} ${a.nom}`} style={{ fontSize: "17px", fontWeight: 800 }}>
          {n}
        </span>
        <button
          type="button"
          onClick={() => onChanger(1)}
          aria-label={`Ajouter : ${a.nom}`}
          style={{ ...ROND, border: 0, background: "var(--color-accent)", color: "#fff" }}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
