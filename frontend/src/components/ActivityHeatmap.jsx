import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WINDOW_WEEKS = 13;

function getDateStr(date) {
  return date.toLocaleDateString("en-CA");
}

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function ActivityHeatmap({ data = {}, title = "Atividade" }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [selectedDay, setSelectedDay] = useState(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const windowStart = useMemo(() => {
    const today = new Date();
    const base = startOfWeek(today);
    return addWeeks(base, -(WINDOW_WEEKS - 1) + offset);
  }, [offset]);

  const { weeks, total, periodLabel } = useMemo(() => {
    const today = new Date();
    const todayStr = getDateStr(today);
    let total = 0;
    const weeks = [];

    for (let w = 0; w < WINDOW_WEEKS; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(windowStart);
        date.setDate(date.getDate() + w * 7 + d);
        const dateStr = getDateStr(date);
        const count = data[dateStr] || 0;
        const isFuture = date > today;
        if (!isFuture) total += count;
        week.push({
          date: dateStr,
          count,
          isToday: dateStr === todayStr,
          isFuture,
        });
      }
      weeks.push(week);
    }

    const startDate = new Date(windowStart);
    const endDate = addWeeks(new Date(windowStart), WINDOW_WEEKS - 1);
    endDate.setDate(endDate.getDate() + 6);
    const fmt = (d) =>
      d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    const fmtMonth = (d) => d.toLocaleDateString("pt-BR", { month: "short" });
    const periodLabel =
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()
        ? fmt(startDate)
        : startDate.getFullYear() === endDate.getFullYear()
        ? `${fmtMonth(startDate)} – ${fmt(endDate)}`
        : `${fmt(startDate)} – ${fmt(endDate)}`;

    return { weeks, total, periodLabel };
  }, [windowStart, data]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = new Date(week[0].date + "T00:00:00");
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        labels.push({
          month: firstDay.toLocaleDateString("pt-BR", { month: "short" }),
          weekIndex: wi,
        });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  const labelColWidth = 28;
  const gap = 3;
  const availableWidth = containerWidth - labelColWidth - 16;
  const cellSize = Math.min(
    18,
    Math.max(10, Math.floor((availableWidth - WINDOW_WEEKS * gap) / WINDOW_WEEKS))
  );

  const getColor = (count, isFuture) => {
    if (isFuture) return "bg-slate-100";
    if (count === 0) return "bg-slate-200";
    if (count === 1) return "bg-emerald-300";
    if (count === 2) return "bg-emerald-400";
    if (count >= 3) return "bg-emerald-500";
    return "bg-emerald-500";
  };

  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayNames = [
    "Domingo","Segunda-feira","Terça-feira","Quarta-feira",
    "Quinta-feira","Sexta-feira","Sábado",
  ];
  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];

  const formatSelectedDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${dayNames[d.getDay()]}, ${d.getDate()} de ${monthNames[d.getMonth()]} de ${d.getFullYear()}`;
  };

  const isAtPresent = offset === 0;

  return (
    <div className="card p-3 sm:p-4 md:p-6 relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">{title}</h2>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
            {total} resposta{total !== 1 ? "s" : ""} · {periodLabel}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { setOffset(o => o - WINDOW_WEEKS); setSelectedDay(null); }}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Período anterior"
          >
            <ChevronLeft size={14} className="sm:size-16" />
          </button>
          <button
            onClick={() => { setOffset(o => o + WINDOW_WEEKS); setSelectedDay(null); }}
            disabled={isAtPresent}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Próximo período"
          >
            <ChevronRight size={14} className="sm:size-16" />
          </button>
          {offset !== 0 && (
            <button
              onClick={() => { setOffset(0); setSelectedDay(null); }}
              className="ml-1 text-[9px] sm:text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              Hoje
            </button>
          )}
        </div>
      </div>

      <div className="flex mb-1" style={{ marginLeft: labelColWidth + gap }}>
        {monthLabels.map(({ month, weekIndex }, idx) => {
          const nextLabel = monthLabels[idx + 1];
          const spanWeeks = nextLabel
            ? nextLabel.weekIndex - weekIndex
            : WINDOW_WEEKS - weekIndex;
          return (
            <span
              key={`${month}-${weekIndex}`}
              className="text-[9px] sm:text-[10px] text-slate-400 font-medium capitalize"
              style={{ width: spanWeeks * (cellSize + gap) }}
            >
              {month}
            </span>
          );
        })}
      </div>

      <div className="flex" style={{ gap }}>
        <div
          className="flex flex-col shrink-0"
          style={{ gap, width: labelColWidth }}
        >
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end pr-1 text-[8px] sm:text-[9px] text-slate-400 font-medium"
              style={{ height: cellSize }}
            >
              {i === 1 || i === 3 || i === 5 ? label : ""}
            </div>
          ))}
        </div>

        <div className="flex" style={{ gap }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  onClick={() => {
                    if (!day.isFuture) {
                      setSelectedDay(
                        selectedDay?.date === day.date ? null : day
                      );
                    }
                  }}
                  title={
                    day.isFuture
                      ? ""
                      : `${new Date(day.date + "T00:00:00").toLocaleDateString("pt-BR")}: ${day.count} resposta${day.count !== 1 ? "s" : ""}`
                  }
                  className={[
                    "rounded-sm transition-all",
                    day.isFuture
                      ? "cursor-default opacity-40"
                      : "cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:ring-offset-1",
                    getColor(day.count, day.isFuture),
                    day.isToday ? "ring-2 ring-emerald-500 ring-offset-1" : "",
                    selectedDay?.date === day.date
                      ? "ring-2 ring-blue-400 ring-offset-1"
                      : "",
                  ]
                    .join(" ")
                    .trim()}
                  style={{ width: cellSize, height: cellSize }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 sm:gap-1.5 mt-2 sm:mt-3">
        <span className="text-[9px] sm:text-[10px] text-slate-400">Menos</span>
        {["bg-slate-200", "bg-emerald-300", "bg-emerald-400", "bg-emerald-500"].map((c) => (
          <div key={c} className={`rounded-sm ${c}`} style={{ width: cellSize - 2, height: cellSize - 2 }} />
        ))}
        <span className="text-[9px] sm:text-[10px] text-slate-400">Mais</span>
      </div>

      {selectedDay && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] sm:text-xs text-slate-600">{formatSelectedDate(selectedDay.date)}</p>
          <p className="text-sm sm:text-base font-bold text-emerald-600">
            {selectedDay.count} resposta{selectedDay.count !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}