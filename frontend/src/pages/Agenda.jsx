import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  Plus,
  MoreVertical,
  CalendarDays,
  List
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00"
];

export default function Agenda() {
  const [view, setView] = useState("week"); // week, month, list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.getAppointments();
      setAppointments(data || []);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextDate = () => {
    if (view === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const prevDate = () => {
    if (view === "week") setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
          <p className="text-sm text-slate-500">Gestão de horários e sessões</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setView("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${view === 'week' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CalendarDays size={14} />
            Semana
          </button>
          <button 
            onClick={() => setView("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${view === 'month' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CalendarIcon size={14} />
            Mês
          </button>
          <button 
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${view === 'list' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <List size={14} />
            Lista
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-700 capitalize">
            {view === 'week' 
              ? `Semana de ${format(weekDays[0], "d 'de' MMMM", { locale: ptBR })}`
              : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
            }
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={prevDate} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-md">
              Hoje
            </button>
            <button onClick={nextDate} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Carregando seus horários...</p>
          </div>
        </div>
      ) : view === "week" ? (
        <WeekView weekDays={weekDays} appointments={appointments} />
      ) : view === "month" ? (
        <MonthView currentDate={currentDate} appointments={appointments} />
      ) : (
        <ListView appointments={appointments} />
      )}
    </div>
  );
}

function ListView({ appointments }) {
  const grouped = [0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
    return {
      dayName: DAYS_OF_WEEK[dayIdx],
      apps: appointments.filter(a => a.dayOfWeek === dayIdx).sort((a, b) => a.time.localeCompare(b.time))
    };
  }).filter(group => group.apps.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
        <Users size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Nenhuma sessão agendada</h3>
        <p className="text-slate-500">Adicione horários nos prontuários dos pacientes para vê-los aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group, gIdx) => (
        <div key={gIdx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: `${gIdx * 50}ms` }}>
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <CalendarIcon size={16} className="text-emerald-500" />
              {group.dayName}
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {group.apps.length} {group.apps.length === 1 ? 'Sessão' : 'Sessões'}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {group.apps.map(app => (
              <div key={app.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{app.patient?.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        {app.time}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">• {app.duration} min</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all uppercase tracking-wider">
                    Ver Prontuário
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthView({ currentDate, appointments }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-50/80">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div key={idx} className="p-4 text-center border-r border-slate-200 last:border-r-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{day}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = format(day, 'M') === format(monthStart, 'M');
          const isToday = isSameDay(day, new Date());
          const dayApps = appointments.filter(a => a.dayOfWeek === day.getDay());

          return (
            <div 
              key={idx} 
              className={`min-h-[120px] p-2 border-r border-b border-slate-200 transition-colors hover:bg-slate-50/50 ${!isCurrentMonth ? 'bg-slate-50/40 grayscale-[0.5] opacity-40' : ''}`}
            >
              <div className="flex justify-end mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayApps.slice(0, 3).map(app => (
                  <div key={app.id} className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-700 truncate">
                    {app.time} • {app.patient?.name}
                  </div>
                ))}
                {dayApps.length > 3 && (
                  <p className="text-[9px] font-bold text-slate-400 px-1">
                    + {dayApps.length - 3} sessões
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ weekDays, appointments }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days Header */}
          <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-300 bg-slate-50/80">
            <div className="p-4" />
            {weekDays.map((day, idx) => (
              <div key={idx} className={`p-4 text-center border-l border-slate-200 ${isSameDay(day, new Date()) ? 'bg-emerald-50/50' : ''}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{DAYS_OF_WEEK[day.getDay()]}</p>
                <p className={`text-xl font-bold mt-1 ${isSameDay(day, new Date()) ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative">
            {TIME_SLOTS.map((slot, sIdx) => (
              <div key={sIdx} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-200 group">
                <div className="p-2 text-[10px] font-bold text-slate-500 text-right pr-4 flex items-center justify-end bg-slate-50/30 border-r border-slate-200">
                  {slot}
                </div>
                {[0,1,2,3,4,5,6].map(dayIdx => {
                  const dayApps = appointments.filter(a => a.dayOfWeek === dayIdx && a.time === slot);
                  return (
                    <div key={dayIdx} className="p-0.5 min-h-[45px] border-l border-slate-200 group-hover:bg-slate-50/50 transition-colors relative">
                      {dayApps.map(app => (
                        <div 
                          key={app.id} 
                          className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm group/item hover:bg-emerald-100 transition-all cursor-pointer h-full flex flex-col justify-center"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[9px] font-bold text-emerald-800 truncate leading-tight">
                              {app.patient?.name}
                            </p>
                            <span className="text-[8px] font-bold text-emerald-600/80 whitespace-nowrap">{app.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
