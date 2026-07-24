import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import { toast } from "../components/Toast";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  X,
  AlertCircle,
  RefreshCcw,
  BookOpen,
  AlertTriangle,
  Plus,
  Pencil,
  UserCheck,
  UserX,
  Trash2
} from "lucide-react";
import { getAvatarProps, KpiCard } from "../components/dashboard/Shared";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDateKey(date) {
  if (!date) return "";
  if (typeof date === "string") return date.split("T")[0];
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extractUTCDate(dateStr) {
  if (!dateStr) return "";
  if (typeof dateStr === "string") return dateStr.split("T")[0];
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function parseLocalDateStr(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}



function StatsBar({ appointments, attendances }) {
  const presentCount = attendances.filter(a => a.status === "presente").length;
  const absentCount = attendances.filter(a => a.status === "falta").length;
  const justifiedCount = attendances.filter(a => a.status === "justificada").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 shrink-0">
      <KpiCard
        compact
        icon={<Calendar size={14} />}
        iconBg="var(--blue-light)"
        iconColor="var(--blue)"
        label="Agendamentos"
        value={appointments.length}
      />
      <KpiCard
        compact
        icon={<UserCheck size={14} />}
        iconBg="var(--status-presente-bg)"
        iconColor="var(--status-presente-text)"
        label="Presenças"
        value={presentCount}
      />
      <KpiCard
        compact
        icon={<UserX size={14} />}
        iconBg="var(--peach-light)"
        iconColor="var(--peach)"
        label="Faltas"
        value={absentCount}
      />
      <KpiCard
        compact
        icon={<AlertCircle size={14} />}
        iconBg="var(--purple-light)"
        iconColor="var(--purple)"
        label="Justificadas"
        value={justifiedCount}
      />
    </div>
  );
}

function SessionCard({ session, date, onClick }) {
  const appointment = session.app;
  const attendance = session.attendance;
  const patientName = appointment.patient?.name || "Paciente";
  const attendanceStatus = attendance?.status;

  const statusStyles = {
    presente: "border-[var(--sage)] bg-[var(--status-presente-bg)]/30 text-[var(--status-presente-text)] shadow-sm",
    falta: "border-[#EF4444] bg-[var(--status-falta-bg)] text-[var(--status-falta-text)] shadow-sm",
    justificada: "border-[var(--purple)] bg-[var(--status-justificada-bg)]/30 text-[var(--status-justificada-text)] shadow-sm",
    default: "border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--sage)] text-[var(--text-primary)] shadow-sm"
  };

  const { initials, color: avatarColor } = getAvatarProps(patientName);
  const firstName = patientName.split(" ")[0] || "?";

  return (
    <div
      onClick={() => onClick(session, date)}
      className={`flex items-center gap-3 p-3 rounded-[14px] border cursor-pointer transition-all shadow-sm ${statusStyles[attendanceStatus] || statusStyles.default}`}
    >
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center font-black text-sm shrink-0" style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate text-[var(--text-primary)]">{patientName}</p>
        <p className="text-[10px] font-bold text-[var(--text-secondary)]">
          {appointment.time} &bull; {appointment.duration}min
        </p>
        {appointment.patient?.phone && (
          <p className="text-[9px] font-medium text-[var(--text-muted)] mt-0.5">{appointment.patient.phone}</p>
        )}
      </div>
      <div className="shrink-0 ml-2">
        <span className={`w-2 h-2 rounded-full block ${
          attendanceStatus === "presente" ? "bg-[var(--sage)]" :
          attendanceStatus === "falta" ? "bg-[#EF4444]" :
          attendanceStatus === "justificada" ? "bg-[var(--purple)]" :
          "bg-[var(--border)]"
        }`} />
      </div>
    </div>
  );
}

export default function Agenda() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  const [appointments, setAppointments] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [justModal, setJustModal] = useState({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
  const [justData, setJustData] = useState({ date: "", time: "", notes: "" });
  const [justType, setJustType] = useState("reagendar");
  const [descendantsInfo, setDescendantsInfo] = useState({ count: 0, list: [] });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null, loading: false });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ patientId: "", time: "08:00", duration: 50, recurring: true, maxSessions: 0 });
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [showEditChoice, setShowEditChoice] = useState(false);
  const [editChoiceDate, setEditChoiceDate] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [agendaFormDate, setAgendaFormDate] = useState(null);
  const [agendaFormDayOfWeek, setAgendaFormDayOfWeek] = useState(null);
  const [agendaFormTime, setAgendaFormTime] = useState("08:00");
  const [agendaFormDuration, setAgendaFormDuration] = useState(50);
  const [agendaFormRecurring, setAgendaFormRecurring] = useState(true);
  const [agendaFormMaxSessions, setAgendaFormMaxSessions] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteChoice, setShowDeleteChoice] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, session: null, date: null });

  const calendarRef = useRef(null);
  const [fcTitle, setFcTitle] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showAddModal) {
      api.getPatients()
        .then(data => {
          const list = Array.isArray(data) ? data : (data?.data || data?.patients || []);
          setPatients(list);
        })
        .catch(err => console.error("Erro ao carregar pacientes ao abrir modal:", err));
    }
  }, [showAddModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, attsRes, patsRes] = await Promise.allSettled([
        api.getAppointments(),
        api.getAttendances(),
        api.getPatients()
      ]);

      const apps = appsRes.status === "fulfilled" && Array.isArray(appsRes.value) ? appsRes.value : [];
      const atts = attsRes.status === "fulfilled" && Array.isArray(attsRes.value) ? attsRes.value : [];
      const rawPats = patsRes.status === "fulfilled" ? patsRes.value : [];
      const pats = Array.isArray(rawPats) ? rawPats : (rawPats?.data || rawPats?.patients || []);

      setAppointments(apps);
      setAttendances(atts);
      setPatients(pats);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAttendance = async (appointment, status, sessionDate) => {
    if (!sessionDate) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const diff = (appointment.dayOfWeek - date.getDay() + 7) % 7;
      sessionDate = new Date(date.getTime() + diff * 86400000);
    }

    const dateStr = formatDateKey(sessionDate);
    const existingAtt = attendances.find(a => a.patientId === appointment.patientId && extractUTCDate(a.date) === dateStr);

    if (status === "justificada") {
      if (existingAtt) {
        fetchDescendants(existingAtt.id);
      } else {
        setDescendantsInfo({ count: 0, list: [] });
      }

      setJustModal({
        open: true,
        patient: appointment.patient,
        appointment,
        date: sessionDate,
        isEdit: true,
        existingAtt
      });

      let reschedDate = "";
      let reschedTime = "";
      if (existingAtt?.notes?.includes("Reagendado para ")) {
        const match = existingAtt.notes.match(/Reagendado para (\d{4}-\d{2}-\d{2})/);
        if (match) reschedDate = match[1];
        const timeMatch = existingAtt.notes.match(/Reagendado para \d{4}-\d{2}-\d{2} às (\d{2}:\d{2})/);
        if (timeMatch) reschedTime = timeMatch[1];
      } else if (existingAtt?.sessionTime) {
        reschedTime = existingAtt.sessionTime;
      }

      setJustType(existingAtt ? (reschedDate ? "reagendar" : "cancelar") : "reagendar");
      setJustData({ date: reschedDate, time: reschedTime, notes: existingAtt?.notes || "" });
      return;
    }

    try {
      if (existingAtt?.status === status) {
        if (existingAtt.parentId) {
          await api.saveAttendance({
            ...existingAtt,
            status: "",
            date: existingAtt.date,
          });
        } else {
          await api.deleteAttendance(existingAtt.id);
        }
        await loadData();
        setSuccessMessage("Status removido!");
      } else {
        await api.saveAttendance({
          patientId: appointment.patientId,
          date: sessionDate.toISOString(),
          status,
          sessionTime: appointment.time
        });
        await loadData();
        setSuccessMessage(status === "presente" ? "Presença confirmada!" : "Falta registrada!");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSuccessMessage("Erro ao salvar status");
    }
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
          await loadData();
          setJustModal({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
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
      await loadData();
      setJustModal({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSuccessMessage("Erro ao salvar justificativa");
    }
  };

  const handleAddAppointment = async () => {
    if (!addForm.patientId || !selectedDay) return;
    setSaving(true);
    try {
      const dayOfWeek = selectedDay.getDay();
      const payload = {
        patientId: addForm.patientId,
        dayOfWeek,
        time: addForm.time,
        duration: addForm.duration,
      };
      if (addForm.recurring) {
        payload.startDate = formatDateKey(selectedDay);
        payload.maxSessions = addForm.maxSessions || null;
      } else {
        payload.scheduledDate = formatDateKey(selectedDay);
      }
      await api.createAppointment(payload);
      toast("Agendamento criado com sucesso!", "success");
      setShowAddModal(false);
      setAddForm({ patientId: "", time: "08:00", duration: 50, recurring: true, maxSessions: 0 });
      await loadData();
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast(error.message || "Erro ao criar agendamento", "error");
    } finally {
      setSaving(false);
    }
  };

  const getDayAppointments = useCallback((date) => {
    if (!date) return [];
    const dayStr = formatDateKey(date);
    const dayOfWeek = date.getDay();

    const dayApps = appointments.filter(a => {
      if (a.dayOfWeek !== dayOfWeek) return false;
      if (a.startDate) {
        const startStr = extractUTCDate(a.startDate);
        if (dayStr < startStr) return false;
      }
      if (a.endDate && dayStr > extractUTCDate(a.endDate)) return false;
      if (a.scheduledDate && dayStr !== extractUTCDate(a.scheduledDate)) return false;
      if (a.skipDates?.includes(dayStr)) return false;
      if (a.maxSessions > 0 && a.startDate) {
        const start = parseLocalDateStr(a.startDate);
        let count = 0;
        const cursor = new Date(start);
        while (cursor <= date) {
          if (cursor.getDay() === a.dayOfWeek) count++;
          cursor.setDate(cursor.getDate() + 7);
        }
        if (count > a.maxSessions) return false;
      }
      return true;
    });

    const dayExtras = attendances.filter(att =>
      extractUTCDate(att.date) === dayStr &&
      appointments.some(app => app.patientId === att.patientId) &&
      !dayApps.some(app => app.patientId === att.patientId)
    );

    return [
      ...dayApps.map(app => ({
        type: "fixed",
        app,
        attendance: attendances.find(att => att.patientId === app.patientId && extractUTCDate(att.date) === dayStr)
      })),
      ...dayExtras.map(att => ({
        type: "extra",
        app: { id: att.id, patientId: att.patientId, time: att.sessionTime || "00:00", duration: 50, patient: att.patient },
        attendance: att
      }))
    ].sort((a, b) => (a.attendance?.sessionTime || a.app.time || "00:00").localeCompare(b.attendance?.sessionTime || b.app.time || "00:00"));
  }, [appointments, attendances]);

  const getMonthSessions = useCallback((month) => {
    if (!month) return [];
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);
      const sessions = getDayAppointments(date);
      if (sessions.length > 0) {
        result.push({ date, sessions });
      }
    }
    return result;
  }, [getDayAppointments]);

  const getMonthEvents = useCallback((month) => {
    if (!month || !appointments.length) return [];
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
    const events = [];

    const attMap = {};
    attendances.forEach(att => {
      const key = extractUTCDate(att.date);
      if (!attMap[key]) attMap[key] = {};
      attMap[key][att.patientId] = att;
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);
      const dateStr = formatDateKey(date);
      const dayOfWeek = date.getDay();

      appointments.forEach(app => {
        if (app.dayOfWeek !== dayOfWeek) return;
        if (app.startDate && dateStr < extractUTCDate(app.startDate)) return;
        if (app.endDate && dateStr > extractUTCDate(app.endDate)) return;
        if (app.scheduledDate && dateStr !== extractUTCDate(app.scheduledDate)) return;
        if (app.skipDates?.includes(dateStr)) return;
        if (app.maxSessions > 0 && app.startDate) {
          const start = parseLocalDateStr(app.startDate);
          let count = 0;
          const cursor = new Date(start);
          while (cursor <= date) {
            if (cursor.getDay() === app.dayOfWeek) count++;
            cursor.setDate(cursor.getDate() + 7);
          }
          if (count > app.maxSessions) return;
        }

        const [hours, minutes] = (app.time || "08:00").split(":").map(Number);
        const start = new Date(year, monthNum, day, hours, minutes);
        const end = new Date(start.getTime() + (app.duration || 50) * 60000);
        const att = attMap[dateStr]?.[app.patientId];

        events.push({
          id: `${app.id}-${dateStr}`,
          title: app.patient?.name || "Paciente",
          start,
          end,
          session: { type: "fixed", app, attendance: att }
        });
      });

      if (attMap[dateStr]) {
        Object.values(attMap[dateStr]).forEach(att => {
          const patientHasApp = appointments.some(app => app.patientId === att.patientId);
          if (patientHasApp && !appointments.some(app => app.patientId === att.patientId && app.dayOfWeek === dayOfWeek)) {
            const [h, m] = (att.sessionTime || "08:00").split(":").map(Number);
            const start = new Date(year, monthNum, day, h, m);
            const end = new Date(start.getTime() + 50 * 60000);
            events.push({
              id: `extra-${att.id}`,
              title: att.patient?.name || "Paciente",
              start,
              end,
              session: { type: "extra", app: { id: att.id, patientId: att.patientId, time: att.sessionTime || "00:00", duration: 50, patient: att.patient }, attendance: att }
            });
          }
        });
      }
    }
    return events;
  }, [appointments, attendances]);

  const handleEditClick = (app, date) => {
    if (!app.scheduledDate) {
      setEditingApp(app);
      setEditChoiceDate(date);
      setShowEditChoice(true);
      setEditMode(null);
    } else {
      openEditModal(app, date);
    }
  };

  const openEditModal = (app, date) => {
    setAgendaFormDate(date);
    setAgendaFormDayOfWeek(app.dayOfWeek);
    setAgendaFormTime(app.time);
    setAgendaFormDuration(app.duration);
    setAgendaFormRecurring(!app.scheduledDate);
    setAgendaFormMaxSessions(app.maxSessions || 0);
    setEditingApp(app);
    setShowEditChoice(false);
    setShowEditModal(true);
  };

  const handleEditSingle = () => {
    setEditMode("single");
    openEditModal(editingApp, editChoiceDate);
  };

  const handleEditFuture = () => {
    setEditMode("future");
    openEditModal(editingApp, editChoiceDate);
  };

  const handleSaveEditedSlot = async () => {
    if (!editingApp || !agendaFormDate) return;
    const dayOfWeek = agendaFormDayOfWeek ?? agendaFormDate.getDay();
    const dateStr = formatDateKey(agendaFormDate);
    setSaving(true);
    try {
      if (editMode === "single") {
        const skipDates = [...(editingApp.skipDates || []), dateStr];
        await api.updateAppointment(editingApp.id, { skipDates });
        const targetDate = dayOfWeek !== editingApp.dayOfWeek
          ? (() => { const d = new Date(agendaFormDate); while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() + 1); return d; })()
          : agendaFormDate;
        await api.createAppointment({
          patientId: editingApp.patientId,
          dayOfWeek,
          time: agendaFormTime,
          duration: agendaFormDuration,
          scheduledDate: formatDateKey(targetDate)
        });
      } else if (editMode === "future") {
        const prevDate = new Date(agendaFormDate);
        prevDate.setDate(prevDate.getDate() - 1);
        await api.updateAppointment(editingApp.id, { endDate: formatDateKey(prevDate) });
        await api.createAppointment({
          patientId: editingApp.patientId,
          dayOfWeek,
          time: agendaFormTime,
          duration: agendaFormDuration,
          startDate: dateStr,
          maxSessions: agendaFormMaxSessions || null
        });
      } else if (editingApp.scheduledDate) {
        await api.updateAppointment(editingApp.id, {
          dayOfWeek,
          time: agendaFormTime,
          duration: agendaFormDuration
        });
      }
      toast("Agendamento atualizado com sucesso!", "success");
      setShowEditModal(false);
      setEditingApp(null);
      setEditMode(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao editar:", error);
      toast(error.message || "Erro ao editar agendamento", "error");
    } finally {
      setSaving(false);
    }
  };

  const executeDirectDelete = (session, date) => {
    const isExtra = session.type === "extra";
    const patientName = session.app.patient?.name || "este paciente";

    setConfirmModal({
      open: true,
      title: isExtra ? "Excluir sessão" : "Excluir agendamento",
      message: isExtra
        ? `Tem certeza que deseja excluir a sessão de ${patientName}? Esta ação não pode ser desfeita.`
        : `Tem certeza que deseja excluir o agendamento de ${patientName} para esta data?`,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          if (isExtra) {
            await api.deleteAttendance(session.app.id);
            toast("Sessão extra removida!", "success");
          } else {
            await api.deleteAppointment(session.app.id);
            toast("Agendamento avulso removido!", "success");
          }
          await loadData();
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
        } catch (error) {
          console.error("Erro ao remover:", error);
          toast(error.message || "Erro ao remover agendamento", "error");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleDeleteSingleDate = async () => {
    if (!editingApp || !agendaFormDate) return;
    setSaving(true);
    try {
      const dateStr = formatDateKey(agendaFormDate);
      const skipDates = [...(editingApp.skipDates || []), dateStr];
      await api.updateAppointment(editingApp.id, { skipDates });
      toast("Esta data foi desmarcada!", "success");
      setShowDeleteChoice(false);
      setEditingApp(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao desmarcar data:", error);
      toast(error.message || "Erro ao desmarcar data", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeries = async () => {
    if (!editingApp) return;
    setConfirmModal({
      open: true,
      title: "Excluir série completa",
      message: `Tem certeza que deseja excluir toda a série recorrente de ${editingApp.patient?.name || "este paciente"} neste dia da semana?`,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await api.deleteAppointment(editingApp.id);
          toast("Série recorrente excluída!", "success");
          setShowDeleteChoice(false);
          setEditingApp(null);
          await loadData();
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
        } catch (error) {
          console.error("Erro ao excluir série:", error);
          toast(error.message || "Erro ao excluir série", "error");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleDeleteAllInTime = async () => {
    if (!editingApp) return;
    setConfirmModal({
      open: true,
      title: "Excluir em Lote",
      message: `Tem certeza que deseja excluir TODOS os agendamentos de ${editingApp.patient?.name || "este paciente"} às ${editingApp.time}? (Exclusão em lote por horário).`,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await api.deletePatientAppointmentsByTime(editingApp.patientId, editingApp.time);
          toast(`Agendamentos das ${editingApp.time} excluídos em lote!`, "success");
          setShowDeleteChoice(false);
          setEditingApp(null);
          await loadData();
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
        } catch (error) {
          console.error("Erro ao excluir em lote:", error);
          toast(error.message || "Erro ao excluir em lote", "error");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleDeleteAppointment = (session, date) => {
    const isExtra = session.type === "extra";
    const app = session.app;
    
    if (isExtra || app.scheduledDate) {
      executeDirectDelete(session, date);
    } else {
      setEditingApp(app);
      setAgendaFormDate(date);
      setShowDeleteChoice(true);
    }
  };

  const openDetailModal = (session, date) => {
    setDetailModal({ open: true, session, date });
  };

  const handleQuickStatus = async (session, status, sessionDate) => {
    const appointment = session.app;
    const date = sessionDate;

    setDetailModal({ open: false, session: null, date: null });

    if (status === "justificada") {
      handleAttendance(appointment, "justificada", date);
      return;
    }

    await handleAttendance(appointment, status, date);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam) {
      const newDate = new Date(dateParam);
      setCalendarDate(newDate);
      setSelectedDay(newDate);
    }
  }, []);

  const daySessions = useMemo(() => {
    return getDayAppointments(selectedDay);
  }, [selectedDay, getDayAppointments]);

  const monthSessions = useMemo(() => {
    return getMonthSessions(calendarDate);
  }, [calendarDate, getMonthSessions]);

  const monthEvents = useMemo(() => {
    return getMonthEvents(calendarDate);
  }, [calendarDate, getMonthEvents]);

  const calendarEvents = useMemo(() => {
    if (!appointments.length) return monthEvents;
    const rangeStart = new Date(calendarDate);
    rangeStart.setMonth(rangeStart.getMonth() - 3);
    const rangeEnd = new Date(calendarDate);
    rangeEnd.setMonth(rangeEnd.getMonth() + 4);
    const allEvents = [];
    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      const dateStr = formatDateKey(cursor);
      const dayOfWeek = cursor.getDay();
      appointments.forEach(app => {
        if (app.dayOfWeek !== dayOfWeek) return;
        if (app.startDate && dateStr < extractUTCDate(app.startDate)) return;
        if (app.endDate && dateStr > extractUTCDate(app.endDate)) return;
        if (app.scheduledDate && dateStr !== extractUTCDate(app.scheduledDate)) return;
        if (app.skipDates?.includes(dateStr)) return;
        if (app.maxSessions > 0 && app.startDate) {
          const start = parseLocalDateStr(app.startDate);
          let count = 0;
          const c = new Date(start);
          while (c <= cursor) {
            if (c.getDay() === app.dayOfWeek) count++;
            c.setDate(c.getDate() + 7);
          }
          if (count > app.maxSessions) return;
        }
        const [hours, minutes] = (app.time || "08:00").split(":").map(Number);
        const start = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), hours, minutes);
        const end = new Date(start.getTime() + (app.duration || 50) * 60000);
        const att = attendances.find(a => extractUTCDate(a.date) === dateStr && a.patientId === app.patientId);
        allEvents.push({
          id: `${app.id}-${dateStr}`,
          title: app.patient?.name || "Paciente",
          start,
          end,
          session: { type: "fixed", app, attendance: att }
        });
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return allEvents;
  }, [appointments, calendarDate, attendances, monthEvents]);

  const handleDatesSet = useCallback((arg) => {
    setFcTitle(arg.view.title);
    const newDate = new Date(arg.view.currentStart);
    if (newDate.getMonth() !== calendarDate.getMonth() || newDate.getFullYear() !== calendarDate.getFullYear()) {
      setCalendarDate(newDate);
    }
  }, [calendarDate]);

  const handleNav = (action) => {
    if (!calendarRef.current) return;
    const api = calendarRef.current.getApi();
    if (action === "PREV") api.prev();
    else if (action === "NEXT") api.next();
    else if (action === "TODAY") api.today();
  };

  const handleViewChange = (v) => {
    setCalendarView(v);
    if (!calendarRef.current) return;
    const api = calendarRef.current.getApi();
    if (v === "month") api.changeView("dayGridMonth");
    else if (v === "week") api.changeView("timeGridWeek");
    else api.changeView("timeGridDay");
  };

  const renderEventContent = (eventInfo) => {
    const { session } = eventInfo.event.extendedProps;
    const firstName = (eventInfo.event.title || "").split(" ")[0] || "?";
    const time = session?.app?.time || "";
    const status = session?.attendance?.status;
    let barColor = "bg-[var(--blue)]";
    if (status === "presente") barColor = "bg-[var(--sage)]";
    else if (status === "falta") barColor = "bg-[#EF4444]";
    else if (status === "justificada") barColor = "bg-[var(--purple)]";
    return (
      <div className="flex items-center gap-1.5 px-1 py-0.5 rounded-[6px] cursor-pointer transition-opacity overflow-hidden w-full">
        <div className={`w-1.5 h-full min-h-[16px] rounded-full shrink-0 ${barColor}`} />
        <span className="text-xs font-bold leading-tight truncate text-[var(--text-secondary)]">{firstName} {time}</span>
      </div>
    );
  };
  return (
    <div className="p-4 pb-36 md:p-6 h-full overflow-y-auto lg:overflow-hidden flex flex-col space-y-4 relative [&::-webkit-scrollbar]:hidden">

      <StatsBar appointments={appointments} attendances={attendances} />

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-full animate-fade-in">
            {/* Left: Calendar */}
            <div className="w-full lg:w-[75%] flex flex-col min-h-0">
              <div className="p-4 pb-3 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-card flex flex-col flex-1 h-[420px] lg:h-full overflow-hidden agenda-calendar">
                {/* Custom Toolbar */}
                <div className="shrink-0 mb-3 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex items-center gap-1 order-1 sm:order-none">
                    {["month", "week", "day"].map(v => (
                      <button
                        key={v}
                        onClick={() => handleViewChange(v)}
                        className={`text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-[10px] transition-all ${
                          calendarView === v
                            ? "bg-[var(--sage)] text-white shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--dark-green)] hover:bg-[var(--sage-light)]"
                        }`}
                      >
                        {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs sm:text-base md:text-lg font-black text-[var(--text-primary)] uppercase tracking-wide text-center order-3 sm:order-none w-full sm:w-auto mt-2 sm:mt-0 truncate capitalize">
                    {fcTitle}
                  </div>
                  <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-[10px] border border-[var(--border)] shadow-sm order-2 sm:order-none">
                    <button onClick={() => handleNav("PREV")} className="p-1 hover:bg-[var(--surface-alt)] rounded-[8px] transition-all text-[var(--text-secondary)]">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => handleNav("TODAY")} className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] rounded-[8px] transition-all">Hoje</button>
                    <button onClick={() => handleNav("NEXT")} className="p-1 hover:bg-[var(--surface-alt)] rounded-[8px] transition-all text-[var(--text-secondary)]">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden fc-custom-wrapper">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={ptBrLocale}
                    headerToolbar={false}
                    events={calendarEvents}
                    datesSet={handleDatesSet}
                    dateClick={(info) => setSelectedDay(info.date)}
                    eventClick={(info) => openDetailModal(info.event.extendedProps.session, info.event.start)}
                    eventContent={renderEventContent}
                    dayMaxEvents={true}
                    allDaySlot={false}
                    slotMinTime="06:00:00"
                    slotMaxTime="23:00:00"
                    height={isMobile ? "auto" : "100%"}
                    dayCellClassNames={(arg) => {
                      const dateStr = formatDateKey(arg.date);
                      const isSelected = selectedDay && dateStr === formatDateKey(selectedDay);
                      const isToday = dateStr === formatDateKey(new Date());
                      if (isSelected && !isToday) return ["fc-selected-day"];
                      return [];
                    }}
                  />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-[var(--border)] shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--sage)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Realizado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Falta</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--purple)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Justificada</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--blue)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Agendado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detail Panel */}
            <div className="w-full lg:w-[25%] flex flex-col gap-3 mb-4 lg:mb-0">
              <h3 className="text-[18px] font-bold font-heading text-[var(--text-primary)] shrink-0">Agendamentos</h3>
              <div className="flex-1 min-h-0">
                {selectedDay ? (
                  <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-card flex flex-col h-auto min-h-[300px] lg:h-full min-h-0">
                    <div className="flex items-start justify-between mb-4 shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">
                          {format(selectedDay, "EEEE", { locale: ptBR })}
                        </h4>
                        <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                          {format(selectedDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-bold rounded-[8px] shadow-sm">
                          {daySessions.length} {daySessions.length === 1 ? "SESSÃO" : "SESSÕES"}
                        </span>
                        <button
                          disabled={selectedDay && formatDateKey(selectedDay) < formatDateKey(new Date())}
                          onClick={() => setShowAddModal(true)}
                          className="w-[36px] h-[36px] bg-[var(--sage)] hover:bg-[var(--dark-green)] text-white rounded-[10px] flex items-center justify-center transition-all shadow-sm disabled:opacity-35 disabled:cursor-not-allowed"
                          title={selectedDay && formatDateKey(selectedDay) >= formatDateKey(new Date()) ? "Adicionar agendamento" : "Não é possível agendar em datas retroativas"}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 overflow-y-auto min-h-0 flex-1 pr-1.5 pb-20 lg:pb-2">
                      {daySessions.length === 0 ? (
                        <div className="py-10 text-center">
                          <Users size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nenhuma sessão neste dia</p>
                        </div>
                      ) : (
                        daySessions.map((session, idx) => (
                          <SessionCard
                            key={session.app.id + idx}
                            session={session}
                            date={selectedDay}
                            onClick={openDetailModal}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-card flex flex-col h-auto min-h-[300px] lg:h-full min-h-0">
                    <div className="flex items-start justify-between mb-4 shrink-0">
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">Visão do Mês</h4>
                        <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                          {format(calendarDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-bold rounded-[8px] shadow-sm">
                        {monthSessions.reduce((acc, d) => acc + d.sessions.length, 0)} SESSÕES
                      </span>
                    </div>
                    <div className="space-y-3 overflow-y-auto min-h-0 flex-1 pr-1.5 pb-20 lg:pb-2">
                      {monthSessions.length === 0 ? (
                        <div className="py-10 text-center">
                          <Calendar size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nenhuma sessão neste mês</p>
                        </div>
                      ) : (
                        monthSessions.map(({ date, sessions }) => (
                          <div key={formatDateKey(date)}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <button
                                onClick={() => setSelectedDay(date)}
                                className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest hover:text-[var(--sage)] transition-colors"
                              >
                                {format(date, "EEE dd/MM", { locale: ptBR })}
                              </button>
                              <div className="flex-1 border-t border-[var(--border)]" />
                            </div>
                            {sessions.map((session, idx) => {
                              const app = session.app;
                              const name = app.patient?.name || "Paciente";
                              const { initials, color: avatarColor } = getAvatarProps(name);
                              return (
                                <div
                                  key={app.id + idx}
                                  onClick={() => openDetailModal(session, date)}
                                  className="flex items-center gap-2 p-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--sage)] transition-all group cursor-pointer mb-1.5 shadow-sm"
                                >
                                  <div className="w-7 h-7 rounded-[8px] flex items-center justify-center font-black text-[9px] shrink-0" style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}>
                                    {initials}
                                  </div>
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate flex-1 min-w-0 group-hover:text-[var(--dark-green)] dark:group-hover:text-[var(--sage)] transition-colors">
                                    {name}
                                  </p>
                                  <span className="text-[10px] font-bold text-[var(--text-secondary)] shrink-0">{app.time} &bull; {app.duration}min</span>
                                  <ChevronRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--sage)] group-hover:translate-x-0.5 transition-all shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {justModal.open && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setJustModal({ ...justModal, open: false })}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${justModal.isEdit ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"}`}>
                {justModal.isEdit ? <AlertCircle size={24} /> : <BookOpen size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {justModal.isEdit ? "Justificar Falta" : "Detalhes da Sessão"}
                </h2>
                <p className="text-xs font-bold text-slate-500">{justModal.patient?.name}</p>
              </div>
            </div>

            {justModal.isEdit && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Justificativa</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setJustType("reagendar"); setJustData(prev => ({ ...prev, date: "", time: "" })); }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                        justType === "reagendar"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      Reagendar
                    </button>
                    <button
                      onClick={() => setJustType("cancelar")}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                        justType === "cancelar"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      Apenas cancelar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motivo</label>
                  <textarea
                    value={justData.notes}
                    onChange={e => setJustData({ ...justData, notes: e.target.value })}
                    placeholder="Ex: Férias, doença, viagem..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all h-24 resize-none text-sm font-medium"
                  />
                </div>
                {justType === "reagendar" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nova Data</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={justData.date || ""}
                          onChange={e => setJustData({ ...justData, date: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horário</label>
                        <select
                          value={justData.time || ""}
                          onChange={e => setJustData({ ...justData, time: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                        >
                          <option value="">--:--</option>
                          {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2 font-bold italic">* Deixe em branco se não houver data definida.</p>
                  </>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setJustModal({ ...justModal, open: false })}
                    className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Fechar
                  </button>
                  {justModal.existingAtt && (
                    <button
                      onClick={deleteJustification}
                      className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all text-xs font-black uppercase tracking-widest"
                    >
                      Excluir
                    </button>
                  )}
                  <button
                    onClick={saveJustificada}
                    className="flex-1 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {confirmModal.open && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => !confirmModal.loading && setConfirmModal({ ...confirmModal, open: false })}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight mb-3">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed font-medium mb-8">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                disabled={confirmModal.loading}
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={confirmModal.loading}
                onClick={confirmModal.onConfirm}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center"
              >
                {confirmModal.loading ? <RefreshCcw size={16} className="animate-spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[60]" onClick={() => setShowAddModal(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-8 w-full max-w-md mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[var(--surface-alt)] text-[var(--text-secondary)] rounded-[14px] flex items-center justify-center">
                <Plus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-[var(--text-primary)]">Novo Agendamento</h2>
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  {selectedDay ? format(selectedDay, "d 'de' MMMM", { locale: ptBR }) : ""}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2">Paciente</label>
                <select
                  value={addForm.patientId}
                  onChange={e => setAddForm({ ...addForm, patientId: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] focus:ring-2 focus:ring-[var(--sage)] focus:bg-[var(--surface)] text-[var(--text-primary)] transition-all text-sm font-medium"
                >
                  <option value="">Selecione um paciente</option>
                  {Array.isArray(patients) && patients.filter(p => p.isActive !== false).length > 0 ? (
                    patients.filter(p => p.isActive !== false).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {Array.isArray(patients) && patients.length > 0
                        ? "Nenhum paciente ativo encontrado"
                        : "Nenhum paciente cadastrado"}
                    </option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2">Horário</label>
                  <select
                    value={addForm.time}
                    onChange={e => setAddForm({ ...addForm, time: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] focus:ring-2 focus:ring-[var(--sage)] focus:bg-[var(--surface)] text-[var(--text-primary)] transition-all text-sm font-medium"
                  >
                    {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2">Duração</label>
                  <select
                    value={addForm.duration}
                    onChange={e => setAddForm({ ...addForm, duration: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] focus:ring-2 focus:ring-[var(--sage)] focus:bg-[var(--surface)] text-[var(--text-primary)] transition-all text-sm font-medium"
                  >
                    <option value={30}>30 min</option>
                    <option value={50}>50 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--surface-alt)] rounded-[14px] border border-[var(--border)]">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addForm.recurring}
                    onChange={e => setAddForm({ ...addForm, recurring: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-[var(--sage)] focus:ring-[var(--sage)]"
                  />
                  <div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      Repetir semanalmente
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">
                      Toda {["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][selectedDay ? selectedDay.getDay() : 0]}
                    </p>
                  </div>
                </label>
                {addForm.recurring && (
                  <div className="w-28">
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1">Nº Sessões</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[10px] text-xs font-bold text-center focus:ring-2 focus:ring-[var(--sage)] focus:border-[var(--sage)] text-[var(--text-primary)] transition-all"
                      value={addForm.maxSessions || ""}
                      onChange={e => setAddForm({ ...addForm, maxSessions: Math.max(0, parseInt(e.target.value) || 0) })}
                      placeholder="0 = ilimitado"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--surface-alt)] rounded-[12px] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddAppointment}
                  disabled={!addForm.patientId || saving}
                  className="flex-1 py-3 bg-[var(--sage)] text-white rounded-[12px] hover:bg-[var(--dark-green)] shadow-md transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? <RefreshCcw size={16} className="animate-spin" /> : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showEditChoice && editingApp && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[60]" onClick={() => { setShowEditChoice(false); setEditingApp(null); }}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-[var(--surface-alt)] flex items-center justify-center mx-auto mb-4">
                <Pencil size={22} className="text-[var(--text-secondary)]" />
              </div>
              <h3 className="text-lg font-bold font-heading text-[var(--text-primary)]">Editar horário</h3>
              <p className="text-sm font-semibold text-[var(--text-secondary)] mt-1">
                {format(editChoiceDate, "EEEE, d 'de' MMMM", { locale: ptBR })} às {editingApp.time}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
                Este horário se repete semanalmente. Como deseja editar?
              </p>
            </div>
            <div className="space-y-2">
              <button onClick={handleEditSingle} className="w-full py-3 px-4 bg-[var(--surface-alt)] text-[var(--text-primary)] border border-[var(--border)] rounded-[12px] text-xs font-bold uppercase tracking-widest hover:bg-[var(--border)] transition-all">
                Apenas esta data
              </button>
              <button onClick={handleEditFuture} className="w-full py-3 px-4 bg-[var(--sage)] text-white rounded-[12px] text-xs font-bold uppercase tracking-widest hover:bg-[var(--dark-green)] transition-all">
                Esta e todas futuras
              </button>
            </div>
            <button onClick={() => { setShowEditChoice(false); setEditingApp(null); }} className="w-full mt-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

      {showDeleteChoice && editingApp && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[60]" onClick={() => { setShowDeleteChoice(false); setEditingApp(null); }}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-[#EF4444]">
                <Trash2 size={22} />
              </div>
              <h3 className="text-lg font-bold font-heading text-[var(--text-primary)]">Excluir Agendamento</h3>
              <p className="text-sm font-semibold text-[var(--text-secondary)] mt-1">
                {editingApp.patient?.name || "Paciente"} &bull; {editingApp.time}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
                Este horário se repete semanalmente. Como deseja excluir?
              </p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={handleDeleteSingleDate} 
                disabled={saving}
                className="w-full py-3 px-4 bg-[var(--surface-alt)] text-[var(--text-primary)] border border-[var(--border)] rounded-[12px] text-xs font-bold uppercase tracking-widest hover:bg-[var(--border)] transition-all disabled:opacity-50"
              >
                Apenas esta data
              </button>
              <button 
                onClick={handleDeleteSeries} 
                className="w-full py-3 px-4 bg-[var(--peach-light)] text-[var(--peach)] border border-[var(--peach)]/25 rounded-[12px] text-xs font-bold uppercase tracking-widest hover:bg-[var(--peach)] hover:text-white transition-all"
              >
                Toda a série recorrente
              </button>
              <button 
                onClick={handleDeleteAllInTime} 
                className="w-full py-3 px-4 bg-[#EF4444] text-white rounded-[12px] text-xs font-bold uppercase tracking-widest hover:bg-red-600 shadow-md transition-all"
              >
                Todos os dias neste horário
              </button>
            </div>
            <button onClick={() => { setShowDeleteChoice(false); setEditingApp(null); }} className="w-full mt-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

      {showEditModal && agendaFormDate && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center z-[60]" onClick={() => { setShowEditModal(false); setEditingApp(null); setEditMode(null); }}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-8 w-full max-w-lg mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">Editar Agendamento</h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">
                  {format(agendaFormDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingApp(null); setEditMode(null); }} className="p-1.5 rounded-[10px] bg-[var(--surface-alt)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Dia</label>
                  <select className="w-full px-3 py-2.5 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] text-sm font-semibold focus:ring-2 focus:ring-[var(--sage)] focus:bg-[var(--surface)] text-[var(--text-primary)] transition-all"
                    value={agendaFormDayOfWeek ?? (agendaFormDate?.getDay() ?? 1)}
                    onChange={e => setAgendaFormDayOfWeek(parseInt(e.target.value))}>
                    {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Horário</label>
                  <select className="w-full px-3 py-2.5 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] text-sm font-semibold focus:ring-2 focus:ring-[var(--sage)] focus:bg-[var(--surface)] text-[var(--text-primary)] transition-all"
                    value={agendaFormTime}
                    onChange={e => setAgendaFormTime(e.target.value)}>
                    {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Duração</label>
                  <select className="w-full px-3 py-2.5 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[12px] text-sm font-semibold focus:ring-2 focus:ring-[var(--sage)] focus:bg-[var(--surface)] text-[var(--text-primary)] transition-all"
                    value={agendaFormDuration}
                    onChange={e => setAgendaFormDuration(parseInt(e.target.value))}>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={50}>50 minutos</option>
                    <option value={60}>60 minutos</option>
                    <option value={90}>90 minutos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--surface-alt)] rounded-[14px] border border-[var(--border)]">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={agendaFormRecurring} onChange={e => setAgendaFormRecurring(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[var(--sage)] focus:ring-[var(--sage)]" />
                  <div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">Repetir semanalmente</span>
                    <p className="text-[10px] font-medium text-[var(--text-muted)]">
                      Toda {["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][agendaFormDate.getDay()]}
                    </p>
                  </div>
                </label>
                {agendaFormRecurring && (
                  <div className="w-28">
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1">Nº Sessões</label>
                    <input type="number" min={0}
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[10px] text-xs font-bold text-center focus:ring-2 focus:ring-[var(--sage)] focus:border-[var(--sage)] text-[var(--text-primary)] transition-all"
                      value={agendaFormMaxSessions || ""}
                      onChange={e => setAgendaFormMaxSessions(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0 = ilimitado" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button onClick={() => { setShowEditModal(false); setEditingApp(null); setEditMode(null); }}
                className="px-5 py-2.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-all">
                Cancelar
              </button>
              <button onClick={handleSaveEditedSlot} disabled={saving}
                className="px-6 py-2.5 bg-[var(--sage)] text-white rounded-[12px] hover:bg-[var(--dark-green)] transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <RefreshCcw size={15} className="animate-spin" /> : <Check size={15} />}
                Salvar alterações
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {detailModal.open && detailModal.session && (
        <AppointmentDetailModal
          appointment={detailModal.session.app}
          patient={detailModal.session.app.patient}
          attendance={detailModal.session.attendance}
          attendances={attendances}
          sessionDate={detailModal.date}
          nextDate={detailModal.date}
          sessionType={detailModal.session.type}
          onClose={() => setDetailModal({ open: false, session: null, date: null })}
          onUpdate={loadData}
          toast={toast}
        />
      )}

      {successMessage && (
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-up">
          <div className="bg-[var(--sage)] text-white px-6 py-4 rounded-[14px] shadow-2xl flex items-center gap-3 border border-[var(--sage)]/30 backdrop-blur-sm">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <p className="text-sm font-bold tracking-tight">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
