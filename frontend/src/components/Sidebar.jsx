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
  Plus
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
      className={`bg-white border-r border-brand-100 flex flex-col transition-all duration-300 ease-in-out h-screen sticky top-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-brand-50">
        {!collapsed && (
          <Link to="/home" className="text-xl font-bold text-brand-950 tracking-tight">
            curious
          </Link>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-brand-400 hover:text-brand-950 hover:bg-brand-50 transition-colors ${collapsed ? "mx-auto" : ""}`}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile */}
      <div className={`p-4 ${collapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-brand-50/50 border border-brand-50 ${collapsed ? "justify-center w-12 h-12 p-0" : ""}`}>
          <div className="w-10 h-10 rounded-lg bg-brand-950 flex items-center justify-center text-white shrink-0 font-medium">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-950 truncate">{user?.name}</p>
              <p className="text-xs text-brand-400 truncate">Psychologist</p>
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
                  ? "bg-brand-950 text-white shadow-sm" 
                  : "text-brand-500 hover:text-brand-950 hover:bg-brand-50"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : ""}
            >
              <item.icon size={20} className={isActive ? "text-white" : "group-hover:text-brand-950"} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-brand-50">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-brand-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Logout" : ""}
        >
          <LogOut size={20} className="group-hover:text-red-600" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
