import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

export function fmtCurrency(val) {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function fmtPct(current, previous) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

export function getAvatarProps(name) {
  const cleanName = (name || "Paciente").trim();
  const initials = cleanName.length >= 2 ? cleanName.substring(0, 2).toUpperCase() : cleanName.toUpperCase();

  const colors = [
    { bg: "var(--sage-light)", text: "var(--dark-green)" },
    { bg: "var(--blue-light)", text: "var(--blue)" },
    { bg: "var(--peach-light)", text: "var(--peach)" },
    { bg: "var(--purple-light)", text: "var(--purple)" }
  ];
  
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const color = colors[Math.abs(hash) % colors.length];
  return { initials, color };
}

export function KpiCard({ icon, iconBg, iconColor, label, value, sub, trend, urgent, className = "" }) {
  let trendEl = null;
  if (trend) {
    const isUp = trend.current > trend.previous;
    const isDown = trend.current < trend.previous;
    trendEl = (
      <span className={`flex items-center gap-0.5 text-[10px] md:text-[11px] font-bold ${isUp ? "text-[#5CBF90]" : isDown ? "text-[#F8A268]" : "text-[var(--text-muted)]"}`}>
        {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
        {trend.current > trend.previous ? "+" : ""}{Math.round(((trend.current - trend.previous) / (trend.previous || 1)) * 100)}%
      </span>
    );
  }

  return (
    <div className={`relative bg-[var(--surface)] border border-[var(--border)] rounded-[12px] md:rounded-[16px] p-2.5 md:p-4 flex flex-row md:flex-col items-center md:items-stretch gap-3 md:gap-2 transition-colors duration-300 ${className}`}>
      <div className="flex items-center justify-between w-auto md:w-full flex-shrink-0">
        <div className="w-[32px] h-[32px] md:w-[34px] md:h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        {/* Trend on desktop goes here */}
        <div className="hidden md:block">{trendEl}</div>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
        <div className="flex items-baseline justify-between gap-1">
          <p className="text-[15px] md:text-[22px] font-extrabold leading-none text-[var(--text-primary)] truncate">{value}</p>
          {/* Trend on mobile goes next to value */}
          <div className="md:hidden block flex-shrink-0">{trendEl}</div>
        </div>
        <p className="text-[10px] md:text-[12px] text-[var(--text-secondary)] mt-1 md:mt-0.5 leading-tight truncate">{label}</p>
        {sub && <p className="hidden md:block text-[9px] md:text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight truncate">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  presente:   { dot: "#5CBF90", bg: "var(--status-presente-bg)",    label: "Presente",   text: "var(--status-presente-text)" },
  falta:      { dot: "#EF4444", bg: "var(--chip-falta-bg)",         label: "Falta",      text: "var(--chip-falta-text)" },
  justificada:{ dot: "#7C5CFF", bg: "var(--status-justificada-bg)",  label: "Justificada",text: "var(--status-justificada-text)" },
  confirmado: { dot: "#F8A268", bg: "var(--peach-light)",            label: "Agendado",   text: "#C97840" },
};

export function TimelineRow({ app, onClick }) {
  const status = app.attendance?.status || "confirmado";
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.confirmado;
  const patientName = app.patient?.name || "Paciente";
  const { initials, color: avatarColor } = getAvatarProps(patientName);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 py-3 px-2 border-b border-[var(--border)] last:border-b-0 cursor-pointer hover:bg-[var(--surface-alt)] rounded-[12px] transition-all duration-150 ease-out"
    >
      <div className="flex items-center gap-1 bg-[var(--surface-alt)] px-2 py-0.5 rounded-[8px] text-[var(--text-primary)] flex-shrink-0">
        <Clock size={11} className="text-[var(--text-muted)]" />
        <span className="text-[11px] font-extrabold tabular-nums">
          {app.sortTime.slice(0, 5)}
        </span>
      </div>
      <div 
        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
        style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-[var(--text-primary)] truncate m-0 leading-tight">
          {patientName}
        </p>
        <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block leading-none">
          {app.duration || app.patient?.sessionDuration || 50} min
        </span>
      </div>
      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-[999px] flex-shrink-0 tracking-wide uppercase" style={{ background: sc.bg, color: sc.text }}>
        {sc.label}
      </span>
    </div>
  );
}
