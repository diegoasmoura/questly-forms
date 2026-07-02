import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  MessageCircle,
  CheckCheck,
  Users,
  Clock,
  Sun,
  Moon,
  Bell,
  X,
  DollarSign,
  Calendar,
  Leaf,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  ArrowRight,
  CakeSlice,
  AlertCircle,
  Banknote,
} from "lucide-react";
import AvatarPickerModal from "../components/AvatarPickerModal";
import DecorativeElements from "../components/DecorativeElements";

/* ─── Helpers ──────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

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

function parseLocalDateStr(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtCurrency(val) {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtPct(current, previous) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function getAgeGroup(birthDate) {
  if (!birthDate) return null;
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  if (age < 18) return "-18";
  if (age <= 35) return "18-35";
  if (age <= 55) return "36-55";
  return "+55";
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ─── Sparkline SVG (mantida para uso futuro) ──────────────────────── */
function Sparkline({ data, color = "#5CBF9D", height = 36 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 100;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <polyline points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={color} opacity="0.08" strokeWidth="0" />
    </svg>
  );
}

/* ─── Mini gráfico de barras semanais ─────────────────────────────── */
function WeekBarChart({ data, color = "#5CBF9D", colorBg = "var(--surface-alt)" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex items-end justify-between gap-1 h-[52px]">
        {data.map((d) => (
          <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full rounded-[4px] flex-1" style={{ background: colorBg, opacity: 0.5 }} />
            <span className="text-[9px] text-[var(--text-muted)] font-bold">{d.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-1.5 h-[52px]">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        const isEmpty = d.value === 0;
        return (
          <div key={d.label} className="flex flex-col items-center gap-1 flex-1" title={`${d.label}: ${d.value} sessão${d.value !== 1 ? "ões" : ""}`}>
            <div className="w-full rounded-t-[4px] transition-all duration-500 relative group" style={{ height: `${Math.max(pct, isEmpty ? 4 : 8)}%`, background: isEmpty ? colorBg : color, opacity: isEmpty ? 0.35 : 0.9 }}>
              {d.value > 0 && (
                <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[9px] font-extrabold" style={{ color }}>{d.value}</span>
              )}
            </div>
            <span className="text-[9px] text-[var(--text-muted)] font-bold">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Donut chart simples ──────────────────────────────────────────── */
function DonutSlice({ pct, color, radius = 28, strokeWidth = 8 }) {
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  return (
    <circle
      cx="36"
      cy="36"
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={`${dash} ${circ - dash}`}
      strokeLinecap="round"
      style={{ transformOrigin: "36px 36px" }}
    />
  );
}

/* ─── Main Component ───────────────────────────────────────────────── */
export default function Home() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [forms, setForms] = useState([]);
  const [formStats, setFormStats] = useState({});
  const [attendances, setAttendances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsData, formsData, attendancesData, paymentsData, appointmentsData] =
        await Promise.all([
          api.getPatients(),
          api.getForms(),
          api.getAttendances().catch(() => []),
          api.getPayments().catch(() => []),
          api.getAppointments().catch(() => []),
        ]);

      setPatients(patientsData);
      setForms(formsData);
      setAttendances(attendancesData);
      setPayments(paymentsData);
      setAppointments(appointmentsData);

      const statsResults = await Promise.all(
        formsData.map((f) =>
          api.getFormStats(f.id).catch(() => ({ responseCount: 0, shareLinkCount: 0 }))
        )
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

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Datas de referência ── */
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  /* ── Atendimentos e pagamentos do mês ── */
  const monthAttendances = attendances.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const prevAttendances = attendances.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });
  const monthPayments = payments.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const prevPayments = payments.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  /* ── KPIs ── */
  const activePatients = patients.filter((p) => p.isActive !== false).length;
  const presencas = monthAttendances.filter((a) => a.status === "presente").length;
  const prevPresencas = prevAttendances.filter((a) => a.status === "presente").length;
  const faltas = monthAttendances.filter((a) => a.status === "falta").length;
  const prevFaltas = prevAttendances.filter((a) => a.status === "falta").length;
  const justificadas = monthAttendances.filter((a) => a.status === "justificada").length;
  const totalMesAtendimentos = monthAttendances.length;
  const taxaPresenca = totalMesAtendimentos > 0
    ? Math.round((presencas / totalMesAtendimentos) * 100)
    : 0;
  const prevTaxaPresenca = prevAttendances.length > 0
    ? Math.round((prevAttendances.filter((a) => a.status === "presente").length / prevAttendances.length) * 100)
    : 0;
  const totalPaid = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const prevTotalPaid = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // "A receber" = attendances presentes/falta sem paymentId ainda
  const aReceberCount = monthAttendances.filter(
    (a) => (a.status === "presente" || a.status === "falta") && !a.paymentId
  ).length;

  // Formulários
  const totalSent = Object.values(formStats).reduce((s, x) => s + (x.shareLinkCount || 0), 0);
  const totalResponses = Object.values(formStats).reduce((s, x) => s + (x.responseCount || 0), 0);
  const completionRate = totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0;

  /* ── Pacientes atendidos (únicos) ── */
  const monthPatientIds = new Set(
    monthAttendances.filter((a) => a.status === "presente").map((a) => a.patientId)
  );
  const prevPatientIds = new Set(
    prevAttendances.filter((a) => a.status === "presente").map((a) => a.patientId)
  );

  /* ── Mini bar chart: presenças por semana nas últimas 6 semanas ── */
  const weekShortNames = ["S−5", "S−4", "S−3", "S−2", "S−1", "Esta"];
  const sparklineData = Array.from({ length: 6 }, (_, i) => {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (5 - i) * 7 - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const value = attendances.filter((a) => {
      const d = new Date(a.date);
      return a.status === "presente" && d >= weekStart && d <= weekEnd;
    }).length;
    return { label: weekShortNames[i], value };
  });

  /* ── Aniversários: próximos 7 dias ── */
  const upcomingBirthdays = patients.filter((p) => {
    if (!p.birthDate) return false;
    const bd = new Date(p.birthDate);
    for (let i = 0; i <= 7; i++) {
      const check = new Date(today);
      check.setDate(today.getDate() + i);
      if (bd.getMonth() === check.getMonth() && bd.getDate() === check.getDate()) return true;
    }
    return false;
  }).map((p) => {
    const bd = new Date(p.birthDate);
    const thisYear = today.getFullYear();
    const next = new Date(thisYear, bd.getMonth(), bd.getDate());
    if (next < today) next.setFullYear(thisYear + 1);
    const diff = Math.round((next - today) / 86400000);
    return { ...p, daysUntil: diff };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  /* ── Perfil da base ── */
  const genderMap = { feminino: 0, masculino: 0, outro: 0, "": 0 };
  patients.filter((p) => p.isActive !== false).forEach((p) => {
    const g = (p.gender || "").toLowerCase();
    if (g.includes("fem")) genderMap.feminino++;
    else if (g.includes("mas") || g === "m") genderMap.masculino++;
    else genderMap.outro++;
  });
  const totalGender = activePatients || 1;
  const genderData = [
    { label: "Feminino", value: genderMap.feminino, pct: Math.round((genderMap.feminino / totalGender) * 100), color: "#F8A26B" },
    { label: "Masculino", value: genderMap.masculino, pct: Math.round((genderMap.masculino / totalGender) * 100), color: "#2E7DFF" },
    { label: "Outro / N/I", value: activePatients - genderMap.feminino - genderMap.masculino, pct: Math.round(((activePatients - genderMap.feminino - genderMap.masculino) / totalGender) * 100), color: "#7C5CFF" },
  ];

  const ageGroups = ["-18", "18-35", "36-55", "+55"];
  const ageData = ageGroups.map((g) => ({
    label: g,
    value: patients.filter((p) => p.isActive !== false && getAgeGroup(p.birthDate) === g).length,
  }));
  const maxAge = Math.max(...ageData.map((d) => d.value), 1);

  /* ── Agenda de hoje ── */
  function getAppointmentsForDate(date) {
    const dateStr = formatDateKey(date);
    const dayOfWeek = date.getDay();
    return appointments
      .filter((a) => {
        if (a.dayOfWeek !== dayOfWeek) return false;
        if (a.startDate && dateStr < extractUTCDate(a.startDate)) return false;
        if (a.endDate && dateStr > extractUTCDate(a.endDate)) return false;
        if (a.scheduledDate && dateStr !== extractUTCDate(a.scheduledDate)) return false;
        if (a.skipDates?.includes(dateStr)) return false;
        if (a.maxSessions > 0 && a.startDate) {
          const start = parseLocalDateStr(a.startDate);
          let count = 0;
          const cursor = new Date(start);
          const rangeEnd = new Date(date);
          rangeEnd.setHours(23, 59, 59, 999);
          while (cursor <= rangeEnd) {
            if (cursor.getDay() === a.dayOfWeek) count++;
            cursor.setDate(cursor.getDate() + 7);
          }
          if (count > a.maxSessions) return false;
        }
        return true;
      })
      .map((app) => {
        const att = attendances.find(
          (a) => a.patientId === app.patientId && extractUTCDate(a.date) === dateStr
        );
        return {
          ...app,
          attendance: att || null,
          sortTime: att?.sessionTime || app.time || "00:00",
          date,
          dateStr,
        };
      })
      .sort((a, b) => a.sortTime.localeCompare(b.sortTime));
  }

  const todayStr = formatDateKey(today);
  const todayEvents = getAppointmentsForDate(today);

  // Próximos 5 dias (excluindo hoje) para mini-agenda
  const upcomingDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return { date: d, events: getAppointmentsForDate(d) };
  }).filter((d) => d.events.length > 0).slice(0, 3);

  /* ── Instrumentos: formulário mais usado ── */
  const topForm = forms.length > 0
    ? forms.reduce((best, f) =>
        (formStats[f.id]?.responseCount || 0) > (formStats[best.id]?.responseCount || 0) ? f : best
      , forms[0])
    : null;

  /* ── Avatar initials ── */
  const initials = user?.name?.split(" ")?.map((n) => n[0])?.join("")?.toUpperCase()?.slice(0, 2) || "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-2 border-[#5CBF9D] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 pb-10 animate-fade-in flex flex-col gap-5 min-h-0 relative overflow-y-auto">
      <DecorativeElements />

      {/* ═══════════════════════════════════════════════════════════════
          TOP BAR — Saudação + botões
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative flex items-start justify-between gap-5 pb-5 border-b border-[var(--border)] overflow-visible flex-shrink-0">
        {/* blobs decorativos */}
        <span className="absolute w-[150px] h-[150px] rounded-full bg-[var(--peach-light)] opacity-50 blur-[2px] -top-[60px] right-24 pointer-events-none" />
        <span className="absolute w-[90px] h-[90px] rounded-full bg-[var(--sage-light)] opacity-50 blur-[2px] -bottom-[45px] right-[280px] pointer-events-none" />
        <span className="absolute w-[70px] h-[70px] rounded-full bg-[var(--purple-light)] opacity-50 blur-[2px] top-[8px] -right-[8px] pointer-events-none" />

        <div className="relative z-[1] flex-1 min-w-0">
          <h1 className="text-[30px] leading-tight m-0 text-[var(--text-primary)] font-heading">
            {getGreeting()},{" "}
            <span className="relative inline-block">
              <span className="font-handwritten text-[34px] text-[var(--dark-green)] dark:text-[#5CBF9D]">
                {user?.name?.split(" ")[0] || "Usuário"}
              </span>
              <svg className="absolute left-[1px] -bottom-[8px] w-[calc(100%-2px)] h-[10px] overflow-visible" viewBox="0 0 60 10" preserveAspectRatio="none">
                <path d="M2 6 Q10 1 18 6 T34 6 T50 6 T58 5" stroke="#5CBF9D" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <div className="flex gap-2 flex-wrap mt-3">
            <span className="inline-flex items-center gap-[6px] text-[12px] font-bold px-[12px] py-[5px] rounded-[999px] bg-[var(--peach-light)] text-[#C97840] dark:text-[var(--peach)]">
              <Clock size={13} />
              {todayEvents.length} sessões hoje
            </span>
            {totalResponses > 0 && (
              <span className="inline-flex items-center gap-[6px] text-[12px] font-bold px-[12px] py-[5px] rounded-[999px] bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[#5CBF9D]">
                <MessageCircle size={13} />
                {totalResponses} novas respostas
              </span>
            )}
            {aReceberCount > 0 && (
              <span className="inline-flex items-center gap-[6px] text-[12px] font-bold px-[12px] py-[5px] rounded-[999px] bg-[var(--blue-light)] text-[var(--blue)]">
                <AlertCircle size={13} />
                {aReceberCount} sessões a cobrar
              </span>
            )}
          </div>
        </div>

        <div className="relative z-[1] flex items-center gap-2.5 pt-[4px] flex-shrink-0">
          {/* Toggle tema */}
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Mudar para modo noite" : "Mudar para modo dia"}
            className="relative flex items-center bg-[var(--surface-alt)] border border-[var(--border)] rounded-[999px] cursor-pointer w-[52px] h-[28px] transition-colors duration-300 hover:border-[var(--sage)]"
          >
            <span className={`absolute inset-0 rounded-[999px] transition-colors duration-300 ${theme === "dark" ? "bg-[#1a2540]" : "bg-[var(--sage-light)]"}`} />
            <span className={`relative z-[1] w-[20px] h-[20px] rounded-full flex items-center justify-center text-white shadow-sm transition-all duration-300 ease-in-out ${theme === "dark" ? "translate-x-[26px] bg-[#2B3D6B]" : "translate-x-[4px] bg-[var(--sage)]"}`}>
              {theme === "light" ? <Sun size={11} strokeWidth={2.5} /> : <Moon size={11} strokeWidth={2.5} />}
            </span>
          </button>

          {/* Sino */}
          <button className="w-[36px] h-[36px] rounded-[10px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] relative cursor-pointer transition-all duration-200 hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)] hover:border-[var(--sage)] hover:scale-[1.04]" title="Notificações">
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full bg-[var(--peach)] border-2 border-[var(--bg)]" />
          </button>

          {/* Avatar */}
          <button
            onClick={() => setShowAvatarPicker(true)}
            title="Perfil"
            className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-white text-sm flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.06] hover:shadow-[0_0_0_3px_var(--sage-light)] overflow-hidden"
            style={{
              background: user?.avatarUrl ? "transparent" : "linear-gradient(135deg, #5CBF9D 0%, #F8A26B 100%)",
              boxShadow: "0 0 0 2px var(--border)",
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Foto do perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] font-bold tracking-wide">{initials}</span>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ZONA 1 — 5 KPIs de relance
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-shrink-0">
        <KpiCard
          icon={<Calendar size={16} />}
          iconBg="var(--blue-light)" iconColor="var(--blue)"
          label="Sessões hoje"
          value={todayEvents.length}
          sub={`${todayEvents.filter(e => e.attendance?.status === "presente").length} confirmadas`}
        />
        <KpiCard
          icon={<CheckCheck size={16} />}
          iconBg="var(--sage-light)" iconColor="var(--dark-green)"
          label="Presença no mês"
          value={`${taxaPresenca}%`}
          trend={{ current: taxaPresenca, previous: prevTaxaPresenca, unit: "%" }}
          sub={`${presencas} de ${totalMesAtendimentos} sessões`}
        />
        <KpiCard
          icon={<DollarSign size={16} />}
          iconBg="var(--peach-light)" iconColor="#C97840"
          label="Recebido no mês"
          value={fmtCurrency(totalPaid)}
          trend={{ current: totalPaid, previous: prevTotalPaid, unit: "R$" }}
          sub={prevTotalPaid > 0 ? `${fmtPct(totalPaid, prevTotalPaid)} vs mês anterior` : "primeiro mês"}
        />
        <KpiCard
          icon={<Banknote size={16} />}
          iconBg="var(--peach-light)" iconColor="var(--peach)"
          label="Sessões a cobrar"
          value={aReceberCount}
          sub={aReceberCount > 0 ? "sessões sem pagamento" : "tudo em dia ✓"}
          urgent={aReceberCount > 0}
        />
        <KpiCard
          icon={<FileText size={16} />}
          iconBg="var(--purple-light)" iconColor="var(--purple)"
          label="Instrumentos"
          value={`${totalResponses}/${totalSent}`}
          sub={`${completionRate}% de resposta`}
        />

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ZONA 2 — Agenda do dia (hero) + Painel lateral
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* 2A — Timeline do dia */}
        <div className="flex-[3] bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-[20px] m-0 text-[var(--text-primary)] font-heading flex items-center gap-2">
              Agenda de Hoje
              <Leaf size={15} className="text-[var(--sage)] opacity-60" />
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold text-[var(--text-muted)]">
                {dayNames[today.getDay()]}, {today.getDate()} de {today.toLocaleString("pt-BR", { month: "long" })}
              </span>
              <Link to="/agenda" className="text-[12px] font-bold text-[var(--dark-green)] dark:text-[#5CBF9D] no-underline flex items-center gap-1 hover:underline">
                Ver agenda <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {todayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
              <Calendar size={36} className="text-[var(--text-muted)] mb-3 opacity-40" />
              <p className="text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Nenhuma sessão hoje</p>
              <Link to="/agenda" className="mt-2 text-[12px] font-bold text-[#5CBF9D] hover:text-[var(--dark-green)] transition-colors">
                Agendar sessão
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-0 overflow-y-auto">
              {todayEvents.map((app, i) => (
                <TimelineRow key={app.id + "-" + i} app={app} />
              ))}
            </div>
          )}

          {/* Próximos dias com sessões */}
          {upcomingDays.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex-shrink-0">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Próximos dias</p>
              <div className="flex gap-2 flex-wrap">
                {upcomingDays.map(({ date, events }) => (
                  <div key={formatDateKey(date)} className="flex items-center gap-1.5 bg-[var(--surface-alt)] rounded-[10px] px-3 py-1.5">
                    <span className="text-[11px] font-bold text-[var(--text-muted)]">{dayNames[date.getDay()]} {date.getDate()}</span>
                    <span className="w-[5px] h-[5px] rounded-full bg-[var(--sage)]" />
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">{events.length} sessão{events.length > 1 ? "ões" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2B — Painel de urgências/contexto */}
        <div className="flex-[2] flex flex-col gap-3">

          {/* Pacientes ativos */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1">Pacientes ativos</p>
                <p className="text-[32px] font-extrabold text-[var(--text-primary)] leading-none">{activePatients}</p>
                <p className="text-[12px] text-[var(--text-muted)] mt-1">{monthPatientIds.size} atendidos este mês</p>
              </div>
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[var(--purple-light)] flex items-center justify-center">
                <Users size={22} className="text-[var(--purple)]" />
              </div>
            </div>
          </div>

          {/* Aniversários próximos */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex-1">
            <h2 className="text-[16px] m-0 text-[var(--text-primary)] font-heading mb-3 flex items-center gap-1.5">
              <CakeSlice size={15} className="text-[var(--peach)]" />
              Aniversários (7 dias)
            </h2>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-[12px] text-[var(--text-muted)] text-center py-3">Nenhum aniversário próximo</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingBirthdays.slice(0, 4).map((p) => {
                  const ini = p.name?.split(" ")?.map((n) => n[0])?.join("")?.toUpperCase()?.slice(0, 2) || "?";
                  return (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#F8A26B] to-[#7C5CFF] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {ini}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{p.name.split(" ")[0]}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {p.daysUntil === 0 ? "🎉 Hoje!" : p.daysUntil === 1 ? "Amanhã" : `em ${p.daysUntil} dias`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ZONA 3 — Comparativo + Instrumentos + Perfil da base
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 3A — Comparativo com mini bar chart */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5">
          <h2 className="text-[18px] m-0 text-[var(--text-primary)] font-heading mb-1">Comparativo do Mês</h2>
          <p className="text-[11px] text-[var(--text-muted)] mb-4">Atual vs. mês anterior</p>

          <div className="space-y-0 divide-y divide-[var(--border)]">
            <ComparativoRow label="Sessões" prev={prevPresencas} current={presencas} format="number" />
            <ComparativoRow label="Pacientes atendidos" prev={prevPatientIds.size} current={monthPatientIds.size} format="number" />
            <ComparativoRow label="Faltas" prev={prevFaltas} current={faltas} format="number" invertColor />
            <ComparativoRow label="Faturamento" prev={prevTotalPaid} current={totalPaid} format="currency" />
          </div>
        </div>


        {/* 3B — Instrumentos Clínicos (diferencial QF) */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5">
          <h2 className="text-[18px] m-0 text-[var(--text-primary)] font-heading mb-1">Instrumentos Clínicos</h2>
          <p className="text-[11px] text-[var(--text-muted)] mb-4">Avaliações e formulários enviados</p>

          {/* Taxa de conclusão — anel */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-[72px] h-[72px] flex-shrink-0">
              <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                <circle cx="36" cy="36" r="28" fill="none" stroke="var(--surface-alt)" strokeWidth="8" />
                <circle
                  cx="36" cy="36" r="28" fill="none"
                  stroke={completionRate > 70 ? "#5CBF9D" : completionRate > 40 ? "#F8A26B" : "#7C5CFF"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(completionRate / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[14px] font-extrabold text-[var(--text-primary)]">
                {completionRate}%
              </span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-[var(--text-primary)]">Taxa de resposta</p>
              <p className="text-[12px] text-[var(--text-muted)]">{totalResponses} de {totalSent} enviados</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{forms.length} formulário{forms.length !== 1 ? "s" : ""} cadastrado{forms.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Formulário mais usado */}
          {topForm && (
            <div className="bg-[var(--surface-alt)] rounded-[12px] p-3 mb-3">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Mais utilizado</p>
              <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{topForm.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{formStats[topForm.id]?.responseCount || 0} respostas</p>
            </div>
          )}

          <Link to="/my-forms" className="flex items-center justify-center gap-1.5 w-full py-2 rounded-[10px] border border-[var(--border)] text-[12px] font-bold text-[var(--dark-green)] dark:text-[#5CBF9D] hover:bg-[var(--sage-light)] transition-colors">
            Ver instrumentos <ArrowRight size={12} />
          </Link>
        </div>

        {/* 3C — Perfil da base */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5">
          <h2 className="text-[18px] m-0 text-[var(--text-primary)] font-heading mb-1">Perfil da Base</h2>
          <p className="text-[11px] text-[var(--text-muted)] mb-4">Pacientes ativos</p>

          {/* Gênero */}
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Gênero</p>
          <div className="flex gap-3 items-center mb-4">
            <div className="relative w-[60px] h-[60px] flex-shrink-0">
              <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                <circle cx="36" cy="36" r="28" fill="none" stroke="var(--surface-alt)" strokeWidth="10" />
                {(() => {
                  let offset = 0;
                  return genderData.map((g, i) => {
                    const circ = 2 * Math.PI * 28;
                    const dash = (g.pct / 100) * circ;
                    const el = (
                      <circle key={i} cx="36" cy="36" r="28" fill="none"
                        stroke={g.color} strokeWidth="10" strokeLinecap="butt"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              {genderData.map((g) => (
                <div key={g.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: g.color }} />
                    <span className="text-[11px] text-[var(--text-secondary)]">{g.label}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--text-primary)]">{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Faixa etária */}
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Faixa etária</p>
          <div className="flex flex-col gap-1.5">
            {ageData.map((g) => (
              <div key={g.label} className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-secondary)] w-[40px] flex-shrink-0">{g.label}</span>
                <div className="flex-1 h-[6px] bg-[var(--surface-alt)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--sage)] transition-all duration-500"
                    style={{ width: `${Math.round((g.value / maxAge) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-[var(--text-primary)] w-[16px] text-right">{g.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAvatarPicker && <AvatarPickerModal onClose={() => setShowAvatarPicker(false)} />}
    </div>
  );
}

/* ─── Sub-componentes ──────────────────────────────────────────────── */

function KpiCard({ icon, iconBg, iconColor, label, value, sub, trend, urgent }) {
  let trendEl = null;
  if (trend) {
    const isUp = trend.current > trend.previous;
    const isDown = trend.current < trend.previous;
    trendEl = (
      <span className={`flex items-center gap-0.5 text-[11px] font-bold ${isUp ? "text-[#5CBF90]" : isDown ? "text-[#F8A268]" : "text-[var(--text-muted)]"}`}>
        {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
        {fmtPct(trend.current, trend.previous)}
      </span>
    );
  }

  return (
    <div className={`bg-[var(--surface)] border rounded-[16px] p-4 flex flex-col gap-2 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-[1px] ${urgent ? "border-[var(--peach)] bg-[var(--peach-light)]/10" : "border-[var(--border)]"}`}>
      <div className="flex items-center justify-between">
        <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        {trendEl}
      </div>
      <div>
        <p className="text-[22px] font-extrabold leading-none text-[var(--text-primary)]">{value}</p>
        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  presente:   { dot: "#5CBF90", bg: "var(--sage-light)",   label: "Presente",   text: "#3D786A" },
  falta:      { dot: "#F8A268", bg: "var(--peach-light)",  label: "Falta",      text: "#C97840" },
  justificada:{ dot: "#7C5CFF", bg: "var(--purple-light)", label: "Justificada",text: "#7C5CFF" },
  confirmado: { dot: "#2E7DFF", bg: "var(--blue-light)",   label: "Confirmado", text: "#2E7DFF" },
};

function TimelineRow({ app }) {
  const status = app.attendance?.status || "confirmado";
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.confirmado;
  const patientName = app.patient?.name || "Paciente";
  const ini = patientName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
      {/* Hora */}
      <span className="text-[12px] font-bold text-[var(--text-muted)] w-[44px] flex-shrink-0 tabular-nums">
        {app.sortTime.slice(0, 5)}
      </span>
      {/* Linha de status */}
      <div className="flex flex-col items-center self-stretch py-0.5 flex-shrink-0">
        <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: sc.dot }} />
        <div className="w-[1px] flex-1 mt-0.5" style={{ background: sc.dot, opacity: 0.25 }} />
      </div>
      {/* Avatar + Nome */}
      <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[var(--sage)] to-[var(--dark-green)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {ini}
      </div>
      <span className="flex-1 text-[14px] font-semibold text-[var(--text-primary)] truncate">{patientName}</span>
      {/* Badge de status */}
      <span className="text-[10px] font-bold px-[8px] py-[3px] rounded-[999px] flex-shrink-0" style={{ background: sc.bg, color: sc.text }}>
        {sc.label}
      </span>
    </div>
  );
}

function ComparativoRow({ label, prev, current, format, invertColor }) {
  const isUp = current > prev;
  const isDown = current < prev;
  // bad = faltas aumentaram (invertColor+isUp) OU sessões/faturamento caíram
  const bad = invertColor ? isUp : isDown;

  const fmt = (v) => format === "currency" ? fmtCurrency(v) : v;

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        {/* Atual — esquerda, verde, destaque */}
        <span className="text-[14px] font-extrabold text-[#3D9E76]">
          {fmt(current)}
        </span>
        {/* Separador */}
        <span className="text-[10px] font-bold text-[var(--text-muted)] px-0.5">vs</span>
        {/* Anterior — direita, pêssego da paleta + seta de tendência */}
        <span className="text-[12px] font-semibold text-[var(--peach)]">{fmt(prev)}</span>
        {isUp && !bad && <TrendingUp size={11} className="text-[#3D9E76]" />}
        {bad && isDown && <TrendingDown size={11} className="text-[#D97706]" />}
        {bad && isUp && <TrendingUp size={11} className="text-[#D97706]" />}
        {!isUp && !isDown && <Minus size={11} className="text-[var(--text-muted)]" />}
      </div>
    </div>
  );
}

