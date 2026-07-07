import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Bell } from "lucide-react";
import AvatarPickerModal from "./AvatarPickerModal";
import ProfileDropdown from "./ProfileDropdown";
import { getGreeting } from "../hooks/useDashboardData";

export default function GlobalHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const location = useLocation();

  const getHeaderContent = () => {
    const path = location.pathname;
    
    if (path.startsWith("/patients")) {
      return {
        type: 'page',
        title: "Pacientes",
        subtitle: "Gestão de prontuários e evolução clínica"
      };
    }
    if (path.startsWith("/agenda")) {
      return {
        type: 'page',
        title: "Agenda",
        subtitle: "Gestão de sessões e presenças"
      };
    }
    if (path.startsWith("/my-forms") || path.startsWith("/forms")) {
      return {
        type: 'page',
        title: "Meus Instrumentos",
        subtitle: "Gerencie seus modelos personalizados."
      };
    }
    if (path.startsWith("/library")) {
      return {
        type: 'page',
        title: "Acervo Clínico",
        subtitle: "Explore e utilize instrumentos validados por especialistas."
      };
    }
    if (path.startsWith("/crm")) {
      return {
        type: 'page',
        title: "CRM - Funil de Captação",
        subtitle: "Gerencie leads, triagens e acompanhe a atração de novos pacientes."
      };
    }
    
    // Default (Home)
    return {
      type: 'greeting',
      title: `${getGreeting()},`,
      titleHighlight: user?.name?.split(" ")[0] || "Usuário",
      subtitle: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    };
  };

  const content = getHeaderContent();
  const initials = user?.name?.split(" ")?.map((n) => n[0])?.join("")?.toUpperCase()?.slice(0, 2) || "U";

  return (
    <>
      <div className="relative flex items-start justify-between gap-5 pb-5 border-b border-[var(--border)] overflow-visible shrink-0 px-6 pt-6 bg-[var(--bg)] z-30 transition-colors duration-200">
        <span className="absolute w-[150px] h-[150px] rounded-full bg-[var(--peach-light)] opacity-20 blur-3xl top-0 right-24 pointer-events-none" />
        <span className="absolute w-[90px] h-[90px] rounded-full bg-[var(--sage-light)] opacity-20 blur-3xl bottom-0 right-[280px] pointer-events-none" />
        <span className="absolute w-[70px] h-[70px] rounded-full bg-[var(--purple-light)] opacity-20 blur-3xl top-2 -right-[8px] pointer-events-none" />

        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] mb-1.5" style={{ color: "var(--sage)" }}>
            {content.subtitle}
          </p>
          <h1 className="leading-tight m-0 text-[var(--text-primary)] tracking-tight flex items-baseline whitespace-nowrap overflow-hidden">
            <span className="font-handwritten font-normal text-[26px] md:text-[38px] shrink-0">
              {content.type === 'greeting' ? (
                <>
                  <span className="hidden sm:inline">{content.title}</span>
                  <span className="sm:hidden">Olá,</span>
                </>
              ) : (
                content.title
              )}
            </span>
            {content.titleHighlight && (
              <span className="relative inline-block ml-1.5 md:ml-2 min-w-0 flex-1">
                <span className="block truncate font-handwritten font-normal text-[26px] md:text-[38px] text-[var(--dark-green)] dark:text-[#5CBF9D] transition-colors duration-300">
                  {content.titleHighlight}
                </span>
                <svg className="hidden md:block absolute left-0 -bottom-[2px] w-full h-[6px] overflow-visible text-[var(--sage)] opacity-80" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <path d="M0,6 C15,-4 30,16 50,6 C70,-4 85,16 100,6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            )}
          </h1>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 pt-[4px] shrink-0">
          <button onClick={toggleTheme} title="Mudar tema" className="relative flex items-center bg-[var(--surface-alt)] border border-[var(--border)] rounded-[999px] cursor-pointer w-[52px] h-[28px] transition-colors duration-300 hover:border-[var(--sage)]">
            <span className={`absolute inset-0 rounded-[999px] transition-colors duration-300 ${theme === "dark" ? "bg-[#1a2540]" : "bg-[var(--sage-light)]"}`} />
            <span className={`relative z-10 w-[20px] h-[20px] rounded-full flex items-center justify-center text-white shadow-sm transition-all duration-300 ease-in-out ${theme === "dark" ? "translate-x-[26px] bg-[#2B3D6B]" : "translate-x-[4px] bg-[var(--sage)]"}`}>
              {theme === "light" ? <Sun size={11} strokeWidth={2.5} /> : <Moon size={11} strokeWidth={2.5} />}
            </span>
          </button>
          <button className="w-[36px] h-[36px] rounded-[10px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] relative cursor-pointer hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]" title="Notificações">
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full bg-[var(--peach)] border-2 border-[var(--bg)]" />
          </button>
          <div className="relative">
            <button onClick={() => setShowProfileMenu(true)} title="Perfil" className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-white text-sm flex-shrink-0 cursor-pointer overflow-hidden" style={{ background: user?.avatarUrl ? "transparent" : "var(--sage)", boxShadow: "0 0 0 2px var(--border)" }}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Foto do perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[12px] font-bold tracking-wide">{initials}</span>
              )}
            </button>
            {showProfileMenu && (
              <ProfileDropdown 
                user={user} 
                onClose={() => setShowProfileMenu(false)} 
                onEditProfile={() => setShowAvatarPicker(true)} 
                onLogout={() => { logout(); navigate("/login"); }} 
              />
            )}
          </div>
        </div>
      </div>

      {showAvatarPicker && (
        <AvatarPickerModal onClose={() => setShowAvatarPicker(false)} />
      )}
    </>
  );
}
