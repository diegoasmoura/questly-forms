import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";

// SurveyJS imports - updated to modern CSS paths
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";

// Import themes for theme selector
import {
  DefaultLight, DefaultDark, DefaultLightPanelless, DefaultDarkPanelless,
  SharpLight, SharpDark, SharpLightPanelless, SharpDarkPanelless,
  BorderlessLight, BorderlessDark, BorderlessLightPanelless, BorderlessDarkPanelless,
  FlatLight, FlatDark, FlatLightPanelless, FlatDarkPanelless,
  PlainLight, PlainDark, PlainLightPanelless, PlainDarkPanelless,
  DoubleBorderLight, DoubleBorderDark, DoubleBorderLightPanelless, DoubleBorderDarkPanelless,
  LayeredLight, LayeredDark, LayeredLightPanelless, LayeredDarkPanelless,
  SolidLight, SolidDark, SolidLightPanelless, SolidDarkPanelless,
  ThreeDimensionalLight, ThreeDimensionalDark, ThreeDimensionalLightPanelless, ThreeDimensionalDarkPanelless,
  ContrastLight, ContrastDark, ContrastLightPanelless, ContrastDarkPanelless
} from "survey-core/themes";

import { ArrowLeft, Save, Download, Loader2 } from "lucide-react";

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const titleInputRef = useRef(null);
  const formLoadedRef = useRef(false);

  // Initialize SurveyJS Creator with v2.x options
  const creator = useMemo(() => {
    const options = {
      showThemeTab: true,
      showLogicTab: true,
      showTranslationTab: true,
      showJSONEditorTab: true,
      showEmbeddedSurveyTab: false,
      isAutoSave: false,
      showSidebar: true,
      propertyGridNavigationMode: "accordion",
      showOneCategoryInPropertyGrid: false,
    };
    
    const c = new SurveyCreator(options);

    c.showDesignerTab = true;
    c.showPreviewTab = true;
    c.showOneCategoryInPropertyGrid = false;

    // Add themes to the theme selector (including Panelless versions)
    if (c.themeEditor) {
      c.themeEditor.addTheme(DefaultLight, true);
      c.themeEditor.addTheme(DefaultDark);
      c.themeEditor.addTheme(DefaultLightPanelless);
      c.themeEditor.addTheme(DefaultDarkPanelless);
      c.themeEditor.addTheme(SharpLight);
      c.themeEditor.addTheme(SharpDark);
      c.themeEditor.addTheme(SharpLightPanelless);
      c.themeEditor.addTheme(SharpDarkPanelless);
      c.themeEditor.addTheme(BorderlessLight);
      c.themeEditor.addTheme(BorderlessDark);
      c.themeEditor.addTheme(BorderlessLightPanelless);
      c.themeEditor.addTheme(BorderlessDarkPanelless);
      c.themeEditor.addTheme(FlatLight);
      c.themeEditor.addTheme(FlatDark);
      c.themeEditor.addTheme(FlatLightPanelless);
      c.themeEditor.addTheme(FlatDarkPanelless);
      c.themeEditor.addTheme(PlainLight);
      c.themeEditor.addTheme(PlainDark);
      c.themeEditor.addTheme(PlainLightPanelless);
      c.themeEditor.addTheme(PlainDarkPanelless);
      c.themeEditor.addTheme(DoubleBorderLight);
      c.themeEditor.addTheme(DoubleBorderDark);
      c.themeEditor.addTheme(DoubleBorderLightPanelless);
      c.themeEditor.addTheme(DoubleBorderDarkPanelless);
      c.themeEditor.addTheme(LayeredLight);
      c.themeEditor.addTheme(LayeredDark);
      c.themeEditor.addTheme(LayeredLightPanelless);
      c.themeEditor.addTheme(LayeredDarkPanelless);
      c.themeEditor.addTheme(SolidLight);
      c.themeEditor.addTheme(SolidDark);
      c.themeEditor.addTheme(SolidLightPanelless);
      c.themeEditor.addTheme(SolidDarkPanelless);
      c.themeEditor.addTheme(ThreeDimensionalLight);
      c.themeEditor.addTheme(ThreeDimensionalDark);
      c.themeEditor.addTheme(ThreeDimensionalLightPanelless);
      c.themeEditor.addTheme(ThreeDimensionalDarkPanelless);
      c.themeEditor.addTheme(ContrastLight);
      c.themeEditor.addTheme(ContrastDark);
      c.themeEditor.addTheme(ContrastLightPanelless);
      c.themeEditor.addTheme(ContrastDarkPanelless);
    }

    return c;
  }, []);

  // Load existing form - waits for creator to be ready
  useEffect(() => {
    if (!id) {
      // New form
      creator.JSON = {
        title: "Novo Formulário",
        pages: [{ elements: [] }],
      };
      setLoading(false);
      return;
    }

    // Existing form - fetch and load
    api.getForm(id)
      .then((data) => {
        setForm(data);
        setTitle(data.title);
        formLoadedRef.current = data;
        
        // Set JSON after a small delay to ensure creator is ready
        const timeoutId = setTimeout(() => {
          if (data.schema) {
            creator.JSON = data.schema;
          }
          if (titleInputRef.current) {
            titleInputRef.current.value = data.title;
          }
          setLoading(false);
        }, 100);
        
        return () => clearTimeout(timeoutId);
      })
      .catch(() => {
        navigate("/dashboard");
      });
  }, [id, navigate, creator]);

  // Sync title input with state
  useEffect(() => {
    if (titleInputRef.current && formLoadedRef.current) {
      titleInputRef.current.value = title;
    }
  }, [title]);

  // Listen for title changes in the survey
  useEffect(() => {
    if (!creator.survey) return;
    
    const onPropertyChanged = (_, options) => {
      if (options.name === "title" && titleInputRef.current) {
        setTitle(options.newValue || "");
        titleInputRef.current.value = options.newValue || "";
      }
    };
    creator.survey.onPropertyChanged.add(onPropertyChanged);
    return () => creator.survey?.onPropertyChanged?.remove(onPropertyChanged);
  }, [creator]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSavingSuccess(false);
    try {
      const json = creator.JSON;
      const surveyTitle = titleInputRef.current?.value || title || "Untitled Form";
      if (id) {
        await api.updateForm(id, { title: surveyTitle, schema: json });
      } else {
        const newForm = await api.createForm({ title: surveyTitle, schema: json });
        navigate(`/forms/${newForm.id}/edit`);
      }
      setSavingSuccess(true);
      setTimeout(() => setSavingSuccess(false), 2000);
    } catch (error) {
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  }, [id, title, navigate, saving, creator]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const handleExport = () => {
    const json = JSON.stringify(creator.JSON, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "form"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in overflow-hidden">
      {/* Toolbar */}
      <header className="bg-white border-b border-emerald-100 h-16 shrink-0 z-10">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <Link to="/my-forms" className="p-2 rounded-xl hover:bg-emerald-50 text-slate-500 hover:text-emerald-900 transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex flex-col">
              <input
                ref={titleInputRef}
                type="text"
                defaultValue={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do Formulário..."
                className="text-lg font-bold text-slate-900 bg-transparent border-none focus:outline-none placeholder:text-emerald-200 w-80"
              />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-0.5">Editor Clínico</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="btn btn-secondary text-xs px-4">
              <Download size={16} />
              Exportar JSON
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary text-xs px-6 py-2.5 shadow-lg shadow-emerald-900/10"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : savingSuccess ? (
                "✓ Salvo"
              ) : (
                <>
                  <Save size={16} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Creator Container */}
      <div className="flex-1 relative w-full overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <span className="text-sm text-slate-500 font-medium">Carregando formulário...</span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0">
            <SurveyCreatorComponent creator={creator} />
          </div>
        )}
      </div>
    </div>
  );
}
