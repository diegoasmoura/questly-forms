import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import {
  Users,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  CakeSlice,
  PartyPopper,
  ChevronRight,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

function calculateBirthdayInfo(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  const diffTime = thisYearBirthday - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isWeek = diffDays >= -3 && diffDays <= 4;
  return { diffDays, isWeek, isToday: diffDays === 0, daysUntil: diffDays };
}

function relativeTime(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days}d`;
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function extractUTCDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

function parseLocalDateStr(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateKey(date) {
  if (!date) return "";
  if (typeof date === "string") return date.split("T")[0];
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function findNextOccurrence(appointment, afterDate) {
  const afterStr = formatDateKey(afterDate);

  if (appointment.scheduledDate) {
    const schedStr = extractUTCDate(appointment.scheduledDate);
    if (schedStr >= afterStr) return { ...appointment, _nextDate: schedStr };
    return null;
  }

  if (appointment.dayOfWeek == null || !appointment.startDate) return null;

  const startStr = extractUTCDate(appointment.startDate);
  const endStr = appointment.endDate ? extractUTCDate(appointment.endDate) : null;

  const candidate = new Date(afterDate);
  candidate.setDate(candidate.getDate() + 1);

  while (candidate.getDay() !== appointment.dayOfWeek) {
    candidate.setDate(candidate.getDate() + 1);
  }

  for (let i = 0; i < 52; i++) {
    const candidateStr = formatDateKey(candidate);

    if (endStr && candidateStr > endStr) break;
    if (candidateStr < startStr) {
      candidate.setDate(candidate.getDate() + 7);
      continue;
    }
    if (appointment.skipDates?.includes(candidateStr)) {
      candidate.setDate(candidate.getDate() + 7);
      continue;
    }
    if (appointment.maxSessions > 0) {
      const start = parseLocalDateStr(appointment.startDate);
      let firstOccurrence = new Date(start);
      while (firstOccurrence.getDay() !== appointment.dayOfWeek) {
        firstOccurrence.setDate(firstOccurrence.getDate() + 1);
      }
      const diffDays = (candidate - firstOccurrence) / (1000 * 60 * 60 * 24);
      const occurrenceNum = Math.floor(diffDays / 7) + 1;
      if (occurrenceNum > appointment.maxSessions) break;
    }

    return { ...appointment, _nextDate: candidateStr };
  }

  return null;
}

function findOccurrencesInRange(appointment, rangeStart, rangeEnd) {
  const results = [];
  const endStr = formatDateKey(rangeEnd);

  // One-off appointment
  if (appointment.scheduledDate) {
    const schedStr = extractUTCDate(appointment.scheduledDate);
    const startStr = formatDateKey(rangeStart);
    if (schedStr >= startStr && schedStr <= endStr) {
      results.push({ ...appointment, _nextDate: schedStr });
    }
    return results;
  }

  // Recurring appointment
  if (appointment.dayOfWeek == null || !appointment.startDate) return results;

  const appEndStr = appointment.endDate ? extractUTCDate(appointment.endDate) : null;
  const effectiveStart = new Date(Math.max(rangeStart.getTime(), parseLocalDateStr(appointment.startDate).getTime()));
  const effectiveStartStr = formatDateKey(effectiveStart);

  // Walk forward to the first dayOfWeek on or after effectiveStart
  const candidate = new Date(effectiveStart);
  while (candidate.getDay() !== appointment.dayOfWeek) {
    candidate.setDate(candidate.getDate() + 1);
  }

  for (let i = 0; i < 200; i++) {
    const candidateStr = formatDateKey(candidate);

    if (candidateStr > endStr) break;
    if (appEndStr && candidateStr > appEndStr) break;
    if (candidateStr < effectiveStartStr) {
      candidate.setDate(candidate.getDate() + 7);
      continue;
    }
    if (appointment.skipDates?.includes(candidateStr)) {
      candidate.setDate(candidate.getDate() + 7);
      continue;
    }
    if (appointment.maxSessions > 0) {
      const start = parseLocalDateStr(appointment.startDate);
      let firstOccurrence = new Date(start);
      while (firstOccurrence.getDay() !== appointment.dayOfWeek) {
        firstOccurrence.setDate(firstOccurrence.getDate() + 1);
      }
      const diffDays = (candidate - firstOccurrence) / (1000 * 60 * 60 * 24);
      const occurrenceNum = Math.floor(diffDays / 7) + 1;
      if (occurrenceNum > appointment.maxSessions) break;
    }

    results.push({ ...appointment, _nextDate: candidateStr });
    candidate.setDate(candidate.getDate() + 7);
  }

  return results;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [formStats, setFormStats] = useState({});
  const [detailModal, setDetailModal] = useState({ open: false, appointment: null });

  const navigate = useNavigate();

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsData, formsData, attendancesData, appointmentsData, paymentsData] = await Promise.all([
        api.getPatients(),
        api.getForms(),
        api.getAttendances(),
        api.getAppointments(),
        api.getPayments()
      ]);

      setPatients(patientsData);
      setAttendances(attendancesData);
      setAppointments(appointmentsData);
      setPayments(paymentsData);

      const statsResults = await Promise.all(
        formsData.map(f => api.getFormStats(f.id).catch(() => ({ responseCount: 0, shareLinkCount: 0 })))
      );

      const statsMap = {};
      formsData.forEach((f, i) => { statsMap[f.id] = statsResults[i]; });
      setFormStats(statsMap);
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHomeData(); }, [loadHomeData]);

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const monthAttendances = attendances.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const monthPayments = payments.filter(p => {
    const d = new Date(p.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const sessionCount = monthAttendances.length;
  const presentCount = monthAttendances.filter(a => a.status === "presente").length;
  const faltaCount = monthAttendances.filter(a => a.status === "falta").length;
  const justCount = monthAttendances.filter(a => a.status === "justificada").length;

  const totalSent = Object.values(formStats).reduce((sum, s) => sum + (s.shareLinkCount || 0), 0);
  const totalResponses = Object.values(formStats).reduce((sum, s) => sum + (s.responseCount || 0), 0);
  const pendingInstruments = totalSent - totalResponses;

  const totalPaid = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const activePatients = patients.filter(p => p.isActive !== false).length;

  const birthdayPatients = patients.filter(p => {
    const info = calculateBirthdayInfo(p.birthDate);
    return info?.isWeek;
  }).slice(0, 10);

  const rangeEnd = addMonths(today, 3);

  const nextByMonth = useMemo(() => {
    const dayMap = {};
    appointments.forEach(app => {
      const occurrences = findOccurrencesInRange(app, today, rangeEnd);
      occurrences.forEach(occ => {
        if (!dayMap[occ._nextDate]) dayMap[occ._nextDate] = [];
        dayMap[occ._nextDate].push(occ);
      });
    });
    const sortedDays = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, sessions]) => ({
        date: new Date(dateStr + "T12:00:00"),
        sessions,
      }));
    const monthMap = {};
    sortedDays.forEach(({ date, sessions }) => {
      const key = format(date, "yyyy-MM");
      if (!monthMap[key]) monthMap[key] = { month: date, days: [] };
      monthMap[key].days.push({ date, sessions });
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [appointments]);

  const recentFaltas = monthAttendances
    .filter(a => a.status === "falta")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const patientMap = {};
  patients.forEach(p => { patientMap[p.id] = p; });

  const timelineItems = [];
  attendances.forEach(att => {
    const patient = patientMap[att.patientId];
    if (!patient) return;
    timelineItems.push({
      id: `att-${att.id}`,
      date: new Date(att.date),
      type: att.status,
      patient,
      description: att.status === "presente" ? "Compareceu à sessão" : att.status === "falta" ? "Faltou à sessão" : "Justificou falta"
    });
  });
  payments.forEach(p => {
    const patient = patientMap[p.patientId];
    if (!patient) return;
    timelineItems.push({
      id: `pay-${p.id}`,
      date: new Date(p.createdAt),
      type: "payment",
      patient,
      description: `Pagamento de ${p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
    });
  });
  timelineItems.sort((a, b) => b.date - a.date);

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden animate-fade-in relative">
      <header className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Painel Clínico</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Visão geral da sua prática clínica</p>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 shrink-0">
            <Link to="/patients" className="w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700">
              <div className="h-1 bg-blue-500" />
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Users size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{activePatients}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Pacientes Ativos</p>
                </div>
              </div>
            </Link>

            <Link to="/agenda" className="w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700">
              <div className="h-1 bg-secondary-500" />
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 dark:text-secondary-400 shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{sessionCount}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Sessões no Mês</p>
                </div>
              </div>
            </Link>

            <Link to="/my-forms" className="w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700">
              <div className="h-1 bg-violet-500" />
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{totalResponses}<span className="text-base text-slate-400 font-bold">/{totalSent}</span></p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Instrumentos</p>
                </div>
              </div>
            </Link>

            <Link to="/agenda" className="w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700">
              <div className="h-1 bg-green-500" />
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                  <DollarSign size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Receita do Mês</p>
                </div>
              </div>
            </Link>
          </div>

          {birthdayPatients.length > 0 && (
            <div className="mb-6 shrink-0">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PartyPopper size={16} className="text-amber-500 dark:text-amber-400" />
                  <p className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">Aniversariantes da Semana</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {birthdayPatients.map(p => {
                    const info = calculateBirthdayInfo(p.birthDate);
                    return (
                      <Link key={p.id} to={`/patients/${p.id}`} className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm transition-all group">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                          <CakeSlice size={12} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{p.name.split(" ")[0]}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${info?.isToday ? "bg-amber-500 text-white" : "bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"}`}>
                          {info?.isToday ? "Hoje!" : `+${info?.daysUntil || 0}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <div className="card p-5 flex-1 min-h-0 overflow-y-auto dark:bg-slate-800">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <Clock size={16} className="text-brand-600 dark:text-brand-400" />
                  <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Timeline de Atividade</p>
                </div>
                {timelineItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <Calendar size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nenhuma atividade registrada</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Sessões, pagamentos e formulários aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timelineItems.slice(0, 30).map((item, idx) => {
                      const colors = {
                        presente: { dot: "bg-secondary-500 dark:bg-secondary-400", icon: Check },
                        falta: { dot: "bg-red-500 dark:bg-red-400", icon: X },
                        justificada: { dot: "bg-amber-500 dark:bg-amber-400", icon: AlertCircle },
                        payment: { dot: "bg-blue-500 dark:bg-blue-400", icon: DollarSign }
                      };
                      const c = colors[item.type] || colors.presente;
                      const Icon = c.icon;
                      return (
                        <Link key={item.id} to={`/patients/${item.patient.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all group">
                          <div className={`w-8 h-8 rounded-full ${c.dot} flex items-center justify-center text-white shadow-sm shrink-0`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors leading-tight">
                              {item.patient.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">{relativeTime(item.date)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col min-h-0 gap-4">
              <div className="card p-4 flex-1 flex flex-col min-h-0 dark:bg-slate-800">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <Clock size={14} className="text-brand-600 dark:text-brand-400" />
                  <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Próximas Sessões</p>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1.5">
                  {nextByMonth.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-6">
                      <Calendar size={24} className="text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nenhuma sessão agendada</p>
                      <Link to="/agenda" className="text-[10px] text-brand-600 dark:text-brand-400 font-bold mt-2 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
                        Gerenciar agenda
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nextByMonth.map(({ month, days }) => (
                        <div key={format(month, "yyyy-MM")} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 overflow-hidden">
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                            <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                              {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="p-3 space-y-2">
                            {days.map(({ date, sessions }) => (
                              <div key={format(date, "yyyy-MM-dd")}>
                                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-slate-700">
                                  <button
                                    onClick={() => navigate(`/agenda?date=${format(date, "yyyy-MM-dd")}`)}
                                    className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                                  >
                                    {format(date, "EEE dd/MM", { locale: ptBR })}
                                  </button>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{sessions.length} sess{sessions.length === 1 ? "ão" : "ões"}</span>
                                </div>
                                {sessions.map(app => {
                                  const patient = patientMap[app.patientId];
                                  const name = patient?.name || "Paciente";
                                  const initial = name.split(" ")[0].slice(0, 2).toUpperCase() || "?";
                                  return (
                                    <div key={app.id} onClick={() => setDetailModal({ open: true, appointment: app })} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all group cursor-pointer mb-1">
                                      <div className="w-7 h-7 rounded-md bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-700 dark:text-brand-300 font-black text-[10px] shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                        {initial}
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex-1 min-w-0 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                        {name}
                                      </p>
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">{app.time?.slice(0, 5) || "--:--"}{app.duration ? ` • ${app.duration}min` : ""}</span>
                                      <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {detailModal.open && (
        <AppointmentDetailModal
          appointment={detailModal.appointment}
          patient={patientMap[detailModal.appointment.patientId]}
          nextDate={detailModal.appointment._nextDate}
          onClose={() => setDetailModal({ open: false, appointment: null })}
          onUpdate={loadHomeData}
        />
      )}
    </div>
  );
}
