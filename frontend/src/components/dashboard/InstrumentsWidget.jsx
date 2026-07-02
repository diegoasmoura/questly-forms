import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function InstrumentsWidget({ completionRate, totalResponses, totalSent, topForm, formStats }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex flex-col justify-between">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-1">Instrumentos Clínicos</p>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">Avaliações enviadas</p>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-[60px] h-[60px] flex-shrink-0">
            <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
              <circle cx="36" cy="36" r="28" fill="none" stroke="var(--surface-alt)" strokeWidth="8" />
              <circle
                cx="36" cy="36" r="28" fill="none"
                stroke={completionRate > 70 ? "#5CBF9D" : completionRate > 40 ? "#F8A26B" : "#7C5CFF"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(completionRate / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold text-[var(--text-primary)]">
              {completionRate}%
            </span>
          </div>
          <div>
            <p className="text-[12px] font-bold text-[var(--text-primary)] leading-tight">Taxa de resposta</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{totalResponses} de {totalSent}</p>
          </div>
        </div>

        {topForm && (
          <div className="bg-[var(--surface-alt)] rounded-[12px] p-2.5 mb-3">
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Mais utilizado</p>
            <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{topForm.name}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{formStats[topForm.id]?.responseCount || 0} respostas</p>
          </div>
        )}
      </div>

      <Link to="/my-forms" className="flex items-center justify-center gap-1.5 w-full py-2 rounded-[10px] border border-[var(--border)] text-[12px] font-bold text-[var(--dark-green)] dark:text-[#5CBF9D] hover:bg-[var(--sage-light)] transition-colors mt-auto">
        Ver todos <ArrowRight size={12} />
      </Link>
    </div>
  );
}
