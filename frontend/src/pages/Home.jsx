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
} from "lucide-react";
import AvatarPickerModal from "../components/AvatarPickerModal";
import DecorativeElements from "../components/DecorativeElements";

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

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

const accentColors = [
  { bg: "var(--sage-light)", color: "var(--dark-green)" },
  { bg: "var(--blue-light)", color: "var(--blue)" },
  { bg: "var(--peach-light)", color: "var(--peach)" },
  { bg: "var(--purple-light)", color: "var(--purple)" },
];

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
  const [eventFilter, setEventFilter] = useState("hoje");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsData, formsData, attendancesData, paymentsData, appointmentsData] = await Promise.all([
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
          api.getFormStats(f.id).catch(() => ({
            responseCount: 0,
            shareLinkCount: 0,
          }))
        )
      );
      const statsMap = {};
      formsData.forEach((f, i) => {
        statsMap[f.id] = statsResults[i];
      });
      setFormStats(statsMap);
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

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

  const activePatients = patients.filter((p) => p.isActive !== false).length;
  const prevActivePatients = patients.filter(
    (p) => p.isActive !== false && p.createdAt && new Date(p.createdAt) < new Date(thisYear, thisMonth, 1)
  ).length;

  const presencas = monthAttendances.filter((a) => a.status === "presente").length;
  const prevPresencas = prevAttendances.filter((a) => a.status === "presente").length;
  const faltas = monthAttendances.filter((a) => a.status === "falta").length;
  const prevFaltas = prevAttendances.filter((a) => a.status === "falta").length;
  const justificadas = monthAttendances.filter((a) => a.status === "justificada").length;
  const prevJustificadas = prevAttendances.filter((a) => a.status === "justificada").length;
  const totalPaid = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const prevTotalPaid = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    weekDates.push(d);
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

  const todayEvents = getAppointmentsForDate(today);
  const tomorrowEvents = getAppointmentsForDate(tomorrow);
  const weekEvents = weekDates
    .flatMap((d) => getAppointmentsForDate(d))
    .sort((a, b) => {
      if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
      return a.sortTime.localeCompare(b.sortTime);
    });

  const filteredEvents =
    eventFilter === "hoje" ? todayEvents
    : eventFilter === "amanha" ? tomorrowEvents
    : weekEvents;

  const weekEventGroups = weekEvents.reduce((acc, ev) => {
    if (!acc[ev.dateStr]) acc[ev.dateStr] = [];
    acc[ev.dateStr].push(ev);
    return acc;
  }, {});

  const monthPatientIds = new Set(
    monthAttendances.filter((a) => a.status === "presente").map((a) => a.patientId)
  );
  const prevPatientIds = new Set(
    prevAttendances.filter((a) => a.status === "presente").map((a) => a.patientId)
  );
  const pacientesAtendidosMes = monthPatientIds.size;
  const prevPacientesAtendidos = prevPatientIds.size;

  const birthdayPatients = patients
    .filter((p) => {
      if (!p.birthDate) return false;
      return new Date(p.birthDate).getMonth() === thisMonth;
    })
    .sort((a, b) => new Date(a.birthDate).getDate() - new Date(b.birthDate).getDate());

  const totalSent = Object.values(formStats).reduce(
    (sum, s) => sum + (s.shareLinkCount || 0),
    0
  );
  const totalResponses = Object.values(formStats).reduce(
    (sum, s) => sum + (s.responseCount || 0),
    0
  );
  const completionRate =
    totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0;

  function trendDiff(current, previous) {
    const diff = current - previous;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return "0";
  }

  function trendPct(current, previous) {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct > 0 ? `+${pct}%` : `${pct}%`;
  }

  const initials =
    user?.name
      ?.split(" ")
      ?.map((n) => n[0])
      ?.join("")
      ?.toUpperCase()
      ?.slice(0, 2) || "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-2 border-[#5CBF9D] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-7 pb-[60px] animate-fade-in flex flex-col flex-1 min-h-0 relative">
      {/* Camada de elementos artesanais — atrás de tudo */}
      <DecorativeElements />
      {/* Greeting / Top Bar */}
      <div className="relative flex items-start justify-between gap-5 mb-[26px] pb-[26px] border-b border-[var(--border)] overflow-visible flex-shrink-0">
        <span className="absolute w-[170px] h-[170px] rounded-full bg-[var(--peach-light)] opacity-55 blur-[2px] -top-[70px] right-20 pointer-events-none" />
        <span className="absolute w-[110px] h-[110px] rounded-full bg-[var(--sage-light)] opacity-55 blur-[2px] -bottom-[55px] right-[280px] pointer-events-none" />
        <span className="absolute w-[80px] h-[80px] rounded-full bg-[var(--purple-light)] opacity-55 blur-[2px] top-[10px] -right-[10px] pointer-events-none" />

        <div className="relative z-[1] flex-1 min-w-0">
          <h1 className="text-[32px] leading-tight m-0 text-[var(--text-primary)] font-heading">
            {getGreeting()},{" "}
            <span className="relative inline-block">
              <span className="font-handwritten text-[36px] text-[var(--dark-green)] dark:text-[#5CBF9D]">
                {user?.name?.split(" ")[0] || "Usuário"}
              </span>
              <svg
                className="absolute left-[1px] -bottom-[9px] w-[calc(100%-2px)] h-[11px] overflow-visible"
                viewBox="0 0 60 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 6 Q10 1 18 6 T34 6 T50 6 T58 5"
                  stroke="#5CBF9D"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <div className="flex gap-2.5 flex-wrap mt-4">
            <span className="inline-flex items-center gap-[7px] text-[13px] font-bold px-[14px] py-[7px] rounded-[999px] bg-[var(--peach-light)] text-[#C97840] dark:text-[var(--peach)]">
              <Clock size={15} />
              3 avaliações pendentes
            </span>
            <span className="inline-flex items-center gap-[7px] text-[13px] font-bold px-[14px] py-[7px] rounded-[999px] bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[#5CBF9D]">
              <MessageCircle size={15} />
              {totalResponses} novas respostas
            </span>
          </div>
        </div>

        {/* Grupo de ações — ancorado ao topo com pt leve para alinhar com a linha do h1 */}
        <div className="relative z-[1] flex items-center gap-2.5 pt-[6px] flex-shrink-0">

          {/* Toggle de tema — paleta botânica: sage (dia) / navy (noite) */}
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Mudar para modo noite" : "Mudar para modo dia"}
            className="relative flex items-center bg-[var(--surface-alt)] border border-[var(--border)] rounded-[999px] cursor-pointer w-[56px] h-[30px] transition-colors duration-300 hover:border-[var(--sage)] group"
          >
            {/* Track */}
            <span className={`absolute inset-0 rounded-[999px] transition-colors duration-300 ${
              theme === "dark" ? "bg-[#1a2540]" : "bg-[var(--sage-light)]"
            }`} />
            {/* Bolinha deslizante */}
            <span
              className={`relative z-[1] w-[22px] h-[22px] rounded-full flex items-center justify-center text-white shadow-sm transition-all duration-300 ease-in-out ${
                theme === "dark"
                  ? "translate-x-[28px] bg-[#2B3D6B]"
                  : "translate-x-[4px] bg-[var(--sage)]"
              }`}
            >
              {theme === "light"
                ? <Sun size={12} strokeWidth={2.5} />
                : <Moon size={12} strokeWidth={2.5} />}
            </span>
          </button>

          {/* Sino de notificações */}
          <button
            className="w-[38px] h-[38px] rounded-[12px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] relative cursor-pointer transition-all duration-200 hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)] hover:border-[var(--sage)] hover:scale-[1.04]"
            title="Notificações"
          >
            <Bell size={17} strokeWidth={1.75} />
            {/* Badge — posicionado fora do ícone, no canto do botão */}
            <span className="absolute -top-[3px] -right-[3px] w-[8px] h-[8px] rounded-full bg-[var(--peach)] border-2 border-[var(--bg)]" />
          </button>

          {/* Avatar do usuário — gradiente quente sage → pêssego */}
          <button
            onClick={() => setShowAvatarPicker(true)}
            title="Perfil"
            className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.06] hover:shadow-[0_0_0_3px_var(--sage-light)] relative overflow-hidden"
            style={{
              background: user?.avatarUrl
                ? "transparent"
                : "linear-gradient(135deg, #5CBF9D 0%, #F8A26B 100%)",
              boxShadow: "0 0 0 2px var(--border)",
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Foto do perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[13px] font-bold tracking-wide">{initials}</span>
            )}
          </button>
        </div>
      </div>

      {/* Stats + Content Flex Row */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-5">
        {/* Left: 2/5 — Pacientes ativos + Presenças → Próximos Eventos */}
        {/* min-h-0: sem isso, o min-height:auto padrão do flex faz essa coluna
            crescer pelo conteúdo em vez de respeitar a altura da linha pai —
            e o flex-1 do card "Próximos Eventos" logo abaixo não tem como
            calcular "espaço restante" corretamente. */}
        <div className="flex flex-col gap-5 flex-[2] min-w-0 min-h-0">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Users size={18} />}
              bg="var(--purple-light)"
              color="var(--purple)"
              value={activePatients}
              trend={trendDiff(activePatients, prevActivePatients)}
              label="Pacientes ativos"
            />
            <StatCard
              icon={<CheckCheck size={18} />}
              bg="var(--sage-light)"
              color="#5CBF90"
              value={presencas}
              trend={trendDiff(presencas, prevPresencas)}
              label="Presenças no mês"
            />
          </div>

          {/* Próximos Eventos (flex-1 to fill remaining height) */}
          {/* flex flex-col min-h-0: transforma o card num container flex que
              respeita a altura disponível; a lista de eventos vira a única
              parte que rola por dentro (veja abaixo), então o card sempre
              alcança exatamente o rodapé da coluna, com 0 ou 50 eventos. */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-[22px] m-0 text-[var(--text-primary)] font-heading flex items-center gap-2">
                Próximos Eventos
                <Leaf size={16} className="text-[var(--sage)] opacity-60" />
              </h2>
              <Link
                to="/agenda"
                className="text-[13px] font-bold text-[var(--dark-green)] dark:text-[#5CBF9D] no-underline cursor-pointer"
              >
                Ir para agenda
              </Link>
            </div>

            <div className="flex gap-2 mb-4 flex-shrink-0">
              {[
                { key: "hoje", label: "Hoje" },
                { key: "amanha", label: "Amanhã" },
                { key: "semana", label: "Esta semana" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setEventFilter(tab.key)}
                  className={`text-[12px] font-bold px-[14px] py-[6px] rounded-[999px] cursor-pointer transition-colors ${
                    eventFilter === tab.key
                      ? "bg-[var(--dark-green)] text-white dark:bg-[#5CBF9D]"
                      : "bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* flex-1 min-h-0 overflow-y-auto: se a lista tiver mais eventos
                do que cabe na tela, ela rola sozinha aqui dentro. O card
                nunca cresce além da coluna, e o card sempre "bate" no rodapé
                da coluna esquerda, com a lista vazia, curta ou longa. */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <Calendar size={32} className="text-[var(--text-muted)] mb-3" />
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Nenhum evento{" "}
                    {eventFilter === "hoje"
                      ? "para hoje"
                      : eventFilter === "amanha"
                        ? "para amanhã"
                        : "nesta semana"}
                  </p>
                  <Link
                    to="/agenda"
                    className="text-xs font-bold text-[#5CBF9D] mt-2 hover:text-[var(--dark-green)] transition-colors"
                  >
                    Ver agenda completa
                  </Link>
                </div>
              ) : eventFilter === "semana" ? (
                Object.entries(weekEventGroups).map(([dateStr, events]) => {
                  const d = new Date(dateStr + "T12:00:00");
                  const dayLabel = `${dayNames[d.getDay()]}, ${d.getDate()}`;
                  return (
                    <div key={dateStr}>
                      <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2.5 pt-3 pb-1.5">
                        {dayLabel}
                      </div>
                      {events.map((app, i) => (
                        <EventRow key={app.id + "-" + dateStr + "-" + i} app={app} />
                      ))}
                    </div>
                  );
                })
              ) : (
                filteredEvents.map((app, i) => (
                  <EventRow key={app.id + "-" + i} app={app} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: 3/5 — Faltas + Justificadas + Faturamento → Aniversariantes → Comparativo */}
        <div className="flex flex-col gap-5 flex-[3] min-w-0 min-h-0">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<X size={18} />}
              bg="var(--peach-light)"
              color="var(--peach)"
              value={faltas}
              trend={trendDiff(faltas, prevFaltas)}
              label="Faltas no mês"
            />
            <StatCard
              icon={<Clock size={18} />}
              bg="var(--blue-light)"
              color="var(--blue)"
              value={justificadas}
              trend={trendDiff(justificadas, prevJustificadas)}
              label="Faltas justificadas"
            />
            <StatCard
              icon={<DollarSign size={18} />}
              bg="var(--sage-light)"
              color="var(--dark-green)"
              value={totalPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              trend={trendPct(totalPaid, prevTotalPaid)}
              label="Faturamento no mês"
            />
          </div>

          {/* Aniversariantes do mês */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
            <h2 className="text-[18px] m-0 text-[var(--text-primary)] mb-[14px] font-heading">
              Aniversariantes do mês
            </h2>
            {birthdayPatients.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)] text-center py-4">
                Sem aniversariantes este mês
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {birthdayPatients.map((p) => {
                  const day = new Date(p.birthDate).getDate();
                  const initials =
                    p.name?.split(" ")?.map((n) => n[0])?.join("")?.toUpperCase()?.slice(0, 2) || "?";
                  return (
                    <div key={p.id} className="flex items-center gap-2 bg-[var(--surface-alt)] rounded-[999px] px-3 py-1.5">
                      <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#F8A26B] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">{p.name.split(" ")[0]}</span>
                      <span className="text-[11px] font-bold text-[var(--peach)]">{day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comparativo do Mês */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
            <h2 className="text-[20px] m-0 text-[var(--text-primary)] mb-[18px] font-heading">
              Comparativo do Mês
            </h2>
            <div className="space-y-4">
              <ComparativoItem
                label="Sessões realizadas"
                prev={prevPresencas}
                current={presencas}
                format="number"
              />
              <ComparativoItem
                label="Pacientes atendidos"
                prev={prevPacientesAtendidos}
                current={pacientesAtendidosMes}
                format="number"
              />
              <ComparativoItem
                label="Faturamento"
                prev={prevTotalPaid}
                current={totalPaid}
                format="currency"
              />
            </div>
          </div>
        </div>
      </div>

      {showAvatarPicker && (
        <AvatarPickerModal
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}

function EventRow({ app }) {
  const status = app.attendance?.status || "confirmado";
  const statusColors = {
    presente: { dot: "#5CBF90", bg: "var(--sage-light)" },
    falta: { dot: "#F8A268", bg: "var(--peach-light)" },
    justificada: { dot: "#7C5CFF", bg: "var(--purple-light)" },
    confirmado: { dot: "#2E7DFF", bg: "var(--blue-light)" },
  };
  const statusLabel = {
    presente: "Presente",
    falta: "Falta",
    justificada: "Justificada",
    confirmado: "Confirmado",
  };
  const sc = statusColors[status] || statusColors.confirmado;
  const patientName = app.patient?.name || "Paciente";
  return (
    <div className="flex items-center gap-3.5 px-2.5 py-3 rounded-[10px] border-b border-[var(--border)] last:border-b-0">
      <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ background: sc.dot }} />
      <span className="text-[13px] font-bold text-[var(--text-secondary)] w-[50px] flex-shrink-0">
        {app.sortTime.slice(0, 5)}
      </span>
      <span className="flex-1 font-semibold text-[15px] text-[var(--text-primary)]">
        {patientName}
      </span>
      <span className="text-[11px] font-bold px-[9px] py-[3px] rounded-[999px]" style={{ background: sc.bg, color: sc.dot }}>
        {statusLabel[status]}
      </span>
    </div>
  );
}

function ComparativoItem({ label, prev, current, format }) {
  const isUp = current > prev;
  const isDown = current < prev;
  const fmt = (val) => {
    if (format === "currency") {
      return val.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return val;
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0">
      <span className="text-[14px] text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[var(--text-muted)]">{fmt(prev)}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-[var(--text-muted)]">
          <path
            d="M6 12V4l-4 4m8-4v8l4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={`text-[16px] font-extrabold ${
            isUp
              ? "text-[#5CBF90]"
              : isDown
                ? "text-[#F8A268]"
                : "text-[var(--text-primary)]"
          }`}
        >
          {fmt(current)}
        </span>
        {isUp && <span className="text-[11px] font-bold text-[#5CBF90]">▲</span>}
        {isDown && (
          <span className="text-[11px] font-bold text-[#F8A268]">▼</span>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, bg, color, value, trend, label }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div
          className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
          style={{ background: bg, color }}
        >
          {icon}
        </div>
        <span className="text-xs font-bold px-[9px] py-[3px] rounded-[999px] text-[var(--dark-green)] bg-[var(--sage-light)] dark:text-[#5CBF9D]">
          {trend}
        </span>
      </div>
      <div className="text-[28px] font-extrabold leading-none text-[var(--text-primary)]">
        {value}
      </div>
      <div className="text-[13px] text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}
