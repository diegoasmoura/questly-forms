import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart, Cell
} from 'recharts';

// Clinical thresholds for PHQ-9 and GAD-7
export const CLINICAL_THRESHOLDS = {
  phq9: [
    { value: 5, label: 'Leve', stroke: '#3b82f6', dasharray: '3 3' },
    { value: 10, label: 'Moderado', stroke: '#f59e0b', dasharray: '3 3' },
    { value: 15, label: 'Mod. Grave', stroke: '#f97316', dasharray: '3 3' },
    { value: 20, label: 'Grave', stroke: '#ef4444', dasharray: '3 3' },
  ],
  gad7: [
    { value: 5, label: 'Leve', stroke: '#3b82f6', dasharray: '3 3' },
    { value: 10, label: 'Moderado', stroke: '#f59e0b', dasharray: '3 3' },
    { value: 15, label: 'Grave', stroke: '#ef4444', dasharray: '3 3' },
  ]
};

export const SEVERITY_COLORS = {
  'Mínima': '#10b981',
  'Leve': '#3b82f6',
  'Moderada': '#f59e0b',
  'Moderadamente Grave': '#f97316',
  'Grave': '#ef4444',
  'Ansiedade Leve': '#3b82f6',
  'Ansiedade Moderada': '#f59e0b',
  'Ansiedade Grave': '#ef4444',
};

// Transform patient responses into chart data
export const transformResponsesToTrendData = (responses) => {
  if (!responses || responses.length === 0) return [];
  
  return responses
    .filter(r => r.data && (r.data.phq9_items || r.data.gad7_items))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(r => {
      const phq9 = r.data.phq9_items
        ? Object.values(r.data.phq9_items).reduce((sum, val) => sum + (Number(val) || 0), 0)
        : null;
      const gad7 = r.data.gad7_items
        ? Object.values(r.data.gad7_items).reduce((sum, val) => sum + (Number(val) || 0), 0)
        : null;

      return {
        date: new Date(r.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        fullDate: new Date(r.createdAt).toLocaleDateString('pt-BR'),
        phq9,
        gad7,
        responseId: r.id,
      };
    });
};

// Clinical Trend Chart - PHQ-9 + GAD-7 over time
export function ClinicalTrendChart({ data, title = 'Evolução Clínica', showPhq9 = true, showGad7 = true, height = 350 }) {
  try {
    if (!data || data.length === 0) {
      return null;
    }

    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">{title}</h3>
          <span className="text-xs text-slate-500">n={data.length} avaliações</span>
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 27]}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name) => {
                if (name === 'PHQ-9') return [`${value} pontos`, 'Depressão (PHQ-9)'];
                if (name === 'GAD-7') return [`${value} pontos`, 'Ansiedade (GAD-7)'];
                return [value, name];
              }}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                if (value === 'phq9') return 'PHQ-9 (Depressão)';
                if (value === 'gad7') return 'GAD-7 (Ansiedade)';
                return value;
              }}
            />
            {/* Clinical threshold lines */}
            {showPhq9 && (
              <>
                <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderado', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Grave', position: 'right', fill: '#ef4444', fontSize: 10 }} />
              </>
            )}
            {showGad7 && (
              <>
                <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="3 3" />
              </>
            )}
            {showPhq9 && data.some(d => d.phq9 !== null) && (
              <Line
                type="monotone"
                dataKey="phq9"
                stroke="#ef4444"
                strokeWidth={3}
                name="PHQ-9"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2 }}
                connectNulls
              />
            )}
            {showGad7 && data.some(d => d.gad7 !== null) && (
              <Line
                type="monotone"
                dataKey="gad7"
                stroke="#3b82f6"
                strokeWidth={3}
                name="GAD-7"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (err) {
    console.error('❌ Erro ao renderizar ClinicalTrendChart:', err);
    return (
      <div className="text-center py-12 text-red-400 bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="font-bold">Erro ao carregar gráfico</p>
        <p className="text-sm">{err.message}</p>
      </div>
    );
  }
}

// Severity Bar Chart - Distribution across severity categories
export function SeverityBarChart({ data, title = 'Distribuição de Severidade', height = 250 }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm uppercase tracking-widest text-slate-800">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="severity"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="count" name="Quantidade" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color || SEVERITY_COLORS[entry.severity] || '#9ca3af'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Response Trend Chart - Daily responses over time (for Dashboard/FormResponses)
export function ResponseTrendChart({ data, title = 'Tendência de Respostas', height = 200 }) {
  if (!data || Object.keys(data).length === 0) return null;

  const chartData = Object.entries(data)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      count,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm uppercase tracking-widest text-slate-800">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#colorCount)"
            name="Respostas"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mini Sparkline for stat cards
export function Sparkline({ data, color = '#8b5cf6', width = 120, height = 40 }) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Transform responses to heatmap data
export const transformResponsesToHeatmapData = (responses) => {
  if (!responses || responses.length === 0) return [];
  
  return responses
    .map(r => ({
      date: new Date(r.createdAt),
      dateKey: new Date(r.createdAt).toISOString().split('T')[0],
      count: 1,
      formTitle: r.form?.title || 'Formulário',
      responseId: r.id,
    }))
    .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
};

// Attendance Heatmap - GitHub-style calendar heatmap for patient responses
export function AttendanceHeatmap({ data = [], title = 'Calendário de Atendimentos' }) {
  try {
    if (!data || data.length === 0) {
      return (
        <div className="card p-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 mb-4">{title}</h3>
          <div className="text-center py-8 text-slate-400 text-sm">
            Nenhum atendimento registrado
          </div>
        </div>
      );
    }

    // Generate weeks for the last 6 months
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Create a map of dates with responses
    const responseMap = new Map();
    data.forEach(d => {
      responseMap.set(d.dateKey, d);
    });

    // Generate all days in the range
    const days = [];
    const current = new Date(sixMonthsAgo);
    while (current <= today) {
      const dateKey = current.toISOString().split('T')[0];
      days.push({
        date: current,
        dateKey,
        ...(responseMap.get(dateKey) || { count: 0 })
      });
      current.setDate(current.getDate() + 1);
    }

    // Group by weeks (columns)
    const weeks = [];
    let currentWeek = [];
    
    days.forEach((day, index) => {
      // Start new week on Sunday
      if (day.date.getDay() === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Color scale - emerald tones
    const getColor = (count) => {
      if (count === 0) return '#e5e7eb';
      if (count === 1) return '#a7f3d0';
      if (count === 2) return '#6ee7b7';
      if (count === 3) return '#34d399';
      return '#10b981';
    };

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const daysOfWeek = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', ''];

    // Calculate month labels position
    const monthLabels = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      const month = firstDay?.date?.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ month: months[month], position: weekIndex });
        lastMonth = month;
      }
    });

    const totalResponses = data.length;
    const uniqueDays = new Set(data.map(d => d.dateKey)).size;
    const lastResponse = data[data.length - 1]?.date?.toLocaleDateString('pt-BR') || 'Nenhum';

    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700">{title}</h3>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{totalResponses} respostas</span>
            <span>·</span>
            <span>{uniqueDays} dias</span>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-full">
            {/* Month labels */}
            <div className="flex mb-1 ml-8">
              {monthLabels.map((label, i) => (
                <div 
                  key={i} 
                  className="text-[10px] text-slate-500"
                  style={{ marginLeft: i === 0 ? `${label.position * 14}px` : `${(label.position - (monthLabels[i-1]?.position || 0)) * 14}px` }}
                >
                  {label.month}
                </div>
              ))}
            </div>
            
            <div className="flex">
              {/* Day of week labels */}
              <div className="flex flex-col mr-1">
                {daysOfWeek.map((day, i) => (
                  <div 
                    key={i} 
                    className="h-[12px] text-[10px] text-slate-500 flex items-center"
                    style={{ visibility: i === 0 || i === 6 ? 'hidden' : 'visible' }}
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="w-[12px] h-[12px] rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-emerald-400"
                        style={{ backgroundColor: getColor(day.count) }}
                        title={`${day.date.toLocaleDateString('pt-BR')}: ${day.count > 0 ? `${day.count} resposta(s)` : 'Sem atendimento'}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-500">
              <span>Menos</span>
              <div className="flex gap-[2px]">
                <div className="w-[12px] h-[12px] rounded-sm" style={{ backgroundColor: '#e5e7eb' }} />
                <div className="w-[12px] h-[12px] rounded-sm" style={{ backgroundColor: '#a7f3d0' }} />
                <div className="w-[12px] h-[12px] rounded-sm" style={{ backgroundColor: '#6ee7b7' }} />
                <div className="w-[12px] h-[12px] rounded-sm" style={{ backgroundColor: '#34d399' }} />
                <div className="w-[12px] h-[12px] rounded-sm" style={{ backgroundColor: '#10b981' }} />
              </div>
              <span>Mais</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Último atendimento: {lastResponse}</span>
          <span>Período: {sixMonthsAgo.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} - {today.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
    );
  } catch (err) {
    console.error('❌ Erro ao renderizar AttendanceHeatmap:', err);
    return (
      <div className="text-center py-12 text-red-400 bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="font-bold">Erro ao carregar calendário</p>
        <p className="text-sm">{err.message}</p>
      </div>
    );
  }
}
