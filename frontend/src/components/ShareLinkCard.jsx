import { useState } from "react";
import { Copy, Trash2, Check, Link2 } from "lucide-react";
import { getStatusBadge } from "../lib/useShareLinkStatus";

export default function ShareLinkCard({ 
  link, 
  onRevoke, 
  onCopy,
  loading = false 
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/form/${link.token}`;
  const status = link.status || "PENDENTE";
  const badge = getStatusBadge(status);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleRevoke = async () => {
    if (!confirm("Excluir este link? Esta ação não pode ser desfeita.")) return;
    await onRevoke(link.id);
  };

  return (
    <>
      <div className={`rounded-xl border transition-all overflow-visible relative ${badge.bg} ${badge.border}`}>
        {/* Title + Status + Responses Count */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base text-slate-900">{link.form?.title || "Formulário"}</h3>
              {link.responseCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${
                  link.responseCount > 0 ? 'bg-secondary-100 text-secondary-700' : 'bg-secondary-100 text-secondary-600'
                }`}>
                  {link.responseCount} resposta{link.responseCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${badge.bg} ${badge.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>
        </div>

        {/* Info + Link Row */}
        <div className="px-4 py-3 bg-white/60 border-t border-black/5">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-600 text-xs shrink-0">
              <span className="font-medium text-brand-700">Criado:</span> {new Date(link.createdAt).toLocaleDateString('pt-BR')}
            </span>
            {link.lastResponseAt && (
              <span className="text-brand-600 text-xs shrink-0">
                <span className="font-medium">Última:</span> {new Date(link.lastResponseAt).toLocaleDateString('pt-BR')}
              </span>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link2 size={12} className="text-slate-500 shrink-0" />
              <span className="text-[10px] font-mono text-slate-600 truncate">{shareUrl}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-brand-600 hover:text-slate-800 transition-colors bg-brand-100 hover:bg-brand-200 px-2 py-1 rounded-lg text-[10px] font-medium shrink-0"
              title="Copiar link"
            >
              {copied ? <Check size={11} className="text-brand-500" /> : <Copy size={11} />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <button
              onClick={handleRevoke}
              disabled={loading}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors shrink-0"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function ShareLinkStats({ counts }) {
  return (
    <div className="flex items-center gap-4 p-2.5 bg-secondary-50 rounded-lg border border-secondary-100 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="font-medium text-amber-700">{counts.PENDENTE || 0}</span>
        <span className="text-slate-500">pendente{(counts.PENDENTE || 0) !== 1 ? 's' : ''}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
        <span className="font-medium text-secondary-700">{counts.RESPONDIDO || 0}</span>
        <span className="text-slate-500">resposta{(counts.RESPONDIDO || 0) !== 1 ? 's' : ''}</span>
      </span>
    </div>
  );
}
