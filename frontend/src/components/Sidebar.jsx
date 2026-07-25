import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Users,
  FileText,
  Calendar,
  Library,
  ChevronRight,
  LogOut,
  Kanban,
  Download
} from "lucide-react";
import { useState } from "react";
import { usePwaInstall } from "../hooks/usePwaInstall";
import PwaInstallModal from "./PwaInstallModal";

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Kanban, label: "CRM (Funil)", path: "/crm" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: FileText, label: "Instrumentos", path: "/my-forms" },
  { icon: Library, label: "Acervo Clínico", path: "/library" },
];

/* Largura da zona do ícone — igual à sidebar colapsada, para que
   os ícones NUNCA se desloquem durante a animação de expandir/retrair. */
const ICON_ZONE = "84px";

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  
  const { isInstallable, isIOS, promptInstall } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
    } else {
      await promptInstall();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`hidden md:flex bg-[var(--bg)] border-r border-[var(--border)] flex-col relative h-full flex-shrink-0 z-[40] transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-[84px]" : "w-[220px]"
      }`}
    >
      {/* Toggle chevron */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-[30px] -right-[13px] w-[26px] h-[26px] rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] z-10 hover:bg-[var(--surface-alt)] transition-all cursor-pointer"
        aria-label={collapsed ? "Expandir menu" : "Retrair menu"}
      >
        <ChevronRight
          size={13}
          className={`transition-transform duration-300 ease-in-out ${
            collapsed ? "" : "rotate-180"
          }`}
        />
      </button>

      {/* Logo — ícone centralizado na zona fixa de 84px */}
      <div className="flex items-center h-[44px] mt-6 overflow-hidden flex-shrink-0">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: ICON_ZONE }}
        >
          {/* Símbolo QF usando CSS e Fonte Nativa para máxima nitidez (Padrão SaaS Moderno) */}
          <div className="w-[46px] h-[46px] rounded-xl bg-[var(--sage)] shadow-sm flex items-center justify-center text-white flex-shrink-0 border border-white/10">
            <span className="font-brand text-[26px] leading-none tracking-tight pt-1 pr-0.5">QF</span>
          </div>
        </div>
        <span
          className={`font-brand text-[22px] text-[var(--text-primary)] whitespace-nowrap transition-all duration-300 ease-in-out ${
            collapsed
              ? "opacity-0 translate-x-[-8px] pointer-events-none"
              : "opacity-100 translate-x-0"
          }`}
        >
          Questly Forms
        </span>
      </div>

      {/* Navigation — items fixos, sem scroll */}
      <nav className="flex flex-col gap-1.5 w-full pt-5 flex-shrink-0">
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
              className={`flex items-center h-[46px] rounded-[14px] mx-[8px] transition-colors duration-200 ease-in-out cursor-pointer ${
                isActive
                  ? "bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[#5CBF9D]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
              }`}
              title={collapsed ? item.label : ""}
            >
              {/* Zona fixa do ícone — sempre centrado nos mesmos 84px - 2*8px margin */}
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: `calc(${ICON_ZONE} - 16px)` }}
              >
                <Icon size={21} />
              </div>
              <span
                className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
                  collapsed
                    ? "opacity-0 translate-x-[-8px] pointer-events-none w-0"
                    : "opacity-100 translate-x-0 w-auto"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer — empurra o Sair pro fundo */}
      <div className="flex-1" />

      {/* Footer — colado ao fundo da viewport */}
      <div className="border-t border-[var(--border)] pt-2 pb-2 w-full flex-shrink-0 flex flex-col gap-1">
        {isInstallable && (
          <button
            onClick={handleInstallClick}
            className="flex items-center h-[46px] rounded-[14px] mx-[8px] text-[var(--sage)] bg-[var(--sage-light)] hover:brightness-95 dark:text-[#5CBF9D] dark:bg-[rgba(92,191,144,0.15)] transition-colors duration-200 ease-in-out cursor-pointer w-[calc(100%-16px)]"
            title="Baixar App"
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: `calc(${ICON_ZONE} - 16px)` }}
            >
              <Download size={21} />
            </div>
            <span
              className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
                collapsed
                  ? "opacity-0 translate-x-[-8px] pointer-events-none w-0"
                  : "opacity-100 translate-x-0 w-auto"
              }`}
            >
              Baixar App
            </span>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center h-[46px] rounded-[14px] mx-[8px] text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors duration-200 ease-in-out cursor-pointer w-[calc(100%-16px)]"
          title="Sair"
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: `calc(${ICON_ZONE} - 16px)` }}
          >
            <LogOut size={21} />
          </div>
          <span
            className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
              collapsed
                ? "opacity-0 translate-x-[-8px] pointer-events-none w-0"
                : "opacity-100 translate-x-0 w-auto"
            }`}
          >
            Sair
          </span>
        </button>
      </div>
      
      <PwaInstallModal isOpen={showIosModal} onClose={() => setShowIosModal(false)} />
    </div>
  );
}
