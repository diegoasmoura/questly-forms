import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Users,
  FileText,
  Calendar,
  Library,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: FileText, label: "Instrumentos", path: "/my-forms" },
  { icon: Library, label: "Acervo Clínico", path: "/library" },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = (isActive, collapsed) =>
    `flex items-center rounded-[14px] transition-all duration-250 ease-in-out cursor-pointer ${
      collapsed
        ? "justify-center w-[46px] h-[46px]"
        : "w-[calc(100%-24px)] justify-start px-[14px] gap-3 h-[46px]"
    } ${
      isActive
        ? "bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[#5CBF9D]"
        : "text-[var(--text-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
    }`;

  const labelClass = (collapsed) =>
    `text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-250 ease-in-out ${
      collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-1"
    }`;

  return (
    // h-full (não h-screen): a altura já vem travada pelo pai (h-dvh no Layout).
    // flex-shrink-0: garante que a sidebar nunca seja espremida pelo flex row.
    // sticky/top-0 removidos: só fazem sentido quando o PAI rola; aqui quem
    // rola é o wrapper de conteúdo ao lado, então a sidebar já fica fixa
    // naturalmente por estar fora da área com overflow-y-auto.
    <div
      className={`bg-[var(--surface)] border-r border-[var(--border)] grid grid-rows-[auto_1fr_auto] relative transition-all duration-250 ease-in-out h-full flex-shrink-0 z-[10000] ${
        collapsed ? "w-[84px]" : "w-[220px]"
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-[30px] -right-[13px] w-[26px] h-[26px] rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] z-10 hover:bg-[var(--surface-alt)] transition-all cursor-pointer"
        aria-label={collapsed ? "Expandir menu" : "Retrair menu"}
      >
        <ChevronRight
          size={13}
          className={`transition-transform duration-250 ${
            collapsed ? "" : "rotate-180"
          }`}
        />
      </button>

      <div className="flex items-center gap-2.5 w-full px-[19px] mb-0 pt-6">
        <div className="w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-[#5CBF9D] to-[#3D786A] flex items-center justify-center text-white flex-shrink-0">
          <span className="font-brand text-[17px] leading-none tracking-tight">QF</span>
        </div>
        <span
          className={`font-brand text-xl text-[var(--text-primary)] whitespace-nowrap overflow-hidden transition-all duration-250 ease-in-out ${
            collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-1"
          }`}
        >
          Questly Forms
        </span>
      </div>

      {/* min-h-0 + overflow-y-auto: se um dia o menu tiver itens demais para a
          tela, ELE rola por dentro em vez de empurrar o "Sair" pra fora da
          viewport — o footer nunca mais desalinha, não importa o conteúdo.
          self-stretch garante que a row do meio (1fr) seja preenchida, mantendo
          o "Sair" sempre ancorado ao fundo da tela. */}
      <nav className="flex flex-col gap-1.5 w-full items-center pt-5 min-h-0 overflow-y-auto self-stretch">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/home" &&
              location.pathname.startsWith(item.path)) ||
            (item.path === "/my-forms" &&
              location.pathname.startsWith("/forms"));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={linkClass(isActive, collapsed)}
              title={collapsed ? item.label : ""}
            >
              <Icon size={21} className="flex-shrink-0" />
              <span className={labelClass(collapsed)}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer sempre ancorado ao fundo — row "auto" do grid-rows-[auto_1fr_auto] */}
      <div className="border-t border-[var(--border)] pt-3 pb-6 w-full flex flex-col items-center gap-1">
        <button
          onClick={handleLogout}
          className={`flex items-center rounded-[14px] text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-all duration-250 ease-in-out cursor-pointer ${
            collapsed
              ? "justify-center w-[46px] h-[46px]"
              : "w-[calc(100%-24px)] justify-start px-[14px] gap-3 h-[46px]"
          }`}
          title="Sair"
        >
          <LogOut size={21} className="flex-shrink-0" />
          <span className={labelClass(collapsed)}>Sair</span>
        </button>
      </div>
    </div>
  );
}
