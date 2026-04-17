import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Calendar from "react-calendar";
import { api } from "../lib/api";
import { Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import "react-calendar/dist/Calendar.css";

const tileClassName = ({ date, view }) => {
  if (view === "month") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) {
      return "bg-emerald-500 text-white rounded-full";
    }
  }
  return "";
};

export default function Agenda() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const patientsWithNextSession = patients.filter(
    (p) => p.nextSession && p.isActive !== false
  );

  const todaysSessions = patientsWithNextSession.filter((p) => {
    const sessionDate = p.nextSession?.split("T")[0];
    return sessionDate === todayStr;
  });

  const thisWeekSessions = patientsWithNextSession.filter((p) => {
    const sessionDate = p.nextSession?.split("T")[0];
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    return sessionDate >= todayStr && sessionDate <= weekEnd.toISOString().split("T")[0];
  });

  const frequencyLabels = {
    semanal: "Semanal",
    quinzenal: "Quinzenal",
    mensal: "Mensal",
    "semanal-2": "2x/semana",
    outro: "Outro",
  };

  const formatSessionDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const monthSessions = patientsWithNextSession.filter((p => {
    if (!p.nextSession) return false;
    const sessionDate = new Date(p.nextSession);
    const calDate = new Date(calendarDate);
    return sessionDate.getMonth() === calDate.getMonth() && 
           sessionDate.getFullYear() === calDate.getFullYear();
  }));

  const tileDisabled = ({ date, view }) => {
    return view === "month" && date < new Date(today.setHours(0, 0, 0, 0));
  };

  const getSessionsForDay = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return patientsWithNextSession.filter((p) => p.nextSession?.split("T")[0] === dateStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Agenda</h1>
          <p className="text-sm text-slate-500">Suas sessões agendadas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CalendarIcon size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{todaysSessions.length}</p>
              <p className="text-xs text-slate-500">Hoje</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{thisWeekSessions.length}</p>
              <p className="text-xs text-slate-500">Esta semana</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{patientsWithNextSession.length}</p>
              <p className="text-xs text-slate-500">Pacientes ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Calendar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          {calendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </h2>
        
        <Calendar
          onChange={setCalendarDate}
          value={calendarDate}
          locale="pt-BR"
          view="month"
          tileClassName={tileClassName}
          tileDisabled={tileDisabled}
          formatShortWeekday={(locale, index) => ["D", "S", "T", "Q", "Q", "S", "S"][index]}
          className="w-full"
        />
        
        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            Hoje
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
            Sessão agendada
          </div>
        </div>
      </div>

      {/* Sessions for selected month */}
      {monthSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Sessões em {calendarDate.toLocaleDateString("pt-BR", { month: "long" })}
            </h2>
            <span className="text-xs text-slate-500">{monthSessions.length} sessões</span>
          </div>
          
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {monthSessions
              .sort((a, b) => new Date(a.nextSession) - new Date(b.nextSession))
              .map((patient) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold text-sm">
                      {patient.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{patient.name}</p>
                      <p className="text-xs text-slate-500">
                        {patient.sessionTime?.slice(0, 5)} · {frequencyLabels[patient.sessionFrequency] || "Semanal"} · {patient.sessionDuration}min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-700">
                      {formatSessionDate(patient.nextSession)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(patient.nextSession).toLocaleDateString("pt-BR", { weekday: "short" })}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {patientsWithNextSession.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <CalendarIcon size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhuma sessão agendada</p>
          <Link to="/patients" className="text-xs text-emerald-600 hover:text-emerald-700 mt-2 inline-block">
            Configurar agenda na aba Agenda do paciente
          </Link>
        </div>
      )}
    </div>
  );
}