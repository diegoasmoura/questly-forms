import { User, Settings, Calendar, CreditCard, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfileDropdown({ user, onClose, onEditProfile, onLogout }) {
  const navigate = useNavigate();
  const initials = user?.name?.split(" ")?.map((n) => n[0])?.join("")?.toUpperCase()?.slice(0, 2) || "U";

  return (
    <>
      {/* Backdrop invisível para capturar o clique fora */}
      <div className="fixed inset-0 z-[40]" onClick={onClose} />
      
      {/* O Menu Suspenso */}
      <div className="absolute right-0 top-full mt-2 w-[260px] bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-card-hover z-[50] py-2 flex flex-col animate-fade-in origin-top-right">
        
        {/* Cabeçalho */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--border)]">
          <div className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-white text-sm flex-shrink-0 cursor-default overflow-hidden" style={{ background: user?.avatarUrl ? "transparent" : "linear-gradient(135deg, #5CBF9D 0%, #F8A26B 100%)", boxShadow: "0 0 0 1px var(--border)" }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Foto do perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[14px] font-bold tracking-wide">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{user?.name || "Usuário"}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{user?.email || "usuario@email.com"}</p>
          </div>
        </div>

        {/* Grupo 1: Perfil */}
        <div className="py-1 border-b border-[var(--border)]">
          <button onClick={() => { onEditProfile(); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left cursor-pointer">
            <User size={16} strokeWidth={2} />
            Meu Perfil
          </button>
        </div>

        {/* Grupo 2: Gestão */}
        <div className="py-1 border-b border-[var(--border)]">
          <button onClick={() => { navigate("/settings?tab=clinic"); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left cursor-pointer">
            <Settings size={16} strokeWidth={2} />
            Configurações da Clínica
          </button>
          <button onClick={() => { navigate("/settings?tab=agenda"); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left cursor-pointer">
            <Calendar size={16} strokeWidth={2} />
            Preferências de Agenda
          </button>
        </div>

        {/* Grupo 3: Sistema */}
        <div className="py-1 border-b border-[var(--border)]">
          <button onClick={() => { navigate("/settings?tab=billing"); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left cursor-pointer">
            <CreditCard size={16} strokeWidth={2} />
            Assinatura e Cobrança
          </button>
          <button onClick={() => { navigate("/settings?tab=help"); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left cursor-pointer">
            <HelpCircle size={16} strokeWidth={2} />
            Central de Ajuda
          </button>
        </div>

        {/* Grupo 4: Saída */}
        <div className="py-1">
          <button onClick={() => { onLogout(); onClose(); }} className="w-full px-4 py-2 flex items-center gap-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left cursor-pointer">
            <LogOut size={16} strokeWidth={2} />
            Sair
          </button>
        </div>

      </div>
    </>
  );
}
