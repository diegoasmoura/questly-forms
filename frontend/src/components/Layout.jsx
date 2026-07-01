import Sidebar from "./Sidebar";
import AvatarPickerModal from "./AvatarPickerModal";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useState } from "react";

const BackgroundGrid = ({ color = '#5eead4', cellSize = '40px', strokeWidth = '0.5', fade = false, className = '' }) => {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' stroke='${color}' stroke-width='${strokeWidth}' fill-opacity='0.2' fill='none'>
      <path d='M 100 0 L 100 200'/>
      <path d='M 0 100 L 200 100'/>
    </svg>
  `;
  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `url("${svgDataUrl}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: cellSize,
        maskImage: fade
          ? `radial-gradient(ellipse at center, white, transparent 70%)`
          : undefined,
        WebkitMaskImage: fade
          ? `radial-gradient(ellipse at center, white, transparent 70%)`
          : undefined,
      }}
    />
  );
};

export default function Layout({ children }) {
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  const isFormBuilder = location.pathname.includes("/forms/") && (location.pathname.includes("/edit") || location.pathname.includes("/new"));

  const gradient = "from-purple-500 to-pink-500";
  const initials = user?.name?.split(" ")[0]?.slice(0, 2)?.toUpperCase() || "U";

  const gridColor = theme === "dark" ? "#0d9488" : "#5eead4";

  return (
    <div className="flex min-h-screen bg-[#f5f0eb] dark:bg-slate-900 font-sans relative transition-colors duration-200">
      {/* Background Grid */}
      <BackgroundGrid color={gridColor} cellSize="40px" strokeWidth={theme === "dark" ? "1" : "0.5"} fade={true} />
      
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10 dark:bg-slate-800 dark:border-l dark:border-slate-700/50">
        {/* Top Bar */}
        <div className="h-14 shrink-0 flex items-center justify-end px-6 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden hover:ring-2 hover:ring-brand-400 transition-all"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>
        </div>

        <main className={`flex-1 ${isFormBuilder ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
          {children}
        </main>
      </div>

      {showAvatarPicker && <AvatarPickerModal onClose={() => setShowAvatarPicker(false)} />}
    </div>
  );
}
