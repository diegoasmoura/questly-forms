import { Link } from "react-router-dom";
import { Calendar, Leaf, ArrowRight } from "lucide-react";
import { formatDateKey } from "../../hooks/useDashboardData";

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AgendaWidget({ today, todayEvents, upcomingDays, onEventClick, TimelineRow }) {
  return (
    <div className="w-full lg:w-[30%] bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 flex items-center gap-1.5">
          Agenda de Hoje
          <Leaf size={12} className="text-[var(--sage)] opacity-60" />
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-[var(--text-muted)]">
            {dayNames[today.getDay()]} {today.getDate()} de {today.toLocaleString("pt-BR", { month: "long" })}
          </span>
          <Link to="/agenda" className="text-[12px] font-bold text-[var(--dark-green)] dark:text-[#5CBF9D] no-underline flex items-center gap-1 hover:underline">
            Ver agenda <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {todayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
          <Calendar size={36} className="text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Nenhuma sessão hoje</p>
          <Link to="/agenda" className="mt-2 text-[12px] font-bold text-[#5CBF9D] hover:text-[var(--dark-green)] transition-colors">
            Agendar sessão
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
          {todayEvents.map((app, i) => (
            <TimelineRow key={app.id + "-" + i} app={app} onClick={() => onEventClick(app)} />
          ))}
        </div>
      )}

      {upcomingDays.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex-shrink-0">
          <p className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-3">Próximos dias</p>
          <div className="flex gap-4 flex-wrap">
            {upcomingDays.map(({ date, events }) => (
              <div key={formatDateKey(date)} className="flex items-center gap-2 text-[12px]">
                <span className="font-extrabold text-[var(--text-primary)]">
                  {dayNames[date.getDay()]} {date.getDate()}
                </span>
                <span className="w-[4px] h-[4px] rounded-full bg-[var(--sage)]" />
                <span className="font-semibold text-[var(--text-secondary)]">
                  {events.length} {events.length > 1 ? "sessões" : "sessão"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
