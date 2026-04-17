import { useMemo, useState, useEffect, useRef } from "react";

export function ActivityHeatmap({ data = {}, title = "Atividade" }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [selectedDay, setSelectedDay] = useState(null);
  
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
      } else {
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

  const labelWidth = 40;
  const gap = 4;
  const availableWidth = containerWidth - labelWidth - 48;
  const cellSize = Math.max(12, Math.floor((availableWidth - (weeks.length * gap)) / weeks.length));

  const getColor = (count) => {
    if (count === 0) return "bg-slate-200";
    return "bg-emerald-500";
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

  const handleDayClick = (day) => {
    if (day.date && !day.isFuture) {
      setSelectedDay(day);
    }
  };

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const formatSelectedDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return `${dayNames[date.getDay()]}, ${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
  };

  return (
    <div className="card p-6 relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {total} respostas · Ano de {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Intensidade</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-sm bg-slate-200" title="Sem resposta" />
              <div className="w-4 h-4 rounded-sm bg-emerald-500" title="Com resposta" />
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
              className="text-xs text-slate-500 capitalize font-medium"
              style={{ width: `${width}px` }}
            >
              {month}
            </span>
          );
        })}
      </div>

      <div className="flex">
        {/* Day labels - show all days */}
        <div className="flex flex-col gap-[4px] mr-3 w-10">
          {dayLabels.map((label, i) => (
            <div 
              key={i} 
              className="text-xs text-slate-500 font-medium flex items-center"
              style={{ height: `${cellSize}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[4px]">
          {weeks.map((week, weekIndex) => {
            return (
              <div key={weekIndex} className="flex flex-col gap-[4px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    title={day.date ? `${new Date(day.date).toLocaleDateString('pt-BR')}: ${day.count} resposta${day.count !== 1 ? 's' : ''}` : ''}
                    onClick={() => handleDayClick(day)}
                    className={`
                      rounded-sm transition-all cursor-pointer
                      ${!day.date ? 'bg-transparent cursor-default' : day.isFuture ? 'bg-slate-200 cursor-not-allowed opacity-50' : getColor(day.count)}
                      ${day.isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}
                      ${selectedDay?.date === day.date ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                      ${!day.isFuture && day.date ? 'hover:ring-2 hover:ring-emerald-400' : ''}
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

      {/* Selected day tooltip */}
      {selectedDay && (
        <div className="absolute left-6 bottom-6 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-20 min-w-[200px]">
          <button 
            onClick={() => setSelectedDay(null)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            {formatSelectedDate(selectedDay.date)}
          </p>
          <p className="text-2xl font-bold text-emerald-600">
            {selectedDay.count} {selectedDay.count === 1 ? 'resposta' : 'respostas'}
          </p>
        </div>
      )}
    </div>
  );
}
