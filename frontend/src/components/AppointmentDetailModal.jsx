import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatPhone } from "../lib/utils";
import { Clock, Phone, MessageCircle, Check, X, AlertCircle, Trash2, AlertTriangle, BookOpen, RefreshCcw, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDateKey(date) {
  if (!date) return "";
  if (typeof date === "string") return date.split("T")[0];
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extractUTCDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

export default function AppointmentDetailModal({ appointment, patient, nextDate, onClose, onUpdate, sessionType = "fixed" }) {
  const navigate = useNavigate();
  const [attendances, setAttendances] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [justModal, setJustModal] = useState({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
  const [justData, setJustData] = useState({ date: "", time: "", notes: "" });
  const [justType, setJustType] = useState("reagendar");
  const [descendantsInfo, setDescendantsInfo] = useState({ count: 0, list: [] });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null, loading: false });

  const sessionDate = nextDate ? new Date(formatDateKey(nextDate) + "T12:00:00") : null;

  useEffect(() => {
    api.getAttendances().then(setAttendances).catch(() => {});
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const existingAtt = attendances.find(a =>
    a.patientId === appointment.patientId && sessionDate && extractUTCDate(a.date) === formatDateKey(sessionDate)
  );

  const fetchDescendants = async (attendanceId) => {
    try {
      const data = await api.getAttendanceDescendants(attendanceId);
      setDescendantsInfo({ count: data.count, list: data.descendants });
      return data;
    } catch (error) {
      console.error("Erro ao buscar descendentes:", error);
      return { count: 0, descendants: [] };
    }
  };

  const handleAttendance = async (appt, status, date) => {
    if (!date) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const diff = (appt.dayOfWeek - d.getDay() + 7) % 7;
      date = new Date(d.getTime() + diff * 86400000);
    }

    const dateStr = formatDateKey(date);
    const existing = attendances.find(a => a.patientId === appt.patientId && extractUTCDate(a.date) === dateStr);

    if (status === "justificada") {
      if (existing) {
        await fetchDescendants(existing.id);
      } else {
        setDescendantsInfo({ count: 0, list: [] });
      }

      setJustModal({
        open: true,
        patient,
        appointment: appt,
        date,
        isEdit: true,
        existingAtt: existing
      });

      let reschedDate = "";
      let reschedTime = "";
      if (existing?.notes?.includes("Reagendado para ")) {
        const match = existing.notes.match(/Reagendado para (\d{4}-\d{2}-\d{2})/);
        if (match) reschedDate = match[1];
        const timeMatch = existing.notes.match(/Reagendado para \d{4}-\d{2}-\d{2} às (\d{2}:\d{2})/);
        if (timeMatch) reschedTime = timeMatch[1];
      } else if (existing?.sessionTime) {
        reschedTime = existing.sessionTime;
      }

      setJustType(existing ? (reschedDate ? "reagendar" : "cancelar") : "reagendar");
      setJustData({ date: reschedDate, time: reschedTime, notes: existing?.notes || "" });
      return;
    }

    try {
      if (existing?.status === status) {
        if (existing.parentId) {
          await api.saveAttendance({ ...existing, status: "", date: existing.date });
        } else {
          await api.deleteAttendance(existing.id);
        }
        const fresh = await api.getAttendances();
        setAttendances(fresh);
        setSuccessMessage("Status removido!");
      } else {
        await api.saveAttendance({
          patientId: appt.patientId,
          date: date.toISOString(),
          status,
          sessionTime: appt.time
        });
        const fresh = await api.getAttendances();
        setAttendances(fresh);
        setSuccessMessage(status === "presente" ? "Presença confirmada!" : "Falta registrada!");
      }
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSuccessMessage("Erro ao salvar status");
    }
  };

  const handleQuickStatus = (appt, status, date) => {
    if (status === "justificada") {
      handleAttendance(appt, "justificada", date);
      return;
    }
    handleAttendance(appt, status, date);
  };

  const deleteJustification = async () => {
    if (!justModal.existingAtt) return;
    const data = await fetchDescendants(justModal.existingAtt.id);
    const count = data.count;
    const list = data.descendants;

    let title = "Remover Justificativa";
    let message = "Deseja desfazer esta falta justificada? A sessão voltará a aparecer sem marcação.";

    if (count === 1) {
      const childDate = new Date(list[0].date);
      message = `Deseja remover esta justificativa? O reagendamento de ${format(childDate, "dd/MM")} também será cancelado e excluído permanentemente.`;
    } else if (count > 1) {
      message = `Deseja remover esta justificativa? Os ${count} reagendamentos seguintes na cadeia também serão cancelados. Esta ação não pode ser desfeita.`;
    }

    setConfirmModal({
      open: true,
      title,
      message,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await api.deleteAttendance(justModal.existingAtt.id);
          setSuccessMessage(count > 0 ? "Cadeia de reagendamento removida!" : "Justificativa removida!");
          const fresh = await api.getAttendances();
          setAttendances(fresh);
          setJustModal({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
          onUpdate?.();
        } catch (error) {
          alert("Erro ao remover: " + error.message);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const saveJustificada = async () => {
    if (!justModal.appointment || !justModal.date) return;

    const originalDate = justModal.date;
    const newDateStr = justData.date;
    const newTimeStr = justData.time;
    const motivo = justData.notes || "Falta justificada";

    try {
      const notes = newDateStr
        ? `Falta justificada. Reagendado para ${newDateStr} às ${newTimeStr || "08:00"}. Motivo: ${motivo}`
        : motivo;

      const sessionTime = newDateStr ? (newTimeStr || "08:00") : (justModal.appointment?.time || null);

      const originalResult = await api.saveAttendance({
        patientId: justModal.appointment.patientId,
        date: originalDate.toISOString(),
        status: "justificada",
        notes,
        sessionTime
      });

      if (newDateStr) {
        const dateToSave = new Date(newDateStr + "T" + (newTimeStr || "08:00") + ":00");
        await api.saveAttendance({
          patientId: justModal.appointment.patientId,
          date: dateToSave.toISOString(),
          status: "",
          notes: `Reagendamento da sessão de ${originalDate.toLocaleDateString("pt-BR")}. ${motivo}`,
          sessionTime: newTimeStr || "08:00",
          parentId: originalResult.id
        });
      }

      setSuccessMessage(newDateStr ? `Sessão reagendada para ${newDateStr}` : "Falta justificada registrada!");
      const fresh = await api.getAttendances();
      setAttendances(fresh);
      setJustModal({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSuccessMessage("Erro ao salvar justificativa");
    }
  };

  const handleDeleteAppointment = () => {
    const patientName = patient?.name || "este paciente";
    const isExtra = sessionType === "extra";
    setConfirmModal({
      open: true,
      title: isExtra ? "Excluir sessão" : "Excluir agendamento",
      message: isExtra
        ? `Tem certeza que deseja excluir a sessão de ${patientName}? Esta ação não pode ser desfeita.`
        : `Tem certeza que deseja excluir o horário de ${patientName}?`,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          if (isExtra) {
            await api.deleteAttendance(appointment.id);
            setSuccessMessage("Sessão removida!");
          } else if (!appointment.scheduledDate && sessionDate) {
            const dateStr = formatDateKey(sessionDate);
            const skipDates = [...(appointment.skipDates || []), dateStr];
            await api.updateAppointment(appointment.id, { skipDates });
            setSuccessMessage("Agendamento removido!");
          } else {
            await api.deleteAppointment(appointment.id);
            setSuccessMessage("Agendamento removido!");
          }
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
          onClose();
          onUpdate?.();
        } catch (error) {
          console.error("Erro ao remover:", error);
          setSuccessMessage(error.message || "Erro ao remover agendamento");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const phone = patient?.phone?.replace(/\D/g, "") || "";
  const initials = (patient?.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  // Usando variáveis CSS dinâmicas do Design System para evitar piscadas no dark mode
  const statusAvatarStyle = {
    presente:    { bg: "var(--status-presente-bg)",    color: "var(--status-presente-text)" },
    falta:       { bg: "var(--status-falta-bg)",       color: "var(--status-falta-text)" },
    justificada: { bg: "var(--status-justificada-bg)", color: "var(--status-justificada-text)" },
  };

  const statusLabels = {
    presente: "Realizado",
    falta: "Falta",
    justificada: "Justificada",
  };

  const currentStatus = existingAtt?.status;
  const avatarStyle = statusAvatarStyle[currentStatus] || { bg: "var(--surface-alt)", color: "var(--text-muted)" };

  const whatsappText = `Olá ${patient?.name?.split(" ")[0] || ""}, lembrete da sua consulta no dia ${sessionDate ? format(sessionDate, "dd/MM") : ""} às ${appointment.time}.`;

  return createPortal(
    <>
      {/* ── Modal Principal ── */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[60]" onClick={onClose}>
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] w-full max-w-sm mx-4 shadow-2xl animate-scale-in overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ── HEADER ── */}
          <div className="relative px-6 pt-6 pb-5 overflow-hidden">
            {/* Blob decorativo no canto */}
            <div
              className="absolute -top-8 -right-8 w-[120px] h-[120px] rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ backgroundColor: avatarStyle.color }}
            />

            {/* Fechar */}
            <button
              onClick={onClose}
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
                style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.color }}
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
                  className="inline-flex items-center gap-1 px-[10px] py-[3px] rounded-[999px] text-[10px] font-extrabold uppercase tracking-widest mt-1"
                  style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.color }}
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
                {sessionDate ? format(sessionDate, "dd/MM/yyyy", { locale: ptBR }) : ""} às {appointment.time}
              </span>
              <span
                className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[6px]"
                style={{ background: "var(--border)", color: "var(--text-muted)" }}
              >
                {appointment.duration} min
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* ── SEÇÃO STATUS ── */}
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Status do Atendimento
            </p>

            {/* 3 botões lado a lado com cores próprias */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {/* Presença — Verde */}
              <button
                onClick={() => handleQuickStatus(appointment, "presente", sessionDate)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] font-bold text-[11px] transition-all duration-200"
                style={currentStatus === "presente"
                  ? { background: "#5CBF9D", color: "white", border: "2px solid #5CBF9D", boxShadow: "0 4px 12px rgba(92,191,157,0.35)" }
                  : { background: "var(--sage-light)", color: "var(--dark-green)", border: "2px solid transparent" }
                }
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: currentStatus === "presente" ? "rgba(255,255,255,0.25)" : "var(--sage)" }}
                >
                  <Check size={16} color={currentStatus === "presente" ? "white" : "white"} />
                </span>
                Presença
              </button>

              {/* Falta — Vermelho */}
              <button
                onClick={() => handleQuickStatus(appointment, "falta", sessionDate)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] font-bold text-[11px] transition-all duration-200"
                style={currentStatus === "falta"
                  ? { background: "#EF4444", color: "white", border: "2px solid #EF4444", boxShadow: "0 4px 12px rgba(239,68,68,0.35)" }
                  : { background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "2px solid transparent" }
                }
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: currentStatus === "falta" ? "rgba(255,255,255,0.25)" : "rgba(239,68,68,0.15)" }}
                >
                  <X size={16} color={currentStatus === "falta" ? "white" : "#DC2626"} />
                </span>
                Falta
              </button>

              {/* Justificado — Âmbar */}
              <button
                onClick={() => handleQuickStatus(appointment, "justificada", sessionDate)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] font-bold text-[11px] transition-all duration-200"
                style={currentStatus === "justificada"
                  ? { background: "#F59E0B", color: "white", border: "2px solid #F59E0B", boxShadow: "0 4px 12px rgba(245,158,11,0.35)" }
                  : { background: "rgba(245,158,11,0.1)", color: "#B45309", border: "2px solid transparent" }
                }
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: currentStatus === "justificada" ? "rgba(255,255,255,0.25)" : "rgba(245,158,11,0.2)" }}
                >
                  <AlertCircle size={16} color={currentStatus === "justificada" ? "white" : "#B45309"} />
                </span>
                Justificado
              </button>
            </div>

            {/* ── AÇÕES ── */}
            <div className="space-y-2 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              {/* WhatsApp */}
              <a
                href={`https://wa.me/55${phone}?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full py-[11px] px-4 rounded-[12px] text-[12px] font-semibold"
                style={{ background: "var(--blue-light)", color: "var(--status-confirmado-text)", border: "1px solid var(--blue-light)" }}
              >
                <MessageCircle size={15} />
                <span>Lembrete WhatsApp</span>
              </a>

              {/* Prontuário */}
              <button
                onClick={() => { onClose(); navigate(`/patients/${patient?.id}`); }}
                className="flex items-center gap-3 w-full py-[11px] px-4 rounded-[12px] text-[12px] font-semibold"
                style={{ background: "var(--surface-alt)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              >
                <ExternalLink size={15} />
                <span>Ir para Prontuário</span>
              </button>

              {/* Excluir */}
              <button
                onClick={handleDeleteAppointment}
                className="flex items-center gap-3 w-full py-[11px] px-4 rounded-[12px] text-[12px] font-semibold"
                style={{ background: "rgba(239,68,68,0.07)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <Trash2 size={15} />
                <span>Excluir Agendamento</span>
              </button>
            </div>

            {/* Fechar — texto simples */}
            <button
              onClick={onClose}
              className="w-full mt-3 py-2 text-[11px] font-bold uppercase tracking-wider text-center"
              style={{ color: "var(--text-muted)" }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {justModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setJustModal({ ...justModal, open: false })}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${justModal.isEdit ? "bg-[var(--purple-light)] text-[var(--purple)]" : "bg-[var(--surface-alt)] text-[var(--text-secondary)]"}`}>
                {justModal.isEdit ? <AlertCircle size={24} /> : <BookOpen size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] font-heading uppercase tracking-tight">
                  {justModal.isEdit ? "Justificar Falta" : "Detalhes da Sessão"}
                </h2>
                <p className="text-xs font-bold text-[var(--text-muted)]">{justModal.patient?.name}</p>
              </div>
            </div>

            {justModal.isEdit && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Tipo de Justificativa</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setJustType("reagendar"); setJustData(prev => ({ ...prev, date: "", time: "" })); }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border-2 ${
                        justType === "reagendar"
                          ? "bg-[var(--purple)] text-white border-[var(--purple)] shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--purple)]"
                      }`}
                    >
                      Reagendar
                    </button>
                    <button
                      onClick={() => setJustType("cancelar")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border-2 ${
                        justType === "cancelar"
                          ? "bg-[var(--purple)] text-white border-[var(--purple)] shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--purple)]"
                      }`}
                    >
                      Apenas cancelar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Motivo</label>
                  <textarea
                    value={justData.notes}
                    onChange={e => setJustData({ ...justData, notes: e.target.value })}
                    placeholder="Ex: Férias, doença, viagem..."
                    className="w-full px-4 py-3 bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] focus:bg-[var(--surface)] rounded-2xl focus:ring-2 focus:ring-[var(--sage)] focus:border-transparent transition-all h-24 resize-none text-sm font-medium"
                  />
                </div>
                {justType === "reagendar" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Nova Data</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={justData.date || ""}
                        onChange={e => setJustData({ ...justData, date: e.target.value })}
                        className="w-full px-4 py-3 bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] focus:bg-[var(--surface)] rounded-2xl focus:ring-2 focus:ring-[var(--sage)] focus:border-transparent transition-all text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Horário</label>
                      <select
                        value={justData.time || ""}
                        onChange={e => setJustData({ ...justData, time: e.target.value })}
                        className="w-full px-4 py-3 bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] focus:bg-[var(--surface)] rounded-2xl focus:ring-2 focus:ring-[var(--sage)] focus:border-transparent transition-all text-sm font-medium"
                      >
                        <option value="">--:--</option>
                        {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-8 border-t border-[var(--border)] pt-4">
                  <button onClick={() => setJustModal({ ...justModal, open: false })} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    Fechar
                  </button>
                  {justModal.existingAtt && (
                    <button onClick={deleteJustification} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-xs font-bold uppercase tracking-widest">
                      Excluir
                    </button>
                  )}
                  <button onClick={saveJustificada} className="flex-1 py-3 bg-[var(--dark-green)] text-white rounded-xl hover:opacity-90 transition-all text-xs font-bold uppercase tracking-widest">
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => !confirmModal.loading && setConfirmModal({ ...confirmModal, open: false })}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] font-heading text-center uppercase tracking-tight mb-3">{confirmModal.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed font-medium mb-8">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                disabled={confirmModal.loading}
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--surface-alt)] rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={confirmModal.loading}
                onClick={confirmModal.onConfirm}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center"
              >
                {confirmModal.loading ? <RefreshCcw size={16} className="animate-spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-up">
          <div className="bg-[var(--sage)] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-[var(--sage)]/50 backdrop-blur-sm">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <p className="text-sm font-bold tracking-tight">{successMessage}</p>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

