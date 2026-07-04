import { Users } from "lucide-react";

export function PatientProfileWidget({ activePatients, monthPatientIds, genderData, ageData, maxAge }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex-shrink-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-1">Perfil da Base</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-[28px] font-extrabold text-[var(--text-primary)] leading-none">{activePatients}</span>
            <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Pacientes ativos</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">{monthPatientIds.size} atendidos este mês</p>
        </div>
      </div>

      <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Gênero</p>
      
      {/* MOBILE (Pills) */}
      <div className="flex md:hidden flex-wrap gap-2 mb-4">
        {genderData.map(g => (
          <div key={g.label} className="flex items-center gap-1.5 bg-[var(--surface-alt)] px-3 py-1.5 rounded-[8px]">
            <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: g.color }} />
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {g.label} <span className="font-extrabold text-[var(--text-primary)] ml-0.5">{g.pct}%</span>
            </span>
          </div>
        ))}
      </div>

      {/* DESKTOP (Pie Chart) */}
      <div className="hidden md:flex gap-3 items-center mb-4">
        <div className="relative w-[60px] h-[60px] flex-shrink-0">
          <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
            <circle cx="36" cy="36" r="28" fill="none" stroke="var(--surface-alt)" strokeWidth="10" />
            {(() => {
              let offset = 0;
              return genderData.map((g, i) => {
                const circ = 2 * Math.PI * 28;
                const dash = (g.pct / 100) * circ;
                const el = (
                  <circle key={i} cx="36" cy="36" r="28" fill="none"
                    stroke={g.color} strokeWidth="10" strokeLinecap="butt"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += dash;
                return el;
              });
            })()}
          </svg>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          {genderData.map((g) => (
            <div key={g.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: g.color }} />
                <span className="text-[11px] text-[var(--text-secondary)]">{g.label}</span>
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)]">{g.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Faixa etária</p>
      <div className="flex flex-col gap-1.5">
        {ageData.map((g) => (
          <div key={g.label} className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-secondary)] w-[40px] flex-shrink-0">{g.label}</span>
            <div className="flex-1 h-[6px] bg-[var(--surface-alt)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--sage)] transition-all duration-500"
                style={{ width: `${Math.round((g.value / maxAge) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-[var(--text-primary)] w-[16px] text-right">{g.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
