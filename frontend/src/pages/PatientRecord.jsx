import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatCPF, formatPhone, formatCEP } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { generatePremiumSummary } from "../lib/pdf";
import { scoreTest } from "../lib/scoring";
import { ClinicalTrendChart, transformResponsesToTrendData, AttendanceHeatmap, transformResponsesToHeatmapData } from "../components/ClinicalCharts";
import { useShareLinkStatus, getStatusBadge } from "../lib/useShareLinkStatus";
import ShareLinkCard, { ShareLinkStats } from "../components/ShareLinkCard";
import FormResponsesView from "../components/FormResponsesView";
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
  Eye,
  UserCheck,
  UserX,
  Contact,
  MapPin,
  Settings,
  X,
  Check,
  Paperclip,
  File,
  Trash,
  Download,
  RefreshCcw
} from "lucide-react";

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("timeline"); // 'timeline' or 'share' or 'sessions'
  const [attendances, setAttendances] = useState([]);
  const [loadingAttendances, setLoadingAttendances] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTab, setEditTab] = useState("identity");
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const loadPatientAttendances = async () => {
    setLoadingAttendances(true);
    try {
      const data = await api.getAttendances();
      const filtered = data.filter(a => a.patientId === id);
      setAttendances(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Erro ao carregar histórico de sessões:", error);
    } finally {
      setLoadingAttendances(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") {
      loadPatientAttendances();
    }
  }, [activeTab]);

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
        phone: formatPhone(patient.phone || ""),
        birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : "",
        cpf: formatCPF(patient.cpf || ""),
        rg: patient.rg || "",
        gender: patient.gender || "",
        maritalStatus: patient.maritalStatus || "",
        profession: patient.profession || "",
        cep: formatCEP(patient.cep || ""),
        street: patient.street || "",
        number: patient.number || "",
        complement: patient.complement || "",
        neighborhood: patient.neighborhood || "",
        city: patient.city || "",
        state: patient.state || "",
        emergencyName: patient.emergencyName || "",
        emergencyPhone: formatPhone(patient.emergencyPhone || ""),
        notes: patient.notes || "",
        isActive: patient.isActive !== false,
        sessionTime: patient.sessionTime || "",
        sessionDuration: patient.sessionDuration || "50",
        sessionFrequency: patient.sessionFrequency || "semanal",
        nextSession: patient.nextSession ? patient.nextSession.split('T')[0] : ""
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

  const loadAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const data = await api.getAttachments(id);
      setAttachments(data);
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleUploadAttachment = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of files) {
        const result = await api.uploadAttachment(id, file);
        setAttachments(prev => [result, ...prev]);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm("Tem certeza que deseja excluir este anexo?")) return;
    try {
      await api.deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error("Erro ao deletar anexo:", error);
      alert("Erro ao deletar arquivo");
    }
  };

  const handleDownloadAttachment = async (att) => {
    try {
      await api.downloadAttachment(att.id, att.filename);
    } catch (error) {
      console.error("Erro ao baixar:", error);
      alert("Erro ao baixar arquivo");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    console.log("handleSave - Enviando dados:", JSON.stringify(formData, null, 2));
    setSaving(true);
    try {
      const result = await api.updatePatient(patient.id, formData);
      console.log("Resposta do servidor:", JSON.stringify(result, null, 2));
      await loadPatient();
      setShowEditModal(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
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
          <div className="w-10 h-10 rounded-full border-2 border-emerald-900 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="text-center card p-10 max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Paciente não encontrado</h2>
          <p className="text-slate-600 mt-2">O registro que você está procurando não existe ou foi removido.</p>
          <Link to="/patients" className="btn btn-primary mt-6">Voltar para Pacientes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden animate-fade-in">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 group transition-colors shrink-0">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Voltar para Lista de Pacientes
      </Link>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Patient Profile */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-emerald-900 flex items-center justify-center text-white font-bold text-3xl mb-3 shadow-xl shadow-emerald-900/20">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Prontuário #{patient.id.slice(0, 8).toUpperCase()}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-emerald-50">
                {patient.email && (
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</p>
                      <p className="text-xs text-emerald-700 font-medium truncate">{patient.email}</p>
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
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefone</p>
                    <p className="text-xs text-emerald-700 font-medium truncate">{patient.phone}</p>
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
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nascimento</p>
                <p className="text-xs text-emerald-700 font-medium">
                  {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "Não informado"}
                  {patient.birthDate && (() => {
                    const today = new Date();
                    const birth = new Date(patient.birthDate);
                    let age = today.getFullYear() - birth.getFullYear();
                    const monthDiff = today.getMonth() - birth.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                      age--;
                    }
                    return <span className="ml-1 text-slate-500">({age} anos)</span>;
                  })()}
                </p>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paciente desde</p>
                <p className="text-xs text-emerald-700 font-medium">{new Date(patient.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <button
                onClick={() => { setEditTab("identity"); loadAttachments(); setShowEditModal(true); }}
                className="w-full mt-4 btn btn-primary text-xs py-3"
              >
                <Edit size={14} />
                Ver Dados Completos
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Edit size={16} />
              Notas Clínicas
            </h3>
            {patient.notes ? (
              <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100">
                {patient.notes}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                Nenhuma observação clínica registrada para este paciente.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-3 space-y-8">
          {/* Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Histórico Clínico</h2>
              <p className="text-sm text-slate-600 mt-1">
                Acompanhe a evolução e todas as respostas coletadas.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-100 shadow-sm">
              <TabButton
                active={activeTab === "timeline"}
                onClick={() => setActiveTab("timeline")}
                icon={<FileText size={14} />}
                label="Linha do Tempo"
              />
              <TabButton
                active={activeTab === "share"}
                onClick={() => setActiveTab("share")}
                icon={<Share2 size={14} />}
                label="Formulários"
              />
              <TabButton
                active={activeTab === "sessions"}
                onClick={() => setActiveTab("sessions")}
                icon={<Calendar size={14} />}
                label="Frequência"
              />
            </div>
          </div>

          {/* Share Tab */}
          {activeTab === "share" && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Compartilhar Formulários</h3>
                    <p className="text-sm text-slate-600 mt-1">Envie formulários para que {patient.name} preencha</p>
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
                  <div className="text-center py-8 text-slate-500">
                    <div className="animate-spin w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-xs">Carregando links...</p>
                  </div>
                ) : patientShareLinks.length === 0 ? (
                  <div className="text-center py-12 bg-emerald-50 rounded-lg border border-emerald-100">
                    <Share2 size={40} className="mx-auto text-emerald-400 mb-3" />
                    <p className="text-sm text-slate-600 font-medium">Nenhum formulário enviado ainda</p>
                    <p className="text-xs text-slate-500 mt-1">Clique no botão acima para começar</p>
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

          {/* Sessions/Frequency Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4 flex items-center gap-4 border-l-4 border-emerald-500">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{attendances.filter(a => a.status === 'presente').length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presenças</p>
                  </div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-l-4 border-red-500">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                    <UserX size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{attendances.filter(a => a.status === 'falta').length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faltas</p>
                  </div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-l-4 border-amber-500">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{attendances.filter(a => a.status === 'justificada').length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Justificadas</p>
                  </div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-l-4 border-slate-500">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{attendances.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sessões</p>
                  </div>
                </div>
              </div>

              {/* Timeline List */}
              <div className="card p-8">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-8">Histórico de Sessões</h3>
                
                {loadingAttendances ? (
                  <div className="text-center py-20 opacity-50">
                    <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Carregando histórico...</p>
                  </div>
                ) : attendances.length === 0 ? (
                  <div className="text-center py-20 opacity-30">
                    <Calendar size={48} className="mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum registro de presença ainda</p>
                    <p className="text-xs mt-2">Os registros aparecerão conforme você marcar na Agenda.</p>
                  </div>
                ) : (
                  <div className="space-y-0 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                    {attendances.map((att, idx) => {
                      const isReagendado = att.notes?.includes('Reagendado');
                      
                      const statusConfig = {
                        presente: { color: "bg-emerald-500", label: "Presente", bg: "bg-emerald-50", text: "text-emerald-700", icon: <Check size={12} /> },
                        falta: { color: "bg-red-500", label: "Falta", bg: "bg-red-50", text: "text-red-700", icon: <X size={12} /> },
                        justificada: { color: "bg-amber-500", label: "Justificada", bg: "bg-amber-50", text: "text-amber-700", icon: isReagendado ? <RefreshCcw size={12} /> : <AlertCircle size={12} /> },
                      };

                      const config = statusConfig[att.status] || { color: "bg-slate-400", label: att.status, bg: "bg-slate-50", text: "text-slate-600", icon: <Clock size={12} /> };

                      return (
                        <div key={att.id} className="relative pl-12 pb-10 group last:pb-0">
                          {/* Timeline Dot */}
                          <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${config.color} text-white`}>
                            {config.icon}
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                  {format(new Date(att.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.text} border shadow-sm`}>
                                  {isReagendado ? 'Reagendada' : config.label}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                <Clock size={12} />
                                {att.sessionTime || 'Horário não informado'}
                              </p>
                            </div>
                            
                            {att.notes && (
                              <div className="max-w-md bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observação</p>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{att.notes}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab (Original) */}
          {activeTab === "timeline" && (
            loadingLinks ? (
              <div className="text-center py-12 text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs">Carregando formulários...</p>
              </div>
            ) : patientShareLinks.length === 0 ? (
              <div className="card p-20 text-center border-dashed border-2">
                <FileText size={48} className="mx-auto text-emerald-200 mb-6" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum registro ainda</h3>
                <p className="text-slate-600 max-w-sm mx-auto">Envie um formulário ou escala para este paciente para começar a construir seu prontuário digital.</p>
                <Link to="/my-forms" className="btn btn-primary mt-8">Ir para Meus Formulários</Link>
              </div>
              ) : (
              <div className="space-y-8">
                {/* Respondidos */}
                {(() => {
                  const answered = patientShareLinks.filter(link => link.response);
                  if (answered.length === 0) return null;
                  
                  return (
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {answered.length === 1 ? 'Respondido' : 'Respondidos'} ({answered.length})
                      </h4>
                      <div className="space-y-4">
                        {answered.map(link => {
                          const response = link.response;
                          const result = scoreTest(null, response.data);
                          
                          return (
                            <div 
                              key={response.id}
                              className="card overflow-hidden group hover:border-emerald-300 transition-all duration-300"
                            >
                              <div className="w-full flex items-center justify-between p-6 min-h-[100px]">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                    <FileText size={22} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">{link.form?.title}</h4>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        Enviado em {new Date(link.createdAt).toLocaleDateString('pt-BR')} · {new Date(link.createdAt).toLocaleTimeString('pt-BR')}
                                      </p>
                                      <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                                        ✓ Respondido
                                      </span>
                                      <p className="text-xs font-bold text-emerald-600">
                                        {new Date(response.createdAt).toLocaleDateString('pt-BR')} · {new Date(response.createdAt).toLocaleTimeString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/responses/${response.id}`}
                                    state={{ fromPatient: true }}
                                    className="btn btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-2"
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
                                    className="btn btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-2"
                                  >
                                    <FileDown size={14} />
                                    PDF
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleResponse(e, response.id);
                                    }}
                                    className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                  >
                                    <ChevronRight
                                      size={22}
                                      className={`text-emerald-400 transition-all duration-300 ${selectedResponseId === response.id ? 'rotate-90 text-slate-900 scale-110' : ''}`}
                                    />
                                  </button>
                                </div>
                              </div>

                              {selectedResponseId === response.id && (
                                <div className="p-6 bg-emerald-50/50 border-t border-emerald-50 max-h-[70vh] overflow-y-auto">
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
                                            <TrendingUp size={18} className="text-slate-900" />
                                            <h5 className="font-bold text-xs uppercase tracking-widest text-slate-900">{result.title}</h5>
                                          </div>
                                          {link.responseCount > 1 && (
                                            <span className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                              v{link.responseCount}
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-6 mb-4">
                                          <div className="text-5xl font-black text-slate-900">{result.score}</div>
                                          <div>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight ${result.color}`}>
                                              {result.severity}
                                            </span>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Score total de {result.maxScore} pontos</p>
                                            {scoreDiff !== null && (
                                              <p className={`text-[10px] font-black mt-1 ${scoreDiff > 0 ? 'text-red-600' : scoreDiff < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
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
                                        
                                        <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-100/50">
                                          <p className="text-sm text-slate-800 leading-relaxed font-medium italic">"{result.interpretation}"</p>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Search Bar */}
                                  <div className="mb-4">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
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

                                  <FormResponsesView schema={response.form?.schema || link.form?.schema} data={response.data} />
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
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Aguardando Resposta ({pending.length})
                      </h4>
                      <div className="space-y-4">
                        {pending.map(link => {
                          const daysRemaining = link.expiresAt ? Math.ceil((new Date(link.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                          
                          return (
                            <div key={link.id} className="card p-6 bg-white border-emerald-100 hover:border-emerald-200 transition-all">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-base text-slate-900 mb-2">{link.form?.title}</h5>
                                  <p className="text-sm text-slate-600 mb-3">
                                    Enviado em {new Date(link.createdAt).toLocaleDateString('pt-BR')} · {new Date(link.createdAt).toLocaleTimeString('pt-BR')}
                                  </p>
                                  
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 rounded-full">
                                      Pendente
                                    </span>
                                    <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                                      Enviado
                                    </span>
                                    {daysRemaining && (
                                      <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="card w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Editar Paciente</h2>
                  <p className="text-xs text-slate-500 mt-1">Atualize os dados do prontuário</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" aria-label="Fechar">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                {[
                  { id: "identity", label: "Identificação", icon: UserCheck },
                  { id: "contact", label: "Contato", icon: Contact },
                  { id: "address", label: "Endereço", icon: MapPin },
                  { id: "notes", label: "Notas", icon: FileText },
                  { id: "settings", label: "Agenda", icon: Calendar },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setEditTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      editTab === tab.id
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="edit-patient-form-record" onSubmit={handleSave} className="space-y-5">
                
                {editTab === "identity" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        {formData.isActive ? (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <UserCheck size={20} className="text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <UserX size={20} className="text-slate-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Status do Paciente</p>
                          <p className="text-xs text-slate-500">{formData.isActive ? "Ativo no acompanhamento" : "Inativo / Arquivado"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${formData.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${formData.isActive ? "left-8" : "left-1"}`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Nome Completo *</label>
                      <input type="text" required className="input text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome social ou completo" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">CPF</label>
                        <input type="text" className="input text-sm" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Nascimento</label>
                        <input type="date" className="input text-sm" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Gênero</label>
                        <select className="input text-sm" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                          <option value="">...</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Não-Binário">Não-Binário</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">RG</label>
                        <input type="text" className="input text-sm" value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} placeholder="Documento" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Estado Civil</label>
                        <select className="input text-sm" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                          <option value="">...</option>
                          <option value="Solteiro(a)">Solteiro(a)</option>
                          <option value="Casado(a)">Casado(a)</option>
                          <option value="União Estável">União Estável</option>
                          <option value="Divorciado(a)">Divorciado(a)</option>
                          <option value="Viúvo(a)">Viúvo(a)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Profissão</label>
                        <input type="text" className="input text-sm" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} placeholder="Cargo/área" />
                      </div>
                    </div>
                  </div>
                )}

                {editTab === "contact" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">E-mail</label>
                      <input type="email" className="input text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Telefone</label>
                        <input type="tel" className="input text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Emergência</label>
                        <input type="tel" className="input text-sm" value={formData.emergencyPhone} onChange={e => setFormData({ ...formData, emergencyPhone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Nome Emergência</label>
                      <input type="text" className="input text-sm" value={formData.emergencyName} onChange={e => setFormData({ ...formData, emergencyName: e.target.value })} placeholder="Contato de emergência" />
                    </div>
                  </div>
                )}

                {editTab === "address" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">CEP</label>
                        <input type="text" className="input text-sm" value={formData.cep} onChange={e => {
                          const formatted = formatCEP(e.target.value);
                          setFormData({ ...formData, cep: formatted });
                          handleCepLookup(formatted);
                        }} placeholder="00000-000" maxLength={9} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Endereço</label>
                        <input type="text" className="input text-sm" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} placeholder="Rua, Avenida..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Número</label>
                        <input type="text" className="input text-sm" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} placeholder="Nº" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Complemento</label>
                        <input type="text" className="input text-sm" value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} placeholder="Apto, Bloco..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Bairro</label>
                        <input type="text" className="input text-sm" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} placeholder="Bairro" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Cidade</label>
                        <input type="text" className="input text-sm" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Cidade" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">UF</label>
                        <input type="text" className="input text-sm" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} placeholder="SP" maxLength={2} />
                      </div>
                    </div>
                  </div>
                )}

                {editTab === "notes" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Observações Clínicas</label>
                      <textarea className="input text-sm min-h-[150px]" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Anotações relevantes sobre o paciente..." />
                    </div>

                    {/* Anexos */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Paperclip size={16} className="text-slate-500" />
                          <h4 className="text-sm font-semibold text-slate-700">Laudos e Anexos</h4>
                        </div>
                        <label className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-all ${uploading ? 'opacity-50' : 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'}`}>
                          {uploading ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus size={14} />
                          )}
                          {uploading ? 'Enviando...' : 'Anexar'}
                          <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={uploading} onChange={handleUploadAttachment} />
                        </label>
                      </div>

                      {loadingAttachments ? (
                        <div className="text-center py-8 text-slate-400">
                          <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-xs">Carregando anexos...</p>
                        </div>
                      ) : attachments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <File size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Nenhum anexo</p>
                          <p className="text-[10px] mt-1">PDF, JPG, PNG, DOC (máx. 10MB)</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {attachments.map((att) => (
                            <div key={att.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2 min-w-0">
                                <File size={16} className="text-slate-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-slate-700 truncate">{att.filename}</p>
                                  <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handleDownloadAttachment(att)} className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition-colors" title="Baixar">
                                  <Download size={14} />
                                </button>
                                <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors" title="Excluir">
                                  <Trash size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {editTab === "settings" && (
                  <div className="space-y-5">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4">Agenda do Paciente</h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Horário Fixo</label>
                            <select
                              className="input text-sm"
                              value={formData.sessionTime}
                              onChange={e => setFormData({ ...formData, sessionTime: e.target.value })}
                            >
                              <option value="">Selecione</option>
                              <option value="07:00">07:00</option>
                              <option value="07:30">07:30</option>
                              <option value="08:00">08:00</option>
                              <option value="08:30">08:30</option>
                              <option value="09:00">09:00</option>
                              <option value="09:30">09:30</option>
                              <option value="10:00">10:00</option>
                              <option value="10:30">10:30</option>
                              <option value="11:00">11:00</option>
                              <option value="11:30">11:30</option>
                              <option value="12:00">12:00</option>
                              <option value="12:30">12:30</option>
                              <option value="13:00">13:00</option>
                              <option value="13:30">13:30</option>
                              <option value="14:00">14:00</option>
                              <option value="14:30">14:30</option>
                              <option value="15:00">15:00</option>
                              <option value="15:30">15:30</option>
                              <option value="16:00">16:00</option>
                              <option value="16:30">16:30</option>
                              <option value="17:00">17:00</option>
                              <option value="17:30">17:30</option>
                              <option value="18:00">18:00</option>
                              <option value="18:30">18:30</option>
                              <option value="19:00">19:00</option>
                              <option value="19:30">19:30</option>
                              <option value="20:00">20:00</option>
                              <option value="20:30">20:30</option>
                              <option value="21:00">21:00</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Duração</label>
                            <select
                              className="input text-sm"
                              value={formData.sessionDuration}
                              onChange={e => setFormData({ ...formData, sessionDuration: e.target.value })}
                            >
                              <option value="30">30 min</option>
                              <option value="45">45 min</option>
                              <option value="50">50 min</option>
                              <option value="60">60 min</option>
                              <option value="90">90 min</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Periodicidade</label>
                          <select
                            className="input text-sm"
                            value={formData.sessionFrequency}
                            onChange={e => setFormData({ ...formData, sessionFrequency: e.target.value })}
                          >
                            <option value="semanal">Semanal</option>
                            <option value="quinzenal">Quinzenal</option>
                            <option value="mensal">Mensal</option>
                            <option value="semanal-2">2x por semana</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Próxima Sessão</label>
                          <input
                            type="date"
                            className="input text-sm"
                            value={formData.nextSession}
                            onChange={e => setFormData({ ...formData, nextSession: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
                <button type="submit" form="edit-patient-form-record" disabled={saving} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/20 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Enviar Formulário para {patient?.name}</h2>
                <p className="text-xs text-slate-600 mt-1">Crie um link para que o paciente preencha o formulário</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-slate-500 hover:text-emerald-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!shareData.formId) {
                alert("Selecione um formulário");
                return;
              }
              if (!shareData.expiresAt) {
                alert("Selecione a validade do link");
                return;
              }
              try {
                const result = await api.createShareLink({
                  formId: shareData.formId,
                  patientId: patient.id,
                  expiresAt: shareData.expiresAt,
                });
                const absoluteUrl = result.shareUrl.startsWith("http")
                  ? result.shareUrl
                  : `${window.location.origin}${result.shareUrl}`;
                await navigator.clipboard.writeText(absoluteUrl);
                const action = result.reused ? "reutilizado" : "criado";
                alert(`Link ${action} e copiado para a área de transferência!`);
                setShowShareModal(false);
                setShareData({ formId: "", expiresAt: "" });
                loadPatientShareLinks();
              } catch (error) {
                alert(error.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">Selecione um Formulário *</label>
                {loadingForms ? (
                  <div className="text-center py-4 text-slate-500">
                    <div className="animate-spin w-4 h-4 border-2 border-emerald-900 border-t-transparent rounded-full mx-auto" />
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
                <label className="block text-sm font-medium text-emerald-700 mb-2">Validade do Link *</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { days: 7, label: "7 dias" },
                    { days: 15, label: "15 dias" },
                    { days: 30, label: "30 dias", recommended: true },
                    { days: 60, label: "60 dias" },
                    { days: 90, label: "90 dias" },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => {
                        const expiresAt = new Date(Date.now() + opt.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        setShareData({ ...shareData, expiresAt });
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        shareData.expiresAt === new Date(Date.now() + opt.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                          ? "bg-emerald-900 text-white shadow-md"
                          : opt.recommended
                          ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {opt.label}
                      {opt.recommended && <span className="ml-1 text-[10px] opacity-70">(Padrão)</span>}
                    </button>
                  ))}
                </div>
                {shareData.expiresAt && (
                  <p className="text-xs text-slate-600 mt-2">
                    Expira em: {new Date(shareData.expiresAt + 'T23:59:59').toLocaleDateString('pt-BR')}
                  </p>
                )}
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
          : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
