import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { formatCPF, formatPhone, formatCEP } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { generatePremiumSummary } from "../lib/pdf";
import { scoreTest } from "../lib/scoring";
import { ClinicalTrendChart, transformResponsesToTrendData, AttendanceHeatmap, transformResponsesToHeatmapData } from "../components/ClinicalCharts";
import { useShareLinkStatus, getStatusBadge } from "../lib/useShareLinkStatus";
import ShareLinkCard, { ShareLinkStats } from "../components/ShareLinkCard";
import FormResponsesView from "../components/FormResponsesView";
import DataTable from "../components/DataTable";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  Trash,
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
  Save
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
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [calendarPeriodFilter, setCalendarPeriodFilter] = useState("thisMonth");

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
          const start = new Date(app.startDate.split("T")[0]);
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
  const [editChoiceDate, setEditChoiceDate] = useState(null);
  const [editMode, setEditMode] = useState(null); // "single" | "future"

  const handleDayClick = (day) => {
    setSelectedCalendarDay(day);
  };

  const handleOpenNewSlotModal = (day) => {
    setSelectedCalendarDay(day || new Date());
    setAgendaFormDate(day || new Date());
    setAgendaFormDayOfWeek((day || new Date()).getDay());
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

  const handleRemoveSlot = async (slotId, date) => {
    if (!window.confirm("Tem certeza que deseja excluir este horário?")) return;
    setSavingAgenda(true);
    try {
      const app = appointments.find(a => a.id === slotId);
      if (app && !app.scheduledDate && date) {
        const dateStr = format(date, "yyyy-MM-dd");
        const skipDates = [...(app.skipDates || []), dateStr];
        await api.updateAppointment(slotId, { skipDates });
      } else {
        await api.deleteAppointment(slotId);
      }
      await loadPatientAppointments(showAllAppointments);
    } catch (error) {
      alert("Erro ao remover: " + error.message);
    } finally {
      setSavingAgenda(false);
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
  const [shareData, setShareData] = useState({ formId: "", expiresAt: "" });
  const [patientShareLinks, setPatientShareLinks] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [existingLinkForForm, setExistingLinkForForm] = useState(null);
  const [forceCreateNew, setForceCreateNew] = useState(false);

  const location = useLocation();

  useEffect(() => {
    loadPatient();
    loadForms();
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
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

  const handleExtendLink = async (linkId, days = 30, type = "renewal") => {
    try {
      const result = await api.extendShareLink(linkId, days, type);
      alert(result.message || `Link atualizado!`);
      await loadPatientShareLinks();
    } catch (error) {
      alert("Erro ao atualizar link: " + error.message);
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

  const handleCopyLink = () => {
    // Toast feedback could be added here
  };

  const getDefault30DaysLater = () => {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysLater.toISOString().split('T')[0];
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
      setShareData({ formId: "", expiresAt: getDefault30DaysLater() });
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
    
    // Seção Detalhes Consolidados
    let currentY = doc.lastAutoTable.finalY + 15;
    
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
    
    let finalY = doc.lastAutoTable.finalY + 10;
    
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

  const toggleResponse = (e, responseId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedResponseId(selectedResponseId === responseId ? null : responseId);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-900 border-t-transparent animate-spin" />
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

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden animate-fade-in">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 group transition-colors shrink-0">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Voltar para Lista de Pacientes
      </Link>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">

          {/* Left Column: Patient Profile */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <div className="card p-6 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col items-center text-center mb-6 shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-emerald-900 flex items-center justify-center text-white font-bold text-3xl mb-3 shadow-xl shadow-emerald-900/20">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Prontuário #{patient.id.slice(0, 8).toUpperCase()}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
                {patient.email && (
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</p>
                      <p className="text-xs text-emerald-700 font-medium truncate">{patient.email}</p>
                    </div>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefone</p>
                      <p className="text-xs text-emerald-700 font-medium truncate">{patient.phone}</p>
                    </div>
                  </div>
                )}
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nascimento</p>
                  <p className="text-xs text-emerald-700 font-medium">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : "Não informado"}
                    {patient.birthDate && (() => {
                      const today = new Date();
                      const birth = new Date(patient.birthDate);
                      let age = today.getFullYear() - birth.getFullYear();
                      const monthDiff = today.getMonth() - birth.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
                      return <span className="ml-1 text-slate-500">({age} anos)</span>;
                    })()}
                  </p>
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paciente desde</p>
                  <p className="text-xs text-emerald-700 font-medium">{new Date(patient.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Anotações Rápidas */}
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Anotações</p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                    {patient.notes || "Nenhuma anotação registrada."}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-emerald-50 pt-4 mt-4 space-y-2">
                {patient.cpf && (
                  <div className="text-[10px] text-slate-400">
                    <span className="font-bold uppercase">CPF: </span>
                    {patient.cpf}
                  </div>
                )}
                <button onClick={() => { setEditTab("identity"); loadAttachments(); setShowEditModal(true); }} className="w-full btn btn-primary text-xs py-3">
                  <Edit size={14} />
                  Ver Dados Completos
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-3 flex flex-col min-h-0 gap-8">

          {/* Tabs */}
          <div className="shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Histórico Clínico</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Evolução e respostas do paciente
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-100 shadow-sm">
                <TabButton
                  active={activeTab === "sessions"}
                  onClick={() => setActiveTab("sessions")}
                  icon={<Clock size={14} />}
                  label="Frequência"
                />
                <TabButton
                  active={activeTab === "financial"}
                  onClick={() => setActiveTab("financial")}
                  icon={<DollarSign size={14} />}
                  label="Financeiro"
                />
                <TabButton
                  active={activeTab === "settings"}
                  onClick={() => setActiveTab("settings")}
                  icon={<Calendar size={14} />}
                  label="Agenda"
                />
                <TabButton
                  active={activeTab === "share"}
                  onClick={() => setActiveTab("share")}
                  icon={<Share2 size={14} />}
                  label="Instrumentos"
                />
                <TabButton
                  active={activeTab === "notes"}
                  onClick={() => setActiveTab("notes")}
                  icon={<FileText size={14} />}
                  label="Prontuário"
                />
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0">
{/* Share Tab */}
          {activeTab === "share" && (
            <div className="space-y-5 animate-fade-in flex flex-col flex-1 min-h-0">
              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="md:col-start-4 card p-3 flex items-center gap-3 border-l-4 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="text-lg font-black uppercase tracking-tight">Enviar</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Novo instrumento</p>
                  </div>
                </button>
              </div>

              <div className="card p-6 flex-1 min-h-0 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Compartilhar Instrumentos</h3>
                  <p className="text-sm text-slate-600 mt-1">Envie instrumentos para que {patient.name} preencha</p>
                </div>

                {loadingLinks ? (
                  <div className="text-center py-8 text-slate-500">
                    <div className="animate-spin w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-xs">Carregando links...</p>
                  </div>
                ) : patientShareLinks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Share2 size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Nenhum instrumento enviado</p>
                    <p className="text-xs mt-1">Clique em "Enviar Instrumento" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-visible">
                    <ShareLinkStats 
                      counts={{
                        PENDENTE: patientShareLinks.filter(l => l.status === "PENDENTE").length,
                        RESPONDIDO: patientShareLinks.filter(l => l.status === "RESPONDIDO").length,
                        EXPIRADO: patientShareLinks.filter(l => l.status === "EXPIRADO").length,
                      }}
                      compliance={patientShareLinks.length > 0 
                        ? Math.round((patientShareLinks.filter(l => l.status === "RESPONDIDO").length / patientShareLinks.length) * 100) 
                        : 0}
                    />
                    {patientShareLinks.map(link => (
                      <ShareLinkCard
                        key={link.id}
                        link={link}
                        onExtend={handleExtendLink}
                        onRevoke={handleRevokeLink}
                        onCopy={handleCopyLink}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prontuário Tab */}
          {activeTab === "notes" && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="card flex-1 min-h-0 overflow-y-auto">
                <div className="p-6 border-b border-slate-100 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Prontuário</h3>
                        <p className="text-xs text-slate-500">Anotações e documentos</p>
                      </div>
                    </div>
                    <button className="btn btn-primary">
                      <Save size={14} />
                      Salvar
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Anotações</label>
                    <textarea 
                      className="input text-sm min-h-[150px]" 
                      value={formData?.notes || ''} 
                      onChange={e => setFormData(prev => prev ? { ...prev, notes: e.target.value } : null)} 
                      placeholder="Anotações relevantes sobre o paciente..."
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Paperclip size={16} className="text-slate-500" />
                        <h4 className="text-sm font-semibold text-slate-700">Laudos e Anexos</h4>
                        {attachments.length > 0 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                            {attachments.length}
                          </span>
                        )}
                      </div>
                      <label className="btn btn-primary cursor-pointer">
                        {uploading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus size={14} />
                        )}
                        {uploading ? 'Enviando...' : 'Anexar'}
                        <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={uploading} onChange={handleUploadAttachment} />
                      </label>
                    </div>

                    {loadingAttachments ? (
                      <div className="text-center py-8 text-slate-400">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs">Carregando anexos...</p>
                      </div>
                    ) : attachments.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <File size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Nenhum anexo</p>
                        <p className="text-[10px] mt-1">PDF, JPG, PNG, DOC (máx. 10MB)</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {attachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3 min-w-0">
                              <File size={18} className="text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{att.filename}</p>
                                <p className="text-xs text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => handleDownloadAttachment(att)} className="p-2 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition-colors" title="Baixar">
                                <Download size={16} />
                              </button>
                              <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors" title="Excluir">
                                <Trash size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <label className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500 hover:text-emerald-600 cursor-pointer transition-colors">
                          <Plus size={16} />
                          <span>Adicionar mais</span>
                          <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={uploading} onChange={handleUploadAttachment} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sessions/Frequency Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-5 animate-fade-in flex flex-col flex-1 min-h-0">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="card p-3 flex items-center gap-3 border-l-4 border-emerald-500">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{filteredAttendances.filter(a => a.status === 'presente').length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presenças</p>
                  </div>
                </div>
                <div className="card p-3 flex items-center gap-3 border-l-4 border-red-500">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                    <UserX size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{filteredAttendances.filter(a => a.status === 'falta').length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faltas</p>
                  </div>
                </div>
                <div className="card p-3 flex items-center gap-3 border-l-4 border-amber-500">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{filteredAttendances.filter(a => a.status === 'justificada').length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Justificadas</p>
                  </div>
                </div>
                <div className="card p-3 flex items-center gap-3 border-l-4 border-slate-500">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{attendances.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sessões</p>
                  </div>
                </div>
              </div>

              {/* Filtro de Período */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Período</span>
                {[
                  { key: "thisMonth", label: "Este Mês" },
                  { key: "lastMonth", label: "Mês Anterior" },
                  { key: "last3Months", label: "Últimos 3 Meses" },
                  { key: "all", label: "Todo Histórico" },
                  { key: "custom", label: "Personalizado" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPeriodFilter(opt.key)}
                    className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all ${
                      periodFilter === opt.key
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {periodFilter === "custom" && (
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><ChevronLeft size={16} /></button>
                    <select value={customMonth} onChange={e => setCustomMonth(e.target.value)} className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 min-w-[80px]">
                      {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((name, i) => {
                        const monthVal = i + 1;
                        const currentYear = customMonth.split("-")[0];
                        return <option key={`${currentYear}-${String(monthVal).padStart(2, "0")}`} value={`${currentYear}-${String(monthVal).padStart(2, "0")}`}>{name}</option>;
                      })}
                    </select>
                    <select value={customMonth.split("-")[0]} onChange={e => { const month = customMonth.split("-")[1]; setCustomMonth(`${e.target.value}-${month}`); }} className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 min-w-[60px]">
                      {Array.from({ length: 11 }, (_, i) => { const year = new Date().getFullYear() - 5 + i; return <option key={year} value={year}>{year}</option>; })}
                    </select>
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>

              {/* Timeline List */}
              <div className="card p-8 flex-1 flex flex-col min-h-0">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-8 shrink-0">Histórico de Sessões</h3>
                
                {loadingAttendances ? (
                  <div className="text-center py-20 opacity-50 flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Carregando histórico...</p>
                  </div>
                ) : filteredAttendances.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                      <Calendar size={32} className="text-emerald-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">Nenhum registro no período</p>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">Registros de presença aparecerão aqui conforme você marcar as sessões na agenda do paciente.</p>
                  </div>
                ) : (
                  <div className="space-y-0 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 overflow-y-auto flex-1 min-h-0">
                    {filteredAttendances.map((att, idx) => {
                      const isReagendado = att.notes?.includes('Reagendado');
                      const isFilho = !!att.parentId;
                      const hasFilho = attendances.some(a => a.parentId === att.id);
                      const isChainStart = hasFilho && !isFilho;
                      const isChainMiddle = hasFilho && isFilho;
                      const isChainEnd = !hasFilho && isFilho;
                      
                      const statusConfig = {
                        presente: { color: "bg-emerald-500", label: "Presente", bg: "bg-emerald-50", text: "text-emerald-700", icon: <Check size={12} /> },
                        falta: { color: "bg-red-500", label: "Falta", bg: "bg-red-50", text: "text-red-700", icon: <X size={12} /> },
                        justificada: { color: "bg-amber-500", label: "Justificada", bg: "bg-amber-50", text: "text-amber-700", icon: isReagendado ? <RefreshCcw size={12} /> : <AlertCircle size={12} /> },
                      };

                      const config = statusConfig[att.status] || { color: "bg-slate-400", label: att.status, bg: "bg-slate-50", text: "text-slate-600", icon: <Clock size={12} /> };

                      return (
                        <div key={att.id} className="relative pl-12 pb-10 group last:pb-0">
                          {/* Timeline Line Connector for Chain */}
                          {hasFilho && (
                            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-amber-400/40 z-0" />
                          )}
                          
                          {/* Timeline Dot */}
                          <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${config.color} text-white ${isFilho ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
                            {config.icon}
                          </div>

                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                  {format(new Date(att.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </span>
                                <div className="flex gap-1">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.text} border shadow-sm`}>
                                    {isReagendado ? 'Reagendada' : config.label}
                                  </span>
                                  {att.paymentId ? (
                                    <>
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-sm">
                                        <DollarSign size={8} />
                                        Pago
                                      </span>
                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1 ${
                                        att.payment?.receiptIssued ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                                      }`}>
                                        <Receipt size={8} />
                                        {att.payment?.receiptIssued ? 'Recibo Emitido' : 'Recibo Pendente'}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 shadow-sm">
                                      <Clock size={8} />
                                      Pagamento Pendente
                                    </span>
                                  )}
                                  {isChainStart && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Início de Cadeia</span>}
                                  {isChainMiddle && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Reagendamento</span>}
                                  {isChainEnd && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Reagendamento Final</span>}
                                </div>
                              </div>
                              <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-2">
                                <Clock size={12} />
                                {att.sessionTime || 'Horário não informado'}
                              </p>

                              {att.notes && (
                                <div className={`max-w-md p-3 rounded-xl border flex-1 ${isFilho ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observação</p>
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{att.notes}"</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              {hasFilho && (
                                <Link 
                                  to={`/agenda?date=${extractUTCDate(attendances.find(a => a.parentId === att.id).date)}`}
                                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 transition-all"
                                >
                                  <ChevronRight size={12} />
                                  Ver Reagendamento
                                </Link>
                              )}
                              {isFilho && (
                                <Link 
                                  to={`/agenda?date=${extractUTCDate(attendances.find(a => a.id === att.parentId)?.date || att.date)}`}
                                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 transition-all"
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
          )}

          {/* Financial Tab */}
          {activeTab === "financial" && (
            <div className="space-y-5 animate-fade-in flex flex-col flex-1 min-h-0">
              {/* Filtro de Período */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Período</span>
                {[
                  { key: "thisMonth", label: "Este Mês" },
                  { key: "lastMonth", label: "Mês Anterior" },
                  { key: "last3Months", label: "Últimos 3 Meses" },
                  { key: "all", label: "Todo Histórico" },
                  { key: "custom", label: "Personalizado" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPeriodFilter(opt.key)}
                    className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all ${
                      periodFilter === opt.key
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {periodFilter === "custom" && (
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><ChevronLeft size={16} /></button>
                    <select value={customMonth} onChange={e => setCustomMonth(e.target.value)} className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 min-w-[80px]">
                      {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((name, i) => {
                        const monthVal = i + 1;
                        const currentYear = customMonth.split("-")[0];
                        return <option key={`${currentYear}-${String(monthVal).padStart(2, "0")}`} value={`${currentYear}-${String(monthVal).padStart(2, "0")}`}>{name}</option>;
                      })}
                    </select>
                    <select value={customMonth.split("-")[0]} onChange={e => { const month = customMonth.split("-")[1]; setCustomMonth(`${e.target.value}-${month}`); }} className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none appearance-none cursor-pointer text-center px-1 min-w-[60px]">
                      {Array.from({ length: 11 }, (_, i) => { const year = new Date().getFullYear() - 5 + i; return <option key={year} value={year}>{year}</option>; })}
                    </select>
                    <button onClick={() => { const [y, m] = customMonth.split("-").map(Number); const d = new Date(y, m, 1); setCustomMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>

              {/* Financial Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-start-2 card p-3 flex items-center gap-3 border-l-4 border-emerald-500">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">
                      R$ {filteredPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pago</p>
                  </div>
                </div>
                <div className="card p-3 flex items-center gap-3 border-l-4 border-amber-500">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">
                      {attendances.filter(a => !a.paymentId && (a.status === 'presente' || a.status === 'falta')).length}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessões Pendentes</p>
                  </div>
                </div>
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
                  className="card p-3 flex items-center gap-3 border-l-4 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="text-lg font-black uppercase tracking-tight">Lançar</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Novo bloco de sessões</p>
                  </div>
                </button>
              </div>

              {/* Payments History Table */}
              <div className="card p-8 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Histórico de Lançamentos</h3>
                  {payments.length > 0 && (
                    <button 
                      onClick={() => handleGenerateAllReceipts()}
                      className="btn btn-primary flex items-center gap-2 text-xs"
                    >
                      <File size={14} />
                      Gerar Relatório Completo
                    </button>
                  )}
                </div>
                
                {loadingPayments ? (
                  <div className="text-center py-20 opacity-50">
                    <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Carregando financeiro...</p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                      <CreditCard size={32} className="text-amber-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">Nenhum pagamento no período</p>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">Lançamentos de pagamento aparecerão aqui conforme você registrar os blocos de sessões.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-4 py-3 min-w-[180px]">Período das Sessões</th>
                          <th className="px-4 py-3 whitespace-nowrap">Valor Pago</th>
                          <th className="px-4 py-3 whitespace-nowrap">Data do Pagamento</th>
                          <th className="px-4 py-3">Recibo</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map(payment => (
                          <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                                  {payment.attendances.length > 0 
                                    ? `${format(new Date(payment.attendances[0].date), 'dd/MM/yy')} a ${format(new Date(payment.attendances[payment.attendances.length-1].date), 'dd/MM/yy')}`
                                    : 'Sem sessões vinculadas'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {payment.attendances.length} sessões inclusas
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-black text-slate-800">
                                R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-slate-600 font-medium">
                                {format(new Date(payment.paymentDate), 'dd/MM/yyyy')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                {payment.receiptIssued ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 whitespace-nowrap">
                                    <Check size={10} />
                                    NOTA DE SERVIÇO
                                  </span>
                                ) : payment.receiptAttachment ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 whitespace-nowrap">
                                    <Paperclip size={10} />
                                    COM ANEXO
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200 whitespace-nowrap">
                                    PENDENTE
                                  </span>
                                )}
                                {payment.receiptAttachment && (
                                  <button 
                                    onClick={() => handleDownloadReceipt(payment.receiptAttachment.id, payment.receiptAttachment.originalName || payment.receiptAttachment.filename)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap max-w-[140px]"
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
                                  className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-all"
                                  title="Editar Lançamento"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  onClick={() => handleGenerateReceipt(payment)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
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
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab (Original) */}
          {activeTab === "timeline" && (
            loadingLinks ? (
              <div className="text-center py-12 text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs">Carregando instrumentos...</p>
              </div>
            ) : patientShareLinks.length === 0 ? (
              <div className="card p-20 text-center border-dashed border-2">
                <FileText size={48} className="mx-auto text-emerald-200 mb-6" />
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
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {answered.length === 1 ? 'Respondido' : 'Respondidos'} ({answered.length})
                      </h4>
                      <div className="space-y-4">
                        {answered.map(link => {
                          const response = link.response;
                          const result = scoreTest(null, response.data);
                          
                          return (
                            <div 
                              key={response.id}
                              className="card overflow-hidden group hover:border-emerald-300 transition-all duration-300"
                            >
                              <div className="w-full flex items-center justify-between p-6 min-h-[100px]">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                    <FileText size={22} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">{link.form?.title}</h4>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        Enviado em {new Date(link.createdAt).toLocaleDateString('pt-BR')} · {new Date(link.createdAt).toLocaleTimeString('pt-BR')}
                                      </p>
                                      <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                                        ✓ Respondido
                                      </span>
                                      <p className="text-xs font-bold text-emerald-600">
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
                                    className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                  >
                                    <ChevronRight
                                      size={22}
                                      className={`text-emerald-400 transition-all duration-300 ${selectedResponseId === response.id ? 'rotate-90 text-slate-900 scale-110' : ''}`}
                                    />
                                  </button>
                                </div>
                              </div>

                              {selectedResponseId === response.id && (
                                <div className="p-6 bg-emerald-50/50 border-t border-emerald-50 max-h-[70vh] overflow-y-auto">
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
                                              <p className={`text-[10px] font-black mt-1 ${scoreDiff > 0 ? 'text-red-600' : scoreDiff < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
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
                                        
                                        <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-100/50">
                                          <p className="text-sm text-slate-800 leading-relaxed font-medium italic">"{result.interpretation}"</p>
                                        </div>
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
                    link.active && (!link.expiresAt || new Date(link.expiresAt) > new Date()) && !link.response
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
                          const daysRemaining = link.expiresAt ? Math.ceil((new Date(link.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                          
                          return (
                            <div key={link.id} className="card p-6 bg-white border-emerald-100 hover:border-emerald-200 transition-all">
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
                                    {daysRemaining && (
                                      <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                                        {daysRemaining} dias restantes
                                      </span>
                                    )}
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

          {/* Agenda Tab */}
          {activeTab === "settings" && (
            <div className="space-y-5 animate-fade-in flex flex-col flex-1 min-h-0">
              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
                {appointments.length > 0 && (
                  <button
                    onClick={() => handleClearAgenda()}
                    className="md:col-start-3 card p-3 flex items-center gap-3 border-l-4 border-red-500 bg-white text-red-600 hover:bg-red-50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                      <Trash2 size={18} />
                    </div>
                    <div>
                      <p className="text-lg font-black uppercase tracking-tight">Limpar Agenda</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remover horários</p>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => handleOpenNewSlotModal(new Date())}
                  className={`card p-3 flex items-center gap-3 border-l-4 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 transition-all text-left group ${appointments.length === 0 ? "md:col-start-4" : ""}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Plus size={18} />
                  </div>
                  <div>
                      <p className="text-lg font-black uppercase tracking-tight">Lançar</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Novo agendamento</p>
                  </div>
                </button>
              </div>

              {/* Filtro de Período */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Período</span>
                {[
                  { key: "thisMonth", label: "Este Mês" },
                  { key: "lastMonth", label: "Mês Anterior" },
                  { key: "custom", label: "Personalizado" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setCalendarPeriodFilter(opt.key);
                      if (opt.key === "thisMonth") { setCalendarDate(new Date()); setShowMonthPicker(false); }
                      else if (opt.key === "lastMonth") { setCalendarDate(subMonths(new Date(), 1)); setShowMonthPicker(false); }
                      else if (opt.key === "custom") setShowMonthPicker(true);
                    }}
                    className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all ${
                      calendarPeriodFilter === opt.key
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Calendar Card */}
              <div className="card p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
                {loadingAppointments ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Carregando agenda...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
                    {/* Left: Calendar */}
                      <div className="w-[60%] flex flex-col min-h-0">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 shrink-0">
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Calendário de Sessões</h3>
                        </div>

                        <DayPicker
                          month={calendarDate}
                        onMonthChange={setCalendarDate}
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
                          month_grid: "w-full flex-1 table-fixed border border-slate-300 rounded-xl overflow-hidden",
                          weekdays: "bg-slate-100",
                          weekday: "py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-200 last:border-r-0",
                          week: "h-0",
                          day: "text-center border-r border-b border-slate-200 last:border-r-0 p-0 h-0",
                          day_button: "relative w-full h-full flex items-center justify-center text-sm font-bold text-slate-700 cursor-pointer transition-colors",
                          today: "font-black",
                          outside: "text-slate-300",
                          disabled: "cursor-default opacity-40",
                        }}
                        components={{
                          DayButton: ({ day, modifiers, children, ...props }) => {
                            const date = day.date;
                            const isToday = modifiers?.today;
                            const dayStr = format(date, "yyyy-MM-dd");
                            const selectedStr = selectedCalendarDay ? format(selectedCalendarDay, "yyyy-MM-dd") : null;

                            let bgClass = "";
                            if (modifiers?.conflict) bgClass = "bg-red-50";
                            else if (modifiers?.others) bgClass = "bg-amber-50";
                            else if (modifiers?.mine) bgClass = "bg-emerald-50";

                            return (
                              <button {...props} className={`relative w-full h-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${isToday ? "" : "hover:bg-slate-100"} ${bgClass}`}>
                                {modifiers?.mine && showAllAppointments && (
                                  <div className="absolute bottom-1 left-1.5 right-1.5 h-[3px] rounded-full bg-emerald-500" />
                                )}
                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${
                                  isToday ? "bg-slate-800 text-white" : dayStr === selectedStr ? "ring-2 ring-slate-400" : "text-slate-700"
                                }`}>
                                  {date.getDate()}
                                </span>
                              </button>
                            );
                          },
                          MonthCaption: ({ calendarMonth }) => (
                            <div className="relative shrink-0">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Mês</span>
                                <button
                                  onClick={() => { setCalendarDate(prev => subMonths(prev, 1)); setShowMonthPicker(false); }}
                                  className="text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all bg-white text-slate-500 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600"
                                >
                                  <ChevronLeft size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowMonthPicker(prev => !prev); }}
                                  className="text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all bg-emerald-600 text-white shadow-md"
                                >
                                  {format(calendarMonth.date, "MMMM 'de' yyyy", { locale: ptBR })}
                                </button>
                                <button
                                  onClick={() => { setCalendarDate(prev => addMonths(prev, 1)); setShowMonthPicker(false); }}
                                  className="text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all bg-white text-slate-500 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600"
                                >
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                              {showMonthPicker && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 z-10 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-64 animate-scale-in" onClick={e => e.stopPropagation()}>
                                  <div className="grid grid-cols-3 gap-1 mb-3">
                                    {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => (
                                      <button
                                        key={m}
                                        onClick={() => {
                                          const d = new Date(calendarDate);
                                          d.setMonth(i);
                                          setCalendarDate(d);
                                          setShowMonthPicker(false);
                                        }}
                                        className={`text-[11px] font-black py-2 rounded-lg transition-all ${
                                          calendarDate.getMonth() === i
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                      >
                                        {m}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const d = new Date(calendarDate);
                                        d.setFullYear(d.getFullYear() - 1);
                                        setCalendarDate(d);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                                    >
                                      <ChevronLeft size={14} />
                                    </button>
                                    <select
                                      value={calendarDate.getFullYear()}
                                      onChange={e => {
                                        const d = new Date(calendarDate);
                                        d.setFullYear(parseInt(e.target.value));
                                        setCalendarDate(d);
                                      }}
                                      className="flex-1 text-center text-sm font-black text-slate-700 bg-slate-50 rounded-lg py-2 border border-slate-200 outline-none cursor-pointer"
                                    >
                                      {Array.from({length: 21}, (_, i) => new Date().getFullYear() - 10 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => {
                                        const d = new Date(calendarDate);
                                        d.setFullYear(d.getFullYear() + 1);
                                        setCalendarDate(d);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                                    >
                                      <ChevronRight size={14} />
                                    </button>
                                  </div>
                                </div>
                              )}
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
                      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300" />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{patient?.name?.split(" ")[0] || "Paciente"}</span>
                        </div>
                        {showAllAppointments && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-amber-50 border border-amber-300" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Outros</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded bg-red-50 border border-red-300" />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Conflito</span>
                        </div>
                        </div>
                      </div>
                      </div>

                    {/* Right: Agenda */}
                    <div className="w-[40%] overflow-y-auto pr-2 flex flex-col">
                      {/* Edit choice modal */}
                      {showEditChoice && editingAppointment && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm" onClick={() => { setShowEditChoice(false); setEditingAppointment(null); }}>
                          <div className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
                            <div className="text-center mb-6">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Pencil size={22} className="text-slate-700" />
                              </div>
                              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Editar horário</h3>
                              <p className="text-sm text-slate-500 font-bold mt-1">
                                {format(editChoiceDate, "EEEE, d 'de' MMMM", { locale: ptBR })} às {editingAppointment.time}
                              </p>
                              <p className="text-xs text-slate-400 mt-2">
                                Este horário se repete semanalmente. Como deseja editar?
                              </p>
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={handleEditSingle}
                                className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                              >
                                Apenas esta data
                              </button>
                              <button
                                onClick={handleEditFuture}
                                className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                              >
                                Esta e todas futuras
                              </button>
                            </div>
                            <button
                              onClick={() => { setShowEditChoice(false); setEditingAppointment(null); }}
                              className="w-full mt-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Day details panel or full agenda */}
                      {selectedCalendarDay ? (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                {format(selectedCalendarDay, "EEEE", { locale: ptBR })}
                              </h4>
                              <p className="text-xs font-bold text-slate-500 mt-0.5">
                                {format(selectedCalendarDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
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
                                  const start = new Date(a.startDate.split("T")[0]);
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
                                  <div key={app.id} className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                                    conflict ? "border-red-200 bg-red-50/30" : isOtherPatient ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"
                                  }`}>
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                                        conflict ? "bg-red-100 text-red-600" : isOtherPatient ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                      }`}>
                                        <Clock size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-xs font-bold truncate ${isOtherPatient ? "text-amber-600" : "text-emerald-700"}`}>
                                          {(isOtherPatient ? app.patient?.name : patient?.name)?.split(" ")[0] || "Paciente"}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500">{app.maxSessions ? `${app.maxSessions} sessões` : app.startDate ? `Desde ${format(new Date(app.startDate), "dd/MM/yy")}` : "Avulso"}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <span className="text-xs font-black text-slate-700 whitespace-nowrap">{app.time} • {app.duration}min</span>
                                      {conflict && (
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                                          Conflito
                                        </span>
                                      )}
                                      {!isOtherPatient && (
                                        <button
                                          type="button"
                                          onClick={() => handleEditClick(app, selectedCalendarDay)}
                                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-slate-200 hover:border-emerald-200"
                                          title="Editar"
                                        >
                                          <Pencil size={13} />
                                        </button>
                                      )}
                                      {!isOtherPatient && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSlot(app.id, selectedCalendarDay)}
                                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-slate-200 hover:border-red-200"
                                          title="Remover"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div> {/* closes right side buttons */}
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
                                const start = new Date(a.startDate.split("T")[0]);
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
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum horário neste dia</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Agenda Completa</h4>
                              <p className="text-xs font-bold text-slate-500 mt-0.5">Todos os horários do mês</p>
                            </div>
                          </div>
                          <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
                            {[...new Set(appointments.filter(a => myAppointmentIds.has(a.id)).map(a => a.time))].sort().map(time => {
                              const slotsAtTime = appointments.filter(a => myAppointmentIds.has(a.id) && a.time === time);
                              return (
                                <div key={time} className="p-2.5 rounded-xl border border-slate-200 bg-white">
                                  <p className="text-xs font-bold text-slate-800">{time} • {slotsAtTime[0]?.duration}min</p>
                                  <p className="text-[9px] font-bold text-slate-500">{slotsAtTime.length} horário{slotsAtTime.length > 1 ? 's' : ''}</p>
                                </div>
                              );
                            })}
                            {appointments.filter(a => myAppointmentIds.has(a.id)).length === 0 && (
                              <div className="text-center py-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum horário cadastrado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Agenda Modal */}
              {showAgendaModal && agendaFormDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm" onClick={() => { setShowAgendaModal(false); setEditingAppointment(null); setEditMode(null); }}>
                  <div className="bg-white rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}</h3>
                        <p className="text-sm text-slate-500 font-bold mt-1">
                          {format(agendaFormDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <button
                        onClick={() => { setShowAgendaModal(false); setEditingAppointment(null); setEditMode(null); }}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Dia</label>
                          <select
                            className="input text-sm font-black py-2.5"
                            value={agendaFormDayOfWeek ?? (agendaFormDate?.getDay() ?? 1)}
                            onChange={e => setAgendaFormDayOfWeek(parseInt(e.target.value))}
                          >
                            {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d, i) => (
                              <option key={i} value={i}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Horário</label>
                          <select
                            className="input text-sm font-black py-2.5"
                            value={agendaFormTime}
                            onChange={e => setAgendaFormTime(e.target.value)}
                          >
                            {["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Duração</label>
                          <select
                            className="input text-sm font-black py-2.5"
                            value={agendaFormDuration}
                            onChange={e => setAgendaFormDuration(parseInt(e.target.value))}
                          >
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={50}>50 minutos</option>
                            <option value={60}>60 minutos</option>
                            <option value={90}>90 minutos</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={agendaFormRecurring}
                            onChange={e => setAgendaFormRecurring(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="text-sm font-bold text-slate-700">
                              Repetir semanalmente
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Toda {["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][agendaFormDate.getDay()]}
                            </p>
                          </div>
                        </label>
                        {agendaFormRecurring && (
                          <div className="w-28">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nº Sessões</label>
                            <input
                              type="number"
                              min={0}
                              className="input text-xs font-black py-2 text-center"
                              value={agendaFormMaxSessions || ""}
                              onChange={e => setAgendaFormMaxSessions(Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="0 = ilimitado"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Existing slots for this day-of-week */}
                    {appointments.filter(a => {
                      if (a.scheduledDate) {
                        const sched = a.scheduledDate.split("T")[0];
                        const formDate = format(agendaFormDate, "yyyy-MM-dd");
                        return sched === formDate;
                      }
                      return a.dayOfWeek === (agendaFormDayOfWeek ?? agendaFormDate.getDay());
                    }).length > 0 && (
                      <div className="mb-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Horários já configurados para {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][agendaFormDayOfWeek ?? agendaFormDate.getDay()]}
                        </p>
                        <div className="space-y-1.5">
                          {appointments
                            .filter(a => {
                              if (a.scheduledDate) {
                                const sched = a.scheduledDate.split("T")[0];
                                const formDate = format(agendaFormDate, "yyyy-MM-dd");
                                return sched === formDate;
                              }
                              return a.dayOfWeek === (agendaFormDayOfWeek ?? agendaFormDate.getDay());
                            })
                            .map(app => {
                              const conflict = conflicts[app.id];
                              return (
                                <div key={app.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${
                                  conflict ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-white"
                                }`}>
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                      conflict ? "bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-600"
                                    }`}>
                                      <Clock size={14} />
                                    </div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-800">{app.time} • {app.duration}min</p>
                                          {app.maxSessions ? (
                                            <p className="text-[9px] font-bold text-slate-600">{app.maxSessions} sessões</p>
                                          ) : app.startDate ? (
                                            <p className="text-[9px] font-bold text-slate-600">Desde {format(new Date(app.startDate), "dd/MM/yy")}</p>
                                          ) : null}
                                          {showAllAppointments && app.patient && (
                                            <p className="text-[9px] font-bold text-slate-500">{app.patient.name}</p>
                                          )}
                                    </div>
                                  </div>
                                    <div className="flex items-center gap-1.5">
                                      {conflict && (
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                                          Conflito
                                        </span>
                                      )}
                                      {(!showAllAppointments || app.patientId === undefined || app.patientId === id) && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSlot(app.id)}
                                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                          title="Remover"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { setShowAgendaModal(false); setEditingAppointment(null); setEditMode(null); }}
                        className="px-5 py-2.5 text-xs font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveNewSlot}
                        disabled={savingAgenda}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-200"
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
              )}

            </div>
          )}
          </div>
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && formData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="card w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Editar Paciente</h2>
                  <p className="text-xs text-slate-500 mt-1">Atualize os dados do prontuário</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" aria-label="Fechar">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                {[
                  { id: "identity", label: "Identificação", icon: UserCheck },
                  { id: "contact", label: "Contato", icon: Contact },
                  { id: "address", label: "Endereço", icon: MapPin },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setEditTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      editTab === tab.id
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                  ))}
                  </div>

                  {errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 animate-shake">
                  <AlertTriangle size={18} className="shrink-0" />
                  <p className="text-xs font-bold">{errorMessage}</p>
                  </div>
                  )}
                  </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="edit-patient-form-record" onSubmit={handleSave} className="space-y-5">
                
                {editTab === "identity" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        {formData.isActive ? (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <UserCheck size={20} className="text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <UserX size={20} className="text-slate-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Status do Paciente</p>
                          <p className="text-xs text-slate-500">{formData.isActive ? "Ativo no acompanhamento" : "Inativo / Arquivado"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${formData.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${formData.isActive ? "left-8" : "left-1"}`} />
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

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">RG</label>
                        <input type="text" className="input text-sm" value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} placeholder="Documento" />
                      </div>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Telefone *</label>
                        <input type="tel" required className="input text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Emergência *</label>
                        <input type="tel" required className="input text-sm" value={formData.emergencyPhone} onChange={e => setFormData({ ...formData, emergencyPhone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                      </div>
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

            <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
                <button type="submit" form="edit-patient-form-record" disabled={saving} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
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
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/20 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Enviar Instrumento para {patient?.name}</h2>
                <p className="text-xs text-slate-600 mt-1">Crie um link para que o paciente preencha o instrumento</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-slate-500 hover:text-emerald-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!shareData.formId) {
                alert("Selecione um instrumento");
                return;
              }
              if (!shareData.expiresAt) {
                alert("Selecione a validade do link");
                return;
              }
              try {
                const result = await api.createShareLink({
                  formId: shareData.formId,
                  patientId: patient.id,
                  expiresAt: shareData.expiresAt,
                });
                const absoluteUrl = result.shareUrl.startsWith("http")
                  ? result.shareUrl
                  : `${window.location.origin}${result.shareUrl}`;
                await navigator.clipboard.writeText(absoluteUrl);
                const action = result.reused ? "reutilizado" : "criado";
                alert(`Link ${action} e copiado para a área de transferência!`);
                setShowShareModal(false);
                setShareData({ formId: "", expiresAt: "" });
                loadPatientShareLinks();
              } catch (error) {
                alert(error.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">Selecione um Instrumento *</label>
                {loadingForms ? (
                  <div className="text-center py-4 text-slate-500">
                    <div className="animate-spin w-4 h-4 border-2 border-emerald-900 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <select
                    className="input"
                    value={shareData.formId}
                    onChange={(e) => {
                      setShareData({ ...shareData, formId: e.target.value });
                      const existing = checkExistingLinkForForm(e.target.value);
                      setExistingLinkForForm(existing);
                      setForceCreateNew(false);
                    }}
                    required
                  >
                    <option value="">Selecionar instrumento...</option>
                    {forms.map(form => (
                      <option key={form.id} value={form.id}>{form.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {existingLinkForForm && !forceCreateNew && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900 font-medium">⏱️ Link já existe para este instrumento</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Este paciente já tem um link pendente para {forms.find(f => f.id === shareData.formId)?.title}.
                    Deseja reutilizá-lo ou criar um novo?
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">Validade do Link *</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { days: 7, label: "7 dias" },
                    { days: 15, label: "15 dias" },
                    { days: 30, label: "30 dias", recommended: true },
                    { days: 60, label: "60 dias" },
                    { days: 90, label: "90 dias" },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => {
                        const expiresAt = new Date(Date.now() + opt.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        setShareData({ ...shareData, expiresAt });
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        shareData.expiresAt === new Date(Date.now() + opt.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                          ? "bg-emerald-900 text-white shadow-md"
                          : opt.recommended
                          ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {opt.label}
                      {opt.recommended && <span className="ml-1 text-[10px] opacity-70">(Padrão)</span>}
                    </button>
                  ))}
                </div>
                {shareData.expiresAt && (
                  <p className="text-xs text-slate-600 mt-2">
                    Expira em: {new Date(shareData.expiresAt + 'T23:59:59').toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                {existingLinkForForm && !forceCreateNew ? (
                  <>
                    <button type="submit" className="btn btn-secondary flex-1">
                      ↻ Reutilizar Link Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => setForceCreateNew(true)}
                      className="btn btn-ghost"
                    >
                      Criar Novo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      className="btn btn-ghost text-xs"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" className="btn btn-primary flex-1">
                      Gerar e Copiar Link
                    </button>
                    {existingLinkForForm && forceCreateNew && (
                      <button
                        type="button"
                        onClick={() => setForceCreateNew(false)}
                        className="btn btn-ghost"
                      >
                        ← Voltar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      className="btn btn-ghost"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="card w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Lançar Pagamento</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Vincular sessões e registrar valor</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form id="payment-form" onSubmit={handleSavePayment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Total (R$)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</div>
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
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:left-6"></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800">Nota de Serviço Emitida</span>
                    </label>
                    
                    {/* Upload Recibo */}
                    <div className="mt-2 space-y-2">
                      {paymentFormData.existingReceiptAttachmentId && paymentFormData.existingReceiptFilename ? (
                        <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip size={14} className="text-emerald-600 shrink-0" />
                            <span className="text-xs font-medium text-emerald-700 truncate">
                              {paymentFormData.existingReceiptFilename}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(paymentFormData.existingReceiptAttachmentId, paymentFormData.existingReceiptFilename)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Baixar Recibo"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentFormData({...paymentFormData, existingReceiptAttachmentId: null, existingReceiptFilename: null, receiptFile: null})}
                              className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-all ${paymentFormData.receiptFile ? 'border-emerald-200' : 'hover:border-emerald-300'}`}>
                          <Paperclip size={14} />
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observações</label>
                    <textarea 
                      className="input text-sm min-h-[80px]"
                      placeholder="Ex: Pagamento referente ao mês de Abril..."
                      value={paymentFormData.notes}
                      onChange={e => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                    />
                  </div>
                </div>

                {/* Selection of Attendances */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    {paymentFormData.id ? 'Sessões deste Pagamento' : 'Selecionar Sessões Pendentes'}
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {(() => {
                      const id = paymentFormData.id;
                      const available = attendances.filter(a => (a.status === 'presente' || a.status === 'falta') && (!a.paymentId || a.paymentId === id));
                      const linked = available.filter(a => a.paymentId === id);
                      const pending = available.filter(a => !a.paymentId);
                      const sorted = [...linked, ...pending];
                      if (sorted.length === 0) return (
                        <div className="py-10 text-center opacity-30 italic text-xs font-bold uppercase tracking-widest">
                          Nenhuma sessão disponível
                        </div>
                      );
                      return sorted.map(att => (
                        <label key={att.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedAttendances.includes(att.id) 
                            ? "bg-emerald-50 border-emerald-300 shadow-sm" 
                            : "bg-white border-slate-100 hover:border-slate-300"
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
                              selectedAttendances.includes(att.id) ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                            }`}>
                              {selectedAttendances.includes(att.id) && <Check size={10} className="text-white" />}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">
                                {format(new Date(att.date), 'dd/MM/yyyy')}
                                {att.status === 'falta' && <span className="ml-2 text-[9px] text-red-500 uppercase font-black">Falta</span>}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{att.sessionTime}</p>
                                {att.parentId && (() => {
                                  const parent = attendances.find(p => p.id === att.parentId);
                                  return parent ? (
                                    <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-0.5">
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
                    <div className="mt-4 p-3 bg-emerald-900 text-white rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
                      <p className="text-[10px] font-black uppercase tracking-widest">{selectedAttendances.length} selecionadas</p>
                      <p className="text-xs font-bold">Total: R$ {paymentFormData.amount || "0,00"}</p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-3">
                <button onClick={() => setShowPaymentModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
                <button 
                  type="submit" 
                  form="payment-form" 
                  disabled={saving || selectedAttendances.length === 0}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
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
      )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
        active 
          ? "bg-emerald-900 text-white shadow-md" 
          : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
