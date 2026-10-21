"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  texte: string;
  ton: "succes" | "erreur";
}

const Contexte = createContext<(texte: string, ton?: Toast["ton"]) => void>(() => undefined);

/** Messages éphémères de confirmation ou d'échec, annoncés aux lecteurs d'écran. */
export function FournisseurToasts({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const afficher = useCallback((texte: string, ton: Toast["ton"] = "succes") => {
    const id = Date.now() + Math.random();
    setToasts((l) => [...l, { id, texte, ton }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), ton === "erreur" ? 7000 : 3500);
  }, []);
  return (
    <Contexte.Provider value={afficher}>
      {children}
      <div aria-live="polite" className="no-print pointer-events-none fixed bottom-4 end-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-lg border bg-card px-4 py-3 text-[13px] shadow-lg animate-in fade-in-0 slide-in-from-bottom-2",
              t.ton === "erreur" ? "border-destructive/40" : "border-success/40"
            )}
          >
            {t.ton === "erreur" ? <XCircle size={16} className="mt-0.5 shrink-0 text-destructive" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />}
            <span>{t.texte}</span>
          </div>
        ))}
      </div>
    </Contexte.Provider>
  );
}

export function useToast() {
  return useContext(Contexte);
}
