import { useState } from "react";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { api } from "../lib/api";
import { clinicalTemplates } from "../lib/templates";
import { 
  Search, 
  BookTemplate, 
  Plus, 
  Eye, 
  CheckCircle2,
  LayoutGrid,
  List,
  Loader2
} from "lucide-react";

export default function Library() {
  const navigate = useNavigateWithTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("library-view") || "grid");
  const [previewingId, setPreviewingId] = useState(null);

  const handleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("library-view", mode);
  };

  const handlePreview = async (template) => {
    setPreviewingId(template.id);
    try {
      const newForm = await api.createForm({
        title: template.title,
        schema: template.schema,
        source: "template",
        type: "Avaliação"
      });
      navigate(`/forms/${newForm.id}/preview`);
    } catch (error) {
      console.error("Erro ao visualizar template:", error);
      alert("Erro ao abrir visualização");
    } finally {
      setPreviewingId(null);
    }
  };

  const handleImportTemplate = async (template) => {
    setImporting(template.id);
    try {
      await api.createForm({
        title: template.title,
        schema: template.schema,
        source: "template",
        code: template.code || null,
        type: template.type || "Avaliação",
        validated: true,
        audiences: template.audiences || ["Adulto"]
      });
      alert("Modelo adicionado aos seus instrumentos!");
      navigate("/my-forms");
    } catch (error) {
      alert("Falha ao importar modelo: " + error.message);
    } finally {
      setImporting(null);
    }
  };

  const filteredTemplates = clinicalTemplates.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden animate-fade-in">

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Buscar instrumentos..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-[var(--surface-alt)] p-1 rounded-[14px] border border-[var(--border)] shadow-sm">
          <button
            onClick={() => handleViewMode("grid")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[10px] transition-all ${
              viewMode === "grid" 
                ? "bg-[var(--sage)] text-white shadow-sm" 
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
            }`}
          >
            <LayoutGrid size={18} />
            <span className="text-xs font-bold">Cards</span>
          </button>
          <button
            onClick={() => handleViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[10px] transition-all ${
              viewMode === "list" 
                ? "bg-[var(--sage)] text-white shadow-sm" 
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
            }`}
          >
            <List size={18} />
            <span className="text-xs font-bold">Lista</span>
          </button>
        </div>
      </div>

      {/* Template Grid */}
      {viewMode === "grid" ? (
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id} 
                className="card group hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 flex flex-col overflow-hidden"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-[14px] bg-[var(--sage-light)] flex items-center justify-center text-[var(--dark-green)] dark:text-[var(--sage)] group-hover:bg-[var(--sage)] group-hover:text-white transition-colors duration-200">
                      <BookTemplate size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--dark-green)] dark:text-[var(--sage)] bg-[var(--sage-light)] px-2.5 py-1 rounded-[6px]">
                      Premium
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--sage)] transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    {template.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-[var(--blue-light)] text-[var(--blue)] rounded-[6px]">Avaliação</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[var(--sage)] rounded-[6px]">Validado</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-[var(--purple-light)] text-[var(--purple)] rounded-[6px]">Adulto</span>
                  </div>
                </div>

                <div className="p-4 bg-[var(--surface-alt)]/30 border-t border-[var(--border)] flex items-center justify-between gap-3">
                  <button 
                    className="btn btn-secondary text-xs flex-1"
                    onClick={() => handlePreview(template)}
                    disabled={previewingId === template.id}
                  >
                    {previewingId === template.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Eye size={14} />
                    )}
                    Visualizar
                  </button>
                  <button 
                    onClick={() => handleImportTemplate(template)}
                    disabled={importing === template.id}
                    className="btn btn-primary text-xs flex-1"
                  >
                    {importing === template.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus size={14} />
                        Adicionar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}

            {/* Suggestion Card */}
            <div className="card border-dashed border-2 border-[var(--border)] bg-[var(--surface-alt)]/30 flex flex-col justify-center items-center p-8 text-center opacity-70 hover:opacity-100 transition-all min-h-[200px]">
              <CheckCircle2 size={32} className="text-[var(--text-muted)] mb-4" />
              <h3 className="font-bold text-[var(--text-primary)]">Precisa de outro modelo?</h3>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Estamos sempre adicionando novos protocolos.
              </p>
              <button className="btn btn-secondary text-xs mt-4">Sugerir Protocolo</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar">
          {filteredTemplates.map((template) => (
            <LibraryListRow
              key={template.id}
              template={template}
              importing={importing}
              previewing={previewingId === template.id}
              onImport={handleImportTemplate}
              onPreview={() => handlePreview(template)}
            />
          ))}
          <div className="card border-dashed border-2 border-[var(--border)] bg-transparent flex items-center justify-center p-6 text-center opacity-70 hover:opacity-100 transition-all">
            <CheckCircle2 size={20} className="text-[var(--text-muted)] mr-3" />
            <span className="text-sm font-bold text-[var(--text-secondary)]">
              Precisa de outro modelo? Entre em contato.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LibraryListRow({ template, importing, previewing, onImport, onPreview }) {
  return (
    <div className="card p-4 flex items-center gap-4 hover:bg-[var(--surface-alt)] transition-all">
      <button 
        onClick={onPreview}
        disabled={previewing}
        className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[var(--sage)] hover:opacity-90 transition-all"
      >
        <BookTemplate size={20} />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <button 
            onClick={onPreview}
            disabled={previewing}
            className="group/name block min-w-0 text-left"
          >
            <h4 className="font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--sage)] transition-colors">
              {template.title}
            </h4>
          </button>
          <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-[6px]">Premium</span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{template.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={onPreview}
          disabled={previewing}
          className="btn btn-secondary py-2 px-3 text-xs"
        >
          {previewing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Eye size={14} />
          )}
        </button>
        <button 
          onClick={() => onImport(template)}
          disabled={importing === template.id}
          className="btn btn-primary py-2 px-3 text-xs"
        >
          {importing === template.id ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus size={14} />
              Adicionar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
