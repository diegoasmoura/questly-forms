import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { scoreTest } from "../lib/scoring";
import {
  ArrowLeft, Calendar, FileText, Activity, AlertTriangle,
  BookOpen, Users, Download, TrendingUp,
  FileDown
} from "lucide-react";

export default function ResponseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientResponses, setPatientResponses] = useState([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const cameFromPatient = location.state?.fromPatient;
  const cameFromResponses = location.state?.fromResponses;

  useEffect(() => {
    loadResponse();
  }, [id]);

  const loadResponse = async () => {
    try {
      const data = await api.getResponse(id);
      setResponse(data);

      // If has patient, load their other responses for context
      if (data.patientId) {
        try {
          const patientData = await api.getPatient(data.patientId);
          setPatientResponses(patientData.responses || []);
        } catch (e) {
          // Ignore if can't load patient
        }
      }
    } catch (error) {
      console.error("Failed to load:", error);
    } finally {
      setLoading(false);
    }
  };

  const clinicalResult = useMemo(() => {
    if (!response?.data) return null;
    return scoreTest(null, response.data);
  }, [response]);

  const isClinical = clinicalResult?.type === "clinical";

  const handleBack = () => {
    if (cameFromPatient && response?.patientId) {
      navigate(`/patients/${response.patientId}`);
    } else if (cameFromResponses && response?.formId) {
      navigate(`/forms/${response.formId}/responses`);
    } else {
      navigate(-1);
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      alert("Exportação de PDF em desenvolvimento");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-900 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="text-center card p-10 max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Resposta não encontrada</h2>
          <Link to="/my-forms" className="btn btn-primary">Voltar para Meus Formulários</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-emerald-50 text-slate-500 hover:text-slate-900 transition-all"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        
        <div className="flex items-center gap-2">
          {response.patient && (
            <Link 
              to={`/patients/${response.patient.id}`} 
              state={{ fromResponse: true }}
              className="btn btn-secondary text-xs"
            >
              <Users size={16} />
              Prontuário
            </Link>
          )}
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="btn btn-secondary text-xs"
          >
            {generatingPdf ? (
              <div className="w-4 h-4 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FileDown size={16} />
                PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">{response.form?.title || "Análise Clínica"}</h1>
        <p className="text-slate-600 mt-1 flex items-center gap-2">
          <Calendar size={14} />
          Coletado em {new Date(response.createdAt).toLocaleString("pt-BR")}
        </p>
      </div>

      <div className="space-y-8">
        {/* Patient Context Bar */}
        {response.patient && (
          <div className="card p-6 border-2 border-emerald-100/50 bg-emerald-50/20 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-900 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {response.patient.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-slate-900 truncate">{response.patient.name}</p>
                {response.patient.email && (
                  <p className="text-sm text-slate-600 font-medium">{response.patient.email}</p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Vínculo Ativo</span>
                </div>
              </div>
              {patientResponses.length > 1 && (
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Histórico do Paciente</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{patientResponses.length}</p>
                  <p className="text-[10px] text-slate-600 font-bold">respostas totais</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clinical Result Card */}
        {isClinical ? (
          <div className="space-y-8">
            {/* Main Score Card */}
            <div className={`card p-8 border-2 shadow-xl shadow-emerald-900/5 relative overflow-hidden group ${clinicalResult.color}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Activity size={120} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-900 text-white">
                      <Activity size={20} />
                    </div>
                    <h2 className="font-black text-xs uppercase tracking-widest text-slate-900">
                      Análise de {clinicalResult.title}
                    </h2>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight shadow-sm ${clinicalResult.color}`}>
                    {clinicalResult.severity}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-8 mb-8">
                  <div className="w-28 h-28 rounded-3xl bg-emerald-900 text-white flex flex-col items-center justify-center shadow-2xl shadow-emerald-900/20">
                    <span className="text-4xl font-black leading-none">{clinicalResult.score}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60 mt-1">pontos</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Interpretação Clínica</p>
                    <p className="text-xl font-bold text-slate-900 leading-snug">{clinicalResult.interpretation}</p>
                    <p className="text-sm text-slate-600 mt-2 font-medium italic">Máximo possível: {clinicalResult.maxScore} pontos</p>
                  </div>
                </div>

                {clinicalResult.alert && (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-red-600 text-white text-sm font-black shadow-lg shadow-red-200 animate-pulse">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <AlertTriangle size={20} />
                    </div>
                    <p>{clinicalResult.alert}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Item-by-Item Analysis */}
            <div className="card p-8 bg-white shadow-sm border-emerald-100/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-3">
                  <div className="w-1 h-4 bg-emerald-900 rounded-full" />
                  Detalhamento de Itens
                </h3>
              </div>

              {response.data.phq9_items && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(response.data.phq9_items).map(([item, value]) => {
                    const itemLabels = {
                      interest: "Pouco interesse ou prazer",
                      down: "Sentir-se deprimido",
                      sleep: "Dificuldade para dormir",
                      energy: "Cansaço/falta de energia",
                      appetite: "Alterações no apetite",
                      failure: "Sentimento de fracasso",
                      concentration: "Dificuldade de concentração",
                      movement: "Agitação/letargia",
                      suicide: "Pensamentos suicidas"
                    };
                    const severity = value >= 2 ? "high" : value >= 1 ? "medium" : "low";
                    const colorMap = {
                      high: "bg-red-500",
                      medium: "bg-amber-500",
                      low: "bg-emerald-500"
                    };

                    return (
                      <div key={item} className="p-4 rounded-xl border border-emerald-50 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group">
                        <div className="flex items-start justify-between mb-3 gap-4">
                          <p className="text-xs font-bold text-slate-900 leading-relaxed group-hover:text-slate-800 transition-colors">
                            {itemLabels[item] || item}
                          </p>
                          <span className="text-lg font-black text-slate-900 shrink-0">{value}</span>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${colorMap[severity]}`}
                            style={{ width: `${(value / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {response.data.gad7_items && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(response.data.gad7_items).map(([item, value]) => {
                    const itemLabels = {
                      nervous: "Sentir-se nervoso/ansioso",
                      control: "Não controlar preocupação",
                      worrying: "Preocupar-se demais",
                      relax: "Dificuldade para relaxar",
                      restless: "Inquieto/agitado",
                      annoyed: "Irritável",
                      afraid: "Medo sem motivo"
                    };
                    const severity = value >= 2 ? "high" : value >= 1 ? "medium" : "low";
                    const colorMap = {
                      high: "bg-red-500",
                      medium: "bg-amber-500",
                      low: "bg-emerald-500"
                    };

                    return (
                      <div key={item} className="p-4 rounded-xl border border-emerald-50 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group">
                        <div className="flex items-start justify-between mb-3 gap-4">
                          <p className="text-xs font-bold text-slate-900 leading-relaxed group-hover:text-slate-800 transition-colors">
                            {itemLabels[item] || item}
                          </p>
                          <span className="text-lg font-black text-slate-900 shrink-0">{value}</span>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${colorMap[severity]}`}
                            style={{ width: `${(value / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historical Context Card */}
            {patientResponses.length > 1 && (
              <div className="card p-8 bg-emerald-50/50 border-emerald-100 shadow-sm">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-3">
                  <TrendingUp size={16} />
                  Contexto Histórico do Paciente
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {patientResponses
                    .filter(r => r.formId === response.formId)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((resp, idx) => {
                      const result = scoreTest(null, resp.data);
                      if (!result || result.type !== "clinical") return null;
                      const isCurrent = resp.id === response.id;

                      return (
                        <div
                          key={resp.id}
                          onClick={() => !isCurrent && navigate(`/responses/${resp.id}`, { state: { fromPatient: true } })}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-white border-emerald-900 shadow-xl shadow-emerald-900/5 scale-[1.02] z-10"
                              : "bg-white border-emerald-50 hover:border-emerald-200 hover:shadow-md"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${isCurrent ? 'bg-emerald-900 text-white' : 'bg-emerald-50 text-slate-900'}`}>
                            {result.score}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              {new Date(resp.createdAt).toLocaleDateString("pt-BR", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className={`text-xs font-bold truncate ${isCurrent ? 'text-slate-900' : 'text-emerald-600'}`}>
                              {isCurrent ? "Esta Resposta" : result.severity}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${result.color}`}>
                            {result.severity}
                          </span>
                          {!isCurrent && (
                            <ChevronRight size={16} className="text-emerald-400" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* General Form Analysis */
          <div className="card p-8 bg-white shadow-sm border-emerald-100/50">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-8 border-b border-emerald-50 pb-4">
              Respostas Coletadas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.entries(response.data || {}).map(([key, value]) => (
                <div key={key} className="p-5 rounded-2xl border border-emerald-50 bg-emerald-50/20 hover:bg-emerald-50 transition-colors">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-slate-900 font-bold leading-relaxed">
                    {typeof value === "object" ? (
                      <pre className="text-[10px] font-mono mt-2 bg-white p-3 rounded-lg border border-emerald-50 overflow-auto max-h-40">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
