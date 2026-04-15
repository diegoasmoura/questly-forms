import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronRight,
  UserPlus,
  ArrowLeft,
  Trash2,
  Pencil,
  LayoutDashboard,
  LogOut,
  Eye,
  X,
  LayoutGrid,
  List
} from "lucide-react";

export default function Patients() {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [newPatient, setNewPatient] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    cpf: "",
    rg: "",
    gender: "",
    maritalStatus: "",
    profession: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    emergencyName: "",
    emergencyPhone: "",
    notes: ""
  });

  useEffect(() => {
    loadPatients();
    if (location.state?.openAddModal) {
      setShowAddModal(true);
    }
  }, [location.state]);

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleCepLookup = async (cep) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setNewPatient(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error("CEP lookup failed:", error);
      }
    }
  };

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      console.log("Enviando dados:", newPatient);
      await api.createPatient(newPatient);
      setShowAddModal(false);
      setNewPatient({
        name: "", email: "", phone: "", birthDate: "",
        cpf: "", rg: "", gender: "", maritalStatus: "",
        profession: "", cep: "", street: "", number: "",
        complement: "", neighborhood: "", city: "", state: "",
        emergencyName: "", emergencyPhone: "", notes: ""
      });
      loadPatients();
    } catch (error) {
      console.error("Erro detalhado:", error);
      // Alerta de Debug para o usuário
      alert(`ERRO AO SALVAR:\n\nStatus: ${error.status}\nMensagem: ${error.message}\nDetalhes: ${JSON.stringify(error.details || error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este paciente? Todo o histórico será perdido.")) return;
    try {
      await api.deletePatient(id);
      setPatients(patients.filter(p => p.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.cpf?.includes(searchQuery)
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-950">Pacientes</h1>
          <p className="text-brand-500 mt-2">Gerencie seus pacientes e seus históricos clínicos.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary px-6">
          <UserPlus size={18} />
          Cadastrar Paciente
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            className="input pl-10 bg-white border-brand-100 focus:border-brand-950"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-brand-100">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-brand-950 text-white" : "text-brand-400 hover:text-brand-700 hover:bg-brand-50"}`}
            title="Visualização em cards"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-brand-950 text-white" : "text-brand-400 hover:text-brand-700 hover:bg-brand-50"}`}
            title="Visualização em lista"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-100" />
                <div className="flex-1">
                  <div className="h-4 bg-brand-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-brand-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-brand-50 rounded w-full" />
                <div className="h-3 bg-brand-50 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="card p-20 text-center border-dashed border-2">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-brand-200" />
          </div>
          <h3 className="text-xl font-semibold text-brand-950 mb-2">
            {searchQuery ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
          </h3>
          <p className="text-brand-500 mb-8 max-w-sm mx-auto">
            {searchQuery ? "Tente um termo de busca diferente" : "Comece cadastrando seu primeiro paciente para acompanhar sua evolução clínica."}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <UserPlus size={18} />
              Cadastrar Paciente
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onDelete={handleDeletePatient}
              onEdit={() => setEditPatient(patient)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <PatientListRow
              key={patient.id}
              patient={patient}
              onDelete={handleDeletePatient}
              onEdit={() => setEditPatient(patient)}
            />
          ))}
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
          <div className="card w-full max-w-3xl p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8 bg-white pb-4 border-b border-brand-50">
              <div>
                <h2 className="text-2xl font-bold text-brand-950">Novo Cadastro de Paciente</h2>
                <p className="text-sm text-brand-500 mt-1">Preencha os dados clínicos para o prontuário.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-brand-50 text-brand-400 hover:text-brand-950 transition-all">
                <Plus size={28} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-8">
              {/* Section: Identificação */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Identificação do Paciente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={newPatient.name}
                      onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                      placeholder="Nome social ou completo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">CPF</label>
                    <input
                      type="text"
                      className="input"
                      value={newPatient.cpf}
                      onChange={e => setNewPatient({ ...newPatient, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">RG</label>
                    <input
                      type="text"
                      className="input"
                      value={newPatient.rg}
                      onChange={e => setNewPatient({ ...newPatient, rg: e.target.value })}
                      placeholder="Órgão Emissor"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Data de Nascimento</label>
                    <input
                      type="date"
                      className="input"
                      value={newPatient.birthDate}
                      onChange={e => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Gênero / Identidade</label>
                    <select
                      className="input"
                      value={newPatient.gender}
                      onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                    >
                      <option value="">Selecionar...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Não-Binário">Não-Binário</option>
                      <option value="Outro">Outro / Prefiro não dizer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Estado Civil</label>
                    <select
                      className="input"
                      value={newPatient.maritalStatus}
                      onChange={e => setNewPatient({ ...newPatient, maritalStatus: e.target.value })}
                    >
                      <option value="">Selecionar...</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="União Estável">União Estável</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Profissão / Ocupação</label>
                    <input
                      type="text"
                      className="input"
                      value={newPatient.profession}
                      onChange={e => setNewPatient({ ...newPatient, profession: e.target.value })}
                      placeholder="Cargo ou área"
                    />
                  </div>
                </div>
              </section>

              {/* Section: Contato */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">E-mail</label>
                    <input
                      type="email"
                      className="input"
                      value={newPatient.email}
                      onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Telefone / WhatsApp</label>
                    <input
                      type="tel"
                      className="input"
                      value={newPatient.phone}
                      onChange={e => setNewPatient({ ...newPatient, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>
              </section>

              {/* Section: Endereço */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Localização / Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">CEP</label>
                    <input
                      type="text"
                      className="input"
                      value={newPatient.cep}
                      onChange={e => {
                        setNewPatient({ ...newPatient, cep: e.target.value });
                        handleCepLookup(e.target.value);
                      }}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Logradouro (Rua/Av)</label>
                    <input
                      type="text"
                      className="input"
                      value={newPatient.street}
                      onChange={e => setNewPatient({ ...newPatient, street: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Número</label>
                    <input
                      type="text"
                      className="input"
                      value={newPatient.number}
                      onChange={e => setNewPatient({ ...newPatient, number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Bairro</label>
                    <input
                      type="text"
                      className="input"
                      value={newPatient.neighborhood}
                      onChange={e => setNewPatient({ ...newPatient, neighborhood: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Cidade / UF</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={newPatient.city}
                        onChange={e => setNewPatient({ ...newPatient, city: e.target.value })}
                      />
                      <input
                        type="text"
                        className="input w-16"
                        value={newPatient.state}
                        onChange={e => setNewPatient({ ...newPatient, state: e.target.value })}
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Emergência */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Contato de Emergência
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Nome do Contato</label>
                    <input
                      type="text"
                      className="input"
                      value={newPatient.emergencyName}
                      onChange={e => setNewPatient({ ...newPatient, emergencyName: e.target.value })}
                      placeholder="Parente, amigo, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Telefone de Emergência</label>
                    <input
                      type="tel"
                      className="input"
                      value={newPatient.emergencyPhone}
                      onChange={e => setNewPatient({ ...newPatient, emergencyPhone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
                  Observações Gerais
                </h3>
                <textarea
                  className="input min-h-[120px] py-4"
                  value={newPatient.notes}
                  onChange={e => setNewPatient({ ...newPatient, notes: e.target.value })}
                  placeholder="Informações relevantes para o início do acompanhamento..."
                />
              </section>

              <div className="flex gap-4 pt-8 bg-white pb-4 border-t border-brand-50">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary flex-1 py-4 font-bold">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn btn-primary flex-1 py-4 font-bold shadow-xl shadow-brand-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </div>
                  ) : (
                    "Cadastrar Paciente"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editPatient && (
        <EditPatientModal
          patient={editPatient}
          onClose={() => setEditPatient(null)}
          onSave={() => {
            setEditPatient(null);
            loadPatients();
          }}
        />
      )}
    </div>
  );
}

function EditPatientModal({ patient, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: patient.name || "",
    email: patient.email || "",
    phone: patient.phone || "",
    birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : "",
    cpf: patient.cpf || "",
    rg: patient.rg || "",
    gender: patient.gender || "",
    maritalStatus: patient.maritalStatus || "",
    profession: patient.profession || "",
    cep: patient.cep || "",
    street: patient.street || "",
    number: patient.number || "",
    complement: patient.complement || "",
    neighborhood: patient.neighborhood || "",
    city: patient.city || "",
    state: patient.state || "",
    emergencyName: patient.emergencyName || "",
    emergencyPhone: patient.emergencyPhone || "",
    notes: patient.notes || ""
  });
  const [saving, setSaving] = useState(false);

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePatient(patient.id, formData);
      onSave();
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
      <div className="card w-full max-w-3xl p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8 bg-white pb-4 border-b border-brand-50">
          <div>
            <h2 className="text-2xl font-bold text-brand-950">Editar Cadastro de Paciente</h2>
            <p className="text-sm text-brand-500 mt-1">Atualize os dados clínicos do prontuário.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-50 text-brand-400 hover:text-brand-950 transition-all">
            <Plus size={28} className="rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section: Identificação */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
              Identificação do Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Nome Completo *</label>
                <input type="text" required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome social ou completo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">CPF</label>
                <input type="text" className="input" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">RG</label>
                <input type="text" className="input" value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} placeholder="Órgão Emissor" />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Data de Nascimento</label>
                <input type="date" className="input" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Gênero / Identidade</label>
                <select className="input" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="">Selecionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Não-Binário">Não-Binário</option>
                  <option value="Outro">Outro / Prefiro não dizer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Estado Civil</label>
                <select className="input" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                  <option value="">Selecionar...</option>
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="União Estável">União Estável</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Profissão / Ocupação</label>
                <input type="text" className="input" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} placeholder="Cargo ou área" />
              </div>
            </div>
          </section>

          {/* Section: Contato */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
              Informações de Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">E-mail</label>
                <input type="email" className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Telefone / WhatsApp</label>
                <input type="tel" className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
              </div>
            </div>
          </section>

          {/* Section: Endereço */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
              Localização / Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">CEP</label>
                <input type="text" className="input" value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} placeholder="00000-000" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Logradouro (Rua/Av)</label>
                <input type="text" className="input" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Número</label>
                <input type="text" className="input" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Bairro</label>
                <input type="text" className="input" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Cidade / UF</label>
                <div className="flex gap-2">
                  <input type="text" className="input flex-1" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                  <input type="text" className="input w-16" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} maxLength={2} />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Emergência */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
              Contato de Emergência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Nome do Contato</label>
                <input type="text" className="input" value={formData.emergencyName} onChange={e => setFormData({ ...formData, emergencyName: e.target.value })} placeholder="Parente, amigo, etc." />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest mb-2">Telefone de Emergência</label>
                <input type="tel" className="input" value={formData.emergencyPhone} onChange={e => setFormData({ ...formData, emergencyPhone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
              </div>
            </div>
          </section>

          {/* Section: Observações */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-950" />
              Observações Gerais
            </h3>
            <textarea
              className="input min-h-[120px] py-4"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações relevantes para o acompanhamento..."
            />
          </section>

          <div className="flex gap-4 pt-8 bg-white pb-4 border-t border-brand-50">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 py-4 font-bold">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1 py-4 font-bold shadow-xl shadow-brand-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientCard({ patient, onDelete, onEdit }) {
  const responseCount = patient._count?.responses || 0;
  const shareLinkCount = patient._count?.shareLinks || 0;

  return (
    <div className="card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full bg-white overflow-hidden border-brand-100/50">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="relative">
            <button
              onClick={() => onDelete(patient.id)}
              className="p-2 rounded-xl text-brand-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Excluir"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <Link to={`/patients/${patient.id}`} className="block mb-2 group/title" title={patient.name}>
          <h3 className="text-xl font-bold text-brand-950 group-hover:text-brand-800 transition-colors truncate">
            {patient.name}
          </h3>
          {patient.birthDate && (
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-1">
              {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
            </p>
          )}
        </Link>

        <div className="mt-6 space-y-2 text-xs text-brand-500">
          {patient.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} className="shrink-0 text-brand-300" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
          {patient.phone && (
            <div className="flex items-center gap-2">
              <Phone size={12} className="shrink-0 text-brand-300" />
              <span>{patient.phone}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-brand-50">
          <div className="flex flex-col">
            <span className="text-lg font-black text-brand-950 leading-none">{responseCount}</span>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-1">Respostas</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-brand-950 leading-none">{shareLinkCount}</span>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-1">Links</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-brand-50/50 border-t border-brand-50 flex items-center justify-between gap-2">
        <Link
          to={`/patients/${patient.id}`}
          className="btn btn-secondary text-xs flex-1"
        >
          <FileText size={14} />
          Prontuário
        </Link>
        <button
          onClick={() => onEdit(patient)}
          className="btn btn-secondary text-xs flex-1"
        >
          <Pencil size={14} />
          Editar
        </button>
      </div>
    </div>
  );
}

function PatientListRow({ patient, onDelete, onEdit }) {
  const responseCount = patient._count?.responses || 0;
  const shareLinkCount = patient._count?.shareLinks || 0;

  return (
    <div className="card p-4 flex items-center gap-4 hover:border-brand-200 transition-all">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg shrink-0">
        {patient.name.charAt(0).toUpperCase()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-bold text-brand-950 truncate">{patient.name}</h4>
          {patient.birthDate && (
            <span className="text-xs text-brand-400">
              ({(() => {
                const today = new Date();
                const birth = new Date(patient.birthDate);
                let age = today.getFullYear() - birth.getFullYear();
                const monthDiff = today.getMonth() - birth.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                  age--;
                }
                return `${age} anos`;
              })()})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {patient.email && (
            <div className="flex items-center gap-1 text-xs text-brand-500">
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
          {patient.phone && (
            <div className="flex items-center gap-1 text-xs text-brand-500">
              <Phone size={12} className="shrink-0" />
              <span>{patient.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-brand-950">{responseCount}</span>
          <span className="text-[10px] font-bold text-brand-400 uppercase">Respostas</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-brand-950">{shareLinkCount}</span>
          <span className="text-[10px] font-bold text-brand-400 uppercase">Links</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to={`/patients/${patient.id}`} className="btn btn-secondary py-2 px-3 text-xs">
          <FileText size={14} />
        </Link>
        <button onClick={() => onEdit(patient)} className="btn btn-secondary py-2 px-3 text-xs">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(patient.id)} className="btn btn-secondary py-2 px-3 text-xs text-red-500 hover:text-red-700">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
