import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Building, Calendar, CreditCard, HelpCircle, Save, Loader2, Check, AlertCircle, Globe, ChevronDown, ChevronUp
} from "lucide-react";
import { api } from "../lib/api";

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "clinic";

  // Estados dos formulários
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [clinicData, setClinicData] = useState({
    clinicName: "",
    crp: "",
    clinicPhone: "",
    clinicAddress: "",
    therapeuticApproach: "",
  });

  const [agendaData, setAgendaData] = useState({
    sessionDuration: 50,
    sessionInterval: 10,
    workStartTime: "08:00",
    workEndTime: "20:00",
    workDays: [1, 2, 3, 4, 5],
    timezone: "America/Sao_Paulo",
    bookingSlug: "",
  });

  // Central de Ajuda - Accordion
  const [openFaq, setOpenFaq] = useState({});

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await api.getSettings();
        
        setClinicData({
          clinicName: data.clinicName || "",
          crp: data.crp || "",
          clinicPhone: data.clinicPhone || "",
          clinicAddress: data.clinicAddress || "",
          therapeuticApproach: data.therapeuticApproach || "",
        });

        // Caso workDays venha como string do banco, fazer o parse
        let parsedDays = [1, 2, 3, 4, 5];
        if (data.workDays) {
          try {
            parsedDays = typeof data.workDays === "string" 
              ? JSON.parse(data.workDays) 
              : data.workDays;
          } catch (e) {
            parsedDays = data.workDays;
          }
        }

        setAgendaData({
          sessionDuration: data.sessionDuration || 50,
          sessionInterval: data.sessionInterval || 10,
          workStartTime: data.workStartTime || "08:00",
          workEndTime: data.workEndTime || "20:00",
          workDays: parsedDays,
          timezone: data.timezone || "America/Sao_Paulo",
          bookingSlug: data.bookingSlug || "",
        });
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar as configurações.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSaveClinic = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess(false);
      await api.updateSettings(clinicData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Erro ao salvar configurações da clínica.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAgenda = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess(false);
      await api.updateSettings(agendaData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Erro ao salvar preferências de agenda.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    const current = [...agendaData.workDays];
    const index = current.indexOf(day);
    if (index > -1) {
      if (current.length > 1) {
        current.splice(index, 1);
      }
    } else {
      current.push(day);
    }
    setAgendaData({ ...agendaData, workDays: current.sort() });
  };

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
    setError("");
    setSuccess(false);
  };

  const toggleFaq = (index) => {
    setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const menuItems = [
    { id: "clinic", label: "Configurações da Clínica", icon: Building },
    { id: "agenda", label: "Preferências de Agenda", icon: Calendar },
    { id: "billing", label: "Assinatura e Cobrança", icon: CreditCard },
    { id: "help", label: "Central de Ajuda", icon: HelpCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
        <p className="text-[14px] text-[var(--text-muted)] font-medium">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Configurações Gerais</h1>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">Gerencie a identidade da sua clínica, parametrize seus horários e visualize detalhes de faturamento.</p>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Local de Navegação */}
        <div className="md:col-span-1 flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[13px] font-bold text-left transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-[var(--surface-alt)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm" 
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)]/50 border border-transparent"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-[var(--accent)]" : ""} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Painel de Conteúdo */}
        <div className="md:col-span-3 bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 md:p-8 shadow-card relative overflow-hidden">
          
          {/* Feedbacks */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[14px] flex items-center gap-3 text-[13px] font-semibold">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-[14px] flex items-center gap-3 text-[13px] font-semibold animate-scale-in">
              <Check size={18} />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}

          {/* ABA 1: CONFIGURAÇÕES DA CLÍNICA */}
          {activeTab === "clinic" && (
            <form onSubmit={handleSaveClinic} className="flex flex-col gap-6">
              <div>
                <h2 className="text-[16px] font-bold text-[var(--text-primary)] mb-1">Identidade Clínica</h2>
                <p className="text-[12px] text-[var(--text-muted)]">Esses dados serão utilizados no cabeçalho das suas fichas de prontuário, receitas e anamneses.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Nome da Clínica ou Consultório</label>
                  <input
                    type="text"
                    value={clinicData.clinicName}
                    onChange={(e) => setClinicData({ ...clinicData, clinicName: e.target.value })}
                    placeholder="Ex: Consultório de Psicologia Florescer"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Registro Profissional (CRP)</label>
                  <input
                    type="text"
                    value={clinicData.crp}
                    onChange={(e) => setClinicData({ ...clinicData, crp: e.target.value })}
                    placeholder="Ex: CRP 06/12345"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Telefone Comercial</label>
                  <input
                    type="text"
                    value={clinicData.clinicPhone}
                    onChange={(e) => setClinicData({ ...clinicData, clinicPhone: e.target.value })}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Abordagem Principal</label>
                  <select
                    value={clinicData.therapeuticApproach}
                    onChange={(e) => setClinicData({ ...clinicData, therapeuticApproach: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium cursor-pointer"
                  >
                    <option value="">Selecione uma abordagem</option>
                    <option value="TCC">Terapia Cognitivo-Comportamental (TCC)</option>
                    <option value="Psicanalise">Psicanálise</option>
                    <option value="Gestalt">Gestalt-terapia</option>
                    <option value="Humanista">Abordagem Centrada na Pessoa (Humanista)</option>
                    <option value="Comportamental">Análise do Comportamento (Behaviorismo)</option>
                    <option value="Sistemica">Terapia Sistêmica</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Endereço Comercial / Consultório Físico</label>
                  <input
                    type="text"
                    value={clinicData.clinicAddress}
                    onChange={(e) => setClinicData({ ...clinicData, clinicAddress: e.target.value })}
                    placeholder="Rua, Número, Sala/Conjunto, Bairro, Cidade - UF"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-bold rounded-[12px] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          )}

          {/* ABA 2: PREFERÊNCIAS DE AGENDA */}
          {activeTab === "agenda" && (
            <form onSubmit={handleSaveAgenda} className="flex flex-col gap-6">
              <div>
                <h2 className="text-[16px] font-bold text-[var(--text-primary)] mb-1">Preferências de Agenda</h2>
                <p className="text-[12px] text-[var(--text-muted)]">Configure os tempos de sessão padrão, intervalos e limites de horário de funcionamento.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Duração Padrão da Sessão (minutos)</label>
                  <input
                    type="number"
                    value={agendaData.sessionDuration}
                    onChange={(e) => setAgendaData({ ...agendaData, sessionDuration: parseInt(e.target.value, 10) || 50 })}
                    min="15"
                    max="180"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Intervalo de Descanso entre Sessões (minutos)</label>
                  <input
                    type="number"
                    value={agendaData.sessionInterval}
                    onChange={(e) => setAgendaData({ ...agendaData, sessionInterval: parseInt(e.target.value, 10) || 0 })}
                    min="0"
                    max="120"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Início do Turno</label>
                  <input
                    type="text"
                    value={agendaData.workStartTime}
                    onChange={(e) => setAgendaData({ ...agendaData, workStartTime: e.target.value })}
                    placeholder="08:00"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Fim do Turno</label>
                  <input
                    type="text"
                    value={agendaData.workEndTime}
                    onChange={(e) => setAgendaData({ ...agendaData, workEndTime: e.target.value })}
                    placeholder="20:00"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Fuso Horário</label>
                  <select
                    value={agendaData.timezone}
                    onChange={(e) => setAgendaData({ ...agendaData, timezone: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium cursor-pointer"
                  >
                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                    <option value="America/Manaus">Manaus (GMT-4)</option>
                    <option value="America/Recife">Nordeste (GMT-3)</option>
                    <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Slug de Agendamento Público</label>
                  <div className="flex items-center">
                    <span className="bg-[var(--border)] text-[var(--text-muted)] text-[12px] px-3 py-2.5 rounded-l-[12px] border border-r-0 border-[var(--border)] font-semibold select-none">/booking/</span>
                    <input
                      type="text"
                      disabled
                      value={agendaData.bookingSlug || "Configurar na página pública"}
                      className="w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-r-[12px] px-3.5 py-2.5 text-[13px] text-[var(--text-muted)] focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-[var(--text-secondary)]">Dias de Atendimento</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { val: 0, label: "Dom" },
                      { val: 1, label: "Seg" },
                      { val: 2, label: "Ter" },
                      { val: 3, label: "Qua" },
                      { val: 4, label: "Qui" },
                      { val: 5, label: "Sex" },
                      { val: 6, label: "Sáb" }
                    ].map((d) => {
                      const isSelected = agendaData.workDays.includes(d.val);
                      return (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => toggleDay(d.val)}
                          className={`px-3 py-2 rounded-[10px] text-[12px] font-bold border transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm" 
                              : "bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-bold rounded-[12px] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Salvando..." : "Salvar Preferências"}
                </button>
              </div>
            </form>
          )}

          {/* ABA 3: ASSINATURA E COBRANÇA */}
          {activeTab === "billing" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h2 className="text-[16px] font-bold text-[var(--text-primary)] mb-1">Assinatura & Cobrança</h2>
                <p className="text-[12px] text-[var(--text-muted)]">Monitore os limites da sua assinatura e gerencie seus pagamentos.</p>
              </div>

              {/* Status do Plano */}
              <div className="p-6 bg-gradient-to-br from-[#5CBF9D]/10 via-[#F8A26B]/5 to-transparent border border-[var(--border)] rounded-[20px] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10 relative">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-1 rounded-[6px] uppercase">Plano Atual</span>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mt-2">QuestlyForms Premium</h3>
                    <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Assinatura ativa renovando em 30 de Julho de 2026</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-semibold text-[var(--text-muted)]">R$</span>
                    <span className="text-2xl font-extrabold text-[var(--text-primary)]">89,90</span>
                    <span className="text-[12px] text-[var(--text-muted)]">/mês</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)]/50">
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)] font-semibold">Método de Cobrança</p>
                    <p className="text-[13px] font-bold text-[var(--text-primary)] mt-1">Cartão de Crédito</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)] font-semibold">Pacientes Ativos</p>
                    <p className="text-[13px] font-bold text-[var(--text-primary)] mt-1">Ilimitado</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)] font-semibold">Armazenamento Usado</p>
                    <p className="text-[13px] font-bold text-[var(--text-primary)] mt-1">1.2 GB / 10 GB</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)] font-semibold">Status do Faturamento</p>
                    <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Regularizado
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações da Licença */}
              <div className="p-4 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[16px] flex items-start gap-3">
                <Globe size={18} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[12px] font-bold text-[var(--text-primary)]">Gestão Avançada Integrada</h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                    Sua assinatura inclui faturamento automatizado via Pix, emissão de recibos em lote, templates de prontuário eletrônico em conformidade com a CFP, LGPD Audit Trail e notificações de agendamento por WhatsApp integradas.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border)] gap-3">
                <button
                  type="button"
                  disabled
                  className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-bold rounded-[12px] opacity-60 cursor-not-allowed"
                >
                  Histórico de Faturas
                </button>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2.5 bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-primary)] text-[13px] font-bold rounded-[12px] relative cursor-not-allowed"
                >
                  Alterar Plano
                  <span className="absolute -top-2 -right-2 bg-indigo-500 text-[9px] text-white font-extrabold px-1.5 py-0.5 rounded-[6px] scale-90 tracking-wide uppercase">Breve</span>
                </button>
              </div>
            </div>
          )}

          {/* ABA 4: CENTRAL DE AJUDA */}
          {activeTab === "help" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h2 className="text-[16px] font-bold text-[var(--text-primary)] mb-1">Central de Ajuda</h2>
                <p className="text-[12px] text-[var(--text-muted)]">Perguntas frequentes e suporte direto para uso da plataforma QuestlyForms.</p>
              </div>

              {/* Lista FAQ Accordion */}
              <div className="flex flex-col gap-3">
                {[
                  {
                    q: "Como funciona a criptografia de dados sensíveis de prontuário?",
                    a: "Todas as anotações clínicas e prontuários de pacientes, além do CPF, são criptografados a nível de banco de dados (no repouso) utilizando chaves únicas e o algoritmo simétrico AES-256-GCM. Isso garante que nenhum funcionário do banco de dados ou invasor possa ler as anotações do psicólogo, mantendo total conformidade com a LGPD e o CFP."
                  },
                  {
                    q: "Como o sistema garante o atendimento à LGPD (Lei Geral de Proteção de Dados)?",
                    a: "A plataforma inclui duas camadas principais de proteção: (1) O registro de consentimento LGPD explícito obrigatório no cadastro de todo novo paciente e (2) A trilha de auditoria clínica (Audit Trail) que registra a data, hora, endereço de IP e tipo de operação sempre que um prontuário eletrônico sensível é visualizado, criado, atualizado ou excluído."
                  },
                  {
                    q: "Como configurar lembretes automáticos de agendamento por WhatsApp?",
                    a: "Navegue até a página de Pacientes ou Agenda, escolha a consulta desejada e utilize a opção de lembretes. A plataforma realiza o disparo automático contendo data, hora e link para facilitação da confirmação pelo paciente, reduzindo em até 85% as faltas não justificadas."
                  },
                  {
                    q: "É possível exportar os prontuários dos pacientes caso eu precise cancelar?",
                    a: "Sim. A portabilidade e a integridade de dados são direitos garantidos. Você pode exportar o prontuário clínico individual de qualquer paciente em formato PDF estruturado para envio às autoridades de saúde ou conselho regional, ou exportar em Excel para tabulações estatísticas no painel de pacientes."
                  },
                  {
                    q: "Como configurar horários de colisão na agenda?",
                    a: "Nossa agenda conta com um motor de colisões inteligente. Ao criar ou alterar um agendamento individual ou recorrente, o sistema verifica se há conflito de horários (janela mínima de 50 minutos) com qualquer outro paciente ou compromisso do mesmo psicólogo na clínica, bloqueando agendamentos duplicados em tempo real."
                  }
                ].map((faq, i) => {
                  const isOpen = !!openFaq[i];
                  return (
                    <div 
                      key={i} 
                      className="border border-[var(--border)] rounded-[14px] overflow-hidden transition-all duration-200 bg-[var(--surface-alt)]/20"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(i)}
                        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-bold text-[13px] text-[var(--text-primary)] hover:bg-[var(--surface-alt)]/50 transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? <ChevronUp size={16} className="text-[var(--accent)]" /> : <ChevronDown size={16} />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-[12px] text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)]/30 font-medium">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Informações Extras de Suporte */}
              <div className="p-5 border border-[var(--border)] rounded-[20px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 bg-[var(--surface)]">
                <div>
                  <h4 className="text-[13px] font-bold text-[var(--text-primary)]">Ainda com dúvidas?</h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Nosso suporte responde em até 2 horas em dias úteis.</p>
                </div>
                <a 
                  href="mailto:suporte@questlyforms.com.br"
                  className="px-4 py-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white text-[12px] font-bold rounded-[10px] transition-all text-center"
                >
                  Falar com Suporte
                </a>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
