import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../lib/api";
import { formatPhone } from "../lib/utils";
import { toast } from "../components/Toast";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { getAvatarProps } from "../components/dashboard/Shared";
import RichTextEditor from "../components/RichTextEditor";
import { 
  Plus, 
  Trash2, 
  Phone, 
  UserCheck,
  Calendar,
  AlertCircle,
  X,
  Tag,
  Search,
  MessageCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Clock,
  Kanban,
  List,
  Filter,
  Check
} from "lucide-react";

const STAGES = [
  { id: "lead", label: "Contato Inicial", step: "1º", dotBg: "bg-slate-400 dark:bg-slate-500" },
  { id: "triagem", label: "Triagem Clínica", step: "2º", dotBg: "bg-blue-500" },
  { id: "scheduled", label: "Primeira Sessão", step: "3º", dotBg: "bg-amber-500" },
  { id: "active", label: "Paciente Ativo", step: "4º", dotBg: "bg-[var(--sage)]" }
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join("");
}

// Componente de Coluna Kanban Soltável (Droppable)
function DroppableKanbanColumn({ stage, stagePatients, onMoveStage, onReorderVertical, onArchive, onNavigate, onOpenDetail, onAddLead }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div 
      ref={setNodeRef}
      id={stage.id}
      className={`flex flex-col min-h-0 rounded-[20px] border transition-all duration-200 overflow-hidden ${
        isOver 
          ? "border-[var(--sage)] bg-[var(--sage-light)]/20 ring-2 ring-[var(--sage)]/30" 
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      {/* Header Neutro da Coluna */}
      <div className="p-3.5 bg-[var(--surface-alt)] border-b border-[var(--border)] flex justify-between items-center text-[var(--text-primary)] shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${stage.dotBg}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            <span className="text-[var(--text-muted)] font-extrabold mr-1">{stage.step}</span>
            {stage.label}
          </span>
        </div>
        <span className="px-2 py-0.5 text-xs font-extrabold rounded-[8px] bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]/50">
          {stagePatients.length}
        </span>
        
        <button
          onClick={() => onAddLead(stage.id)}
          className="p-1 rounded bg-[var(--surface)] hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:text-[var(--sage)] transition-all shadow-sm border border-[var(--border)]/50 cursor-pointer"
          title={`Adicionar em ${stage.label}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Lista de Cards (Área ATRÁS dos leads — Idêntico ao Container do Modo Card de Pacientes) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[350px] bg-[var(--surface)] hide-scrollbar">
        <SortableContext items={stagePatients.map(p => p.id)} strategy={rectSortingStrategy}>
          {stagePatients.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface-alt)]/50 rounded-xl text-xs text-[var(--text-muted)] font-medium gap-1 text-center p-3">
              <span>Sem contatos</span>
              <button
                onClick={() => onAddLead(stage.id)}
                className="mt-1 text-[10px] text-[var(--sage)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
                onMoveStage={onMoveStage}
                onReorderVertical={onReorderVertical}
                onArchive={onArchive}
                onNavigate={onNavigate}
                onOpenDetail={onOpenDetail}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// Componente de Card Arrastável com a mesma essência do Card de Pacientes
function SortablePatientCard({ patient, stage, onMoveStage, onReorderVertical, onArchive, onNavigate, onOpenDetail }) {
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
  const { initials, color: avatarColor } = getAvatarProps(patient.name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[var(--bg)] border border-[var(--border)] rounded-[20px] p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 relative group cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {/* Header com Avatar Squircle idêntico ao de Pacientes */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div 
            className="w-10 h-10 rounded-[14px] flex items-center justify-center font-extrabold text-sm shrink-0 border border-[var(--border)] shadow-xs transition-colors"
            style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={(e) => { e.stopPropagation(); onOpenDetail(patient); }}
              className="font-inter text-[14px] font-bold text-[var(--text-primary)] hover:text-[var(--sage)] transition-colors cursor-pointer truncate leading-snug"
              title={patient.name}
            >
              {patient.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} />
                {new Date(patient.createdAt).toLocaleDateString("pt-BR")}
              </span>
              {patient.leadSource && (
                <>
                  <span className="text-[10px] text-[var(--text-muted)]">•</span>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                    {patient.leadSource}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onArchive(patient.id); }}
          className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1.5 rounded-[10px] hover:bg-[var(--surface)] shrink-0 cursor-pointer"
          title="Arquivar lead"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Observações / Notas do CRM */}
      {patient.crmNotes && (
        <div className="bg-[var(--surface)] rounded-[12px] p-2.5 text-[11px] text-[var(--text-secondary)] italic font-medium line-clamp-2 border border-[var(--border)]">
          "{patient.crmNotes}"
        </div>
      )}

      {/* Rodapé com Ações de Reordenação e Avanço */}
      <div className="flex justify-between items-center pt-2.5 border-t border-[var(--border)] mt-0.5">
        
        {/* Esquerda: WhatsApp (Padrão Oficial) */}
        <div onClick={(e) => e.stopPropagation()}>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-[10px] bg-[var(--surface)] hover:bg-[var(--surface-alt)] border border-[var(--border)] transition-all shadow-xs"
              title="Abrir conversa no WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="#25D366" className="shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">Contato</span>
            </a>
          ) : (
            <div className="w-[84px]"></div>
          )}
        </div>

        {/* Direita: Controles de Movimentação Unificados (D-Pad Style) */}
        <div className="flex items-center gap-0.5 bg-[var(--surface)] p-0.5 rounded-[10px] border border-[var(--border)] shadow-xs" onClick={(e) => e.stopPropagation()}>
          {stageIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveStage(patient.id, stage.id, -1); }}
              className="p-1 rounded-[6px] hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={`Recuar para ${STAGES[stageIndex - 1].label}`}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onReorderVertical(patient.id, -1); }}
            className="p-1 rounded-[6px] hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Mover para cima"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReorderVertical(patient.id, 1); }}
            className="p-1 rounded-[6px] hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Mover para baixo"
          >
            <ChevronDown size={14} />
          </button>
          {stageIndex < STAGES.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveStage(patient.id, stage.id, 1); }}
              className="p-1 rounded-[6px] hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={`Avançar para ${STAGES[stageIndex + 1].label}`}
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StaticPatientCardOverlay({ patient, stage }) {
  if (!patient || !stage) return null;
  return (
    <div className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-[16px] p-4 shadow-2xl flex flex-col gap-3 opacity-95 scale-105 pointer-events-none w-[280px]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--surface-alt)] text-[var(--text-secondary)] font-extrabold text-xs flex items-center justify-center border border-[var(--border)]">
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

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("crm_view_mode") || "kanban";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [targetStageForAdd, setTargetStageForAdd] = useState("lead");
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activePatientData, setActivePatientData] = useState(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
  const [editingLead, setEditingLead] = useState(null);

  const searchInputRef = useRef(null);

  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    leadSource: "",
    crmNotes: ""
  });

  const [activationForm, setActivationForm] = useState({
    cpf: "",
    birthDate: "",
    email: "",
    phone: "",
    emergencyName: "",
    emergencyPhone: ""
  });

  const navigate = useNavigateWithTransition();

  const handleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("crm_view_mode", mode);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activePatient = patients.find(p => p.id === activeId);
    if (!activePatient) return;

    let targetStage = overId;
    const overPatient = patients.find(p => p.id === overId);
    if (overPatient) {
      targetStage = overPatient.funnelStep;
    }

    // Se mudou de estágio (coluna)
    if (activePatient.funnelStep !== targetStage) {
      if (targetStage === "active") {
        const requiredFields = ["cpf", "birthDate", "email", "phone", "emergencyName", "emergencyPhone"];
        const missing = requiredFields.filter(f => !activePatient[f]);

        if (missing.length > 0) {
          setActivePatientData(activePatient);
          setActivationForm({
            cpf: activePatient.cpf || "",
            birthDate: activePatient.birthDate ? activePatient.birthDate.split("T")[0] : "",
            email: activePatient.email || "",
            phone: activePatient.phone || "",
            emergencyName: activePatient.emergencyName || "",
            emergencyPhone: activePatient.emergencyPhone || ""
          });
          setShowActivationModal(true);
          return;
        }
      }

      try {
        await api.updatePatientFunnel(activeId, { funnelStep: targetStage });
        setPatients(prev => prev.map(p => p.id === activeId ? { ...p, funnelStep: targetStage } : p));
        toast("Estágio atualizado com sucesso!", "success", 2000);
      } catch (error) {
        toast(error.message || "Erro ao atualizar estágio", "error");
      }
    } 
    // Se foi solto sobre outro card na mesma coluna (reordenação vertical)
    else if (overPatient && activeId !== overId) {
      setPatients(prev => {
        const oldIndex = prev.findIndex(p => p.id === activeId);
        const newIndex = prev.findIndex(p => p.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prev, oldIndex, newIndex);
        }
        return prev;
      });
    }
  };

  const handleReorderVertical = (patientId, direction) => {
    setPatients(prev => {
      const patient = prev.find(p => p.id === patientId);
      if (!patient) return prev;

      const sameStagePatients = prev.filter(p => p.funnelStep === patient.funnelStep);
      const currentIndexInStage = sameStagePatients.findIndex(p => p.id === patientId);
      const targetIndexInStage = currentIndexInStage + direction;

      if (targetIndexInStage < 0 || targetIndexInStage >= sameStagePatients.length) return prev;

      const targetPatient = sameStagePatients[targetIndexInStage];
      const globalOldIndex = prev.findIndex(p => p.id === patientId);
      const globalNewIndex = prev.findIndex(p => p.id === targetPatient.id);

      return arrayMove(prev, globalOldIndex, globalNewIndex);
    });
  };

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

  const handleArchivePatient = async (id) => {
    if (!confirm("Deseja arquivar este contato? Sairá do funil de captação.")) return;
    try {
      await api.updatePatientFunnel(id, { funnelStep: "archived" });
      setPatients(prev => prev.filter(p => p.id !== id));
      if (selectedPatientDetail?.id === id) setSelectedPatientDetail(null);
      toast("Contato arquivado com sucesso", "success");
    } catch (error) {
      toast(error.message || "Erro ao arquivar contato", "error");
    }
  };

  const handleSaveLead = async () => {
    if (!editingLead) return;
    try {
      const updated = await api.updatePatient(editingLead.id, {
        name: editingLead.name,
        phone: editingLead.phone,
        leadSource: editingLead.leadSource,
        crmNotes: editingLead.crmNotes
      });
      setPatients(prev => prev.map(p => p.id === editingLead.id ? updated : p));
      setSelectedPatientDetail(updated);
      setEditingLead(null);
      toast("Lead atualizado com sucesso!", "success", 2500);
    } catch (error) {
      toast(error.message || "Erro ao atualizar lead", "error");
    }
  };

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
      <div className="h-full flex flex-col overflow-y-auto lg:overflow-hidden animate-fade-in relative pb-28 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        
        {/* BARRA SUPERIOR UNIFICADA (Rigorosamente igual à tela de Pacientes: px-3 sm:px-6 py-4 sticky top-0) */}
        <div className="px-3 sm:px-6 py-4 flex flex-row items-center justify-between gap-2 sm:gap-4 shrink-0 sticky top-0 z-40 bg-[var(--bg)] shadow-[0_10px_20px_-10px_var(--bg)]">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--sage)] transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Procurar lead por nome, telefone ou observações..."
              className="w-full pl-10 pr-12 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[14px] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] font-medium transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={14} />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="hidden md:flex items-center justify-center px-1.5 py-0.5 rounded-[6px] bg-[var(--surface)] text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border)] tracking-widest font-sans">
                  ⌘K
                </span>
              </div>
            )}
          </div>

          {/* Select de Origem Filtro */}
          <div className="hidden lg:block relative w-44 shrink-0">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[14px] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--sage)] font-medium cursor-pointer shadow-sm"
            >
              <option value="all">Todas as Origens</option>
              <option value="Instagram">Instagram</option>
              <option value="Google">Google / Maps</option>
              <option value="Indicação">Indicação</option>
              <option value="Doctoralia">Doctoralia</option>
              <option value="Outro">Outro Canal</option>
            </select>
          </div>

          {/* Ações (View Swapper + Cadastrar) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* View Swapper (Kanban vs Lista) */}
            <div className="flex items-center p-1 bg-[var(--surface-alt)] rounded-[14px] border border-[var(--border)] shrink-0">
              <button
                onClick={() => handleViewMode("kanban")}
                title="Visualização em Colunas Kanban"
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] outline-none cursor-pointer transition-all ${
                  viewMode === "kanban" 
                    ? "bg-[var(--surface)] shadow-sm text-[var(--sage)] border border-[var(--border)] font-bold" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent"
                }`}
              >
                <Kanban size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                onClick={() => handleViewMode("list")}
                title="Visualização em Lista"
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] outline-none cursor-pointer transition-all ${
                  viewMode === "list" 
                    ? "bg-[var(--surface)] shadow-sm text-[var(--sage)] border border-[var(--border)] font-bold" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent"
                }`}
              >
                <List size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* Botão Cadastrar */}
            <button 
              onClick={() => {
                setTargetStageForAdd("lead");
                setShowAddLeadModal(true);
              }}
              className="bg-[var(--sage)] hover:opacity-90 text-white rounded-[14px] px-4 sm:px-5 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus size={18} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Cadastrar</span>
            </button>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL (Alinhado rigorosamente com px-3 sm:px-6 pb-3 sm:pb-6) */}
        <div className="flex-1 flex flex-col px-3 sm:px-6 pb-3 sm:pb-6 min-h-0 space-y-4">
          
          {/* MODO 1: KANBAN BOARD (Cabeçalhos Neutros + Pontos de Status) */}
          {viewMode === "kanban" && (
            <>
              {/* Mobile Stage Selector */}
              <div className="md:hidden grid grid-cols-2 gap-2 shrink-0">
                {STAGES.map(stage => {
                  const count = filteredPatients.filter(p => p.funnelStep === stage.id).length;
                  const isActive = mobileStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setMobileStage(stage.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-[14px] text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                          : "bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full shrink-0 ${stage.dotBg}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block truncate">
                          <span className="text-[var(--text-muted)] font-extrabold mr-1">{stage.step}</span>
                          {stage.label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-extrabold rounded-[8px] bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]/50">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Container Mobile */}
              <div className="md:hidden flex-1 min-h-0 overflow-y-auto hide-scrollbar">
                {(() => {
                  const currentStage = STAGES.find(s => s.id === mobileStage);
                  const stagePatients = filteredPatients.filter(p => p.funnelStep === mobileStage);

                  return (
                    <div className="flex flex-col min-h-full rounded-[16px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                      <div className="p-3.5 bg-[var(--surface-alt)] border-b border-[var(--border)] flex justify-between items-center text-[var(--text-primary)]">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${currentStage.dotBg}`} />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            <span className="text-[var(--text-muted)] font-extrabold mr-1">{currentStage.step}</span>
                            {currentStage.label}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-extrabold rounded-[8px] bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]/50">
                            {stagePatients.length}
                          </span>
                        </div>

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
                                onReorderVertical={handleReorderVertical}
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

              {/* Container Desktop */}
              <div className="hidden md:flex flex-1 min-h-0 overflow-x-auto pb-2">
                <div className="grid grid-cols-4 gap-4 h-full w-full min-h-[450px]">
                  {STAGES.map(stage => {
                    const stagePatients = filteredPatients.filter(p => p.funnelStep === stage.id);

                    return (
                      <DroppableKanbanColumn
                        key={stage.id}
                        stage={stage}
                        stagePatients={stagePatients}
                        onMoveStage={handleMoveStage}
                        onReorderVertical={handleReorderVertical}
                        onArchive={handleArchivePatient}
                        onNavigate={navigate}
                        onOpenDetail={setSelectedPatientDetail}
                        onAddLead={(stageId) => {
                          setTargetStageForAdd(stageId);
                          setShowAddLeadModal(true);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* MODO 2: VISUALIZAÇÃO EM LISTA COMPACTA */}
          {viewMode === "list" && (
            <div className="flex-1 min-h-0 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-sm flex flex-col overflow-hidden">
              {filteredPatients.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
                  <Tag size={36} className="text-[var(--text-muted)] mb-3 opacity-60" />
                  <p className="text-sm font-bold text-[var(--text-primary)]">Nenhum lead encontrado</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Tente ajustar o termo de pesquisa ou os filtros de origem.</p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 hide-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[var(--surface-alt)] border-b border-[var(--border)] text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px] z-10">
                      <tr>
                        <th className="py-3 px-4">Nome do Lead</th>
                        <th className="py-3 px-4">Estágio</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Origem</th>
                        <th className="py-3 px-4 hidden md:table-cell">WhatsApp</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredPatients.map(patient => {
                        const stageObj = STAGES.find(s => s.id === patient.funnelStep) || STAGES[0];
                        const cleanPhone = (patient.phone || "").replace(/\D/g, "");
                        const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

                        return (
                          <tr key={patient.id} className="hover:bg-[var(--surface-alt)]/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[var(--surface-alt)] text-[var(--text-secondary)] font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-[var(--border)]">
                                  {getInitials(patient.name)}
                                </div>
                                <span 
                                  onClick={() => setSelectedPatientDetail(patient)}
                                  className="hover:text-[var(--sage)] cursor-pointer truncate"
                                >
                                  {patient.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${stageObj.dotBg}`} />
                                <span className="font-bold text-[var(--text-primary)] text-[11px]">
                                  <span className="text-[var(--text-muted)] font-extrabold mr-1">{stageObj.step}</span>
                                  {stageObj.label}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell text-[var(--text-secondary)] font-medium">
                              {patient.leadSource || "N/A"}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell text-[var(--text-secondary)] font-medium">
                              {whatsappUrl ? (
                                <a 
                                  href={whatsappUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <MessageCircle size={13} />
                                  {patient.phone}
                                </a>
                              ) : (
                                patient.phone || "Não informado"
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedPatientDetail(patient)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                  title="Ver Detalhes"
                                >
                                  <FileText size={15} />
                                </button>
                                <button
                                  onClick={() => handleArchivePatient(patient.id)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-red-500"
                                  title="Arquivar"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragId ? (
            <StaticPatientCardOverlay
              patient={activePatientForOverlay}
              stage={activeStageForOverlay}
            />
          ) : null}
        </DragOverlay>

        {/* Modal Slide-over: Detalhes do Lead */}
        {selectedPatientDetail && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[3px] p-4">
            {(() => {
              const detailAvatar = getAvatarProps(selectedPatientDetail.name);
              const lead = editingLead || selectedPatientDetail;
              return (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl w-full max-w-md max-h-[90vh] animate-scale-in overflow-hidden flex flex-col">
                <div className="relative px-6 pt-6 pb-5 overflow-hidden flex-shrink-0">
                  <div
                    className="absolute -top-8 -right-8 w-[120px] h-[120px] rounded-full opacity-20 blur-2xl pointer-events-none"
                    style={{ backgroundColor: detailAvatar.color.text }}
                  />
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: detailAvatar.color.bg, color: detailAvatar.color.text }}
                      >
                        {getInitials(selectedPatientDetail.name)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedPatientDetail.name}</h3>
                        <span className="text-xs text-[var(--text-muted)] font-medium">Ficha do Lead no CRM</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedPatientDetail(null); setEditingLead(null); }}
                      className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1 hide-scrollbar">
                <div className="p-3.5 bg-[var(--surface-alt)] rounded-[14px] border border-[var(--border)] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-muted)] font-semibold">Estágio Atual:</span>
                    <span className="font-bold text-[var(--text-primary)] uppercase text-[11px]">
                      {STAGES.find(s => s.id === selectedPatientDetail.funnelStep)?.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Origem</label>
                    <select 
                      value={lead.leadSource || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingLead(prev => prev ? { ...prev, leadSource: val } : { ...selectedPatientDetail, leadSource: val });
                      }}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium cursor-pointer"
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
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Telefone</label>
                    <input 
                      type="tel"
                      value={lead.phone || ""}
                      onChange={e => {
                        const val = formatPhone(e.target.value);
                        setEditingLead(prev => prev ? { ...prev, phone: val } : { ...selectedPatientDetail, phone: val });
                      }}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                      <FileText size={12} className="text-[var(--sage)]" />
                      Observações de Contato
                    </label>
                    {lead.crmNotes && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-[6px] text-[var(--dark-green)] bg-[var(--sage-light)]">
                        Preenchido
                      </span>
                    )}
                  </div>
                  <RichTextEditor
                    value={lead.crmNotes || ""}
                    onChange={val => {
                      setEditingLead(prev => prev ? { ...prev, crmNotes: val } : { ...selectedPatientDetail, crmNotes: val });
                    }}
                    placeholder="Adicione observações sobre este contato, queixas iniciais, valores combinados..."
                    minHeight="100px"
                    maxHeight="180px"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => { setSelectedPatientDetail(null); setEditingLead(null); }}
                    className="flex-1 py-3 px-4 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveLead}
                    className="flex-1 py-3 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Check size={15} />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>
              </div>
              );
            })()}
          </div>
        , document.body)}

        {/* Modal 1: Adicionar Lead */}
        {showAddLeadModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[calc(65px+env(safe-area-inset-bottom)+16px)] sm:pb-4 bg-black/40 backdrop-blur-[3px]">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-hidden flex flex-col relative">
              <div className="relative px-6 pt-6 pb-5 shrink-0">
                <div
                  className="absolute -top-10 -right-10 w-[140px] h-[140px] rounded-full opacity-15 blur-3xl pointer-events-none"
                  style={{ backgroundColor: "var(--sage)" }}
                />
                <div className="flex justify-between items-center relative z-10">
                  <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-tight">Adicionar Novo Lead</h3>
                  <button 
                    onClick={() => setShowAddLeadModal(false)}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="h-px bg-[var(--border)] mx-5 shrink-0" />
              
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
                    type="tel" 
                    value={newLead.phone}
                    onChange={e => setNewLead(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-all font-medium"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                      <FileText size={12} className="text-[var(--sage)]" />
                      Notas de Contato
                    </label>
                    {newLead.crmNotes && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-[6px] text-[var(--dark-green)] bg-[var(--sage-light)]">
                        Preenchido
                      </span>
                    )}
                  </div>
                  <RichTextEditor
                    value={newLead.crmNotes}
                    onChange={val => setNewLead(prev => ({ ...prev, crmNotes: val }))}
                    placeholder="Queixas iniciais, valores combinados, observações sobre o contato..."
                    minHeight="100px"
                    maxHeight="160px"
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
