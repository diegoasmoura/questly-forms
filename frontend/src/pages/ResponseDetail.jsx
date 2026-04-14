import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { scoreTest } from "../lib/scoring";
import {
  ArrowLeft, Calendar, FileText, Activity, AlertTriangle,
  BookOpen, Users, Download, ChevronRight, TrendingUp
} from "lucide-react";

export default function ResponseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientResponses, setPatientResponses] = useState([]);

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

  if (loading) {
    return <div className="min-h-screen bg-brand-50 flex items-center justify-center">
      <div className="animate-pulse text-brand-500">Carregando resposta...</div>
    </div>;
  }

  if (!response) {
    return <div className="min-h-screen bg-brand-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-brand-950 mb-4">Resposta não encontrada</h2>
        <Link to="/dashboard" className="btn btn-primary">Voltar ao Dashboard</Link>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header */}
      <header className="bg-white border-b border-brand-100 sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-500">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-brand-950">{response.form?.title || "Resposta"}</h1>
              <p className="text-xs text-brand-400">
                {new Date(response.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {response.patient && (
              <Link to={`/patients/${response.patient.id}`} className="btn btn-secondary text-xs">
                <Users size={14} />
                Ver Prontuário
              </Link>
            )}
            <button
              onClick={() => navigate(`/forms/${response.formId}/responses`)}
              className="btn btn-ghost text-xs"
            >
              <TrendingUp size={14} />
              Ver Todas as Respostas
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Patient Context Bar */}
        {response.patient && (
          <div className="bg-white rounded-xl border-2 border-emerald-100 p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg font-bold">
                {response.patient.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-950">{response.patient.name}</p>
                {response.patient.email && (
                  <p className="text-xs text-brand-500">{response.patient.email}</p>
                )}
              </div>
              {patientResponses.length > 1 && (
                <div className="text-right">
                  <p className="text-xs text-brand-400">Histórico</p>
                  <p className="text-lg font-bold text-brand-950">{patientResponses.length}</p>
                  <p className="text-[10px] text-brand-500">respostas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clinical Result Card */}
        {isClinical ? (
          <div className="space-y-6">
            {/* Main Score */}
            <div className={`rounded-xl border-2 p-6 bg-white shadow-sm ${clinicalResult.color}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={20} className="text-brand-950" />
                  <h2 className="font-bold text-sm uppercase tracking-widest text-brand-950">
                    {clinicalResult.title}
                  </h2>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${clinicalResult.color}`}>
                  {clinicalResult.severity}
                </span>
              </div>

              <div className="flex items-baseline gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-brand-950">
                  <span className="text-3xl font-bold">{clinicalResult.score}</span>
                </div>
                <div>
                  <p className="text-sm text-brand-400 font-medium">de {clinicalResult.maxScore} pontos</p>
                  <p className="text-xs text-brand-500 mt-1">{clinicalResult.interpretation}</p>
                </div>
              </div>

              {clinicalResult.alert && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-600 text-white text-sm font-bold shadow-lg">
                  <AlertTriangle size={18} />
                  {clinicalResult.alert}
                </div>
              )}
            </div>

            {/* Item-by-Item Analysis */}
            <div className="bg-white rounded-xl border-2 border-brand-100 p-6 shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-widest text-brand-950 mb-6 flex items-center gap-2">
                <FileText size={16} />
                Análise Item-a-Item
              </h3>

              {response.data.phq9_items && (
                <div className="space-y-4">
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
                    const colors = {
                      high: "bg-red-50 border-red-200 text-red-700",
                      medium: "bg-amber-50 border-amber-200 text-amber-700",
                      low: "bg-emerald-50 border-emerald-200 text-emerald-700"
                    };

                    return (
                      <div key={item} className={`p-4 rounded-lg border ${colors[severity]}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium flex-1">{itemLabels[item] || item}</p>
                          <span className="text-lg font-bold">{value}/3</span>
                        </div>
                        <div className="w-full bg-white/50 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              severity === "high" ? "bg-red-500" : severity === "medium" ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${(value / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {response.data.gad7_items && (
                <div className="space-y-4">
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
                    const colors = {
                      high: "bg-red-50 border-red-200 text-red-700",
                      medium: "bg-amber-50 border-amber-200 text-amber-700",
                      low: "bg-emerald-50 border-emerald-200 text-emerald-700"
                    };

                    return (
                      <div key={item} className={`p-4 rounded-lg border ${colors[severity]}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium flex-1">{itemLabels[item] || item}</p>
                          <span className="text-lg font-bold">{value}/3</span>
                        </div>
                        <div className="w-full bg-white/50 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              severity === "high" ? "bg-red-500" : severity === "medium" ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${(value / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comparison with Previous Responses */}
            {patientResponses.length > 1 && (
              <div className="bg-white rounded-xl border-2 border-brand-100 p-6 shadow-sm">
                <h3 className="font-bold text-sm uppercase tracking-widest text-brand-950 mb-4 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Evolução no Tempo
                </h3>
                <div className="space-y-3">
                  {patientResponses
                    .filter(r => r.formId === response.formId)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((resp, idx) => {
                      const result = scoreTest(null, resp.data);
                      if (!result || result.type !== "clinical") return null;

                      const isCurrentResponse = resp.id === response.id;

                      return (
                        <div
                          key={resp.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                            isCurrentResponse
                              ? "bg-brand-50 border-brand-950 ring-2 ring-brand-200"
                              : "bg-white border-brand-100 hover:bg-brand-50"
                          }`}
                        >
                          <div className="text-center min-w-[60px]">
                            <p className="text-2xl font-bold text-brand-950">{result.score}</p>
                            <p className="text-[10px] text-brand-400">/ {result.maxScore}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-brand-400">
                              {new Date(resp.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                            {idx === 0 && (
                              <span className="text-[10px] font-medium text-emerald-600">Mais recente</span>
                            )}
                            {isCurrentResponse && (
                              <span className="text-[10px] font-medium text-brand-950 ml-2">← Resposta atual</span>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${result.color}`}>
                            {result.severity}
                          </span>
                          {idx > 0 && (() => {
                            const prevResult = scoreTest(null, patientResponses.find(
                              r => r.formId === resp.formId && new Date(r.createdAt) < new Date(resp.createdAt)
                            )?.data);
                            if (!prevResult) return null;
                            const diff = result.score - prevResult.score;
                            return (
                              <span className={`text-xs font-bold ${
                                diff < 0 ? "text-emerald-600" : diff > 0 ? "text-red-600" : "text-gray-400"
                              }`}>
                                {diff > 0 ? "↑" : diff < 0 ? "↓" : "→"} {Math.abs(diff)}
                              </span>
                            );
                          })()}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Non-Clinical Form - Show Formatted Table */
          <div className="bg-white rounded-xl border-2 border-brand-100 p-6 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-widest text-brand-950 mb-6">
              Respostas
            </h3>
            <div className="space-y-4">
              {Object.entries(response.data || {}).map(([key, value]) => (
                <div key={key} className="p-4 rounded-lg border border-brand-100 hover:bg-brand-50 transition-colors">
                  <p className="text-xs font-medium text-brand-400 uppercase tracking-wide mb-2">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-brand-950 font-medium">
                    {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
