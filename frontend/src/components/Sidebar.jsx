import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  Users, 
  Library, 
  FileText, 
  LogOut, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const TreasureMapIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="48" height="40" rx="2" fill="#E8DCC4" stroke="#8B6914" strokeWidth="2"/>
    <rect x="12" y="16" width="40" height="32" rx="1" fill="#F5ECD7"/>
    <path d="M16 20H48M16 26H48M16 32H48M16 38H48M16 44H48" stroke="#C4A574" strokeWidth="0.5" strokeDasharray="2 2"/>
    <path d="M20 16V48M28 16V48M36 16V48M44 16V48" stroke="#C4A574" strokeWidth="0.5" strokeDasharray="2 2"/>
    <path d="M36 36L40 40L44 36" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M36 36L40 40" stroke="#DC2626" strokeWidth="3" strokeLinecap="round"/>
    <path d="M14 14L18 14L18 18" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 14L46 14L46 18" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 50L18 50L18 46" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 50L46 50L46 46" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="26" r="3" fill="none" stroke="#C4A574" strokeWidth="0.5"/>
    <circle cx="40" cy="28" r="2" fill="none" stroke="#C4A574" strokeWidth="0.5"/>
    <circle cx="28" cy="42" r="2.5" fill="none" stroke="#C4A574" strokeWidth="0.5"/>
    <path d="M22 24L24 26L26 24" stroke="#C4A574" strokeWidth="0.5" strokeLinecap="round"/>
    <path d="M38 26L40 28L42 26" stroke="#C4A574" strokeWidth="0.5" strokeLinecap="round"/>
    <path d="M26 40L28 42L30 40" stroke="#C4A574" strokeWidth="0.5" strokeLinecap="round"/>
  </svg>
);

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Users, label: "Patients", path: "/patients" },
  { icon: FileText, label: "My Forms", path: "/my-forms" },
  { icon: Library, label: "Library", path: "/library" },
];

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarGradient = (name) => {
  if (!name) return "from-brand-500 to-brand-700";
  const gradients = [
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-purple-600",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = getInitials(user?.name);
  const gradient = getAvatarGradient(user?.name);

  return (
    <div
      className="bg-slate-900 flex flex-col h-screen sticky top-0 overflow-hidden transition-[width] duration-300 ease-out"
      style={{ width: collapsed ? 72 : 256 }}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-slate-800 shrink-0">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} min-w-0`}>
          {collapsed ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
            >
              <TreasureMapIcon size={28} />
            </motion.div>
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-xl font-bold text-white tracking-tight whitespace-nowrap"
            >
              Questly
            </motion.span>
          )}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile */}
      <div className="px-3 py-4 shrink-0">
        {collapsed ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-md w-[32px] h-[32px] mx-auto`}
            whileHover={{ scale: 1.05 }}
          >
            {initials}
          </motion.div>
        ) : (
          <div className="flex items-center rounded-xl bg-slate-800/50 p-1.5">
            <span className="text-sm font-semibold text-white truncate">
              {user?.name}
            </span>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className={`flex-1 space-y-0.5 overflow-hidden ${collapsed ? "px-2" : "px-3"}`}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/home" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center rounded-lg transition-colors duration-200 ${
                isActive 
                  ? "bg-brand-700/80 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              } ${collapsed ? "justify-center py-2.5" : "py-2.5 px-3"}`}
              title={collapsed ? item.label : ""}
            >
              <item.icon size={18} className="shrink-0" />
              <span 
                className="text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap"
                style={{ 
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                  marginLeft: collapsed ? 0 : 12
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="px-3 py-4 border-t border-slate-800 shrink-0">
        <button
          onClick={handleLogout}
          className={`flex items-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-200 ${
            collapsed ? "justify-center py-2.5 w-full" : "py-2.5 px-3"
          }`}
          title={collapsed ? "Logout" : ""}
        >
          <LogOut size={18} className="shrink-0" />
          <span 
            className="text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap"
            style={{ 
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
              marginLeft: collapsed ? 0 : 12
            }}
          >
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
