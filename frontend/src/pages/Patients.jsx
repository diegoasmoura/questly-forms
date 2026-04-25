import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { api } from "../lib/api";
import { formatCPF, formatPhone, formatCEP } from "../lib/utils";
import { generateExcelTemplate } from "../lib/excel";
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
  List,
  UserCheck,
  UserX,
  MapPin,
  Contact,
  Settings,
  Check,
  File,
Paperclip,
  Download,
  Trash,
  AlertTriangle,
  Clock,
  CakeSlice,
  PartyPopper,
  ChevronDown,
  Upload,
  FileSpreadsheet
} from "lucide-react";

export default function Patients() {
  const navigate = useNavigateWithTransition();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("patients-view") || "grid");

  const handleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("patients-view", mode);
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedPatients, setImportedPatients] = useState([]);
  const [showRegistrationDropdown, setShowRegistrationDropdown] = useState(false);
  const [showEmptyRegistrationDropdown, setShowEmptyRegistrationDropdown] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [importStep, setImportStep] = useState('idle');
  const [importErrors, setImportErrors] = useState([]);
  const [importResults, setImportResults] = useState([]);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStep('parsing');
    setImportErrors([]);
    
    try {
      const { read, utils } = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = read(data, { type: 'array' });
      const ws = wb.Sheets['Pacientes'] || wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        setImportStep('idle');
        return;
      }
      
      const json = utils.sheet_to_json(ws);
      if (json.length === 0) {
        setImportStep('empty');
        return;
      }
      
      const parsed = json.map(row => {
        let birthDate = row['Data de Nascimento']?.toString().trim() || '';
        
        if (birthDate) {
          const num = parseInt(birthDate);
          if (!isNaN(num) && num > 0) {
            const date = new Date((num - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) {
              birthDate = date.toISOString().split('T')[0];
            }
          } else {
            const match = birthDate.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
            if (match) {
              const [, d, m, y] = match;
              const year = y.length === 2 ? (parseInt(y) > 50 ? '19' + y : '20' + y) : y;
              birthDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
          }
        }
        
        return {
          name: row['Nome']?.toString().trim() || '',
          cpf: row['CPF']?.toString().trim() || '',
          birthDate,
          email: row['E-mail']?.toString().trim() || '',
          phone: row['Telefone']?.toString().trim() || '',
          emergencyName: row['Nome Emergência']?.toString().trim() || '',
          emergencyPhone: row['Telefone Emergência']?.toString().trim() || '',
          rg: row['RG']?.toString().trim() || '',
          gender: row['Gênero']?.toString().trim() || '',
          maritalStatus: row['Estado Civil']?.toString().trim() || '',
          profession: row['Profissão']?.toString().trim() || '',
        };
      });
      
      const errors = [];
      parsed.forEach((p, i) => {
        const n = i + 2;
        if (!p.name) errors.push(' Linha ' + n + ': Nome obrigatorio');
        if (!p.cpf) errors.push(' Linha ' + n + ': CPF obrigatorio');
        else if (p.cpf.replace(/\D/g,'').length !== 11) errors.push(' Linha ' + n + ': CPF invalido');
        if (!p.birthDate) errors.push(' Linha ' + n + ': Data obrigatoria');
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate)) errors.push(' Linha ' + n + ': Data invalida (use DD-MM-YYYY)');
        if (!p.email) errors.push(' Linha ' + n + ': E-mail obrigatorio');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors.push(' Linha ' + n + ': E-mail invalido');
        if (!p.phone) errors.push(' Linha ' + n + ': Telefone obrigatorio');
        if (!p.emergencyName) errors.push(' Linha ' + n + ': Nome emergencia obrigatorio');
        if (!p.emergencyPhone) errors.push(' Linha ' + n + ': Telefone emergencia obrigatorio');
      });
      
      setImportedPatients(parsed);
      setImportErrors(errors);
      setImportStep('preview');
    } catch (err) {
      alert('Erro: ' + err.message);
      setImportStep('idle');
    }
    
    e.target.value = '';
  };

  const handleImportPatients = async () => {
    if (importErrors.length > 0) return;
    setImportStep('importing');
    setImportProgress(0);
    setImportResults([]);
    
    let success = 0;
    const total = importedPatients.length;
    
    for (const p of importedPatients) {
      try {
        await api.createPatient(p);
        success++;
      } catch (err) {
        setImportResults(prev => [...prev, 'Erro: ' + p.name + ' (' + (err.message || 'ja cadastrado') + ')']);
      }
      setImportProgress(Math.round(((success + importResults.length) / total) * 100));
    }
    
    if (importResults.length > 0) {
      setImportStep('preview');
      setSuccessMessage(success + ' importado(s)!');
    } else {
      loadPatients();
      setImportStep('done');
      setSuccessMessage(success + ' paciente(s) importado(s)!');
    }
  };

const resetImportModal = () => {
    setShowImportModal(false);
    setImportedPatients([]);
    setImportStep('idle');
    setImportErrors([]);
    setImportResults([]);
    setImportProgress(0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRegistrationDropdown && !event.target.closest('.registration-dropdown')) {
        setShowRegistrationDropdown(false);
      }
      if (showEmptyRegistrationDropdown && !event.target.closest('.empty-registration-dropdown')) {
        setShowEmptyRegistrationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRegistrationDropdown, showEmptyRegistrationDropdown]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const openAddModal = () => {
    setErrorMessage("");
    setShowAddModal(true);
  };

  const [addFormTab, setAddFormTab] = useState("identity");
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
    notes: "",
    isActive: true,
    sessionTime: "",
    sessionDuration: "50",
    sessionFrequency: "semanal",
    nextSession: ""
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPatients();
    if (location.state?.openAddModal) {
      openAddModal();
    }
  }, [location.state]);

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
    
    // Manual validation to guide user to the right tab
    if (!newPatient.name || !newPatient.cpf || !newPatient.birthDate) {
      setAddFormTab("identity");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Identificação.");
      return;
    }
    
    if (!newPatient.email || !newPatient.phone || !newPatient.emergencyPhone || !newPatient.emergencyName) {
      setAddFormTab("contact");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Contato.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const patient = await api.createPatient(newPatient);
      
      // Upload attachments after patient is created
      if (attachments.length > 0) {
        for (const att of attachments) {
          if (att.file) {
            try {
              await api.uploadAttachment(patient.id, att.file);
            } catch (uploadError) {
              console.error("Erro ao fazer upload do anexo:", uploadError);
            }
          }
        }
      }
      
      setShowAddModal(false);
      setNewPatient({
        name: "", email: "", phone: "", birthDate: "",
        cpf: "", rg: "", gender: "", maritalStatus: "",
        profession: "", cep: "", street: "", number: "",
        complement: "", neighborhood: "", city: "", state: "",
        emergencyName: "", emergencyPhone: "", notes: "",
        isActive: true,
        sessionTime: "",
        sessionDuration: "50",
        sessionFrequency: "semanal",
        nextSession: ""
      });
      setAttachments([]);
      setAddFormTab("identity");
      loadPatients();
      
      navigate(`/patients/${patient.id}`);
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
      setErrorMessage(error.message || "Erro ao salvar paciente");
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
    <div className="p-6 h-full flex flex-col overflow-hidden animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Pacientes</h1>
          <p className="text-sm text-slate-500">Gerencie seus pacientes e seus históricos clínicos.</p>
        </div>
        
        <div className="relative registration-dropdown">
          <button 
            onClick={() => setShowRegistrationDropdown(!showRegistrationDropdown)} 
            className="btn btn-primary px-4 flex items-center gap-2"
          >
            <Plus size={18} />
            Cadastrar
            <ChevronDown size={14} className={`transition-transform duration-200 ${showRegistrationDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showRegistrationDropdown && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[60] animate-scale-in">
              <button
                onClick={() => {
                  openAddModal();
                  setShowRegistrationDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <p className="font-bold">Cadastrar paciente</p>
                  <p className="text-[10px] text-slate-500">Manual, um por um</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowImportModal(true);
                  setShowRegistrationDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <p className="font-bold">Importar dados</p>
                  <p className="text-[10px] text-slate-500">Planilha Excel</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => handleViewMode("grid")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
          >
            <LayoutGrid size={18} />
            <span className="text-xs font-bold">Cards</span>
          </button>
          <button
            onClick={() => handleViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
          >
            <List size={18} />
            <span className="text-xs font-bold">Lista</span>
          </button>
        </div>
      </div>

      {/* patients List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="card p-20 text-center border-dashed border-2 border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {searchQuery ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            </h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              {searchQuery ? "Tente um termo de busca diferente" : "Comece cadastrando seu primeiro paciente para acompanhar sua evolução clínica."}
            </p>
            {!searchQuery && (
              <div className="relative empty-registration-dropdown">
                <button onClick={() => setShowEmptyRegistrationDropdown(!showEmptyRegistrationDropdown)} className="btn btn-primary">
                  <UserPlus size={18} />
                  Cadastrar Paciente
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showEmptyRegistrationDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showEmptyRegistrationDropdown && (
<div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[60] animate-scale-in">
                    <button
                      onClick={() => {
                        openAddModal();
                        setShowEmptyRegistrationDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <UserPlus size={18} />
                      </div>
                      <div>
                        <p className="font-bold">Cadastrar paciente</p>
                        <p className="text-[10px] text-slate-500">Manual, um por um</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowImportModal(true);
                        setShowEmptyRegistrationDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileSpreadsheet size={18} />
                      </div>
                      <div>
                        <p className="font-bold">Importar pacientes</p>
                        <p className="text-[10px] text-slate-500">Via planilha Excel</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-6 pb-10 overflow-visible">
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
          <div className="space-y-4 pt-6 pb-10 overflow-visible">
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
        </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="card w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-emerald-600">Importar Dados</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {importStep === 'idle' && 'Baixe o modelo, preencha e envie'}
                    {importStep === 'parsing' && 'Lendo arquivo...'}
                    {importStep === 'empty' && 'Nenhum dado encontrado'}
                    {importStep === 'preview' && importedPatients.length + ' paciente(s) encontrado(s)'}
                    {importStep === 'importing' && 'Importando... ' + importProgress + '%'}
                    {importStep === 'done' && 'Concluido'}
                  </p>
                </div>
                <button onClick={resetImportModal} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              {importStep === 'importing' && (
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: importProgress + '%' }} />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {importStep === 'idle' && (
                <>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">1</div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Baixe o modelo</h3>
                        <p className="text-xs text-slate-500 mb-3">Use a planilha padrao.</p>
                        <button onClick={generateExcelTemplate} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <Download size={14} className="text-emerald-500" />
                          Baixar modelo
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">2</div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Envie sua planilha</h3>
                        <p className="text-xs text-slate-500 mb-3">Faça upload para validar.</p>
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer">
                          <Upload size={14} />
                          Enviar
                          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">Campos obrigatorios: Nome, CPF, Data, E-mail, Telefone, Nome e Telefone Emergencia.</p>
                  </div>
                </>
              )}

              {importStep === 'parsing' && (
                <div className="py-16 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Lendo arquivo...</p>
                </div>
              )}

              {importStep === 'empty' && (
                <div className="py-16 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <File size={32} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Nenhum dado encontrado na planilha</p>
                  <p className="text-xs text-slate-500">Verifique se a aba "Pacientes" tem dados</p>
                  <button onClick={() => setImportStep('idle')} className="btn btn-secondary mt-2">Tentar novamente</button>
                </div>
              )}

              {(importStep === 'preview' || importStep === 'done') && (
                <>
                  {importResults.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-red-500" />
                        <p className="text-xs font-bold text-red-700">{importResults.length} problema(s)</p>
                      </div>
                      <ul className="space-y-1 max-h-24 overflow-y-auto">
                        {importResults.slice(0, 5).map((err, i) => (
                          <li key={i} className="text-xs text-red-600">- {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600">Prévia - {importedPatients.length}</p>
                      {importErrors.length === 0 && importResults.length === 0 && <span className="text-xs font-bold text-emerald-600">OK</span>}
                    </div>
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>{['Nome', 'CPF', 'E-mail', 'Telefone'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-slate-500 font-bold">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {importedPatients.slice(0, 10).map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2">{p.name || '-'}</td>
                              <td className="px-3 py-2">{p.cpf || '-'}</td>
                              <td className="px-3 py-2">{p.email || '-'}</td>
                              <td className="px-3 py-2">{p.phone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {importStep === 'importing' && (
                <div className="py-16 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Cadastrando...</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
              {importStep === 'idle' && <button onClick={resetImportModal} className="btn btn-secondary w-full">Fechar</button>}
              {importStep === 'preview' && (
                <div className="flex gap-3">
                  <button onClick={() => { setImportStep('idle'); setImportedPatients([]); }} className="btn btn-secondary flex-1">Voltar</button>
                  <button onClick={handleImportPatients} disabled={importErrors.length > 0} className="btn btn-primary flex-1 disabled:opacity-50">
                    <Check size={16} /> Confirmar ({importedPatients.length})
                  </button>
                </div>
              )}
              {importStep === 'done' && <button onClick={resetImportModal} className="btn btn-secondary w-full">Fechar</button>}
            </div>
          </div>
        </div>
      )}
      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="card w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Novo Paciente</h2>
                  <p className="text-xs text-slate-500 mt-1">Preencha os dados para o prontuário</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" aria-label="Fechar">
                  <X size={20} />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                {[
                  { id: "identity", label: "Identificação", icon: UserCheck },
                  { id: "contact", label: "Contato", icon: Contact },
                  { id: "address", label: "Endereço", icon: MapPin },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAddFormTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      addFormTab === tab.id
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 animate-shake">
                  <AlertTriangle size={18} className="shrink-0" />
                  <p className="text-xs font-bold">{errorMessage}</p>
                </div>
              )}
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="patient-form" onSubmit={handleAddPatient} className="space-y-5">
                
                {/* TAB: Identificação */}
                {addFormTab === "identity" && (
                  <div className="space-y-5">
                    {/* Status Toggle */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {newPatient.isActive ? (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <UserCheck size={20} className="text-emerald-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                              <UserX size={20} className="text-slate-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Status do Paciente</p>
                            <p className="text-xs text-slate-500">{newPatient.isActive ? "Ativo no acompanhamento" : "Inativo / Arquivado"}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPatient({ ...newPatient, isActive: !newPatient.isActive })}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            newPatient.isActive ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                            newPatient.isActive ? "left-8" : "left-1"
                          }`} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} />
                        <span>Cadastro: {new Date().toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Nome Completo */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        className="input text-sm"
                        value={newPatient.name}
                        onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                        placeholder="Nome social ou completo"
                      />
                    </div>

                    {/* Linha 2: CPF | Nascimento | Gênero */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">CPF *</label>
                        <input
                          type="text"
                          required
                          className="input text-sm"
                          value={newPatient.cpf}
                          onChange={e => setNewPatient({ ...newPatient, cpf: formatCPF(e.target.value) })}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Nascimento *</label>
                        <input
                          type="date"
                          required
                          className="input text-sm"
                          value={newPatient.birthDate}
                          onChange={e => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Gênero</label>
                        <select
                          className="input text-sm"
                          value={newPatient.gender}
                          onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                        >
                          <option value="">...</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Não-Binário">Não-Binário</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    {/* Linha 3: RG | Estado Civil | Profissão */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">RG</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.rg}
                          onChange={e => setNewPatient({ ...newPatient, rg: e.target.value })}
                          placeholder="Documento"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Estado Civil</label>
                        <select
                          className="input text-sm"
                          value={newPatient.maritalStatus}
                          onChange={e => setNewPatient({ ...newPatient, maritalStatus: e.target.value })}
                        >
                          <option value="">...</option>
                          <option value="Solteiro(a)">Solteiro(a)</option>
                          <option value="Casado(a)">Casado(a)</option>
                          <option value="União Estável">União Estável</option>
                          <option value="Divorciado(a)">Divorciado(a)</option>
                          <option value="Viúvo(a)">Viúvo(a)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Profissão</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.profession}
                          onChange={e => setNewPatient({ ...newPatient, profession: e.target.value })}
                          placeholder="Cargo/área"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Contato */}
                {addFormTab === "contact" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">E-mail *</label>
                      <input
                        type="email"
                        required
                        className="input text-sm"
                        value={newPatient.email}
                        onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Telefone *</label>
                        <input
                          type="tel"
                          required
                          className="input text-sm"
                          value={newPatient.phone}
                          onChange={e => setNewPatient({ ...newPatient, phone: formatPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Emergência *</label>
                        <input
                          type="tel"
                          required
                          className="input text-sm"
                          value={newPatient.emergencyPhone}
                          onChange={e => setNewPatient({ ...newPatient, emergencyPhone: formatPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Nome Emergência *</label>
                      <input
                        type="text"
                        required
                        className="input text-sm"
                        value={newPatient.emergencyName}
                        onChange={e => setNewPatient({ ...newPatient, emergencyName: e.target.value })}
                        placeholder="Contato de emergência"
                      />
                    </div>
                  </div>
                )}

                {/* TAB: Endereço */}
                {addFormTab === "address" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">CEP</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.cep}
                          onChange={e => {
                            const formatted = formatCEP(e.target.value);
                            setNewPatient({ ...newPatient, cep: formatted });
                            handleCepLookup(formatted);
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Endereço</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.street}
                          onChange={e => setNewPatient({ ...newPatient, street: e.target.value })}
                          placeholder="Rua, Avenida..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Número</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.number}
                          onChange={e => setNewPatient({ ...newPatient, number: e.target.value })}
                          placeholder="Nº"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Complemento</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.complement}
                          onChange={e => setNewPatient({ ...newPatient, complement: e.target.value })}
                          placeholder="Apto, Bloco..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Bairro</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.neighborhood}
                          onChange={e => setNewPatient({ ...newPatient, neighborhood: e.target.value })}
                          placeholder="Bairro"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Cidade</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.city}
                          onChange={e => setNewPatient({ ...newPatient, city: e.target.value })}
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">UF</label>
                        <input
                          type="text"
                          className="input text-sm"
                          value={newPatient.state}
                          onChange={e => setNewPatient({ ...newPatient, state: e.target.value.toUpperCase() })}
                          placeholder="SP"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    </div>
                    )}

                    {/* TAB: Registros Clínicos */}                {addFormTab === "notes" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Registros Clínicos (Prontuário)</label>
                      <textarea
                        className="input text-sm min-h-[150px]"
                        value={newPatient.notes}
                        onChange={e => setNewPatient({ ...newPatient, notes: e.target.value })}
                        placeholder="Anotações relevantes sobre o paciente..."
                      />
                    </div>

                    {/* Anexos */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Paperclip size={16} className="text-slate-500" />
                          <h4 className="text-sm font-semibold text-slate-700">Laudos e Anexos</h4>
                        </div>
                        <label className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-all ${uploading ? 'opacity-50' : 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'}`}>
                          {uploading ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus size={14} />
                          )}
                          {uploading ? 'Enviando...' : 'Anexar'}
                          <input 
                            type="file" 
                            multiple 
                            className="hidden" 
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            disabled={uploading}
                            onChange={async (e) => {
                              const files = Array.from(e.target.files);
                              if (files.length === 0) return;
                              
                              setUploading(true);
                              try {
                                const newAttachments = [];
                                for (const file of files) {
                                  // Para novos pacientes, apenas adicionar à lista local
                                  // O upload real será feito após criar o paciente
                                  newAttachments.push({
                                    id: `temp-${Date.now()}-${Math.random()}`,
                                    filename: file.name,
                                    mimeType: file.type,
                                    size: file.size,
                                    file: file,
                                    isNew: true
                                  });
                                }
                                setAttachments(prev => [...prev, ...newAttachments]);
                              } catch (error) {
                                console.error("Upload error:", error);
                              } finally {
                                setUploading(false);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>

                      {attachments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <File size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Nenhum anexo adicionado</p>
                          <p className="text-[10px] mt-1">PDF, JPG, PNG, DOC (máx. 10MB)</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {attachments.map((att, idx) => (
                            <div key={att.id || idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2 min-w-0">
                                <File size={16} className="text-slate-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-slate-700 truncate">{att.filename}</p>
                                  <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors shrink-0"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
</div>
                    )}
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  form="patient-form"
                  disabled={saving}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Cadastrar
                    </>
                  )}
                </button>
              </div>
            </div>
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
          setSuccessMessage={setSuccessMessage}
        />
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

function EditPatientModal({ patient, onClose, onSave, setSuccessMessage }) {
  const [formData, setFormData] = useState({
    name: patient.name || "",
    email: patient.email || "",
    phone: formatPhone(patient.phone || ""),
    birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : "",
    cpf: formatCPF(patient.cpf || ""),
    rg: patient.rg || "",
    gender: patient.gender || "",
    maritalStatus: patient.maritalStatus || "",
    profession: patient.profession || "",
    cep: formatCEP(patient.cep || ""),
    street: patient.street || "",
    number: patient.number || "",
    complement: patient.complement || "",
    neighborhood: patient.neighborhood || "",
    city: patient.city || "",
    state: patient.state || "",
    emergencyName: patient.emergencyName || "",
    emergencyPhone: formatPhone(patient.emergencyPhone || ""),
    notes: patient.notes || "",
    isActive: patient.isActive !== false,
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editTab, setEditTab] = useState("identity");
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cleanupModal, setCleanupModal] = useState({ open: false, title: "", message: "", mode: null });

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    loadAttachments();
  }, [patient.id]);

  const loadAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const data = await api.getAttachments(patient.id);
      setAttachments(data);
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Manual validation to guide user to the right tab
    if (!formData.name || !formData.cpf || !formData.birthDate) {
      setEditTab("identity");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Identificação.");
      return;
    }
    
    if (!formData.email || !formData.phone || !formData.emergencyPhone || !formData.emergencyName) {
      setEditTab("contact");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Contato.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      await api.updatePatient(patient.id, formData);
      setSuccessMessage("Cadastro atualizado com sucesso!");
      onSave();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setErrorMessage(error.message || "Erro ao salvar paciente");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAttachment = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setErrorMessage("");
    try {
      for (const file of files) {
        const result = await api.uploadAttachment(patient.id, file);
        setAttachments(prev => [result, ...prev]);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setErrorMessage(error.message || "Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm("Tem certeza que deseja excluir este anexo?")) return;
    try {
      await api.deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error("Erro ao deletar anexo:", error);
      alert("Erro ao deletar arquivo");
    }
  };

  const handleDownloadAttachment = async (att) => {
    try {
      await api.downloadAttachment(att.id, att.filename);
    } catch (error) {
      console.error("Erro ao baixar:", error);
      alert("Erro ao baixar arquivo");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const togglePatientStatus = () => {
    setFormData({ ...formData, isActive: !formData.isActive });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
      <div className="card w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Editar Paciente</h2>
              <p className="text-xs text-slate-500 mt-1">Atualize os dados do prontuário</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            {[
              { id: "identity", label: "Identificação", icon: UserCheck },
              { id: "contact", label: "Contato", icon: Contact },
              { id: "address", label: "Endereço", icon: MapPin },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEditTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  editTab === tab.id
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 animate-shake">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="text-xs font-bold">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="edit-patient-form" onSubmit={handleSave} className="space-y-5">
            
            {editTab === "identity" && (
              <div className="space-y-5">
                {/* Status Toggle */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {formData.isActive ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <UserCheck size={20} className="text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <UserX size={20} className="text-slate-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Status do Paciente</p>
                        <p className="text-xs text-slate-500">{formData.isActive ? "Ativo no acompanhamento" : "Inativo / Arquivado"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={togglePatientStatus}
                      className={`relative w-14 h-7 rounded-full transition-colors ${formData.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${formData.isActive ? "left-8" : "left-1"}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Cadastro: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                    {!formData.isActive && patient.inactivatedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Inatividade: {new Date(patient.inactivatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    className="input text-sm"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome social ou completo"
                  />
                </div>

                {/* Linha 2: CPF | Nascimento | Gênero */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">CPF *</label>
                    <input
                      type="text"
                      required
                      className="input text-sm"
                      value={formData.cpf}
                      onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Nascimento *</label>
                    <input
                      type="date"
                      required
                      className="input text-sm"
                      value={formData.birthDate}
                      onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Gênero</label>
                    <select
                      className="input text-sm"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="">...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Não-Binário">Não-Binário</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                {/* Linha 3: RG | Estado Civil | Profissão */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">RG</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.rg}
                      onChange={e => setFormData({ ...formData, rg: e.target.value })}
                      placeholder="Documento"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Estado Civil</label>
                    <select
                      className="input text-sm"
                      value={formData.maritalStatus}
                      onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
                    >
                      <option value="">...</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="União Estável">União Estável</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Profissão</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.profession}
                      onChange={e => setFormData({ ...formData, profession: e.target.value })}
                      placeholder="Cargo/área"
                    />
                  </div>
                </div>
              </div>
            )}

            {editTab === "contact" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">E-mail *</label>
                  <input
                    type="email"
                    required
                    className="input text-sm"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Telefone *</label>
                    <input
                      type="tel"
                      required
                      className="input text-sm"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Emergência *</label>
                    <input
                      type="tel"
                      required
                      className="input text-sm"
                      value={formData.emergencyPhone}
                      onChange={e => setFormData({ ...formData, emergencyPhone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Nome Emergência *</label>
                  <input
                    type="text"
                    required
                    className="input text-sm"
                    value={formData.emergencyName}
                    onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="Contato de emergência"
                  />
                </div>
              </div>
            )}

            {editTab === "address" && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">CEP</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.cep}
                      onChange={e => {
                        const formatted = formatCEP(e.target.value);
                        setFormData({ ...formData, cep: formatted });
                        handleCepLookup(formatted);
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Endereço</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.street}
                      onChange={e => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Rua, Avenida..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Número</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.number}
                      onChange={e => setFormData({ ...formData, number: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Complemento</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.complement}
                      onChange={e => setFormData({ ...formData, complement: e.target.value })}
                      placeholder="Apto, Bloco..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Bairro</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.neighborhood}
                      onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Cidade</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">UF</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {editTab === "settings" && (
              <div className="space-y-5">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700">Agenda do Paciente</h4>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Horários fixos de atendimento</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointments.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAgenda}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all shadow-sm"
                          title="Remover todos os horários fixos"
                        >
                          <Trash2 size={14} />
                          Limpar Agenda
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={addAppointmentSlot}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-all shadow-sm"
                      >
                        <Plus size={14} />
                        Adicionar Horário
                      </button>
                    </div>                  </div>
                  
                  {/* Data de Início */}
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Data de Início *</label>
                    <input 
                      type="date"
                      className="input text-sm"
                      value={appointmentStartDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setAppointmentStartDate(e.target.value)}
                      required={appointments.length > 0}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">A partir desta data, os horários se repetirão semanalmente</p>
                  </div>
                  
                  {loadingAppointments ? (
                    <div className="py-8 text-center">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="py-8 text-center bg-white/50 rounded-xl border border-dashed border-emerald-200">
                      <Calendar size={24} className="mx-auto text-emerald-300 mb-2" />
                      <p className="text-xs text-emerald-600 font-medium">Nenhum horário definido</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((app, idx) => {
                        const conflict = conflicts[app.id];
                        return (
                          <div 
                            key={app.id} 
                            className={`bg-white p-4 rounded-xl border transition-all animate-scale-in shadow-sm ${conflict ? 'border-red-200 bg-red-50/20' : 'border-emerald-100'}`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${conflict ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  Horário #{idx + 1}
                                </span>
                                {conflict && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
                                    <AlertTriangle size={12} />
                                    CONFLITO COM: {conflict.patient?.name}
                                  </div>
                                )}
                              </div>
                              <button 
                                type="button" 
                                onClick={() => removeAppointmentSlot(app.id)}
                                className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dia da Semana</label>
                                <select
                                  className={`input text-xs font-semibold py-2 ${conflict ? 'border-red-300 focus:ring-red-500' : ''}`}
                                  value={app.dayOfWeek}
                                  onChange={e => updateAppointmentSlot(app.id, "dayOfWeek", e.target.value)}
                                >
                                  {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((day, i) => (
                                    <option key={i} value={i}>{day}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horário</label>
                                <select
                                  className={`input text-xs font-semibold py-2 ${conflict ? 'border-red-300 focus:ring-red-500' : ''}`}
                                  value={app.time}
                                  onChange={e => updateAppointmentSlot(app.id, "time", e.target.value)}
                                >
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
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duração</label>
                                <select
                                  className="input text-xs font-semibold py-2"
                                  value={app.duration}
                                  onChange={e => updateAppointmentSlot(app.id, "duration", e.target.value)}
                                >
                                  <option value="30">30 min</option>
                                  <option value="45">45 min</option>
                                  <option value="50">50 min</option>
                                  <option value="60">60 min</option>
                                  <option value="90">90 min</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-emerald-100">
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-2">Próxima Sessão (Excepcional)</label>
                    <input
                      type="date"
                      className="input text-xs font-semibold"
                      value={formData.nextSession}
                      onChange={e => setFormData({ ...formData, nextSession: e.target.value })}
                    />
                    <p className="text-[10px] text-emerald-600/70 mt-2 font-medium italic">
                      * Use este campo para marcar uma sessão fora do horário fixo habitual.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {editTab === "notes" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Registros Clínicos (Prontuário)</label>
                  <textarea
                    className="input text-sm min-h-[150px]"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Anotações relevantes sobre o paciente..."
                  />
                </div>

                {/* Anexos */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} className="text-slate-500" />
                      <h4 className="text-sm font-semibold text-slate-700">Laudos e Anexos</h4>
                    </div>
                    <label className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-all ${uploading ? 'opacity-50' : 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'}`}>
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      {uploading ? 'Enviando...' : 'Anexar'}
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        disabled={uploading}
                        onChange={handleUploadAttachment}
                      />
                    </label>
                  </div>

                  {loadingAttachments ? (
                    <div className="text-center py-8 text-slate-400">
                      <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs">Carregando anexos...</p>
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <File size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Nenhum anexo</p>
                      <p className="text-[10px] mt-1">PDF, JPG, PNG, DOC (máx. 10MB)</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 min-w-0">
                            <File size={16} className="text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{att.filename}</p>
                              <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(att)}
                              className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Baixar"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              form="edit-patient-form"
              disabled={saving}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cleanup Selection Modal */}
        {cleanupModal.open && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110]" onClick={() => setCleanupModal({ ...cleanupModal, open: false })}>
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight mb-3">{cleanupModal.title}</h3>
              <p className="text-sm text-slate-500 text-center leading-relaxed font-medium mb-8">{cleanupModal.message}</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleClearAgenda('future')}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  Limpar Futuro (Manter Histórico)
                </button>
                <button 
                  onClick={() => handleClearAgenda('all')}
                  className="w-full py-4 bg-white text-red-600 border border-red-100 rounded-2xl hover:bg-red-50 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Apagar Tudo (Limpeza Total)
                </button>
                <button 
                  onClick={() => setCleanupModal({ ...cleanupModal, open: false })}
                  className="w-full py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function calculateDaysUntilBirthday(birthDate) {
  if (!birthDate) return { days: null, isWeek: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birth = new Date(birthDate);
  
  // Criar data do aniversário para este ano
  const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  
  // Calcular diferença em dias para o aniversário deste ano (pode ser negativa se já passou)
  const diffTimeThisYear = thisYearBirthday - today;
  const diffDaysThisYear = Math.ceil(diffTimeThisYear / (1000 * 60 * 60 * 24));
  
  // É a "janela de aniversário" se estiver entre 4 dias antes e 3 dias depois
  const isWeek = diffDaysThisYear >= -3 && diffDaysThisYear <= 4;
  
  // Para o contador de "próximo aniversário", se já passou este ano, calcular para o ano que vem
  let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  const diffTimeNext = nextBirthday - today;
  const diffDaysNext = Math.ceil(diffTimeNext / (1000 * 60 * 60 * 24));
  
  if (diffDaysThisYear === 0) return { days: "Hoje! 🎂", isWeek: true };
  
  // Se já passou mas está na janela festiva
  if (isWeek && diffDaysThisYear < 0) {
    return { days: `Foi há ${Math.abs(diffDaysThisYear)} dias`, isWeek: true };
  }

  return { days: diffDaysNext, isWeek };
}

function PatientCard({ patient, onDelete, onEdit }) {
  const sentCount = patient._count?.shareLinks || 0;
  const responseCount = patient._count?.responses || 0;
  const isActive = patient.isActive !== false;
  const { days: daysUntilBirthday, isWeek: isBirthdayWeek } = calculateDaysUntilBirthday(patient.birthDate);
  const attendance = patient.attendanceStats || { presente: 0, falta: 0, justificada: 0 };

  return (
    <div className={`card group hover:shadow-xl transition-all duration-300 flex flex-col h-full card-bone border-slate-100 relative ${!isActive ? 'opacity-70' : ''} ${isBirthdayWeek ? 'ring-2 ring-amber-400 border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-lg shadow-amber-100/50' : 'hover:border-emerald-200'}`}>
      {isBirthdayWeek && (
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-amber-100 animate-bounce z-10">
          <PartyPopper size={20} className="text-amber-500" />
        </div>
      )}

      {/* Top Bar: Identity & Context */}
      <div className="p-5 pb-0 flex items-start justify-between relative z-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition-all duration-300 ${isActive ? (isBirthdayWeek ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-900 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white') : 'bg-slate-200 text-slate-500'}`}>
              {patient.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className={`text-lg font-bold leading-tight transition-colors truncate max-w-[160px] ${isBirthdayWeek ? 'text-amber-900' : 'text-slate-900 group-hover:text-emerald-700'}`}>
              {patient.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${isActive ? (isBirthdayWeek ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100') : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {isActive ? 'Ativo' : 'Inativo'}
              </span>
              {daysUntilBirthday !== null && (
                <div className="relative group/tooltip">
                  <span 
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border cursor-pointer ${isBirthdayWeek ? 'bg-amber-500 text-white border-amber-400 animate-pulse' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                  >
                    <CakeSlice size={10} className={isBirthdayWeek ? 'text-white' : 'text-slate-400'} />
                    {typeof daysUntilBirthday === 'string' ? 'Aniversário!' : `${daysUntilBirthday} dias`}
                  </span>
                  
                  {/* Instant Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-100 whitespace-nowrap z-50">
                    {isBirthdayWeek ? "Semana de aniversário!" : "Dias para o próximo aniversário"}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Dashboard: Attendance & Forms */}
      <div className="px-5 py-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden">
          <div className="grid grid-cols-2">
            {/* Attendance Section */}
            <div className="p-4 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Calendar size={12} className="text-emerald-500" /> Sessões
              </p>
              <div className="flex items-end gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 leading-none">{attendance.presente}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase mt-1.5">Pres.</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-400 leading-none">{attendance.falta}</span>
                  <span className="text-[10px] font-bold text-rose-400 uppercase mt-1.5">Faltas</span>
                </div>
              </div>
            </div>

            {/* Forms Section */}
            <div className="p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                <FileText size={12} className="text-emerald-500" /> Instrumentos
              </p>
              <div className="flex items-end gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 leading-none">{sentCount}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase mt-1.5">Env.</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-emerald-600 leading-none">{responseCount}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase mt-1.5">Resp.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="px-5 pb-5 mt-auto">
        <div className="flex flex-col gap-2 mb-4">
          {patient.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone size={12} className="text-emerald-500" />
              <span className="font-medium">{patient.phone}</span>
            </div>
          )}
          {patient.email && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail size={12} className="text-emerald-500" />
              <span className="font-medium truncate">{patient.email}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link to={`/patients/${patient.id}`} className="flex-1 btn bg-slate-900 text-white hover:bg-slate-800 text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200">
            <FileText size={14} /> Prontuário
          </Link>
          <button onClick={() => onEdit(patient)} className="btn bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 text-xs px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
            <Pencil size={14} /> Editar
          </button>
          <button onClick={() => onDelete(patient.id)} className="btn bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 text-xs px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientListRow({ patient, onDelete, onEdit }) {
  const sentCount = patient._count?.shareLinks || 0;
  const responseCount = patient._count?.responses || 0;
  const isActive = patient.isActive !== false;
  const { days: daysUntilBirthday, isWeek: isBirthdayWeek } = calculateDaysUntilBirthday(patient.birthDate);
  const attendance = patient.attendanceStats || { presente: 0, falta: 0, justificada: 0 };

  return (
    <div className={`card p-4 flex items-center gap-5 transition-all relative overflow-hidden ${!isActive ? 'opacity-70' : ''} ${isBirthdayWeek ? 'border-l-4 border-l-amber-400 bg-amber-50/20' : 'hover:border-emerald-200 hover:bg-emerald-50/10'}`}>
      <Link to={`/patients/${patient.id}`} className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 transition-all ${isActive ? (isBirthdayWeek ? 'bg-amber-500 text-white' : 'bg-slate-900 text-emerald-400') : 'bg-slate-200 text-slate-500'}`}>
        {isBirthdayWeek ? <PartyPopper size={20} /> : patient.name.charAt(0).toUpperCase()}
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <Link to={`/patients/${patient.id}`} className="group/name">
            <h4 className={`font-bold transition-colors truncate text-base ${isBirthdayWeek ? 'text-amber-900' : 'text-slate-900 group-hover:text-emerald-600'}`}>
              {patient.name}
            </h4>
          </Link>
          {daysUntilBirthday !== null && (
            <div className="relative group/tooltip">
              <span 
                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border flex items-center gap-1 cursor-pointer ${isBirthdayWeek ? 'bg-amber-500 text-white border-amber-400 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                <CakeSlice size={10} className={isBirthdayWeek ? 'text-white' : 'text-slate-400'} />
                {typeof daysUntilBirthday === 'string' ? (daysUntilBirthday === "Hoje! 🎂" ? 'Niver Hoje!' : daysUntilBirthday) : `Em ${daysUntilBirthday}d`}
              </span>

              {/* Instant Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-100 whitespace-nowrap z-50">
                {isBirthdayWeek ? "Semana de aniversário!" : "Dias para o próximo aniversário"}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Phone size={12} className="text-emerald-500" />
            <span>{patient.phone || '--'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail size={12} className="text-emerald-500" />
            <span className="truncate max-w-[120px]">{patient.email || '--'}</span>
          </div>
        </div>
      </div>

      {/* Unified Stats for List View */}
      <div className="flex items-center gap-10 px-8 border-x border-slate-100">
        <div className="flex flex-col">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Calendar size={10} className="text-emerald-500" /> Sessões
          </p>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 leading-none">{attendance.presente}</span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase mt-1">Pres.</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-400 leading-none">{attendance.falta}</span>
              <span className="text-[9px] font-bold text-rose-400 uppercase mt-1">Faltas</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <FileText size={10} className="text-emerald-500" /> Instrumentos
          </p>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 leading-none">{sentCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Env.</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-emerald-600 leading-none">{responseCount}</span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase mt-1">Resp.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to={`/patients/${patient.id}`} className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-200">
          <FileText size={18} />
        </Link>
        <button onClick={() => onEdit(patient)} className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
          <Pencil size={18} />
        </button>
        <button onClick={() => onDelete(patient.id)} className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
