import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

type Ton = "success" | "info" | "danger";
type Message = { titre: string; texte?: string; ton: Ton };

const ICONE: Record<Ton, string> = { success: "circle-check", info: "info", danger: "alert-triangle" };

const Ctx = createContext<(titre: string, texte?: string, ton?: Ton) => void>(() => {});

/** Confirmation éphémère après une action (classe sy-toast du design system). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Message | null>(null);
  const minuteur = useRef<number>();

  const afficher = useCallback((titre: string, texte?: string, ton: Ton = "success") => {
    window.clearTimeout(minuteur.current);
    setMessage({ titre, texte, ton });
    minuteur.current = window.setTimeout(() => setMessage(null), 4200);
  }, []);

  useEffect(() => () => window.clearTimeout(minuteur.current), []);

  return (
    <Ctx.Provider value={afficher}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: "calc(84px + env(safe-area-inset-bottom))",
            zIndex: 70,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div className={`sy-toast sy-toast--${message.ton}`} style={{ pointerEvents: "auto" }}>
            <span className="sy-toast__icon">
              <Icon name={ICONE[message.ton]} size={20} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="sy-toast__title">{message.titre}</div>
              {message.texte && <div className="sy-toast__desc">{message.texte}</div>}
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
