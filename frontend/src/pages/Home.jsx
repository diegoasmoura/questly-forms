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
  Settings
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
  const [recentPatients, setRecentPatients] = useState([]);
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

      setRecentPatients(patients.slice(0, 6));
      
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
    <div className="p-6 h-screen flex flex-col overflow-hidden animate-fade-in bg-brand-50/30">
      {/* Header */}
      <header className="mb-6 shrink-0">
        <h1 className="text-2xl font-display font-bold text-brand-950">
          Painel Clínico
        </h1>
        <p className="text-sm text-brand-500">Visão geral da sua clínica.</p>
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
      <div className="min-h-[200px]">
        <ActivityHeatmap 
          data={aggregateData} 
          title="Atividade Clínica" 
        />
      </div>

      {/* Patients Section - Full Width */}
      <section className="card flex-1 min-h-0 overflow-hidden">
        <div className="p-5 border-b border-brand-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-950">Pacientes Recentes</h2>
          <Link 
            to="/patients" 
            className="btn btn-secondary text-[10px] font-bold uppercase flex items-center gap-2"
          >
            <Settings size={12} />
            Gerenciar
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-brand-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-brand-100 rounded w-1/2" />
                    <div className="h-2 bg-brand-50 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="p-10 text-center">
              <Users size={32} className="mx-auto text-brand-200 mb-3" />
              <p className="text-xs text-brand-500 font-bold uppercase tracking-tight">Nenhum paciente ainda</p>
              <button 
                onClick={() => navigate("/patients", { state: { openAddModal: true } })}
                className="btn btn-secondary text-[10px] font-black uppercase mt-4 px-6"
              >
                Cadastrar Novo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
              {recentPatients.map(patient => (
                <Link 
                  key={patient.id} 
                  to={`/patients/${patient.id}`}
                  className="flex items-center gap-4 p-4 bg-brand-50/30 hover:bg-brand-50 rounded-2xl transition-all group border border-brand-100/50 hover:border-brand-200 hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 font-black shrink-0 group-hover:bg-brand-950 group-hover:text-white transition-colors duration-300">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-950 truncate group-hover:text-brand-700 transition-colors">{patient.name}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-400 mt-0.5">
                      <Clock size={10} />
                      <span className="uppercase">Visto em {new Date(patient.updatedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-brand-200 group-hover:text-brand-950 group-hover:translate-x-1 transition-all shrink-0" />
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
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-400 leading-none mb-1.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-black text-brand-950 leading-none">{value}</h3>
          {trend && (
            <span className="text-[9px] font-bold text-brand-400 truncate">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-brand-100/50">
        {content}
      </Link>
    );
  }

  return (
    <div className="card p-4 border-brand-100/50">
      {content}
    </div>
  );
}
