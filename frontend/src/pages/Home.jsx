import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  MessageCircle, CheckCheck, Calendar, Sun, Moon,
  Bell, DollarSign, FileText, Banknote, AlertCircle
} from "lucide-react";
import AvatarPickerModal from "../components/AvatarPickerModal";
import DecorativeElements from "../components/DecorativeElements";
import AppointmentDetailModal from "../components/AppointmentDetailModal";

import { useDashboardData, getGreeting } from "../hooks/useDashboardData";
import { useQuickNotes } from "../hooks/useQuickNotes";

import { KpiCard, TimelineRow, fmtCurrency } from "../components/dashboard/Shared";
import { AgendaWidget } from "../components/dashboard/AgendaWidget";
import { RevenueWidget } from "../components/dashboard/RevenueWidget";
import { InstrumentsWidget } from "../components/dashboard/InstrumentsWidget";
import { BirthdaysWidget } from "../components/dashboard/BirthdaysWidget";
import { PatientProfileWidget } from "../components/dashboard/PatientProfileWidget";
import { QuickNotesWidget } from "../components/dashboard/QuickNotesWidget";

export default function Home() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const dashboardData = useDashboardData();
  const notesData = useQuickNotes();

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, app: null });

  // Expose variables needed for KPI row and header
  const {
    loading, todayEvents, upcomingDays, activePatients, monthPatientIds,
    totalSent, totalResponses, completionRate, topForm, formStats,
    upcomingBirthdays, genderData, ageData, maxAge, revenueData,
  } = dashboardData;

  // Re-calculate KPI totals directly derived from attendances/payments 
  // (We can pass them directly from the hook or just use what we need)
  // Wait, I didn't export totalPaid, aReceberCount, taxaPresenca, presencas, totalMesAtendimentos from the hook!
  // I need to add them to the hook. I will fix useDashboardData right after writing this.
  // For now, I'll extract them assuming they are in dashboardData.
  const {
    totalPaid = 0, prevTotalPaid = 0, aReceberCount = 0,
    taxaPresenca = 0, prevTaxaPresenca = 0, presencas = 0, totalMesAtendimentos = 0
  } = dashboardData;

  const initials = user?.name?.split(" ")?.map((n) => n[0])?.join("")?.toUpperCase()?.slice(0, 2) || "U";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-full">
        <p className="text-[var(--text-muted)] animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-6 animate-fade-in flex flex-col gap-5 min-h-full min-w-0 relative overflow-y-auto">
      <DecorativeElements />

      {/* TOP BAR */}
      <div className="relative flex items-start justify-between gap-5 pb-5 border-b border-[var(--border)] overflow-visible flex-shrink-0">
        <span className="absolute w-[150px] h-[150px] rounded-full bg-[var(--peach-light)] opacity-50 blur-[2px] -top-[60px] right-24 pointer-events-none" />
        <span className="absolute w-[90px] h-[90px] rounded-full bg-[var(--sage-light)] opacity-50 blur-[2px] -bottom-[45px] right-[280px] pointer-events-none" />
        <span className="absolute w-[70px] h-[70px] rounded-full bg-[var(--purple-light)] opacity-50 blur-[2px] top-[8px] -right-[8px] pointer-events-none" />

        <div className="relative z-[1] flex-1 min-w-0">
          <h1 className="text-[30px] leading-tight m-0 text-[var(--text-primary)] font-heading font-normal tracking-tight flex items-baseline">
            <span className="font-brand">{getGreeting()},</span>{" "}
            <span className="relative inline-block ml-2">
              <span className="font-handwritten font-normal text-[36px] text-[var(--dark-green)] dark:text-[#5CBF9D] transition-colors duration-300">
                {user?.name?.split(" ")[0] || "Usuário"}
              </span>
              <svg className="absolute left-[1px] -bottom-[8px] w-[calc(100%-2px)] h-[10px] overflow-visible text-[var(--dark-green)] dark:text-[#5CBF9D] transition-colors duration-300" viewBox="0 0 60 10" preserveAspectRatio="none">
                <path d="M0,5 Q30,0 60,8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-40 transition-colors duration-300" />
                <path d="M2,9 Q30,4 58,10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-20 transition-colors duration-300" />
              </svg>
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-3">
            {totalResponses > 0 && (
              <span className="inline-flex items-center gap-[6px] text-[12px] font-bold px-[12px] py-[5px] rounded-[999px] bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[#5CBF9D]">
                <MessageCircle size={13} />
                {totalResponses} novas respostas
              </span>
            )}
            {aReceberCount > 0 && (
              <span className="inline-flex items-center gap-[6px] text-[12px] font-bold px-[12px] py-[5px] rounded-[999px] bg-[var(--blue-light)] text-[var(--blue)]">
                <AlertCircle size={13} />
                {aReceberCount} sessões a cobrar
              </span>
            )}
          </div>
        </div>

        <div className="relative z-[1] flex items-center gap-2.5 pt-[4px] flex-shrink-0">
          <button onClick={toggleTheme} title="Mudar tema" className="relative flex items-center bg-[var(--surface-alt)] border border-[var(--border)] rounded-[999px] cursor-pointer w-[52px] h-[28px] transition-colors duration-300 hover:border-[var(--sage)]">
            <span className={`absolute inset-0 rounded-[999px] transition-colors duration-300 ${theme === "dark" ? "bg-[#1a2540]" : "bg-[var(--sage-light)]"}`} />
            <span className={`relative z-[1] w-[20px] h-[20px] rounded-full flex items-center justify-center text-white shadow-sm transition-all duration-300 ease-in-out ${theme === "dark" ? "translate-x-[26px] bg-[#2B3D6B]" : "translate-x-[4px] bg-[var(--sage)]"}`}>
              {theme === "light" ? <Sun size={11} strokeWidth={2.5} /> : <Moon size={11} strokeWidth={2.5} />}
            </span>
          </button>
          <button className="w-[36px] h-[36px] rounded-[10px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] relative cursor-pointer hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]" title="Notificações">
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full bg-[var(--peach)] border-2 border-[var(--bg)]" />
          </button>
          <button onClick={() => setShowAvatarPicker(true)} title="Perfil" className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-white text-sm flex-shrink-0 cursor-pointer overflow-hidden" style={{ background: user?.avatarUrl ? "transparent" : "linear-gradient(135deg, #5CBF9D 0%, #F8A26B 100%)", boxShadow: "0 0 0 2px var(--border)" }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Foto do perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] font-bold tracking-wide">{initials}</span>
            )}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-shrink-0">
        <KpiCard icon={<Calendar size={16} />} iconBg="var(--blue-light)" iconColor="var(--blue)" label="Sessões hoje" value={todayEvents.length} sub={`${todayEvents.filter(e => e.attendance?.status === "presente").length} confirmadas`} />
        <KpiCard icon={<CheckCheck size={16} />} iconBg="var(--sage-light)" iconColor="var(--sage)" label="Presença no mês" value={`${taxaPresenca}%`} trend={{ current: taxaPresenca, previous: prevTaxaPresenca, unit: "%" }} sub={`${presencas} de ${totalMesAtendimentos} sessões`} />
        <KpiCard icon={<DollarSign size={16} />} iconBg="var(--peach-light)" iconColor="var(--peach)" label="Recebido no mês" value={fmtCurrency(totalPaid)} trend={{ current: totalPaid, previous: prevTotalPaid, unit: "R$" }} sub={prevTotalPaid > 0 ? "vs mês anterior" : "primeiro mês"} />
        <KpiCard icon={<Banknote size={16} />} iconBg="var(--purple-light)" iconColor="var(--purple)" label="Sessões a cobrar" value={aReceberCount} sub={aReceberCount > 0 ? "sessões sem pagamento" : "tudo em dia ✓"} urgent={aReceberCount > 0} />
        <KpiCard icon={<FileText size={16} />} iconBg="var(--sage-light)" iconColor="var(--dark-green)" label="Instrumentos" value={`${totalResponses}/${totalSent}`} sub={`${completionRate}% de resposta`} />
      </div>

      {/* WIDGETS */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch flex-1 min-h-0 min-w-0">
        <AgendaWidget today={new Date()} todayEvents={todayEvents} upcomingDays={upcomingDays} TimelineRow={TimelineRow} onEventClick={(app) => setDetailModal({ open: true, app })} />
        <div className="w-full lg:w-[40%] flex flex-col gap-4 min-h-0">
          <RevenueWidget revenueData={revenueData} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
            <InstrumentsWidget completionRate={completionRate} totalResponses={totalResponses} totalSent={totalSent} topForm={topForm} formStats={formStats} />
            <BirthdaysWidget upcomingBirthdays={upcomingBirthdays} />
          </div>
        </div>
        <div className="w-full lg:w-[30%] flex flex-col gap-4 min-h-0">
          <PatientProfileWidget activePatients={activePatients} monthPatientIds={monthPatientIds} genderData={genderData} ageData={ageData} maxAge={maxAge} />
          <QuickNotesWidget {...notesData} />
        </div>
      </div>

      {showAvatarPicker && <AvatarPickerModal onClose={() => setShowAvatarPicker(false)} />}
      {detailModal.open && detailModal.app && (
        <AppointmentDetailModal appointment={detailModal.app} patient={detailModal.app.patient} nextDate={detailModal.app.date} onClose={() => setDetailModal({ open: false, app: null })} onUpdate={dashboardData.loadData} />
      )}
    </div>
  );
}
