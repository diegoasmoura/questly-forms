import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { ActivityHeatmap } from "../components/ActivityHeatmap";
import {
  Users,
  FileText,
  Calendar,
  Clock,
  Plus,
  DollarSign,
  CakeSlice,
  PartyPopper,
  ChevronRight
} from "lucide-react";

function calculateBirthdayInfo(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  const diffTime = thisYearBirthday - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isWeek = diffDays >= -3 && diffDays <= 4;
  return { diffDays, isWeek, isToday: diffDays === 0, daysUntil: diffDays };
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [formStats, setFormStats] = useState({});
  const [aggregateData, setAggregateData] = useState({});

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsData, formsData, attendancesData, appointmentsData, paymentsData] = await Promise.all([
        api.getPatients(),
        api.getForms(),
        api.getAttendances(),
        api.getAppointments(),
        api.getPayments()
      ]);

      setPatients(patientsData);
      setAttendances(attendancesData);
      setAppointments(appointmentsData);
      setPayments(paymentsData);

      const [statsResults, aggregateResults] = await Promise.all([
        Promise.all(formsData.map(f => api.getFormStats(f.id).catch(() => ({ responseCount: 0, shareLinkCount: 0 })))),
        Promise.all(formsData.map(f => api.getAggregate(f.id).catch(() => null)))
      ]);

      const statsMap = {};
      formsData.forEach((f, i) => { statsMap[f.id] = statsResults[i]; });
      setFormStats(statsMap);

      const mergedAgg = {};
      aggregateResults.forEach(agg => {
        if (agg?.dailyCounts) {
          Object.entries(agg.dailyCounts).forEach(([date, count]) => {
            mergedAgg[date] = (mergedAgg[date] || 0) + count;
          });
        }
      });
      setAggregateData(mergedAgg);
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHomeData(); }, [loadHomeData]);

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const monthAttendances = attendances.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const monthPayments = payments.filter(p => {
    const d = new Date(p.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const sessionCount = monthAttendances.length;
  const presentCount = monthAttendances.filter(a => a.status === "presente").length;
  const faltaCount = monthAttendances.filter(a => a.status === "falta").length;
  const justCount = monthAttendances.filter(a => a.status === "justificada").length;

  const totalSent = Object.values(formStats).reduce((sum, s) => sum + (s.shareLinkCount || 0), 0);
  const totalResponses = Object.values(formStats).reduce((sum, s) => sum + (s.responseCount || 0), 0);
  const pendingInstruments = totalSent - totalResponses;

  const totalPaid = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const activePatients = patients.filter(p => p.isActive !== false).length;

  const birthdayPatients = patients.filter(p => {
    const info = calculateBirthdayInfo(p.birthDate);
    return info?.isWeek;
  }).slice(0, 10);

  const nextAppointments = appointments
    .filter(a => a.startDate && new Date(a.startDate) > today)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);

  const recentFaltas = monthAttendances
    .filter(a => a.status === "falta")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const patientMap = {};
  patients.forEach(p => { patientMap[p.id] = p; });

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden animate-fade-in">
      <header className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel Clínico</h1>
          <p className="text-sm text-slate-500">Visão geral da sua prática clínica</p>
        </div>
        <Link to="/patients" className="btn bg-emerald-600 text-white hover:bg-emerald-700 text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200">
          <Plus size={14} /> Novo Paciente
        </Link>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 shrink-0">
            <Link to="/patients" className="card p-3 flex items-center gap-3 border-l-4 border-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-800 leading-none">{activePatients}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pacientes Ativos</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{patients.length} total</p>
              </div>
            </Link>

            <div className="card p-3 flex items-center gap-3 border-l-4 border-blue-400">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-800 leading-none">{sessionCount}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sessões no Mês</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{presentCount}P · {faltaCount}F · {justCount}J</p>
              </div>
            </div>

            <Link to="/my-forms" className="card p-3 flex items-center gap-3 border-l-4 border-amber-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-800 leading-none">{totalResponses}<span className="text-base text-slate-400 font-bold">/{totalSent}</span></p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Instrumentos</p>
                <p className="text-[9px] text-amber-600 mt-0.5">{pendingInstruments} pendentes</p>
              </div>
            </Link>

            <div className="card p-3 flex items-center gap-3 border-l-4 border-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <DollarSign size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-slate-800 leading-none">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Receita do Mês</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{monthPayments.length} lançamentos</p>
              </div>
            </div>
          </div>

          {birthdayPatients.length > 0 && (
            <div className="mb-6 shrink-0">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PartyPopper size={16} className="text-amber-500" />
                  <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Aniversariantes da Semana</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {birthdayPatients.map(p => {
                    const info = calculateBirthdayInfo(p.birthDate);
                    return (
                      <Link key={p.id} to={`/patients/${p.id}`} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all group">
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                          <CakeSlice size={12} className="text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-amber-700 transition-colors">{p.name.split(" ")[0]}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${info?.isToday ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600"}`}>
                          {info?.isToday ? "Hoje!" : `+${info?.daysUntil || 0}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-2 flex flex-col min-h-0">
              <div className="card p-5 flex-1 min-h-0 overflow-y-auto">
                <ActivityHeatmap data={aggregateData} title="Atividade Clínica" />
              </div>
            </div>

            <div className="flex flex-col min-h-0 gap-4">
              <div className="card p-4 flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <Clock size={14} className="text-emerald-600" />
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Próximas Sessões</p>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                  {nextAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-6">
                      <Calendar size={24} className="text-slate-300 mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nenhuma sessão agendada</p>
                      <Link to="/agenda" className="text-[10px] text-emerald-600 font-bold mt-2 hover:text-emerald-700 transition-colors">
                        Gerenciar agenda
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {nextAppointments.map(app => {
                        const patient = patientMap[app.patientId];
                        const startDate = new Date(app.startDate);
                        return (
                          <Link key={app.id} to={`/patients/${app.patientId}`} className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                              {patient?.name?.charAt(0) || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                                {patient?.name || "Paciente"}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {startDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })} às {app.startTime?.slice(0, 5) || "--:--"}
                              </p>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
