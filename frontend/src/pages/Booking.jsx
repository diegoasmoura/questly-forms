import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Booking() {
  const { slug } = useParams();
  const [psychologist, setPsychologist] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function loadPsychologist() {
      try {
        const data = await api.request(`/booking/${slug}`);
        setPsychologist(data.psychologist);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Profissional não encontrado");
        setLoading(false);
      }
    }
    loadPsychologist();
  }, [slug]);

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot("");
    setLoadingSlots(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const data = await api.request(`/booking/${slug}?date=${dateStr}`);
      setAvailableSlots(data.availableSlots || []);
    } catch (err) {
      setError("Erro ao carregar horários disponíveis");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !name || !email || !phone) {
      alert("Por favor, preencha todos os campos e selecione uma data e horário.");
      return;
    }

    setSubmitting(true);
    try {
      await api.request(`/booking/${slug}`, {
        method: "POST",
        body: JSON.stringify({
          patientName: name,
          patientEmail: email,
          patientPhone: phone,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedSlot
        })
      });
      setSuccess(true);
    } catch (err) {
      alert(err.message || "Erro ao realizar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  // Weeks navigation for date selection
  const baseDate = addDays(new Date(), weekOffset * 7);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(d => d >= new Date().setHours(0,0,0,0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-900 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Carregando horários de atendimento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-6">
        <div className="text-center card p-10 max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Link de Agendamento Inválido</h2>
          <p className="text-slate-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-6">
        <div className="text-center card p-10 max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100 animate-scale-in">
          <CheckCircle2 size={54} className="mx-auto text-emerald-600 mb-4 animate-bounce" />
          <h2 className="text-xl font-bold text-slate-900">Agendamento Solicitado!</h2>
          <p className="text-slate-600 mt-2 leading-relaxed">
            Sua solicitação de consulta foi enviada para o Dr(a). <strong>{psychologist.name}</strong>.
          </p>
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Resumo do Agendamento</p>
            <p className="text-sm text-slate-700 font-semibold">Data: {format(selectedDate, "dd/MM/yyyy")}</p>
            <p className="text-sm text-slate-700 font-semibold">Horário: {selectedSlot}</p>
          </div>
          <p className="text-xs text-slate-400 mt-6 font-medium">
            Em breve você receberá uma confirmação de agendamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Professional Profile */}
        <div className="md:w-1/3 bg-slate-900 p-8 text-white flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-3xl bg-brand-900 flex items-center justify-center text-white font-black text-3xl mb-4 shadow-2xl shadow-brand-900/35 border-2 border-slate-800">
            {psychologist.name.split(" ")[0].slice(0, 2).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold font-heading">{psychologist.name}</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
            Psicologia Clínica
          </p>
          <div className="mt-8 text-xs text-slate-400 space-y-2 leading-relaxed">
            <p>&bull; Sessões de 50 minutos</p>
            <p>&bull; Agendamento facilitado</p>
            <p>&bull; Segurança e privacidade</p>
          </div>
        </div>

        {/* Right Side: Step Selection & Form */}
        <div className="md:w-2/3 p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Agendar Consulta</h1>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Selecione uma data e horário</p>
            </div>

            {/* Date Selection Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Escolha o Dia</span>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={weekOffset === 0} 
                    onClick={() => setWeekOffset(prev => prev - 1)}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-opacity"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const isSelected = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleDateSelect(day)}
                      className={`py-2 px-1 flex flex-col items-center justify-center rounded-xl border text-center transition-all ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10" 
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="text-[8px] font-bold uppercase opacity-60">
                        {format(day, "eee", { locale: ptBR })}
                      </span>
                      <span className="text-sm font-black mt-1">
                        {day.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">Horários Disponíveis</span>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Buscando disponibilidade...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold italic py-2">Nenhum horário livre nesta data.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-4 rounded-xl border text-xs font-bold transition-all ${
                          selectedSlot === slot
                            ? "bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-600/10"
                            : "bg-white border-slate-200 hover:border-brand-200 hover:text-brand-600 text-slate-700"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Personal Data Form */}
            {selectedDate && selectedSlot && (
              <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-3">Seus Dados Pessoais</h3>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Seu Nome Completo"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      placeholder="Seu E-mail"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Seu Telefone / WhatsApp"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn btn-primary py-3 font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Confirmar Agendamento"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
