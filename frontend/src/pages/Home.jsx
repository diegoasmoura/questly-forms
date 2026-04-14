import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ResponseTrendChart } from "../components/ClinicalCharts";
import { 
  Users, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  Calendar,
  Clock,
  TrendingUp,
  Library,
  Lightbulb
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
          Olá, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-brand-500">Resumo das atividades da sua clínica hoje.</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
        <StatCard 
          icon={<Users size={20} />} 
          label="Pacientes" 
          value={stats.patientCount} 
          trend="+2 novos"
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
          trend="Aguardando resposta"
          color="bg-orange-50 text-orange-600"
          link="/my-forms"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Chart & Tip */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-hidden">
          {/* Trend Chart */}
          <section className="card p-5 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-brand-950">Atividade Clínica</h2>
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Últimos 30 dias</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <TrendingUp size={10} />
                  CRESCENTE
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponseTrendChart 
                data={aggregateData} 
                title="" 
                height="100%" 
              />
            </div>
          </section>

          {/* Tips / Info Card (Moved here) */}
          <div className="card p-5 bg-brand-950 text-white shrink-0 border-none shadow-xl shadow-brand-950/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/10 text-white">
                <Lightbulb size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Dica Pro</h4>
                <p className="text-xs text-brand-200 mt-1 leading-relaxed max-w-lg">
                  Você pode vincular formulários diretamente a pacientes para facilitar o acompanhamento do histórico clínico e visualizar tendências de evolução.
                </p>
              </div>
              <div className="ml-auto self-center">
                <Link to="/library" className="btn bg-white text-brand-950 hover:bg-brand-50 text-[10px] font-black uppercase py-2 px-4">
                  Explorar Biblioteca
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Patients */}
        <div className="flex flex-col min-h-0">
          <section className="card flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-brand-50 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-brand-950">Pacientes Recentes</h2>
              <Link to="/patients" className="text-[10px] font-black uppercase tracking-widest text-brand-400 hover:text-brand-950 flex items-center gap-1 transition-colors">
                Ver todos
                <ArrowRight size={12} />
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
                <div className="divide-y divide-brand-50/50">
                  {recentPatients.map(patient => (
                    <Link 
                      key={patient.id} 
                      to={`/patients/${patient.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-brand-50/50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 font-black shrink-0 group-hover:bg-brand-950 group-hover:text-white transition-colors duration-300">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-brand-950 truncate group-hover:text-brand-700 transition-colors">{patient.name}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-brand-400 mt-0.5">
                          <Clock size={10} />
                          <span className="uppercase">Visto em {new Date(patient.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-brand-200 group-hover:text-brand-950 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
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
