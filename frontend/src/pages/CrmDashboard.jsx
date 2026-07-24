import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  Search,
  Filter,
  MessageCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Clock,
  Sparkles
} from "lucide-react";

const STAGES = [
  { id: "lead", label: "Contato Inicial", color: "#64748B", bgHeader: "bg-[var(--surface-alt)] text-[var(--text-primary)]", borderTop: "border-t-[#64748B]", badgeBg: "bg-[var(--surface-alt)] text-[var(--text-secondary)]" },
  { id: "triagem", label: "Triagem Clínica", color: "#2E7DFF", bgHeader: "bg-[var(--blue-light)] text-[var(--blue)]", borderTop: "border-t-[var(--blue)]", badgeBg: "bg-[var(--blue-light)] text-[var(--blue)]" },
  { id: "scheduled", label: "Primeira Sessão", color: "#F8A26B", bgHeader: "bg-[var(--peach-light)] text-[var(--peach)]", borderTop: "border-t-[var(--peach)]", badgeBg: "bg-[var(--peach-light)] text-[var(--peach)]" },
  { id: "active", label: "Paciente Ativo", color: "#5CBF90", bgHeader: "bg-[var(--sage-light)] text-[var(--sage)]", borderTop: "border-t-[var(--sage)]", badgeBg: "bg-[var(--sage-light)] text-[var(--sage)]" }
];

// Helper para pegar iniciais do nome
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join("");
}

// Componente de Card Arrastável do dnd-kit
function SortablePatientCard({ patient, stage, onMoveStage, onArchive, onNavigate, onOpenDetail }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: patient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const stageIndex = STAGES.findIndex(s => s.id === stage.id);
  const cleanPhone = (patient.phone || "").replace(/\D/g, "");
  const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 relative group"
    >
      {/* Top Bar do Card: Drag Handle + Nome + Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Grip Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-[var(--surface-alt)] touch-none shrink-0"
            title="Arrastar contato"
          >
            <GripVertical size={15} />
          </button>

          {/* Avatar Monograma */}
          <div className="w-8 h-8 rounded-full bg-[var(--sage-light)] text-[var(--sage)] font-extrabold text-xs flex items-center justify-center shrink-0 border border-[var(--sage)]/20">
            {getInitials(patient.name)}
          </div>

          {/* Nome do Patient */}
          <div className="min-w-0 flex-1">
            <span
              onClick={() => onOpenDetail(patient)}
              className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--sage)] transition-colors cursor-pointer truncate block"
            >
              {patient.name}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium flex items-center gap-1">
              <Clock size={10} />
              {new Date(patient.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>

        {/* Lixeira / Arquivar */}
        <button
          onClick={() => onArchive(patient.id)}
          className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1 rounded-md hover:bg-[var(--surface-alt)] shrink-0"
          title="Arquivar lead"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Observação rápida do Lead (se houver) */}
      {patient.crmNotes && (
        <div className="bg-[var(--surface-alt)]/60 rounded-[10px] p-2 text-[11px] text-[var(--text-secondary)] italic font-medium line-clamp-2 border border-[var(--border)]/40">
          "{patient.crmNotes}"
        </div>
      )}

      {/* Rodapé do Card: Origem + Ação WhatsApp + Transição */}
      <div className="flex justify-between items-center pt-2.5 border-t border-[var(--border)] mt-0.5">
        {/* Badge da Origem */}
        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--border)]/50">
          {patient.leadSource || "Origem N/A"}
        </span>

        {/* Grupo de Ações Rápidas */}
        <div className="flex items-center gap-1.5">
          {/* Botão do WhatsApp Direct */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-all border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center"
              title="Abrir WhatsApp"
            >
              <MessageCircle size={13} />
            </a>
          )}

          {/* Voltar Etapa (Mobile & Web) */}
          {stageIndex > 0 && (
            <button
              onClick={() => onMoveStage(patient.id, stage.id, -1)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] border border-[var(--border)]"
              title={`Recuar para ${STAGES[stageIndex - 1].label}`}
            >
              <ChevronLeft size={13} />
            </button>
          )}

          {/* Avançar Etapa (Mobile & Web) */}
          {stageIndex < STAGES.length - 1 && (
            <button
              onClick={() => onMoveStage(patient.id, stage.id, 1)}
              className="p-1 rounded-md text-[var(--sage)] hover:bg-[var(--sage-light)] border border-[var(--border)] flex items-center gap-0.5 text-[10px] font-bold px-1.5"
              title={`Avançar para ${STAGES[stageIndex + 1].label}`}
            >
              <span className="hidden sm:inline">Avançar</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Overlay Estático para o arraste (DragOverlay)
function StaticPatientCardOverlay({ patient, stage }) {
  if (!patient || !stage) return null;
  return (
    <div className={`bg-[var(--surface)] border-2 border-[var(--sage)] rounded-[16px] p-4 shadow-2xl flex flex-col gap-3 border-t-4 ${stage.borderTop} opacity-95 scale-105 pointer-events-none w-[280px]`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--sage-light)] text-[var(--sage)] font-extrabold text-xs flex items-center justify-center">
          {getInitials(patient.name)}
        </div>
        <span className="text-sm font-bold text-[var(--text-primary)] truncate">
          {patient.name}
        </span>
      </div>
      <div className="text-[11px] text-[var(--text-secondary)] font-medium">
        {patient.phone || "Sem telefone"}
      </div>
      <div className="pt-2 border-t border-[var(--border)]">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[var(--surface-alt)] text-[var(--text-secondary)]">
          {patient.leadSource || "Origem N/A"}
        </span>
      </div>
    </div>
  );
}

export default function CrmDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDragId, setActiveDragId] = useState(null);
  const [mobileStage, setMobileStage] = useState("lead");

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Modais
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [targetStageForAdd, setTargetStageForAdd] = useState("lead");
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activePatientData, setActivePatientData] = useState(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);

  // Form de novo Lead
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    leadSource: "",
    crmNotes: ""
  });

  // Form de Ativação
  const [activationForm, setActivationForm] = useState({
    cpf: "",
    birthDate: "",
    email: "",
    phone: "",
    emergencyName: "",
    emergencyPhone: ""
  });

  const navigate = useNavigateWithTransition();

  // Sensores do dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
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

  // Pacientes filtrados
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchQuery = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone && p.phone.includes(searchQuery)) ||
        (p.crmNotes && p.crmNotes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSource = sourceFilter === "all" || (p.leadSource || "Outro") === sourceFilter;

      return matchQuery && matchSource;
    });
  }, [patients, searchQuery, sourceFilter]);

  // Handlers de Arraste
  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const patientId = active.id;
    let targetStage = over.id;

    const targetPatient = patients.find(p => p.id === over.id);
    if (targetPatient) {
      targetStage = targetPatient.funnelStep;
    }

    const patient = patients.find(p => p.id === patientId);
    if (!patient || patient.funnelStep === targetStage) return;

    if (targetStage === "active") {
      const requiredFields = ["cpf", "birthDate", "email", "phone", "emergencyName", "emergencyPhone"];
      const missing = requiredFields.filter(f => !patient[f]);

      if (missing.length > 0) {
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
      await api.updatePatientFunnel(patientId, { funnelStep: targetStage });
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, funnelStep: targetStage } : p));
      toast("Estágio atualizado com sucesso!", "success", 2000);
    } catch (error) {
      toast(error.message || "Erro ao atualizar estágio", "error");
    }
  };

  // Movimentação Rápida
  const handleMoveStage = async (patientId, currentStageId, direction) => {
    const currentIndex = STAGES.findIndex(s => s.id === currentStageId);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;
    const targetStage = STAGES[targetIndex].id;

    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    if (targetStage === "active") {
      const requiredFields = ["cpf", "birthDate", "email", "phone", "emergencyName", "emergencyPhone"];
      const missing = requiredFields.filter(f => !patient[f]);

      if (missing.length > 0) {
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
      await api.updatePatientFunnel(patientId, { funnelStep: targetStage });
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, funnelStep: targetStage } : p));
      toast("Estágio atualizado com sucesso!", "success", 2000);
    } catch (error) {
      toast(error.message || "Erro ao atualizar estágio", "error");
    }
  };

  // Criar Lead
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
        funnelStep: targetStageForAdd
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

  // Salvar Ativação
  const handleSaveActivation = async (e) => {
    e.preventDefault();

    if (activationForm.cpf.replace(/\D/g, "").length !== 11) {
      toast("CPF inválido (deve conter 11 dígitos)", "error");
      return;
    }

    if (!activationForm.birthDate || !activationForm.email || !activationForm.phone || !activationForm.emergencyName || !activationForm.emergencyPhone) {
      toast("Todos os campos são obrigatórios para ativação", "error");
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

  // Arquivar
  const handleArchivePatient = async (id) => {
    if (!confirm("Deseja arquivar este contato? Ele sairá do funil de captação.")) return;
    try {
      await api.updatePatientFunnel(id, { funnelStep: "archived" });
      setPatients(prev => prev.filter(p => p.id !== id));
      if (selectedPatientDetail?.id === id) setSelectedPatientDetail(null);
      toast("Contato arquivado com sucesso", "success");
    } catch (error) {
      toast(error.message || "Erro ao arquivar contato", "error");
    }
  };

  // Métricas
  const totalLeads = patients.length;
  const activeCount = patients.filter(p => p.funnelStep === "active").length;
  const conversionRate = totalLeads > 0 ? ((activeCount / totalLeads) * 100).toFixed(0) : 0;
  const leadCount = patients.filter(p => p.funnelStep === "lead").length;

  const activePatientForOverlay = patients.find(p => p.id === activeDragId);
  const activeStageForOverlay = activePatientForOverlay ? STAGES.find(s => s.id === activePatientForOverlay.funnelStep) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full min-h-0 space-y-4 px-2 sm:px-4 py-2">
        
        {/* Header Principal & Controles de Filtro */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-brand flex items-center gap-2">
              Funil de Captação & CRM
              <Sparkles size={18} className="text-[var(--sage)]" />
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Gerencie a jornada de prospecção, triagem e acolhimento dos seus novos pacientes.
            </p>
          </div>

          <button 
            onClick={() => {
              setTargetStageForAdd("lead");
              setShowAddLeadModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[var(--sage)] hover:bg-[var(--dark-green)] text-white font-bold text-xs transition-all outline-none shadow-sm cursor-pointer w-full sm:w-auto justify-center"
          >
            <Plus size={16} />
            Novo Lead (Contato)
          </button>
        </div>

        {/* Toolbar de Pesquisa & Filtros de Origem */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 bg-[var(--surface)] border border-[var(--border)] p-2.5 rounded-[16px] shadow-sm">
          {/* Input de Pesquisa */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, telefone ou observações..."
              className="w-full pl-9 pr-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[10px] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] font-medium transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Select de Filtro de Origem */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="relative w-full sm:w-48">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[10px] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--sage)] font-medium cursor-pointer"
              >
                <option value="all">Todas as Origens</option>
                <option value="Instagram">Instagram</option>
                <option value="Google">Google / Maps</option>
                <option value="Indicação">Indicação</option>
                <option value="Doctoralia">Doctoralia</option>
                <option value="Outro">Outro Canal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Métricas do CRM (KPI Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 shrink-0">
          <KpiCard compact icon={<Tag size={14} />} iconBg="var(--surface-alt)" iconColor="var(--text-secondary)" label="No Funil" value={totalLeads} />
          <KpiCard compact icon={<Phone size={14} />} iconBg="var(--peach-light)" iconColor="var(--peach)" label="Contato Inicial" value={leadCount} />
          <KpiCard compact icon={<UserCheck size={14} />} iconBg="var(--status-presente-bg)" iconColor="var(--status-presente-text)" label="Convertidos em Ativos" value={activeCount} />
          <KpiCard compact icon={<TrendingUp size={14} />} iconBg="var(--sage-light)" iconColor="var(--sage)" label="Taxa de Conversão" value={`${conversionRate}%`} />
        </div>

        {/* Mobile Stage Selector (Segmented Tabs) */}
        <div className="md:hidden flex overflow-x-auto gap-1.5 p-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[14px] shrink-0 hide-scrollbar">
          {STAGES.map(stage => {
            const count = filteredPatients.filter(p => p.funnelStep === stage.id).length;
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
            const stagePatients = filteredPatients.filter(p => p.funnelStep === mobileStage);

            return (
              <div className="flex flex-col min-h-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-alt)]/35 overflow-hidden">
                <div className={`p-3.5 border-b border-[var(--border)] flex justify-between items-center ${currentStage.bgHeader}`}>
                  <span className="text-xs font-black uppercase tracking-wider">{currentStage.label}</span>
                  <button
                    onClick={() => {
                      setTargetStageForAdd(currentStage.id);
                      setShowAddLeadModal(true);
                    }}
                    className="p-1 rounded bg-[var(--surface)] shadow-sm border border-[var(--border)]/50 text-[var(--text-primary)] hover:text-[var(--sage)] transition-colors"
                    title={`Adicionar lead em ${currentStage.label}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  <SortableContext items={stagePatients.map(p => p.id)} strategy={rectSortingStrategy}>
                    {stagePatients.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface)]/40 rounded-xl text-xs text-[var(--text-muted)] font-medium gap-1 text-center p-4">
                        <span>Nenhum contato nesta etapa</span>
                        <span className="text-[10px] opacity-75">Novos leads adicionados aparecerão aqui.</span>
                      </div>
                    ) : (
                      stagePatients.map(patient => (
                        <SortablePatientCard
                          key={patient.id}
                          patient={patient}
                          stage={currentStage}
                          onMoveStage={handleMoveStage}
                          onArchive={handleArchivePatient}
                          onNavigate={navigate}
                          onOpenDetail={setSelectedPatientDetail}
                        />
                      ))
                    )}
                  </SortableContext>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Container Desktop (Kanban Board 4 Colunas com dnd-kit) */}
        <div className="hidden md:flex flex-1 min-h-0 overflow-x-auto pb-2">
          <div className="grid grid-cols-4 gap-4 h-full w-full min-h-[450px]">
            {STAGES.map(stage => {
              const stagePatients = filteredPatients.filter(p => p.funnelStep === stage.id);

              return (
                <div 
                  key={stage.id}
                  id={stage.id}
                  className={`flex flex-col min-h-0 rounded-[16px] border border-[var(--border)] bg-[var(--surface-alt)]/30 border-t-4 ${stage.borderTop} transition-colors duration-200`}
                >
                  {/* Header da Coluna com Ação Rápida de Criar Lead na Coluna */}
                  <div className={`p-3.5 rounded-t-[12px] border-b border-[var(--border)] flex justify-between items-center ${stage.bgHeader}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider">{stage.label}</span>
                      <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-[var(--surface)] shadow-sm border border-[var(--border)]/50 text-[var(--text-primary)]">
                        {stagePatients.length}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setTargetStageForAdd(stage.id);
                        setShowAddLeadModal(true);
                      }}
                      className="p-1 rounded bg-[var(--surface)]/80 hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--sage)] transition-all shadow-sm border border-[var(--border)]/50 cursor-pointer"
                      title={`Adicionar em ${stage.label}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Lista de Cards da Coluna */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 hide-scrollbar">
                    <SortableContext items={stagePatients.map(p => p.id)} strategy={rectSortingStrategy}>
                      {stagePatients.length === 0 ? (
                        <div className="h-28 flex flex-col items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface)]/40 rounded-xl text-xs text-[var(--text-muted)] font-medium gap-1 text-center p-3">
                          <span>Sem contatos</span>
                          <button
                            onClick={() => {
                              setTargetStageForAdd(stage.id);
                              setShowAddLeadModal(true);
                            }}
                            className="mt-1 text-[10px] text-[var(--sage)] font-bold hover:underline flex items-center gap-1"
                          >
                            <Plus size={11} />
                            Adicionar Lead
                          </button>
                        </div>
                      ) : (
                        stagePatients.map(patient => (
                          <SortablePatientCard
                            key={patient.id}
                            patient={patient}
                            stage={stage}
                            onMoveStage={handleMoveStage}
                            onArchive={handleArchivePatient}
                            onNavigate={navigate}
                            onOpenDetail={setSelectedPatientDetail}
                          />
                        ))
                      )}
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay para Efeito Flutuante de Arraste */}
        <DragOverlay>
          {activeDragId ? (
            <StaticPatientCardOverlay
              patient={activePatientForOverlay}
              stage={activeStageForOverlay}
            />
          ) : null}
        </DragOverlay>

        {/* Modal Slide-over: Detalhes e Notas do Lead */}
        {selectedPatientDetail && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/40 backdrop-blur-[3px] p-0 sm:p-4">
            <div className="bg-[var(--surface)] border-l sm:border border-[var(--border)] sm:rounded-[24px] shadow-2xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] animate-scale-in overflow-hidden flex flex-col">
              {/* Header do Drawer */}
              <div className="p-5 border-b border-[var(--border)] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--sage-light)] text-[var(--sage)] font-extrabold text-sm flex items-center justify-center border border-[var(--sage)]/20">
                    {getInitials(selectedPatientDetail.name)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedPatientDetail.name}</h3>
                    <span className="text-xs text-[var(--text-muted)] font-medium">Ficha do Lead no CRM</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPatientDetail(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Conteúdo do Lead */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 hide-scrollbar">
                <div className="p-3.5 bg-[var(--surface-alt)] rounded-[14px] border border-[var(--border)] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-muted)] font-semibold">Estágio Atual:</span>
                    <span className="font-bold text-[var(--sage)] uppercase text-[11px]">
                      {STAGES.find(s => s.id === selectedPatientDetail.funnelStep)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-muted)] font-semibold">Origem:</span>
                    <span className="font-bold text-[var(--text-primary)] text-[11px]">
                      {selectedPatientDetail.leadSource || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-muted)] font-semibold">Telefone:</span>
                    <span className="font-bold text-[var(--text-primary)] text-[11px]">
                      {selectedPatientDetail.phone || "Não informado"}
                    </span>
                  </div>
                </div>

                {/* Notas de Contato */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1">
                    <FileText size={12} />
                    Observações de Contato
                  </label>
                  <div className="p-3.5 bg-[var(--surface-alt)]/50 border border-[var(--border)] rounded-[14px] text-xs text-[var(--text-primary)] min-h-[90px] whitespace-pre-wrap font-medium">
                    {selectedPatientDetail.crmNotes || "Nenhuma observação registrada ainda."}
                  </div>
                </div>

                {/* Ação Principal: Abrir Prontuário Completo */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const id = selectedPatientDetail.id;
                      setSelectedPatientDetail(null);
                      navigate(`/patients/${id}`);
                    }}
                    className="w-full py-3 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Abrir Prontuário Clínico</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        , document.body)}

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

        {/* Modal 2: Ativação Obrigatória */}
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
    </DndContext>
  );
}
