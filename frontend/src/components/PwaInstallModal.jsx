import React from 'react';
import { createPortal } from 'react-dom';
import { X, Share, PlusSquare } from 'lucide-react';

export default function PwaInstallModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-[#101722]/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
      <div className="bg-[var(--bg)] w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in border border-[var(--border)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--surface-alt)]"
        >
          <X size={20} />
        </button>

        <div className="p-6 pt-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[var(--surface-alt)] rounded-[16px] border border-[var(--border)] flex items-center justify-center mb-4 shadow-sm">
            <img src="/logo-icon.png" alt="Questly" className="w-10 h-10 object-contain" />
          </div>
          
          <h3 className="font-brand text-2xl text-[var(--text-primary)] mb-2">Instale o App</h3>
          <p className="text-[var(--text-secondary)] text-[15px] mb-6 leading-relaxed">
            Instale o Questly Forms no seu iPhone para uma experiência mais rápida e em tela cheia.
          </p>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-5 w-full text-left flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center shrink-0">
                1
              </div>
              <p className="text-[14px] text-[var(--text-primary)] flex items-center gap-2">
                Toque em <Share size={18} className="text-[var(--blue)]" /> (Compartilhar)
              </p>
            </div>
            
            <div className="w-[1px] h-4 bg-[var(--border)] ml-4 -my-2"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center shrink-0">
                2
              </div>
              <p className="text-[14px] text-[var(--text-primary)] flex items-center gap-2">
                Role para baixo e selecione <br/>
                <span className="font-bold flex items-center gap-1"><PlusSquare size={16} /> Adicionar à Tela de Início</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mt-6 w-full py-3.5 bg-[var(--sage)] hover:bg-[var(--sage-light)] hover:text-[var(--dark-green)] text-white font-bold rounded-button transition-all shadow-sm"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
