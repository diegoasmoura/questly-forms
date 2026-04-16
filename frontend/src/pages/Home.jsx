import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ActivityHeatmap } from "../components/ActivityHeatmap";
import { 
  Users, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  Calendar,
  Clock,
  TrendingUp,
  Settings,
  Activity
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patientCount: 0,
    formCount: 0,
    totalResponses: 0,
    activeLinks: 0
  });
  const [recentResponses, setRecentResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aggregateData, setAggregateData] = useState({});

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [patients, forms] = await Promise.all([
        api.getPatients(),
        api.getForms()
      ]);

      // Fetch all responses to find patients who responded recently
      const allResponses = [];
      for (const form of forms) {
        try {
          const responses = await api.getResponses(form.id);
          allResponses.push(...responses.map(r => ({
            ...r,
            formTitle: form.title
          })));
        } catch (e) {
          // Skip if can't fetch responses for this form
        }
      }

      // Filter responses with patients and sort by date (most recent first)
      const responsesWithPatients = allResponses
        .filter(r => r.patient)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8); // Show top 8 most recent

      setRecentResponses(responsesWithPatients);
      
      const formStatsPromises = forms.map(f => api.getFormStats(f.id));
      const allFormStats = await Promise.all(formStatsPromises);
      
      const totalResponses = allFormStats.reduce((sum, s) => sum + (s.responseCount || 0), 0);
      const activeLinks = allFormStats.reduce((sum, s) => sum + (s.shareLinkCount || 0), 0);

      setStats({
        patientCount: patients.length,
        formCount: forms.length,
        totalResponses,
        activeLinks
      });

      const aggPromises = forms.map(f => api.getAggregate(f.id).catch(() => null));
      const allAggData = await Promise.all(aggPromises);
      
      const mergedAgg = {};
      allAggData.forEach(agg => {
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
  };

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <header className="mb-6 shrink-0">
        <h1 className="text-2xl font-display font-bold text-slate-800">
          Painel Clínico
        </h1>
        <p className="text-sm text-slate-500">Visão geral da sua clínica.</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <StatCard 
          icon={<Users size={20} />} 
          label="Pacientes" 
          value={stats.patientCount} 
          trend="Cadastrados"
          color="bg-blue-50 text-blue-600"
          link="/patients"
        />
        <StatCard 
          icon={<FileText size={20} />} 
          label="Formulários" 
          value={stats.formCount} 
          trend="Ativos"
          color="bg-purple-50 text-purple-600"
          link="/my-forms"
        />
        <StatCard 
          icon={<BarChart3 size={20} />} 
          label="Respostas" 
          value={stats.totalResponses} 
          trend="Total coletado"
          color="bg-emerald-50 text-emerald-600"
          link="/my-forms"
        />
        <StatCard 
          icon={<TrendingUp size={20} />} 
          label="Links Ativos" 
          value={stats.activeLinks} 
          trend="Aguardando"
          color="bg-orange-50 text-orange-600"
          link="/my-forms"
        />
      </div>

      {/* Activity Heatmap - Full Width */}
      <div className="min-h-[200px] mb-6">
        <ActivityHeatmap 
          data={aggregateData} 
          title="Atividade Clínica" 
        />
      </div>

      {/* Recent Activity Section */}
      <section className="card flex-1 min-h-0 overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">Pacientes Atendidos Recentemente</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-2 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentResponses.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Nenhum atendimento registrado</p>
              <p className="text-[10px] text-slate-400 mt-1">Pacientes que responderam formulários aparecerão aqui</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
              {recentResponses.map((response, idx) => (
                <Link 
                  key={response.id} 
                  to={`/patients/${response.patient.id}`}
                  className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                      {response.patient.name.charAt(0)}
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{response.patient.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{response.formTitle}</p>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 mt-1">
                      <Clock size={10} />
                      <span>{new Date(response.createdAt).toLocaleDateString('pt-BR')} · {new Date(response.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
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
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${color} shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none mb-1.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-bold text-slate-800 leading-none">{value}</h3>
          {trend && (
            <span className="text-[9px] font-medium text-slate-400 truncate">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        {content}
      </Link>
    );
  }

  return (
    <div className="card p-4">
      {content}
    </div>
  );
}
