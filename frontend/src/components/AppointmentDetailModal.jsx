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

  const statusColors = {
    presente: "bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[#5CBF9D]",
    falta: "bg-[var(--peach-light)] text-[var(--peach)]",
    justificada: "bg-[var(--purple-light)] text-[var(--purple)]",
  };

  const statusBadgeColors = {
    presente: "bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[#5CBF9D]",
    falta: "bg-[var(--peach-light)] text-[var(--peach)]",
    justificada: "bg-[var(--purple-light)] text-[var(--purple)]",
  };

  const statusLabels = {
    presente: "Realizado",
    falta: "Falta",
    justificada: "Justificada",
  };

  const currentStatus = existingAtt?.status;

  const whatsappText = `Olá ${patient?.name?.split(" ")[0] || ""}, lembrete da sua consulta no dia ${sessionDate ? format(sessionDate, "dd/MM") : ""} às ${appointment.time}.`;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${statusColors[currentStatus] || "bg-[var(--surface-alt)] text-[var(--text-secondary)]"}`}>
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] font-heading leading-tight">{patient?.name || "Paciente"}</h2>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mt-1 ${statusBadgeColors[currentStatus] || "bg-[var(--surface-alt)] text-[var(--text-muted)]"}`}>
                  {statusLabels[currentStatus] || "Agendado"}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shrink-0">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 mb-6 p-4 bg-[var(--surface-alt)] border border-[var(--border)] rounded-2xl">
            <div className="flex items-center gap-3">
              <Clock size={15} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                {sessionDate ? format(sessionDate, "dd/MM/yyyy", { locale: ptBR }) : ""} às {appointment.time} ({appointment.duration} min)
              </span>
            </div>
            {patient?.phone && (
              <div className="flex items-center gap-3">
                <Phone size={15} className="text-[var(--text-muted)] shrink-0" />
                <span className="text-sm font-semibold text-[var(--text-secondary)]">{formatPhone(patient.phone)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Status do Atendimento</p>
            <button
              onClick={() => handleQuickStatus(appointment, "presente", sessionDate)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-3 ${
                currentStatus === "presente"
                  ? "bg-[var(--sage)] text-white border-[var(--sage)] shadow-sm"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--sage)] hover:text-[var(--dark-green)] dark:hover:text-[#5CBF9D]"
              }`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentStatus === "presente" ? "border-white" : "border-[var(--border)]"}`}>
                {currentStatus === "presente" && <Check size={12} />}
              </span>
              Presença
            </button>
            <button
              onClick={() => handleQuickStatus(appointment, "falta", sessionDate)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-3 ${
                currentStatus === "falta"
                  ? "bg-[var(--peach)] text-white border-[var(--peach)] shadow-sm"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--peach)] hover:text-[var(--peach)]"
              }`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentStatus === "falta" ? "border-white" : "border-[var(--border)]"}`}>
                {currentStatus === "falta" && <X size={12} />}
              </span>
              Falta
            </button>
            <button
              onClick={() => handleQuickStatus(appointment, "justificada", sessionDate)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border-2 flex items-center gap-3 ${
                currentStatus === "justificada"
                  ? "bg-[var(--purple)] text-white border-[var(--purple)] shadow-sm"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--purple)] hover:text-[var(--purple)]"
              }`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentStatus === "justificada" ? "border-white" : "border-[var(--border)]"}`}>
                {currentStatus === "justificada" && <AlertCircle size={12} />}
              </span>
              Justificado
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-[var(--border)] space-y-2">
            <a
              href={`https://wa.me/55${phone}?text=${encodeURIComponent(whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[var(--blue-light)] text-[var(--blue)] rounded-xl hover:opacity-90 transition-all text-xs font-bold uppercase tracking-widest border border-[var(--blue)]/20"
            >
              <MessageCircle size={15} />
              Lembrete WhatsApp
            </a>
            <button
              onClick={() => { onClose(); navigate(`/patients/${patient?.id}`); }}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[var(--surface-alt)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition-all text-xs font-bold uppercase tracking-widest border border-[var(--border)]"
            >
              <ExternalLink size={15} />
              Ir para Prontuário
            </button>
            <button
              onClick={handleDeleteAppointment}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-xs font-bold uppercase tracking-widest border border-red-500/20"
            >
              <Trash2 size={15} />
              Excluir Agendamento
            </button>
          </div>
          <button onClick={onClose} className="w-full mt-5 py-3 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">
            Fechar
          </button>
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

