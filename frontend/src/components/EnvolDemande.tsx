import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/* « Demande envoyée » (CONFIG.envoiDemande = « envol ») : le parcours s'arrête à l'envoi. Une
   fenêtre confirme l'envoi, puis se plie en avion en papier qui vole en arc jusqu'au bouton
   « Mes onglets » de la barre du bas, où la demande se suit désormais ; le bouton rebondit à
   l'atterrissage. Sans ce bouton (ordinateur), l'avion file vers le haut de l'écran et les
   onglets s'ouvrent. Mouvement réduit demandé : la fenêtre s'affiche, puis s'efface. */

export type InfoEnvol = { titre: string; reference: string; texte: string };

type Detail = { info: InfoEnvol; sansCible?: () => void };

const EVENEMENT = "tc-envol-demande";

/** Lance l'animation, par-dessus l'écran en cours (l'appelant peut changer d'écran aussitôt). */
export function lancerEnvol(info: InfoEnvol, options: { sansCible?: () => void } = {}) {
  window.dispatchEvent(new CustomEvent<Detail>(EVENEMENT, { detail: { info, ...options } }));
}

/** Le bouton « Mes onglets » s'il est affiché (la barre du bas est cachée sur ordinateur). */
function cibleVisible(): HTMLElement | null {
  const bouton = document.querySelector<HTMLElement>('[data-r="onglet-central"]');
  const r = bouton?.getBoundingClientRect();
  return bouton && r && r.width > 0 && r.height > 0 ? bouton : null;
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Point d'une courbe de Bézier cubique, et sa direction (pour orienter l'avion). */
function bezier(t: number, p: [number, number][]): { x: number; y: number; angle: number } {
  const u = 1 - t;
  const x = u ** 3 * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t ** 3 * p[3][0];
  const y = u ** 3 * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t ** 3 * p[3][1];
  const dx = 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]);
  const dy = 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const lisse = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function EnvolDemande() {
  const [envol, setEnvol] = useState<Detail | null>(null);
  const fond = useRef<HTMLDivElement>(null);
  const carte = useRef<HTMLDivElement>(null);
  const avion = useRef<HTMLDivElement>(null);
  const anneau = useRef<HTMLDivElement>(null);
  const plus = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surEnvol = (e: Event) => setEnvol((e as CustomEvent<Detail>).detail);
    window.addEventListener(EVENEMENT, surEnvol);
    return () => window.removeEventListener(EVENEMENT, surEnvol);
  }, []);

  useEffect(() => {
    if (!envol) return;
    let arrete = false;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      const c = carte.current!;
      // 1 · La fenêtre arrive, en rebond.
      fond.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: "forwards" });
      await c.animate(
        [
          { opacity: 0, transform: "translateY(40px) scale(.6)" },
          { opacity: 1, transform: "translateY(-6px) scale(1.04)", offset: 0.7 },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: 480, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "forwards" },
      ).finished;
      await attendre(reduit ? 1600 : 1300);
      if (arrete) return;

      if (reduit) {
        await Promise.all([
          c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }).finished,
          fond.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }).finished,
        ]);
        if (!cibleVisible()) envol.sansCible?.();
        setEnvol(null);
        return;
      }

      // 2 · Elle se plie : elle bascule, rétrécit, et l'avion en papier prend sa place.
      const r = c.getBoundingClientRect();
      const depart: [number, number] = [r.left + r.width / 2, r.top + r.height / 2];
      const a = avion.current!;
      a.style.transform = `translate(${depart[0] - 32}px, ${depart[1] - 32}px)`;
      c.animate(
        [
          { transform: "perspective(700px) rotateX(0) scale(1)", opacity: 1 },
          { transform: "perspective(700px) rotateX(60deg) rotateZ(-10deg) scale(.7)", opacity: 0.9, offset: 0.55 },
          { transform: "perspective(700px) rotateX(85deg) rotateZ(-35deg) scale(.15)", opacity: 0 },
        ],
        { duration: 460, easing: "ease-in", fill: "forwards" },
      );
      await attendre(220);
      await a.animate(
        [
          { opacity: 0, transform: `translate(${depart[0] - 32}px, ${depart[1] - 32}px) rotate(-30deg) scale(.3)` },
          { opacity: 1, transform: `translate(${depart[0] - 32}px, ${depart[1] - 32}px) rotate(-10deg) scale(1.1)` },
          { opacity: 1, transform: `translate(${depart[0] - 32}px, ${depart[1] - 32}px) rotate(-20deg) scale(1)` },
        ],
        { duration: 320, easing: "ease-out", fill: "forwards" },
      ).finished;
      if (arrete) return;

      // 3 · Il vole en arc jusqu'au bouton « Mes onglets » (ou vers le haut, sans ce bouton).
      const bouton = cibleVisible();
      const b = bouton?.getBoundingClientRect();
      const arrivee: [number, number] = b ? [b.left + b.width / 2, b.top + b.height / 2] : [window.innerWidth - 40, -40];
      const points: [number, number][] = [
        depart,
        [depart[0] + 150, depart[1] - 240],
        [arrivee[0] + 170, arrivee[1] - 320],
        arrivee,
      ];
      const images = Array.from({ length: 31 }, (_, i) => {
        const t = lisse(i / 30);
        const p = bezier(t, points);
        const echelle = 1 - 0.65 * t;
        return { offset: i / 30, transform: `translate(${p.x - 32}px, ${p.y - 32}px) rotate(${p.angle}deg) scale(${echelle})`, opacity: i === 30 ? 0.2 : 1 };
      });
      fond.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 300, fill: "forwards" });
      await a.animate(images, { duration: 1150, fill: "forwards" }).finished;
      if (arrete) return;
      a.animate([{ opacity: 0.2 }, { opacity: 0 }], { duration: 120, fill: "forwards" });

      // 4 · Atterrissage : le bouton rebondit, une onde et un « +1 » en partent.
      if (bouton && b) {
        for (const el of [anneau.current!, plus.current!]) {
          el.style.left = `${arrivee[0]}px`;
          el.style.top = `${arrivee[1]}px`;
        }
        bouton.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(.92)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
          { duration: 600, easing: "ease-out" },
        );
        anneau.current!.animate(
          [
            { opacity: 0.7, transform: "translate(-50%, -50%) scale(.6)" },
            { opacity: 0, transform: "translate(-50%, -50%) scale(2.4)" },
          ],
          { duration: 700, easing: "ease-out", fill: "forwards" },
        );
        await plus.current!.animate(
          [
            { opacity: 0, transform: "translate(-50%, -50%) translateY(0) scale(.6)" },
            { opacity: 1, transform: "translate(-50%, -50%) translateY(-46px) scale(1.1)", offset: 0.4 },
            { opacity: 0, transform: "translate(-50%, -50%) translateY(-70px) scale(1)" },
          ],
          { duration: 900, easing: "ease-out", fill: "forwards" },
        ).finished;
      } else {
        envol.sansCible?.();
      }
      if (!arrete) setEnvol(null);
    })();

    return () => {
      arrete = true;
    };
  }, [envol]);

  if (!envol) return null;
  const { info } = envol;

  return (
    <div data-r="envol-demande" role="status" aria-live="polite" style={{ position: "fixed", inset: 0, zIndex: 90, pointerEvents: "none" }}>
      <div ref={fond} style={{ position: "absolute", inset: 0, background: "rgba(26,22,19,.45)", opacity: 0 }} />
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24 }}>
        <div
          ref={carte}
          style={{
            width: "min(320px, 100%)",
            padding: "28px 22px 24px",
            borderRadius: 28,
            background: "var(--color-neutral-100)",
            boxShadow: "0 24px 60px rgba(26,22,19,.3)",
            textAlign: "center",
            opacity: 0,
            transformOrigin: "50% 60%",
          }}
        >
          <span style={{ width: 72, height: 72, margin: "0 auto 14px", borderRadius: 999, background: "var(--state-success-soft)", color: "var(--state-success)", display: "grid", placeItems: "center" }}>
            <Icon name="check" size={38} strokeWidth={2.75} />
          </span>
          <h2 style={{ margin: 0, fontSize: "24px" }}>{info.titre}</h2>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: "var(--color-neutral-700)" }}>Référence {info.reference}</p>
          <p style={{ margin: "12px 0 0", fontSize: "15px", lineHeight: 1.45 }}>{info.texte}</p>
        </div>
      </div>

      {/* L'avion en papier : vu de dessus, pointe vers la droite (rotation 0). */}
      <div ref={avion} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: 64, height: 64, opacity: 0, filter: "drop-shadow(0 8px 10px rgba(26,22,19,.25))" }}>
        {/* Dessiné pointe en haut à droite : tourné de 40° pour viser la droite. */}
        <svg viewBox="0 0 64 64" width="64" height="64" style={{ transform: "rotate(40deg)" }}>
          <path d="M4 30 L60 8 L38 58 L30 38 Z" fill="#fff" stroke="var(--color-text)" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M30 38 L60 8 L22 34 Z" fill="var(--color-accent)" stroke="var(--color-text)" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M30 38 L28 50 L38 44" fill="var(--color-accent-700, #B5431A)" stroke="var(--color-text)" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </div>

      <div ref={anneau} aria-hidden="true" style={{ position: "absolute", width: 64, height: 64, borderRadius: 999, border: "3px solid var(--color-accent)", opacity: 0 }} />
      <div
        ref={plus}
        aria-hidden="true"
        style={{ position: "absolute", padding: "4px 10px", borderRadius: 999, background: "var(--color-accent)", color: "#fff", fontWeight: 800, fontSize: "15px", opacity: 0 }}
      >
        +1
      </div>
    </div>
  );
}
