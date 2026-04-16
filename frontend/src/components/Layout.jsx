import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Content container - controlled width but generally full within constraints */}
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
