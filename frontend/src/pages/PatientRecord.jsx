import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "../components/Toast";
import { formatCPF, formatPhone, formatCEP } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { generatePremiumSummary, exportCompletePatientRecordPdf } from "../lib/pdf";
import { scoreTest } from "../lib/scoring";
import { ClinicalTrendChart, transformResponsesToTrendData, AttendanceHeatmap, transformResponsesToHeatmapData } from "../components/ClinicalCharts";
import FormResponsesView from "../components/FormResponsesView";
import DataTable from "../components/DataTable";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getAvatarProps, KpiCard } from "../components/dashboard/Shared";

// Retorna o primeiro dia útil de um mês (seg-sex)
const getFirstBusinessDay = (year, month) => {
  const date = new Date(year, month, 1);
  if (date.getDay() === 0) date.setDate(2);   // domingo → segunda
  else if (date.getDay() === 6) date.setDate(3); // sábado → segunda
  return date;
};

// Parse "YYYY-MM-DD" como data local (evita timezone UTC do new Date(string))
const parseLocalDateStr = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Extrai data UTC de string ISO (para comparação com dados do banco)
const extractUTCDate = (dateStr) => {
  if (!dateStr) return "";
  if (typeof dateStr === 'string') {
    return dateStr.split('T')[0];
  }
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Encontra a próxima ocorrência de um dayOfWeek a partir de uma data base
const findNextDayOfWeek = (fromDate, targetDayOfWeek) => {
  const date = new Date(fromDate);
  const currentDay = date.getDay();
  let diff = targetDayOfWeek - currentDay;
  if (diff < 0) diff += 7;
  date.setDate(date.getDate() + diff);
  return date;
};

const appointmentOccursOnDate = (app, dateStr) => {
  if (app.scheduledDate) {
    if (dateStr !== app.scheduledDate.split("T")[0]) return false;
  } else {
    const d = new Date(dateStr + "T00:00:00");
    if (d.getDay() !== app.dayOfWeek) return false;
  }
  const dateObj = new Date(dateStr + "T00:00:00");
  if (app.endDate && dateStr > app.endDate.split("T")[0]) return false;
  if (app.skipDates && Array.isArray(app.skipDates) && app.skipDates.includes(dateStr)) return false;
  if (app.startDate && dateStr < app.startDate.split("T")[0]) return false;
  if (app.maxSessions && app.maxSessions > 0 && app.startDate) {
    const start = parseLocalDateStr(app.startDate);
    let count = 0;
    const cursor = new Date(start);
    while (cursor <= dateObj) {
      if (cursor.getDay() === app.dayOfWeek) count++;
      cursor.setDate(cursor.getDate() + 7);
    }
    if (count > app.maxSessions) return false;
  }
  return true;
};

import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  ChevronLeft,
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
  Pencil,
  Download,
  RefreshCcw,
  DollarSign,
  CreditCard,
  Receipt,
  Save,
  Send,
  ChevronDown
} from "lucide-react";

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedResponseId, setSelectedResponseId] = useState(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("sessions"); // 'sessions', 'share', 'financial', 'settings'
  const [attendances, setAttendances] = useState([]);
  const [loadingAttendances, setLoadingAttendances] = useState(false);
  const [mobileProfileExpanded, setMobileProfileExpanded] = useState(false);
  
  // Financeiro
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAttendances, setSelectedAttendances] = useState([]); // IDs de sessões selecionadas
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    method: "Pix",
    notes: "",
    receiptIssued: false,
    receiptFile: null,
    existingReceiptAttachmentId: null,
    existingReceiptFilename: null
  });

  // Filtro de Período (Sessões e Financeiro)
  const [periodFilter, setPeriodFilter] = useState("thisMonth");
  const [customMonth, setCustomMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  // Reseta os filtros ao trocar de aba para evitar que "Personalizado" persista entre abas
  const handleTabChange = (tab) => {
    setPeriodFilter("thisMonth");
    setCalendarPeriodFilter("thisMonth");
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setCustomMonth(currentMonth);
    setCalendarCustomMonth(currentMonth);
    setCalendarDate(new Date());
    setActiveTab(tab);
  };

  const filteredAttendances = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return attendances.filter(a => {
      const d = new Date(a.date);
      switch (periodFilter) {
        case "thisMonth": return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        case "lastMonth": {
          const lm = currentMonth === 0 ? 11 : currentMonth - 1;
          const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
          return d.getFullYear() === ly && d.getMonth() === lm;
        }
        case "last3Months": {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return d >= threeMonthsAgo;
        }
        case "custom": {
          const [year, month] = customMonth.split("-").map(Number);
          return d.getFullYear() === year && d.getMonth() === month - 1;
        }
        default: return true;
      }
    });
  }, [attendances, periodFilter, customMonth]);

  const filteredPayments = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return payments.filter(p => {
      const d = new Date(p.paymentDate);
      switch (periodFilter) {
        case "thisMonth": return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        case "lastMonth": {
          const lm = currentMonth === 0 ? 11 : currentMonth - 1;
          const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
          return d.getFullYear() === ly && d.getMonth() === lm;
        }
        case "last3Months": {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return d >= threeMonthsAgo;
        }
        case "custom": {
          const [year, month] = customMonth.split("-").map(Number);
          return d.getFullYear() === year && d.getMonth() === month - 1;
        }
        default: return true;
      }
    });
  }, [payments, periodFilter, customMonth]);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [calendarPeriodFilter, setCalendarPeriodFilter] = useState("thisMonth");
  const [calendarCustomMonth, setCalendarCustomMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [appointments, setAppointments] = useState([]);
  const [myAppointmentIds, setMyAppointmentIds] = useState(new Set());
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [conflicts, setConflicts] = useState({});
  const [showAllAppointments, setShowAllAppointments] = useState(true);

  const sessionModifiers = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mine = [];
    const others = [];
    const conflictDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      let hasMine = false;
      let hasOthers = false;
      let hasConflict = false;
      for (const app of appointments) {
        const dateStr = format(date, "yyyy-MM-dd");
        // If scheduled for a specific date, only match that date
        if (app.scheduledDate) {
          if (dateStr !== app.scheduledDate.split("T")[0]) continue;
        } else {
          if (date.getDay() !== app.dayOfWeek) continue;
        }
        // Check endDate
        if (app.endDate && dateStr > app.endDate.split("T")[0]) continue;
        // Check skipDates
        if (app.skipDates && Array.isArray(app.skipDates) && app.skipDates.includes(dateStr)) continue;
        // Check startDate
        if (app.startDate && dateStr < app.startDate.split("T")[0]) continue;
        // Check maxSessions
        if (app.maxSessions && app.maxSessions > 0 && app.startDate) {
          const start = parseLocalDateStr(app.startDate);
          let count = 0;
          const cursor = new Date(start);
          while (cursor <= date) {
            if (cursor.getDay() === app.dayOfWeek) count++;
            cursor.setDate(cursor.getDate() + 7);
          }
          if (count > app.maxSessions) continue;
        }
        if (conflicts[app.id]) {
          hasConflict = true;
        } else if (myAppointmentIds.has(app.id)) {
          hasMine = true;
        } else {
          hasOthers = true;
        }
      }
      if (hasConflict) conflictDates.push(date);
      else {
        if (hasMine) mine.push(date);
        if (hasOthers) others.push(date);
      }
    }
    return { mine, others, conflictDates };
  }, [calendarDate, appointments, conflicts, myAppointmentIds, showAllAppointments]);

  const agendaStats = useMemo(() => {
    const thisYear = calendarDate.getFullYear();
    const thisMonth = calendarDate.getMonth();
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
    let thisMonthCount = 0;
    const myActiveSlots = appointments.filter(a => myAppointmentIds.has(a.id));
    const recurringDaysSet = new Set();

    // Count occurrences this month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(thisYear, thisMonth, d);
      const dateStr = format(dateObj, "yyyy-MM-dd");
      for (const app of myActiveSlots) {
        if (appointmentOccursOnDate(app, dateStr)) {
          thisMonthCount++;
          recurringDaysSet.add(app.dayOfWeek);
        }
      }
    }

    // Find next session
    const today = new Date();
    let nextSession = null;
    for (let daysAhead = 0; daysAhead < 365; daysAhead++) {
      const dateObj = new Date(today);
      dateObj.setDate(dateObj.getDate() + daysAhead);
      const dateStr = format(dateObj, "yyyy-MM-dd");
      for (const app of myActiveSlots) {
        if (appointmentOccursOnDate(app, dateStr)) {
          nextSession = { date: dateObj, time: app.time, duration: app.duration };
          break;
        }
      }
      if (nextSession) break;
    }

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const sortedDays = [...recurringDaysSet].sort();
    const recurringSummary = sortedDays.map(d => dayNames[d]).join(", ");

    return {
      totalActive: myActiveSlots.length,
      thisMonthCount,
      nextSession,
      recurringSummary,
      recurringCount: sortedDays.length,
    };
  }, [appointments, myAppointmentIds, calendarDate]);

  const getMonthSessions = useCallback((month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const dateStr = format(dateObj, "yyyy-MM-dd");
      const sessions = appointments.filter(app => appointmentOccursOnDate(app, dateStr));
      if (sessions.length > 0) {
        result.push({ date: dateObj, sessions });
      }
    }
    return result;
  }, [appointments]);

  const monthSessions = useMemo(() => getMonthSessions(calendarDate), [getMonthSessions, calendarDate]);

  const [savingAgenda, setSavingAgenda] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [agendaFormDate, setAgendaFormDate] = useState(null);
  const [agendaFormDayOfWeek, setAgendaFormDayOfWeek] = useState(null);
  const [agendaFormTime, setAgendaFormTime] = useState("08:00");
  const [agendaFormDuration, setAgendaFormDuration] = useState(50);
  const [agendaFormRecurring, setAgendaFormRecurring] = useState(true);
  const [agendaFormMaxSessions, setAgendaFormMaxSessions] = useState(0);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showEditChoice, setShowEditChoice] = useState(false);
  const [showDeleteChoice, setShowDeleteChoice] = useState(false);
  const [editChoiceDate, setEditChoiceDate] = useState(null);
  const [editMode, setEditMode] = useState(null); // "single" | "future"

  const handleDayClick = (day) => {
    setSelectedCalendarDay(day);
  };

  const handleOpenNewSlotModal = (day) => {
    let targetDate = day;
    if (!targetDate) {
      if (selectedCalendarDay) {
        const displayedYear = calendarDate.getFullYear();
        const displayedMonth = calendarDate.getMonth();
        const selectedYear = selectedCalendarDay.getFullYear();
        const selectedMonth = selectedCalendarDay.getMonth();
        const isSelectedInDisplayedMonth = displayedYear === selectedYear && displayedMonth === selectedMonth;
        if (isSelectedInDisplayedMonth) {
          targetDate = selectedCalendarDay;
        } else {
          const now = new Date();
          if (displayedYear === now.getFullYear() && displayedMonth === now.getMonth()) {
            targetDate = now;
          } else {
            targetDate = getFirstBusinessDay(displayedYear, displayedMonth);
          }
        }
      } else {
        const now = new Date();
        const displayedYear = calendarDate.getFullYear();
        const displayedMonth = calendarDate.getMonth();
        if (displayedYear === now.getFullYear() && displayedMonth === now.getMonth()) {
          targetDate = now;
        } else {
          targetDate = getFirstBusinessDay(displayedYear, displayedMonth);
        }
      }
    }
    setSelectedCalendarDay(targetDate);
    setAgendaFormDate(targetDate);
    setAgendaFormDayOfWeek(targetDate.getDay());
    setAgendaFormTime("08:00");
    setAgendaFormDuration(50);
    setAgendaFormRecurring(true);
    setAgendaFormMaxSessions(0);
    setShowAgendaModal(true);
  };

  const handleSaveNewSlot = async () => {
    if (!agendaFormDate) return;
    const dayOfWeek = agendaFormDayOfWeek ?? agendaFormDate.getDay();
    const startDate = format(agendaFormDate, "yyyy-MM-dd");
    if (editingAppointment) {
      await handleSaveEditedSlot();
      return;
    }
    const baseSlot = { patientId: id, dayOfWeek, time: agendaFormTime, duration: agendaFormDuration, startDate };
    if (!agendaFormRecurring) {
      baseSlot.scheduledDate = startDate;
    } else if (agendaFormMaxSessions > 0) {
      baseSlot.maxSessions = agendaFormMaxSessions;
    }
    setSavingAgenda(true);
    try {
      await api.createAppointment(baseSlot);
      await loadPatientAppointments(showAllAppointments);
      setShowAgendaModal(false);
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSavingAgenda(false);
    }
  };

  const executeDirectDelete = async (slotId) => {
    if (!window.confirm("Tem certeza que deseja excluir este agendamento avulso?")) return;
    setSavingAgenda(true);
    try {
      await api.deleteAppointment(slotId);
      toast("Agendamento avulso removido!", "success");
      await loadPatientAppointments(showAllAppointments);
    } catch (error) {
      toast(error.message || "Erro ao remover agendamento", "error");
    } finally {
      setSavingAgenda(false);
    }
  };

  const handleDeleteSingleDate = async () => {
    if (!editingAppointment || !agendaFormDate) return;
    setSavingAgenda(true);
    try {
      const dateStr = format(agendaFormDate, "yyyy-MM-dd");
      const skipDates = [...(editingAppointment.skipDates || []), dateStr];
      await api.updateAppointment(editingAppointment.id, { skipDates });
      toast("Esta data foi desmarcada!", "success");
      setShowDeleteChoice(false);
      setEditingAppointment(null);
      await loadPatientAppointments(showAllAppointments);
    } catch (error) {
      console.error("Erro ao desmarcar data:", error);
      toast(error.message || "Erro ao desmarcar data", "error");
    } finally {
      setSavingAgenda(false);
    }
  };

  const handleDeleteSeries = async () => {
    if (!editingAppointment) return;
    if (!window.confirm(`Tem certeza que deseja excluir toda a série recorrente deste dia da semana?`)) return;
    setSavingAgenda(true);
    try {
      await api.deleteAppointment(editingAppointment.id);
      toast("Série recorrente excluída!", "success");
      setShowDeleteChoice(false);
      setEditingAppointment(null);
      await loadPatientAppointments(showAllAppointments);
    } catch (error) {
      console.error("Erro ao excluir série:", error);
      toast(error.message || "Erro ao excluir série", "error");
    } finally {
      setSavingAgenda(false);
    }
  };

  const handleDeleteAllInTime = async () => {
    if (!editingAppointment) return;
    if (!window.confirm(`Tem certeza que deseja excluir TODOS os agendamentos deste paciente às ${editingAppointment.time}? (Exclusão em lote por horário).`)) return;
    setSavingAgenda(true);
    try {
      await api.deletePatientAppointmentsByTime(id, editingAppointment.time);
      toast(`Agendamentos das ${editingAppointment.time} excluídos em lote!`, "success");
      setShowDeleteChoice(false);
      setEditingAppointment(null);
      await loadPatientAppointments(showAllAppointments);
    } catch (error) {
      console.error("Erro ao excluir em lote:", error);
      toast(error.message || "Erro ao excluir em lote", "error");
    } finally {
      setSavingAgenda(false);
    }
  };

  const handleRemoveSlot = async (slotId, date) => {
    const app = appointments.find(a => a.id === slotId);
    if (!app) return;

    if (app.scheduledDate) {
      await executeDirectDelete(slotId);
    } else {
      setEditingAppointment(app);
      setAgendaFormDate(date);
      setShowDeleteChoice(true);
    }
  };

  const handleEditClick = (app, date) => {
    const isRecurring = !app.scheduledDate;
    if (isRecurring) {
      setEditingAppointment(app);
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
    setEditingAppointment(app);
    setShowEditChoice(false);
    setShowAgendaModal(true);
  };

  const handleEditSingle = () => {
    setEditMode("single");
    openEditModal(editingAppointment, editChoiceDate);
  };

  const handleEditFuture = () => {
    setEditMode("future");
    openEditModal(editingAppointment, editChoiceDate);
  };

  const handleSaveEditedSlot = async () => {
    if (!editingAppointment || !agendaFormDate) return;
    const dayOfWeek = agendaFormDayOfWeek ?? agendaFormDate.getDay();
    const dateStr = format(agendaFormDate, "yyyy-MM-dd");
    setSavingAgenda(true);
    try {
      if (editMode === "single") {
        const skipDates = [...(editingAppointment.skipDates || []), dateStr];
        await api.updateAppointment(editingAppointment.id, { skipDates });
        // If dayOfWeek changed, find the next occurrence of the new dayOfWeek
        const targetDate = dayOfWeek !== editingAppointment.dayOfWeek
          ? findNextDayOfWeek(agendaFormDate, dayOfWeek)
          : agendaFormDate;
        await api.createAppointment({
          patientId: id,
          dayOfWeek,
          time: agendaFormTime,
          duration: agendaFormDuration,
          scheduledDate: format(targetDate, "yyyy-MM-dd")
        });
      } else if (editMode === "future") {
        const prevDate = new Date(agendaFormDate);
        prevDate.setDate(prevDate.getDate() - 1);
        await api.updateAppointment(editingAppointment.id, { endDate: format(prevDate, "yyyy-MM-dd") });
        await api.createAppointment({
          patientId: id,
          dayOfWeek,
          time: agendaFormTime,
          duration: agendaFormDuration,
          startDate: dateStr,
          maxSessions: agendaFormMaxSessions || null
        });
      } else if (editingAppointment.scheduledDate) {
        await api.updateAppointment(editingAppointment.id, {
          dayOfWeek,
          time: agendaFormTime,
          duration: agendaFormDuration
        });
      }
      await loadPatientAppointments(showAllAppointments);
      setShowAgendaModal(false);
      setEditingAppointment(null);
      setEditMode(null);
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSavingAgenda(false);
    }
  };
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTab, setEditTab] = useState("identity");
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);
  const [forms, setForms] = useState([]);
  const [shareData, setShareData] = useState({ formId: "" });
  const [patientShareLinks, setPatientShareLinks] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [existingLinkForForm, setExistingLinkForForm] = useState(null);
  const [forceCreateNew, setForceCreateNew] = useState(false);

  const filteredLinks = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return patientShareLinks.filter(l => {
      const d = new Date(l.createdAt);
      switch (periodFilter) {
        case "thisMonth": return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        case "lastMonth": {
          const lm = currentMonth === 0 ? 11 : currentMonth - 1;
          const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
          return d.getFullYear() === ly && d.getMonth() === lm;
        }
        case "last3Months": {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return d >= threeMonthsAgo;
        }
        case "custom": {
          const [year, month] = customMonth.split("-").map(Number);
          return d.getFullYear() === year && d.getMonth() === month - 1;
        }
        default: return true;
      }
    });
  }, [patientShareLinks, periodFilter, customMonth]);

  const location = useLocation();

  useEffect(() => {
    loadPatient();
    loadForms();
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) handleTabChange(tab);
  }, [id, location.search]);

  useEffect(() => {
    if (activeTab === "notes") {
      loadAttachments();
    }
  }, [activeTab]);

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

  const loadPatientPayments = async () => {
    setLoadingPayments(true);
    try {
      const data = await api.getPatientPayments(id);
      setPayments(data);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadPatientAppointments = async (showAll) => {
    setLoadingAppointments(true);
    try {
      const [allData, myData] = await Promise.all([
        showAll ? api.getAppointments() : Promise.resolve(null),
        api.getPatientAppointments(id)
      ]);
      setAppointments(showAll ? (allData || []) : (myData || []));
      setMyAppointmentIds(new Set((myData || []).map(a => a.id)));
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const checkConflict = async (id, dayOfWeek, time, duration) => {
    try {
      const result = await api.checkAppointmentConflict({
        dayOfWeek,
        time,
        duration,
        excludePatientId: patient.id
      });

      setConflicts(prev => ({
        ...prev,
        [id]: result.hasConflict ? result.conflicts[0] : null
      }));
    } catch (error) {
      console.error("Erro ao verificar conflito:", error);
    }
  };

  const addAppointmentSlot = () => {
    const newId = `new-${Date.now()}`;
    setAppointments([...appointments, {
      id: newId,
      dayOfWeek: 1,
      time: "08:00",
      duration: 50,
      startDate: new Date().toISOString().split('T')[0],
      isNew: true
    }]);
    checkConflict(newId, 1, "08:00", 50);
  };

  const removeAppointmentSlot = (id) => {
    setAppointments(appointments.filter(a => a.id !== id));
    setConflicts(prev => {
      const newConflicts = { ...prev };
      delete newConflicts[id];
      return newConflicts;
    });
  };

  const updateAppointmentSlot = (id, field, value) => {
    const updatedApps = appointments.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    );
    setAppointments(updatedApps);

    if (field === "dayOfWeek" || field === "time" || field === "duration") {
      const slot = updatedApps.find(a => a.id === id);
      checkConflict(id, slot.dayOfWeek, slot.time, slot.duration);
    }
  };
  const handleClearAgenda = async () => {
    if (!confirm("Tem certeza? Todos os horários recorrentes e avulsos deste paciente serão removidos. Registros de presença e financeiros não são afetados.")) return;
    try {
      await api.deletePatientAppointments(id);
      alert("Agenda removida com sucesso.");
      loadPatientAppointments(showAllAppointments);
    } catch (error) {
      alert("Erro ao limpar agenda: " + error.message);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") {
      loadPatientAttendances();
    }
    if (activeTab === "financial") {
      loadPatientPayments();
      loadPatientAttendances();
    }
    if (activeTab === "settings") {
      loadPatientAppointments(showAllAppointments);
    }
  }, [activeTab, showAllAppointments]);

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

  const handleRevokeLink = async (linkId) => {
    if (!confirm("Excluir este link?")) return;
    try {
      await api.revokeShareLink(linkId);
      await loadPatientShareLinks();
    } catch (error) {
      alert("Erro ao excluir link: " + error.message);
    }
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
      setShareData({ formId: "" });
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
    setErrorMessage("");
    try {
      for (const file of files) {
        const result = await api.uploadAttachment(id, file);
        setAttachments(prev => [result, ...prev]);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setErrorMessage(error.message || "Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    console.log("Tentando deletar anexo:", attachmentId);
    if (!confirm("Tem certeza que deseja excluir este anexo?")) return;
    try {
      await api.deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error("Erro ao deletar anexo:", error);
      alert("Erro ao deletar arquivo: " + (error.message || "Tente novamente"));
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
    if (!formData.name || !formData.cpf || !formData.birthDate) {
      setEditTab("identity");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Identificação.");
      return;
    }
    if (!formData.email || !formData.phone) {
      setEditTab("contact");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Contato.");
      return;
    }
    if (!formData.emergencyPhone || !formData.emergencyName) {
      setEditTab("emergency");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Emergência.");
      return;
    }
    console.log("handleSave - Enviando dados:", JSON.stringify(formData, null, 2));
    setSaving(true);
    setErrorMessage("");
    try {
      const result = await api.updatePatient(patient.id, formData);
      console.log("Resposta do servidor:", JSON.stringify(result, null, 2));
      await loadPatient();
      setShowEditModal(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setErrorMessage(error.message || "Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (selectedAttendances.length === 0) {
      alert("Selecione ao menos uma sessão.");
      return;
    }
    setSaving(true);
    try {
      const { receiptFile, existingReceiptAttachmentId, amount, ...restData } = paymentFormData;
      const amountValue = typeof amount === 'string' 
        ? parseFloat(amount.replace(/\./g, '').replace(',', '.')) 
        : amount;
      
      let attachmentId = null;
      if (receiptFile) {
        const attachment = await api.uploadAttachment(id, receiptFile);
        attachmentId = attachment.id;
      } else if (existingReceiptAttachmentId) {
        attachmentId = existingReceiptAttachmentId;
      }
      
      let paymentId = paymentFormData.id;
      if (paymentId) {
        await api.updatePayment(paymentId, { 
          ...restData,
          amount: amountValue,
          attendanceIds: selectedAttendances,
          receiptAttachmentId: attachmentId 
        });
      } else {
        await api.savePayment({ 
          patientId: id, 
          ...restData,
          amount: amountValue,
          attendanceIds: selectedAttendances,
          receiptAttachmentId: attachmentId 
        });
      }
      
      setShowPaymentModal(false);
      loadPatientPayments();
      loadPatientAttendances();
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditPayment = (payment) => {
    const formattedAmount = payment.amount 
      ? payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      : '';
    setPaymentFormData({
      id: payment.id,
      amount: formattedAmount,
      paymentDate: format(new Date(payment.paymentDate), 'yyyy-MM-dd'),
      method: payment.method,
      notes: payment.notes || "",
      receiptIssued: payment.receiptIssued,
      receiptFile: null,
      existingReceiptAttachmentId: payment.receiptAttachmentId || null,
      existingReceiptFilename: payment.receiptAttachment?.originalName || payment.receiptAttachment?.filename || null
    });
    setSelectedAttendances(payment.attendances.map(a => a.id));
    setShowPaymentModal(true);
  };

  const handleDownloadReceipt = async (attachmentId, filename) => {
    try {
      await api.downloadAttachment(attachmentId, filename);
    } catch (error) {
      alert("Erro ao baixar arquivo: " + error.message);
    }
  };

  const handleGenerateAllReceipts = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Título Centralizado (Design Executivo V9)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text('RELATÓRIO FINANCEIRO COMPLETO', pageWidth / 2, 25, { align: 'center' });
    
    // Nome do Cliente em Destaque
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(`${patient.name}`, pageWidth / 2, 35, { align: 'center' });
    
    // Linha Divisória Elegante
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(margin, 42, pageWidth - margin, 42);
    
    // Cálculos de Resumo
    const totalAmount = payments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0);
    const totalSessions = payments.reduce((sum, p) => sum + (p.attendances?.length || 0), 0);
    
    // Seção Resumo Financeiro
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMO FINANCEIRO', margin, 55);
    
    autoTable(doc, {
      startY: 60,
      margin: { left: margin, right: margin },
      head: [['Descrição', 'Valor']],
      body: [
        ['Total de Pagamentos Realizados', totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
        ['Quantidade Total de Sessões Liquidadas', `${totalSessions} sessões`]
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: [242, 242, 242], 
        textColor: [51, 51, 51], 
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 5,
        font: "helvetica",
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    let currentY = (doc.lastAutoTable?.finalY || 100) + 15;
    
    // Linha Divisória antes da próxima seção
    doc.setDrawColor(204, 204, 204);
    doc.line(margin, currentY - 5, pageWidth - margin, currentY - 5);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('DETALHES CONSOLIDADOS DE PAGAMENTOS E SESSÕES', margin, currentY);
    
    const detailedBody = [];
    payments.forEach((payment) => {
      const amountFormatted = typeof payment.amount === 'number' 
        ? payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : `R$ ${payment.amount}`;
      const paymentDate = format(new Date(payment.paymentDate), 'dd/MM/yyyy');
      
      if (payment.attendances && payment.attendances.length > 0) {
        payment.attendances.forEach((att, index) => {
          const row = [];
          if (index === 0) {
            // Células mescladas (Rowspan) com alinhamento centralizado vertical e horizontal
            row.push({ content: amountFormatted, rowSpan: payment.attendances.length, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } });
            row.push({ content: paymentDate, rowSpan: payment.attendances.length, styles: { valign: 'middle', halign: 'center' } });
            row.push({ content: payment.method, rowSpan: payment.attendances.length, styles: { valign: 'middle', halign: 'center' } });
          }
          
          let dateStr = format(new Date(att.date), 'dd/MM/yyyy');
          if (att.parentId) {
            const parent = attendances.find(p => p.id === att.parentId);
            if (parent) dateStr += ` (Ref: ${format(new Date(parent.date), 'dd/MM/yyyy')})`;
          }

          row.push(dateStr);
          const statusLabel = att.status === 'presente' ? 'Presente' : att.status === 'falta' ? 'Falta' : 'Justificada';
          row.push(`${att.sessionTime || '08:00'} (${statusLabel})`);
          detailedBody.push(row);
        });
      } else {
        detailedBody.push([
          { content: amountFormatted, styles: { halign: 'center', fontStyle: 'bold' } },
          { content: paymentDate, styles: { halign: 'center' } },
          { content: payment.method, styles: { halign: 'center' } },
          'N/A',
          'N/A'
        ]);
      }
    });
    
    autoTable(doc, {
      startY: currentY + 5,
      margin: { left: margin, right: margin },
      head: [['Valor', 'Data Pagto', 'Método', 'Data da Sessão', 'Horário/Status']],
      body: detailedBody,
      theme: 'grid',
      headStyles: { 
        fillColor: [242, 242, 242], 
        textColor: [51, 51, 51], 
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 4,
        font: "helvetica",
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 40 }
      }
    });
    
    // Rodapé em todas as páginas (Design V9)
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      
      const timestamp = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
      doc.text(
        `Documento gerado em: ${timestamp} | Página ${i} de ${totalPages}`,
        pageWidth - margin,
        287,
        { align: 'right' }
      );
      
      doc.setDrawColor(241, 245, 249); // Slate 100
      doc.line(margin, 282, pageWidth - margin, 282);
    }
    
    doc.save(`Relatorio_Financeiro_${patient.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handleGenerateReceipt = (payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Cabeçalho Profissional
    doc.setFontSize(18);
    doc.setTextColor(51, 51, 51);
    doc.text('PRESTAÇÃO DE CONTAS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Serviços de Psicologia', pageWidth / 2, 28, { align: 'center' });
    
    // Linha Divisória
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);
    
    // Informações do Pagamento
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Paciente:', margin, 45);
    doc.setTextColor(30, 41, 59);
    doc.text(patient.name, margin + 30, 45);
    
    doc.setTextColor(100, 116, 139);
    doc.text('Data do Pagamento:', margin, 52);
    doc.setTextColor(30, 41, 59);
    doc.text(format(new Date(payment.paymentDate), "dd/MM/yyyy"), margin + 40, 52);
    
    doc.setTextColor(100, 116, 139);
    doc.text('Valor:', margin, 62);
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105);
    const amountFormatted = typeof payment.amount === 'number' 
      ? payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : `R$ ${payment.amount}`;
    doc.text(amountFormatted, margin + 20, 62);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Método:', margin, 72);
    doc.setTextColor(30, 41, 59);
    doc.text(payment.method, margin + 25, 72);
    
    // Tabela de Sessões
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text('SESSÕES INCLUÍDAS', margin, 85);
    
    const tableBody = payment.attendances.map((att, index) => {
      const isFalta = att.status === 'falta';
      const statusLabel = att.status === 'presente' ? 'PRESENTE' : isFalta ? 'FALTA' : att.status === 'justificada' ? 'JUSTIFICADA' : 'PENDENTE';
      
      let dateLabel = format(new Date(att.date), 'dd/MM/yyyy');
      if (att.parentId) {
        const parent = attendances.find(p => p.id === att.parentId);
        if (parent) {
          dateLabel += ` (Ref: ${format(new Date(parent.date), 'dd/MM/yyyy')})`;
        }
      }

      return [
        index + 1,
        dateLabel,
        att.sessionTime || '08:00',
        statusLabel
      ];
    });
    
    autoTable(doc, {
      startY: 90,
      margin: { left: margin, right: margin },
      head: [['#', 'DATA', 'HORÁRIO', 'STATUS']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 4 },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.raw;
          if (status === 'PRESENTE') data.cell.styles.textColor = [5, 150, 105];
          else if (status === 'FALTA') data.cell.styles.textColor = [220, 38, 38];
          else if (status === 'JUSTIFICADA') data.cell.styles.textColor = [217, 119, 6];
        }
      }
    });
    
    let finalY = (doc.lastAutoTable?.finalY || 120) + 10;
    
    // Observações
    if (payment.notes) {
      if (finalY > 250) { doc.addPage(); finalY = 20; }
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text('OBSERVAÇÕES', margin, finalY);
      finalY += 7;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(payment.notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, finalY);
      finalY += (splitNotes.length * 5) + 5;
    }
    
    // Assinatura/Status
    if (finalY > 260) { doc.addPage(); finalY = 20; }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, finalY, pageWidth - margin, finalY);
    finalY += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(`Recibo ${payment.receiptIssued ? 'Emitido' : 'Pendente'}`, pageWidth / 2, finalY, { align: 'center' });
    
    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, 285, { align: 'center' });
    
    doc.save(`Prestacao_Contas_${patient.name.replace(/\s/g, '_')}_${format(new Date(payment.paymentDate), 'yyyyMMdd')}.pdf`);
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

  const handleExportCompletePdf = async () => {
    try {
      toast("Gerando prontuário em PDF...", "info");
      const record = await api.exportPatientRecord(id);
      exportCompletePatientRecordPdf(record);
      toast("PDF gerado com sucesso!", "success");
    } catch (error) {
      toast("Erro ao exportar prontuário: " + error.message, "error");
    }
  };

  const handleSendWhatsAppReminder = async (appointment) => {
    try {
      toast("Enviando lembrete de WhatsApp...", "info");
      await api.sendWhatsAppReminder({
        patientId: id,
        appointmentId: appointment.id
      });
      toast("Lembrete enviado com sucesso!", "success");
    } catch (error) {
      toast("Erro ao enviar lembrete: " + error.message, "error");
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
          <div className="w-10 h-10 rounded-full border-2 border-brand-900 border-t-transparent animate-spin" />
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

  const { initials, color: avatarColor } = getAvatarProps(patient.name);

  return (
    <>
    <div className="px-4 pt-4 pb-20 md:p-6 h-auto md:h-full flex flex-col md:overflow-hidden animate-fade-in">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3 md:mb-4 group transition-colors shrink-0">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="hidden md:inline">Voltar para Lista de Pacientes</span>
        <span className="md:hidden">Voltar</span>
      </Link>

      {/* Mobile Compact Profile Card */}
      <div className="md:hidden shrink-0 mb-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-[14px] flex items-center justify-center font-extrabold text-base border border-[var(--border)] shadow-sm shrink-0"
              style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-inter text-base font-bold text-[var(--text-primary)] truncate">{patient.name}</h1>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Prontuário #{patient.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => { setEditTab("identity"); loadAttachments(); setShowEditModal(true); }}
                className="w-9 h-9 rounded-[10px] bg-[var(--sage)] hover:opacity-95 text-white flex items-center justify-center transition-colors shadow-sm outline-none"
                title="Ver Dados Completos"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setMobileProfileExpanded(!mobileProfileExpanded)}
                className="w-9 h-9 rounded-[10px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center transition-all outline-none"
              >
                <ChevronRight size={14} className={`transition-transform duration-200 ${mobileProfileExpanded ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>
          {mobileProfileExpanded && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                {patient.email && (
                  <div className="px-2 py-1.5 bg-[var(--surface-alt)] rounded-[10px]">
                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email</p>
                    <p className="text-[11px] text-[var(--text-primary)] font-semibold truncate">{patient.email}</p>
                  </div>
                )}
                {patient.phone && (
                  <div className="px-2 py-1.5 bg-[var(--surface-alt)] rounded-[10px]">
                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Telefone</p>
                    <p className="text-[11px] text-[var(--text-primary)] font-semibold truncate">{patient.phone}</p>
                  </div>
                )}
                <div className="px-2 py-1.5 bg-[var(--surface-alt)] rounded-[10px]">
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Nascimento</p>
                  <p className="text-[11px] text-[var(--text-primary)] font-semibold">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "—"}
                    {patient.birthDate && (() => {
                      const today = new Date();
                      const birth = new Date(patient.birthDate);
                      let age = today.getFullYear() - birth.getFullYear();
                      const monthDiff = today.getMonth() - birth.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
                      return <span className="ml-1 text-[var(--text-muted)] font-normal">({age}a)</span>;
                    })()}
                  </p>
                </div>
                <div className="px-2 py-1.5 bg-[var(--surface-alt)] rounded-[10px]">
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Paciente desde</p>
                  <p className="text-[11px] text-[var(--text-primary)] font-semibold">{new Date(patient.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              {patient.notes && (
                <div className="p-2.5 bg-[var(--surface-alt)] rounded-[10px] border border-[var(--border)]">
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Anotações</p>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">{patient.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="md:flex-1 md:overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 md:h-full md:min-h-0">

          {/* Left Column: Patient Profile (hidden on mobile — compact card above) */}
          <div className="hidden md:flex md:col-span-1 flex-col min-h-0">
            <div className="card p-6 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col items-center text-center mb-6 shrink-0">
                <div 
                  className="w-20 h-20 rounded-[18px] flex items-center justify-center font-extrabold text-2xl mb-3 border border-[var(--border)] shadow-sm shrink-0"
                  style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                >
                  {initials}
                </div>
                <h1 className="font-inter text-xl font-bold text-[var(--text-primary)]">{patient.name}</h1>
                <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Prontuário #{patient.id.slice(0, 8).toUpperCase()}</p>
              </div>

              <div className="shrink-0 space-y-3">
                {patient.email && (
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email</p>
                      <p className="text-xs text-[var(--text-primary)] font-semibold truncate">{patient.email}</p>
                    </div>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Telefone</p>
                      <p className="text-xs text-[var(--text-primary)] font-semibold truncate">{patient.phone}</p>
                    </div>
                  </div>
                )}
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Nascimento</p>
                  <p className="text-xs text-[var(--text-primary)] font-semibold">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "Não informado"}
                    {patient.birthDate && (() => {
                      const today = new Date();
                      const birth = new Date(patient.birthDate);
                      let age = today.getFullYear() - birth.getFullYear();
                      const monthDiff = today.getMonth() - birth.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
                      return <span className="ml-1 text-[var(--text-muted)] font-normal">({age} anos)</span>;
                    })()}
                  </p>
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Paciente desde</p>
                  <p className="text-xs text-[var(--text-primary)] font-semibold">{new Date(patient.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Anotações Rápidas */}
              <div className="flex flex-col min-h-0 flex-1 pt-3">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 px-2 shrink-0">Anotações (Prontuário)</p>
                <div className="p-3 bg-[var(--surface-alt)] rounded-[14px] border border-[var(--border)] flex-1 overflow-y-auto patients-scrollbar">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {patient.notes || "Nenhuma anotação registrada."}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 shrink-0">
                <button 
                  onClick={() => { setEditTab("identity"); loadAttachments(); setShowEditModal(true); }} 
                  className="w-full py-2.5 rounded-[12px] bg-[var(--sage)] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm outline-none"
                >
                  <Edit size={14} />
                  Ver Dados Completos
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="md:col-span-3 flex flex-col md:h-full md:min-h-0 gap-4 md:gap-6">

          {/* Tabs */}
          <div className="shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
              <div className="hidden md:block">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Histórico Clínico</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Evolução e respostas do paciente
                </p>
              </div>
              <div className="flex items-center justify-between w-full md:w-auto gap-1 bg-[var(--surface-alt)] p-1 rounded-[14px] border border-[var(--border)] shadow-sm flex-nowrap">
                <TabButton
                  active={activeTab === "sessions"}
                  onClick={() => handleTabChange("sessions")}
                  icon={<Clock size={16} />}
                  label="Histórico"
                />
                <TabButton
                  active={activeTab === "settings"}
                  onClick={() => handleTabChange("settings")}
                  icon={<Calendar size={16} />}
                  label="Agenda"
                />
                <TabButton
                  active={activeTab === "financial"}
                  onClick={() => handleTabChange("financial")}
                  icon={<DollarSign size={16} />}
                  label="Financeiro"
                />
                <TabButton
                  active={activeTab === "share"}
                  onClick={() => handleTabChange("share")}
                  icon={<Share2 size={16} />}
                  label="Instrumentos"
                />
                <TabButton
                  active={activeTab === "notes"}
                  onClick={() => handleTabChange("notes")}
                  icon={<FileText size={16} />}
                  label="Prontuário"
                />
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="md:flex-1 flex flex-col md:min-h-0">
           {/* Sessions/Frequency Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-5 animate-fade-in flex flex-col md:flex-1 md:min-h-0">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <KpiCard compact icon={<UserCheck size={14} />} iconBg="var(--status-presente-bg)" iconColor="var(--status-presente-text)" label="Presenças" value={filteredAttendances.filter(a => a.status === 'presente').length} />
                <KpiCard compact icon={<UserX size={14} />} iconBg="var(--status-falta-bg)" iconColor="var(--status-falta-text)" label="Faltas" value={filteredAttendances.filter(a => a.status === 'falta').length} />
                <KpiCard compact icon={<AlertCircle size={14} />} iconBg="var(--status-justificada-bg)" iconColor="var(--status-justificada-text)" label="Justificadas" value={filteredAttendances.filter(a => a.status === 'justificada').length} />
                <KpiCard compact icon={<Activity size={14} />} iconBg="var(--surface-alt)" iconColor="var(--text-secondary)" label="Total Sessões" value={attendances.length} />
              </div>

              {/* Filtro de Período */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 pb-1">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 hidden md:inline-block">Período</span>
                  {[
                    { key: "thisMonth", label: "Este Mês", mobile: true },
                    { key: "lastMonth", label: "Mês Anterior", mobile: false },
                    { key: "last3Months", label: "Últimos 3 Meses", mobile: false },
                    { key: "all", label: "Todo Histórico", mobile: false },
                    { key: "custom", label: "Personalizado", mobile: true },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setPeriodFilter(opt.key);
                        const now = new Date();
                        if (opt.key === "thisMonth") {
                          setCustomMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
                        } else if (opt.key === "lastMonth") {
                          const d = subMonths(now, 1);
                          setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                        }
                      }}
                      className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-center flex-1 md:flex-initial md:shrink-0 ${
                        opt.mobile ? "" : "hidden md:inline-block"
                      } ${
                        periodFilter === opt.key
                          ? "bg-[var(--sage)] text-white shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--sage)] hover:text-[var(--sage)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                {periodFilter === "custom" && (
                  <div className="flex items-center justify-between w-full md:w-auto gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm p-1">
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] transition-all"><ChevronLeft size={16} /></button>
                    <select value={customMonth} onChange={e => setCustomMonth(e.target.value)} className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 flex-1 md:flex-initial min-w-[80px]">
                      {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((name, i) => {
                        const monthVal = i + 1;
                        const currentYear = customMonth.split("-")[0];
                        return <option key={`${currentYear}-${String(monthVal).padStart(2, "0")}`} value={`${currentYear}-${String(monthVal).padStart(2, "0")}`} className="bg-[var(--surface)] text-[var(--text-primary)]">{name}</option>;
                      })}
                    </select>
                    <select value={customMonth.split("-")[0]} onChange={e => { const month = customMonth.split("-")[1]; setCustomMonth(`${e.target.value}-${month}`); }} className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 min-w-[60px]">
                      {Array.from({ length: 11 }, (_, i) => { const year = new Date().getFullYear() - 5 + i; return <option key={year} value={year} className="bg-[var(--surface)] text-[var(--text-primary)]">{year}</option>; })}
                    </select>
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] transition-all"><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>

              {/* Timeline List */}
              <div className="card p-6 md:flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">Histórico de Sessões</h3>
                </div>
                <div className="p-4 bg-[var(--surface-alt)] rounded-[20px] border border-[var(--border)] md:flex-1 flex flex-col">
                {loadingAttendances ? (
                  <div className="text-center py-20 opacity-50 flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[var(--sage)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Carregando histórico...</p>
                  </div>
                ) : filteredAttendances.length === 0 ? (
                  <div className="md:flex-1 flex flex-col items-center justify-center text-center px-8 py-12 md:py-20">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--sage-light)] flex items-center justify-center mb-5">
                      <Calendar size={32} className="text-[var(--sage)]" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Nenhum registro no período</p>
                    <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xs leading-relaxed">Registros de presença aparecerão aqui conforme você marcar as sessões na agenda do paciente.</p>
                  </div>
                ) : (
                  <div className="space-y-0 relative before:absolute before:left-[15px] md:before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-[var(--border)] md:overflow-y-auto patients-scrollbar md:flex-1 md:min-h-0">
                    {filteredAttendances.map((att, idx) => {
                      const isReagendado = att.notes?.includes('Reagendado');
                      const isFilho = !!att.parentId;
                      const hasFilho = attendances.some(a => a.parentId === att.id);
                      const isChainStart = hasFilho && !isFilho;
                      const isChainMiddle = hasFilho && isFilho;
                      const isChainEnd = !hasFilho && isFilho;
                      
                      const statusConfig = {
                        presente: { color: "bg-[var(--sage)]", label: "Presente", bg: "bg-[var(--status-presente-bg)]", text: "text-[var(--status-presente-text)]", icon: <Check size={10} className="md:w-3 md:h-3" /> },
                        falta: { color: "bg-red-500", label: "Falta", bg: "bg-[var(--status-falta-bg)]", text: "text-[var(--status-falta-text)]", icon: <X size={10} className="md:w-3 md:h-3" /> },
                        justificada: { color: "bg-[var(--peach)]", label: "Justificada", bg: "bg-[var(--status-justificada-bg)]", text: "text-[var(--status-justificada-text)]", icon: isReagendado ? <RefreshCcw size={10} className="md:w-3 md:h-3" /> : <AlertCircle size={10} className="md:w-3 md:h-3" /> },
                      };

                      const config = statusConfig[att.status] || { color: "bg-[var(--text-muted)]", label: att.status, bg: "bg-[var(--surface-alt)]", text: "text-[var(--text-secondary)]", icon: <Clock size={10} className="md:w-3 md:h-3" /> };

                      return (
                        <div key={att.id} className="relative pl-10 md:pl-12 pb-8 md:pb-10 group last:pb-0">
                          {hasFilho && (
                            <div className="absolute left-[15px] md:left-[19px] top-8 md:top-10 bottom-0 w-0.5 bg-[var(--peach)]/30 z-0" />
                          )}
                          
                          <div className={`absolute left-0 top-1 w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-[var(--surface)] shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-105 ${config.color} text-white ${isFilho ? 'ring-2 ring-[var(--peach)] ring-offset-2 ring-offset-[var(--surface)]' : ''}`}>
                            {config.icon}
                          </div>

                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                                  {format(new Date(att.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </span>
                                <div className="flex gap-1">
                                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.text} border border-[var(--border)] shadow-sm`}>
                                    {isReagendado ? 'Reagendada' : config.label}
                                  </span>
                                  {att.paymentId ? (
                                    <>
                                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--status-presente-bg)] text-[var(--status-presente-text)] border border-[var(--status-presente-text)]/20 flex items-center gap-1 shadow-sm">
                                        <DollarSign size={8} />
                                        Pago
                                      </span>
                                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1 ${
                                        att.payment?.receiptIssued ? 'bg-[var(--status-presente-bg)] text-[var(--status-presente-text)] border-[var(--status-presente-text)]/20' : 'bg-[var(--status-justificada-bg)] text-[var(--status-justificada-text)] border-[var(--status-justificada-text)]/20'
                                      }`}>
                                        <Receipt size={8} />
                                        {att.payment?.receiptIssued ? 'Recibo Emitido' : 'Recibo Pendente'}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)] flex items-center gap-1 shadow-sm">
                                      <Clock size={8} />
                                      Pagamento Pendente
                                    </span>
                                  )}
                                  {isChainStart && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--status-justificada-bg)] text-[var(--status-justificada-text)] border border-[var(--status-justificada-text)]/20">Início de Cadeia</span>}
                                  {isChainMiddle && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--status-justificada-bg)] text-[var(--status-justificada-text)] border border-[var(--status-justificada-text)]/20">Reagendamento</span>}
                                  {isChainEnd && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--border)]">Reagendamento Final</span>}
                                </div>
                              </div>
                              <p className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1 mb-2">
                                <Clock size={12} />
                                {att.sessionTime || 'Horário não informado'}
                              </p>

                              {att.notes && (
                                <div className={`max-w-md p-3 rounded-[12px] border flex-1 ${isFilho ? 'bg-[var(--status-justificada-bg)]/30 border-[var(--status-justificada-text)]/20' : 'bg-[var(--surface)] border-[var(--border)]'}`}>
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Evolução / Observação</p>
                                  {att.notes.includes("<") && att.notes.includes(">") ? (
                                    <div
                                      className="text-xs text-[var(--text-primary)] leading-relaxed font-medium prose prose-sm max-w-none [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-[var(--dark-green)] [&_ul]:list-disc [&_ul]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--sage)] [&_blockquote]:pl-2 [&_blockquote]:italic"
                                      dangerouslySetInnerHTML={{ __html: att.notes }}
                                    />
                                  ) : (
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium italic">"{att.notes}"</p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              {hasFilho && (
                                <Link 
                                  to={`/agenda?date=${extractUTCDate(attendances.find(a => a.parentId === att.id).date)}`}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--peach)] hover:opacity-95 bg-[var(--peach-light)] px-3 py-2 rounded-lg border border-[var(--peach)]/20 transition-all"
                                >
                                  <ChevronRight size={12} />
                                  Ver Reagendamento
                                </Link>
                              )}
                              {isFilho && (
                                <Link 
                                  to={`/agenda?date=${extractUTCDate(attendances.find(a => a.id === att.parentId)?.date || att.date)}`}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-alt)] px-3 py-2 rounded-lg border border-[var(--border)] transition-all"
                                >
                                  <ArrowLeft size={12} />
                                  Ver Origem
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* Agenda Tab */}
          {activeTab === "settings" && (
            <div className="space-y-5 animate-fade-in flex flex-col md:flex-1 md:min-h-0">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard compact icon={<Calendar size={14} />} iconBg="var(--status-presente-bg)" iconColor="var(--status-presente-text)" label="Horários Ativos" value={agendaStats.totalActive} />
                <KpiCard compact icon={<Activity size={14} />} iconBg="var(--status-confirmado-bg)" iconColor="var(--status-confirmado-text)" label="Sessões no Mês" value={agendaStats.thisMonthCount} />
                <KpiCard compact icon={<Clock size={14} />} iconBg="var(--surface-alt)" iconColor="var(--text-secondary)" label="Próxima Sessão" value={agendaStats.nextSession ? format(agendaStats.nextSession.date, "dd/MM", { locale: ptBR }) + " • " + agendaStats.nextSession.time : "—"} />
                <KpiCard compact icon={<RefreshCcw size={14} />} iconBg="var(--status-justificada-bg)" iconColor="var(--status-justificada-text)" label="Frequência Semanal" value={agendaStats.recurringSummary || "—"} />
              </div>

              {/* Filtro de Período */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 pb-1 shrink-0">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 hidden md:inline-block">Período</span>
                  {[
                    { key: "thisMonth", label: "Este Mês", mobile: true },
                    { key: "lastMonth", label: "Mês Anterior", mobile: false },
                    { key: "custom", label: "Personalizado", mobile: true },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSelectedCalendarDay(null);
                        setCalendarPeriodFilter(opt.key);
                        const now = new Date();
                        if (opt.key === "thisMonth") {
                          setCalendarDate(now);
                          setCalendarCustomMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
                        } else if (opt.key === "lastMonth") {
                          const d = subMonths(now, 1);
                          setCalendarDate(d);
                          setCalendarCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                        } else if (opt.key === "custom") {
                          const [y, m] = calendarCustomMonth.split("-").map(Number);
                          setCalendarDate(new Date(y, m - 1, 1));
                        }
                      }}
                      className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-center flex-1 md:flex-initial md:shrink-0 ${
                        opt.mobile ? "" : "hidden md:inline-block"
                      } ${
                        calendarPeriodFilter === opt.key
                          ? "bg-[var(--sage)] text-white shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--sage)] hover:text-[var(--sage)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                {calendarPeriodFilter === "custom" && (
                  <div className="flex items-center justify-between w-full md:w-auto gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm p-1">
                    <button onClick={() => { setSelectedCalendarDay(null); const [y, m] = calendarCustomMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; setCalendarCustomMonth(val); setCalendarDate(d); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] transition-all"><ChevronLeft size={16} /></button>
                    <select value={calendarCustomMonth} onChange={e => { setSelectedCalendarDay(null); setCalendarCustomMonth(e.target.value); const [y, m] = e.target.value.split("-").map(Number); setCalendarDate(new Date(y, m - 1, 1)); }} className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 flex-1 md:flex-initial min-w-[80px]">
                      {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((name, i) => {
                        const monthVal = i + 1;
                        const currentYear = calendarCustomMonth.split("-")[0];
                        return <option key={`${currentYear}-${String(monthVal).padStart(2, "0")}`} value={`${currentYear}-${String(monthVal).padStart(2, "0")}`} className="bg-[var(--surface)] text-[var(--text-primary)]">{name}</option>;
                      })}
                    </select>
                    <select value={calendarCustomMonth.split("-")[0]} onChange={e => { setSelectedCalendarDay(null); const month = calendarCustomMonth.split("-")[1]; const val = `${e.target.value}-${month}`; setCalendarCustomMonth(val); const [y, m] = val.split("-").map(Number); setCalendarDate(new Date(y, m - 1, 1)); }} className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 min-w-[60px]">
                      {Array.from({ length: 11 }, (_, i) => { const year = new Date().getFullYear() - 5 + i; return <option key={year} value={year} className="bg-[var(--surface)] text-[var(--text-primary)]">{year}</option>; })}
                    </select>
                    <button onClick={() => { setSelectedCalendarDay(null); const [y, m] = calendarCustomMonth.split("-").map(Number); const d = new Date(y, m, 1); const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; setCalendarCustomMonth(val); setCalendarDate(d); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] transition-all"><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>

              {/* Calendar Card */}
              <div className="md:card md:p-6 flex flex-col md:flex-1 md:min-h-0 md:overflow-hidden">
                {loadingAppointments ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-[var(--sage)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Carregando agenda...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:flex-1 md:min-h-0 md:overflow-hidden">
                    {/* Left: Calendar */}
                      <div className="w-full md:w-[60%] flex flex-col md:min-h-0">
                        <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)] uppercase tracking-wide mb-3 shrink-0">Calendário de Sessões</h3>
                        <div className="p-4 bg-[var(--surface-alt)] rounded-[20px] border border-[var(--border)] flex flex-col md:flex-1 md:min-h-0 md:overflow-hidden">

                        <DayPicker
                          month={calendarDate}
                        onMonthChange={(date) => { setSelectedCalendarDay(null); setCalendarDate(date); }}
                        onDayClick={(day) => handleDayClick(day)}
                        locale={ptBR}
                        modifiers={{
                          mine: sessionModifiers.mine,
                          others: sessionModifiers.others,
                          conflict: sessionModifiers.conflictDates,
                        }}
                        modifiersClassNames={{}}
                        classNames={{
                          months: "flex flex-col flex-1 min-h-0",
                          month: "w-full flex flex-col flex-1 min-h-0",
                          month_grid: "w-full flex-1 table-fixed border border-[var(--border)] rounded-xl overflow-hidden",
                          weekdays: "bg-[var(--surface-alt)]",
                          weekday: "py-3 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-r border-b border-[var(--border)] last:border-r-0",
                          week: "h-0",
                          day: "text-center border-r border-b border-[var(--border)] last:border-r-0 p-0 h-0",
                          day_button: "relative w-full h-full flex items-center justify-center text-sm font-bold text-[var(--text-secondary)] cursor-pointer transition-colors",
                          today: "font-black",
                          outside: "text-[var(--text-muted)]/40",
                          disabled: "cursor-default opacity-40",
                        }}
                        components={{
                          DayButton: ({ day, modifiers, children, ...props }) => {
                            const date = day.date;
                            const isToday = modifiers?.today;
                            const dayStr = format(date, "yyyy-MM-dd");
                            const selectedStr = selectedCalendarDay ? format(selectedCalendarDay, "yyyy-MM-dd") : null;

                            let bgClass = "";
                            if (modifiers?.conflict) bgClass = "bg-[var(--status-falta-bg)]";
                            else if (modifiers?.others) bgClass = "bg-[var(--status-justificada-bg)]";
                            else if (modifiers?.mine) bgClass = "bg-[var(--status-presente-bg)]";

                            return (
                              <button {...props} className={`relative w-full h-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${isToday ? "" : "hover:bg-[var(--surface-alt)]"} ${bgClass}`}>
                                {modifiers?.mine && showAllAppointments && (
                                  <div className="absolute bottom-1 left-1.5 right-1.5 h-[3px] rounded-full bg-[var(--sage)]" />
                                )}
                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${
                                  isToday ? "bg-[var(--text-primary)] text-[var(--surface)]" : dayStr === selectedStr ? "ring-2 ring-[var(--sage)]" : "text-[var(--text-primary)]"
                                }`}>
                                  {date.getDate()}
                                </span>
                              </button>
                            );
                          },
                          MonthCaption: ({ calendarMonth }) => (
                            <div className="shrink-0 mb-3">
                              <p
                                className="text-sm font-bold text-[var(--text-secondary)] capitalize cursor-pointer hover:text-[var(--sage)] transition-colors"
                                onClick={() => {
                                  setCalendarDate(calendarMonth.date);
                                  setSelectedCalendarDay(null);
                                }}
                              >
                                {format(calendarMonth.date, "MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          ),
                          Nav: () => null,
                          Root: ({ children, ...props }) => (
                            <div {...props} className="flex-1 flex flex-col min-h-0" onClick={() => showMonthPicker && setShowMonthPicker(false)}>
                              {children}
                            </div>
                          ),
                        }}
                      />

                      {/* Legend */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-[var(--border)] shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded bg-[var(--status-presente-bg)] border border-[var(--status-presente-text)]/30" />
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{patient?.name?.split(" ")[0] || "Paciente"}</span>
                        </div>
                        {showAllAppointments && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-[var(--status-justificada-bg)] border border-[var(--status-justificada-text)]/30" />
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Outros</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded bg-[var(--status-falta-bg)] border border-[var(--status-falta-text)]/30" />
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Conflito</span>
                        </div>
                        </div>
                      </div>
                      </div>

                    {/* Right: Agenda */}
                    <div className="w-full md:w-[40%] flex flex-col md:pr-2 gap-3 mb-4 md:mb-0">
                      <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide shrink-0">Agendamentos</h3>
                      <div className="md:flex-1 md:min-h-0 md:overflow-y-auto patients-scrollbar flex flex-col">
                      {showEditChoice && editingAppointment && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px]" onClick={() => { setShowEditChoice(false); setEditingAppointment(null); }}>
                          <div className="bg-[var(--surface)] rounded-[24px] p-6 w-full max-w-sm mx-4 shadow-2xl animate-scale-in border border-[var(--border)]" onClick={e => e.stopPropagation()}>
                            <div className="text-center mb-6">
                              <div className="w-12 h-12 rounded-[14px] bg-[var(--surface-alt)] flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]">
                                <Pencil size={22} />
                              </div>
                              <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Editar horário</h3>
                              <p className="text-sm text-[var(--text-secondary)] font-bold mt-1">
                                {format(editChoiceDate, "EEEE, d 'de' MMMM", { locale: ptBR })} às {editingAppointment.time}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
                                Este horário se repete semanalmente. Como deseja editar?
                              </p>
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={handleEditSingle}
                                className="w-full py-2.5 px-4 bg-[var(--surface-alt)] text-[var(--text-primary)] rounded-[12px] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all outline-none"
                              >
                                Apenas esta data
                              </button>
                              <button
                                onClick={handleEditFuture}
                                className="w-full py-2.5 px-4 bg-[var(--text-primary)] text-[var(--surface)] rounded-[12px] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all outline-none"
                              >
                                Esta e todas futuras
                              </button>
                            </div>
                            <button
                              onClick={() => { setShowEditChoice(false); setEditingAppointment(null); }}
                              className="w-full mt-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider outline-none"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {showDeleteChoice && editingAppointment && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px]" onClick={() => { setShowDeleteChoice(false); setEditingAppointment(null); }}>
                          <div className="bg-[var(--surface)] rounded-[24px] p-6 w-full max-w-sm mx-4 shadow-2xl animate-scale-in border border-[var(--border)]" onClick={e => e.stopPropagation()}>
                            <div className="text-center mb-6">
                              <div className="w-12 h-12 rounded-[14px] bg-[var(--status-falta-bg)] flex items-center justify-center mx-auto mb-4 text-[var(--status-falta-text)]">
                                <Trash2 size={22} />
                              </div>
                              <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Excluir Agendamento</h3>
                              <p className="text-sm font-bold text-[var(--text-secondary)] mt-1">
                                {editingAppointment.time} &bull; {editingAppointment.duration}min
                              </p>
                              <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
                                Este horário se repete semanalmente. Como deseja excluir?
                              </p>
                            </div>
                            <div className="space-y-2">
                              <button 
                                onClick={handleDeleteSingleDate} 
                                className="w-full py-2.5 px-4 bg-[var(--surface-alt)] text-[var(--text-primary)] rounded-[12px] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all outline-none"
                              >
                                Apenas esta data
                              </button>
                              <button 
                                onClick={handleDeleteSeries} 
                                className="w-full py-2.5 px-4 bg-[var(--status-falta-bg)] text-[var(--status-falta-text)] rounded-[12px] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all outline-none"
                              >
                                Toda a série recorrente
                              </button>
                              <button 
                                onClick={handleDeleteAllInTime} 
                                className="w-full py-2.5 px-4 bg-red-500 text-white rounded-[12px] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all outline-none"
                              >
                                Todos os dias neste horário
                              </button>
                            </div>
                            <button onClick={() => { setShowDeleteChoice(false); setEditingAppointment(null); }} className="w-full mt-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider outline-none">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedCalendarDay ? (
                        <div className="p-4 bg-[var(--surface)] rounded-[20px] border border-[var(--border)] flex-1 flex flex-col min-h-0">
                          <div className="flex items-start justify-between mb-3 shrink-0">
                            <div>
                              <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                                {format(selectedCalendarDay, "EEEE", { locale: ptBR })}
                              </h4>
                              <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                                {format(selectedCalendarDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1.5 overflow-y-auto patients-scrollbar min-h-0 pr-1.5">
                            {appointments
                              .filter(a => {
                                const dateStr = format(selectedCalendarDay, "yyyy-MM-dd");
                                if (a.scheduledDate) {
                                  if (dateStr !== a.scheduledDate.split("T")[0]) return false;
                                } else {
                                  const dayOfWeek = selectedCalendarDay.getDay();
                                  if (a.dayOfWeek !== dayOfWeek) return false;
                                }
                                if (a.endDate && dateStr > a.endDate.split("T")[0]) return false;
                                if (a.skipDates && Array.isArray(a.skipDates) && a.skipDates.includes(dateStr)) return false;
                                if (a.startDate && dateStr < a.startDate.split("T")[0]) return false;
                                if (a.maxSessions && a.maxSessions > 0 && a.startDate) {
                                  const start = parseLocalDateStr(a.startDate);
                                  let count = 0;
                                  const cursor = new Date(start);
                                  while (cursor <= selectedCalendarDay) {
                                    if (cursor.getDay() === a.dayOfWeek) count++;
                                    cursor.setDate(cursor.getDate() + 7);
                                  }
                                  if (count > a.maxSessions) return false;
                                }
                                return true;
                              })
                              .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                              .map(app => {
                                const conflict = conflicts[app.id];
                                const appPatientId = app.patient?.id ?? app.patientId;
                                const isOtherPatient = appPatientId && appPatientId !== id;
                                return (
                                  <div key={app.id} className={`flex items-center gap-2 p-2.5 rounded-[12px] border border-[var(--border)] transition-all duration-200 ease-out cursor-pointer ${
                                    conflict ? "bg-[var(--status-falta-bg)]/30" : isOtherPatient ? "bg-[var(--status-justificada-bg)]/30" : "bg-[var(--surface)] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                  }`}>
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                        conflict ? "bg-[var(--status-falta-bg)] text-[var(--status-falta-text)]" : isOtherPatient ? "bg-[var(--status-justificada-bg)] text-[var(--status-justificada-text)]" : "bg-[var(--status-presente-bg)] text-[var(--status-presente-text)]"
                                      }`}>
                                        <Clock size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-xs font-bold truncate ${isOtherPatient ? "text-[var(--status-justificada-text)]" : "text-[var(--text-primary)]"}`}>
                                          {(isOtherPatient ? app.patient?.name : patient?.name)?.split(" ")[0] || "Paciente"}
                                        </p>
                                        <p className="text-[9px] font-semibold text-[var(--text-muted)]">{app.maxSessions ? `${app.maxSessions} sessões` : app.startDate ? "Semanal" : app.scheduledDate ? format(new Date(app.scheduledDate), "dd/MM/yy") : "Avulso"}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <span className="text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">{app.time} • {app.duration}min</span>
                                      {conflict && (
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--status-falta-bg)] text-[var(--status-falta-text)] border border-[var(--status-falta-text)]/20">
                                          Conflito
                                        </span>
                                      )}
                                      {!isOtherPatient && (
                                        <button
                                          type="button"
                                          onClick={() => handleSendWhatsAppReminder(app)}
                                          className="p-1.5 text-[var(--text-secondary)] hover:text-green-600 hover:bg-green-500/10 rounded-lg transition-all border border-[var(--border)] hover:border-green-500/35"
                                          title="Enviar Lembrete WhatsApp"
                                        >
                                          <Send size={13} />
                                        </button>
                                      )}
                                      {!isOtherPatient && (
                                        <button
                                          type="button"
                                          onClick={() => handleEditClick(app, selectedCalendarDay)}
                                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] rounded-lg transition-all border border-[var(--border)] hover:border-[var(--sage)]/35"
                                          title="Editar"
                                        >
                                          <Pencil size={13} />
                                        </button>
                                      )}
                                      {!isOtherPatient && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSlot(app.id, selectedCalendarDay)}
                                          className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-[var(--border)] hover:border-red-500/35"
                                          title="Remover"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            {appointments.filter(a => {
                              if (!myAppointmentIds.has(a.id)) return false;
                              const dateStr = format(selectedCalendarDay, "yyyy-MM-dd");
                              if (a.scheduledDate) {
                                if (dateStr !== a.scheduledDate.split("T")[0]) return false;
                              } else {
                                const dayOfWeek = selectedCalendarDay.getDay();
                                if (a.dayOfWeek !== dayOfWeek) return false;
                              }
                              if (a.endDate && dateStr > a.endDate.split("T")[0]) return false;
                              if (a.skipDates && Array.isArray(a.skipDates) && a.skipDates.includes(dateStr)) return false;
                              if (a.startDate && dateStr < a.startDate.split("T")[0]) return false;
                              if (a.maxSessions && a.maxSessions > 0 && a.startDate) {
                                const start = parseLocalDateStr(a.startDate);
                                let count = 0;
                                const cursor = new Date(start);
                                while (cursor <= selectedCalendarDay) {
                                  if (cursor.getDay() === a.dayOfWeek) count++;
                                  cursor.setDate(cursor.getDate() + 7);
                                }
                                if (count > a.maxSessions) return false;
                              }
                              return true;
                            }).length === 0 && (
                              <div className="text-center py-4">
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Nenhum horário neste dia</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-[var(--surface)] rounded-[20px] border border-[var(--border)] flex-1 flex flex-col min-h-0">
                          <div className="flex items-start justify-between mb-3 shrink-0">
                            <div>
                              <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Visão do Mês</h4>
                              <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                                {format(calendarDate, "MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-bold rounded-full shadow-sm">
                              {monthSessions.reduce((acc, d) => acc + d.sessions.length, 0)} SESSÕES
                            </span>
                          </div>
                          <div className="space-y-3 overflow-y-auto patients-scrollbar min-h-0 flex-1 pr-1.5">
                            {monthSessions.length === 0 ? (
                              <div className="text-center py-10">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nenhuma sessão neste mês</p>
                              </div>
                            ) : (
                              monthSessions.map(({ date, sessions }) => (
                                <div key={format(date, "yyyy-MM-dd")}>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <button
                                      onClick={() => setSelectedCalendarDay(date)}
                                      className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest hover:text-[var(--sage)] transition-colors"
                                    >
                                      {format(date, "EEE dd/MM", { locale: ptBR })}
                                    </button>
                                    <div className="flex-1 border-t border-[var(--border)]" />
                                  </div>
                                  {sessions.map(app => {
                                    const conflict = conflicts[app.id];
                                    const appPatientId = app.patient?.id ?? app.patientId;
                                    const isOtherPatient = appPatientId && appPatientId !== id;
                                    const displayName = (isOtherPatient ? app.patient?.name : patient?.name) || "Paciente";
                                    const { initials, color: avatarColor } = getAvatarProps(displayName);
                                    return (
                                      <div key={app.id} className={`flex items-center gap-2 p-3 rounded-[12px] border border-[var(--border)] mb-1 transition-all duration-200 ease-out cursor-pointer ${
                                        conflict ? "bg-[var(--status-falta-bg)]/30" : isOtherPatient ? "bg-[var(--status-justificada-bg)]/30" : "bg-[var(--surface)] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                      }`}>
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[9px] shrink-0 ${isOtherPatient ? "bg-[var(--surface-alt)] text-[var(--text-muted)]" : ""}`} style={isOtherPatient ? {} : { backgroundColor: avatarColor.bg, color: avatarColor.text }}>
                                          {initials}
                                        </div>
                                        <p className={`text-xs font-bold truncate flex-1 min-w-0 ${isOtherPatient ? "text-[var(--status-justificada-text)]" : "text-[var(--text-primary)]"}`}>{displayName}</p>
                                        <span className="text-[10px] font-semibold text-[var(--text-secondary)] shrink-0">{app.time} &bull; {app.duration}min</span>
                                        {conflict && (
                                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--status-falta-bg)] text-[var(--status-falta-text)] border border-[var(--status-falta-text)]/20 shrink-0">
                                            Conflito
                                          </span>
                                        )}
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

                      <div className="flex items-center gap-3 shrink-0 justify-end">
                        {appointments.length > 0 && (
                          <button 
                            onClick={() => handleClearAgenda()} 
                            className="flex items-center gap-1.5 py-2 px-4 rounded-[12px] bg-red-500 text-white font-bold text-xs whitespace-nowrap hover:opacity-95 transition-all outline-none shadow-sm"
                          >
                            <Trash2 size={14} /> Limpar Agenda
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenNewSlotModal()} 
                          className="flex items-center gap-1.5 py-2 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs whitespace-nowrap hover:opacity-95 transition-all outline-none shadow-sm"
                        >
                          <Plus size={14} /> Lançar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Financial Tab */}
          {activeTab === "financial" && (
            <div className="space-y-5 animate-fade-in flex flex-col md:flex-1 md:min-h-0">
              {/* Financial Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard compact icon={<DollarSign size={14} />} iconBg="var(--status-presente-bg)" iconColor="var(--status-presente-text)" label="Total Pago" value={`R$ ${filteredPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <KpiCard compact icon={<Clock size={14} />} iconBg="var(--status-justificada-bg)" iconColor="var(--status-justificada-text)" label="Sessões Pendentes" value={attendances.filter(a => !a.paymentId && (a.status === 'presente' || a.status === 'falta')).length} />
                <KpiCard compact icon={<Receipt size={14} />} iconBg="var(--status-confirmado-bg)" iconColor="var(--status-confirmado-text)" label="Lançamentos Realizados" value={filteredPayments.length} />
                <KpiCard compact icon={<CreditCard size={14} />} iconBg="var(--surface-alt)" iconColor="var(--text-secondary)" label="Último Recebimento" value={filteredPayments.length > 0
                  ? (() => {
                      const last = [...filteredPayments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
                      return format(new Date(last.paymentDate), "dd/MM", { locale: ptBR }) + " • R$ " + Number(last.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                    })()
                  : "—"} />
              </div>

              {/* Filtro de Período */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 pb-1">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 hidden md:inline-block">Período</span>
                  {[
                    { key: "thisMonth", label: "Este Mês", mobile: true },
                    { key: "lastMonth", label: "Mês Anterior", mobile: false },
                    { key: "last3Months", label: "Últimos 3 Meses", mobile: false },
                    { key: "all", label: "Todo Histórico", mobile: false },
                    { key: "custom", label: "Personalizado", mobile: true },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setPeriodFilter(opt.key);
                        const now = new Date();
                        if (opt.key === "thisMonth") {
                          setCustomMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
                        } else if (opt.key === "lastMonth") {
                          const d = subMonths(now, 1);
                          setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                        }
                      }}
                      className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-center flex-1 md:flex-initial md:shrink-0 ${
                        opt.mobile ? "" : "hidden md:inline-block"
                      } ${
                        periodFilter === opt.key
                          ? "bg-[var(--sage)] text-white shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--sage)] hover:text-[var(--sage)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                {periodFilter === "custom" && (
                  <div className="flex items-center justify-between w-full md:w-auto gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm p-1">
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] transition-all"><ChevronLeft size={16} /></button>
                    <select value={customMonth} onChange={e => setCustomMonth(e.target.value)} className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 flex-1 md:flex-initial min-w-[80px]">
                      {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((name, i) => {
                        const monthVal = i + 1;
                        const currentYear = customMonth.split("-")[0];
                        return <option key={`${currentYear}-${String(monthVal).padStart(2, "0")}`} value={`${currentYear}-${String(monthVal).padStart(2, "0")}`} className="bg-[var(--surface)] text-[var(--text-primary)]">{name}</option>;
                      })}
                    </select>
                    <select value={customMonth.split("-")[0]} onChange={e => { const month = customMonth.split("-")[1]; setCustomMonth(`${e.target.value}-${month}`); }} className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 min-w-[60px]">
                      {Array.from({ length: 11 }, (_, i) => { const year = new Date().getFullYear() - 5 + i; return <option key={year} value={year} className="bg-[var(--surface)] text-[var(--text-primary)]">{year}</option>; })}
                    </select>
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] transition-all"><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>

              {/* Payments History Table */}
              <div className="card p-6 md:flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">Histórico de Lançamentos</h3>
                </div>
                <div className="p-4 bg-[var(--surface-alt)] rounded-[20px] border border-[var(--border)] md:flex-1 flex flex-col">
                {loadingPayments ? (
                  <div className="text-center py-20 opacity-50 flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[var(--sage)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Carregando financeiro...</p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--status-justificada-bg)] flex items-center justify-center mb-5 text-[var(--status-justificada-text)]">
                      <CreditCard size={32} />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Nenhum pagamento no período</p>
                    <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xs leading-relaxed">Lançamentos de pagamento aparecerão aqui conforme você registrar os blocos de sessões.</p>
                  </div>
                ) : (
                  <>
                  {/* Desktop: Table */}
                  <div className="hidden md:block overflow-x-auto overflow-y-auto patients-scrollbar flex-1 min-h-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border)]">
                          <th className="text-left px-2 py-2 min-w-[180px]">Período das Sessões</th>
                          <th className="text-left px-2 py-2 whitespace-nowrap">Valor Pago</th>
                          <th className="text-left px-2 py-2 whitespace-nowrap">Data do Pagamento</th>
                          <th className="text-left px-2 py-2">Recibo</th>
                          <th className="text-right px-2 py-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {payments.map(payment => (
                          <tr key={payment.id} className="hover:bg-[var(--surface-alt)]/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap">
                                  {payment.attendances.length > 0 
                                    ? `${format(new Date(payment.attendances[0].date), 'dd/MM/yy')} a ${format(new Date(payment.attendances[payment.attendances.length-1].date), 'dd/MM/yy')}`
                                    : 'Sem sessões vinculadas'}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                  {payment.attendances.length} sessões inclusas
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-bold text-[var(--text-primary)]">
                                R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-[var(--text-secondary)] font-medium">
                                {format(new Date(payment.paymentDate), 'dd/MM/yyyy')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                {payment.receiptIssued ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--status-presente-bg)] text-[var(--status-presente-text)] text-[10px] font-bold rounded-lg border border-[var(--status-presente-text)]/20 whitespace-nowrap">
                                    <Check size={10} />
                                    NOTA DE SERVIÇO
                                  </span>
                                ) : payment.receiptAttachment ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--status-justificada-bg)] text-[var(--status-justificada-text)] text-[10px] font-bold rounded-lg border border-[var(--status-justificada-text)]/20 whitespace-nowrap">
                                    <Paperclip size={10} />
                                    COM ANEXO
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--surface-alt)] text-[var(--text-muted)] text-[10px] font-bold rounded-lg border border-[var(--border)] whitespace-nowrap">
                                    PENDENTE
                                  </span>
                                )}
                                {payment.receiptAttachment && (
                                  <button 
                                    onClick={() => handleDownloadReceipt(payment.receiptAttachment.id, payment.receiptAttachment.originalName || payment.receiptAttachment.filename)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--status-confirmado-bg)] text-[var(--status-confirmado-text)] text-[10px] font-bold rounded-lg border border-[var(--status-confirmado-text)]/20 hover:opacity-90 transition-colors whitespace-nowrap max-w-[140px]"
                                    title="Baixar arquivo anexado"
                                  >
                                    <Download size={10} />
                                    <span className="truncate">
                                      {(payment.receiptAttachment.originalName || payment.receiptAttachment.filename)?.length > 18 
                                        ? (payment.receiptAttachment.originalName || payment.receiptAttachment.filename).slice(0, 18) + '...' 
                                        : payment.receiptAttachment.originalName || payment.receiptAttachment.filename}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => openEditPayment(payment)}
                                  className="p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] rounded-lg transition-all"
                                  title="Editar Lançamento"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  onClick={() => handleGenerateReceipt(payment)}
                                  className="p-2 text-[var(--sage)] hover:bg-[var(--sage-light)] rounded-lg transition-all"
                                  title="Gerar Prestação de Contas (PDF)"
                                >
                                  <Download size={16} />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if(confirm("Excluir este lançamento financeiro? Os atendimentos voltarão ao status pendente.")) {
                                      await api.deletePayment(payment.id);
                                      loadPatientPayments();
                                      loadPatientAttendances();
                                    }
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: Card list */}
                  <div className="md:hidden space-y-2">
                    {payments.map(payment => (
                      <div key={payment.id} className="p-3 bg-[var(--surface)] rounded-[14px] border border-[var(--border)]">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                              R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">
                              {payment.attendances.length > 0 
                                ? `${format(new Date(payment.attendances[0].date), 'dd/MM/yy')} a ${format(new Date(payment.attendances[payment.attendances.length-1].date), 'dd/MM/yy')}`
                                : 'Sem sessões vinculadas'}
                              {' • '}{payment.attendances.length} sessões
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                            payment.receiptIssued 
                              ? "bg-[var(--status-presente-bg)] text-[var(--status-presente-text)]" 
                              : "bg-[var(--status-justificada-bg)] text-[var(--status-justificada-text)]"
                          }`}>
                            <Receipt size={8} />
                            {payment.receiptIssued ? "Recibo" : "Pendente"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-[var(--text-muted)] font-medium">
                            {format(new Date(payment.paymentDate), 'dd/MM/yyyy')} • {payment.method}
                          </p>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditPayment(payment)} className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] rounded-lg transition-all" title="Editar">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleGenerateReceipt(payment)} className="p-1.5 text-[var(--sage)] hover:bg-[var(--sage-light)] rounded-lg transition-all" title="PDF">
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                )}  
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0 justify-end">
                  {payments.length > 0 && (
                    <button 
                      onClick={() => handleGenerateAllReceipts()} 
                      className="py-2 px-4 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all outline-none shadow-sm flex items-center gap-2"
                    >
                      <File size={14} />
                      Gerar Relatório Completo
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPaymentFormData({
                        amount: "",
                        paymentDate: new Date().toISOString().split('T')[0],
                        method: "Pix",
                        notes: "",
                        receiptIssued: false,
                        receiptFile: null,
                        existingReceiptAttachmentId: null,
                        existingReceiptFilename: null
                      });
                      setSelectedAttendances([]);
                      setShowPaymentModal(true);
                    }}
                    className="py-2 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none shadow-sm flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Lançar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Share Tab */}
          {activeTab === "share" && (
            <div className="space-y-5 animate-fade-in flex flex-col md:flex-1 md:min-h-0">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiCard compact icon={<Send size={14} />} iconBg="var(--status-justificada-bg)" iconColor="var(--status-justificada-text)" label="Pendentes" value={patientShareLinks.filter(l => l.status === "PENDENTE").length} />
                <KpiCard compact icon={<Check size={14} />} iconBg="var(--status-presente-bg)" iconColor="var(--status-presente-text)" label="Respondidos" value={patientShareLinks.filter(l => l.status === "RESPONDIDO").length} />
                <KpiCard compact icon={<TrendingUp size={14} />} iconBg="var(--status-confirmado-bg)" iconColor="var(--status-confirmado-text)" label="Adesão" value={patientShareLinks.length > 0
                  ? Math.round((patientShareLinks.filter(l => l.status === "RESPONDIDO").length / patientShareLinks.length) * 100) + "%"
                  : "0%"} />
              </div>

              {/* Filtro de Período */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 pb-1">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 hidden md:inline-block">Período</span>
                  {[
                    { key: "thisMonth", label: "Este Mês", mobile: true },
                    { key: "lastMonth", label: "Mês Anterior", mobile: false },
                    { key: "last3Months", label: "Últimos 3 Meses", mobile: false },
                    { key: "all", label: "Todo Histórico", mobile: false },
                    { key: "custom", label: "Personalizado", mobile: true },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setPeriodFilter(opt.key);
                        const now = new Date();
                        if (opt.key === "thisMonth") {
                          setCustomMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
                        } else if (opt.key === "lastMonth") {
                          const d = subMonths(now, 1);
                          setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                        }
                      }}
                      className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-center flex-1 md:flex-initial md:shrink-0 ${
                        opt.mobile ? "" : "hidden md:inline-block"
                      } ${
                        periodFilter === opt.key
                          ? "bg-[var(--sage)] text-white shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--sage)] hover:text-[var(--sage)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                {periodFilter === "custom" && (
                  <div className="flex items-center justify-between w-full md:w-auto gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm p-1">
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] transition-all"><ChevronLeft size={16} /></button>
                    <select value={customMonth} onChange={e => setCustomMonth(e.target.value)} className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 flex-1 md:flex-initial min-w-[80px]">
                      {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((name, i) => {
                        const monthVal = i + 1;
                        const currentYear = customMonth.split("-")[0];
                        return <option key={`${currentYear}-${String(monthVal).padStart(2, "0")}`} value={`${currentYear}-${String(monthVal).padStart(2, "0")}`} className="bg-[var(--surface)] text-[var(--text-primary)]">{name}</option>;
                      })}
                    </select>
                    <select value={customMonth.split("-")[0]} onChange={e => { const month = customMonth.split("-")[1]; setCustomMonth(`${e.target.value}-${month}`); }} className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 min-w-[60px]">
                      {Array.from({ length: 11 }, (_, i) => { const year = new Date().getFullYear() - 5 + i; return <option key={year} value={year} className="bg-[var(--surface)] text-[var(--text-primary)]">{year}</option>; })}
                    </select>
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)] transition-all"><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>

              {/* Instrumentos List */}
              <div className="card p-6 md:flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">Compartilhar Instrumentos</h3>
                </div>
                <div className="p-4 bg-[var(--surface-alt)] rounded-[20px] border border-[var(--border)] md:flex-1 flex flex-col">
                {loadingLinks ? (
                  <div className="text-center py-20 opacity-50 flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[var(--sage)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Carregando instrumentos...</p>
                  </div>
                ) : filteredLinks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center mb-5 text-[var(--text-muted)]">
                      <Share2 size={32} />
                    </div>
                    <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">Nenhum registro no período</h4>
                    <p className="text-xs font-semibold text-[var(--text-muted)] max-w-[240px] leading-relaxed">
                      Registros de instrumentos aparecerão aqui conforme você enviar instrumentos para este paciente.
                    </p>
                  </div>
                ) : (
                  <>
                  {/* Desktop: Table */}
                  <div className="hidden md:block overflow-x-auto overflow-y-auto patients-scrollbar flex-1 min-h-0">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border)]">
                          <th className="text-left px-2 py-2">Instrumento</th>
                          <th className="text-left px-2 py-2">Progresso</th>
                          <th className="text-left px-2 py-2">Status</th>
                          <th className="text-left px-2 py-2">Última resposta</th>
                          <th className="text-left px-2 py-2">Criado em</th>
                          <th className="text-center px-2 py-2">Link</th>
                          <th className="text-center px-2 py-2">Excluir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLinks.map(link => (
                          <tr key={link.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-alt)]/50 transition-colors">
                            <td className="px-2 py-3 text-[var(--text-primary)] font-bold text-sm">{link.form?.title || "—"}</td>
                            <td className="px-2 py-3 text-[var(--text-secondary)] whitespace-nowrap font-semibold">{link.responseCount || 0}</td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                link.status === "RESPONDIDO" 
                                  ? "bg-[var(--status-presente-bg)] text-[var(--status-presente-text)]" 
                                  : "bg-[var(--status-justificada-bg)] text-[var(--status-justificada-text)]"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  link.status === "RESPONDIDO" ? "bg-[var(--sage)]" : "bg-[var(--peach)]"
                                }`} />
                                {link.status === "RESPONDIDO" ? "Respondido" : "Pendente"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-[var(--text-secondary)] whitespace-nowrap font-medium">
                              {link.lastResponseAt
                                ? `${new Date(link.lastResponseAt).toLocaleDateString('pt-BR')} ${new Date(link.lastResponseAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                                : "—"}
                            </td>
                            <td className="px-2 py-3 text-[var(--text-secondary)] whitespace-nowrap font-medium">{new Date(link.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className="px-2 py-3 text-center">
                              {(() => {
                                const shareUrl = `${window.location.origin}/form/${link.token}`;
                                return (
                                  <button
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(shareUrl);
                                      alert("Link copiado!");
                                    }}
                                    className="text-[10px] font-bold text-[var(--sage)] hover:opacity-90 bg-[var(--sage-light)] px-2 py-1 rounded-lg transition-colors border border-[var(--sage)]/20"
                                  >
                                    Link
                                  </button>
                                );
                              })()}
                            </td>
                            <td className="px-2 py-3 text-center">
                              <button
                                onClick={() => handleRevokeLink(link.id)}
                                className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: Card list */}
                  <div className="md:hidden space-y-2">
                    {filteredLinks.map(link => {
                      const shareUrl = `${window.location.origin}/form/${link.token}`;
                      return (
                        <div key={link.id} className="p-3 bg-[var(--surface)] rounded-[14px] border border-[var(--border)]">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{link.form?.title || "—"}</p>
                              <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">
                                Criado em {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                              link.status === "RESPONDIDO" 
                                ? "bg-[var(--status-presente-bg)] text-[var(--status-presente-text)]" 
                                : "bg-[var(--status-justificada-bg)] text-[var(--status-justificada-text)]"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                link.status === "RESPONDIDO" ? "bg-[var(--sage)]" : "bg-[var(--peach)]"
                              }`} />
                              {link.status === "RESPONDIDO" ? "Respondido" : "Pendente"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-medium">
                              <span>{link.responseCount || 0} respostas</span>
                              {link.lastResponseAt && (
                                <span>Última: {new Date(link.lastResponseAt).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={async () => {
                                  await navigator.clipboard.writeText(shareUrl);
                                  alert("Link copiado!");
                                }}
                                className="text-[10px] font-bold text-[var(--sage)] hover:opacity-90 bg-[var(--sage-light)] px-2 py-1 rounded-lg transition-colors border border-[var(--sage)]/20"
                              >
                                Link
                              </button>
                              <button
                                onClick={() => handleRevokeLink(link.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </>
                )}
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 justify-end">
                  <button 
                    onClick={() => setShowShareModal(true)} 
                    className="py-2 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none shadow-sm flex items-center gap-2"
                  >
                    <Plus size={14} /> Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prontuário Tab */}
          {activeTab === "notes" && (
            <div className="space-y-5 animate-fade-in flex flex-col md:flex-1 md:min-h-0">
              <div className="card p-6 md:flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wide">Prontuário</h3>
                    <p className="text-xs text-[var(--text-muted)]">Anotações e documentos</p>
                  </div>
                </div>
                <div className="p-4 bg-[var(--surface-alt)] rounded-[20px] border border-[var(--border)] md:flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col md:min-h-0">
                    <div className="shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Paperclip size={14} className="text-[var(--text-secondary)]" />
                          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Laudos e Anexos</h4>
                          {attachments.length > 0 && (
                            <span className="px-2 py-0.5 bg-[var(--surface)] text-[var(--text-secondary)] text-[10px] font-bold rounded-full border border-[var(--border)]">
                              {attachments.length}
                            </span>
                          )}
                        </div>
                        <label className="text-[11px] font-bold uppercase text-[var(--sage)] hover:opacity-90 cursor-pointer transition-colors flex items-center gap-1">
                          <Plus size={14} />
                          {uploading ? 'Enviando...' : 'Anexar'}
                          <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={uploading} onChange={handleUploadAttachment} />
                        </label>
                      </div>

                      {loadingAttachments ? (
                        <div className="text-center py-6 text-[var(--text-muted)]">
                          <div className="w-5 h-5 border-2 border-[var(--sage)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Carregando anexos...</p>
                        </div>
                      ) : attachments.length === 0 ? (
                        <div className="text-center py-6 text-[var(--text-muted)] bg-[var(--surface)]/60 rounded-[14px] border-2 border-dashed border-[var(--border)]">
                          <File size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-medium">Nenhum anexo</p>
                          <p className="text-[10px] mt-0.5">PDF, JPG, PNG, DOC (máx. 10MB)</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto patients-scrollbar">
                          {attachments.map((att) => (
                            <div key={att.id} className="flex items-center justify-between p-2.5 bg-[var(--surface)] rounded-[12px] border border-[var(--border)]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <File size={16} className="text-[var(--text-secondary)] shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{att.filename}</p>
                                  <p className="text-[10px] text-[var(--text-muted)]">{(att.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <button type="button" onClick={() => handleDownloadAttachment(att)} className="p-1.5 hover:bg-[var(--sage-light)] rounded text-[var(--text-secondary)] hover:text-[var(--sage)] transition-colors" title="Baixar">
                                  <Download size={14} />
                                </button>
                                <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-1.5 hover:bg-red-500/10 rounded text-[var(--text-secondary)] hover:text-red-500 transition-colors" title="Excluir">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                          <label className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--sage)] cursor-pointer transition-colors rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)]/60">
                            <Plus size={14} />
                            <span className="font-semibold">Adicionar mais</span>
                            <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={uploading} onChange={handleUploadAttachment} />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex-1 flex flex-col min-h-0">
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Anotações</label>
                      <textarea 
                        className="w-full p-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--sage)] outline-none resize-none transition-colors text-sm flex-1" 
                        value={formData?.notes || ''} 
                        onChange={e => setFormData(prev => prev ? { ...prev, notes: e.target.value } : null)} 
                        placeholder="Anotações relevantes sobre o paciente..."
                      />
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0 justify-end">
                  <button 
                    type="button" 
                    className="py-2 px-4 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all outline-none shadow-sm flex items-center gap-1.5" 
                    onClick={handleExportCompletePdf}
                  >
                    <Download size={14} /> Exportar PDF
                  </button>
                  <button 
                    className="py-2 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none shadow-sm flex items-center gap-1.5" 
                    onClick={handleSave}
                  >
                    <Save size={14} /> Salvar
                  </button>
                </div>
              </div>
            </div>
          )}





          {/* Timeline Tab (Original) */}
          {activeTab === "timeline" && (
            loadingLinks ? (
              <div className="text-center py-12 text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs">Carregando instrumentos...</p>
              </div>
            ) : patientShareLinks.length === 0 ? (
              <div className="card p-20 text-center border-dashed border-2">
                <FileText size={48} className="mx-auto text-brand-200 mb-6" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum registro ainda</h3>
                <p className="text-slate-600 max-w-sm mx-auto">Envie um instrumento ou escala para este paciente para começar a construir seu prontuário digital.</p>
                <Link to="/my-forms" className="btn btn-primary mt-8">Ir para Meus Instrumentos</Link>
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
                        <div className="w-2 h-2 rounded-full bg-brand-500" />
                        {answered.length === 1 ? 'Respondido' : 'Respondidos'} ({answered.length})
                      </h4>
                      <div className="space-y-4">
                        {answered.map(link => {
                          const response = link.response;
                          const result = scoreTest(null, response.data);
                          
                          return (
                            <div 
                              key={response.id}
                              className="card overflow-hidden group hover:border-brand-300 transition-all duration-300"
                            >
                              <div className="w-full flex items-center justify-between p-6 min-h-[100px]">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-14 h-14 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-700 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                    <FileText size={22} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base text-slate-900 group-hover:text-brand-700 transition-colors">{link.form?.title}</h4>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        Enviado em {new Date(link.createdAt).toLocaleDateString('pt-BR')} · {new Date(link.createdAt).toLocaleTimeString('pt-BR')}
                                      </p>
                                      <span className="text-xs font-bold px-3 py-1 bg-brand-50 text-brand-700 rounded-full">
                                        ✓ Respondido
                                      </span>
                                      <p className="text-xs font-bold text-brand-600">
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
                                    className="p-2 hover:bg-brand-50 rounded-lg transition-colors"
                                  >
                                    <ChevronRight
                                      size={22}
                                      className={`text-brand-400 transition-all duration-300 ${selectedResponseId === response.id ? 'rotate-90 text-slate-900 scale-110' : ''}`}
                                    />
                                  </button>
                                </div>
                              </div>

                              {selectedResponseId === response.id && (
                                <div className="p-6 bg-brand-50/50 border-t border-brand-50 max-h-[70vh] overflow-y-auto">
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
                                              <p className={`text-[10px] font-black mt-1 ${scoreDiff > 0 ? 'text-red-600' : scoreDiff < 0 ? 'text-brand-600' : 'text-slate-500'}`}>
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
                                        
                                        <div className="p-4 bg-brand-50/80 rounded-xl border border-brand-100/50">
                                          <p className="text-sm text-slate-800 leading-relaxed font-medium italic">"{result.interpretation}"</p>
                                        </div>

                                        {result.schemaDetails && (
                                          <div className="mt-6 p-6 rounded-2xl border bg-white shadow-sm">
                                            <h5 className="font-bold text-xs uppercase tracking-widest text-slate-900 mb-4">Perfil de Esquemas</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                              {result.schemaDetails.map((s) => (
                                                <div key={s.code} className={`p-3 rounded-xl border ${s.color || 'border-slate-200'} bg-white`}>
                                                  <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                      <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">{s.code}</p>
                                                      <p className="text-[9px] text-slate-500 font-medium">{s.name}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${s.color || 'text-slate-500 bg-slate-50'}`}>
                                                      {s.level}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-end gap-1">
                                                    <span className="text-xl font-black text-slate-900">{s.average !== null ? s.average.toFixed(2) : "—"}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium">/ 6</span>
                                                  </div>
                                                  <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                      className={`h-full rounded-full ${s.level === 'Muito Alta' ? 'bg-red-500' : s.level === 'Alta' ? 'bg-orange-500' : s.level === 'Moderada' ? 'bg-amber-500' : 'bg-brand-500'}`}
                                                      style={{ width: `${s.average !== null ? (s.average / 6) * 100 : 0}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
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
                    link.active && !link.response
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
                          return (
                            <div key={link.id} className="card p-6 bg-white border-brand-100 hover:border-brand-200 transition-all">
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
      </div>
      </div>
    </div>

      {/* Agenda Modal */}
      {showAgendaModal && agendaFormDate && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px]" onClick={() => { setShowAgendaModal(false); setEditingAppointment(null); setEditMode(null); }}>
          <div className="bg-[var(--surface)] rounded-[24px] p-6 w-full max-w-lg mx-4 shadow-2xl animate-scale-in border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">{editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}</h3>
                <p className="text-xs text-[var(--text-muted)] font-semibold mt-1">
                  {format(agendaFormDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={() => { setShowAgendaModal(false); setEditingAppointment(null); setEditMode(null); }}
                className="p-2 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Dia</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--sage)] outline-none text-sm font-semibold"
                    value={agendaFormDayOfWeek ?? (agendaFormDate?.getDay() ?? 1)}
                    onChange={e => setAgendaFormDayOfWeek(parseInt(e.target.value))}
                  >
                    {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d, i) => (
                      <option key={i} value={i} className="bg-[var(--surface)] text-[var(--text-primary)]">{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Horário</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--sage)] outline-none text-sm font-semibold"
                    value={agendaFormTime}
                    onChange={e => setAgendaFormTime(e.target.value)}
                  >
                    {["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"].map(t => (
                      <option key={t} value={t} className="bg-[var(--surface)] text-[var(--text-primary)]">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Duração</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--sage)] outline-none text-sm font-semibold"
                    value={agendaFormDuration}
                    onChange={e => setAgendaFormDuration(parseInt(e.target.value))}
                  >
                    <option value={30} className="bg-[var(--surface)] text-[var(--text-primary)]">30 minutos</option>
                    <option value={45} className="bg-[var(--surface)] text-[var(--text-primary)]">45 minutos</option>
                    <option value={50} className="bg-[var(--surface)] text-[var(--text-primary)]">50 minutos</option>
                    <option value={60} className="bg-[var(--surface)] text-[var(--text-primary)]">60 minutos</option>
                    <option value={90} className="bg-[var(--surface)] text-[var(--text-primary)]">90 minutos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--surface-alt)] rounded-[20px] border border-[var(--border)]">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agendaFormRecurring}
                    onChange={e => setAgendaFormRecurring(e.target.checked)}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--sage)] focus:ring-[var(--sage)] bg-[var(--surface)]"
                  />
                  <div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      Repetir semanalmente
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] font-semibold">
                      Toda {["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][agendaFormDate.getDay()]}
                    </p>
                  </div>
                </label>
                {agendaFormRecurring && (
                  <div className="w-28">
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Nº Sessões</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--sage)] outline-none text-xs font-bold text-center"
                      value={agendaFormMaxSessions || ""}
                      onChange={e => setAgendaFormMaxSessions(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0 = ilimitado"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => { setShowAgendaModal(false); setEditingAppointment(null); setEditMode(null); }}
                className="py-2.5 px-4 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all outline-none flex items-center justify-center gap-1.5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewSlot}
                disabled={savingAgenda}
                className="py-2.5 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none flex items-center justify-center gap-1.5 shadow-sm"
              >
                {savingAgenda ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={15} />
                    {editingAppointment ? "Salvar alterações" : agendaFormRecurring ? "Agendar Recorrência" : "Agendar"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Edit Patient Modal */}
      {showEditModal && formData && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Editar Paciente</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Atualize os dados do prontuário</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all" aria-label="Fechar">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex gap-1 bg-[var(--surface-alt)] p-1 rounded-xl overflow-x-auto">
                {[
                  { id: "identity", label: "Identificação", icon: UserCheck },
                  { id: "contact", label: "Contato", icon: Contact },
                  { id: "emergency", label: "Emergência", icon: Phone },
                  { id: "address", label: "Endereço", icon: MapPin },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setEditTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] text-xs font-bold transition-all whitespace-nowrap outline-none ${
                      editTab === tab.id
                        ? "bg-[var(--surface)] text-[var(--sage)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                  ))}
                  </div>

                  {errorMessage && (
                  <div className="mt-4 p-3 bg-[var(--status-falta-bg)] border border-[var(--status-falta-text)]/20 rounded-[12px] flex items-center gap-3 text-[var(--status-falta-text)] animate-shake">
                    <AlertTriangle size={18} className="shrink-0" />
                    <p className="text-xs font-bold">{errorMessage}</p>
                  </div>
                  )}
                  </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="edit-patient-form-record" onSubmit={handleSave} className="space-y-5">
                
                {editTab === "identity" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-[var(--surface-alt)] rounded-[20px] border border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        {formData.isActive ? (
                          <div className="w-10 h-10 rounded-[12px] bg-[var(--status-presente-bg)] flex items-center justify-center text-[var(--status-presente-text)]">
                            <UserCheck size={20} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-[12px] bg-[var(--surface-alt)] flex items-center justify-center text-[var(--text-secondary)]">
                            <UserX size={20} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">Status do Paciente</p>
                          <p className="text-xs text-[var(--text-muted)]">{formData.isActive ? "Ativo no acompanhamento" : "Inativo / Arquivado"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? "bg-[var(--sage)]" : "bg-[var(--border)]"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${formData.isActive ? "left-[26px]" : "left-0.5"}`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Nome Completo *</label>
                      <input type="text" required className="input text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome social ou completo" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">CPF *</label>
                        <input type="text" required className="input text-sm" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Nascimento *</label>
                        <input type="date" required className="input text-sm" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
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

                    <div className="grid grid-cols-2 gap-3">
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
                      <label className="block text-xs font-semibold text-slate-600 mb-2">E-mail *</label>
                      <input type="email" required className="input text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Telefone *</label>
                      <input type="tel" required className="input text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                  </div>
                )}

                {editTab === "emergency" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Emergência *</label>
                      <input type="tel" required className="input text-sm" value={formData.emergencyPhone} onChange={e => setFormData({ ...formData, emergencyPhone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Nome Emergência *</label>
                      <input type="text" required className="input text-sm" value={formData.emergencyName} onChange={e => setFormData({ ...formData, emergencyName: e.target.value })} placeholder="Contato de emergência" />
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

              </form>
            </div>

            <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-alt)]/30 shrink-0">
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="py-2.5 px-4 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all outline-none flex-1">Cancelar</button>
                <button type="submit" form="edit-patient-form-record" disabled={saving} className="py-2.5 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none flex-1 flex items-center justify-center gap-2">
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
      , document.body)}

      {/* Share Modal */}
      {showShareModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl w-full max-w-2xl p-4 sm:p-6 animate-scale-in max-h-[90vh] overflow-y-auto patients-scrollbar flex flex-col">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Enviar Instrumento para {patient?.name}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Crie um link para que o paciente preencha o instrumento</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--sage)] transition-colors p-1.5 hover:bg-[var(--surface-alt)] rounded-lg">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!shareData.formId) {
                alert("Selecione um instrumento");
                return;
              }
              try {
                const result = await api.createShareLink({
                  formId: shareData.formId,
                  patientId: patient.id,
                });
                const absoluteUrl = result.shareUrl.startsWith("http")
                  ? result.shareUrl
                  : `${window.location.origin}${result.shareUrl}`;
                await navigator.clipboard.writeText(absoluteUrl);
                const action = result.reused ? "reutilizado" : "criado";
                alert(`Link ${action} e copiado para a área de transferência!`);
                setShowShareModal(false);
                setShareData({ formId: "" });
                loadPatientShareLinks();
              } catch (error) {
                alert(error.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Selecione um Instrumento *</label>
                {loadingForms ? (
                  <div className="text-center py-4 text-[var(--text-muted)]">
                    <div className="animate-spin w-4 h-4 border-2 border-[var(--sage)] border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <div className="relative w-full">
                    <select
                      className="input w-full appearance-none pr-10 text-ellipsis overflow-hidden whitespace-nowrap bg-[var(--surface)] text-[var(--text-primary)]"
                      value={shareData.formId}
                      onChange={(e) => {
                        setShareData({ ...shareData, formId: e.target.value });
                        const existing = checkExistingLinkForForm(e.target.value);
                        setExistingLinkForForm(existing);
                        setForceCreateNew(false);
                      }}
                      required
                    >
                      <option value="" className="bg-[var(--surface)] text-[var(--text-primary)]">Selecionar instrumento...</option>
                      {forms.map(form => (
                        <option key={form.id} value={form.id} className="bg-[var(--surface)] text-[var(--text-primary)]">
                          {form.title}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-secondary)]">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                )}
              </div>

              {existingLinkForForm && !forceCreateNew && (
                <div className="p-4 bg-[var(--status-justificada-bg)] border border-[var(--status-justificada-text)]/20 rounded-[14px]">
                  <p className="text-sm text-[var(--status-justificada-text)] font-bold">⏱️ Link já existe para este instrumento</p>
                  <p className="text-xs text-[var(--status-justificada-text)]/80 mt-1 font-semibold">
                    Este paciente já tem um link pendente para {forms.find(f => f.id === shareData.formId)?.title}.
                    Deseja reutilizá-lo ou criar um novo?
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                {existingLinkForForm && !forceCreateNew ? (
                  <>
                    <button type="submit" className="w-full sm:w-auto py-2.5 px-4 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all outline-none flex-1">
                      ↻ Reutilizar Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setForceCreateNew(true)}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors font-bold text-xs outline-none"
                    >
                      Criar Novo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors font-bold text-xs outline-none"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" className="w-full sm:w-auto py-2.5 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none flex-1">
                      Gerar e Copiar Link
                    </button>
                    {existingLinkForForm && forceCreateNew && (
                      <button
                        type="button"
                        onClick={() => setForceCreateNew(false)}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors font-bold text-xs outline-none"
                      >
                        ← Voltar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors font-bold text-xs outline-none"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Payment Modal */}
      {showPaymentModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Lançar Pagamento</h2>
                  <p className="text-xs text-[var(--text-muted)] font-semibold mt-1">Vincular sessões e registrar valor</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto patients-scrollbar p-6 space-y-6">
              <form id="payment-form" onSubmit={handleSavePayment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Valor Total (R$)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold text-sm">R$</div>
                      <input 
                        type="text"
                        required
                        className="input pl-10 text-sm font-black"
                        placeholder="0,00"
                        value={paymentFormData.amount}
                        onChange={e => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value) {
                            value = (parseInt(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                          }
                          setPaymentFormData({...paymentFormData, amount: value});
                        }}
                        onBlur={e => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value) {
                            const formatted = (parseInt(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            setPaymentFormData({...paymentFormData, amount: formatted});
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data do Lançamento</label>
                    <input 
                      type="date" 
                      required
                      className="input text-sm"
                      value={paymentFormData.paymentDate}
                      onChange={e => setPaymentFormData({...paymentFormData, paymentDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Método</label>
                    <select 
                      className="input text-sm"
                      value={paymentFormData.method}
                      onChange={e => setPaymentFormData({...paymentFormData, method: e.target.value})}
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão">Cartão</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer group mb-2">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="peer sr-only"
                          checked={paymentFormData.receiptIssued}
                          onChange={e => setPaymentFormData({...paymentFormData, receiptIssued: e.target.checked})}
                        />
                        <div className="w-10 h-5 bg-[var(--border)] rounded-full peer-checked:bg-[var(--sage)] transition-colors"></div>
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:left-6"></div>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider group-hover:text-[var(--text-primary)]">Nota de Serviço Emitida</span>
                    </label>
                    
                    {/* Upload Recibo */}
                    <div className="mt-2 space-y-2">
                      {paymentFormData.existingReceiptAttachmentId && paymentFormData.existingReceiptFilename ? (
                        <div className="flex items-center justify-between px-3 py-2 bg-[var(--status-presente-bg)] border border-[var(--status-presente-text)]/20 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip size={14} className="text-[var(--status-presente-text)] shrink-0" />
                            <span className="text-xs font-semibold text-[var(--status-presente-text)] truncate">
                              {paymentFormData.existingReceiptFilename}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(paymentFormData.existingReceiptAttachmentId, paymentFormData.existingReceiptFilename)}
                              className="p-1.5 text-[var(--status-presente-text)] hover:bg-[var(--status-presente-text)]/10 rounded-lg transition-colors"
                              title="Baixar Recibo"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentFormData({...paymentFormData, existingReceiptAttachmentId: null, existingReceiptFilename: null, receiptFile: null})}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`flex items-center gap-2 px-3 py-2 bg-[var(--surface-alt)]/50 border border-[var(--border)] rounded-[12px] text-xs font-semibold cursor-pointer transition-all text-[var(--text-secondary)] ${paymentFormData.receiptFile ? 'border-[var(--sage)]/55' : 'hover:border-[var(--sage)]/35'}`}>
                          <Paperclip size={14} className="text-[var(--text-muted)]" />
                          {paymentFormData.receiptFile ? paymentFormData.receiptFile.name : 'Anexar Recibo (PDF/IMG)'}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => setPaymentFormData({...paymentFormData, receiptFile: e.target.files[0]})}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Observações</label>
                    <textarea 
                      className="w-full p-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--sage)] outline-none resize-none transition-colors text-sm min-h-[80px]"
                      placeholder="Ex: Pagamento referente ao mês de Abril..."
                      value={paymentFormData.notes}
                      onChange={e => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                    />
                  </div>
                </div>

                {/* Selection of Attendances */}
                <div className="bg-[var(--surface-alt)]/50 rounded-[20px] p-4 border border-[var(--border)]">
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                    {paymentFormData.id ? 'Sessões deste Pagamento' : 'Selecionar Sessões Pendentes'}
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto patients-scrollbar pr-2">
                    {(() => {
                      const id = paymentFormData.id;
                      const available = attendances.filter(a => (a.status === 'presente' || a.status === 'falta') && (!a.paymentId || a.paymentId === id));
                      const linked = available.filter(a => a.paymentId === id);
                      const pending = available.filter(a => !a.paymentId);
                      const sorted = [...linked, ...pending];
                      if (sorted.length === 0) return (
                        <div className="py-10 text-center opacity-30 italic text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Nenhuma sessão disponível
                        </div>
                      );
                      return sorted.map(att => (
                        <label key={att.id} className={`flex items-center justify-between p-3 rounded-[12px] border transition-all cursor-pointer ${
                          selectedAttendances.includes(att.id) 
                            ? "bg-[var(--status-presente-bg)] border-[var(--status-presente-text)]/30 shadow-sm" 
                            : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--text-muted)]/30"
                        }`}>
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              className="sr-only"
                              checked={selectedAttendances.includes(att.id)}
                              onChange={() => {
                                if(selectedAttendances.includes(att.id)) {
                                  setSelectedAttendances(selectedAttendances.filter(id => id !== att.id));
                                } else {
                                  setSelectedAttendances([...selectedAttendances, att.id]);
                                }
                              }}
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedAttendances.includes(att.id) ? "bg-[var(--sage)] border-[var(--sage)]" : "border-[var(--border)] bg-[var(--surface)]"
                            }`}>
                              {selectedAttendances.includes(att.id) && <Check size={10} className="text-white" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[var(--text-primary)]">
                                {format(new Date(att.date), 'dd/MM/yyyy')}
                                {att.status === 'falta' && <span className="ml-2 text-[9px] text-red-500 uppercase font-bold">Falta</span>}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">{att.sessionTime}</p>
                                {att.parentId && (() => {
                                  const parent = attendances.find(p => p.id === att.parentId);
                                  return parent ? (
                                    <span className="text-[9px] font-bold text-[var(--peach)] uppercase flex items-center gap-0.5">
                                      <RefreshCcw size={8} />
                                      Pai: {format(new Date(parent.date), 'dd/MM/yyyy')}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </label>
                      ));
                    })()}
                  </div>
                  {selectedAttendances.length > 0 && (
                    <div className="mt-4 p-3 bg-[var(--sage)] text-white rounded-[12px] flex items-center justify-between shadow-sm animate-fade-in">
                      <p className="text-[10px] font-bold uppercase tracking-wider">{selectedAttendances.length} selecionadas</p>
                      <p className="text-xs font-bold">Total: R$ {paymentFormData.amount || "0,00"}</p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-alt)]/30">
              <div className="flex gap-3">
                <button onClick={() => setShowPaymentModal(false)} className="py-2.5 px-4 rounded-[12px] bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs hover:opacity-95 transition-all outline-none flex-1">Cancelar</button>
                <button 
                  type="submit" 
                  form="payment-form" 
                  disabled={saving || selectedAttendances.length === 0}
                  className="py-2.5 px-4 rounded-[12px] bg-[var(--sage)] text-white font-bold text-xs hover:opacity-95 transition-all outline-none flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      Confirmar Lançamento
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 md:gap-2 p-2.5 md:px-4 md:py-2 rounded-[10px] text-xs md:text-sm font-bold transition-all duration-150 outline-none whitespace-nowrap ${
        active 
          ? "bg-[var(--sage)] text-white shadow-sm border border-transparent" 
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] border border-transparent"
      }`}
      title={label}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
