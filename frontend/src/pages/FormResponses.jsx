import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { exportToPdf } from "../lib/pdf";
import { ResponseTrendChart, SeverityBarChart, transformResponsesToTrendData } from "../components/ClinicalCharts";
import DataTable from "../components/DataTable";
import { ArrowLeft, Download, Filter, Trash2, Eye, Calendar, FileDown, TrendingUp, Table } from "lucide-react";

export default function FormResponses() {
  const { id } = useParams();
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(null);
  const [aggregate, setAggregate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [activeTab, setActiveTab] = useState("list"); // 'list', 'trend', 'table', 'severity'
  const [selectedPatient, setSelectedPatient] = useState("all"); // Filter by patient

  useEffect(() => {
    loadData();
  }, [id]);

  // Extract unique patients from responses
  const uniquePatients = useMemo(() => {
    const patientsMap = new Map();
    responses.forEach(r => {
      if (r.patient) {
        patientsMap.set(r.patient.id, r.patient);
      }
    });
    return Array.from(patientsMap.values());
  }, [responses]);

  // Filter responses by selected patient
  const filteredResponses = useMemo(() => {
    if (selectedPatient === "all") return responses;
    return responses.filter(r => r.patient?.id === selectedPatient);
  }, [responses, selectedPatient]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [formData, responsesData, aggregateData] = await Promise.all([
        api.getForm(id),
        api.getResponses(id),
        api.getAggregate(id),
      ]);
      setForm(formData);
      setResponses(responsesData);
      setAggregate(aggregateData);
    } catch (error) {
      console.error("Failed to load:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (responseId) => {
    if (!confirm("Excluir esta resposta?")) return;
    try {
      await api.deleteResponse(responseId);
      setResponses(responses.filter((r) => r.id !== responseId));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleExportCSV = () => {
    if (!responses.length) return;
    const headers = Object.keys(responses[0].data);
    const csv = [
      ["ID da Resposta", "Data", ...headers].join(","),
      ...responses.map((r) => [
        r.id,
        new Date(r.createdAt).toISOString(),
        ...headers.map((h) => JSON.stringify(r.data[h] || "")),
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form?.title || "respostas"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = (response) => {
    try {
      const fileName = `${form?.title || "Survey"}_${new Date(response.createdAt).toISOString().split('T')[0]}.pdf`;
      exportToPdf(form.schema, response.data, fileName);
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-900 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Carregando respostas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden animate-fade-in bg-emerald-50/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/my-forms" className="p-2 rounded-xl hover:bg-emerald-50 text-slate-500 hover:text-emerald-900 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">{form?.title}</h1>
            <p className="text-sm text-slate-600">
              Resultados e análise das respostas coletadas.
              {aggregate && ` • ${aggregate.total} respostas totais`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn btn-secondary text-xs">
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {aggregate && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
          <StatBox label="Total" value={aggregate.total} color="bg-blue-50 text-blue-600" />
          <StatBox label="Hoje" value={aggregate.todayCount} color="bg-emerald-50 text-emerald-600" />
          <StatBox label="Esta Semana" value={aggregate.weekCount} color="bg-purple-50 text-purple-600" />
          <StatBox label="Dias Ativos" value={Object.keys(aggregate.dailyCounts || {}).length} color="bg-orange-50 text-orange-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-100 shadow-sm">
          <TabButton 
            active={activeTab === "list"} 
            onClick={() => setActiveTab("list")} 
            icon={<Eye size={14} />} 
            label="Lista de Respostas" 
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Patient Filter */}
        {uniquePatients.length > 0 && (
          <div className="card p-4 mb-4 bg-emerald-50/50 border-emerald-100">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filtrar por Paciente:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPatient("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedPatient === "all"
                      ? "bg-emerald-900 text-white shadow-md shadow-emerald-900/10"
                      : "bg-white text-emerald-600 hover:text-emerald-900 border border-emerald-100"
                  }`}
                >
                  Todos ({responses.length})
                </button>
                {uniquePatients.map(patient => {
                  const count = responses.filter(r => r.patient?.id === patient.id).length;
                  return (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedPatient === patient.id
                          ? "bg-emerald-900 text-white shadow-md shadow-emerald-900/10"
                          : "bg-white text-emerald-600 hover:text-emerald-900 border border-emerald-100"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-[8px] font-black">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px]">{patient.name}</span>
                      <span className="text-[9px] opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="animate-fade-in">
        {/* Trend Tab */}
        {activeTab === "trend" && aggregate?.dailyCounts && (
          <div className="card p-8">
            <ResponseTrendChart data={aggregate.dailyCounts} title="Atividade de Respostas" height={350} />
          </div>
        )}

        {/* Table Tab */}
        {activeTab === "table" && filteredResponses.length > 0 && (
          <div className="card p-6 overflow-hidden">
            <DataTable
              data={filteredResponses.map(r => ({ ...r.data, createdAt: r.createdAt }))}
              schema={form?.schema}
              title={`Dados Consolidados${selectedPatient !== "all" ? ` - ${uniquePatients.find(p => p.id === selectedPatient)?.name || ''}` : ''}`}
            />
          </div>
        )}

        {/* Responses List Tab */}
        {activeTab === "list" && (
          filteredResponses.length === 0 ? (
          <div className="card p-20 text-center border-dashed border-2">
            <Filter size={48} className="mx-auto text-emerald-200 mb-6" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {selectedPatient !== "all" ? "Nenhuma resposta deste paciente" : "Nenhuma resposta coletada"}
            </h3>
            <p className="text-slate-600 max-w-sm mx-auto">
              {selectedPatient !== "all"
                ? "Este paciente ainda não respondeu este formulário específico."
                : "Compartilhe este formulário com seus pacientes para começar a coletar dados clínicos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredResponses.map((response) => (
              <div key={response.id} className="card group hover:border-emerald-300 transition-all duration-300 overflow-hidden">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Patient Info */}
                    {response.patient ? (
                      <Link 
                        to={`/patients/${response.patient.id}`}
                        className="flex items-center gap-3 px-4 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all group/patient"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-900 text-white flex items-center justify-center text-xs font-bold group-hover/patient:bg-emerald-700 transition-colors">
                          {response.patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover/patient:text-emerald-700 transition-colors">{response.patient.name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Paciente Vinculado</p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="w-10 h-10 rounded-lg bg-emerald-200 flex items-center justify-center text-slate-600 text-xs">
                          ?
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-600">Resposta Anônima</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Link Público</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="hidden lg:block h-10 w-px bg-emerald-50 mx-2" />
                    
                    <div className="flex flex-col">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coletado em</p>
                      <span className="text-sm text-slate-900 font-bold mt-0.5">
                        {new Date(response.createdAt).toLocaleString("pt-BR", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {response.patient && (
                      <Link
                        to={`/patients/${response.patient.id}`}
                        state={{ fromResponses: true }}
                        className="btn btn-secondary text-[10px] font-bold py-2"
                      >
                        Prontuário
                      </Link>
                    )}
                    
                    <div className="h-8 w-px bg-emerald-50 mx-1" />
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedResponse(selectedResponse?.id === response.id ? null : response)}
                        className={`p-2 rounded-lg transition-all ${selectedResponse?.id === response.id ? 'bg-emerald-900 text-white' : 'hover:bg-emerald-50 text-slate-500'}`}
                        title="Ver dados brutos"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleExportPdf(response)}
                        className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-900 transition-all"
                        title="Exportar PDF"
                      >
                        <FileDown size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(response.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded view (Raw Data) */}
                {selectedResponse?.id === response.id && (
                  <div className="px-5 pb-5 animate-fade-in">
                    <div className="p-4 bg-emerald-900 text-emerald-400 rounded-xl overflow-auto max-h-96 font-mono text-[11px] leading-relaxed shadow-inner">
                      {JSON.stringify(response.data, null, 2)}
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

function StatBox({ label, value, color }) {
  return (
    <div className="card p-6 flex items-center justify-between group hover:border-emerald-300 transition-all duration-300">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
      <div className={`p-3 rounded-2xl ${color} opacity-80 group-hover:scale-110 transition-transform duration-300`}>
        <TrendingUp size={24} />
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
          ? "bg-emerald-900 text-white shadow-md" 
          : "text-slate-600 hover:text-emerald-900 hover:bg-emerald-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
