import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { ResponseTrendChart } from "../components/ClinicalCharts";
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Eye,
  Trash2, 
  Copy, 
  Search,
  BookTemplate,
  MoreVertical
} from "lucide-react";

export default function MyForms() {
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
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
    if (!confirm("Tem certeza que deseja excluir este formulário?")) return;
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
    <div className="p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-950">Meus Formulários</h1>
          <p className="text-brand-500 mt-2">Gerencie seus modelos personalizados e colete respostas.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/library" className="btn btn-secondary">
            <BookTemplate size={18} />
            Biblioteca
          </Link>
          <Link to="/forms/new" className="btn btn-primary">
            <Plus size={18} />
            Novo Formulário
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
          <input
            type="text"
            placeholder="Buscar formulários..."
            className="input pl-10 bg-white border-brand-100 focus:border-brand-950"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-brand-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-brand-100 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-8 bg-brand-100 rounded w-20" />
                <div className="h-8 bg-brand-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="card p-20 text-center border-dashed border-2">
          <FileText size={48} className="mx-auto text-brand-200 mb-6" />
          <h3 className="text-xl font-semibold text-brand-950 mb-2">
            {searchQuery ? "Nenhum formulário encontrado" : "Nenhum formulário criado"}
          </h3>
          <p className="text-brand-500 mb-8 max-w-sm mx-auto">
            {searchQuery ? "Tente um termo de busca diferente" : "Comece criando seu primeiro formulário clínico personalizado."}
          </p>
          {!searchQuery && (
            <Link to="/forms/new" className="btn btn-primary">
              <Plus size={18} />
              Criar Primeiro Formulário
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      )}

      {/* Share Modal - Reuse existing logic */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-brand-950">Links de Compartilhamento</h2>
                <p className="text-xs text-brand-500 mt-1">{selectedForm?.title}</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-brand-400 hover:text-brand-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            {/* Existing Links */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-brand-950 uppercase tracking-wider">
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
                <div className="text-center py-8 text-brand-400">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-950 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-xs">Carregando links...</p>
                </div>
              ) : existingLinks.length === 0 ? (
                <div className="text-center py-8 bg-brand-50 rounded-lg border border-brand-100">
                  <Share2 size={32} className="mx-auto text-brand-300 mb-2" />
                  <p className="text-sm text-brand-500">Nenhum link criado ainda</p>
                  <p className="text-xs text-brand-400 mt-1">Clique em "Novo Link" para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {existingLinks.map(link => {
                    const shareUrl = `${window.location.origin}/share/${link.token}`;
                    const isActive = link.active && (!link.expiresAt || new Date(link.expiresAt) > new Date());
                    
                    return (
                      <div key={link.id} className={`p-4 rounded-lg border transition-all ${isActive ? 'bg-white border-brand-100 hover:border-brand-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span className="text-xs font-medium text-brand-950">
                                {isActive ? "Ativo" : "Inativo"}
                              </span>
                              {link.patient && (
                                <span className="text-[10px] px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-medium">
                                  {link.patient.name}
                                </span>
                              )}
                              {link.expiresAt && (
                                <span className="text-[10px] text-brand-400 ml-auto">
                                  Expira em {new Date(link.expiresAt).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-brand-400">
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

            {/* Create New Link Form */}
            {showCreateForm && (
              <div className="border-t border-brand-100 pt-6 animate-fade-in">
                <h3 className="text-sm font-bold text-brand-950 uppercase tracking-wider mb-4">
                  Criar Novo Link
                </h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const result = await api.createShareLink({
                      formId: selectedForm.id,
                      ...shareData,
                    });
                    const absoluteUrl = result.shareUrl.startsWith("http")
                      ? result.shareUrl
                      : `${window.location.origin}${result.shareUrl}`;
                    await navigator.clipboard.writeText(absoluteUrl);
                    alert("Link criado e copiado!");
                    setShowCreateForm(false);
                    setShareData({ patientId: "", expiresAt: "" });
                    loadExistingLinks(selectedForm.id);
                    loadData();
                  } catch (error) {
                    alert(error.message);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1">Vincular a Paciente (Opcional)</label>
                    <select
                      className="input"
                      value={shareData.patientId}
                      onChange={(e) => setShareData({ ...shareData, patientId: e.target.value })}
                    >
                      <option value="">Selecionar paciente...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1">Data de Expiração (Opcional)</label>
                    <input
                      type="date"
                      className="input"
                      value={shareData.expiresAt}
                      onChange={(e) => setShareData({ ...shareData, expiresAt: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary flex-1">
                      Gerar e Copiar Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn btn-ghost"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormCard({ form, stats, onDelete, onDuplicate, aggregateData }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full bg-white overflow-hidden border-brand-100/50">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-950 group-hover:bg-brand-950 group-hover:text-white transition-colors duration-300 shadow-sm">
            <FileText size={24} />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-xl text-brand-400 hover:text-brand-950 hover:bg-brand-50 transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            
            {showOptions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowOptions(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-100 rounded-2xl shadow-xl z-20 py-2 animate-scale-in">
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
          <h3 className="text-xl font-bold text-brand-950 group-hover:text-brand-800 transition-colors line-clamp-2 min-h-[3.5rem] leading-tight">
            {form.title}
          </h3>
          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-1">
            Atualizado em {new Date(form.updatedAt).toLocaleDateString('pt-BR')}
          </p>
        </Link>

        {aggregateData && Object.keys(aggregateData).length > 2 ? (
          <div className="mt-6 h-16 opacity-60">
            <ResponseTrendChart data={aggregateData} title="" height={64} />
          </div>
        ) : (
          <div className="mt-6 h-16 flex items-center justify-center border border-dashed border-brand-100 rounded-xl bg-brand-50/30">
            <p className="text-[10px] font-bold text-brand-300 uppercase tracking-tighter">Sem atividade recente</p>
          </div>
        )}

        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-brand-50">
          <div className="flex flex-col">
            <span className="text-lg font-black text-brand-950 leading-none">{stats?.responseCount || 0}</span>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-1">Respostas</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-brand-950 leading-none">{stats?.shareLinkCount || 0}</span>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-1">Links</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-brand-50/50 border-t border-brand-50 flex items-center justify-between gap-3">
        <Link 
          to={`/forms/${form.id}/preview`}
          className="btn btn-secondary text-xs flex-1 font-bold h-10 border-transparent hover:border-brand-200 shadow-sm"
        >
          <Eye size={14} />
          Visualizar
        </Link>
        <Link 
          to={`/forms/${form.id}/responses`}
          className="btn btn-primary text-xs flex-1 font-bold h-10 shadow-lg shadow-brand-950/10"
        >
          <BarChart3 size={14} />
          Resultados
        </Link>
      </div>
    </div>
  );
}
