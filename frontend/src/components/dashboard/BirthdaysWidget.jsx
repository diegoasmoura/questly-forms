import { CakeSlice } from "lucide-react";
import { getAvatarProps } from "./Shared";

export function BirthdaysWidget({ upcomingBirthdays }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex flex-col justify-between">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-3 flex items-center gap-1.5 flex-shrink-0">
          <CakeSlice size={13} className="text-[var(--peach)]" />
          Aniversários (7 dias)
        </p>
        {upcomingBirthdays.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)] py-2">Nenhum próximo</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {upcomingBirthdays.slice(0, 4).map((p) => {
              const { initials, color: avatarColor } = getAvatarProps(p.name);
              return (
                <div key={p.id} className="flex items-center gap-2.5">
                  <div 
                    className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                    style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{p.name.split(" ")[0]}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {p.daysUntil === 0 ? "🎉 Hoje!" : p.daysUntil === 1 ? "Amanhã" : `em ${p.daysUntil} dias`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
