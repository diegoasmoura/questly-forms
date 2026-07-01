import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  FileText,
  MessageCircle,
  CheckCheck,
  Users,
  Clock,
  Search,
  Sun,
  Moon,
  Bell,
} from "lucide-react";
import AvatarPickerModal from "../components/AvatarPickerModal";

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsData, formsData] = await Promise.all([
        api.getPatients(),
        api.getForms(),
      ]);

      setPatients(patientsData);
      setForms(formsData);

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

  const activePatients = patients.filter((p) => p.isActive !== false).length;

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
    <div className="p-7 pb-[60px] animate-fade-in">
      {/* Greeting / Top Bar */}
      <div className="relative flex items-center justify-between gap-5 mb-[26px] pb-[26px] border-b border-[var(--border)] overflow-visible">
        <span className="absolute w-[170px] h-[170px] rounded-full bg-[var(--peach-light)] opacity-55 blur-[2px] -top-[70px] right-20 pointer-events-none" />
        <span className="absolute w-[110px] h-[110px] rounded-full bg-[var(--sage-light)] opacity-55 blur-[2px] -bottom-[55px] right-[280px] pointer-events-none" />
        <span className="absolute w-[80px] h-[80px] rounded-full bg-[var(--purple-light)] opacity-55 blur-[2px] top-[10px] -right-[10px] pointer-events-none" />

        <div className="relative z-[1] flex-1 min-w-0">
          <h1 className="text-[32px] leading-tight m-0 text-[var(--text-primary)]">
            {getGreeting()},{" "}
            <span className="relative inline-block text-[var(--text-primary)]">
              {user?.name?.split(" ")[0] || "Usuário"}
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

        <div className="relative z-[1] self-center bg-[var(--note-bg)] text-[var(--note-text)] font-handwritten text-lg leading-tight px-[26px] py-4 rounded-[4px_14px_14px_14px] max-w-[180px] -rotate-3 shadow-[0_8px_20px_rgba(30,31,34,0.10)] flex-shrink-0 hidden md:block">
          <span className="absolute -top-[7px] left-[18px] w-[15px] h-[15px] rounded-full bg-gradient-to-br from-[#F8A26B] to-[#7C5CFF] shadow-[0_2px_5px_rgba(0,0,0,0.25)]" />
          Vamos cuidar de tudo com carinho.
        </div>

        <div className="relative z-[1] flex items-center gap-3.5">
          <div className="hidden sm:flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[999px] px-[18px] py-[10px] text-[var(--text-muted)] max-w-[200px]">
            <Search size={16} className="flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none font-sans text-sm text-[var(--text-primary)] w-full"
            />
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-[999px] p-[6px] cursor-pointer w-[60px] h-[34px] relative"
            title={theme === "light" ? "Modo escuro" : "Modo claro"}
          >
            <div
              className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-white transition-transform duration-300 ${
                theme === "dark"
                  ? "translate-x-[26px] bg-gradient-to-br from-[#2E7DFF] to-[#7C5CFF]"
                  : "translate-x-0 bg-gradient-to-br from-[#F8A26B] to-[#7C5CFF]"
              }`}
            >
              {theme === "light" ? <Sun size={14} /> : <Moon size={14} />}
            </div>
          </button>

          <button className="w-[40px] h-[40px] rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] relative cursor-pointer">
            <Bell size={18} />
            <span className="absolute top-[9px] right-[10px] w-[7px] h-[7px] rounded-full bg-[#F8A26B] border-2 border-[var(--surface)]" />
          </button>

          <button
            onClick={() => setShowAvatarPicker(true)}
            className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#2E7DFF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 cursor-pointer"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              initials
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-[26px]">
        <StatCard
          icon={<FileText size={18} />}
          bg="var(--sage-light)"
          color="var(--dark-green)"
          value={forms.length}
          trend={`+${forms.filter(f => f.isActive !== false).length}`}
          label="Formulários ativos"
        />
        <StatCard
          icon={<MessageCircle size={18} />}
          bg="var(--blue-light)"
          color="var(--blue)"
          value={totalResponses}
          trend={totalSent > 0 ? `${Math.round((totalResponses / totalSent) * 100)}%` : "0%"}
          label="Respostas este mês"
        />
        <StatCard
          icon={<CheckCheck size={18} />}
          bg="var(--peach-light)"
          color="var(--peach)"
          value={`${completionRate}%`}
          trend="+2%"
          label="Taxa de conclusão"
        />
        <StatCard
          icon={<Users size={18} />}
          bg="var(--purple-light)"
          color="var(--purple)"
          value={activePatients}
          trend={`+${activePatients}`}
          label="Pacientes ativos"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        {/* Left: Meus formulários */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-[18px]">
            <h2 className="text-[22px] m-0 text-[var(--text-primary)]">
              Meus formulários
            </h2>
            <Link
              to="/my-forms"
              className="text-[13px] font-bold text-[var(--dark-green)] dark:text-[#5CBF9D] no-underline cursor-pointer"
            >
              Ver todos
            </Link>
          </div>

          {forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText size={32} className="text-[var(--text-muted)] mb-3" />
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Nenhum formulário criado
              </p>
              <Link
                to="/my-forms"
                className="text-xs font-bold text-[#5CBF9D] mt-2 hover:text-[var(--dark-green)] transition-colors"
              >
                Criar formulário
              </Link>
            </div>
          ) : (
            forms.slice(0, 5).map((f, i) => {
              const ac = accentColors[i % accentColors.length];
              const stats = formStats[f.id] || { responseCount: 0 };
              const updated = f.updatedAt
                ? new Date(f.updatedAt).toLocaleDateString("pt-BR")
                : "—";
              return (
                <Link
                  key={f.id}
                  to={`/forms/${f.id}/responses`}
                  className="flex items-center gap-3.5 px-2.5 py-3.5 rounded-[10px] transition-colors hover:bg-[var(--surface-alt)] cursor-pointer no-underline border-b border-[var(--border)]"
                >
                  <div
                    className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ background: ac.bg, color: ac.color }}
                  >
                    <FileText size={19} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] text-[var(--text-primary)] mb-0.5">
                      {f.title || "Sem título"}
                    </div>
                    <div className="text-[12.5px] text-[var(--text-muted)]">
                      Atualizado em {updated}
                    </div>
                  </div>
                  <div className="text-[13px] font-bold text-[var(--text-secondary)] whitespace-nowrap text-right">
                    {stats.responseCount || 0}
                    <span className="block font-normal text-[11px] text-[var(--text-muted)]">
                      respostas
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Right: Chart + Activity */}
        <div className="flex flex-col gap-5">
          {/* Chart */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-[6px]">
              <h2 className="text-[20px] m-0 text-[var(--text-primary)]">
                Respostas por período
              </h2>
            </div>
            <div className="flex justify-between text-[13px] text-[var(--text-secondary)] mb-2.5">
              <span>Últimos 6 meses</span>
              <b className="text-[20px] font-extrabold text-[var(--text-primary)]">
                {totalResponses}
              </b>
            </div>
            <svg
              viewBox="0 0 300 110"
              className="w-full h-[110px] overflow-visible"
            >
              <defs>
                <linearGradient
                  id="areaGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#5CBF9D" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#5CBF9D" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="#5CBF9D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="10,80 58,70 106,55 154,60 202,30 250,38 290,15"
              />
              <polygon
                fill="url(#areaGrad)"
                points="10,80 58,70 106,55 154,60 202,30 250,38 290,15 290,105 10,105"
              />
              <g fill="#5CBF9D">
                <circle cx="10" cy="80" r="3.5" />
                <circle cx="58" cy="70" r="3.5" />
                <circle cx="106" cy="55" r="3.5" />
                <circle cx="154" cy="60" r="3.5" />
                <circle cx="202" cy="30" r="3.5" />
                <circle cx="250" cy="38" r="3.5" />
                <circle cx="290" cy="15" r="3.5" />
              </g>
            </svg>
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-[6px]">
              {monthLabels.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-[18px]">
              <h2 className="text-[20px] m-0 text-[var(--text-primary)]">
                Respostas recentes
              </h2>
            </div>
            {forms.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-6">
                Nenhuma resposta ainda.
              </p>
            ) : (
              forms.slice(0, 3).map((f, i) => {
                const stats = formStats[f.id] || { responseCount: 0 };
                const hasResponses = stats.responseCount > 0;
                const initial = f.title
                  ?.split(" ")
                  ?.map((w) => w[0])
                  ?.join("")
                  ?.toUpperCase()
                  ?.slice(0, 2) || "?";
                return (
                  <div
                    key={f.id}
                    className="flex gap-3 py-3"
                    style={
                      i < forms.slice(0, 3).length - 1
                        ? { borderBottom: "1px solid var(--border)" }
                        : {}
                    }
                  >
                    <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#F8A26B] to-[#7C5CFF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initial}
                    </div>
                    <div className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed">
                      <b className="text-[var(--text-primary)]">
                        {f.title || "Sem título"}
                      </b>{" "}
                      {hasResponses
                        ? `tem ${stats.responseCount} resposta${
                            stats.responseCount !== 1 ? "s" : ""
                          }.`
                        : "ainda não tem respostas."}
                      {hasResponses && (
                        <span className="mt-1 text-[11px] font-bold px-[9px] py-0.5 rounded-[999px] bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[#5CBF9D] inline-block w-fit">
                          {stats.responseCount}{" "}
                          {stats.responseCount === 1
                            ? "resposta"
                            : "respostas"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
