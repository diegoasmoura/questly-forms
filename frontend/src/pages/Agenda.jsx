import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Calendar, Clock, Users, ChevronRight, ArrowRight } from "lucide-react";

export default function Agenda() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getWeekDays = () => {
    const days = [];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: dayNames[date.getDay()],
        dayNum: date.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  const patientsWithNextSession = patients.filter(
    (p) => p.nextSession && p.isActive !== false
  );

  const todaysSessions = patientsWithNextSession.filter((p) => {
    const sessionDate = p.nextSession?.split("T")[0];
    return sessionDate === todayStr;
  });

  const thisWeekSessions = patientsWithNextSession.filter((p) => {
    const sessionDate = p.nextSession?.split("T")[0];
    return sessionDate >= todayStr && sessionDate <= weekDays[6].date;
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
              <Calendar size={20} className="text-emerald-600" />
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

      {/* Week View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Próximos 7 dias</h2>
        </div>
        
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {weekDays.map((day) => {
            const daySessions = patientsWithNextSession.filter((p) => 
              p.nextSession?.split("T")[0] === day.date
            );
            
            return (
              <div key={day.date} className={`p-3 ${day.isToday ? "bg-emerald-50" : ""}`}>
                <div className="text-center mb-2">
                  <p className={`text-xs font-medium ${day.isToday ? "text-emerald-600" : "text-slate-500"}`}>
                    {day.dayName}
                  </p>
                  <p className={`text-lg font-semibold ${day.isToday ? "text-emerald-700" : "text-slate-800"}`}>
                    {day.dayNum}
                  </p>
                </div>
                
                <div className="space-y-1">
                  {daySessions.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center">-</p>
                  ) : (
                    daySessions.map((p) => (
                      <Link
                        key={p.id}
                        to={`/patients/${p.id}`}
                        className="block px-2 py-1.5 text-xs bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors truncate"
                      >
                        {p.sessionTime?.slice(0, 5)} {p.name?.split(" ")[0]}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Sessions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Próximas sessões</h2>
          <Link to="/patients" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        
        <div className="divide-y divide-slate-100">
          {patientsWithNextSession.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma sessão agendada</p>
              <Link to="/patients" className="text-xs text-emerald-600 hover:text-emerald-700 mt-2 inline-block">
                Configurar agenda na aba Agenda do paciente
              </Link>
            </div>
          ) : (
            patientsWithNextSession
              .sort((a, b) => new Date(a.nextSession) - new Date(b.nextSession))
              .slice(0, 10)
              .map((patient) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
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
                    <p className="text-sm font-medium text-emerald-700">
                      {formatSessionDate(patient.nextSession)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(patient.nextSession).toLocaleDateString("pt-BR", { weekday: "short" })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>
              ))
          )}
        </div>
      </div>
    </div>
  );
}