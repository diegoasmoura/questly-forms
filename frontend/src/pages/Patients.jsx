import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { api } from "../lib/api";
import { formatCPF, formatPhone, formatCEP } from "../lib/utils";
import { generateExcelTemplate } from "../lib/excel";
import { getAvatarProps } from "../components/dashboard/Shared";
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
  ChevronLeft,
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
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("patients-view", mode);
  };

  const closeAddModal = () => {
    setIsClosingAdd(true);
    setTimeout(() => {
      setShowAddModal(false);
      setIsClosingAdd(false);
    }, 200);
  };

  const closeEditModal = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setEditPatient(null);
      setIsClosingEdit(false);
    }, 200);
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [isClosingAdd, setIsClosingAdd] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedPatients, setImportedPatients] = useState([]);
  const [showRegistrationDropdown, setShowRegistrationDropdown] = useState(false);
  const [showEmptyRegistrationDropdown, setShowEmptyRegistrationDropdown] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [isClosingEdit, setIsClosingEdit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('patients-per-page');
    return saved ? parseInt(saved, 10) : 12;
  });

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    localStorage.setItem('patients-per-page', value);
  };
  
  const [importStep, setImportStep] = useState('idle');
  const [importErrors, setImportErrors] = useState([]);
  const [importResults, setImportResults] = useState([]);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    nextSession: "",
    lgpdConsent: false
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
    if (!newPatient.name || !newPatient.cpf || !newPatient.birthDate || !newPatient.lgpdConsent) {
      setAddFormTab("identity");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios e aceite o Termo de Consentimento LGPD na aba Identificação.");
      return;
    }
    
    if (!newPatient.email || !newPatient.phone) {
      setAddFormTab("contact");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Contato.");
      return;
    }

    if (!newPatient.emergencyPhone || !newPatient.emergencyName) {
      setAddFormTab("emergency");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Emergência.");
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
      
      closeAddModal();
      setNewPatient({
        name: "", email: "", phone: "", birthDate: "",
        cpf: "", gender: "", maritalStatus: "",
        profession: "", cep: "", street: "", number: "",
        complement: "", neighborhood: "", city: "", state: "",
        emergencyName: "", emergencyPhone: "", notes: "",
        isActive: true,
        sessionTime: "",
        sessionDuration: "50",
        sessionFrequency: "semanal",
        nextSession: "",
        lgpdConsent: false
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

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in relative">
      {/* New Sleek Toolbar */}
      <div className="px-6 py-4 flex flex-row items-center justify-between gap-2 sm:gap-4 shrink-0 sticky top-0 z-40 bg-[var(--bg)] shadow-[0_10px_20px_-10px_var(--bg)]">
        
        {/* Search */}
        <div className="relative flex-1 min-w-0 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--sage)] transition-colors" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Procurar paciente..."
            className="w-full bg-[var(--surface-alt)] border border-transparent rounded-[16px] pl-10 pr-3 md:pr-12 py-2 sm:py-2.5 text-sm outline-none focus:bg-[var(--surface)] focus:border-[var(--sage)] focus:ring-1 focus:ring-[var(--sage)] transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="hidden md:flex items-center justify-center px-1.5 py-0.5 rounded-[6px] bg-[var(--surface)] text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border)] tracking-widest font-sans">
              ⌘K
            </span>
          </div>
        </div>

        {/* Actions (View Toggle + Cadastrar) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-[var(--surface-alt)] rounded-[14px] border border-[var(--border)] shrink-0">
            <button
              onClick={() => handleViewMode("grid")}
              title="Visualização em Cards"
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] ${viewMode === "grid" ? "bg-white shadow-sm text-[var(--sage)]" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
              onClick={() => handleViewMode("list")}
              title="Visualização em Lista"
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] ${viewMode === "list" ? "bg-white shadow-sm text-[var(--sage)]" : "text-slate-400 hover:text-slate-600"}`}
            >
              <List size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          {/* Registration Dropdown */}
          <div className="relative registration-dropdown shrink-0">
            <button 
              onClick={() => setShowRegistrationDropdown(!showRegistrationDropdown)} 
              className="bg-[var(--sage)] hover:opacity-90 text-white rounded-[14px] w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus size={20} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Cadastrar</span>
              <ChevronDown size={16} className={`hidden sm:block transition-transform duration-200 ${showRegistrationDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showRegistrationDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--surface)] rounded-[16px] shadow-xl border border-[var(--border)] py-2 z-50 animate-scale-in">
                <button
                  onClick={() => {
                    openAddModal();
                    setShowRegistrationDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--sage-light)] text-[var(--sage)] flex items-center justify-center">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <p className="font-bold">Novo paciente</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Manual, um por um</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(true);
                    setShowRegistrationDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <p className="font-bold">Importar dados</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Planilha Excel</p>
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* patients List */}
      <div className="flex-1 flex flex-col px-6 pb-6 min-h-0">
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
        ) : viewMode === "grid" && filteredPatients.length > 0 ? (
          <div className="flex flex-col flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-sm mt-2 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto patients-scrollbar p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4" style={{gridAutoRows: '1fr'}}>
                {paginatedPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onDelete={handleDeletePatient}
                    onEdit={() => setEditPatient(patient)}
                  />
                ))}
              </div>
            </div>
            {filteredPatients.length > itemsPerPage && (
              <div className="border-t border-[var(--border)] shrink-0 rounded-b-[24px] overflow-hidden">
                <PaginationFooter 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  totalItems={filteredPatients.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
            {filteredPatients.length <= itemsPerPage && (
              <div className="border-t border-[var(--border)] shrink-0 rounded-b-[24px] overflow-hidden">
                <PaginationFooter 
                  currentPage={1} 
                  totalPages={1} 
                  totalItems={filteredPatients.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={() => {}}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-sm mt-2 min-h-0 overflow-hidden">
            {filteredPatients.length === 0 ? (
              <div className="p-16 sm:p-20 text-center flex flex-col items-center justify-center flex-1">
                <div className="w-20 h-20 bg-[var(--surface-alt)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users size={40} className="text-[var(--text-secondary)] opacity-70" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  {searchQuery ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
                </h3>
                <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
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
                      <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-[var(--surface)] rounded-[16px] shadow-xl border border-[var(--border)] py-2 z-[60] animate-scale-in">
                        <button
                          onClick={() => {
                            openAddModal();
                            setShowEmptyRegistrationDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[var(--sage-light)] text-[var(--sage)] flex items-center justify-center">
                            <UserPlus size={18} />
                          </div>
                          <div>
                            <p className="font-bold">Cadastrar paciente</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Manual, um por um</p>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setShowImportModal(true);
                            setShowEmptyRegistrationDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center">
                            <FileSpreadsheet size={18} />
                          </div>
                          <div>
                            <p className="font-bold">Importar pacientes</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Via planilha Excel</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-y-auto patients-scrollbar min-h-0">
                {paginatedPatients.map((patient, index) => (
                  <PatientListRow
                    key={patient.id}
                    patient={patient}
                    onDelete={handleDeletePatient}
                    onEdit={() => setEditPatient(patient)}
                    isLast={index === paginatedPatients.length - 1}
                  />
                ))}
              </div>
            )}
            
            {filteredPatients.length > itemsPerPage && (
              <div className="border-t border-[var(--border)] shrink-0 mt-auto rounded-b-[24px] overflow-hidden">
                <PaginationFooter 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  totalItems={filteredPatients.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
            {filteredPatients.length <= itemsPerPage && (
              <div className="border-t border-[var(--border)] shrink-0 mt-auto rounded-b-[24px] overflow-hidden">
                <PaginationFooter 
                  currentPage={1} 
                  totalPages={1} 
                  totalItems={filteredPatients.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={() => {}}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {showImportModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[3px] animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative transition-colors duration-300">
            <div className="p-6 border-b border-[var(--border)] shrink-0 bg-[var(--surface)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-[22px] font-bold text-[var(--text-primary)] leading-tight">Importar Dados</h2>
                  <p className="text-[13px] text-[var(--text-muted)] mt-1">
                    {importStep === 'idle' && 'Baixe o modelo, preencha e envie'}
                    {importStep === 'parsing' && 'Lendo arquivo...'}
                    {importStep === 'empty' && 'Nenhum dado encontrado'}
                    {importStep === 'preview' && importedPatients.length + ' paciente(s) encontrado(s)'}
                    {importStep === 'importing' && 'Importando... ' + importProgress + '%'}
                    {importStep === 'done' && 'Concluído'}
                  </p>
                </div>
                <button onClick={resetImportModal} className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)] transition-colors">
                  <X size={20} />
                </button>
              </div>
              {importStep === 'importing' && (
                <div className="mt-4 h-2 bg-[var(--surface-alt)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--sage)] rounded-full transition-all" style={{ width: importProgress + '%' }} />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {importStep === 'idle' && (
                <>
                  <div className="p-5 bg-[var(--surface)] rounded-[16px] border border-[var(--border)] shadow-sm transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-[10px] bg-[var(--sage-light)] text-[var(--sage)] flex items-center justify-center font-extrabold text-[14px] shrink-0">1</div>
                      <div className="flex-1">
                        <h3 className="text-[14px] font-bold text-[var(--text-primary)] mb-1">Baixe o modelo</h3>
                        <p className="text-[12px] text-[var(--text-muted)] mb-3">Use a planilha padrão.</p>
                        <button onClick={generateExcelTemplate} className="btn btn-secondary flex items-center justify-center sm:justify-start w-full sm:w-auto gap-2 text-[12px]">
                          <Download size={14} className="text-[var(--text-primary)] opacity-70" />
                          Baixar modelo
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-[var(--surface)] rounded-[16px] border border-[var(--border)] shadow-sm transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-[10px] bg-[var(--sage-light)] text-[var(--sage)] flex items-center justify-center font-extrabold text-[14px] shrink-0">2</div>
                      <div className="flex-1">
                        <h3 className="text-[14px] font-bold text-[var(--text-primary)] mb-1">Envie sua planilha</h3>
                        <p className="text-[12px] text-[var(--text-muted)] mb-3">Faça upload para validar.</p>
                        <label className="btn btn-primary inline-flex items-center justify-center sm:justify-start w-full sm:w-auto gap-2 cursor-pointer text-[12px]">
                          <Upload size={14} />
                          Enviar planilha
                          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[var(--blue-light)] border border-[var(--blue)]/20 rounded-[12px] p-4 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-[var(--blue)] shrink-0 mt-0.5" />
                    <p className="text-[12px] font-medium text-[var(--blue)] leading-snug">Campos obrigatórios: Nome, CPF, Data (Identificação), E-mail, Telefone (Contato), Telefone e Nome Emergência.</p>
                  </div>
                </>
              )}

              {importStep === 'parsing' && (
                <div className="py-16 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-[3px] border-[var(--sage)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[14px] font-bold text-[var(--text-secondary)]">Lendo arquivo...</p>
                </div>
              )}

              {importStep === 'empty' && (
                <div className="py-16 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-[16px] bg-[var(--surface-alt)] flex items-center justify-center">
                    <File size={32} className="text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="text-[14px] text-[var(--text-primary)] font-bold">Nenhum dado encontrado na planilha</p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-1">Verifique se a aba "Pacientes" tem dados</p>
                  </div>
                  <button onClick={() => setImportStep('idle')} className="btn btn-secondary mt-2">Tentar novamente</button>
                </div>
              )}

              {(importStep === 'preview' || importStep === 'done') && (
                <>
                  {importResults.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[12px] p-4 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-red-500 dark:text-red-400" />
                        <p className="text-[12px] font-bold text-red-700 dark:text-red-400">{importResults.length} problema(s)</p>
                      </div>
                      <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                        {importResults.slice(0, 5).map((err, i) => (
                          <li key={i} className="text-[11px] font-medium text-red-600 dark:text-red-400/80 leading-snug">- {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="rounded-[16px] border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-sm transition-colors">
                    <div className="bg-[var(--surface-alt)] px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                      <p className="text-[12px] font-bold text-[var(--text-secondary)]">Prévia - {importedPatients.length} pacientes</p>
                      {importErrors.length === 0 && importResults.length === 0 && <span className="text-[11px] font-bold text-[var(--sage)] bg-[var(--sage-light)] px-2.5 py-1 rounded-[999px] uppercase tracking-wider">Tudo OK</span>}
                    </div>
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-[12px]">
                        <thead className="bg-[var(--surface-alt)] sticky top-0 z-10">
                          <tr>{['Nome', 'CPF', 'E-mail', 'Telefone'].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-[var(--text-muted)] font-extrabold uppercase tracking-wider border-b border-[var(--border)]">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {importedPatients.slice(0, 10).map((p, i) => (
                            <tr key={i} className="hover:bg-[var(--surface-alt)] transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-[var(--text-primary)]">{p.name || '-'}</td>
                              <td className="px-5 py-3.5 text-[var(--text-secondary)] tabular-nums">{p.cpf || '-'}</td>
                              <td className="px-5 py-3.5 text-[var(--text-secondary)]">{p.email || '-'}</td>
                              <td className="px-5 py-3.5 text-[var(--text-secondary)] tabular-nums">{p.phone || '-'}</td>
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
                  <div className="w-10 h-10 border-[3px] border-[var(--sage)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[14px] font-bold text-[var(--text-secondary)]">Cadastrando pacientes...</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 flex gap-3 justify-end">
              {importStep === 'idle' && <button onClick={resetImportModal} className="btn btn-secondary flex-1 sm:flex-none px-6">Fechar</button>}
              {importStep === 'preview' && (
                <>
                  <button onClick={() => { setImportStep('idle'); setImportedPatients([]); }} className="btn btn-secondary flex-1 sm:flex-none px-6">Voltar</button>
                  <button onClick={handleImportPatients} disabled={importErrors.length > 0} className="btn btn-primary flex-1 sm:flex-none px-6 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Check size={16} /> Confirmar ({importedPatients.length})
                  </button>
                </>
              )}
              {importStep === 'done' && <button onClick={resetImportModal} className="btn btn-secondary flex-1 sm:flex-none px-6">Fechar</button>}
            </div>
          </div>
        </div>
      , document.body)}
      {/* Add Patient Modal */}
      {showAddModal && createPortal(
        <div className={`fixed inset-0 z-[100] flex items-start pt-[8vh] justify-center p-4 bg-black/50 backdrop-blur-[3px] transition-opacity duration-200 ${isClosingAdd ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-xl w-full max-w-2xl h-[75vh] md:h-[600px] overflow-hidden flex flex-col relative transition-all duration-200 ${isClosingAdd ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Novo Paciente</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Preencha os dados para o prontuário</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)] transition-colors" aria-label="Fechar">
                  <X size={20} />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 bg-[var(--surface-alt)] p-1 rounded-[12px] overflow-x-auto">
                {[
                  { id: "identity", label: "Identificação", icon: UserCheck },
                  { id: "contact", label: "Contato", icon: Contact },
                  { id: "address", label: "Endereço", icon: MapPin },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAddFormTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] text-xs font-semibold transition-all whitespace-nowrap ${
                      addFormTab === tab.id
                        ? "bg-[var(--surface)] text-[var(--sage)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                    <div className="p-4 bg-[var(--surface-alt)] rounded-[16px] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {newPatient.isActive ? (
                            <div className="w-10 h-10 rounded-[10px] bg-[var(--sage-light)] flex items-center justify-center">
                              <UserCheck size={20} className="text-[var(--sage)]" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-[10px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                              <UserX size={20} className="text-[var(--text-muted)]" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Status do Paciente</p>
                            <p className="text-xs text-[var(--text-muted)]">{newPatient.isActive ? "Ativo no acompanhamento" : "Inativo / Arquivado"}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPatient({ ...newPatient, isActive: !newPatient.isActive })}
                          className={`relative w-12 h-6 rounded-full transition-colors border ${
                            newPatient.isActive ? "bg-[var(--sage)] border-[var(--sage)]" : "bg-[var(--surface)] border-[var(--border)]"
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                            newPatient.isActive ? "left-[26px]" : "left-1 bg-[var(--text-muted)]"
                          }`} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                        <Calendar size={14} />
                        <span>Cadastro: {new Date().toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Nome Completo */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        className="input !rounded-[10px] text-sm"
                        value={newPatient.name}
                        onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                        placeholder="Nome social ou completo"
                      />
                    </div>

                    {/* Linha 2: CPF | Nascimento | Gênero */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">CPF *</label>
                        <input
                          type="text"
                          required
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.cpf}
                          onChange={e => setNewPatient({ ...newPatient, cpf: formatCPF(e.target.value) })}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Nascimento *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar size={18} className="text-[var(--text-muted)]" />
                          </div>
                          <input
                            type="date"
                            required
                            className="input !rounded-[10px] pl-10"
                            value={newPatient.birthDate}
                            onChange={e => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                            onClick={(e) => e.target.showPicker && e.target.showPicker()}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Gênero</label>
                        <select
                          className="input !rounded-[10px] text-sm"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Estado Civil</label>
                        <select
                          className="input !rounded-[10px] text-sm"
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
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Profissão</label>
                        <input
                          type="text"
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.profession}
                          onChange={e => setNewPatient({ ...newPatient, profession: e.target.value })}
                          placeholder="Cargo/área"
                        />
                      </div>
                    </div>

                    {/* Consentimento LGPD */}
                    <div className="col-span-2 mt-4 p-4 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl flex gap-3 items-start transition-colors">
                      <input
                        type="checkbox"
                        id="lgpd"
                        required
                        className="mt-1 w-4 h-4 accent-[var(--sage)] rounded border-[var(--border)] bg-[var(--surface)] focus:ring-[var(--sage)] focus:ring-offset-[var(--surface)] cursor-pointer"
                        checked={newPatient.lgpdConsent || false}
                        onChange={e => setNewPatient({ ...newPatient, lgpdConsent: e.target.checked })}
                      />
                      <label htmlFor="lgpd" className="text-sm text-[var(--text-secondary)] leading-relaxed cursor-pointer">
                        Declaro que obtive o <strong className="text-[var(--text-primary)]">consentimento expresso</strong> do paciente (ou responsável legal) para coleta e tratamento de dados pessoais e de saúde de natureza sensível, em estrita conformidade com a <strong className="text-[var(--text-primary)]">LGPD (Lei nº 13.709/2018)</strong> e resoluções do CFP.
                      </label>
                    </div>
                  </div>
                )}

                {addFormTab === "contact" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">E-mail *</label>
                        <input
                          type="email"
                          required
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.email}
                          onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Telefone *</label>
                        <input
                          type="tel"
                          required
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.phone}
                          onChange={e => setNewPatient({ ...newPatient, phone: formatPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-[var(--border)]">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Contato de Emergência</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Nome Emergência *</label>
                          <input
                            type="text"
                            required
                            className="input !rounded-[10px] text-sm"
                            value={newPatient.emergencyName}
                            onChange={e => setNewPatient({ ...newPatient, emergencyName: e.target.value })}
                            placeholder="Contato de emergência"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Telefone *</label>
                          <input
                            type="tel"
                            required
                            className="input !rounded-[10px] text-sm"
                            value={newPatient.emergencyPhone}
                            onChange={e => setNewPatient({ ...newPatient, emergencyPhone: formatPhone(e.target.value) })}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Endereço */}
                {addFormTab === "address" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">CEP</label>
                        <input
                          type="text"
                          className="input !rounded-[10px] text-sm"
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
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Endereço</label>
                        <input
                          type="text"
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.street}
                          onChange={e => setNewPatient({ ...newPatient, street: e.target.value })}
                          placeholder="Rua, Avenida..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Número</label>
                        <input
                          type="text"
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.number}
                          onChange={e => setNewPatient({ ...newPatient, number: e.target.value })}
                          placeholder="Nº"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Complemento</label>
                        <input
                          type="text"
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.complement}
                          onChange={e => setNewPatient({ ...newPatient, complement: e.target.value })}
                          placeholder="Apto, Bloco..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Bairro</label>
                        <input
                          type="text"
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.neighborhood}
                          onChange={e => setNewPatient({ ...newPatient, neighborhood: e.target.value })}
                          placeholder="Bairro"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Cidade</label>
                        <input
                          type="text"
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.city}
                          onChange={e => setNewPatient({ ...newPatient, city: e.target.value })}
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">UF</label>
                        <input
                          type="text"
                          className="input !rounded-[10px] text-sm"
                          value={newPatient.state}
                          onChange={e => setNewPatient({ ...newPatient, state: e.target.value.toUpperCase() })}
                          placeholder="SP"
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Scroll Mask Overlay */}
            <div className="pointer-events-none absolute bottom-[72px] left-0 right-0 h-12 bg-gradient-to-t from-[var(--surface)] to-transparent z-10" />

            {/* Footer */}
            <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 z-20">
              <button
                type="button"
                onClick={closeAddModal}
                className="btn btn-secondary !rounded-[12px] !font-sans w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="patient-form"
                disabled={saving || uploading}
                className="btn btn-primary !rounded-[12px] !font-sans min-w-[120px] w-full sm:w-auto"
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
      , document.body)}

      {/* Edit Patient Modal */}
      {editPatient && createPortal(
        <EditPatientModal
          patient={editPatient}
          onClose={closeEditModal}
          onSave={() => {
            closeEditModal();
            loadPatients();
          }}
          setSuccessMessage={setSuccessMessage}
          isClosing={isClosingEdit}
        />
      , document.body)}

        {/* Success Toast */}
        {successMessage && createPortal(
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-up">
          <div className="bg-brand-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-brand-500/50 backdrop-blur-sm">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <p className="text-sm font-bold tracking-tight">{successMessage}</p>
          </div>
        </div>
        , document.body)}
        </div>
        );
        }

function EditPatientModal({ patient, onClose, onSave, setSuccessMessage, isClosing }) {
  const [formData, setFormData] = useState({
    name: patient.name || "",
    email: patient.email || "",
    phone: formatPhone(patient.phone || ""),
    birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : "",
    cpf: formatCPF(patient.cpf || ""),
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
    
    if (!formData.email || !formData.phone) {
      setEditTab("contact");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Contato.");
      return;
    }

    if (!formData.emergencyPhone || !formData.emergencyName) {
      setEditTab("emergency");
      setErrorMessage("Por favor, preencha todos os campos obrigatórios na aba Emergência.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      await api.updatePatient(patient.id, formData);
      closeEditModal();
      setSuccessMessage("Paciente atualizado com sucesso!");
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
    <div className={`fixed inset-0 z-[60] flex items-start pt-[8vh] justify-center p-4 bg-black/50 backdrop-blur-[3px] transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`card w-full max-w-2xl h-[75vh] md:h-[600px] overflow-hidden flex flex-col relative shadow-xl transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="p-6 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Editar Paciente</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Atualize os dados do prontuário</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all" aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-1 bg-[var(--surface-alt)] p-1 rounded-[12px] overflow-x-auto">
            {[
              { id: "identity", label: "Identificação", icon: UserCheck },
              { id: "contact", label: "Contato", icon: Contact },
              { id: "address", label: "Endereço", icon: MapPin },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEditTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] text-xs font-semibold transition-all whitespace-nowrap ${
                  editTab === tab.id
                    ? "bg-[var(--surface)] text-[var(--sage)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                <div className="p-4 bg-[var(--surface-alt)] rounded-xl border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {formData.isActive ? (
                        <div className="w-10 h-10 rounded-full bg-[var(--sage-light)] flex items-center justify-center">
                          <UserCheck size={20} className="text-[var(--sage)]" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center">
                          <UserX size={20} className="text-[var(--text-muted)]" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Status do Paciente</p>
                        <p className="text-xs text-[var(--text-secondary)]">{formData.isActive ? "Ativo no acompanhamento" : "Inativo / Arquivado"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={togglePatientStatus}
                      className={`relative w-14 h-7 rounded-full transition-colors ${formData.isActive ? "bg-[var(--sage)]" : "bg-[var(--border)]"}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${formData.isActive ? "left-8" : "left-1"}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
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
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    className="input !rounded-[10px] text-sm"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome social ou completo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">CPF *</label>
                    <input
                      type="text"
                      required
                      className="input !rounded-[10px] text-sm"
                      value={formData.cpf}
                      onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Nascimento *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-[var(--text-muted)]" />
                      </div>
                      <input
                        type="date"
                        required
                        className="input !rounded-[10px] pl-10"
                        value={formData.birthDate}
                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Gênero</label>
                    <select
                      className="input !rounded-[10px] text-sm"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Estado Civil</label>
                    <select
                      className="input !rounded-[10px] text-sm"
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
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Profissão</label>
                    <input
                      type="text"
                      className="input !rounded-[10px] text-sm"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">E-mail *</label>
                    <input
                      type="email"
                      required
                      className="input !rounded-[10px] text-sm"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Telefone *</label>
                    <input
                      type="tel"
                      required
                      className="input !rounded-[10px] text-sm"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Contato de Emergência</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Nome Emergência *</label>
                      <input
                        type="text"
                        required
                        className="input !rounded-[10px] text-sm"
                        value={formData.emergencyName}
                        onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                        placeholder="Contato de emergência"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Telefone *</label>
                      <input
                        type="tel"
                        required
                        className="input !rounded-[10px] text-sm"
                        value={formData.emergencyPhone}
                        onChange={e => setFormData({ ...formData, emergencyPhone: formatPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editTab === "address" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">CEP</label>
                    <input
                      type="text"
                      className="input !rounded-[10px] text-sm"
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
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Endereço</label>
                    <input
                      type="text"
                      className="input !rounded-[10px] text-sm"
                      value={formData.street}
                      onChange={e => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Rua, Avenida..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Número</label>
                    <input
                      type="text"
                      className="input !rounded-[10px] text-sm"
                      value={formData.number}
                      onChange={e => setFormData({ ...formData, number: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Complemento</label>
                    <input
                      type="text"
                      className="input !rounded-[10px] text-sm"
                      value={formData.complement}
                      onChange={e => setFormData({ ...formData, complement: e.target.value })}
                      placeholder="Apto, Bloco..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Bairro</label>
                    <input
                      type="text"
                      className="input !rounded-[10px] text-sm"
                      value={formData.neighborhood}
                      onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Cidade</label>
                    <input
                      type="text"
                      className="input !rounded-[10px] text-sm"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">UF</label>
                    <input
                      type="text"
                      className="input !rounded-[10px] text-sm"
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
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="py-8 text-center bg-white/50 rounded-xl border border-dashed border-brand-200">
                      <Calendar size={24} className="mx-auto text-brand-300 mb-2" />
                      <p className="text-xs text-brand-600 font-medium">Nenhum horário definido</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((app, idx) => {
                        const conflict = conflicts[app.id];
                        return (
                          <div 
                            key={app.id} 
                            className={`bg-white p-4 rounded-xl border transition-all animate-scale-in shadow-sm ${conflict ? 'border-red-200 bg-red-50/20' : 'border-brand-100'}`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${conflict ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
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

                  <div className="mt-6 pt-6 border-t border-brand-100">
                    <label className="block text-[10px] font-bold text-brand-800 uppercase mb-2">Próxima Sessão (Excepcional)</label>
                    <input
                      type="date"
                      className="input text-xs font-semibold"
                      value={formData.nextSession}
                      onChange={e => setFormData({ ...formData, nextSession: e.target.value })}
                    />
                    <p className="text-[10px] text-brand-600/70 mt-2 font-medium italic">
                      * Use este campo para marcar uma sessão fora do horário fixo habitual.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {editTab === "notes" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Registros Clínicos (Prontuário)</label>
                  <textarea
                    className="input !rounded-[10px] text-sm min-h-[150px]"
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
                    <label className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-all ${uploading ? 'opacity-50' : 'hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700'}`}>
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
                              className="p-1 hover:bg-brand-50 rounded text-slate-400 hover:text-brand-600 transition-colors"
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

        {/* Scroll Mask Overlay */}
        <div className="pointer-events-none absolute bottom-[72px] left-0 right-0 h-12 bg-gradient-to-t from-[var(--surface)] to-transparent z-10" />

        <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 z-20">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-secondary !rounded-[12px] !font-sans w-full sm:w-auto"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="edit-patient-form"
            disabled={saving}
            className="btn btn-primary !rounded-[12px] !font-sans min-w-[120px] w-full sm:w-auto"
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

        {/* Cleanup Selection Modal */}
        {cleanupModal.open && createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setCleanupModal({ ...cleanupModal, open: false })}>
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
        , document.body)}
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

function PatientActionMenu({ patient, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Eleva o z-index do card/linha pai para evitar que o menu fique por baixo de outros elementos
      const parentContainer = menuRef.current?.closest('.group');
      if (parentContainer) parentContainer.style.zIndex = '999';
    } else {
      const parentContainer = menuRef.current?.closest('.group');
      if (parentContainer) parentContainer.style.zIndex = '';
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1.5 rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)] transition-all"
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--surface)] rounded-[12px] shadow-xl border border-[var(--border)] py-1.5 z-50 animate-scale-in">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); onEdit(patient); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)] transition-colors text-left"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); onDelete(patient.id); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
          >
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

const formatShortName = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

function PaginationFooter({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange, transparent = false }) {
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const perPageOptions = [8, 12, 24, 48];

  return (
    <div className={`px-4 py-3 flex items-center justify-between gap-4 ${transparent ? 'bg-transparent border-none' : 'bg-[var(--surface)]'}`}>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[var(--text-muted)] whitespace-nowrap">
          Mostrando <span className="font-semibold text-[var(--text-primary)]">{totalItems === 0 ? 0 : startItem}</span> a <span className="font-semibold text-[var(--text-primary)]">{totalItems === 0 ? 0 : endItem}</span> de <span className="font-semibold text-[var(--text-primary)]">{totalItems}</span> pacientes
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-[var(--text-muted)] hidden sm:block">Exibir:</span>
            <div className="flex items-center gap-0.5 p-0.5 bg-[var(--surface-alt)] rounded-[8px] border border-[var(--border)]">
              {perPageOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => onItemsPerPageChange(opt)}
                  className={`px-2.5 py-1 rounded-[6px] text-[12px] font-semibold transition-colors ${
                    itemsPerPage === opt
                      ? 'bg-[var(--surface)] text-[var(--sage)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalItems === 0 || totalPages <= 1}
          className="p-1.5 rounded-lg border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[13px] font-medium text-[var(--text-primary)] px-2 whitespace-nowrap">
          {totalItems === 0 ? 0 : currentPage} / {totalItems === 0 ? 0 : totalPages}
        </span>
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalItems === 0 || totalPages <= 1}
          className="p-1.5 rounded-lg border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

const getNextAppointmentDate = (appointments) => {
  if (!appointments || appointments.length === 0) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let closestDate = null;
  let minDiff = Infinity;
  for (const app of appointments) {
    if (app.scheduledDate) {
      const d = new Date(app.scheduledDate);
      d.setHours(0,0,0,0);
      if (d >= today && d.getTime() - today.getTime() < minDiff) {
        closestDate = d;
        minDiff = d.getTime() - today.getTime();
      }
    } else if (app.dayOfWeek !== undefined && app.dayOfWeek !== null) {
      const appStart = new Date(app.startDate);
      appStart.setHours(0,0,0,0);
      const appEnd = app.endDate ? new Date(app.endDate) : new Date('2099-12-31');
      let d = new Date(today);
      if (d < appStart) d = new Date(appStart);
      for (let i = 0; i < 7; i++) {
        if (d.getDay() === app.dayOfWeek) break;
        d.setDate(d.getDate() + 1);
      }
      if (d <= appEnd) {
        const dateStr = d.toISOString().split('T')[0];
        let skips = [];
        try {
          skips = Array.isArray(app.skipDates) ? app.skipDates : JSON.parse(app.skipDates || '[]');
        } catch(e) {}
        if (!skips.includes(dateStr)) {
          if (d.getTime() - today.getTime() < minDiff) {
            closestDate = d;
            minDiff = d.getTime() - today.getTime();
          }
        }
      }
    }
  }
  return closestDate;
};

function PatientCard({ patient, onDelete, onEdit }) {
  const sentCount = patient._count?.shareLinks || 0;
  const responseCount = patient._count?.responses || 0;
  const isActive = patient.isActive !== false;
  const attendance = patient.attendanceStats || { presente: 0, falta: 0, justificada: 0 };
  const { days: daysUntilBirthday, isWeek: isBirthdayWeek } = calculateDaysUntilBirthday(patient.birthDate);
  const { initials, color: avatarColor } = getAvatarProps(patient.name);

  // Busca a data do próximo agendamento (da aba Agenda) ou a inserida manualmente no cadastro
  const nextApptDate = getNextAppointmentDate(patient.appointments);
  const rawDate = patient.nextSession || nextApptDate;
  
  const returnDateText = rawDate ? (() => {
    try {
      // Extrai YYYY-MM-DD para evitar recuo de 1 dia pelo fuso horário (UTC-3)
      const parts = typeof rawDate === 'string' ? rawDate.split('T')[0].split('-') : rawDate.toISOString().split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}`;
    } catch(e) {
      return '-';
    }
  })() : '-';

  return (
    <div className={`bg-[var(--bg)] border border-[var(--border)] rounded-[20px] shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full group ${!isActive ? 'opacity-70' : ''} ${isBirthdayWeek ? 'border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : ''} relative`}>
      {isBirthdayWeek && (
        <div className="absolute -top-3 -left-3 w-10 h-10 bg-white rounded-[14px] shadow-xl flex items-center justify-center border border-amber-100 animate-bounce z-40 pointer-events-none">
          <PartyPopper size={20} className="text-amber-500" />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Identity & Actions */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 pointer-events-none">
            <div 
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-extrabold text-[16px] shrink-0 border border-[var(--border)] ${!isActive && !isBirthdayWeek ? 'grayscale opacity-60' : ''}`}
              style={isBirthdayWeek ? { backgroundColor: '#F59E0B', color: 'white' } : { backgroundColor: avatarColor.bg, color: avatarColor.text }}
            >
              {initials}
            </div>
            
            <div className="flex flex-col min-w-0">
              <h3 className="text-[15px] font-semibold tracking-[0.015em] text-[var(--text-primary)] leading-tight truncate mb-1" title={patient.name}>
                {formatShortName(patient.name)}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {patient.birthDate && (
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    {new Date(patient.birthDate).toLocaleDateString('pt-BR')} ({(() => {
                      const today = new Date();
                      const birthDate = new Date(patient.birthDate);
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return age;
                    })()} anos)
                  </span>
                )}
                {patient.birthDate && <span className="text-[11px] text-[var(--text-muted)]">•</span>}
                <span className={`text-[11px] font-extrabold tracking-wider ${isActive ? "text-[var(--sage)]" : "text-slate-400"}`}>
                  {isActive ? "ATIVO" : "INATIVO"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 -mr-2 -mt-1 pointer-events-auto">
            <PatientActionMenu patient={patient} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>

        {/* Quick Summary Grid - Colorful Minimalist */}
        <div className="grid grid-cols-4 gap-1 mt-auto pt-4 border-t border-[var(--border)] pointer-events-none pr-1">
          
          {/* Sessões (Verde) */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-4 h-4 rounded-[5px] bg-[#5CBF90]/15 flex items-center justify-center shrink-0">
                <Check size={10} className="text-[#5CBF90]" />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Sessões</span>
            </div>
            <span className="text-[14px] font-black text-[var(--text-primary)] leading-none pl-0.5">{attendance.presente}</span>
          </div>

          {/* Faltas (Sempre vermelho claro) */}
          <div className="flex flex-col items-start border-l border-[var(--border)] pl-1.5">
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-4 h-4 rounded-[5px] bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                <X size={10} className="text-red-500 dark:text-red-400" />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Faltas</span>
            </div>
            <span className={`text-[14px] font-black leading-none pl-0.5 ${attendance.falta > 0 ? 'text-red-500 dark:text-red-400' : 'text-[var(--text-primary)]'}`}>{attendance.falta}</span>
          </div>

          {/* Formulários (Azul) */}
          <div className="flex flex-col items-start border-l border-[var(--border)] pl-1.5">
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-4 h-4 rounded-[5px] bg-[#2E7DFF]/15 flex items-center justify-center shrink-0">
                <FileText size={10} className="text-[#2E7DFF]" />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Forms</span>
            </div>
            <span className="text-[14px] font-black text-[var(--text-primary)] leading-none pl-0.5">{responseCount} <span className="text-[10px] text-[var(--text-muted)] font-bold">/ {sentCount}</span></span>
          </div>

          {/* Retorno (Roxo) */}
          <div className="flex flex-col items-start border-l border-[var(--border)] pl-1.5">
            <div className="flex items-center gap-1 mb-1.5">
              <div className="w-4 h-4 rounded-[5px] bg-[#7C5CFF]/15 flex items-center justify-center shrink-0">
                <Calendar size={10} className="text-[#7C5CFF]" />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Retorno</span>
            </div>
            <span className="text-[14px] font-black text-[var(--text-primary)] leading-tight pl-0.5">{returnDateText}</span>
          </div>

        </div>
      </div>

      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-alt)]/30 rounded-b-[24px] relative z-20 pointer-events-auto mt-auto">
        <Link
          to={`/patients/${patient.id}`}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--surface)] text-[12px] font-bold text-[var(--text-secondary)] rounded-[12px] border border-[var(--border)] hover:bg-[var(--sage)] hover:text-white hover:border-[var(--sage)] transition-colors duration-200 group/btn shadow-sm"
        >
          Acessar Prontuário
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

function PatientListRow({ patient, onDelete, onEdit, isLast }) {
  const sentCount = patient._count?.shareLinks || 0;
  const responseCount = patient._count?.responses || 0;
  const isActive = patient.isActive !== false;
  const { days: daysUntilBirthday, isWeek: isBirthdayWeek } = calculateDaysUntilBirthday(patient.birthDate);
  const attendance = patient.attendanceStats || { presente: 0, falta: 0, justificada: 0 };
  const { initials, color: avatarColor } = getAvatarProps(patient.name);

  // Calcula retorno igual ao card
  const nextApptDate = getNextAppointmentDate(patient.appointments);
  const rawDate = patient.nextSession || nextApptDate;
  const returnDateText = rawDate ? (() => {
    try {
      const parts = typeof rawDate === 'string' ? rawDate.split('T')[0].split('-') : rawDate.toISOString().split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}`;
    } catch(e) {
      return '-';
    }
  })() : '-';

  return (
    <div className={`relative px-5 py-3.5 flex items-center gap-4 transition-colors duration-150 ease-out group first:rounded-t-[24px] last:rounded-b-[24px] ${!isLast ? 'border-b border-[var(--border)]' : ''} ${!isActive ? 'opacity-70 grayscale' : ''} hover:bg-[var(--surface-alt)]`}>
      
      {/* Invisible link overlay for the whole row */}
      <Link to={`/patients/${patient.id}`} className="absolute inset-0 z-0" />

      {/* Avatar Padronizado */}
      <div className="relative z-10 pointer-events-none shrink-0">
        <div 
          className={`w-9 h-9 rounded-[10px] flex items-center justify-center font-extrabold text-[13px] transition-transform group-hover:scale-105 border border-[var(--border)] ${!isActive && !isBirthdayWeek ? 'grayscale opacity-60' : ''}`}
          style={isBirthdayWeek ? { backgroundColor: '#F59E0B', color: 'white' } : { backgroundColor: avatarColor.bg, color: avatarColor.text }}
        >
          {isBirthdayWeek ? <PartyPopper size={14} /> : initials}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center relative z-10 pointer-events-none">
        
        {/* Name & Identity */}
        <div className="sm:col-span-5 flex flex-col min-w-0 justify-center">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-semibold text-[15px] tracking-[0.015em] truncate text-[var(--text-primary)] group-hover:text-[var(--sage)] transition-colors">
              {patient.name}
            </h4>
            {daysUntilBirthday !== null && (
              <span className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[9px] font-extrabold uppercase border ${isBirthdayWeek ? 'bg-amber-500 text-white border-amber-400 shadow-sm animate-pulse' : 'bg-transparent text-[var(--text-muted)] border-[var(--border)]'}`}>
                <CakeSlice size={10} />
                {typeof daysUntilBirthday === 'string' ? (daysUntilBirthday === "Hoje! 🎂" ? 'Niver Hoje!' : daysUntilBirthday) : `Em ${daysUntilBirthday}d`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {patient.birthDate && (
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {new Date(patient.birthDate).toLocaleDateString('pt-BR')} ({(() => {
                  const today = new Date();
                  const birthDate = new Date(patient.birthDate);
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  return age;
                })()} anos)
              </span>
            )}
            {patient.birthDate && <span className="text-[11px] text-[var(--text-muted)]">•</span>}
            <span className={`text-[11px] font-extrabold tracking-wider ${isActive ? "text-[var(--sage)]" : "text-slate-400"}`}>
              {isActive ? "ATIVO" : "INATIVO"}
            </span>
          </div>
        </div>

        {/* Stats - Premium Data Grid */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 sm:col-span-6 gap-2 text-[12px]">
          
          {/* Sessões */}
          <div className="flex flex-col justify-center">
             <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">Sessões</span>
             <span className="text-[var(--text-primary)] font-black text-[14px]">{attendance.presente}</span>
          </div>
          
          {/* Faltas */}
          <div className="flex flex-col justify-center border-l border-[var(--border)] pl-3">
             <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">Faltas</span>
             {attendance.falta > 0 ? (
               <span className="text-red-500 font-black bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-[6px] self-start inline-flex items-center gap-1 text-[14px] leading-none">
                 <X size={12} />
                 {attendance.falta}
               </span>
             ) : (
               <span className="text-[var(--text-muted)] font-black text-[14px]">0</span>
             )}
          </div>

          {/* Forms */}
          <div className="flex flex-col justify-center border-l border-[var(--border)] pl-3">
             <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">Forms</span>
             <span className="text-[var(--text-primary)] font-black text-[14px]">{responseCount} <span className="text-[10px] text-[var(--text-muted)] font-bold">/ {sentCount}</span></span>
          </div>

          {/* Retorno */}
          <div className="flex flex-col justify-center border-l border-[var(--border)] pl-3">
             <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-0.5">Retorno</span>
             <span className="text-[var(--text-primary)] font-black text-[14px]">{returnDateText}</span>
          </div>
        </div>
      </div>

      {/* Action Menu */}
      <div className="shrink-0 flex items-center justify-end relative z-10 pointer-events-auto pr-1 sm:pl-4">
        <PatientActionMenu patient={patient} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
