import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import { toast } from "../components/Toast";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
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
  UserX
} from "lucide-react";
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

const locales = { "pt-BR": ptBR };
const rbcLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

function StatsBar({ appointments, attendances }) {
  const presentCount = attendances.filter(a => a.status === "presente").length;
  const absentCount = attendances.filter(a => a.status === "falta").length;
  const justifiedCount = attendances.filter(a => a.status === "justificada").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="card p-3 flex items-center gap-3 border-l-4 border-slate-400">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
          <Calendar size={18} />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-800">{appointments.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agendamentos</p>
        </div>
      </div>
      <div className="card p-3 flex items-center gap-3 border-l-4 border-brand-400">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
          <UserCheck size={18} />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-800">{presentCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presenças</p>
        </div>
      </div>
      <div className="card p-3 flex items-center gap-3 border-l-4 border-red-400">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
          <UserX size={18} />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-800">{absentCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faltas</p>
        </div>
      </div>
      <div className="card p-3 flex items-center gap-3 border-l-4 border-amber-400">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <AlertCircle size={18} />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-800">{justifiedCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Justificadas</p>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, date, onClick }) {
  const appointment = session.app;
  const attendance = session.attendance;
  const patientName = appointment.patient?.name || "Paciente";
  const attendanceStatus = attendance?.status;

  const statusStyles = {
    presente: "border-brand-500 bg-brand-50/30",
    falta: "border-red-500 bg-red-50/30",
    justificada: "border-amber-500 bg-amber-50/30",
    default: "border-slate-200 bg-white hover:border-slate-300"
  };

  const initials = patientName.split(" ")[0].slice(0, 2).toUpperCase();
  const firstName = patientName.split(" ")[0] || "?";

  return (
    <div
      onClick={() => onClick(session, date)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all shadow-sm ${statusStyles[attendanceStatus] || statusStyles.default}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
        attendanceStatus === "presente" ? "bg-brand-100 text-brand-600" :
        attendanceStatus === "falta" ? "bg-red-100 text-red-600" :
        attendanceStatus === "justificada" ? "bg-amber-100 text-amber-600" :
        "bg-slate-100 text-slate-500"
      }`}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 truncate">{patientName}</p>
        <p className="text-[10px] font-bold text-slate-500">
          {appointment.time} &bull; {appointment.duration}min
        </p>
        {appointment.patient?.phone && (
          <p className="text-[9px] font-medium text-slate-400 mt-0.5">{appointment.patient.phone}</p>
        )}
      </div>
      <div className="shrink-0 ml-2">
        <span className={`w-2 h-2 rounded-full block ${
          attendanceStatus === "presente" ? "bg-brand-500" :
          attendanceStatus === "falta" ? "bg-red-500" :
          attendanceStatus === "justificada" ? "bg-amber-500" :
          "bg-slate-300"
        }`} />
      </div>
    </div>
  );
}

export default function Agenda() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
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

  const dateCellWrapper = useCallback(({ value, children }) => {
    const isSelected = selectedDay && formatDateKey(value) === formatDateKey(selectedDay);
    const isToday = formatDateKey(value) === formatDateKey(new Date());
    if (isSelected && !isToday) {
      return <div className="rbc-selected-day-cell" style={{ display: "contents" }}>{children}</div>;
    }
    return <>{children}</>;
  }, [selectedDay]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apps, atts, pats] = await Promise.all([
        api.getAppointments() || [],
        api.getAttendances() || [],
        api.getPatients() || []
      ]);
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

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col space-y-4">


      <StatsBar appointments={appointments} attendances={attendances} />

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-6 h-full animate-fade-in">
            {/* Left: Calendar */}
            <div className="w-[75%] flex flex-col min-h-0">
              <div className="p-4 pb-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden agenda-calendar">
                <BigCalendar
                  localizer={rbcLocalizer}
                  events={monthEvents}
                  date={calendarDate}
                  onNavigate={(date) => { setCalendarDate(date); setSelectedDay(null); }}
                  onSelectSlot={({ start }) => setSelectedDay(start)}
                  onSelectEvent={(event) => openDetailModal(event.session, event.start)}
                  selectable
                  views={["month"]}
                  defaultView="month"
                  toolbar={true}
                  popup={false}
                  className="flex-1 min-h-0"
                  formats={{
                    weekdayFormat: (date) => format(date, "EEE", { locale: ptBR })
                  }}
                  dayPropGetter={(date) => {
                    const today = new Date();
                    const isSelected = selectedDay && formatDateKey(date) === formatDateKey(selectedDay);
                    const isToday = formatDateKey(date) === formatDateKey(today);
                    if (isSelected && !isToday) {
                      return { className: "rbc-selected-day" };
                    }
                    return {};
                  }}
                  components={{
                    dateCellWrapper: dateCellWrapper,
                    event: ({ event }) => {
                      const firstName = (event.title || "").split(" ")[0] || "?";
                      const time = event.session?.app?.time || "";
                      const status = event.session?.attendance?.status;
                      let barColor = "bg-slate-400";
                      if (status === "presente") barColor = "bg-brand-500";
                      else if (status === "falta") barColor = "bg-red-500";
                      else if (status === "justificada") barColor = "bg-amber-500";
                      return (
                        <div className="flex items-center gap-1 px-1 py-0.5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity overflow-hidden">
                          <div className={`w-1.5 h-full min-h-[14px] rounded-full shrink-0 ${barColor}`} />
                          <span className="text-[11px] font-bold text-slate-800 leading-tight truncate">{firstName} {time}</span>
                        </div>
                      );
                    },
                    toolbar: (toolbarProps) => {
                      const label = format(toolbarProps.date, "MMMM 'de' yyyy", { locale: ptBR });
                      return (
                        <div className="shrink-0 mb-3 flex items-center justify-between">
                          <p onClick={() => setSelectedDay(null)} className="text-sm font-bold text-slate-600 capitalize cursor-pointer hover:text-brand-600 transition-colors">{label}</p>
                          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button onClick={() => toolbarProps.onNavigate("PREV")} className="p-1 hover:bg-slate-100 rounded transition-all text-slate-500">
                              <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => toolbarProps.onNavigate("TODAY")} className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 rounded transition-all">Hoje</button>
                            <button onClick={() => toolbarProps.onNavigate("NEXT")} className="p-1 hover:bg-slate-100 rounded transition-all text-slate-500">
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  }}
                />

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Realizado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Falta</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Justificada</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Agendado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detail Panel */}
            <div className="w-[25%] flex flex-col gap-3">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight shrink-0">Agendamentos</h3>
              <div className="flex-1 min-h-0">
                {selectedDay ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-full min-h-0">
                    <div className="flex items-start justify-between mb-4 shrink-0">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {format(selectedDay, "EEEE", { locale: ptBR })}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          {format(selectedDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-full shadow-sm">
                          {daySessions.length} {daySessions.length === 1 ? "SESSÃO" : "SESSÕES"}
                        </span>
                        <button
                          disabled={selectedDay && formatDateKey(selectedDay) < formatDateKey(new Date())}
                          onClick={() => setShowAddModal(true)}
                          className="w-8 h-8 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center justify-center transition-all shadow-sm shadow-brand-200 disabled:opacity-35 disabled:cursor-not-allowed"
                          title={selectedDay && formatDateKey(selectedDay) >= formatDateKey(new Date()) ? "Adicionar agendamento" : "Não é possível agendar em datas retroativas"}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 overflow-y-auto min-h-0 flex-1 pr-1.5">
                      {daySessions.length === 0 ? (
                        <div className="py-10 text-center">
                          <Users size={24} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma sessão neste dia</p>
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
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-full min-h-0">
                    <div className="flex items-start justify-between mb-4 shrink-0">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Visão do Mês</h4>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          {format(calendarDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-full shadow-sm">
                        {monthSessions.reduce((acc, d) => acc + d.sessions.length, 0)} SESSÕES
                      </span>
                    </div>
                    <div className="space-y-3 overflow-y-auto min-h-0 flex-1 pr-1.5">
                      {monthSessions.length === 0 ? (
                        <div className="py-10 text-center">
                          <Calendar size={24} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma sessão neste mês</p>
                        </div>
                      ) : (
                        monthSessions.map(({ date, sessions }) => (
                          <div key={formatDateKey(date)}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <button
                                onClick={() => setSelectedDay(date)}
                                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-brand-600 transition-colors"
                              >
                                {format(date, "EEE dd/MM", { locale: ptBR })}
                              </button>
                              <div className="flex-1 border-t border-slate-200" />
                            </div>
                            {sessions.map((session, idx) => {
                              const app = session.app;
                              const name = app.patient?.name || "Paciente";
                              const initials = name.split(" ")[0].slice(0, 2).toUpperCase();
                              return (
                                <div
                                  key={app.id + idx}
                                  onClick={() => openDetailModal(session, date)}
                                  className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all group cursor-pointer mb-1"
                                >
                                  <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[9px] shrink-0">
                                    {initials}
                                  </div>
                                  <p className="text-xs font-bold text-slate-800 truncate flex-1 min-w-0 group-hover:text-slate-900 transition-colors">
                                    {name}
                                  </p>
                                  <span className="text-[10px] font-bold text-slate-500 shrink-0">{app.time} &bull; {app.duration}min</span>
                                  <ChevronRight size={13} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center">
                <Plus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Novo Agendamento</h2>
                <p className="text-xs font-bold text-slate-500">
                  {selectedDay ? format(selectedDay, "d 'de' MMMM", { locale: ptBR }) : ""}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Paciente</label>
                <select
                  value={addForm.patientId}
                  onChange={e => setAddForm({ ...addForm, patientId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all text-sm font-medium"
                >
                  <option value="">Selecione um paciente</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horário</label>
                  <select
                    value={addForm.time}
                    onChange={e => setAddForm({ ...addForm, time: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all text-sm font-medium"
                  >
                    {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duração</label>
                  <select
                    value={addForm.duration}
                    onChange={e => setAddForm({ ...addForm, duration: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all text-sm font-medium"
                  >
                    <option value={30}>30 min</option>
                    <option value={50}>50 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addForm.recurring}
                    onChange={e => setAddForm({ ...addForm, recurring: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-700">
                      Repetir semanalmente
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Toda {["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][selectedDay ? selectedDay.getDay() : 0]}
                    </p>
                  </div>
                </label>
                {addForm.recurring && (
                  <div className="w-28">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nº Sessões</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
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
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddAppointment}
                  disabled={!addForm.patientId || saving}
                  className="flex-1 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => { setShowEditChoice(false); setEditingApp(null); }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Pencil size={22} className="text-slate-700" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Editar horário</h3>
              <p className="text-sm font-bold text-slate-500 mt-1">
                {format(editChoiceDate, "EEEE, d 'de' MMMM", { locale: ptBR })} às {editingApp.time}
              </p>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Este horário se repete semanalmente. Como deseja editar?
              </p>
            </div>
            <div className="space-y-2">
              <button onClick={handleEditSingle} className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                Apenas esta data
              </button>
              <button onClick={handleEditFuture} className="w-full py-3 px-4 bg-slate-800 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
                Esta e todas futuras
              </button>
            </div>
            <button onClick={() => { setShowEditChoice(false); setEditingApp(null); }} className="w-full mt-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

      {showDeleteChoice && editingApp && createPortal(
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => { setShowDeleteChoice(false); setEditingApp(null); }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 size={22} />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Excluir Agendamento</h3>
              <p className="text-sm font-bold text-slate-500 mt-1">
                {editingApp.patient?.name || "Paciente"} &bull; {editingApp.time}
              </p>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Este horário se repete semanalmente. Como deseja excluir?
              </p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={handleDeleteSingleDate} 
                disabled={saving}
                className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Apenas esta data
              </button>
              <button 
                onClick={handleDeleteSeries} 
                className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-100 transition-all"
              >
                Toda a série recorrente
              </button>
              <button 
                onClick={handleDeleteAllInTime} 
                className="w-full py-3 px-4 bg-red-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
              >
                Todos os dias neste horário
              </button>
            </div>
            <button onClick={() => { setShowDeleteChoice(false); setEditingApp(null); }} className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

      {showEditModal && agendaFormDate && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => { setShowEditModal(false); setEditingApp(null); setEditMode(null); }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Editar Agendamento</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  {format(agendaFormDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingApp(null); setEditMode(null); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Dia</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                    value={agendaFormDayOfWeek ?? (agendaFormDate?.getDay() ?? 1)}
                    onChange={e => setAgendaFormDayOfWeek(parseInt(e.target.value))}>
                    {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Horário</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                    value={agendaFormTime}
                    onChange={e => setAgendaFormTime(e.target.value)}>
                    {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Duração</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
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

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={agendaFormRecurring} onChange={e => setAgendaFormRecurring(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-500" />
                  <div>
                    <span className="text-sm font-bold text-slate-700">Repetir semanalmente</span>
                    <p className="text-[10px] font-medium text-slate-500">
                      Toda {["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][agendaFormDate.getDay()]}
                    </p>
                  </div>
                </label>
                {agendaFormRecurring && (
                  <div className="w-28">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nº Sessões</label>
                    <input type="number" min={0}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                      value={agendaFormMaxSessions || ""}
                      onChange={e => setAgendaFormMaxSessions(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0 = ilimitado" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => { setShowEditModal(false); setEditingApp(null); setEditMode(null); }}
                className="px-5 py-2.5 text-xs font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-all">
                Cancelar
              </button>
              <button onClick={handleSaveEditedSlot} disabled={saving}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
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
          nextDate={detailModal.date}
          sessionType={detailModal.session.type}
          onClose={() => setDetailModal({ open: false, session: null, date: null })}
          onUpdate={loadData}
        />
      )}

      {successMessage && (
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-up">
          <div className="bg-brand-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-brand-500/50 backdrop-blur-sm">
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
