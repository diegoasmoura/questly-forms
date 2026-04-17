import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  Users, 
  Library, 
  FileText, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Users, label: "Patients", path: "/patients" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
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
  if (!name) return "from-blue-500 to-indigo-600";
  const gradients = [
    "from-blue-400 to-blue-600",
    "from-indigo-400 to-indigo-600",
    "from-cyan-400 to-blue-500",
    "from-sky-400 to-indigo-500",
    "from-blue-500 to-violet-600",
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
        <div className="flex items-center justify-start min-w-0">
          {!collapsed && (
            <div className="overflow-hidden" key={`brand-${collapsed}`}>
              <motion.span
                className="text-xl font-bold text-white tracking-tight whitespace-nowrap inline-block"
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{ 
                  width: { duration: 0.4, ease: "easeOut" }
                }}
              >
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    opacity: { duration: 0.1 },
                    y: { duration: 0.2 }
                  }}
                >
                  Q
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  u
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  e
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  s
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  t
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.40, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  l
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.48, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  y
                </motion.span>
                <motion.span
                  className="inline-block ml-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.56, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  F
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.64, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  o
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.72, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  r
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.80, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  m
                </motion.span>
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.88, opacity: { duration: 0.1 }, y: { duration: 0.2 } }}
                >
                  s
                </motion.span>
              </motion.span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
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
          const isActive = location.pathname === item.path 
            || (item.path !== "/home" && location.pathname.startsWith(item.path))
            || (item.path === "/my-forms" && location.pathname.startsWith("/forms"));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center rounded-lg transition-colors duration-200 ${
                isActive 
                  ? "bg-emerald-600 text-white" 
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
