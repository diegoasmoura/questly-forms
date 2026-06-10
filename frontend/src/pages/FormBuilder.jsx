import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { api } from "../lib/api";

// SurveyJS imports
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";

import { ArrowLeft, Save, Download, Loader2 } from "lucide-react";

// Move options outside to keep it stable
const creatorOptions = {
  showThemeTab: true,
  showLogicTab: true,
  showTranslationTab: true,
  showJSONEditorTab: true,
  showEmbeddedSurveyTab: false,
  isAutoSave: false,
  showSidebar: true,
  propertyGridNavigationMode: "accordion",
  showDesignerTab: true,
  showPreviewTab: true,
};

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigateWithTransition();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  
  // Use a ref for title to avoid re-renders of the entire page while typing
  const titleRef = useRef("");
  const [displayTitle, setDisplayTitle] = useState("");

  // Initialize Creator - memoized to prevent re-creation
  const creator = useMemo(() => {
    const c = new SurveyCreator(creatorOptions);
    return c;
  }, []);

  // Load data
  useEffect(() => {
    let isMounted = true;

    async function loadForm() {
      try {
        if (!id) {
          creator.JSON = {
            title: "Novo Formulário",
            pages: [{ elements: [] }],
          };
          titleRef.current = "Novo Formulário";
          setDisplayTitle("Novo Formulário");
          setLoading(false);
          return;
        }

        const data = await api.getForm(id);
        if (!isMounted) return;

        titleRef.current = data.title;
        setDisplayTitle(data.title);
        
        if (data.schema) {
          creator.JSON = data.schema;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading form:", error);
        if (isMounted) navigate("/my-forms");
      }
    }

    loadForm();
    return () => { isMounted = false; };
  }, [id, creator, navigate]);

  // Handle title changes from Creator
  useEffect(() => {
    const onPropertyChanged = (sender, options) => {
      if (options.name === "title") {
        const newTitle = options.newValue || "";
        titleRef.current = newTitle;
        setDisplayTitle(newTitle);
      }
    };

    creator.onModified.add((sender, options) => {
      // General modification listener if needed
    });

    // We can also sync title from creator.survey if it exists
    const syncTitle = () => {
      if (creator.survey) {
        creator.survey.onPropertyChanged.add(onPropertyChanged);
      }
    };

    syncTitle();
    // Re-sync if survey changes (e.g. JSON assigned)
    creator.onActiveTabChanged.add(syncTitle);

    return () => {
      creator.onActiveTabChanged.remove(syncTitle);
      if (creator.survey) {
        creator.survey.onPropertyChanged.remove(onPropertyChanged);
      }
    };
  }, [creator]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSavingSuccess(false);
    try {
      const json = creator.JSON;
      const currentTitle = titleRef.current || "Sem Título";
      
      if (id) {
        await api.updateForm(id, { title: currentTitle, schema: json });
      } else {
        const newForm = await api.createForm({ title: currentTitle, schema: json });
        navigate(`/forms/${newForm.id}/edit`);
      }
      
      setSavingSuccess(true);
      setTimeout(() => setSavingSuccess(false), 2000);
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }, [id, navigate, saving, creator]);

  const handleExport = () => {
    const json = JSON.stringify(creator.JSON, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titleRef.current || "form"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link to="/my-forms" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
            <input
              type="text"
              value={displayTitle}
              onChange={(e) => {
                const val = e.target.value;
                setDisplayTitle(val);
                titleRef.current = val;
                // Update creator title too so they stay in sync
                if (creator.survey) creator.survey.title = val;
              }}
              className="text-lg font-bold text-slate-900 bg-transparent border-none focus:outline-none w-64 md:w-96"
              placeholder="Título do formulário..."
            />
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Editor de Instrumentos</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="hidden md:flex btn btn-secondary text-xs py-2">
            <Download size={14} />
            Exportar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn btn-primary text-xs px-6 py-2 min-w-[120px] ${savingSuccess ? 'bg-emerald-500' : ''}`}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : savingSuccess ? "✓ Salvo" : "Salvar"}
          </button>
        </div>
      </header>

      {/* Creator Area */}
      <main className="flex-1 relative overflow-hidden bg-slate-50">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <p className="text-sm font-medium text-slate-600">Carregando editor...</p>
            </div>
          </div>
        )}
        
        {/* Important: Fixed positioning/sizing for the component container */}
        <div className="absolute inset-0 w-full h-full survey-creator-container">
          <SurveyCreatorComponent creator={creator} />
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .survey-creator-container .svc-creator-component {
          height: 100% !important;
        }
        /* Hide the banner explicitly in this refactored version too */
        .svc-creator__non-commercial-text, .svc-creator__banner {
          display: none !important;
        }
      `}} />
    </div>
  );
}
