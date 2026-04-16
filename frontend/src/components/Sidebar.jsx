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
        <div className="flex items-center justify-center flex-1 min-w-0">
          {collapsed ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-700/30"
            >
              <span className="text-white font-bold text-lg">Q</span>
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
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-1"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile */}
      <div className="px-3 py-4 shrink-0">
        <div className={`flex items-center rounded-xl bg-slate-800/50 transition-all duration-300 ${collapsed ? "justify-center p-2" : "justify-start p-1.5"}`}>
          <motion.div
            className={`rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-md shrink-0`}
            style={{ width: 40, height: 40 }}
            whileHover={{ scale: 1.05 }}
          >
            {initials}
          </motion.div>
          <span 
            className="text-sm font-semibold text-white truncate transition-all duration-300 overflow-hidden whitespace-nowrap"
            style={{ 
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
              marginLeft: collapsed ? 0 : 12
            }}
          >
            {user?.name}
          </span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-hidden">
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
