import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Trash2,
  AlertTriangle
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { getAvatarProps } from "./dashboard/Shared";
import { api } from "../lib/api";

function getCleanDateStr(dateVal) {
  if (!dateVal) return "";
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, "0");
    const d = String(dateVal.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}

export default function AppointmentDetailModal({
  appointment,
  patient: patientProp,
  attendance: attendanceProp,
  attendances,
  sessionDate,
  nextDate,
  onClose,
  onSaveAttendance,
  onSaveJustificada,
  onDeleteJustificada,
  onDeleteAppointment,
  onUpdate,
  toast
}) {
  const navigate = useNavigate();

  // Se não houver agendamento, não renderiza nada
  if (!appointment) return null;

  const patient = patientProp || appointment.patient || appointment.patients || {};
  const effectiveDate = sessionDate || nextDate;
  const patientName = patient?.name || "Paciente";
  const { initials, color: avatarColor } = getAvatarProps(patientName);

  const targetDateStr = getCleanDateStr(effectiveDate) || getCleanDateStr(new Date());
  const resolvedPatientId = patient?.id || appointment?.patientId || appointment?.patient_id || appointment?.patient?.id;

  const existingAtt = attendanceProp || appointment?.attendance || attendances?.find(a => {
    if (!a) return false;
    const attPatientId = a.patientId || a.patient_id || a.patient?.id;
    if (resolvedPatientId && attPatientId && attPatientId !== resolvedPatientId) return false;
    const aDateStr = getCleanDateStr(a.date);
    return aDateStr === targetDateStr;
  });

  const currentStatus = existingAtt?.status || appointment?.status || "agendado";

  // Estados locais
  const [selectedStatus, setSelectedStatus] = useState("presente");
  const [presenceNotes, setPresenceNotes] = useState("");
  const [faltaNotes, setFaltaNotes] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // Modal de justificativa
  const [justModal, setJustModal] = useState({ open: false, existingAtt: null });
  const [justType, setJustType] = useState("reagendar");
  const [justData, setJustData] = useState({ date: "", time: "", notes: "" });

  // Modal de confirmação para exclusão
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false
  });

  // Inicializa notas e justificativas existentes ao abrir
  useEffect(() => {
    if (existingAtt) {
      const statusToSet = existingAtt.status || "presente";
      setSelectedStatus(statusToSet);
      if (statusToSet === "presente") {
        setPresenceNotes(existingAtt.notes || "");
        setFaltaNotes("");
        setJustData({ date: "", time: "", notes: "" });
        setJustModal({ open: false, existingAtt: null });
      } else if (statusToSet === "falta") {
        setPresenceNotes("");
        setFaltaNotes(existingAtt.notes || "");
        setJustData({ date: "", time: "", notes: "" });
        setJustModal({ open: false, existingAtt: null });
      } else if (statusToSet === "justificada") {
        setPresenceNotes("");
        setFaltaNotes("");
        setJustModal({ open: true, existingAtt });
        let resDate = existingAtt.rescheduledDate || existingAtt.rescheduled_date || "";
        let resTime = existingAtt.rescheduledTime || existingAtt.rescheduled_time || "";
        let notesText = existingAtt.notes || "";

        if (!resDate && notesText.includes("Reagendado para ")) {
          const matchDate = notesText.match(/Reagendado para (\d{4}-\d{2}-\d{2})/);
          if (matchDate) resDate = matchDate[1];
          const matchTime = notesText.match(/Reagendado para \d{4}-\d{2}-\d{2} às (\d{2}:\d{2})/);
          if (matchTime) resTime = matchTime[1];
        }

        setJustType(resDate ? "reagendar" : "cancelar");
        setJustData({
          date: resDate,
          time: resTime,
          notes: notesText
        });
      }
    } else {
      setSelectedStatus("presente");
      setPresenceNotes("");
      setFaltaNotes("");
      setJustData({ date: "", time: "", notes: "" });
      setJustModal({ open: false, existingAtt: null });
    }
  }, [appointment?.id, targetDateStr, existingAtt?.id, existingAtt?.status, existingAtt?.notes]);

  // Animação suave ao fechar
  const triggerClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  // Manipulador rápido de mudança de status (Presença / Falta / Justificada)
  const handleQuickStatus = (app, status, date) => {
    if (status === "justificada") {
      const targetAtt = existingAtt?.status === "justificada" 
        ? existingAtt 
        : attendances?.find(a => (a.appointment_id === app.id || a.appointmentId === app.id) && a.status === "justificada");

      const justAttToSet = targetAtt || null;
      setJustModal({ open: true, existingAtt: justAttToSet });

      let resDate = justAttToSet?.rescheduledDate || justAttToSet?.rescheduled_date || "";
      let resTime = justAttToSet?.rescheduledTime || justAttToSet?.rescheduled_time || "";
      let notesText = justAttToSet?.notes || "";

      if (!resDate && notesText.includes("Reagendado para ")) {
        const matchDate = notesText.match(/Reagendado para (\d{4}-\d{2}-\d{2})/);
        if (matchDate) resDate = matchDate[1];
        const matchTime = notesText.match(/Reagendado para \d{4}-\d{2}-\d{2} às (\d{2}:\d{2})/);
        if (matchTime) resTime = matchTime[1];
      }

      setJustType(resDate ? "reagendar" : "reagendar");
      setJustData({
        date: resDate,
        time: resTime,
        notes: notesText
      });
      setSelectedStatus("justificada");
    } else {
      setJustModal({ open: false, existingAtt: null });
      setSelectedStatus(status);
    }
  };

  // Salvar Presença ou Falta
  const handleAttendance = async (app, status, date, notes) => {
    try {
      const targetDate = date ? getCleanDateStr(date) : targetDateStr;
      const resolvedPatientId = patient.id || app.patientId || app.patient_id || app.patient?.id;

      if (onSaveAttendance) {
        await onSaveAttendance(app, status, targetDate, notes);
      } else {
        await api.saveAttendance({
          id: existingAtt?.id,
          patientId: resolvedPatientId,
          date: targetDate,
          status: status,
          notes: notes || "",
          sessionTime: app.time
        });

        if (onUpdate) await onUpdate();
      }
      if (toast) toast(status === "presente" ? "Presença gravada com sucesso!" : "Falta gravada com sucesso!", "success");
      triggerClose();
    } catch (err) {
      console.error("Erro ao salvar presença/falta:", err);
      if (toast) toast("Erro ao salvar atendimento", "error");
    }
  };

  // Salvar Falta Justificada
  const saveJustificada = async () => {
    try {
      if (onSaveJustificada) {
        await onSaveJustificada(appointment, justType, justData, effectiveDate);
      } else {
        const targetDate = effectiveDate ? getCleanDateStr(effectiveDate) : targetDateStr;
        const resolvedPatientId = patient.id || appointment.patientId || appointment.patient_id || appointment.patient?.id;

        if (justType === "reagendar" && justData.date && justData.time) {
          const [y, m, d] = justData.date.split('-').map(Number);
          const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
          await api.createAppointment({
            patientId: resolvedPatientId,
            dayOfWeek: dayOfWeek,
            time: justData.time,
            duration: appointment.duration || 50,
            scheduledDate: justData.date
          });
        }

        await api.saveAttendance({
          id: justModal.existingAtt?.id || existingAtt?.id,
          patientId: resolvedPatientId,
          date: targetDate,
          status: "justificada",
          notes: justData.notes || "",
          sessionTime: appointment.time,
          rescheduledDate: justType === "reagendar" ? (justData.date || null) : null,
          rescheduledTime: justType === "reagendar" ? (justData.time || null) : null
        });

        if (appointment.id) {
          try {
            await api.updateAppointment(appointment.id, { status: "justificada" });
          } catch (e) {
            console.warn("Nao foi possivel atualizar status no agendamento:", e);
          }
        }

        if (onUpdate) await onUpdate();
      }
      if (toast) toast("Falta justificada registrada!", "success");
      triggerClose();
    } catch (err) {
      console.error("Erro ao salvar justificativa:", err);
      if (toast) toast("Erro ao salvar justificativa", "error");
    }
  };

  // Excluir Justificativa
  const deleteJustification = () => {
    setConfirmModal({
      open: true,
      title: "Desfazer Justificativa",
      message: "Tem certeza que deseja remover esta justificativa? O agendamento voltará ao estado original.",
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          if (onDeleteJustificada) {
            await onDeleteJustificada(justModal.existingAtt.id, appointment.id);
          } else if (justModal.existingAtt?.id) {
            await api.deleteAttendance(justModal.existingAtt.id);
            if (appointment.id) {
              try {
                await api.updateAppointment(appointment.id, { status: "agendado" });
              } catch (e) {}
            }
            if (onUpdate) await onUpdate();
          }
          if (toast) toast("Justificativa desfeita com sucesso!", "success");
          triggerClose();
        } catch (err) {
          console.error("Erro ao excluir justificativa:", err);
          if (toast) toast("Erro ao desfazer justificativa", "error");
        } finally {
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
        }
      }
    });
  };

  // Excluir Agendamento
  const handleDeleteAppointment = () => {
    setConfirmModal({
      open: true,
      title: "Excluir Agendamento",
      message: `Tem certeza que deseja excluir o agendamento de ${patient?.name || "este paciente"}? Esta ação não pode ser desfeita.`,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          if (onDeleteAppointment) {
            await onDeleteAppointment(appointment.id);
          } else {
            await api.deleteAppointment(appointment.id);
            if (onUpdate) await onUpdate();
          }
          if (toast) toast("Agendamento excluído com sucesso!", "success");
          triggerClose();
        } catch (err) {
          console.error("Erro ao excluir agendamento:", err);
          if (toast) toast("Erro ao excluir agendamento", "error");
        } finally {
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
        }
      }
    });
  };

  const statusLabels = {
    agendado: "Agendado",
    presente: "Presente",
    falta: "Falta",
    justificada: "Justificado",
    cancelado: "Cancelado"
  };

  const statusBadgeConfig = {
    presente: { bg: "var(--status-presente-bg)", color: "var(--status-presente-text)" },
    falta: { bg: "var(--status-falta-bg)", color: "var(--status-falta-text)" },
    justificada: { bg: "var(--status-justificada-bg)", color: "var(--status-justificada-text)" },
    agendado: { bg: "var(--status-confirmado-bg)", color: "var(--status-confirmado-text)" },
    cancelado: { bg: "var(--status-falta-bg)", color: "var(--status-falta-text)" }
  };
  const currentBadgeStyle = statusBadgeConfig[currentStatus] || statusBadgeConfig.agendado;

  const isActivePresente = !justModal.open && selectedStatus === "presente";
  const isActiveFalta = !justModal.open && selectedStatus === "falta";
  const isActiveJustificado = justModal.open || selectedStatus === "justificada";

  const phone = patient?.phone ? patient.phone.replace(/\D/g, "") : "";
  const whatsappText = `Olá ${patient?.name?.split(" ")[0] || ""}, lembrete da sua consulta no dia ${sessionDate ? format(sessionDate, "dd/MM") : ""} às ${appointment.time}.`;

  return createPortal(
    <>
      {/* ── Backdrop com suporte Dual (Centralizado no espaço útil entre o Topo e o BottomNav no Mobile) ── */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-4 pb-[calc(65px+env(safe-area-inset-bottom,0px)+16px)] sm:pb-4 z-[100] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={triggerClose}
      >
        <div
          className={`relative bg-[var(--surface)] w-full max-w-full sm:max-w-md md:max-w-lg rounded-[24px] shadow-2xl flex flex-col border border-[var(--border)] overflow-hidden transition-all duration-300 ease-out max-h-[calc(100vh-65px-env(safe-area-inset-bottom,0px)-48px)] sm:max-h-[85vh] ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Mobile Drag Pill */}
          <div className="w-12 h-1.5 bg-slate-300/80 dark:bg-slate-600/80 rounded-full mx-auto my-2.5 shrink-0 sm:hidden" />
          {/* ── HEADER ── */}
          <div className="relative px-6 pt-6 pb-5 overflow-hidden flex-shrink-0">
            {/* Blob decorativo no canto */}
            <div
              className="absolute -top-8 -right-8 w-[120px] h-[120px] rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ backgroundColor: avatarColor.text }}
            />

            {/* Fechar */}
            <button
              onClick={triggerClose}
              className="absolute top-4 right-4 p-1.5 rounded-[10px] z-10"
              style={{ color: "var(--text-muted)", background: "var(--surface-alt)" }}
            >
              <X size={16} />
            </button>

            {/* Avatar + Info */}
            <div className="flex items-center gap-4">
              {/* Avatar com mesma lógica de cor do timeline (hash pelo nome) */}
              <div
                className="w-[56px] h-[56px] rounded-[16px] flex items-center justify-center text-[18px] font-extrabold shrink-0 shadow-sm"
                style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <h2
                  className="text-[18px] font-bold leading-tight truncate"
                  style={{ color: "var(--text-primary)", fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  {patient?.name || "Paciente"}
                </h2>
                {/* Badge de status atual */}
                <span
                  className="inline-flex items-center gap-1 px-[10px] py-[3px] rounded-[8px] text-[10px] font-extrabold uppercase tracking-widest mt-1"
                  style={{ backgroundColor: currentBadgeStyle.bg, color: currentBadgeStyle.color }}
                >
                  {statusLabels[currentStatus] || "Agendado"}
                </span>
              </div>
            </div>

            {/* Info da sessão */}
            <div
              className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-[12px]"
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
            >
              <Clock size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <span className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                {effectiveDate ? format(new Date(effectiveDate), "dd/MM/yyyy", { locale: ptBR }) : ""} às {appointment.time}
              </span>
              <span
                className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[6px]"
                style={{ background: "var(--border)", color: "var(--text-muted)" }}
              >
                {appointment.duration} min
              </span>
            </div>
          </div>

          {/* ── CONTEÚDO PRINCIPAL COM SCROLL MASK (FADE-OUT SUAVE NA BASE) ── */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-5 sm:p-6 space-y-5 pb-8">
              
              {/* 1. SELEÇÃO DE STATUS DO ATENDIMENTO */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Status do Atendimento
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStatus(appointment, "presente", sessionDate)}
                    className={`py-2.5 px-2 sm:px-3 rounded-[12px] text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      isActivePresente
                        ? "bg-[var(--sage-light)] text-[var(--dark-green)] border-[var(--sage)] shadow-sm"
                        : "bg-[var(--surface-alt)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--border)]"
                    }`}
                  >
                    <Check size={14} className={isActivePresente ? "text-[var(--dark-green)]" : "text-[var(--text-muted)]"} />
                    <span>Presença</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickStatus(appointment, "falta", sessionDate)}
                    className={`py-2.5 px-2 sm:px-3 rounded-[12px] text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      isActiveFalta
                        ? "bg-[var(--status-falta-bg)] text-[var(--status-falta-text)] border-[#EF4444] shadow-sm"
                        : "bg-[var(--surface-alt)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--border)]"
                    }`}
                  >
                    <X size={14} className={isActiveFalta ? "text-[#EF4444]" : "text-[var(--text-muted)]"} />
                    <span>Falta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickStatus(appointment, "justificada", sessionDate)}
                    className={`py-2.5 px-2 sm:px-3 rounded-[12px] text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      isActiveJustificado
                        ? "bg-[var(--purple-light)] text-[var(--purple)] border-[var(--purple)] shadow-sm"
                        : "bg-[var(--surface-alt)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--border)]"
                    }`}
                  >
                    <AlertCircle size={14} className={isActiveJustificado ? "text-[var(--purple)]" : "text-[var(--text-muted)]"} />
                    <span>Justificado</span>
                  </button>
                </div>
              </div>

              {/* 2. CONTEÚDO CONDICIONAL (Justificativa OU Evolução Clínica/Observação) */}
              {justModal.open ? (
                /* PAINEL DE FALTA JUSTIFICADA E REAGENDAMENTO */
                <div className="space-y-4 pt-3 border-t border-[var(--border)] animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--purple)] flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      Falta Justificada & Reagendamento
                    </span>
                    {justModal.existingAtt && (
                      <span className="text-[9px] font-bold text-[var(--purple)] bg-[var(--purple-light)] px-2 py-0.5 rounded-[6px]">
                        Editando
                      </span>
                    )}
                  </div>

                  {/* Choice Cards (Ação de Reagendar ou Cancelar) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setJustType("reagendar")}
                      className={`p-3 rounded-[14px] text-left transition-all border flex flex-col justify-between ${
                        justType === "reagendar"
                          ? "bg-[var(--purple-light)] border-[var(--purple)] shadow-sm"
                          : "bg-[var(--surface-alt)] border-[var(--border)] hover:bg-[var(--border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold ${justType === "reagendar" ? "text-[var(--purple)]" : "text-[var(--text-primary)]"}`}>
                          Remarcar Sessão
                        </span>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${justType === "reagendar" ? "bg-[var(--purple)] text-white" : "border border-[var(--border)]"}`}>
                          {justType === "reagendar" && <Check size={10} />}
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                        Abona a falta e cria uma nova sessão em outro dia.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJustType("cancelar")}
                      className={`p-3 rounded-[14px] text-left transition-all border flex flex-col justify-between ${
                        justType === "cancelar"
                          ? "bg-[var(--peach-light)] border-[var(--peach)] shadow-sm"
                          : "bg-[var(--surface-alt)] border-[var(--border)] hover:bg-[var(--border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold ${justType === "cancelar" ? "text-[var(--peach)]" : "text-[var(--text-primary)]"}`}>
                          Apenas Abonar
                        </span>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${justType === "cancelar" ? "bg-[var(--peach)] text-white" : "border border-[var(--border)]"}`}>
                          {justType === "cancelar" && <Check size={10} />}
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                        Abona a falta sem criar novo horário na agenda.
                      </p>
                    </button>
                  </div>

                  {/* Motivo / Observação da Justificativa */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                        <Sparkles size={12} className="text-[var(--purple)]" />
                        Observação da Justificativa / Ausência
                      </span>
                      {justData.notes && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-[6px] text-[var(--purple)] bg-[var(--purple-light)]">
                          Preenchido
                        </span>
                      )}
                    </div>
                    <RichTextEditor
                      value={justData.notes}
                      onChange={val => setJustData(prev => ({ ...prev, notes: val }))}
                      placeholder="Descreva o motivo da falta justificada (ex: atestado médico, viagem)..."
                      minHeight="120px"
                      maxHeight="180px"
                    />
                  </div>

                  {/* Campos de Nova Data e Horário (apenas se 'reagendar') */}
                  {justType === "reagendar" && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1">
                          Nova Data
                        </label>
                        <input
                          type="date"
                          value={justData.date}
                          onChange={e => setJustData(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--purple)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-secondary)] block mb-1">
                          Horário
                        </label>
                        <select
                          value={justData.time}
                          onChange={e => setJustData(prev => ({ ...prev, time: e.target.value }))}
                          className="w-full px-3 py-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--purple)] transition-all"
                        >
                          <option value="">--:--</option>
                          {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* 3. EVOLUÇÃO CLÍNICA OU REGISTRO DE FALTA */
                <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                      <Sparkles size={12} className={selectedStatus === "falta" ? "text-[#EF4444]" : "text-[var(--sage)]"} />
                      {selectedStatus === "falta" ? "Observação da Falta / Ausência" : "Evolução Clínica da Sessão"}
                    </span>
                    {(selectedStatus === "falta" ? faltaNotes : presenceNotes) && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-[6px] ${selectedStatus === "falta" ? "text-[#EF4444] bg-[var(--status-falta-bg)]" : "text-[var(--dark-green)] bg-[var(--sage-light)]"}`}>
                        Preenchido
                      </span>
                    )}
                  </div>

                  <RichTextEditor
                    value={selectedStatus === "falta" ? faltaNotes : presenceNotes}
                    onChange={val => selectedStatus === "falta" ? setFaltaNotes(val) : setPresenceNotes(val)}
                    placeholder={
                      selectedStatus === "falta"
                        ? "Descreva o motivo da ausência, aviso prévio, tentativas de contato ou observações sobre a falta..."
                        : "Descreva como foi o atendimento, relato do paciente, técnicas aplicadas e direcionamentos (suporta Negrito, Itálico, Listas e Títulos)..."
                    }
                    minHeight="130px"
                    maxHeight="220px"
                  />
                </div>
              )}

              {/* 4. AÇÕES RÁPIDAS (WhatsApp, Prontuário, Excluir na mesma linha) */}
              <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`https://wa.me/55${phone}?text=${encodeURIComponent(whatsappText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-[12px] text-[11px] font-semibold bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-all truncate"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366" className="shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => { triggerClose(); setTimeout(() => navigate(`/patients/${patient?.id}`), 200); }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-[12px] text-[11px] font-semibold bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-all truncate"
                  >
                    <ExternalLink size={14} className="shrink-0" />
                    <span>Prontuário</span>
                  </button>

                  <button
                    onClick={handleDeleteAppointment}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-[12px] text-[11px] font-semibold bg-[var(--surface-alt)] border border-[var(--border)] text-red-500 hover:bg-red-50 transition-all truncate"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>Excluir</span>
                  </button>
                </div>

                {/* Desfazer Justificativa */}
                {justModal.existingAtt?.status === "justificada" && !justModal.open && (
                  <div className="pt-1">
                    <button
                      onClick={deleteJustification}
                      className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-[12px] bg-red-500/10 text-[#EF4444] text-[11px] font-bold uppercase tracking-wider hover:bg-[#EF4444] hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                      Desfazer Justificativa
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Scroll Fade Mask Overlay (Efeito esmaecido na base para sinalizar rolagem) */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/85 to-transparent pointer-events-none z-10" />
          </div>

        {/* ── RODAPÉ FIXO DO MODAL (Sempre por baixo, mantendo o padrão) ── */}
        <div 
          className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--surface)] flex-shrink-0 flex items-center justify-end gap-2"
          style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={triggerClose}
            className="px-3.5 py-2 bg-[var(--surface-alt)] text-[var(--text-secondary)] rounded-[12px] text-xs font-semibold hover:bg-[var(--border)] transition-all"
          >
            Fechar
          </button>
          {justModal.open ? (
            <button
              type="button"
              onClick={saveJustificada}
              className="px-4 py-2 bg-[var(--sage)] hover:bg-[var(--dark-green)] text-white text-xs font-bold rounded-[12px] shadow-sm transition-all flex items-center gap-1.5"
            >
              <Check size={15} />
              Salvar Justificativa
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const statusToSave = selectedStatus || "presente";
                const notesToSave = statusToSave === "falta" ? faltaNotes : presenceNotes;
                handleAttendance(appointment, statusToSave, sessionDate, notesToSave);
              }}
              className="px-4 py-2 bg-[var(--sage)] hover:bg-[var(--dark-green)] text-white text-xs font-bold rounded-[12px] shadow-sm transition-all flex items-center gap-1.5"
            >
              <Check size={15} />
              {selectedStatus === "falta" ? "Salvar Falta & Observação" : "Salvar Evolução & Status"}
            </button>
          )}
        </div>
      </div>
    </div>

      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[110]" onClick={() => !confirmModal.loading && setConfirmModal({ ...confirmModal, open: false })}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 text-[#EF4444] rounded-[16px] flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] font-sans text-center tracking-tight mb-3">{confirmModal.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed font-medium mb-8">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                disabled={confirmModal.loading}
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--surface-alt)] rounded-[12px] transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={confirmModal.loading}
                onClick={confirmModal.onConfirm}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-[12px] text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
