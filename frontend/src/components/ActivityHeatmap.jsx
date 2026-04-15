import { useMemo } from "react";

export function ActivityHeatmap({ data = {}, title = "Atividade" }) {
  const { weeks, maxValue, total, yearStart } = useMemo(() => {
    const today = new Date();
    const yearStartDate = new Date(today.getFullYear(), 0, 1);
    const weeks = [];
    let maxValue = 0;
    let total = 0;

    // Calculate weeks from start of year to today
    const startOfYear = new Date(yearStartDate);
    // Adjust to start from Sunday of that week
    const dayOfWeek = startOfYear.getDay();
    startOfYear.setDate(startOfYear.getDate() - dayOfWeek);

    let currentDate = new Date(startOfYear);
    let currentWeek = [];

    while (currentDate <= today || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      if (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = data[dateStr] || 0;
        
        maxValue = Math.max(maxValue, count);
        total += count;
        
        currentWeek.push({
          date: dateStr,
          dayOfWeek: currentDate.getDay(),
          count,
          isToday: dateStr === today.toISOString().split('T')[0],
          isFuture: currentDate > today
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        break;
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxValue, total, yearStart: yearStartDate };
  }, [data]);

  const getColor = (count) => {
    if (count === 0) return "bg-brand-100";
    if (count === 1) return "bg-emerald-200";
    if (count === 2) return "bg-emerald-300";
    if (count === 3) return "bg-emerald-400";
    if (count === 4) return "bg-emerald-500";
    return "bg-emerald-600";
  };

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const monthLabels = useMemo(() => {
    const labels = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Always show all 12 months
    months.forEach((month, idx) => {
      // Find the first week that contains this month
      const weekIdx = weeks.findIndex(week => 
        week.some(day => {
          const dayMonth = new Date(day.date).getMonth();
          return dayMonth === idx && !day.isFuture;
        })
      );
      
      if (weekIdx !== -1) {
        labels.push({ month, weekIndex: weekIdx });
      }
    });
    
    return labels;
  }, [weeks]);

  const cellSize = 14;
  const gap = 3;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-brand-950">{title}</h2>
          <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">
            {total} respostas · Ano de {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-400">Intensidade</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-sm bg-brand-100" title="0 respostas" />
              <div className="w-4 h-4 rounded-sm bg-emerald-200" title="1 resposta" />
              <div className="w-4 h-4 rounded-sm bg-emerald-300" title="2 respostas" />
              <div className="w-4 h-4 rounded-sm bg-emerald-400" title="3 respostas" />
              <div className="w-4 h-4 rounded-sm bg-emerald-500" title="4 respostas" />
              <div className="w-4 h-4 rounded-sm bg-emerald-600" title="5+ respostas" />
            </div>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-2 ml-10">
        {monthLabels.map(({ month, weekIndex }, idx) => {
          const nextLabel = monthLabels[idx + 1];
          const width = nextLabel 
            ? (nextLabel.weekIndex - weekIndex) * (cellSize + gap) 
            : (weeks.length - weekIndex) * (cellSize + gap);
          
          return (
            <span 
              key={`${month}-${weekIndex}`} 
              className="text-[10px] text-brand-500 capitalize font-medium"
              style={{ width: `${width}px` }}
            >
              {month}
            </span>
          );
        })}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-3">
          {dayLabels.map((label, i) => (
            <span 
              key={i} 
              className="text-[10px] text-brand-400 font-medium flex items-center"
              style={{ height: `${cellSize}px` }}
            >
              {i % 2 === 1 ? label : ''}
            </span>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  title={`${new Date(day.date).toLocaleDateString('pt-BR')}: ${day.count} resposta${day.count !== 1 ? 's' : ''}`}
                  className={`
                    rounded-sm transition-all cursor-pointer
                    ${day.isFuture ? 'bg-transparent' : getColor(day.count)}
                    ${day.isToday ? 'ring-2 ring-brand-600 ring-offset-1' : ''}
                    hover:ring-2 hover:ring-brand-400
                  `}
                  style={{ 
                    width: `${cellSize}px`, 
                    height: `${cellSize}px`,
                    opacity: day.isFuture ? 0 : 1
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="mt-6 pt-4 border-t border-brand-100 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-black text-brand-950">{total}</p>
            <p className="text-[10px] font-bold text-brand-400 uppercase">Respostas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-brand-950">{maxValue}</p>
            <p className="text-[10px] font-bold text-brand-400 uppercase">Máximo/Dia</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-brand-950">
              {Object.keys(data).length}
            </p>
            <p className="text-[10px] font-bold text-brand-400 uppercase">Dias Ativos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
