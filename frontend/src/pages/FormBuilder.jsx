import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";

// SurveyJS imports
import "survey-core/defaultV2.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";

import { ArrowLeft, Save, Download, Loader2 } from "lucide-react";

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  const titleInputRef = useRef(null);

  // Initialize SurveyJS Creator with options
  const creator = useMemo(() => {
    const options = {
      showThemeTab: true,
      showLogicTab: true,
      showTranslationTab: true,
      showJSONEditorTab: true,
      showEmbeddedSurveyTab: false,
      isAutoSave: false,
    };
    const c = new SurveyCreator(options);
    
    // Explicitly ensure visibility of all tabs
    c.showDesignerTab = true;
    c.showPreviewTab = true;
    
    return c;
  }, []);

  // Load existing form
  useEffect(() => {
    if (id) {
      api.getForm(id).then((data) => {
        setForm(data);
        setTitle(data.title);
        if (titleInputRef.current) {
          titleInputRef.current.value = data.title;
        }
        if (data.schema) {
          creator.JSON = data.schema;
        }
      }).catch(() => navigate("/dashboard"));
    } else {
      creator.JSON = {
        title: "New Form",
        pages: [{ elements: [] }],
      };
    }
  }, [id, navigate, creator]);

  // Listen for title changes in the survey
  useEffect(() => {
    const onPropertyChanged = (_, options) => {
      if (options.name === "title" && titleInputRef.current) {
        setTitle(options.newValue || "");
        titleInputRef.current.value = options.newValue || "";
      }
    };
    creator.survey.onPropertyChanged.add(onPropertyChanged);
    return () => creator.survey.onPropertyChanged.remove(onPropertyChanged);
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
    <div className="min-h-screen bg-brand-50 flex flex-col">
      {/* Toolbar */}
      <header className="bg-white border-b border-brand-100 sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-500 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <input
              ref={titleInputRef}
              type="text"
              defaultValue={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Form title..."
              className="text-base font-medium text-brand-950 bg-transparent border-none focus:outline-none placeholder:text-brand-300 w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn btn-ghost text-sm">
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary text-sm"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : savingSuccess ? (
                "✓ Saved"
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Creator Container */}
      <div className="flex-1 overflow-hidden h-[calc(100vh-3.5rem)]">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </div>
  );
}
