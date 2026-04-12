import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { SurveyCreator } from "survey-creator-react";
import { ArrowLeft, Save, Eye, Download, Loader2 } from "lucide-react";

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const creatorContainerRef = useRef(null);
  const creatorInstanceRef = useRef(null);
  const [form, setForm] = useState(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  const titleInputRef = useRef(null);

  // Load existing form
  useEffect(() => {
    if (id) {
      api.getForm(id).then((data) => {
        setForm(data);
        setTitle(data.title);
        if (titleInputRef.current) {
          titleInputRef.current.value = data.title;
        }
      }).catch(() => navigate("/dashboard"));
    }
  }, [id, navigate]);

  // Initialize SurveyJS Creator
  useEffect(() => {
    if (!creatorContainerRef.current || creatorInstanceRef.current) return;

    const creator = new SurveyCreator();

    // Set tab visibility BEFORE render
    creator.showThemeTab = true;
    creator.showLogicTab = true;
    creator.showTranslationTab = true;
    creator.showJSONEditorTab = true;
    creator.showEmbeddedSurveyTab = false;
    creator.isAutoSave = false;

    // Set initial JSON
    if (form?.schema) {
      creator.JSON = form.schema;
    } else {
      creator.JSON = {
        title: "New Form",
        pages: [{ elements: [] }],
      };
    }

    // Render to container
    creator.render(creatorContainerRef.current);

    // Set tab visibility AFTER render (v1.12.x requires this)
    // Using microtask to ensure DOM is ready
    Promise.resolve().then(() => {
      if (creator.tabs) {
        creator.tabs.forEach((tab) => {
          const tabId = (tab.id || tab.name || "").toLowerCase();
          if (["designer", "preview", "theme", "logic", "translation", "json"].includes(tabId)) {
            tab.visible = true;
          }
        });
      }
    });

    creatorInstanceRef.current = creator;

    // Listen for title changes
    if (creator.survey) {
      creator.survey.onPropertyChanged.add((_, options) => {
        if (options.name === "title" && titleInputRef.current) {
          setTitle(options.newValue || "");
        }
      });
    }

    return () => {
      if (creatorInstanceRef.current) {
        try {
          creatorInstanceRef.current.dispose();
        } catch (e) {
          // Ignore disposal errors
        }
        creatorInstanceRef.current = null;
      }
    };
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!creatorInstanceRef.current || saving) return;
    setSaving(true);
    setSavingSuccess(false);
    try {
      const json = creatorInstanceRef.current.JSON;
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
  }, [id, title, navigate, saving]);

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
    if (!creatorInstanceRef.current) return;
    const json = JSON.stringify(creatorInstanceRef.current.JSON, null, 2);
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
      <div className="flex-1 overflow-hidden">
        <div ref={creatorContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
