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

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Users, label: "Patients", path: "/patients" },
  { icon: FileText, label: "My Forms", path: "/my-forms" },
  { icon: Library, label: "Library", path: "/library" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside 
      className={`bg-slate-900 flex flex-col transition-all duration-300 ease-in-out h-screen sticky top-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
        {!collapsed && (
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-700 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Q</span>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Questly
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg bg-brand-700 flex items-center justify-center mx-auto">
            <span className="text-white font-semibold text-sm">Q</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${collapsed ? "mx-auto mt-2" : ""}`}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile */}
      <div className={`p-4 ${collapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800 ${collapsed ? "justify-center w-12 h-12 p-0" : ""}`}>
          <div className="w-10 h-10 rounded-lg bg-brand-700 flex items-center justify-center text-white shrink-0 font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">Psychologist</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/home" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? "bg-brand-700 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : ""}
            >
              <item.icon size={20} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 group ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Logout" : ""}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
