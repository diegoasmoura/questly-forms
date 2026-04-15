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
  Filter,
  ArrowLeft
} from "lucide-react";

export default function Library() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(null);

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
    <div className="p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-950">Biblioteca Clínica</h1>
          <p className="text-brand-500 mt-2">Explore e utilize modelos validados por especialistas.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
          <input
            type="text"
            placeholder="Buscar na biblioteca (ex: Anamnese, Depressão, TDAH...)"
            className="input pl-10 bg-white border-brand-100 focus:border-brand-950"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary text-xs">
            <Filter size={14} />
            Categorias
          </button>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredTemplates.map((template) => (
          <div 
            key={template.id} 
            className="card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full bg-white overflow-hidden border-brand-100/50"
          >
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-950 group-hover:bg-brand-950 group-hover:text-white transition-colors duration-300">
                  <BookTemplate size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 bg-brand-50 px-2 py-1 rounded-md">
                  Premium
                </span>
              </div>

              <h3 className="text-xl font-bold text-brand-950 mb-2 group-hover:text-brand-800 transition-colors">
                {template.title}
              </h3>
              <p className="text-sm text-brand-500 leading-relaxed line-clamp-3">
                {template.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-[10px] font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Avaliação</span>
                <span className="text-[10px] font-medium px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">Validado</span>
                <span className="text-[10px] font-medium px-2 py-1 bg-purple-50 text-purple-600 rounded-full">Adulto</span>
              </div>
            </div>

            <div className="p-4 bg-brand-50/50 border-t border-brand-50 flex items-center justify-between gap-3">
              <button 
                className="btn btn-secondary text-xs flex-1"
                onClick={() => alert("Visualização em breve!")}
              >
                <Eye size={14} />
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
        <div className="card border-dashed border-2 border-brand-200 bg-transparent flex flex-col justify-center items-center p-10 text-center opacity-70 hover:opacity-100 transition-opacity">
          <CheckCircle2 size={32} className="text-brand-300 mb-4" />
          <h3 className="font-bold text-brand-950">Precisa de outro modelo?</h3>
          <p className="text-xs text-brand-500 mt-2">
            Estamos sempre adicionando novos protocolos. Entre em contato para sugerir um formulário específico.
          </p>
          <button className="btn btn-secondary text-xs mt-6">Sugerir Protocolo</button>
        </div>
      </div>
    </div>
  );
}
