import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();

  const isFormBuilder =
    location.pathname.includes("/forms/") &&
    (location.pathname.includes("/edit") ||
      location.pathname.includes("/new"));

  return (
    // h-dvh = ÚNICA fonte de altura de viewport de todo o app.
    // overflow-hidden trava esse container: nada aqui pode "empurrar" a página
    // inteira e criar um scroll duplo (documento + wrapper interno).
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--bg)] font-sans relative transition-colors duration-200">
      <Sidebar />

      {/* Único elemento que rola. Herda altura do pai via h-full (não via
          viewport), então nunca fica fora de sincronia com a Sidebar. */}
      <div 
        className="flex-1 flex flex-col min-w-0 min-h-0 h-full relative z-10 overflow-y-auto overflow-x-hidden md:!pb-0"
        style={{ paddingBottom: 'calc(65px + env(safe-area-inset-bottom))' }}
      >
        <main
          className={`flex-1 flex flex-col min-h-0 min-w-0 ${
            isFormBuilder ? "overflow-hidden" : ""
          }`}
        >
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
