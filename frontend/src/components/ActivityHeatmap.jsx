import { useMemo, useState, useEffect, useRef } from "react";

export function ActivityHeatmap({ data = {}, title = "Atividade" }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const { weeks, maxValue, total } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const yearStartDate = new Date(currentYear, 0, 1);
    const yearEndDate = new Date(currentYear, 11, 31);
    const weeks = [];
    let maxValue = 0;
    let total = 0;

    // Calculate weeks from start of year to end of year
    const startOfFirstWeek = new Date(yearStartDate);
    const dayOfWeek = startOfFirstWeek.getDay();
    startOfFirstWeek.setDate(startOfFirstWeek.getDate() - dayOfWeek);

    let currentDate = new Date(startOfFirstWeek);
    let currentWeek = [];
    const maxWeeks = 53;

    for (let i = 0; i < maxWeeks * 7; i++) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      const isInYear = currentDate >= yearStartDate && currentDate <= yearEndDate;
      
      if (isInYear) {
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
      } else if (currentDate < yearStartDate) {
        currentWeek.push({
          date: null,
          dayOfWeek: currentDate.getDay(),
          count: 0,
          isToday: false,
          isFuture: true
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
      
      if (currentDate > yearEndDate && currentWeek.length === 0) {
        break;
      }
    }

    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({
        date: null,
        dayOfWeek: currentWeek.length,
        count: 0,
        isToday: false,
        isFuture: true
      });
    }
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
    }

    return { weeks, maxValue, total };
  }, [data]);

  // Calculate cell size based on container width
  const labelWidth = 40; // Width for day labels
  const gap = 4;
  const availableWidth = containerWidth - labelWidth - 48; // 48px for padding
  const cellSize = Math.max(12, Math.floor((availableWidth - (weeks.length * gap)) / weeks.length));

  const getColor = (count) => {
    if (count === 0) return "bg-brand-100";
    if (count === 1) return "bg-emerald-200";
    if (count === 2) return "bg-emerald-300";
    if (count === 3) return "bg-emerald-400";
    if (count === 4) return "bg-emerald-500";
    return "bg-emerald-600";
  };

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentYear = new Date().getFullYear();
  const firstDay = new Date(currentYear, 0, 1);
  const startOfFirstWeek = new Date(firstDay);
  startOfFirstWeek.setDate(startOfFirstWeek.getDate() - firstDay.getDay());
  
  const monthLabels = useMemo(() => {
    return months.map((month, idx) => {
      const firstOfMonth = new Date(currentYear, idx, 1);
      const weekIndex = Math.floor((firstOfMonth - startOfFirstWeek) / (7 * 24 * 60 * 60 * 1000));
      return { month, weekIndex: Math.max(0, weekIndex) };
    });
  }, []);

  return (
    <div className="card p-6" ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
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
      <div className="flex mb-2 ml-12">
        {monthLabels.map(({ month, weekIndex }, idx) => {
          const nextLabel = monthLabels[idx + 1];
          const width = nextLabel 
            ? (nextLabel.weekIndex - weekIndex) * (cellSize + gap) 
            : (weeks.length - weekIndex) * (cellSize + gap);

          return (
            <span 
              key={`${month}-${weekIndex}`} 
              className="text-xs text-brand-500 capitalize font-medium"
              style={{ width: `${width}px` }}
            >
              {month}
            </span>
          );
        })}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col gap-[4px] mr-3 w-10">
          {dayLabels.map((label, i) => (
            <div 
              key={i} 
              className="text-xs text-brand-400 font-medium flex items-center"
              style={{ height: `${cellSize}px` }}
            >
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>

        {/* Heatmap grid - fills available width */}
        <div className="flex gap-[4px]">
          {weeks.map((week, weekIndex) => {
            return (
              <div key={weekIndex} className="flex flex-col gap-[4px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    title={day.date ? `${new Date(day.date).toLocaleDateString('pt-BR')}: ${day.count} resposta${day.count !== 1 ? 's' : ''}` : ''}
                    className={`
                      rounded-sm transition-all cursor-pointer
                      ${!day.date ? 'bg-transparent' : day.isFuture ? 'bg-brand-50' : getColor(day.count)}
                      ${day.isToday ? 'ring-2 ring-brand-600 ring-offset-1' : ''}
                      hover:ring-2 hover:ring-brand-400
                    `}
                    style={{ 
                      width: `${cellSize}px`, 
                      height: `${cellSize}px`
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
