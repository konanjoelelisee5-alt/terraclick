import { useEffect, useRef } from "react";
import { useApp } from "../state/app";
import { Icon } from "../components/Icon";

const SUGGESTIONS = ["C'est combien ?", "Vous êtes dispo quand ?", "Vous venez à Habitat ?"];

/** Messagerie interne : la mise en relation se fait ici avant tout appel. */
export function Chat() {
  const { etat, set, go, envoyerMessage } = useApp();
  const filRef = useRef<HTMLDivElement>(null);

  // Le fil suit toujours le dernier message.
  useEffect(() => {
    const fil = filRef.current;
    if (fil) fil.scrollTop = fil.scrollHeight;
  }, [etat.messages.length]);

  return (
    <main
      data-r="chat-main"
      style={{
        maxWidth: 780,
        margin: "0 auto",
        padding: "20px 24px 32px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 68px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingBottom: 14,
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <button onClick={() => go("home")} className="sy-btn sy-btn--ghost sy-btn--md" aria-label="Retour">
          ←
        </button>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: "999px",
            background: "var(--color-accent-200)",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-heading)",
            color: "var(--color-accent-800)",
          }}
        >
          {etat.active.ini}
        </span>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>{etat.active.nom}</div>
          <div style={{ fontSize: "12.5px", color: "var(--color-accent-2-700)" }}>
            en ligne · {etat.active.metier}
          </div>
        </div>
        <button className="sy-btn sy-btn--outline sy-btn--md" style={{ marginLeft: "auto", gap: 7 }}>
          <Icon name="phone" size={16} strokeWidth={2.75} />
          Appeler
        </button>
      </div>

      <div
        ref={filRef}
        style={{ flex: 1, overflow: "auto", padding: "20px 2px", display: "flex", flexDirection: "column", gap: 10 }}
      >
        {etat.messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.moi ? "flex-end" : "flex-start" }}>
            <div
              style={{
                maxWidth: "74%",
                padding: "11px 15px",
                fontSize: "14.5px",
                lineHeight: 1.45,
                borderRadius: m.moi ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.moi ? "var(--color-accent)" : "var(--color-surface)",
                color: m.moi ? "var(--color-bg)" : "var(--color-text)",
              }}
            >
              {m.texte}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 12 }}>
        {SUGGESTIONS.map((texte) => (
          <button
            key={texte}
            onClick={() => envoyerMessage(texte)}
            className="sy-btn sy-btn--outline sy-btn--md"
            style={{ fontSize: "13px", padding: "6px 14px" }}
          >
            {texte}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: "1px solid var(--color-divider)" }}>
        <input
          className="sy-input"
          value={etat.draft}
          onChange={(e) => set({ draft: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && envoyerMessage(etat.draft)}
          placeholder="Écrivez votre message…"
          aria-label="Votre message"
          style={{ flex: 1, minHeight: 46, background: "var(--color-neutral-100)" }}
        />
        <button
          onClick={() => envoyerMessage(etat.draft)}
          className="sy-btn sy-btn--primary sy-btn--md"
          style={{ minHeight: 46, paddingInline: 24 }}
        >
          Envoyer
        </button>
      </div>
    </main>
  );
}
