import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { api } from "../lib/api";
import { ResponseTrendChart } from "../components/ClinicalCharts";
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Eye,
  Pencil,
  Trash2, 
  Copy, 
  Search,
  BookTemplate,
  MoreVertical,
  LayoutGrid,
  List
} from "lucide-react";

export default function MyForms() {
  const navigate = useNavigateWithTransition();
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [patients, setPatients] = useState([]);
  const [aggregateData, setAggregateData] = useState({});
  const [shareData, setShareData] = useState({
    patientId: "",
    expiresAt: ""
  });
  const [existingLinks, setExistingLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("myforms-view") || "grid");

  const handleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("myforms-view", mode);
  };

  useEffect(() => {
    loadData();
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    }
  };

  const loadExistingLinks = async (formId) => {
    setLoadingLinks(true);
    try {
      const links = await api.getShareLinks(formId);
      setExistingLinks(links);
    } catch (error) {
      console.error("Failed to load links:", error);
    } finally {
      setLoadingLinks(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const formsData = await api.getForms();
      setForms(formsData);
      const statsMap = {};
      const aggregateMap = {};
      for (const form of formsData) {
        try {
          const statsData = await api.getFormStats(form.id);
          statsMap[form.id] = statsData;
          
          try {
            const aggData = await api.getAggregate(form.id);
            if (aggData?.dailyCounts && Object.keys(aggData.dailyCounts).length > 0) {
              aggregateMap[form.id] = aggData.dailyCounts;
            }
          } catch (e) {}
        } catch {
          statsMap[form.id] = { responseCount: 0, shareLinkCount: 0 };
        }
      }
      setStats(statsMap);
      setAggregateData(aggregateMap);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este instrumento?")) return;
    try {
      await api.deleteForm(id);
      setForms(forms.filter((f) => f.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const newForm = await api.duplicateForm(id);
      setForms([newForm, ...forms]);
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredForms = forms.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 font-heading">Meus Instrumentos</h1>
          <p className="text-sm text-slate-500">Gerencie seus modelos personalizados.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/library" className="btn btn-secondary text-xs">
            <BookTemplate size={16} />
            Biblioteca
          </Link>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary text-xs">
            <Plus size={16} />
            Novo
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar instrumentos..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => handleViewMode("grid")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
          >
            <LayoutGrid size={18} />
            <span className="text-xs font-bold">Cards</span>
          </button>
          <button
            onClick={() => handleViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
          >
            <List size={18} />
            <span className="text-xs font-bold">Lista</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-12 w-12 bg-slate-200 rounded-2xl mb-6" />
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                  <div className="h-16 bg-slate-50 rounded-xl border border-dashed border-slate-200" />
                  <div className="flex gap-6 mt-6 pt-6 border-t border-slate-100">
                    <div className="h-8 w-12" />
                    <div className="h-8 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-brand-50 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 bg-brand-100 rounded w-1/3 mb-2" />
                      <div className="h-4 bg-brand-50 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )
      ) : filteredForms.length === 0 ? (
        <div className="card p-20 text-center border-dashed border-2 border-slate-200">
          <FileText size={48} className="mx-auto text-slate-300 mb-6" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {searchQuery ? "Nenhum instrumento encontrado" : "Nenhum instrumento criado"}
          </h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            {searchQuery ? "Tente um termo de busca diferente" : "Comece criando seu primeiro instrumento clínico personalizado."}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={18} />
              Criar Primeiro Instrumento
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredForms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              stats={stats[form.id]}
              aggregateData={aggregateData[form.id]}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredForms.map((form) => (
            <FormListRow
              key={form.id}
              form={form}
              stats={stats[form.id]}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
      </div>

      {/* Create Form Modal */}
      {showCreateModal && (
        <CreateFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(formId) => {
            setShowCreateModal(false);
            navigate(`/forms/${formId}/edit`);
          }}
        />
      )}

      {/* Share Modal - Reuse existing logic */}
      {showShareModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Links de Envio</h2>
                <p className="text-xs text-brand-600 mt-1">{selectedForm?.title}</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-brand-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            {/* Existing Links */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Links Existentes ({existingLinks.length})
                </h3>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn btn-primary text-xs"
                >
                  <Plus size={14} />
                  Novo Link
                </button>
              </div>

              {loadingLinks ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-xs">Carregando links...</p>
                </div>
              ) : existingLinks.length === 0 ? (
                <div className="text-center py-8 bg-brand-50 rounded-lg border border-brand-100">
                  <Share2 size={32} className="mx-auto text-brand-300 mb-2" />
                  <p className="text-sm text-brand-600">Nenhum link criado ainda</p>
                  <p className="text-xs text-slate-400 mt-1">Clique em "Novo Link" para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {existingLinks.map(link => {
                    const shareUrl = `${window.location.origin}/share/${link.token}`;
                    const isActive = link.active && (!link.expiresAt || new Date(link.expiresAt) > new Date());
                    
                    return (
                      <div key={link.id} className={`p-4 rounded-lg border transition-all ${isActive ? 'card-bone border-brand-100 hover:border-brand-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-brand-500' : 'bg-gray-400'}`} />
                              <span className="text-xs font-medium text-slate-900">
                                {isActive ? "Ativo" : "Inativo"}
                              </span>
                              {link.patient && (
                                <span className="text-[10px] px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full font-medium">
                                  {link.patient.name}
                                </span>
                              )}
                              {link.expiresAt && (
                                <span className="text-[10px] text-slate-400 ml-auto">
                                  Expira em {new Date(link.expiresAt).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Criado em {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            className="input flex-1 bg-brand-50 font-mono text-[10px] py-1.5"
                            value={shareUrl}
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              alert("Link copiado!");
                            }}
                            className="btn btn-secondary text-[10px] py-1.5 px-3"
                          >
                            Copiar
                          </button>
                          {isActive && (
                            <button
                              onClick={async () => {
                                if (!confirm("Revogar este link?")) return;
                                try {
                                  await api.revokeShareLink(link.id);
                                  loadExistingLinks(selectedForm.id);
                                  loadData();
                                } catch (error) {
                                  alert("Erro ao revogar: " + error.message);
                                }
                              }}
                              className="btn btn-ghost text-[10px] py-1.5 px-3 text-red-600 hover:bg-red-50"
                            >
                              Revogar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormListRow({ form, stats, onDelete, onDuplicate }) {
  const [showOptions, setShowOptions] = useState(false);

  const typeColors = {
    "Avaliação": "bg-blue-50 text-blue-600",
    "Anamnese": "bg-purple-50 text-purple-600",
    "Evolução": "bg-amber-50 text-amber-600",
    "Rastreamento": "bg-cyan-50 text-cyan-600"
  };

  const isTemplate = form.source === "template";

  return (
    <div className="card p-4 flex items-center gap-4 hover:border-brand-200 transition-all">
      <Link to={`/forms/${form.id}/edit`} className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isTemplate ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-brand-50 text-slate-900 hover:bg-brand-100"}`}>
        {isTemplate ? <BookTemplate size={20} /> : <FileText size={20} />}
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link to={`/forms/${form.id}/edit`} className="group/name block min-w-0 truncate">
            <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
              {form.title}
            </h4>
          </Link>
          {isTemplate && <span className="text-[10px] font-bold uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Premium</span>}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400">
            Atualizado em {new Date(form.updatedAt).toLocaleDateString('pt-BR')}
          </p>
          {form.type && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColors[form.type] || 'bg-gray-50 text-gray-600'}`}>
              {form.type}
            </span>
          )}
          {form.validated && (
            <span className="text-[10px] font-medium px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full">Validado</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-slate-900">{stats?.responseCount || 0}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Respostas</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-slate-900">{stats?.shareLinkCount || 0}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Links</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to={`/forms/${form.id}/preview`} className="btn btn-secondary py-2 px-3 text-xs" title="Visualizar">
          <Eye size={14} />
        </Link>
        <Link to={`/forms/${form.id}/edit`} className="btn btn-secondary py-2 px-3 text-xs" title="Editar">
          <Pencil size={14} />
        </Link>
        <Link to={`/forms/${form.id}/responses`} className="btn btn-primary py-2 px-3 text-xs" title="Ver Resultados">
          <BarChart3 size={14} />
        </Link>
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-brand-50 transition-colors"
            title="Mais opções"
          >
            <MoreVertical size={18} />
          </button>
          {showOptions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
              <div className="absolute right-0 mt-2 w-48 card-bone border border-brand-100 rounded-xl shadow-lg z-20 py-2">
                <button onClick={() => { onDuplicate(form.id); setShowOptions(false); }} className="w-full px-4 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50 flex items-center gap-3">
                  <Copy size={16} /> Duplicar
                </button>
                <div className="my-1 border-t border-brand-50" />
                <button onClick={() => { onDelete(form.id); setShowOptions(false); }} className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3">
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FormCard({ form, stats, onDelete, onDuplicate, aggregateData }) {
  const [showOptions, setShowOptions] = useState(false);

  const typeColors = {
    "Avaliação": "bg-blue-50 text-blue-600",
    "Anamnese": "bg-purple-50 text-purple-600",
    "Evolução": "bg-amber-50 text-amber-600",
    "Rastreamento": "bg-cyan-50 text-cyan-600"
  };

  const isTemplate = form.source === "template";

  return (
    <div className="card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full card-bone overflow-hidden border-brand-100/50">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
              isTemplate 
                ? "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white" 
                : "bg-brand-50 text-slate-900 group-hover:bg-brand-900 group-hover:text-white"
            }`}>
              {isTemplate ? <BookTemplate size={24} /> : <FileText size={24} />}
            </div>
            {isTemplate && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                Premium
              </span>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-brand-50 transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            
            {showOptions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowOptions(false)}
                />
                <div className="absolute right-0 mt-2 w-48 card-bone border border-brand-100 rounded-2xl shadow-xl z-20 py-2 animate-scale-in">
                  <button 
                    onClick={() => { onDuplicate(form.id); setShowOptions(false); }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50 flex items-center gap-3 transition-colors"
                  >
                    <Copy size={16} />
                    Duplicar
                  </button>
                  <div className="my-1 border-t border-brand-50" />
                  <button 
                    onClick={() => { onDelete(form.id); setShowOptions(false); }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <Link to={`/forms/${form.id}/edit`} className="block mb-2 group/title" title={form.title}>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
            {form.title}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Atualizado em {new Date(form.updatedAt).toLocaleDateString('pt-BR')}
          </p>
        </Link>

        <div className="mt-6 flex flex-wrap gap-2">
          {form.type && (
            <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${typeColors[form.type] || 'bg-gray-50 text-gray-600'}`}>
              {form.type}
            </span>
          )}
          {form.validated && (
            <span className="text-[10px] font-medium px-2 py-1 bg-brand-50 text-brand-600 rounded-full">Validado</span>
          )}
          {form.audiences && form.audiences.length > 0 && (
            <span className="text-[10px] font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
              {form.audiences.join(" · ")}
            </span>
          )}
        </div>

        {aggregateData && Object.keys(aggregateData).length > 2 ? (
          <div className="mt-6 h-16 opacity-60">
            <ResponseTrendChart data={aggregateData} title="" height={64} />
          </div>
        ) : (
          <div className="mt-6 h-16 flex items-center justify-center border border-dashed border-blue-200 rounded-xl bg-blue-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Sem atividade recente</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-brand-50/50 border-t border-brand-50 flex items-center justify-between gap-2">
        <Link 
          to={`/forms/${form.id}/preview`}
          className="btn btn-secondary text-xs flex-1"
        >
          <Eye size={14} />
          Visualizar
        </Link>
        <Link 
          to={`/forms/${form.id}/edit`}
          className="btn btn-secondary text-xs flex-1"
        >
          <Pencil size={14} />
          Editar
        </Link>
        <Link 
          to={`/forms/${form.id}/responses`}
          className="btn btn-primary text-xs flex-1"
        >
          <BarChart3 size={14} />
          Resultados
        </Link>
      </div>
    </div>
  );
}

function CreateFormModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    type: "Avaliação",
    validated: false,
    audiences: ["Adulto"]
  });
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const typeOptions = ["Avaliação", "Anamnese", "Evolução", "Rastreamento"];

  const typePrefixes = {
    "Avaliação": "AVAL",
    "Anamnese": "ANAM",
    "Evolução": "EVOL",
    "Rastreamento": "RAST"
  };

  const audienceOptions = [
    { label: "Adulto", value: "Adulto", suffix: "ADULTO" },
    { label: "Adolesc.", value: "Adolesc.", suffix: "ADOL" },
    { label: "Infantil", value: "Infantil", suffix: "INF" }
  ];

  const audienceSuffixes = {
    "Adulto": "ADULTO",
    "Adolesc.": "ADOL",
    "Infantil": "INF"
  };

  const generateCode = () => {
    const prefix = typePrefixes[formData.type] || "FORM";
    const { audiences } = formData;
    
    let suffix;
    if (audiences.length === 3) {
      suffix = "TODOS";
    } else if (audiences.length === 0) {
      suffix = "ADULTO";
    } else {
      suffix = audiences.map(a => audienceSuffixes[a] || a).join("+");
    }
    return `${prefix}-${suffix}`;
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      code: `${typePrefixes[type]}-${generateAudienceSuffix(prev.audiences)}`
    }));
  };

  const generateAudienceSuffix = (audiences) => {
    if (audiences.length === 3) return "TODOS";
    if (audiences.length === 0) return "ADULTO";
    return audiences.map(a => audienceSuffixes[a] || a).join("+");
  };

  const toggleAudience = (audience) => {
    setFormData(prev => {
      const newAudiences = prev.audiences.includes(audience)
        ? prev.audiences.filter(a => a !== audience)
        : [...prev.audiences, audience];
      
      // Ensure at least one is selected
      if (newAudiences.length === 0) {
        return prev;
      }
      
      return {
        ...prev,
        audiences: newAudiences,
        code: `${typePrefixes[prev.type]}-${generateAudienceSuffix(newAudiences)}`
      };
    });
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({ ...prev, title }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setNameError("Digite um nome para o instrumento");
      return;
    }
    setNameError("");

    setSaving(true);
    try {
      const finalCode = formData.code || generateCode();
      const fullTitle = finalCode 
        ? `${finalCode}: ${formData.title}`
        : formData.title;
      
      const result = await api.createForm({ 
        title: fullTitle,
        code: finalCode,
        type: formData.type,
        validated: formData.validated,
        audiences: formData.audiences,
        schema: {
          title: formData.title,
          pages: [{ title: "Seção 1", questions: [] }]
        }
      });
      onCreated(result.id);
    } catch (error) {
      alert("Erro ao criar instrumento: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-xl p-8 animate-scale-in">
        <div className="flex items-center justify-between mb-8 bg-white pb-4 border-b border-brand-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Novo Instrumento</h2>
            <p className="text-sm text-brand-600 mt-1">Defina as informações básicas do seu instrumento.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-brand-50 text-slate-400 hover:text-slate-900 transition-all">
            <Plus size={28} className="rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">
              Identificação
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">
                  Nome do Instrumento *
                </label>
                <input
                  type="text"
                  className={`input ${nameError ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""}`}
                  placeholder="Ex: Questionário de Ansiedade Generalizada"
                  value={formData.title}
                  onChange={(e) => {
                    handleTitleChange(e);
                    if (nameError) setNameError("");
                  }}
                />
                {nameError && (
                  <p className="text-xs text-red-500 mt-1">{nameError}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">
                  Código (Sigla)
                </label>
                <input
                  type="text"
                  className="input font-mono bg-slate-50 text-slate-500 cursor-default"
                  value={generateCode()}
                  disabled
                  readOnly
                />
                <p className="text-[10px] text-slate-400 mt-1">Gerado automaticamente</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">
              Classificação *
            </label>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    formData.type === type
                      ? "bg-brand-500 text-white shadow-lg"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">
              Público-alvo
            </label>
            <div className="flex gap-2">
              {audienceOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleAudience(opt.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    formData.audiences.includes(opt.value)
                      ? "bg-brand-500 text-white shadow-lg"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {formData.audiences.length === 3 ? "Todos selecionados" : `${formData.audiences.length} de 3 selecionados`}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.validated}
                onChange={(e) => setFormData(prev => ({ ...prev, validated: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-slate-700">Instrumento validado cientificamente</span>
            </label>
            <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
              Marque se o instrumento possui validação acadêmica publicada
            </p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1 py-4 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1 py-4 font-bold shadow-xl shadow-brand-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando...
                </div>
              ) : (
                <>
                  <Plus size={16} />
                  Criar e Editar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
