import { CakeSlice } from "lucide-react";
import { getAvatarProps } from "./Shared";

export function BirthdaysWidget({ upcomingBirthdays }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex flex-col lg:h-full lg:min-h-0">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-3 flex items-center gap-1.5 flex-shrink-0">
        <CakeSlice size={13} className="text-[var(--peach)]" />
        Aniversários (7 dias)
      </p>
      
      {upcomingBirthdays.length === 0 ? (
        <p className="text-[12px] text-[var(--text-muted)] py-2">Nenhum próximo</p>
      ) : (
        <>
          {/* DESKTOP (Vertical List) */}
          <div className="hidden md:flex flex-col gap-2.5 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1">
            {upcomingBirthdays.map((p) => {
              const { initials, color: avatarColor } = getAvatarProps(p.name);
              return (
                <div key={p.id} className="flex items-center gap-2.5 flex-shrink-0">
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

          {/* MOBILE (Stories Carousel) */}
          <div className="flex md:hidden gap-4 overflow-x-auto hide-scrollbar pb-2 pt-1 -mx-2 px-2 flex-shrink-0">
            {upcomingBirthdays.map((p) => {
              const { initials, color: avatarColor } = getAvatarProps(p.name);
              return (
                <div key={p.id} className="flex flex-col items-center flex-shrink-0 w-[54px]">
                  <div 
                    className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[14px] font-extrabold flex-shrink-0 ring-2 ring-[var(--peach-light)] ring-offset-2 ring-offset-[var(--surface)]"
                    style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                  >
                    {initials}
                  </div>
                  <p className="text-[11px] font-bold text-[var(--text-primary)] truncate w-full text-center leading-tight mt-2">{p.name.split(" ")[0]}</p>
                  <p className="text-[9px] font-bold text-[var(--peach)] truncate w-full text-center leading-tight mt-0.5">
                    {p.daysUntil === 0 ? "Hoje!" : p.daysUntil === 1 ? "Amanhã" : `em ${p.daysUntil}d`}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
