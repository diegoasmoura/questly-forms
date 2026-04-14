import { useState, useRef, useEffect } from "react";
import { Copy, Trash2, RefreshCw, Check, AlertTriangle, ChevronDown, Calendar } from "lucide-react";
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
      await onExtend(link.id, days);
    } finally {
      setExtending(false);
    }
  };

  const handleCustomExtend = async () => {
    if (customDays > 0 && customDays <= 365) {
      await handleExtend(customDays);
      setShowCustomModal(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Excluir este link? Esta ação não pode ser desfeita.")) return;
    await onRevoke(link.id);
  };

  return (
    <>
      <div className={`p-4 rounded-lg border transition-all ${badge.bg} ${badge.border}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              <span className={`text-xs font-medium ${badge.text}`}>
                {badge.label}
              </span>
              {link.responseCount > 1 && (
                <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                  v{link.responseCount}
                </span>
              )}
              {isExpired && !link.lastResponseAt && (
                <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium flex items-center gap-1">
                  <AlertTriangle size={10} /> Sem resposta
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
              <p className="text-[10px] text-red-500 mt-1 font-medium">Paciente não respondeu</p>
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

          {/* Renewal Dropdown - aparece para PENDENTE e EXPIRADO */}
          {(isPending || (isExpired && !link.lastResponseAt)) && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowRenewalOptions(!showRenewalOptions)}
                disabled={extending || loading}
                className="btn btn-primary text-[10px] py-1.5 px-3 flex items-center gap-1"
                title="Renovar link"
              >
                <RefreshCw size={14} className={extending ? "animate-spin" : ""} />
                <span>Renovar</span>
                <ChevronDown size={12} />
              </button>

              {showRenewalOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-200 rounded-xl shadow-xl z-20 py-2 animate-scale-in">
                  <div className="px-3 py-2 border-b border-brand-100">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Renovar por</p>
                  </div>
                  {RENEWAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.days}
                      onClick={() => handleExtend(opt.days)}
                      disabled={extending}
                      className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-brand-50 flex items-center justify-between transition-colors ${
                        opt.recommended ? "bg-blue-50 text-blue-700" : "text-brand-700"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.recommended && (
                        <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Padrão</span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-brand-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowRenewalOptions(false);
                        setShowCustomModal(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-brand-600 hover:bg-brand-50 flex items-center gap-2 transition-colors"
                    >
                      <Calendar size={12} />
                      Personalizado...
                    </button>
                  </div>
                </div>
              )}
            </div>
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

      {/* Custom Renewal Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-950">Renovar Link</h3>
                <p className="text-xs text-brand-500">{link.form?.title}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-700 mb-2">
                  Quantos dias deseja adicionar?
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                  className="input"
                  autoFocus
                />
                <p className="text-[10px] text-brand-400 mt-1">
                  Expira em: {new Date(Date.now() + customDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[7, 15, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setCustomDays(d)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      customDays === d
                        ? "bg-brand-950 text-white"
                        : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    }`}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCustomModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleCustomExtend}
                disabled={customDays < 1 || customDays > 365}
                className="btn btn-primary flex-1"
              >
                <RefreshCw size={14} />
                Renovar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
