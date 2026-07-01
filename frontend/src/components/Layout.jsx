import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();

  const isFormBuilder =
    location.pathname.includes("/forms/") &&
    (location.pathname.includes("/edit") ||
      location.pathname.includes("/new"));

  return (
    <div className="flex min-h-screen bg-[var(--bg)] font-sans relative transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        <main
          className={`flex-1 ${
            isFormBuilder ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
