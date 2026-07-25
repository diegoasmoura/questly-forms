import React from 'react';
import { createPortal } from 'react-dom';
import { RefreshCcw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PwaUpdateModal() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // O SW foi registrado
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh && !offlineReady) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-[calc(100%-2rem)] bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl shadow-card animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--sage-light)] text-[var(--dark-green)] shrink-0">
          <RefreshCcw size={20} className={needRefresh ? "animate-spin-slow" : ""} />
        </div>
        
        <div className="flex-1">
          <h4 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">
            {needRefresh ? "Nova atualização disponível" : "Aplicativo pronto"}
          </h4>
          <p className="text-[13px] text-[var(--text-secondary)] mb-3">
            {needRefresh
              ? "Uma nova versão do sistema foi encontrada. Atualize para ver as mudanças."
              : "O sistema agora funciona off-line perfeitamente!"}
          </p>
          
          <div className="flex items-center gap-2">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="px-4 py-2 bg-[var(--sage)] hover:bg-[#4DAF8A] text-white text-sm font-bold rounded-button transition-colors"
              >
                Atualizar agora
              </button>
            )}
            <button
              onClick={close}
              className="px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)] text-sm font-semibold rounded-button transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

        <button 
          onClick={close}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>
    </div>,
    document.body
  );
}
