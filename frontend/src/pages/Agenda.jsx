import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  MoreVertical,
  List
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval } from "date-fns";

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00"
];

// ======================
// COMPONENTES AUXILIARES
// ======================

function UpcomingStarts({ appointments }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const upcoming = appointments.filter(a => {
    if (!a.startDate) return false;
    const startStr = (typeof a.startDate === 'string' ? a.startDate : a.startDate.toISOString()).split('T')[0];
    return startStr > todayStr;
  });
  
  if (upcoming.length === 0) return null;
  
  const grouped = upcoming.reduce((acc, app) => {
    const dateStr = new Date(app.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(app);
    return acc;
  }, {});
  
  return (
    <div className="mt-6 bg-slate-50 rounded-2xl border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-700 mb-4">Próximos Inícios</h3>
      {Object.entries(grouped).map(([dateStr, apps]) => (
        <div key={dateStr} className="mb-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">{dateStr}</p>
          <div className="space-y-1">
            {apps.map(app => (
              <div key={app.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {app.time}
                  </div>
                  <span className="text-xs font-medium text-slate-700">{app.patient?.name}</span>
                </div>
                <span className="text-[10px] text-slate-500">{DAYS_OF_WEEK[app.dayOfWeek]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListView({ appointments }) {
  const grouped = [0, 1, 2, 3, 4, 5, 6].map(dayIdx => ({
    dayName: DAYS_OF_WEEK[dayIdx],
    apps: appointments.filter(a => a.dayOfWeek === dayIdx).sort((a, b) => a.time.localeCompare(b.time))
  })).filter(group => group.apps.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-300 border-dashed">
        <Users size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Nenhuma sessão agendada</h3>
        <p className="text-slate-500">Adicione horários nos prontuários dos pacientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group, gIdx) => (
        <div key={gIdx} className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <CalendarIcon size={16} className="text-slate-500" />
              {group.dayName}
            </h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
              {group.apps.length} {group.apps.length === 1 ? 'Sessão' : 'Sessões'}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {group.apps.map(app => (
              <div key={app.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{app.patient?.name}</p>
                    <p className="text-xs text-slate-500">{app.time} • {app.duration} min</p>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                  <MoreVertical size={16} />
                </button>
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
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-50/80">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div key={idx} className="p-4 text-center border-r border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase">{day}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = format(day, 'M') === format(monthStart, 'M');
          const isToday = isSameDay(day, new Date());
          
          const dayApps = appointments.filter(a => {
            // Verifica o dia da semana
            if (Number(a.dayOfWeek) !== day.getDay()) return false;
            
            // Verifica a data de início de forma robusta
            if (a.startDate) {
              const startStr = (typeof a.startDate === 'string' ? a.startDate : a.startDate.toISOString()).split('T')[0];
              const currentStr = format(day, 'yyyy-MM-dd');
              return currentStr >= startStr;
            }
            return true;
          });

          return (
            <div key={idx} className={`min-h-[120px] p-2 border-r border-b border-slate-200 ${!isCurrentMonth ? 'bg-slate-50/40 grayscale opacity-40' : ''}`}>
              <div className="flex justify-end mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayApps.slice(0, 3).map(app => (
                  <div key={app.id} className="px-2 py-1 rounded bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-700 truncate">
                    {app.time} • {app.patient?.name}
                  </div>
                ))}
                {dayApps.length > 3 && <p className="text-[9px] text-slate-400">+{dayApps.length - 3}</p>}
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
          <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-300 bg-slate-50/80">
            <div className="p-4" />
            {weekDays.map((day, idx) => (
              <div key={idx} className={`p-4 text-center border-l border-slate-200 ${isSameDay(day, new Date()) ? 'bg-slate-50/50' : ''}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{DAYS_OF_WEEK[day.getDay()]}</p>
                <p className="text-xl font-bold">{format(day, 'd')}</p>
              </div>
            ))}
          </div>
          <div>
            {TIME_SLOTS.map((slot, sIdx) => (
              <div key={sIdx} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-200">
                <div className="p-2 text-[10px] font-bold text-slate-500 text-right pr-4 bg-slate-50/30 border-r border-slate-200">{slot}</div>
                {weekDays.map((day, dIdx) => {
                  const dayIdx = day.getDay();
                  const dayApps = appointments.filter(a => {
                    // Verifica dia da semana e horário
                    if (Number(a.dayOfWeek) !== dayIdx || a.time !== slot) return false;
                    
                    // Verifica data de início robustamente
                    if (a.startDate) {
                      const startStr = (typeof a.startDate === 'string' ? a.startDate : a.startDate.toISOString()).split('T')[0];
                      const currentStr = format(day, 'yyyy-MM-dd');
                      return currentStr >= startStr;
                    }
                    return true;
                  });

                  return (
                    <div key={dIdx} className="p-0.5 min-h-[45px] border-l border-slate-200">
                      {dayApps.map(app => (
                        <div key={app.id} className="px-2 py-1 rounded bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-800">
                          {app.patient?.name}
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

// ======================
// COMPONENTE PRINCIPAL
// ======================

export default function Agenda() {
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      let data = [];
      try {
        data = await api.getAppointments() || [];
        console.log("Appointments from API:", data);
      } catch (e) {
        console.log("Nenhum appointment");
      }
      // Se não tiver appointments, buscar pacientes com próxima sessão
      if (data.length === 0) {
        const patients = await api.getPatients() || [];
        data = patients.filter(p => p.nextSession && p.isActive !== false).map(p => ({
          id: p.id,
          patientId: p.id,
          dayOfWeek: new Date(p.nextSession).getDay(),
          time: p.sessionTime || "09:00",
          duration: p.sessionDuration || 50,
          startDate: p.nextSession,
          patient: { id: p.id, name: p.name }
        }));
      }
      console.log("Total appointments:", data.length);
      setAppointments(data);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  });

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
          <p className="text-sm text-slate-500">Gestão de horários e sessões ({appointments.length} carregados)</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {[
            { id: 'week', label: 'Semana', icon: CalendarIcon },
            { id: 'month', label: 'Mês', icon: CalendarIcon },
            { id: 'list', label: 'Lista', icon: List }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                view === item.id ? "bg-slate-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
              }`}
            >
              <item.icon size={18} />
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      {view !== 'list' && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">
              {view === 'week' 
                ? `Semana de ${format(weekDays[0], "d 'de' MMMM")}`
                : format(currentDate, "MMMM 'de' yyyy")
              }
            </h2>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button onClick={() => setCurrentDate(view === 'week' ? addDays(currentDate, -7) : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-white rounded-lg">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg">Hoje</button>
              <button onClick={() => setCurrentDate(view === 'week' ? addDays(currentDate, 7) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-white rounded-lg">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {view === "week" ? <WeekView weekDays={weekDays} appointments={appointments} /> :
           view === "month" ? <MonthView currentDate={currentDate} appointments={appointments} /> :
           <ListView appointments={appointments} />}
        </div>
      )}

      <UpcomingStarts appointments={appointments} />
    </div>
  );
}