import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export function RevenueWidget({ revenueData }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex flex-col flex-1 min-h-0">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-1">Evolução do Faturamento</p>
      <p className="text-[11px] text-[var(--text-muted)] mb-4">Últimos 6 meses</p>

      <div className="flex-1 w-full mt-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--peach)" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="var(--peach)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 600 }}
              padding={{ left: 15, right: 15 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 600 }}
              tickFormatter={(value) => `R$ ${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "var(--surface)", 
                borderColor: "var(--border)", 
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}
              labelStyle={{ fontSize: "10px", fontWeight: "bold", color: "var(--text-muted)" }}
              itemStyle={{ fontSize: "12px", fontWeight: "extrabold", color: "var(--peach)" }}
              formatter={(value) => [`R$ ${value}`, "Faturamento"]}
            />
            <Area 
              type="monotone" 
              dataKey="faturamento" 
              stroke="var(--peach)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorFaturamento)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
