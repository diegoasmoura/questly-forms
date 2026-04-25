import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useIsDesktop, useIsMobile } from "../hooks/useMediaQuery";

const BackgroundGrid = ({ cellSize = "40px", strokeWidth = "0.5" }) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' stroke='%2310b981' stroke-width='${strokeWidth}' fill='none'><path d='M 100 0 L 100 200'/><path d='M 0 100 L 200 100'/></svg>`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`,
        backgroundRepeat: "repeat",
        backgroundSize: cellSize,
        opacity: 0.4,
      }}
    />
  );
};

export default function Layout({ children }) {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">

      {/* Grid de fundo — menor e mais sutil no mobile */}
      <BackgroundGrid
        cellSize={isMobile ? "24px" : "40px"}
        strokeWidth={isMobile ? "0.3" : "0.5"}
      />

      {/* Sidebar (desktop) ou BottomNav (mobile) */}
      {isDesktop ? <Sidebar /> : <BottomNav />}

      {/* Área de conteúdo */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* 
            Espaço inferior no mobile para não ficar atrás da BottomNav.
            72px = altura da nav  +  safe-area do iPhone (notch/home indicator)
          */}
          <div
            style={{
              paddingBottom: !isDesktop
                ? "max(72px, calc(64px + env(safe-area-inset-bottom)))"
                : undefined,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: isMobile ? 8 : 0, x: isMobile ? 0 : 16 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: isMobile ? -8 : 0, x: isMobile ? 0 : -16 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
