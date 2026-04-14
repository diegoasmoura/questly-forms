import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { generatePremiumSummary } from "../lib/pdf";
import { scoreTest } from "../lib/scoring";
import { ClinicalTrendChart, transformResponsesToTrendData } from "../components/ClinicalCharts";
import { useShareLinkStatus, getStatusBadge } from "../lib/useShareLinkStatus";
import ShareLinkCard, { ShareLinkStats } from "../components/ShareLinkCard";
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
  Table,
  Plus,
  Share2,
  Copy,
  Eye
} from "lucide-react";

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("timeline"); // 'timeline' or 'trend' or 'table' or 'share'
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);
  const [forms, setForms] = useState([]);
  const [shareData, setShareData] = useState({ formId: "", expiresAt: "" });
  const [patientShareLinks, setPatientShareLinks] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [existingLinkForForm, setExistingLinkForForm] = useState(null);
  const [forceCreateNew, setForceCreateNew] = useState(false);

  useEffect(() => {
    loadPatient();
    loadForms();
  }, [id]);

  const loadForms = async () => {
    setLoadingForms(true);
    try {
      const formsData = await api.getForms();
      setForms(formsData);
    } catch (error) {
      console.error("Failed to load forms:", error);
    } finally {
      setLoadingForms(false);
    }
  };

  const loadPatientShareLinks = async () => {
    setLoadingLinks(true);
    try {
      const links = await api.getShareLinksForPatient(id);
      setPatientShareLinks(links);
    } catch (error) {
      console.error("Failed to load share links:", error);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleExtendLink = async (linkId, days = 30, type = "renewal") => {
    try {
      const result = await api.extendShareLink(linkId, days, type);
      alert(result.message || `Link atualizado!`);
      await loadPatientShareLinks();
    } catch (error) {
      alert("Erro ao atualizar link: " + error.message);
    }
  };

  const handleRevokeLink = async (linkId) => {
    if (!confirm("Excluir este link?")) return;
    try {
      await api.revokeShareLink(linkId);
      await loadPatientShareLinks();
    } catch (error) {
      alert("Erro ao excluir link: " + error.message);
    }
  };

  const handleCopyLink = () => {
    // Toast feedback could be added here
  };

  const getDefault30DaysLater = () => {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysLater.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const checkExistingLinkForForm = (formId) => {
    if (!formId) return null;
    const existing = patientShareLinks.find(
      link => link.formId === formId && link.status === "PENDENTE"
    );
    return existing || null;
  };

  useEffect(() => {
    if (activeTab === "share" || activeTab === "timeline") {
      loadPatientShareLinks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!showShareModal && activeTab === "share") {
      loadPatientShareLinks();
    }
  }, [showShareModal]);

  useEffect(() => {
    if (showShareModal) {
      setShareData({ formId: "", expiresAt: getDefault30DaysLater() });
      setExistingLinkForForm(null);
      setForceCreateNew(false);
    }
  }, [showShareModal]);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        email: patient.email || "",
        phone: patient.phone || "",
        birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : "",
        cpf: patient.cpf || "",
        rg: patient.rg || "",
        gender: patient.gender || "",
        maritalStatus: patient.maritalStatus || "",
        profession: patient.profession || "",
        cep: patient.cep || "",
        street: patient.street || "",
        number: patient.number || "",
        complement: patient.complement || "",
        neighborhood: patient.neighborhood || "",
        city: patient.city || "",
        state: patient.state || "",
        emergencyName: patient.emergencyName || "",
        emergencyPhone: patient.emergencyPhone || "",
        notes: patient.notes || ""
      });
    }
  }, [patient]);

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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePatient(patient.id, formData);
      await loadPatient();
      setShowEditModal(false);
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleCepLookup = async (cep) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error("CEP lookup failed:", error);
      }
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

            <div className="space-y-3 pt-6 border-t border-brand-50">
              {patient.email && (
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Email</p>
                    <p className="text-xs text-brand-700 font-medium truncate">{patient.email}</p>
                  </div>
                  <a
                    href={`mailto:${patient.email}`}
                    className="btn btn-ghost text-[10px] py-1 px-2 shrink-0 ml-2"
                    title="Enviar Email"
                  >
                    Enviar
                  </a>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Telefone</p>
                    <p className="text-xs text-brand-700 font-medium truncate">{patient.phone}</p>
                  </div>
                  <a
                    href={`tel:${patient.phone.replace(/\D/g, '')}`}
                    className="btn btn-ghost text-[10px] py-1 px-2 shrink-0 ml-2"
                    title="Ligar"
                  >
                    Ligar
                  </a>
                </div>
              )}
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Nascimento</p>
                <p className="text-xs text-brand-700 font-medium">{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "Não informado"}</p>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Paciente desde</p>
                <p className="text-xs text-brand-700 font-medium">{new Date(patient.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full mt-4 btn btn-primary text-xs py-3"
              >
                <Edit size={14} />
                Ver Dados Completos
              </button>
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
              <TabButton
                active={activeTab === "share"}
                onClick={() => setActiveTab("share")}
                icon={<Share2 size={14} />}
                label="Compartilhamento"
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

          {/* Share Tab */}
          {activeTab === "share" && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-brand-950">Compartilhar Formulários</h3>
                    <p className="text-sm text-brand-500 mt-1">Envie formulários para que {patient.name} preencha</p>
                  </div>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus size={16} />
                    Enviar Formulário
                  </button>
                </div>

                {loadingLinks ? (
                  <div className="text-center py-8 text-brand-400">
                    <div className="animate-spin w-6 h-6 border-2 border-brand-950 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-xs">Carregando links...</p>
                  </div>
                ) : patientShareLinks.length === 0 ? (
                  <div className="text-center py-12 bg-brand-50 rounded-lg border border-brand-100">
                    <Share2 size={40} className="mx-auto text-brand-300 mb-3" />
                    <p className="text-sm text-brand-500 font-medium">Nenhum formulário enviado ainda</p>
                    <p className="text-xs text-brand-400 mt-1">Clique no botão acima para começar</p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-visible">
                    <ShareLinkStats 
                      counts={{
                        PENDENTE: patientShareLinks.filter(l => l.status === "PENDENTE").length,
                        RESPONDIDO: patientShareLinks.filter(l => l.status === "RESPONDIDO").length,
                        EXPIRADO: patientShareLinks.filter(l => l.status === "EXPIRADO").length,
                      }}
                      compliance={patientShareLinks.length > 0 
                        ? Math.round((patientShareLinks.filter(l => l.status === "RESPONDIDO").length / patientShareLinks.length) * 100) 
                        : 0}
                    />
                    {patientShareLinks.map(link => (
                      <ShareLinkCard
                        key={link.id}
                        link={link}
                        onExtend={handleExtendLink}
                        onRevoke={handleRevokeLink}
                        onCopy={handleCopyLink}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab (Original) */}
          {activeTab === "timeline" && (
            loadingLinks ? (
              <div className="text-center py-12 text-brand-400">
                <div className="animate-spin w-6 h-6 border-2 border-brand-950 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs">Carregando formulários...</p>
              </div>
            ) : patientShareLinks.length === 0 ? (
              <div className="card p-20 text-center border-dashed border-2">
                <FileText size={48} className="mx-auto text-brand-200 mb-6" />
                <h3 className="text-xl font-bold text-brand-950 mb-2">Nenhum registro ainda</h3>
                <p className="text-brand-500 max-w-sm mx-auto">Envie um formulário ou escala para este paciente para começar a construir seu prontuário digital.</p>
                <Link to="/my-forms" className="btn btn-primary mt-8">Ir para Meus Formulários</Link>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                {/* Respondidos */}
                {(() => {
                  const answered = patientShareLinks.filter(link => link.response);
                  if (answered.length === 0) return null;
                  
                  return (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Respondidos ({answered.length})
                      </h4>
                      <div className="space-y-4">
                        {answered.map(link => {
                          const response = link.response;
                          const result = scoreTest(null, response.data);
                          
                          return (
                            <div 
                              key={response.id}
                              className="card overflow-hidden group hover:border-brand-300 transition-all duration-300 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleResponse(e, response.id);
                              }}
                            >
                              <div className="w-full flex items-center justify-between p-5">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors duration-300 shadow-sm">
                                    <FileText size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-brand-950 group-hover:text-brand-700 transition-colors">{link.form?.title}</h4>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                                        Enviado em {new Date(link.createdAt).toLocaleDateString('pt-BR')} · {new Date(link.createdAt).toLocaleTimeString('pt-BR')}
                                      </p>
                                      <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                                        ✓ Respondido
                                      </span>
                                      <p className="text-[10px] font-bold text-emerald-600">
                                        {new Date(response.createdAt).toLocaleDateString('pt-BR')} · {new Date(response.createdAt).toLocaleTimeString('pt-BR')}
                                      </p>
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
                                    if (!result || result.type !== "clinical") return null;
                                    
                                    const previousScore = (() => {
                                      const otherResponses = patientShareLinks
                                        .filter(l => l.response && l.response.id !== response.id)
                                        .map(l => {
                                          const r = scoreTest(null, l.response?.data);
                                          return r?.type === "clinical" ? r.score : null;
                                        })
                                        .filter(s => s !== null)
                                        .sort((a, b) => b - a);
                                      return otherResponses[0] || null;
                                    })();
                                    
                                    const scoreDiff = previousScore !== null ? result.score - previousScore : null;
                                    
                                    return (
                                      <div className={`mb-6 p-6 rounded-2xl border bg-white shadow-sm ${result.color}`}>
                                        <div className="flex items-center justify-between mb-4">
                                          <div className="flex items-center gap-2">
                                            <TrendingUp size={18} className="text-brand-950" />
                                            <h5 className="font-bold text-xs uppercase tracking-widest text-brand-950">{result.title}</h5>
                                          </div>
                                          {link.responseCount > 1 && (
                                            <span className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                              v{link.responseCount}
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-6 mb-4">
                                          <div className="text-5xl font-black text-brand-950">{result.score}</div>
                                          <div>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight ${result.color}`}>
                                              {result.severity}
                                            </span>
                                            <p className="text-[10px] text-brand-400 font-bold uppercase mt-2">Score total de {result.maxScore} pontos</p>
                                            {scoreDiff !== null && (
                                              <p className={`text-[10px] font-black mt-1 ${scoreDiff > 0 ? 'text-red-600' : scoreDiff < 0 ? 'text-emerald-600' : 'text-brand-400'}`}>
                                                {scoreDiff > 0 ? '↑' : scoreDiff < 0 ? '↓' : ''} {Math.abs(scoreDiff)} pts vs. anterior
                                              </p>
                                            )}
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
                                        onChange={(e) => setSearchTerm(e.target.value)}
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
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Aguardando Resposta */}
                {(() => {
                  const pending = patientShareLinks.filter(link => 
                    link.active && (!link.expiresAt || new Date(link.expiresAt) > new Date()) && !link.response
                  );
                  if (pending.length === 0) return null;
                  
                  return (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Aguardando Resposta ({pending.length})
                      </h4>
                      <div className="space-y-4">
                        {pending.map(link => {
                          const daysRemaining = link.expiresAt ? Math.ceil((new Date(link.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                          
                          return (
                            <div key={link.id} className="card p-5 bg-white border-brand-100 hover:border-brand-200 transition-all">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-brand-950 mb-1">{link.form?.title}</h5>
                                  <p className="text-xs text-brand-500 mb-3">
                                    Enviado em {new Date(link.createdAt).toLocaleDateString('pt-BR')} · {new Date(link.createdAt).toLocaleTimeString('pt-BR')}
                                  </p>
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
                                      Pendente
                                    </span>
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                                      Enviado
                                    </span>
                                    {daysRemaining && (
                                      <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full">
                                        {daysRemaining} dias restantes
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )
          )}
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && formData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
          <div className="card w-full max-w-3xl p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8 bg-white pb-4 border-b border-brand-50">
              <div>
                <h2 className="text-2xl font-bold text-brand-950">Editar Cadastro de Paciente</h2>
                <p className="text-sm text-brand-500 mt-1">Atualize os dados clínicos do prontuário.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl hover:bg-brand-50 text-brand-400 hover:text-brand-950 transition-all">
                <Plus size={28} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              {/* Section: Identificação */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Identificação do Paciente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Nome Completo *</label>
                    <input type="text" required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome social ou completo" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">CPF</label>
                    <input type="text" className="input" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">RG</label>
                    <input type="text" className="input" value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} placeholder="Órgão Emissor" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Data de Nascimento</label>
                    <input type="date" className="input" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Gênero / Identidade</label>
                    <select className="input" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">Selecionar...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Não-Binário">Não-Binário</option>
                      <option value="Outro">Outro / Prefiro não dizer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Estado Civil</label>
                    <select className="input" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                      <option value="">Selecionar...</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="União Estável">União Estável</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Profissão / Ocupação</label>
                    <input type="text" className="input" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} placeholder="Cargo ou área" />
                  </div>
                </div>
              </section>

              {/* Section: Contato */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">E-mail</label>
                    <input type="email" className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Telefone / WhatsApp</label>
                    <input type="tel" className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                </div>
              </section>

              {/* Section: Endereço */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Localização / Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">CEP</label>
                    <input type="text" className="input" value={formData.cep} onChange={e => {
                      setFormData({ ...formData, cep: e.target.value });
                      handleCepLookup(e.target.value);
                    }} placeholder="00000-000" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Logradouro (Rua/Av)</label>
                    <input type="text" className="input" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Número</label>
                    <input type="text" className="input" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Bairro</label>
                    <input type="text" className="input" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Cidade / UF</label>
                    <div className="flex gap-2">
                      <input type="text" className="input flex-1" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                      <input type="text" className="input w-16" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} maxLength={2} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Emergência */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Contato de Emergência
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Nome do Contato</label>
                    <input type="text" className="input" value={formData.emergencyName} onChange={e => setFormData({ ...formData, emergencyName: e.target.value })} placeholder="Parente, amigo, etc." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Telefone de Emergência</label>
                    <input type="tel" className="input" value={formData.emergencyPhone} onChange={e => setFormData({ ...formData, emergencyPhone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                </div>
              </section>

              {/* Section: Observações */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Observações Gerais
                </h3>
                <textarea
                  className="input min-h-[120px] py-4"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações relevantes para o acompanhamento..."
                />
              </section>

              <div className="flex gap-4 pt-8 bg-white pb-4 border-t border-brand-50">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary flex-1 py-4 font-bold">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary flex-1 py-4 font-bold shadow-xl shadow-brand-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </div>
                  ) : (
                    "Salvar Alterações"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-brand-950">Enviar Formulário para {patient?.name}</h2>
                <p className="text-xs text-brand-500 mt-1">Crie um link para que o paciente preencha o formulário</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-brand-400 hover:text-brand-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!shareData.formId) {
                alert("Selecione um formulário");
                return;
              }
              try {
                const result = await api.createShareLink({
                  formId: shareData.formId,
                  patientId: patient.id,
                  expiresAt: shareData.expiresAt || null,
                });
                const absoluteUrl = result.shareUrl.startsWith("http")
                  ? result.shareUrl
                  : `${window.location.origin}${result.shareUrl}`;
                await navigator.clipboard.writeText(absoluteUrl);
                const action = result.reused ? "reutilizado" : "criado";
                alert(`Link ${action} e copiado para a área de transferência!`);
                setShowShareModal(false);
                loadPatientShareLinks();
              } catch (error) {
                alert(error.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Selecione um Formulário *</label>
                {loadingForms ? (
                  <div className="text-center py-4 text-brand-400">
                    <div className="animate-spin w-4 h-4 border-2 border-brand-950 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <select
                    className="input"
                    value={shareData.formId}
                    onChange={(e) => {
                      setShareData({ ...shareData, formId: e.target.value });
                      const existing = checkExistingLinkForForm(e.target.value);
                      setExistingLinkForForm(existing);
                      setForceCreateNew(false);
                    }}
                    required
                  >
                    <option value="">Selecionar formulário...</option>
                    {forms.map(form => (
                      <option key={form.id} value={form.id}>{form.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {existingLinkForForm && !forceCreateNew && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900 font-medium">⏱️ Link já existe para este formulário</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Este paciente já tem um link pendente para {forms.find(f => f.id === shareData.formId)?.title}.
                    Deseja reutilizá-lo ou criar um novo?
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Data de Expiração *</label>
                <input
                  type="date"
                  className="input"
                  min={getTodayDate()}
                  value={shareData.expiresAt}
                  onChange={(e) => setShareData({ ...shareData, expiresAt: e.target.value })}
                  required
                />
                <p className="text-xs text-brand-400 mt-1">O link expirará automaticamente nesta data. Padrão: 30 dias a partir de hoje</p>
              </div>

              <div className="flex gap-2 pt-4">
                {existingLinkForForm && !forceCreateNew ? (
                  <>
                    <button type="submit" className="btn btn-secondary flex-1">
                      ↻ Reutilizar Link Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => setForceCreateNew(true)}
                      className="btn btn-ghost"
                    >
                      Criar Novo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      className="btn btn-ghost text-xs"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" className="btn btn-primary flex-1">
                      Gerar e Copiar Link
                    </button>
                    {existingLinkForForm && forceCreateNew && (
                      <button
                        type="button"
                        onClick={() => setForceCreateNew(false)}
                        className="btn btn-ghost"
                      >
                        ← Voltar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      className="btn btn-ghost"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
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
