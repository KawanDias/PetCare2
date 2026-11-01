"use client";

import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const timeout = window.setTimeout(() => {
      setClosing(true);
      window.setTimeout(() => setVisible(false), 250);
    }, 5000);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);
  function close() {
    setClosing(true);
    window.setTimeout(() => setVisible(false), 250);
  }
  if (!event) return null;
  return (
    <>
      {visible && <aside className={`${closing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"} fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-2xl bg-gold p-4 text-sm font-semibold text-white shadow-lg shadow-black/5 transition-all duration-300 sm:left-auto sm:max-w-sm`}>
        <span>Instale o atalho do PetCare.</span>
        <div className="flex items-center gap-2"><button className="rounded-xl bg-cream px-3 py-2 text-stone-800" onClick={async () => { await event.prompt(); close(); }}>Instalar</button><button type="button" aria-label="Fechar aviso de instalação" className="rounded-lg px-2 py-1 text-white/80 hover:bg-black/10 hover:text-white" onClick={close}>×</button></div>
      </aside>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3"><span>Quer instalar o PetCare para acessar mais rápido?</span><button type="button" className="rounded-xl border border-gold px-3 py-2 font-semibold text-gold transition-colors hover:bg-gold hover:text-white" onClick={async () => { await event.prompt(); }}>Instalar aplicativo</button></div>
    </>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
  }
}
