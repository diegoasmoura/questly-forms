import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  Users, 
  Library, 
  FileText, 
  Calendar
} from "lucide-react";

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: FileText, label: "Instrumentos", path: "/my-forms" },
  { icon: Library, label: "Acervo", path: "/library" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bottom-nav-container"
    >
      <div className="bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 pb-safe">
        <nav className="flex items-center justify-around py-2 px-2">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path 
              || (item.path !== "/home" && location.pathname.startsWith(item.path))
              || (item.path === "/my-forms" && location.pathname.startsWith("/forms"));

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center relative group py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[64px]"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon 
                      size={22} 
                      className={`transition-colors duration-200 ${
                        isActive 
                          ? "text-emerald-400" 
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                  </motion.div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                
                <span 
                  className={`text-[10px] font-medium mt-1 transition-all duration-200 truncate max-w-[60px] ${
                    isActive 
                      ? "text-emerald-400 font-semibold" 
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
    </motion.div>
  );
}