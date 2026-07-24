import { Link, useLocation } from "react-router-dom";
import { Home, Users, Calendar, FileText, Library } from "lucide-react";

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: FileText, label: "Formulários", path: "/my-forms" },
  { icon: Library, label: "Acervo", path: "/library" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 h-[65px] bg-[var(--bg)] border-t border-[var(--border)] flex items-center justify-around z-40 px-1 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {menuItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== "/home" && location.pathname.startsWith(item.path)) ||
          (item.path === "/my-forms" && location.pathname.startsWith("/forms"));
        
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 cursor-pointer ${
              isActive 
                ? "text-[var(--sage)] dark:text-[#5CBF9D]" 
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <div className={`flex items-center justify-center w-12 h-[30px] rounded-full transition-all duration-300 ${isActive ? "bg-[var(--sage-light)]" : "bg-transparent"}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "opacity-100" : "opacity-80 font-medium"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
