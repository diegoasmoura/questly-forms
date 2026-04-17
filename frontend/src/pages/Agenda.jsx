import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  MoreVertical,
  List,
  Check,
  X,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval } from "date-fns";

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// ======================
// COMPONENTES AUXILIARES
// ======================

function StatsBar({ appointments, attendances }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Contar sessões de hoje
  const todaySessions = appointments.filter(a => {
    if (!a.startDate) return false;
    const startStr = new Date(a.startDate).toISOString().split('T')[0];
    return startStr <= today.toISOString().split('T')[0] && a.dayOfWeek === today.getDay();
  });
  
  const presentCount = attendances.filter(a => a.status === "presente").length;
  const absentCount = attendances.filter(a => a.status === "falta").length;
  const justifiedCount = attendances.filter(a => a.status === "justificada").length;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <p className="text-xl font-bold text-slate-800">{appointments.length}</p>
        <p className="text-xs text-slate-500">TotalPacientes</p>
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <p className="text-xl font-bold text-emerald-600">{presentCount}</p>
        <p className="text-xs text-slate-500">Presenças</p>
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <p className="text-xl font-bold text-red-600">{absentCount}</p>
        <p className="text-xs text-slate-500">Faltas</p>
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <p className="text-xl font-bold text-amber-600">{justifiedCount}</p>
        <p className="text-xs text-slate-500">Justificadas</p>
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <p className="text-xl font-bold text-slate-800">{todaySessions.length}</p>
        <p className="text-xs text-slate-500">Hoje</p>
      </div>
    </div>
  );
}

function SessionCard({ appointment, onStatus, attendance }) {
  const patientName = appointment.patient?.name || "Paciente";
  const attendanceStatus = attendance?.status;
  
  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
          attendanceStatus === "presente" ? "bg-emerald-100 text-emerald-600" :
          attendanceStatus === "falta" ? "bg-red-100 text-red-600" :
          attendanceStatus === "justificada" ? "bg-amber-100 text-amber-600" :
          "bg-slate-100 text-slate-600"
        }`}>
          {patientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{patientName}</p>
          <p className="text-xs text-slate-500">{appointment.time} • {appointment.duration}min • {DAYS_OF_WEEK[appointment.dayOfWeek]}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onStatus(appointment, "presente")}
          className={`p-2 rounded-lg transition-colors ${
            attendanceStatus === "presente" ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
          }`}
          title="Presente"
        >
          <Check size={16} />
        </button>
        <button
          onClick={() => onStatus(appointment, "falta")}
          className={`p-2 rounded-lg transition-colors ${
            attendanceStatus === "falta" ? "bg-red-500 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
          }`}
          title="Falta"
        >
          <X size={16} />
        </button>
        <button
          onClick={() => onStatus(appointment, "justificada")}
          className={`p-2 rounded-lg transition-colors ${
            attendanceStatus === "justificada" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
          }`}
          title="Justificada"
        >
          <AlertCircle size={16} />
        </button>
      </div>
    </div>
  );
}

function DayView({ date, appointments, attendances, onStatus }) {
  const dayName = DAYS_OF_WEEK[date.getDay()];
  const dateStr = date.toISOString().split('T')[0];
  
  const dayAppointments = appointments.filter(a => {
    if (a.dayOfWeek !== date.getDay()) return false;
    if (a.startDate) {
      const startStr = new Date(a.startDate).toISOString().split('T')[0];
      return startStr <= dateStr;
    }
    return true;
  });
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-700">{dayName}</p>
          <p className="text-sm text-slate-500">{format(date, "d 'de' MMMM")}</p>
        </div>
        <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
          {dayAppointments.length} sessões
        </span>
      </div>
      <div className="p-3 space-y-2">
        {dayAppointments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma sessão</p>
        ) : (
          dayAppointments.map(app => (
            <SessionCard 
              key={app.id} 
              appointment={app} 
              attendance={attendances.find(a => a.patientId === app.patientId && a.date.split('T')[0] === dateStr)}
              onStatus={onStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WeekView({ weekDays, appointments, attendances, onStatus }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, idx) => (
        <DayView 
          key={idx} 
          date={day} 
          appointments={appointments} 
          attendances={attendances}
          onStatus={onStatus}
        />
      ))}
    </div>
  );
}

function MonthView({ currentDate, appointments, attendances, onStatus }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  const today = new Date();
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div key={idx} className="p-2 text-center text-xs font-bold text-slate-500 uppercase">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = format(day, 'M') === format(monthStart, 'M');
          const isToday = isSameDay(day, today);
          const dayApps = appointments.filter(a => {
            if (a.dayOfWeek !== day.getDay()) return false;
            if (!a.startDate) return true;
            const appStart = new Date(a.startDate).toISOString().split('T')[0];
            const dayStr = day.toISOString().split('T')[0];
            return dayStr >= appStart;
          });
          
          return (
            <div key={idx} className={`min-h-[100px] p-2 border-r border-b border-slate-100 ${!isCurrentMonth ? 'bg-slate-50 opacity-50' : ''}`}>
              <div className="flex justify-end">
                <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-2 mt-2">
                {dayApps.slice(0, 3).map(app => {
                  const att = attendances.find(a => a.patientId === app.patientId && a.date.split('T')[0] === day.toISOString().split('T')[0]);
                  return (
                    <div key={app.id} className="flex items-center gap-1">
                      <div className={`text-xs px-2 py-1.5 rounded truncate flex-1 font-medium ${
                        att?.status === 'presente' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                        att?.status === 'falta' ? 'bg-red-100 text-red-700 border border-red-300' :
                        att?.status === 'justificada' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className="font-bold mr-1">{app.time}</span>
                        {app.patient?.name?.split(" ")[0]}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => onStatus(app, 'presente', day)} className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${att?.status === 'presente' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100'}`} title="Presente">P</button>
                        <button onClick={() => onStatus(app, 'falta', day)} className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${att?.status === 'falta' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-400 hover:bg-red-100'}`} title="Falta">F</button>
                        <button onClick={() => onStatus(app, 'justificada', day)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${att?.status === 'justificada' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-400 hover:bg-amber-100'}`} title="Justificada">J</button>
                      </div>
                    </div>
                  );
                })}
                {dayApps.length > 3 && (
                  <div className="text-xs text-slate-400">+{dayApps.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ appointments, attendances, onStatus }) {
  const today = new Date().toISOString().split('T')[0];
  
  const grouped = [0, 1, 2, 3, 4, 5, 6].map(dayIdx => ({
    dayName: DAYS_OF_WEEK[dayIdx],
    apps: appointments.filter(a => {
      if (a.dayOfWeek !== dayIdx) return false;
      if (!a.startDate) return true;
      return a.startDate.split('T')[0] <= today;
    })
  })).filter(g => g.apps.length > 0);
  
  if (grouped.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Users size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="text-slate-500">Nenhuma sessão agendada</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {grouped.map(group => (
        <div key={group.dayName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">{group.dayName}</span>
            <span className="text-xs text-slate-500">{group.apps.length} sessões</span>
          </div>
          <div className="divide-y divide-slate-100">
            {group.apps.map(app => (
              <SessionCard 
                key={app.id} 
                appointment={app}
                attendance={attendances.find(a => a.patientId === app.patientId)}
                onStatus={onStatus}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ======================
// COMPONENTE PRINCIPAL
// ======================

export default function Agenda() {
  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar appointments
      let apps = [];
      try {
        apps = await api.getAppointments() || [];
      } catch (e) {
        console.log("Sem appointments");
      }
      
      // Se não tiver, buscar pacientes
      if (apps.length === 0) {
        const patients = await api.getPatients() || [];
        apps = patients.filter(p => p.nextSession && p.isActive !== false).map(p => ({
          id: p.id,
          patientId: p.id,
          dayOfWeek: new Date(p.nextSession).getDay(),
          time: p.sessionTime || "09:00",
          duration: p.sessionDuration || 50,
          startDate: p.nextSession,
          patient: { id: p.id, name: p.name }
        }));
      }
      
      setAppointments(apps);
      
      // Carregar attendances
      const atts = await api.getAttendances() || [];
      setAttendances(atts);
      
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (appointment, status, sessionDate) => {
    if (!sessionDate) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const dayOfWeek = appointment.dayOfWeek;
      const diff = (dayOfWeek - date.getDay() + 7) % 7;
      sessionDate = addDays(date, diff);
    }
    
    const dateStr = sessionDate.toISOString().split('T')[0];
    const existingAtt = attendances.find(a => a.patientId === appointment.patientId && a.date.split('T')[0] === dateStr);
    
    try {
      if (existingAtt?.status === status) {
        await api.deleteAttendance(existingAtt.id);
      } else {
        const data = {
          patientId: appointment.patientId,
          date: sessionDate.toISOString(),
          status,
          sessionTime: appointment.time
        };
        await api.saveAttendance(data);
      }
      
      const atts = await api.getAttendances() || [];
      setAttendances(atts);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  });

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
          <p className="text-sm text-slate-500">Gerencie suas sessões</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' },
            { id: 'list', label: 'Lista' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                view === item.id ? "bg-slate-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <StatsBar appointments={appointments} attendances={attendances} />

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
        <button onClick={() => setCurrentDate(view === 'week' ? addDays(currentDate, -7) : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-bold text-slate-700">
          {view === 'week' ? `Semana de ${format(weekDays[0], 'd MMM')}` : format(currentDate, 'MMMM yyyy')}
        </h2>
        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Hoje</button>
        <button onClick={() => setCurrentDate(view === 'week' ? addDays(currentDate, 7) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {view === "week" && <WeekView weekDays={weekDays} appointments={appointments} attendances={attendances} onStatus={handleAttendance} />}
          {view === "month" && <MonthView currentDate={currentDate} appointments={appointments} attendances={attendances} onStatus={handleAttendance} />}
          {view === "list" && <ListView appointments={appointments} attendances={attendances} onStatus={handleAttendance} />}
        </>
      )}
    </div>
  );
}