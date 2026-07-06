import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle, CheckCheck, Calendar,
  Bell, DollarSign, FileText, Banknote, AlertCircle
} from "lucide-react";
import DecorativeElements from "../components/DecorativeElements";
import AppointmentDetailModal from "../components/AppointmentDetailModal";

import { useDashboardData } from "../hooks/useDashboardData";
import { useQuickNotes } from "../hooks/useQuickNotes";

import { KpiCard, TimelineRow, fmtCurrency } from "../components/dashboard/Shared";
import { AgendaWidget } from "../components/dashboard/AgendaWidget";
import { RevenueWidget } from "../components/dashboard/RevenueWidget";
import { InstrumentsWidget } from "../components/dashboard/InstrumentsWidget";
import { BirthdaysWidget } from "../components/dashboard/BirthdaysWidget";
import { PatientProfileWidget } from "../components/dashboard/PatientProfileWidget";
import { QuickNotesWidget } from "../components/dashboard/QuickNotesWidget";

export default function Home() {
  const navigate = useNavigate();

  const dashboardData = useDashboardData();
  const notesData = useQuickNotes();

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-full">
        <p className="text-[var(--text-muted)] animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 animate-fade-in flex flex-col gap-5 min-h-full min-w-0 relative">
      <DecorativeElements />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 flex-shrink-0">
        <KpiCard icon={<Calendar size={16} />} iconBg="var(--blue-light)" iconColor="var(--blue)" label="Sessões hoje" value={todayEvents.length} sub={`${todayEvents.filter(e => e.attendance?.status === "presente").length} confirmadas`} />
        <KpiCard icon={<CheckCheck size={16} />} iconBg="var(--sage-light)" iconColor="var(--sage)" label="Presença no mês" value={`${taxaPresenca}%`} trend={{ current: taxaPresenca, previous: prevTaxaPresenca, unit: "%" }} sub={`${presencas} de ${totalMesAtendimentos} sessões`} />
        <KpiCard icon={<Banknote size={16} />} iconBg="var(--purple-light)" iconColor="var(--purple)" label="Sessões a cobrar" value={aReceberCount} sub={aReceberCount > 0 ? "sessões sem pagamento" : "tudo em dia ✓"} />
        <KpiCard icon={<FileText size={16} />} iconBg="var(--sage-light)" iconColor="var(--dark-green)" label="Instrumentos" value={`${totalResponses}/${totalSent}`} sub={`${completionRate}% de resposta`} />
        <KpiCard className="col-span-2 md:col-span-1" icon={<DollarSign size={16} />} iconBg="var(--peach-light)" iconColor="var(--peach)" label="Recebido no mês" value={fmtCurrency(totalPaid)} trend={{ current: totalPaid, previous: prevTotalPaid, unit: "R$" }} sub={prevTotalPaid > 0 ? "vs mês anterior" : "primeiro mês"} />
      </div>

      {/* WIDGETS */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:flex-1 lg:min-h-0 min-w-0">
        <AgendaWidget today={new Date()} todayEvents={todayEvents} upcomingDays={upcomingDays} TimelineRow={TimelineRow} onEventClick={(app) => setDetailModal({ open: true, app })} />
        <div className="w-full lg:w-[40%] flex flex-col gap-4 lg:min-h-0">
          <RevenueWidget revenueData={revenueData} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
            <InstrumentsWidget completionRate={completionRate} totalResponses={totalResponses} totalSent={totalSent} topForm={topForm} formStats={formStats} />
            <BirthdaysWidget upcomingBirthdays={upcomingBirthdays} />
          </div>
        </div>
        <div className="w-full lg:w-[30%] flex flex-col gap-4 lg:min-h-0">
          <PatientProfileWidget activePatients={activePatients} monthPatientIds={monthPatientIds} genderData={genderData} ageData={ageData} maxAge={maxAge} />
          <QuickNotesWidget {...notesData} />
        </div>
      </div>


      {detailModal.open && detailModal.app && (
        <AppointmentDetailModal appointment={detailModal.app} patient={detailModal.app.patient} nextDate={detailModal.app.date} onClose={() => setDetailModal({ open: false, app: null })} onUpdate={() => dashboardData.loadData(true)} />
      )}
    </div>
  );
}
