import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import { toast } from "../components/Toast";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { KpiCard } from "../components/dashboard/Shared";
import { 
  Plus, 
  Trash2, 
  Phone, 
  ArrowRight,
  UserCheck,
  Calendar,
  AlertCircle,
  X,
  TrendingUp,
  Tag,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const STAGES = [
  { id: "lead", label: "Contato Inicial", color: "slate", bgHeader: "bg-[var(--surface-alt)] text-[var(--text-secondary)]", borderLeft: "border-l-[var(--text-muted)]" },
  { id: "triagem", label: "Triagem Clínica", color: "blue", bgHeader: "bg-[var(--blue-light)] text-[var(--blue)]", borderLeft: "border-l-[var(--blue)]" },
  { id: "scheduled", label: "Primeira Sessão", color: "amber", bgHeader: "bg-[var(--peach-light)] text-[var(--peach)]", borderLeft: "border-l-[var(--peach)]" },
  { id: "active", label: "Paciente Ativo", color: "emerald", bgHeader: "bg-[var(--sage-light)] text-[var(--sage)]", borderLeft: "border-l-[var(--sage)]" }
];

export default function CrmDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState(null);
  const [draggedOverStage, setDraggedOverStage] = useState(null);
  const [mobileStage, setMobileStage] = useState("lead");
  
  // Modais
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activePatientData, setActivePatientData] = useState(null);

  // Form de novo Lead
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    leadSource: "",
    crmNotes: ""
  });

  // Form de Ativação (dados obrigatórios)
  const [activationForm, setActivationForm] = useState({
    cpf: "",
    birthDate: "",
    email: "",
    phone: "",
    emergencyName: "",
    emergencyPhone: ""
  });

  const navigate = useNavigateWithTransition();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      // Filtrar apenas pacientes no funil (não arquivados)
      const funnelPatients = data.filter(p => p.funnelStep !== "archived" && p.isActive);
      setPatients(funnelPatients);
    } catch (error) {
      toast(error.message || "Erro ao carregar dados do CRM", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Drag and Drop
  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    setDraggedOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = async (e, targetStage, overrideId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setDraggedOverStage(null);
    const id = overrideId || (e && e.dataTransfer ? e.dataTransfer.getData("text/plain") : null) || draggedId;
    if (!id) return;

    const patient = patients.find(p => p.id === id);
    if (!patient || patient.funnelStep === targetStage) return;

    // Se mover para active (Ativo), verificar dados obrigatórios
    if (targetStage === "active") {
      const requiredFields = ["cpf", "birthDate", "email", "phone", "emergencyName", "emergencyPhone"];
      const missing = requiredFields.filter(f => !patient[f]);
      
      if (missing.length > 0) {
        // Abre o modal para preenchimento obrigatório
        setActivePatientData(patient);
        setActivationForm({
          cpf: patient.cpf || "",
          birthDate: patient.birthDate ? patient.birthDate.split("T")[0] : "",
          email: patient.email || "",
          phone: patient.phone || "",
          emergencyName: patient.emergencyName || "",
          emergencyPhone: patient.emergencyPhone || ""
        });
        setShowActivationModal(true);
        return;
      }
    }

    try {
      await api.updatePatientFunnel(id, { funnelStep: targetStage });
      setPatients(prev => prev.map(p => p.id === id ? { ...p, funnelStep: targetStage } : p));
      toast("Estágio atualizado com sucesso!", "success", 2000);
    } catch (error) {
      toast(error.message || "Erro ao atualizar estágio", "error");
    }
  };

  // Movimentação rápida de estágios para Mobile
  const handleMoveStage = (patientId, currentStageId, direction) => {
    const currentIndex = STAGES.findIndex(s => s.id === currentStageId);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;
    const targetStage = STAGES[targetIndex].id;
    handleDrop(null, targetStage, patientId);
  };

  // Criar Novo Lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLead.name.trim()) {
      toast("Nome é obrigatório", "error");
      return;
    }

    try {
      const data = {
        name: newLead.name,
        phone: newLead.phone || null,
        leadSource: newLead.leadSource || "Outro",
        crmNotes: newLead.crmNotes || null,
        funnelStep: "lead"
      };

      const created = await api.createPatient(data);
      setPatients(prev => [...prev, created]);
      setShowAddLeadModal(false);
      setNewLead({ name: "", phone: "", leadSource: "", crmNotes: "" });
      toast("Lead adicionado com sucesso!", "success", 2500);
    } catch (error) {
      toast(error.message || "Erro ao criar Lead", "error");
    }
  };

  // Salvar Ativação de Lead
  const handleSaveActivation = async (e) => {
    e.preventDefault();
    
    // Validar CPF básico
    if (activationForm.cpf.replace(/\D/g, "").length !== 11) {
      toast("CPF inválido (deve conter 11 dígitos)", "error");
      return;
    }

    if (!activationForm.birthDate || !activationForm.email || !activationForm.phone || !activationForm.emergencyName || !activationForm.emergencyPhone) {
      toast("Todos os campos de prontuário são obrigatórios para ativação", "error");
      return;
    }

    try {
      const updated = await api.updatePatientFunnel(activePatientData.id, {
        funnelStep: "active",
        cpf: activationForm.cpf,
        birthDate: new Date(activationForm.birthDate).toISOString(),
        email: activationForm.email,
        phone: activationForm.phone,
        emergencyName: activationForm.emergencyName,
        emergencyPhone: activationForm.emergencyPhone
      });

      setPatients(prev => prev.map(p => p.id === activePatientData.id ? updated : p));
      setShowActivationModal(false);
      setActivePatientData(null);
      toast("Paciente ativado com sucesso!", "success", 2500);
    } catch (error) {
      toast(error.message || "Erro ao ativar paciente", "error");
    }
  };

  // Excluir ou Arquivar Lead do CRM
  const handleArchivePatient = async (id) => {
    if (!confirm("Deseja arquivar este contato? Ele sairá do funil de captação.")) return;
    try {
      await api.updatePatientFunnel(id, { funnelStep: "archived" });
      setPatients(prev => prev.filter(p => p.id !== id));
      toast("Contato arquivado com sucesso", "success");
    } catch (error) {
      toast(error.message || "Erro ao arquivar contato", "error");
    }
  };

  // Métricas do Funil
  const totalLeads = patients.length;
  const activeCount = patients.filter(p => p.funnelStep === "active").length;
  const conversionRate = totalLeads > 0 ? ((activeCount / totalLeads) * 100).toFixed(0) : 0;

  // Renderizador de Card de Paciente
  const renderPatientCard = (patient, stage) => {
    const stageIndex = STAGES.findIndex(s => s.id === stage.id);

    return (
      <div
        key={patient.id}
        draggable
        onDragStart={(e) => handleDragStart(e, patient.id)}
        className={`bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col gap-3 border-l-4 ${stage.borderLeft}`}
      >
        {/* Info Principal */}
        <div className="flex justify-between items-start gap-2">
          <span 
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--sage)] transition-colors cursor-pointer truncate"
          >
            {patient.name}
          </span>
          <button
            onClick={() => handleArchivePatient(patient.id)}
            className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1 rounded-md hover:bg-[var(--surface-alt)]"
            title="Arquivar lead"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Metadados */}
        <div className="flex flex-col gap-1.5 text-[11px] text-[var(--text-secondary)] font-medium">
          {patient.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-[var(--text-muted)] shrink-0" />
              <span>{patient.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[var(--text-muted)] shrink-0" />
            <span>Entrou em: {new Date(patient.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        {/* Tags e Rodapé do Card */}
        <div className="flex justify-between items-center pt-2.5 border-t border-[var(--border)] mt-0.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--border)]/50">
            {patient.leadSource || "Sem Origem"}
          </span>

          {/* Botões de Mover Rápido (Visível em Mobile) + Link do Prontuário */}
          <div className="flex items-center gap-1">
            {/* Voltar Etapa (Mobile) */}
            {stageIndex > 0 && (
              <button
                onClick={() => handleMoveStage(patient.id, stage.id, -1)}
                className="md:hidden p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] border border-[var(--border)]"
                title={`Recuar para ${STAGES[stageIndex - 1].label}`}
              >
                <ChevronLeft size={13} />
              </button>
            )}

            {/* Avançar Etapa (Mobile) */}
            {stageIndex < STAGES.length - 1 && (
              <button
                onClick={() => handleMoveStage(patient.id, stage.id, 1)}
                className="md:hidden p-1 rounded-md text-[var(--sage)] hover:bg-[var(--sage-light)] border border-[var(--border)] flex items-center gap-0.5 text-[10px] font-bold px-1.5"
                title={`Avançar para ${STAGES[stageIndex + 1].label}`}
              >
                <span>Avançar</span>
                <ChevronRight size={13} />
              </button>
            )}

            <button
              onClick={() => navigate(`/patients/${patient.id}`)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] items-center gap-1 font-semibold hidden sm:flex"
            >
              Prontuário
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4 px-2 sm:px-4 py-2">
      
      {/* Toolbar */}
      <div className="flex justify-between sm:justify-end items-center gap-4 shrink-0">
        <h2 className="sm:hidden text-lg font-bold text-[var(--text-primary)] font-brand">Funil CRM</h2>
        <button 
          onClick={() => setShowAddLeadModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[var(--sage)] hover:opacity-95 text-white font-bold text-xs transition-all outline-none shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          Novo Lead (Contato)
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
        <KpiCard compact icon={<Tag size={14} />} iconBg="var(--surface-alt)" iconColor="var(--text-secondary)" label="No Funil" value={totalLeads} />
        <KpiCard compact icon={<UserCheck size={14} />} iconBg="var(--status-presente-bg)" iconColor="var(--status-presente-text)" label="Ativos" value={activeCount} />
        <KpiCard compact icon={<TrendingUp size={14} />} iconBg="var(--sage-light)" iconColor="var(--sage)" label="Conversão" value={`${conversionRate}%`} />
      </div>

      {/* Mobile Stage Selector (Segmented Control Abas) */}
      <div className="md:hidden flex overflow-x-auto gap-1.5 p-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[14px] shrink-0 hide-scrollbar">
        {STAGES.map(stage => {
          const count = patients.filter(p => p.funnelStep === stage.id).length;
          const isActive = mobileStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setMobileStage(stage.id)}
              className={`flex-1 min-w-[105px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <span>{stage.label}</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                isActive ? "bg-[var(--sage-light)] text-[var(--sage)] font-extrabold" : "bg-[var(--surface-alt)] text-[var(--text-muted)]"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Container Mobile (Visualização por Etapa Selecionada) */}
      <div className="md:hidden flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {(() => {
          const currentStage = STAGES.find(s => s.id === mobileStage);
          const stagePatients = patients.filter(p => p.funnelStep === mobileStage);

          return (
            <div className="flex flex-col min-h-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-alt)]/35 overflow-hidden">
              <div className={`p-3.5 border-b border-[var(--border)] flex justify-between items-center ${currentStage.bgHeader}`}>
                <span className="text-xs font-black uppercase tracking-wider">{currentStage.label}</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--surface)] shadow-sm border border-[var(--border)]/50 text-[var(--text-primary)]">
                  {stagePatients.length} contatos
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {stagePatients.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface)]/40 rounded-xl text-xs text-[var(--text-muted)] font-medium gap-1 text-center p-4">
                    <span>Nenhum contato nesta etapa</span>
                    <span className="text-[10px] opacity-75">Novos leads adicionados aparecerão aqui.</span>
                  </div>
                ) : (
                  stagePatients.map(patient => renderPatientCard(patient, currentStage))
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Container Desktop (Kanban Board 4 Colunas) */}
      <div className="hidden md:flex flex-1 min-h-0 overflow-x-auto pb-2">
        <div className="grid grid-cols-4 gap-4 h-full w-full min-h-[450px]">
          {STAGES.map(stage => {
            const stagePatients = patients.filter(p => p.funnelStep === stage.id);
            const isOver = draggedOverStage === stage.id;
            
            return (
              <div 
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`flex flex-col min-h-0 rounded-[16px] border border-[var(--border)] transition-colors duration-200 ${
                  isOver ? "bg-[var(--surface-alt)] border-dashed border-[var(--text-muted)]" : "bg-[var(--surface-alt)]/35"
                }`}
              >
                {/* Header da Coluna */}
                <div className={`p-4 rounded-t-[16px] border-b border-[var(--border)] flex justify-between items-center ${stage.bgHeader}`}>
                  <span className="text-xs font-black uppercase tracking-wider">{stage.label}</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--surface)] shadow-sm border border-[var(--border)]/50 text-[var(--text-primary)]">
                    {stagePatients.length}
                  </span>
                </div>

                {/* Lista de Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 hide-scrollbar">
                  {stagePatients.length === 0 ? (
                    <div className="h-24 flex items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface)]/40 rounded-xl text-xs text-[var(--text-muted)] font-medium">
                      Sem contatos nesta etapa
                    </div>
                  ) : (
                    stagePatients.map(patient => renderPatientCard(patient, stage))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Adicionar Lead Simplificado */}
      {showAddLeadModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[calc(65px+env(safe-area-inset-bottom)+16px)] sm:pb-4 bg-black/40 backdrop-blur-[3px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-tight">Adicionar Novo Lead</h3>
              <button 
                onClick={() => setShowAddLeadModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateLead} className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 hide-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={newLead.name}
                  onChange={e => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                  placeholder="Nome do contato preliminar"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">WhatsApp / Telefone</label>
                <input 
                  type="text" 
                  value={newLead.phone}
                  onChange={e => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Origem da Captação</label>
                <select 
                  value={newLead.leadSource}
                  onChange={e => setNewLead(prev => ({ ...prev, leadSource: e.target.value }))}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Google">Google / Maps</option>
                  <option value="Indicação">Indicação de Colega/Paciente</option>
                  <option value="Doctoralia">Doctoralia</option>
                  <option value="Outro">Outro Canal</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Notas de Contato</label>
                <textarea 
                  value={newLead.crmNotes}
                  onChange={e => setNewLead(prev => ({ ...prev, crmNotes: e.target.value }))}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium h-20 resize-none"
                  placeholder="Queixas iniciais, valores combinados, etc."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)] shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2.5 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all outline-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none shadow-sm cursor-pointer"
                >
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Modal 2: Ativação Obrigatória de Lead para Paciente Ativo */}
      {showActivationModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[calc(65px+env(safe-area-inset-bottom)+16px)] sm:pb-4 bg-black/40 backdrop-blur-[3px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-[var(--sage)]">
                <UserCheck size={18} />
                <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-tight">Concluir Ativação</h3>
              </div>
              <button 
                onClick={() => {
                  setShowActivationModal(false);
                  setActivePatientData(null);
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="px-5 py-3 bg-[var(--sage-light)] border-b border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2 shrink-0">
              <AlertCircle size={15} className="text-[var(--sage)] shrink-0 mt-0.5" />
              <span>
                Para mover <strong>{activePatientData?.name}</strong> para Paciente Ativo, a ética clínica e o sistema exigem o preenchimento dos dados obrigatórios de prontuário abaixo.
              </span>
            </div>

            <form onSubmit={handleSaveActivation} className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 hide-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">CPF *</label>
                  <input 
                    type="text" 
                    required
                    value={activationForm.cpf}
                    onChange={e => setActivationForm(prev => ({ ...prev, cpf: e.target.value }))}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Data de Nascimento *</label>
                  <input 
                    type="date" 
                    required
                    value={activationForm.birthDate}
                    onChange={e => setActivationForm(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">E-mail *</label>
                  <input 
                    type="email" 
                    required
                    value={activationForm.email}
                    onChange={e => setActivationForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                    placeholder="paciente@provedor.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Telefone / WhatsApp *</label>
                  <input 
                    type="text" 
                    required
                    value={activationForm.phone}
                    onChange={e => setActivationForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                    placeholder="(00) 90000-0000"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2.5">Contato de Emergência</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nome do Contato *</label>
                    <input 
                      type="text" 
                      required
                      value={activationForm.emergencyName}
                      onChange={e => setActivationForm(prev => ({ ...prev, emergencyName: e.target.value }))}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                      placeholder="Nome do familiar ou responsável"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Telefone de Emergência *</label>
                    <input 
                      type="text" 
                      required
                      value={activationForm.emergencyPhone}
                      onChange={e => setActivationForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                      placeholder="(00) 90000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)] shrink-0">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowActivationModal(false);
                    setActivePatientData(null);
                  }}
                  className="px-4 py-2.5 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all outline-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none shadow-sm cursor-pointer"
                >
                  Concluir e Ativar
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

    </div>
  );
}
