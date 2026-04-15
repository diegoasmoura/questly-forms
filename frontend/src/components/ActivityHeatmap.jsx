import { useMemo } from "react";

export function ActivityHeatmap({ data = {}, title = "Atividade" }) {
  const { weeks, maxValue, total } = useMemo(() => {
    const today = new Date();
    const weeks = [];
    let maxValue = 0;
    let total = 0;

    // Generate last 90 days in weekly format
    for (let week = 12; week >= 0; week--) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + (6 - day)));
        
        const dateStr = date.toISOString().split('T')[0];
        const count = data[dateStr] || 0;
        
        maxValue = Math.max(maxValue, count);
        total += count;
        
        weekDays.push({
          date: dateStr,
          dayOfWeek: day,
          count,
          isToday: dateStr === today.toISOString().split('T')[0],
          isFuture: date > today
        });
      }
      weeks.push(weekDays);
    }

    return { weeks, maxValue, total };
  }, [data]);

  const getColor = (count) => {
    if (count === 0) return "bg-brand-50";
    if (count === 1) return "bg-emerald-200";
    if (count === 2) return "bg-emerald-300";
    if (count === 3) return "bg-emerald-400";
    return "bg-emerald-500";
  };

  const dayLabels = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = '';
    weeks.forEach((week, weekIndex) => {
      const firstDay = week.find(d => !d.isFuture);
      if (firstDay) {
        const month = new Date(firstDay.date).toLocaleDateString('pt-BR', { month: 'short' });
        if (month !== lastMonth) {
          labels.push({ month, weekIndex });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-brand-950">{title}</h2>
          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
            {total} respostas · Últimos 3 meses
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-brand-400">Menos</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-brand-50" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200" />
              <div className="w-3 h-3 rounded-sm bg-emerald-300" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            </div>
            <span className="text-[10px] text-brand-400">Mais</span>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map(({ month, weekIndex }) => (
          <span 
            key={`${month}-${weekIndex}`} 
            className="text-[9px] text-brand-400 capitalize"
            style={{ 
              marginLeft: weekIndex === 0 ? 0 : `${(weekIndex - (monthLabels.find((m, i) => i > 0 && m.weekIndex === weekIndex)?.weekIndex || weekIndex) + 1) * 14}px` 
            }}
          >
            {month}
          </span>
        ))}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-2">
          {dayLabels.slice(1).map((label, i) => (
            <span key={i} className="text-[9px] text-brand-400 h-3 leading-3">{label}</span>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.slice(1).map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  title={`${day.date}: ${day.count} resposta${day.count !== 1 ? 's' : ''}`}
                  className={`
                    w-3 h-3 rounded-sm transition-all cursor-pointer
                    ${day.isFuture ? 'bg-transparent' : getColor(day.count)}
                    ${day.isToday ? 'ring-1 ring-brand-950 ring-offset-1' : ''}
                    hover:ring-1 hover:ring-brand-400
                  `}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-brand-50 flex items-center justify-between text-[10px] text-brand-400">
        <span>Comprometimento com o tratamento</span>
        <span className={total > 0 ? 'text-emerald-600 font-bold' : ''}>
          {total > 0 ? `${Math.round((total / (maxValue || 1)) * 100)}% do máximo` : 'Nenhuma atividade'}
        </span>
      </div>
    </div>
  );
}
