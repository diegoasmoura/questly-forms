import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      alert("Modelo adicionado aos seus formulários!");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Biblioteca Clínica</h1>
          <p className="text-sm text-slate-500">Explore e utilize modelos validados por especialistas.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar na biblioteca..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => handleViewMode("grid")}
            className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
            title="Visualização em cards"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => handleViewMode("list")}
            className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"}`}
            title="Visualização em lista"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Template Grid */}
      {viewMode === "grid" ? (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id} 
                className="card group hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                      <BookTemplate size={24} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      Premium
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-700 mb-2 group-hover:text-emerald-600 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {template.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-[10px] font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Avaliação</span>
                    <span className="text-[10px] font-medium px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">Validado</span>
                    <span className="text-[10px] font-medium px-2 py-1 bg-purple-50 text-purple-600 rounded-full">Adulto</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
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
            <div className="card border-dashed border-2 border-slate-200 bg-slate-50 flex flex-col justify-center items-center p-8 text-center opacity-70 hover:opacity-100 transition-opacity min-h-[200px]">
              <CheckCircle2 size={32} className="text-slate-400 mb-4" />
              <h3 className="font-semibold text-slate-600">Precisa de outro modelo?</h3>
              <p className="text-xs text-slate-400 mt-2">
                Estamos sempre adicionando novos protocolos.
              </p>
              <button className="btn btn-secondary text-xs mt-4">Sugerir Protocolo</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
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
          <div className="card border-dashed border-2 border-slate-300 bg-transparent flex items-center justify-center p-6 text-center opacity-70 hover:opacity-100 transition-opacity">
            <CheckCircle2 size={20} className="text-slate-300 mr-3" />
            <span className="text-sm text-slate-500">
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
    <div className="card p-4 flex items-center gap-4 hover:border-slate-300 transition-all">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-700">
        <BookTemplate size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-slate-900 truncate">{template.title}</h4>
          <span className="text-[10px] font-semibold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Premium</span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500 line-clamp-1">{template.description}</p>
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
