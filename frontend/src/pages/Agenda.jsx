import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  TrendingUp,
  RefreshCcw,
  BookOpen,
  Edit,
  Trash2,
  Link2,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval } from "date-fns";
import { ptBR } from 'date-fns/locale';

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Função utilitária para chave de data consistente (YYYY-MM-DD fixa)
// Para objetos Date locais (calendário), usa métodos locais
// Para strings ISO (banco), extrai diretamente a data UTC
const formatDateKey = (date) => {
  if (!date) return "";
  // Se for string ISO (do banco), extrai diretamente
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  // Para objetos Date, usa local (para o calendário)
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Extrai data UTC de string ISO (para comparação com dados do banco)
const extractUTCDate = (dateStr) => {
  if (!dateStr) return "";
  if (typeof dateStr === 'string') {
    return dateStr.split('T')[0];
  }
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Converte string ISO ou objeto Date em string YYYY-MM-DD segura
const normalizeDataToKey = (input) => {
  if (!input) return "";
  if (typeof input === 'string') {
    return input.split('T')[0];
  }
  const d = new Date(input);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ======================
// COMPONENTES AUXILIARES
// ======================

function StatsBar({ appointments, attendances }) {
  const todayStr = formatDateKey(new Date());
  
  // Contar sessões de hoje baseadas na recorrência
  const todaySessions = appointments.filter(a => {
    if (!a.startDate) return false;
    const startStr = extractUTCDate(a.startDate);
    return startStr <= todayStr && a.dayOfWeek === new Date().getDay();
  });
  
  const presentCount = attendances.filter(a => a.status === "presente").length;
  const absentCount = attendances.filter(a => a.status === "falta").length;
  const justifiedCount = attendances.filter(a => a.status === "justificada").length;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xl font-bold text-slate-800">{appointments.length}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Pacientes</p>
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xl font-bold text-emerald-600">{presentCount}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Presenças</p>
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xl font-bold text-red-600">{absentCount}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Faltas</p>
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xl font-bold text-amber-600">{justifiedCount}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Justificadas</p>
      </div>
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xl font-bold text-slate-800">{todaySessions.length}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Hoje</p>
      </div>
    </div>
  );
}

function SessionCard({ appointment, onStatus, attendance, date }) {
  const patientName = appointment.patient?.name || "Paciente";
  const attendanceStatus = attendance?.status;
  
  const statusStyles = {
    presente: "border-emerald-500 bg-emerald-50/30",
    falta: "border-red-500 bg-red-50/30",
    justificada: "border-amber-500 bg-amber-50/30",
    default: "border-slate-200 bg-white"
  };

  const currentStyle = statusStyles[attendanceStatus] || statusStyles.default;
  
  return (
    <div className={`p-3 rounded-xl border-l-4 transition-all shadow-sm ${currentStyle} flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
          attendanceStatus === "presente" ? "bg-emerald-100 text-emerald-600" :
          attendanceStatus === "falta" ? "bg-red-100 text-red-600" :
          attendanceStatus === "justificada" ? "bg-amber-100 text-amber-600" :
          "bg-slate-100 text-slate-500"
        }`}>
          {patientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{patientName}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            {appointment.time} • {appointment.duration}min
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {attendanceStatus !== 'justificada' && (
          <>
            <button
              onClick={() => onStatus(appointment, "presente", date)}
              className="p-2 rounded-lg transition-all text-emerald-600 hover:bg-emerald-50"
              title="Presente"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => onStatus(appointment, "falta", date)}
              className="p-2 rounded-lg transition-all text-red-600 hover:bg-red-50"
              title="Falta"
            >
              <X size={16} />
            </button>
          </>
        )}
        <button
          onClick={() => onStatus(appointment, "justificada", date)}
          className={`p-2 rounded-lg transition-all ${
            attendanceStatus === "justificada" ? "bg-amber-600 text-white shadow-sm" : "text-amber-600 hover:bg-amber-50"
          }`}
          title="Justificar"
        >
          <AlertCircle size={16} />
        </button>
      </div>
    </div>
  );
}

function DayView({ date, appointments, attendances, onStatus, setJustModal, setJustData }) {
  const dayName = DAYS_OF_WEEK[date.getDay()];
  const dateStr = formatDateKey(date);
  
  // 1. Agendamentos fixos
  const dayAppointments = appointments.filter(a => {
    if (a.dayOfWeek !== date.getDay()) return false;
    if (a.startDate) {
      const startStr = extractUTCDate(a.startDate);
      return startStr <= dateStr;
    }
    return true;
  });

  // 2. Attendances extras (reagendamentos ou sessões avulsas)
  const dayExtras = attendances.filter(att => 
    extractUTCDate(att.date) === dateStr &&
    !dayAppointments.some(app => app.patientId === att.patientId)
  );

  // 3. Unir para exibição
  const allSessions = [
    ...dayAppointments.map(app => ({
      type: 'fixed',
      app,
      attendance: attendances.find(att => att.patientId === app.patientId && extractUTCDate(att.date) === dateStr)
    })),
    ...dayExtras.map(att => ({
      type: 'extra',
      app: { id: att.id, patientId: att.patientId, time: att.sessionTime || "00:00", duration: 50, patient: att.patient },
      attendance: att
    }))
  ].sort((a,b) => a.app.time.localeCompare(b.app.time));
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-700">{dayName}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(date, "d 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <span className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-full shadow-sm">
          {allSessions.length} SESSÕES
        </span>
      </div>
      <div className="p-3 space-y-3">
        {allSessions.length === 0 ? (
          <div className="py-10 text-center opacity-30">
            <Users size={24} className="mx-auto mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">Livre</p>
          </div>
        ) : (
          allSessions.map((session, idx) => (
            <SessionCard 
              key={session.app.id + idx} 
              appointment={session.app} 
              date={date}
              attendance={session.attendance}
              onStatus={onStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WeekView({ weekDays, appointments, attendances, onStatus, setJustModal, setJustData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {weekDays.map((day, idx) => (
        <DayView 
          key={idx} 
          date={day} 
          appointments={appointments} 
          attendances={attendances}
          onStatus={onStatus}
          setJustModal={setJustModal}
          setJustData={setJustData}
        />
      ))}
    </div>
  );
}

function MonthView({ currentDate, appointments, attendances, onStatus, setJustModal, setJustData }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  const todayStr = formatDateKey(new Date());
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div key={idx} className="p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {day.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = format(day, 'M') === format(monthStart, 'M');
          const dayStr = formatDateKey(day);
          const isToday = dayStr === todayStr;
          
          const dayApps = appointments.filter(a => {
            if (a.dayOfWeek !== day.getDay()) return false;
            const appStart = extractUTCDate(a.startDate);
            return dayStr >= appStart;
          });

          // 2. Extras/Reagendamentos
          const dayExtras = attendances.filter(att => 
            extractUTCDate(att.date) === dayStr &&
            !dayApps.some(app => app.patientId === att.patientId)
          );

          const allSessions = [
            ...dayApps.map(app => ({
              type: 'fixed',
              app,
              att: attendances.find(a => a.patientId === app.patientId && extractUTCDate(a.date) === dayStr)
            })),
            ...dayExtras.map(att => ({
              type: 'extra',
              app: { id: att.id, patientId: att.patientId, time: att.sessionTime || "08:00", patient: att.patient },
              att
            }))
          ].sort((a,b) => {
            const timeA = a.att?.sessionTime || a.app.time || "00:00";
            const timeB = b.att?.sessionTime || b.app.time || "00:00";
            return timeA.localeCompare(timeB);
          });
          
          return (
            <div key={idx} className={`min-h-[120px] p-2 border-r border-b border-slate-100 ${!isCurrentMonth ? 'bg-slate-50/50 opacity-40' : ''}`}>
              <div className="flex justify-end mb-1">
                <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-2 mt-1">
                {allSessions.slice(0, 3).map((session, i) => {
                  const att = session.att;
                  
                  const statusStyles = {
                    presente: "bg-emerald-100 text-emerald-700 border-emerald-300",
                    falta: "bg-red-100 text-red-700 border-red-300",
                    justificada: "bg-amber-100 text-amber-700 border-amber-300",
                    default: "bg-slate-100 text-slate-600 border-slate-200"
                  };
                  
                  const style = statusStyles[att?.status] || statusStyles.default;
                  const isReagendado = att?.status === 'justificada' && att?.notes?.includes('Reagendado');
                  const isFilho = !!att?.parentId;
                  const hasFilho = attendances.some(a => a.parentId === att?.id);
                  
                  return (
                    <div key={session.app.id + i} className="flex items-center gap-1">
                      <div className={`text-[10px] px-1.5 py-1 rounded truncate flex-1 font-bold border transition-all ${style} 
                        ${session.type === 'extra' || isFilho ? 'border-dashed border-2' : ''} 
                        ${isReagendado ? 'opacity-70 grayscale-[0.3]' : ''}
                        ${hasFilho ? 'ring-1 ring-amber-400/30' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex items-center gap-1">
                            {isFilho && !hasFilho && <Clock size={10} className="shrink-0" />}
                            {hasFilho && <Link2 size={10} className="shrink-0" />}
                            {session.app.patient?.name?.split(" ")[0]}
                          </span>
                          {isReagendado && <RefreshCcw size={10} className="ml-1 animate-spin-slow" />}
                          <span>{session.att?.sessionTime || session.app.time}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {att?.status !== 'justificada' && (
                          <>
                            <button 
                              onClick={() => onStatus(session.app, 'presente', day)} 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100" 
                              title="Presente"
                            >
                              P
                            </button>
                            <button 
                              onClick={() => onStatus(session.app, 'falta', day)} 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all bg-red-50 text-red-600 hover:bg-red-100" 
                              title="Falta"
                            >
                              F
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => onStatus(session.app, 'justificada', day)} 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                            att?.status === 'justificada' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          }`} 
                          title="Justificada"
                        >
                          J
                        </button>
                        {att?.parentId && (
                          <button 
                            onClick={() => {
                              setJustModal({ open: true, patient: session.app.patient, appointment: session.app, date: day, isEdit: true, existingAtt: att });
                              let reschedTime = "";
                              if (att?.notes?.includes("Reagendado para ")) {
                                const match = att.notes.match(/Reagendado para \d{4}-\d{2}-\d{2} às (\d{2}:\d{2})/);
                                if (match) reschedTime = match[1];
                              }
                              setJustData({ date: "", time: reschedTime, notes: att?.notes || "" });
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all"
                            title="Editar"
                          >
                            <Edit size={8} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {allSessions.length > 3 && (
                  <div className="text-[8px] font-bold text-slate-400 text-center">+{allSessions.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ currentDate, appointments, attendances, onStatus, setJustModal, setJustData }) {
  const dayStr = formatDateKey(currentDate);
  const dayOfWeek = currentDate.getDay();
  
  const dayApps = appointments.filter(a => {
    if (a.dayOfWeek !== dayOfWeek) return false;
    if (!a.startDate) return true;
    return extractUTCDate(a.startDate) <= dayStr;
  });
  
  const dayExtras = attendances.filter(att => 
    extractUTCDate(att.date) === dayStr &&
    !dayApps.some(app => app.patientId === att.patientId)
  );
  
  const allSessions = [
    ...dayApps.map(app => ({
      type: 'fixed',
      app,
      att: attendances.find(a => a.patientId === app.patientId && extractUTCDate(a.date) === dayStr)
    })),
    ...dayExtras.map(att => ({
      type: 'extra',
      app: { id: att.id, patientId: att.patientId, time: att.sessionTime || "08:00", patient: att.patient },
      att
    }))
  ].sort((a,b) => (a.att?.sessionTime || a.app.time).localeCompare(b.att?.sessionTime || b.app.time));
  
  const todayStr = formatDateKey(new Date());
  
  if (dayApps.length === 0 && dayExtras.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
        <Users size={48} className="mx-auto text-slate-200 mb-4" />
        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhuma sessão nesta data</h3>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {allSessions.map((session, i) => {
        const att = session.att;
        const statusStyles = {
          presente: "bg-emerald-100 text-emerald-700 border-emerald-300",
          falta: "bg-red-100 text-red-700 border-red-300",
          justificada: "bg-amber-100 text-amber-700 border-amber-300",
          default: "bg-slate-100 text-slate-600 border-slate-200"
        };
        const style = statusStyles[att?.status] || statusStyles.default;
        
        return (
          <div key={session.app.id + i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black ${style}`}>
                  {session.att?.sessionTime || session.app.time}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{session.app.patient?.name}</p>
                  <p className="text-xs text-slate-500">{session.app.duration}min</p>
                </div>
              </div>
              <div className="flex gap-1">
                {att?.status !== 'justificada' && (
                  <button onClick={() => onStatus(session.app, 'presente', currentDate)} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${att?.status === 'presente' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>P</button>
                )}
                {att?.parentId && (
                  <button 
                    onClick={() => {
                      if (att) {
                        setJustModal({ open: true, patient: session.app.patient, appointment: session.app, date: currentDate, isEdit: true, existingAtt: att });
                        let reschedTime = "";
                        if (att?.notes?.includes("Reagendado para ")) {
                          const match = att.notes.match(/Reagendado para \d{4}-\d{2}-\d{2} às (\d{2}:\d{2})/);
                          if (match) reschedTime = match[1];
                        }
                        setJustData({ date: "", time: reschedTime, notes: att?.notes || "" });
                      }
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-100 text-amber-600 hover:bg-amber-200 transition-all"
                    title="Editar reagendamento"
                  >
                    <Edit size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
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
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [justModal, setJustModal] = useState({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
  const [justData, setJustData] = useState({ date: "", time: "", notes: "" });
  const [descendantsInfo, setDescendantsInfo] = useState({ count: 0, list: [] });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", onConfirm: null, loading: false });

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apps, atts] = await Promise.all([
        api.getAppointments() || [],
        api.getAttendances() || []
      ]);
      setAppointments(apps);
      setAttendances(atts);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDescendants = async (attendanceId) => {
    try {
      const data = await api.getAttendanceDescendants(attendanceId);
      setDescendantsInfo({ count: data.count, list: data.descendants });
    } catch (error) {
      console.error("Erro ao buscar descendentes:", error);
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
    
    const dateStr = formatDateKey(sessionDate);
    const existingAtt = attendances.find(a => a.patientId === appointment.patientId && extractUTCDate(a.date) === dateStr);
    
    if (status === 'justificada') {
      if (existingAtt) {
        fetchDescendants(existingAtt.id);
      } else {
        setDescendantsInfo({ count: 0, list: [] });
      }

      setJustModal({ 
        open: true, 
        patient: appointment.patient, 
        appointment, 
        date: sessionDate, 
        isEdit: true,
        existingAtt 
      });
      
      let reschedDate = "";
      let reschedTime = "";
      if (existingAtt?.notes?.includes("Reagendado para ")) {
        const match = existingAtt.notes.match(/Reagendado para (\d{4}-\d{2}-\d{2})/);
        if (match) reschedDate = match[1];
        const timeMatch = existingAtt.notes.match(/Reagendado para \d{4}-\d{2}-\d{2} às (\d{2}:\d{2})/);
        if (timeMatch) reschedTime = timeMatch[1];
      } else if (existingAtt?.sessionTime) {
        reschedTime = existingAtt.sessionTime;
      }
      
      setJustData({ date: reschedDate, time: reschedTime, notes: existingAtt?.notes || "" });
      return;
    }
    
    try {
      if (existingAtt?.status === status) {
        // Se for um reagendamento automático (filho), não permitir delete
        if (existingAtt.parentId) {
          setSuccessMessage("Esta sessão faz parte de um reagendamento e não pode ser removida aqui.");
          return;
        }
        
        setConfirmModal({
          open: true,
          title: "Remover Marcação",
          message: "Deseja remover esta marcação?",
          onConfirm: async () => {
            setConfirmModal({ ...confirmModal, open: false });
            await api.deleteAttendance(existingAtt.id);
            await loadData();
          }
        });
      } else {
        const data = {
          patientId: appointment.patientId,
          date: sessionDate.toISOString(),
          status,
          sessionTime: appointment.time
        };
        await api.saveAttendance(data);
        await loadData();
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const goToRescheduledDate = (dateStr) => {
    if (!dateStr) return;
    const newDate = new Date(dateStr + 'T00:00:00');
    setCurrentDate(newDate);
    setView('month');
    setJustModal({ ...justModal, open: false });
  };

  const deleteJustification = async () => {
    if (!justModal.existingAtt) return;
    
    const count = descendantsInfo.count;
    let title = "Remover Justificativa";
    let message = "Deseja desfazer esta falta justificada? A sessão voltará a aparecer sem marcação.";
    
    if (count === 1) {
      const childDate = new Date(descendantsInfo.list[0].date);
      message = `Deseja remover esta justificativa? O reagendamento de ${format(childDate, "dd/MM")} também será cancelado e excluído permanentemente.`;
    } else if (count > 1) {
      message = `Deseja remover esta justificativa? Os ${count} reagendamentos seguintes na cadeia também serão cancelados. Esta ação não pode ser desfeita.`;
    }

    setConfirmModal({
      open: true,
      title,
      message,
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await api.deleteAttendance(justModal.existingAtt.id);
          setSuccessMessage(count > 0 ? "Cadeia de reagendamento removida!" : "Justificativa removida!");
          await loadData();
          setJustModal({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
          setConfirmModal({ open: false, title: "", message: "", onConfirm: null, loading: false });
        } catch (error) {
          alert("Erro ao remover: " + error.message);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };
  
  const saveJustificada = async () => {
    if (!justModal.appointment || !justModal.date) return;
    
    const originalDate = justModal.date;
    const newDateStr = justData.date;
    const newTimeStr = justData.time;
    const motivo = justData.notes || "Falta justificada";
    
    try {
      // Montar a nota conforme existência de reagendamento
      const notes = newDateStr 
        ? `Falta justificada. Reagendado para ${newDateStr} às ${newTimeStr || "08:00"}. Motivo: ${motivo}`
        : motivo;
      
      const sessionTime = newDateStr ? (newTimeStr || "08:00") : (justModal.appointment?.time || null);
      
      // 1. Salvar ou Atualizar o registro original (Pai)
      const originalResult = await api.saveAttendance({
        patientId: justModal.appointment.patientId,
        date: originalDate.toISOString(),
        status: 'justificada',
        notes,
        sessionTime
      });

      // 2. Se houver uma nova data, criar o registro Filho vinculado ao Pai
      if (newDateStr) {
        const dateToSave = new Date(newDateStr + 'T' + (newTimeStr || "08:00") + ':00');
        // Criar registro de reagendamento futuro (sem status até ser realizado)
        await api.saveAttendance({
          patientId: justModal.appointment.patientId,
          date: dateToSave.toISOString(),
          status: '', 
          notes: `Reagendamento da sessão de ${originalDate.toLocaleDateString('pt-BR')}. ${motivo}`,
          sessionTime: newTimeStr || "08:00",
          parentId: originalResult.id
        });
      }
      
      setSuccessMessage(newDateStr ? `Sessão reagendada para ${newDateStr}` : "Falta justificada registrada!");
      await loadData();
      setJustModal({ open: false, patient: null, appointment: null, date: null, isEdit: false, existingAtt: null });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSuccessMessage("Erro ao salvar justificativa");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const newDate = new Date(dateParam);
      setCurrentDate(newDate);
      setView('month');
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Agenda</h1>
          <p className="text-sm text-slate-500">Gestão de sessões e presenças</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { id: 'month', label: 'Mês' },
            { id: 'list', label: 'Lista' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                view === item.id ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <StatsBar appointments={appointments} attendances={attendances} />

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">
            {view === 'list' ? format(currentDate, 'EEEE, d MMMM', { locale: ptBR }) : format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setCurrentDate(view === 'list' ? addDays(currentDate, -1) : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white rounded-lg transition-all">Hoje</button>
            <button onClick={() => setCurrentDate(view === 'list' ? addDays(currentDate, 1) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="animate-fade-in h-full">
            {view === "month" && <MonthView currentDate={currentDate} appointments={appointments} attendances={attendances} onStatus={handleAttendance} setJustModal={setJustModal} setJustData={setJustData} />}
            {view === "list" && <ListView currentDate={currentDate} appointments={appointments} attendances={attendances} onStatus={handleAttendance} setJustModal={setJustModal} setJustData={setJustData} />}
          </div>
        )}
      </div>
      
      {justModal.open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setJustModal({ ...justModal, open: false })}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${justModal.isEdit ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                {justModal.isEdit ? <AlertCircle size={24} /> : <BookOpen size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {justModal.isEdit ? 'Justificar Falta' : 'Detalhes da Sessão'}
                </h2>
                <p className="text-xs font-bold text-slate-500">{justModal.patient?.name}</p>
              </div>
            </div>

            {/* Formulário de Justificativa */}
            {justModal.isEdit && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motivo da Falta</label>
                  <textarea 
                    value={justData.notes} 
                    onChange={e => setJustData({ ...justData, notes: e.target.value })} 
                    placeholder="Ex: Férias, doença, viagem..." 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all h-24 resize-none text-sm font-medium" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]} 
                      value={justData.date || ''} 
                      onChange={e => setJustData({ ...justData, date: e.target.value })} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horário</label>
                    <select 
                      value={justData.time || ''} 
                      onChange={e => setJustData({ ...justData, time: e.target.value })} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                    >
                      <option value="">--:--</option>
                      <option value="07:00">07:00</option>
                      <option value="07:30">07:30</option>
                      <option value="08:00">08:00</option>
                      <option value="08:30">08:30</option>
                      <option value="09:00">09:00</option>
                      <option value="09:30">09:30</option>
                      <option value="10:00">10:00</option>
                      <option value="10:30">10:30</option>
                      <option value="11:00">11:00</option>
                      <option value="11:30">11:30</option>
                      <option value="12:00">12:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                      <option value="18:00">18:00</option>
                      <option value="19:00">19:00</option>
                      <option value="20:00">20:00</option>
                      <option value="21:00">21:00</option>
                    </select>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-bold italic">* Deixe em branco se não houver reagendamento.</p>

                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setJustModal({ ...justModal, open: false })} 
                    className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={saveJustificada} 
                    className="flex-1 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110]" onClick={() => !confirmModal.loading && setConfirmModal({ ...confirmModal, open: false })}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight mb-3">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed font-medium mb-8">{confirmModal.message}</p>
            
            <div className="flex gap-3">
              <button 
                disabled={confirmModal.loading}
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                disabled={confirmModal.loading}
                onClick={confirmModal.onConfirm}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center"
              >
                {confirmModal.loading ? <RefreshCcw size={16} className="animate-spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-up">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 backdrop-blur-sm">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <p className="text-sm font-bold tracking-tight">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}