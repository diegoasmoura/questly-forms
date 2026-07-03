import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatPhone } from "../lib/utils";
import { Clock, Phone, MessageCircle, Check, X, AlertCircle, Trash2, AlertTriangle, BookOpen, RefreshCcw, ExternalLink, CalendarClock, XCircle, ArrowLeft } from "lucide-react";
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

      setJustType(existing?.status === "justificada" ? (reschedDate ? "reagendar" : "cancelar") : "reagendar");
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
        setJustModal(prev => ({ ...prev, open: false }));
      } else {
        await api.saveAttendance({
          ...(existing ? { id: existing.id } : {}),
          patientId: appt.patientId,
          date: date.toISOString(),
          status,
          sessionTime: appt.time
        });
        const fresh = await api.getAttendances();
        setAttendances(fresh);
        setSuccessMessage(status === "presente" ? "Presença confirmada!" : "Falta registrada!");
        setJustModal(prev => ({ ...prev, open: false }));
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
          onClose(); // Fecha o modal principal por completo
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
      // Se estamos editando uma justificativa existente, apagamos os reagendamentos filhos antigos antes de criar os novos
      if (justModal.existingAtt && justModal.existingAtt.status === "justificada") {
        const data = await fetchDescendants(justModal.existingAtt.id);
        if (data && data.descendants) {
          for (const item of data.descendants) {
            await api.deleteAttendance(item.id);
          }
        }
      }

      const notes = newDateStr
        ? `Falta justificada. Reagendado para ${newDateStr} às ${newTimeStr || "08:00"}. Motivo: ${motivo}`
        : motivo;

      const sessionTime = newDateStr ? (newTimeStr || "08:00") : (justModal.appointment?.time || null);

      const originalResult = await api.saveAttendance({
        ...(justModal.existingAtt ? { id: justModal.existingAtt.id } : {}),
        patientId: justModal.appointment.patientId,
        date: originalDate.toISOString(),
        status: "justificada",
        notes,
        sessionTime
      });

      const parentId = originalResult?.id || justModal.existingAtt?.id;

      if (newDateStr && parentId) {
        const dateToSave = new Date(newDateStr + "T" + (newTimeStr || "08:00") + ":00");
        await api.saveAttendance({
          patientId: justModal.appointment.patientId,
          date: dateToSave.toISOString(),
          status: "",
          notes: `Reagendamento da sessão de ${originalDate.toLocaleDateString("pt-BR")}. ${motivo}`,
          sessionTime: newTimeStr || "08:00",
          parentId: parentId
        });
      }

      setSuccessMessage(newDateStr ? `Sessão reagendada para ${newDateStr}` : "Falta justificada registrada!");
      const fresh = await api.getAttendances();
      setAttendances(fresh);
      setJustModal({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
      onClose(); // Fecha o modal principal por completo
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

  // Mesma lógica do TimelineRow: 2 primeiros caracteres do nome (ex: "Jhersyka" → "JH")
  const patientName = patient?.name || "Paciente";
  const cleanName = patientName.trim();
  const initials = cleanName.length >= 2 ? cleanName.substring(0, 2).toUpperCase() : cleanName.toUpperCase();

  // Mesma paleta e hash determinístico do TimelineRow
  const avatarColors = [
    { bg: "var(--sage-light)",   text: "var(--dark-green)" },
    { bg: "var(--blue-light)",   text: "var(--blue)" },
    { bg: "var(--peach-light)",  text: "var(--peach)" },
    { bg: "var(--purple-light)", text: "var(--purple)" },
  ];
  let hash = 0;
  for (let i = 0; i < patientName.length; i++) {
    hash = patientName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const avatarStyle = avatarColors[Math.abs(hash) % avatarColors.length];

  const statusLabels = {
    presente: "Realizado",
    falta: "Falta",
    justificada: "Justificada",
  };

  const currentStatus = existingAtt?.status;
  const isActivePresente = !justModal.open && currentStatus === "presente";
  const isActiveFalta = !justModal.open && currentStatus === "falta";
  const isActiveJustificado = justModal.open || currentStatus === "justificada";

  const whatsappText = `Olá ${patient?.name?.split(" ")[0] || ""}, lembrete da sua consulta no dia ${sessionDate ? format(sessionDate, "dd/MM") : ""} às ${appointment.time}.`;

  return createPortal(
    <>
      {/* ── Modal Principal ── (ocultado se o modal de justificativa estiver ativo) */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[60]"
        onClick={onClose}
      >
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] w-full max-w-sm mx-4 shadow-2xl animate-scale-in overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ── HEADER ── */}
          <div className="relative px-6 pt-6 pb-5 overflow-hidden">
            {/* Blob decorativo no canto */}
            <div
              className="absolute -top-8 -right-8 w-[120px] h-[120px] rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ backgroundColor: avatarStyle.text }}
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
                style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
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
                  style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
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
                style={isActivePresente
                  ? { background: "var(--chip-presente-bg)", color: "var(--chip-presente-text)", border: "2px solid #5CBF9D" }
                  : { background: "var(--chip-presente-bg)", color: "var(--chip-presente-text)", border: "2px solid transparent" }
                }
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: isActivePresente ? "#5CBF9D" : "rgba(92,191,157,0.15)" }}
                >
                  <Check size={16} color={isActivePresente ? "white" : "var(--chip-presente-text)"} strokeWidth={2} />
                </span>
                Presença
              </button>

              {/* Falta — Vermelho */}
              <button
                onClick={() => handleQuickStatus(appointment, "falta", sessionDate)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] font-bold text-[11px] transition-all duration-200"
                style={isActiveFalta
                  ? { background: "var(--chip-falta-bg)", color: "var(--chip-falta-text)", border: "2px solid #EF4444" }
                  : { background: "var(--chip-falta-bg)", color: "var(--chip-falta-text)", border: "2px solid transparent" }
                }
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: isActiveFalta ? "#EF4444" : "rgba(239,68,68,0.15)" }}
                >
                  <X size={16} color={isActiveFalta ? "white" : "var(--chip-falta-text)"} strokeWidth={2} />
                </span>
                Falta
              </button>

              {/* Justificado — Âmbar */}
              <button
                onClick={() => handleQuickStatus(appointment, "justificada", sessionDate)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] font-bold text-[11px] transition-all duration-200"
                style={isActiveJustificado
                  ? { background: "var(--chip-justificado-bg)", color: "var(--chip-justificado-text)", border: "2px solid #F59E0B" }
                  : { background: "var(--chip-justificado-bg)", color: "var(--chip-justificado-text)", border: "2px solid transparent" }
                }
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: isActiveJustificado ? "#F59E0B" : "rgba(245,158,11,0.15)" }}
                >
                  <AlertCircle size={16} color={isActiveJustificado ? "white" : "var(--chip-justificado-text)"} strokeWidth={2} />
                </span>
                Justificado
              </button>
            </div>

            {/* ── EXPANSÃO DE JUSTIFICATIVA (PROGRESSIVE DISCLOSURE) ── */}
            {justModal.open && (
              <div className="animate-slide-down space-y-4 pt-5 mb-2 border-t border-[var(--border)]">
                {/* Tipo */}
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-2.5" style={{ color: "var(--text-muted)" }}>
                    Tipo de Justificativa
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Remarcar Sessão — Âmbar (Justificado) */}
                    <button
                      onClick={() => { setJustType("reagendar"); setJustData(prev => ({ ...prev, date: "", time: "" })); }}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] font-bold text-[11px] transition-all duration-200"
                      style={justType === "reagendar"
                        ? { background: "var(--chip-justificado-bg)", color: "var(--chip-justificado-text)", border: "2px solid #F59E0B" }
                        : { background: "var(--chip-justificado-bg)", color: "var(--chip-justificado-text)", border: "2px solid transparent" }
                      }
                    >
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: justType === "reagendar" ? "#F59E0B" : "rgba(245,158,11,0.15)" }}
                      >
                        <CalendarClock size={16} color={justType === "reagendar" ? "white" : "var(--chip-justificado-text)"} strokeWidth={2} />
                      </span>
                      Remarcar Sessão
                    </button>

                    {/* Cancelar — Vermelho (Falta) */}
                    <button
                      onClick={() => setJustType("cancelar")}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[14px] font-bold text-[11px] transition-all duration-200"
                      style={justType === "cancelar"
                        ? { background: "var(--chip-falta-bg)", color: "var(--chip-falta-text)", border: "2px solid #EF4444" }
                        : { background: "var(--chip-falta-bg)", color: "var(--chip-falta-text)", border: "2px solid transparent" }
                      }
                    >
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: justType === "cancelar" ? "#EF4444" : "rgba(239,68,68,0.15)" }}
                      >
                        <X size={16} color={justType === "cancelar" ? "white" : "var(--chip-falta-text)"} strokeWidth={2} />
                      </span>
                      Cancelar (Abonar)
                    </button>
                  </div>
                </div>

                {/* Motivo */}
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--text-muted)" }}>
                    Motivo
                  </p>
                  <textarea
                    value={justData.notes}
                    onChange={e => setJustData({ ...justData, notes: e.target.value })}
                    placeholder="Ex: Férias, doença, viagem..."
                    className="w-full px-4 py-3 rounded-[14px] resize-none text-[13px] font-medium h-24 focus:outline-none"
                    style={{
                      background: "var(--surface-alt)",
                      border: "1px solid var(--btn-action-neutral-border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Nova Data/Horário — só aparece se Reagendar */}
                {justType === "reagendar" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--text-muted)" }}>
                        Nova Data
                      </p>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={justData.date || ""}
                        onChange={e => setJustData({ ...justData, date: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-[12px] text-[13px] font-medium focus:outline-none"
                        style={{
                          background: "var(--surface-alt)",
                          border: "1px solid var(--btn-action-neutral-border)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--text-muted)" }}>
                        Horário
                      </p>
                      <select
                        value={justData.time || ""}
                        onChange={e => setJustData({ ...justData, time: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-[12px] text-[13px] font-medium focus:outline-none"
                        style={{
                          background: "var(--surface-alt)",
                          border: "1px solid var(--btn-action-neutral-border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="">--:--</option>
                        {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Confirmar */}
                <div className="pt-2">
                  <button
                    onClick={saveJustificada}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-[14px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--sage)" }}
                  >
                    <Check size={15} strokeWidth={2} />
                    Confirmar
                  </button>
                </div>
              </div>
            )}

            {/* ── AÇÕES (Escondidas se o Justificar estiver aberto) ── */}
            {!justModal.open && (
              <div className="pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/55${phone}?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-start gap-3 w-full py-3 px-4 rounded-[14px] font-semibold text-[13px]"
                style={{
                  background: "var(--surface-alt)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--btn-action-neutral-border)",
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Lembrete WhatsApp
              </a>

              {/* Prontuário */}
              <button
                onClick={() => { onClose(); navigate(`/patients/${patient?.id}`); }}
                className="flex items-center justify-start gap-3 w-full py-3 px-4 rounded-[14px] font-semibold text-[13px]"
                style={{
                  background: "var(--surface-alt)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--btn-action-neutral-border)",
                }}
              >
                <ExternalLink size={18} strokeWidth={2} style={{ color: "var(--text-muted)" }} />
                Ir para Prontuário
              </button>

              {/* Excluir */}
              <button
                onClick={handleDeleteAppointment}
                className="flex items-center justify-start gap-3 w-full py-3 px-4 rounded-[14px] font-semibold text-[13px]"
                style={{
                  background: "var(--surface-alt)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--btn-action-neutral-border)",
                }}
              >
                <Trash2 size={18} strokeWidth={2} style={{ color: "var(--text-muted)" }} />
                Excluir Agendamento
              </button>
              </div>
            )}


            {/* Fechar */}
            <button
              onClick={onClose}
              className="w-full mt-3 py-2 text-[12px] font-medium text-center"
              style={{ color: "var(--text-muted)" }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>



      )}


      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[80]" onClick={() => !confirmModal.loading && setConfirmModal({ ...confirmModal, open: false })}>
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

