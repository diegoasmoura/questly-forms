import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { fmtCurrency } from "./Shared";

export function RevenueWidget({ revenueData }) {
  const total6m = revenueData?.reduce((acc, curr) => acc + (curr.faturamento || 0), 0) || 0;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex flex-col lg:flex-1 min-h-[220px] lg:min-h-0">
      <div className="flex items-end justify-between mb-4 flex-shrink-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-1.5">Faturamento (6m)</p>
          <p className="text-[28px] md:text-[24px] font-extrabold text-[var(--text-primary)] leading-none">{fmtCurrency(total6m)}</p>
        </div>
      </div>

      {/* MOBILE SPARKLINE (Hidden on Desktop) */}
      <div className="flex md:hidden flex-1 w-full min-h-0 -mx-2 -mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFaturamentoMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--peach)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--peach)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              labelStyle={{ fontSize: "10px", fontWeight: "bold", color: "var(--text-muted)" }}
              itemStyle={{ fontSize: "12px", fontWeight: "extrabold", color: "var(--peach)" }}
              formatter={(value) => [`R$ ${value}`, "Faturamento"]}
            />
            <Area type="monotone" dataKey="faturamento" stroke="var(--peach)" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamentoMobile)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* DESKTOP FULL CHART (Hidden on Mobile) */}
      <div className="hidden md:flex flex-1 w-full min-h-0 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--peach)" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="var(--peach)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 600 }} padding={{ left: 15, right: 15 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 600 }} tickFormatter={(value) => `R$ ${value}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              labelStyle={{ fontSize: "10px", fontWeight: "bold", color: "var(--text-muted)" }}
              itemStyle={{ fontSize: "12px", fontWeight: "extrabold", color: "var(--peach)" }}
              formatter={(value) => [`R$ ${value}`, "Faturamento"]}
            />
            <Area type="monotone" dataKey="faturamento" stroke="var(--peach)" strokeWidth={2} fillOpacity={1} fill="url(#colorFaturamento)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
