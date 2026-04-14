import { useState } from "react";
import { Copy, Trash2, RefreshCw, ExternalLink, Check, AlertTriangle } from "lucide-react";
import { getStatusBadge, getDaysRemaining } from "../lib/useShareLinkStatus";

export default function ShareLinkCard({ 
  link, 
  onExtend, 
  onRevoke, 
  onCopy,
  loading = false 
}) {
  const [copied, setCopied] = useState(false);
  const [extending, setExtending] = useState(false);
  
  const shareUrl = `${window.location.origin}/form/${link.token}`;
  const status = link.status || "EXPIRADO";
  const badge = getStatusBadge(status);
  const daysRemaining = getDaysRemaining(link.expiresAt);
  const isPending = status === "PENDENTE";
  const isExpired = status === "EXPIRADO";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleExtend = async () => {
    setExtending(true);
    try {
      await onExtend(link.id);
    } finally {
      setExtending(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Excluir este link? Esta ação não pode ser desfeita.")) return;
    await onRevoke(link.id);
  };

  return (
    <div className={`p-4 rounded-lg border transition-all ${badge.bg} ${badge.border}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            <span className={`text-xs font-medium ${badge.text}`}>
              {badge.label}
            </span>
            {link.responseCount > 1 && (
              <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                v{link.responseCount}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-brand-950">{link.form?.title || "Formulário"}</p>
          <p className="text-[10px] text-brand-400 mt-1">
            Criado em {new Date(link.createdAt).toLocaleDateString('pt-BR')} · {new Date(link.createdAt).toLocaleTimeString('pt-BR')}
          </p>
          {link.lastResponseAt && (
            <p className="text-[10px] text-emerald-600 mt-1">
              ✓ Respondido em {new Date(link.lastResponseAt).toLocaleDateString('pt-BR')} · {new Date(link.lastResponseAt).toLocaleTimeString('pt-BR')}
            </p>
          )}
          {isPending && daysRemaining !== null && (
            <p className="text-[10px] text-brand-400 mt-1">
              {daysRemaining > 0 ? (
                <span className="text-amber-600">{daysRemaining} dias restantes</span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertTriangle size={10} /> Expirado
                </span>
              )}
            </p>
          )}
          {isExpired && !link.lastResponseAt && (
            <p className="text-[10px] text-red-500 mt-1">Expirado sem resposta</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          readOnly
          className="input flex-1 bg-white/80 font-mono text-[10px] py-1.5"
          value={shareUrl}
        />
        <button
          onClick={handleCopy}
          className="btn btn-secondary text-[10px] py-1.5 px-3"
          title="Copiar link"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        </button>
        {isPending && (
          <button
            onClick={handleExtend}
            disabled={extending || loading}
            className="btn btn-ghost text-[10px] py-1.5 px-3 text-blue-600 hover:bg-blue-50"
            title="Renovar (+30 dias)"
          >
            <RefreshCw size={14} className={extending ? "animate-spin" : ""} />
          </button>
        )}
        <button
          onClick={handleRevoke}
          disabled={loading}
          className="btn btn-ghost text-[10px] py-1.5 px-3 text-red-600 hover:bg-red-50"
          title="Excluir link"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function ShareLinkStats({ counts, compliance }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-brand-50 rounded-lg border border-brand-100">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="text-[10px] font-bold text-brand-700">{counts.PENDENTE || 0} Pendentes</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-bold text-brand-700">{counts.RESPONDIDO || 0} Respondidos</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-[10px] font-bold text-brand-700">{counts.EXPIRADO || 0} Expirados</span>
      </div>
      <div className="ml-auto">
        <span className="text-[10px] font-black text-brand-950">
          {compliance}% compliance
        </span>
      </div>
    </div>
  );
}
