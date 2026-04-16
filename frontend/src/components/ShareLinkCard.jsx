import { useState, useRef, useEffect } from "react";
import { Copy, Trash2, RefreshCw, Check, AlertTriangle, ChevronDown, Calendar, Link2 } from "lucide-react";
import { getStatusBadge, getDaysRemaining } from "../lib/useShareLinkStatus";

const RENEWAL_OPTIONS = [
  { days: 7, label: "+7 dias" },
  { days: 15, label: "+15 dias" },
  { days: 30, label: "+30 dias", recommended: true },
  { days: 60, label: "+60 dias" },
  { days: 90, label: "+90 dias" },
];

export default function ShareLinkCard({ 
  link, 
  onExtend, 
  onRevoke, 
  onCopy,
  loading = false 
}) {
  const [copied, setCopied] = useState(false);
  const [extending, setExtending] = useState(false);
  const [showRenewalOptions, setShowRenewalOptions] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDays, setCustomDays] = useState(30);
  const dropdownRef = useRef(null);

  const shareUrl = `${window.location.origin}/form/${link.token}`;
  const status = link.status || "EXPIRADO";
  const badge = getStatusBadge(status);
  const daysRemaining = getDaysRemaining(link.expiresAt);
  const isPending = status === "PENDENTE";
  const isExpired = status === "EXPIRADO";
  const isAnswered = status === "RESPONDIDO";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRenewalOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleExtend = async (days) => {
    setExtending(true);
    setShowRenewalOptions(false);
    try {
      await onExtend(link.id, days, isAnswered ? "newResponse" : "renewal");
    } finally {
      setExtending(false);
    }
  };

  const handleCustomExtend = async () => {
    if (customDays > 0 && customDays <= 365) {
      await onExtend(link.id, customDays, isAnswered ? "newResponse" : "renewal");
      setShowCustomModal(false);
    }
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
                  link.responseCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-600'
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

        {/* Dates + Link */}
        <div className="px-4 py-3 bg-white/60 border-t border-black/5">
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-slate-600">
                <span className="font-medium text-emerald-700">Criado:</span> {new Date(link.createdAt).toLocaleDateString('pt-BR')}
              </span>
              {link.lastResponseAt && (
                <span className="text-emerald-600">
                  <span className="font-medium">Última:</span> {new Date(link.lastResponseAt).toLocaleDateString('pt-BR')}
                </span>
              )}
              {link.expiresAt && (
                <span className={`${
                  isExpired ? "text-red-500" : 
                  daysRemaining && daysRemaining <= 7 ? "text-amber-600" : "text-slate-600"
                }`}>
                  <span className="font-medium">{isExpired ? "Expirou:" : "Expira:"}</span> {new Date(link.expiresAt).toLocaleDateString('pt-BR')}
                </span>
              )}
              {isExpired && !link.lastResponseAt && (
                <span className="text-red-500 font-medium flex items-center gap-1">
                  <AlertTriangle size={11} /> Sem resposta
                </span>
              )}
            </div>
          </div>

          {/* Link Row */}
          <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-black/5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link2 size={12} className="text-slate-500 shrink-0" />
              <span className="text-[10px] font-mono text-slate-600 truncate">{shareUrl}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-emerald-600 hover:text-slate-800 transition-colors bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-lg text-[10px] font-medium"
                title="Copiar link"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>

              {(isPending || isAnswered || (isExpired && !link.lastResponseAt)) && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowRenewalOptions(!showRenewalOptions)}
                    disabled={extending || loading}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isAnswered 
                        ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" 
                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    }`}
                    title={isAnswered ? "Solicitar novo" : "Renovar"}
                  >
                    <RefreshCw size={14} className={extending ? "animate-spin" : ""} />
                  </button>

                  {showRenewalOptions && (
                    <div className="absolute right-0 bottom-full mb-1 w-40 bg-white border border-emerald-200 rounded-xl shadow-lg z-20 py-1.5 animate-scale-in">
                      <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-emerald-100">
                        {isAnswered ? "Novo preenchimento" : "Renovar por"}
                      </p>
                      {RENEWAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.days}
                          onClick={() => handleExtend(opt.days)}
                          disabled={extending}
                          className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-emerald-50 flex items-center justify-between text-emerald-700"
                        >
                          <span>{opt.label}</span>
                          {opt.recommended && (
                            <span className="text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded">Padrão</span>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => { setShowRenewalOptions(false); setShowCustomModal(true); }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-emerald-50 flex items-center gap-2 text-emerald-600 border-t border-emerald-100 mt-1 pt-1.5"
                      >
                        <Calendar size={11} />
                        Personalizado...
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleRevoke}
                disabled={loading}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Renewal Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/20 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-5 animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Renovar Link</h3>
                <p className="text-xs text-slate-600">{link.form?.title}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-emerald-700 mb-1.5">Quantos dias?</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                  className="input"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Expira em: {new Date(Date.now() + customDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="flex gap-1.5">
                {[7, 15, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setCustomDays(d)}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-all ${
                      customDays === d
                        ? "bg-emerald-900 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCustomModal(false)} className="btn btn-secondary flex-1 text-xs py-2">
                Cancelar
              </button>
              <button
                onClick={handleCustomExtend}
                disabled={customDays < 1 || customDays > 365}
                className="btn btn-primary flex-1 text-xs py-2"
              >
                Renovar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ShareLinkStats({ counts }) {
  return (
    <div className="flex items-center gap-4 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="font-medium text-emerald-700">{counts.PENDENTE || 0}</span>
        <span className="text-slate-500">pendente{(counts.PENDENTE || 0) !== 1 ? 's' : ''}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="font-medium text-emerald-700">{counts.RESPONDIDO || 0}</span>
        <span className="text-slate-500">resposta{(counts.RESPONDIDO || 0) !== 1 ? 's' : ''}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        <span className="font-medium text-emerald-700">{counts.EXPIRADO || 0}</span>
        <span className="text-slate-500">expirado{(counts.EXPIRADO || 0) !== 1 ? 's' : ''}</span>
      </span>
    </div>
  );
}
