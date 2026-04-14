import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { generatePremiumSummary } from "../lib/pdf";
import { scoreTest } from "../lib/scoring";
import { ClinicalTrendChart, transformResponsesToTrendData } from "../components/ClinicalCharts";
import DataTable from "../components/DataTable";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  ChevronRight,
  Trash2,
  Edit,
  LayoutDashboard,
  Users,
  LogOut,
  AlertCircle,
  FileDown,
  Activity,
  AlertTriangle,
  Search,
  BookOpen,
  TrendingUp,
  Table
} from "lucide-react";

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("timeline"); // 'timeline' or 'trend' or 'table'

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    setLoading(true);
    try {
      const data = await api.getPatient(id);
      setPatient(data);
    } catch (error) {
      console.error("Failed to load patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPremium = (response) => {
    try {
      generatePremiumSummary(patient, response);
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleResponse = (e, responseId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedResponseId(selectedResponseId === responseId ? null : responseId);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-950 border-t-transparent animate-spin" />
          <p className="text-sm text-brand-500 font-medium">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="text-center card p-10 max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-brand-950">Paciente não encontrado</h2>
          <p className="text-brand-500 mt-2">O registro que você está procurando não existe ou foi removido.</p>
          <Link to="/patients" className="btn btn-primary mt-6">Voltar para Pacientes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-fade-in">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-950 mb-8 group transition-colors">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Voltar para Lista de Pacientes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Patient Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 overflow-hidden">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 rounded-3xl bg-brand-950 flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-xl shadow-brand-950/20">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-2xl font-bold text-brand-950">{patient.name}</h1>
              <p className="text-xs font-bold text-brand-400 mt-1 uppercase tracking-widest">Prontuário #{patient.id.slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="space-y-4 pt-6 border-t border-brand-50">
              <InfoItem icon={<Mail size={16} />} label="Email" value={patient.email || "Não informado"} />
              <InfoItem icon={<Phone size={16} />} label="Telefone" value={patient.phone || "Não informado"} />
              <InfoItem
                icon={<Calendar size={16} />}
                label="Nascimento"
                value={patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "Não informado"}
              />
              <InfoItem
                icon={<Clock size={16} />}
                label="Paciente desde"
                value={new Date(patient.createdAt).toLocaleDateString('pt-BR')}
              />
            </div>
          </div>

          <div className="card p-6 bg-brand-50/50 border-brand-100">
            <h3 className="font-bold text-brand-950 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Edit size={16} />
              Notas Clínicas
            </h3>
            <p className="text-sm text-brand-600 whitespace-pre-wrap leading-relaxed">
              {patient.notes || "Nenhuma observação clínica registrada para este paciente."}
            </p>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-3 space-y-8">
          {/* Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-950">Histórico Clínico</h2>
              <p className="text-sm text-brand-500 mt-1">
                Acompanhe a evolução e todas as respostas coletadas.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-brand-100 shadow-sm">
              <TabButton 
                active={activeTab === "timeline"} 
                onClick={() => setActiveTab("timeline")} 
                icon={<FileText size={14} />} 
                label="Linha do Tempo" 
              />
              <TabButton 
                active={activeTab === "trend"} 
                onClick={() => setActiveTab("trend")} 
                icon={<TrendingUp size={14} />} 
                label="Tendências" 
              />
              <TabButton 
                active={activeTab === "table"} 
                onClick={() => setActiveTab("table")} 
                icon={<Table size={14} />} 
                label="Dados Brutos" 
              />
            </div>
          </div>

          {/* Trend Chart Tab */}
          {activeTab === "trend" && (
            <div className="space-y-8 animate-fade-in">
              <div className="card p-6">
                <ClinicalTrendChart
                  data={transformResponsesToTrendData(patient.responses)}
                  title="Evolução Clínica - PHQ-9 e GAD-7"
                />
              </div>
              
              {/* Latest Clinical Scores */}
              {(() => {
                const latestResponses = patient.responses
                  .filter(r => r.data.phq9_items || r.data.gad7_items)
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 1);
                
                if (latestResponses.length === 0) return null;
                
                const latest = latestResponses[0];
                const result = scoreTest(null, latest.data);
                
                if (!result || result.type !== "clinical") return null;
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-6 border-2 border-brand-100 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-brand-950">
                          Última Avaliação
                        </h3>
                        <span className="text-[10px] font-bold bg-brand-50 px-2 py-1 rounded text-brand-400">
                          {new Date(latest.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold bg-brand-950 text-white shadow-lg">
                          {result.score}
                        </div>
                        <div>
                          <p className="text-xs text-brand-500 font-bold uppercase tracking-tight mb-1">{result.title}</p>
                          <p className="text-xl font-bold text-brand-950">{result.severity}</p>
                        </div>
                      </div>
                      
                      {result.alert && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold mb-4 animate-pulse">
                          <AlertTriangle size={16} />
                          {result.alert}
                        </div>
                      )}
                      
                      <div className="p-4 bg-brand-50 rounded-xl border border-brand-50">
                        <p className="text-sm text-brand-700 leading-relaxed italic">
                          "{result.interpretation}"
                        </p>
                      </div>
                    </div>
                    
                    <div className="card p-6 overflow-hidden flex flex-col">
                      <h3 className="font-bold text-xs uppercase tracking-widest text-brand-950 mb-6">
                        Histórico de Pontuações
                      </h3>
                      <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                        {patient.responses
                          .filter(r => r.data.phq9_items || r.data.gad7_items)
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((response, idx) => {
                            const scoreResult = scoreTest(null, response.data);
                            if (!scoreResult || scoreResult.type !== "clinical") return null;
                            
                            return (
                              <div key={response.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-50 transition-all border border-brand-50 hover:border-brand-200 group">
                                <div className="text-center min-w-[50px]">
                                  <p className="text-xl font-bold text-brand-950 group-hover:scale-110 transition-transform">{scoreResult.score}</p>
                                  <p className="text-[10px] text-brand-400 font-bold">/ {scoreResult.maxScore}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-brand-950 truncate">{scoreResult.title}</p>
                                  <p className="text-[10px] text-brand-400 font-medium">
                                    {new Date(response.createdAt).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${scoreResult.color} whitespace-nowrap`}>
                                  {scoreResult.severity}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* DataTable Tab */}
          {activeTab === "table" && patient.responses.length > 0 && (
            <div className="card p-6 animate-fade-in overflow-hidden">
              <DataTable
                data={patient.responses.map(r => ({
                  ...r.data,
                  createdAt: r.createdAt,
                  responseId: r.id,
                }))}
                schema={patient.responses[0]?.form?.schema}
                title="Respostas Detalhadas"
              />
            </div>
          )}

          {/* Timeline Tab (Original) */}
          {activeTab === "timeline" && (
            patient.responses.length === 0 ? (
              <div className="card p-20 text-center border-dashed border-2">
                <FileText size={48} className="mx-auto text-brand-200 mb-6" />
                <h3 className="text-xl font-bold text-brand-950 mb-2">Nenhum registro ainda</h3>
                <p className="text-brand-500 max-w-sm mx-auto">Envie um formulário ou escala para este paciente para começar a construir seu prontuário digital.</p>
                <Link to="/my-forms" className="btn btn-primary mt-8">Enviar Formulário</Link>
              </div>
            ) : (
            <div className="space-y-4 animate-fade-in">
              {patient.responses.map((response) => (
                <div key={response.id} className="card overflow-hidden group hover:border-brand-300 transition-all duration-300">
                  <div
                    className="w-full flex items-center justify-between p-5 cursor-pointer"
                    onClick={(e) => toggleResponse(e, response.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-950 flex items-center justify-center group-hover:bg-brand-950 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-950 group-hover:text-brand-700 transition-colors">{response.form.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                            {new Date(response.createdAt).toLocaleString('pt-BR')}
                          </p>
                          {response.form.title.toLowerCase().includes('phq') || response.form.title.toLowerCase().includes('gad') ? (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold rounded uppercase tracking-tighter">
                              Protocolo Validado
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex items-center gap-2">
                        <Link
                          to={`/responses/${response.id}`}
                          className="btn btn-secondary py-1.5 px-3 text-[10px] font-bold flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Activity size={14} />
                          Análise
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPremium(response);
                          }}
                          className="btn btn-secondary py-1.5 px-3 text-[10px] font-bold flex items-center gap-2"
                        >
                          <FileDown size={14} />
                          PDF
                        </button>
                      </div>
                      <ChevronRight
                        size={20}
                        className={`text-brand-300 transition-all duration-300 ${selectedResponseId === response.id ? 'rotate-90 text-brand-950 scale-110' : ''}`}
                      />
                    </div>
                  </div>

                  {selectedResponseId === response.id && (
                    <div className="p-6 bg-brand-50/50 border-t border-brand-50 animate-fade-in">
                      {/* Clinical Score Summary */}
                      {(() => {
                        const result = scoreTest(null, response.data);
                        if (!result || result.type !== "clinical") return null;
                        
                        return (
                          <div className={`mb-6 p-6 rounded-2xl border bg-white shadow-sm ${result.color}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <TrendingUp size={18} className="text-brand-950" />
                                <h5 className="font-bold text-xs uppercase tracking-widest text-brand-950">{result.title}</h5>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 mb-4">
                              <div className="text-5xl font-black text-brand-950">{result.score}</div>
                              <div>
                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight ${result.color}`}>
                                  {result.severity}
                                </span>
                                <p className="text-[10px] text-brand-400 font-bold uppercase mt-2">Score total de {result.maxScore} pontos</p>
                              </div>
                            </div>
                            
                            {result.alert && (
                              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-600 text-white text-xs font-black mb-4 shadow-xl shadow-red-200">
                                <AlertTriangle size={18} />
                                {result.alert}
                              </div>
                            )}
                            
                            <div className="p-4 bg-brand-50/80 rounded-xl border border-brand-100/50">
                              <p className="text-sm text-brand-800 leading-relaxed font-medium italic">"{result.interpretation}"</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Search Bar */}
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={14} />
                          <input
                            type="text"
                            placeholder="Pesquisar nestas respostas..."
                            className="input pl-10 text-xs py-2 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-brand-100 shadow-sm">
                        <h5 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4 border-b border-brand-50 pb-2">Respostas Individuais</h5>
                        <div className="space-y-1">
                          {Object.entries(response.data)
                            .filter(([key, value]) => 
                              key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-50 transition-colors group/item">
                                <span className="text-[10px] text-brand-500 font-bold uppercase tracking-tight truncate mr-4">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <div className="text-sm text-brand-950 font-bold text-right shrink-0">
                                  {typeof value === "object" 
                                    ? <pre className="text-[10px] bg-brand-50 p-1 rounded font-normal">{JSON.stringify(value)}</pre>
                                    : String(value)
                                  }
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-400 shrink-0 group-hover:bg-brand-950 group-hover:text-white transition-colors">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm text-brand-950 font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
        active 
          ? "bg-brand-950 text-white shadow-md" 
          : "text-brand-500 hover:text-brand-950 hover:bg-brand-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
