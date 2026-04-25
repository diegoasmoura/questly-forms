import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ActivityHeatmap } from "../components/ActivityHeatmap";
import { useIsMobile } from "../hooks/useMediaQuery";
import {
  Users,
  FileText,
  BarChart3,
  ArrowRight,
  Calendar,
  Clock,
  TrendingUp,
  Activity
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    patientCount: 0,
    formCount: 0,
    totalResponses: 0,
    activeLinks: 0
  });
  const [recentResponses, setRecentResponses] = useState([]);
  const [groupedPatients, setGroupedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aggregateData, setAggregateData] = useState({});

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const [patients, forms] = await Promise.all([
        api.getPatients(),
        api.getForms()
      ]);

      const responsePromises = forms.map(async (form) => {
        try {
          const responses = await api.getResponses(form.id);
          return responses.map(r => ({ ...r, formTitle: form.title }));
        } catch {
          return [];
        }
      });

      const responseResults = await Promise.all(responsePromises);
      const allResponses = responseResults.flat();

      const responsesWithPatients = allResponses
        .filter(r => r.patient)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const grouped = [];
      const seenPatients = new Set();
      
      responsesWithPatients.forEach(response => {
        const patientId = response.patient.id;
        if (!seenPatients.has(patientId)) {
          seenPatients.add(patientId);
          const patientResponses = responsesWithPatients.filter(r => r.patient.id === patientId);
          grouped.push({
            patient: response.patient,
            responses: patientResponses,
            count: patientResponses.length,
            latestResponse: patientResponses[0],
            latestDate: new Date(patientResponses[0].createdAt)
          });
        }
      });

      const topPatients = grouped
        .sort((a, b) => b.latestDate - a.latestDate)
        .slice(0, 8);

      setRecentResponses(responsesWithPatients.slice(0, 8));
      setGroupedPatients(topPatients);

      const [formStats, aggregateResults] = await Promise.all([
        Promise.all(forms.map(f => api.getFormStats(f.id).catch(() => ({ responseCount: 0, shareLinkCount: 0 })))),
        Promise.all(forms.map(f => api.getAggregate(f.id).catch(() => null)))
      ]);
      
      const totalResponses = formStats.reduce((sum, s) => sum + (s.responseCount || 0), 0);
      const activeLinks = formStats.reduce((sum, s) => sum + (s.shareLinkCount || 0), 0);

      setStats({
        patientCount: patients.length,
        formCount: forms.length,
        totalResponses,
        activeLinks
      });

      const mergedAgg = {};
      aggregateResults.forEach(agg => {
        if (agg?.dailyCounts) {
          Object.entries(agg.dailyCounts).forEach(([date, count]) => {
            mergedAgg[date] = (mergedAgg[date] || 0) + count;
          });
        }
      });
      setAggregateData(mergedAgg);

    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-6 animate-fade-in">

      {/* Header */}
      <header>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Painel Clínico</h1>
        <p className="text-sm text-slate-500">Visão geral da sua clínica.</p>
      </header>

      {/* Quick Stats — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          icon={<Users size={18} />} 
          label="Pacientes" 
          value={stats.patientCount} 
          trend="Ativos"
          color="bg-blue-50 text-blue-600"
          link="/patients"
        />
        <StatCard 
          icon={<FileText size={18} />} 
          label="Instrumentos" 
          value={stats.formCount} 
          trend="Clínicos"
          color="bg-purple-50 text-purple-600"
          link="/my-forms"
        />
        <StatCard 
          icon={<BarChart3 size={18} />} 
          label="Resultados" 
          value={stats.totalResponses} 
          trend="Coletados"
          color="bg-emerald-50 text-emerald-600"
          link="/my-forms"
        />
        <StatCard 
          icon={<TrendingUp size={18} />} 
          label="Avaliações" 
          value={stats.activeLinks} 
          trend="Em andamento"
          color="bg-orange-50 text-orange-600"
          link="/my-forms"
        />
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap data={aggregateData} title="Atividade Clínica" />

      {/* Recent Activity */}
      <section className="card overflow-hidden">
        <div className="p-4 md:p-5 flex items-center gap-3 border-b border-slate-100">
          <Activity size={16} className="text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-800">Avaliações Recentes</h2>
        </div>

        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-2 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : groupedPatients.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar size={28} className="mx-auto text-slate-300 mb-3" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                Nenhuma avaliação registrada
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Pacientes que utilizaram instrumentos clínicos aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 md:p-5">
              {groupedPatients.map((group) => (
                <Link 
                  key={group.patient.id} 
                  to={`/patients/${group.patient.id}`}
                  className="flex items-center gap-3 p-3 md:p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 text-sm">
                      {group.patient.name.charAt(0)}
                    </div>
                    {group.count > 1 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center">
                        {group.count}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight truncate">
                      {group.patient.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {group.responses[0].formTitle}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Clock size={9} />
                      <span>{group.latestDate.toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color, link }) {
  const content = (
    <>
      {/* Ícone */}
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>

      {/* Texto — vertical no mobile para não vazar */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-none mb-1 truncate">
          {label}
        </p>
        <p className="text-lg md:text-xl font-bold text-slate-800 leading-none">
          {value}
        </p>
        {trend && (
          <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">
            {trend}
          </p>
        )}
      </div>
    </>
  );

  const classes = "card p-3 md:p-4 flex items-center gap-2 md:gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200";

  if (link) {
    return <Link to={link} className={classes}>{content}</Link>;
  }

  return <div className={classes}>{content}</div>;
}
