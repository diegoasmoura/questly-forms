import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { api } from "../lib/api";
import { createEmptySchema, convertSurveyJSToCustom, generateId, QUESTION_TYPES, TYPE_LABELS } from "../lib/formSchema";
import CustomFormRenderer from "../components/CustomFormRenderer";
import { toast } from "../components/Toast";
import {
  ArrowLeft, Save, Download, Loader2, Plus, Trash2, GripVertical,
  Eye, Check, Edit3, X, ChevronUp, ChevronDown, FileText,
  AlignLeft, Hash, ToggleLeft, List, BarChart3, Grid3X3,
} from "lucide-react";

const TYPE_ICONS = {
  text: AlignLeft,
  number: Hash,
  boolean: ToggleLeft,
  choice: List,
  likert: BarChart3,
  matrix: Grid3X3,
};

export default function CustomFormBuilder() {
  const { id } = useParams();
  const navigate = useNavigateWithTransition();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("Novo Formulário");
  const [pages, setPages] = useState([{ title: "Seção 1", questions: [] }]);
  const [showPreview, setShowPreview] = useState(false);
  const [displayMode, setDisplayMode] = useState("continuous");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingPageIdx, setEditingPageIdx] = useState(0);
  const [dragIdx, setDragIdx] = useState(null);
  const dragOverIdx = useRef(null);

  useEffect(() => {
    async function loadForm() {
      try {
        if (!id) {
          setLoading(false);
          return;
        }
        const data = await api.getForm(id);
        setTitle(data.title);
        const schema = convertSurveyJSToCustom(data.schema);
        setDisplayMode(schema?.mode || (schema?.stepper ? "stepper" : "continuous"));
        if (schema?.pages) {
          setPages(schema.pages.map((p) => ({
            title: p.title || "Seção",
            questions: (p.questions || []).map((q) => ({ ...q })),
          })));
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading form:", error);
        navigate("/my-forms");
      }
    }
    loadForm();
  }, [id]);

  const getSchema = useCallback(() => {
    return { title, mode: displayMode, pages: pages.filter((p) => p.questions.length > 0 || p.title) };
  }, [title, displayMode, pages]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const schema = getSchema();
      if (id) {
        await api.updateForm(id, { title, schema });
      } else {
        const newForm = await api.createForm({ title, schema });
        navigate(`/forms/${newForm.id}/edit`);
      }
      toast("Instrumento salvo com sucesso!", "success", 2500);
    } catch (error) {
      toast("Erro ao salvar: " + error.message, "error", 4000);
    } finally {
      setSaving(false);
    }
  }, [id, title, saving, navigate, getSchema]);

  const handleExport = () => {
    const json = JSON.stringify(getSchema(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "form"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addQuestion = (pageIdx, type) => {
    const q = {
      id: generateId(),
      type: type || "text",
      title: "Nova pergunta",
      required: false,
    };
    if (type === "likert") {
      q.options = [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5", label: "5" },
        { value: "6", label: "6" },
      ];
    }
    setPages((prev) => {
      const copy = [...prev];
      copy[pageIdx] = { ...copy[pageIdx], questions: [...copy[pageIdx].questions, q] };
      return copy;
    });
    setEditingPageIdx(pageIdx);
    setEditingQuestion(q.id);
  };

  const updateQuestion = (pageIdx, qId, updates) => {
    setPages((prev) => {
      const copy = [...prev];
      copy[pageIdx] = {
        ...copy[pageIdx],
        questions: copy[pageIdx].questions.map((q) =>
          q.id === qId ? { ...q, ...updates } : q
        ),
      };
      return copy;
    });
  };

  const removeQuestion = (pageIdx, qId) => {
    if (!confirm("Remover esta pergunta?")) return;
    setPages((prev) => {
      const copy = [...prev];
      copy[pageIdx] = {
        ...copy[pageIdx],
        questions: copy[pageIdx].questions.filter((q) => q.id !== qId),
      };
      return copy;
    });
    if (editingQuestion === qId) setEditingQuestion(null);
  };

  const moveQuestion = (pageIdx, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    setPages((prev) => {
      const copy = [...prev];
      const qs = [...copy[pageIdx].questions];
      const [moved] = qs.splice(fromIdx, 1);
      qs.splice(toIdx, 0, moved);
      copy[pageIdx] = { ...copy[pageIdx], questions: qs };
      return copy;
    });
  };

  const handleDragStart = (pageIdx, idx) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  };

  const handleDrop = (pageIdx) => {
    if (dragIdx === null || dragOverIdx.current === null) return;
    moveQuestion(pageIdx, dragIdx, dragOverIdx.current);
    setDragIdx(null);
    dragOverIdx.current = null;
  };

  const moveQuestionToPage = (fromPageIdx, qId, toPageIdx) => {
    if (fromPageIdx === toPageIdx) return;
    setPages((prev) => {
      const copy = prev.map((p) => ({ ...p, questions: [...p.questions] }));
      const qIdx = copy[fromPageIdx].questions.findIndex((q) => q.id === qId);
      if (qIdx === -1) return prev;
      const [moved] = copy[fromPageIdx].questions.splice(qIdx, 1);
      copy[toPageIdx].questions.push(moved);
      return copy;
    });
    if (editingQuestion === qId) setEditingQuestion(null);
  };

  const addPage = () => {
    setPages((prev) => [...prev, { title: `Seção ${prev.length + 1}`, questions: [] }]);
  };

  const updatePageTitle = (idx, title) => {
    setPages((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], title };
      return copy;
    });
  };

  const removePage = (idx) => {
    if (pages.length <= 1) return;
    if (!confirm("Remover esta seção e todas as suas perguntas?")) return;
    setPages((prev) => prev.filter((_, i) => i !== idx));
  };

  const questionCount = pages.reduce((sum, p) => sum + p.questions.length, 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold text-slate-900 bg-transparent border-none focus:outline-none w-64 md:w-96"
              placeholder="Título do formulário..."
            />
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">
              Editor de Instrumentos • {questionCount} perguntas
            </span>
          </div>
        </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Exibição:</span>
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setDisplayMode("continuous")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  displayMode === "continuous"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Contínua
              </button>
              <button
                onClick={() => setDisplayMode("paginated")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  displayMode === "paginated"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Paginada
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`btn text-xs py-2 ${showPreview ? "btn-primary" : "btn-secondary"}`}
          >
            <Eye size={14} />
            {showPreview ? "Editar" : "Visualizar"}
          </button>
          <button onClick={handleExport} className="hidden md:flex btn btn-secondary text-xs py-2">
            <Download size={14} />
            Exportar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary text-xs px-6 py-2 min-w-[100px]"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {showPreview ? (
          <div className="max-w-2xl mx-auto p-6">
            <CustomFormRenderer
              key={displayMode}
              schema={getSchema()}
              preview
              formTitle={title}
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {pages.map((page, pIdx) => (
              <div key={pIdx} className="card overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
                  <FileText size={14} className="text-brand-500 shrink-0" />
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => updatePageTitle(pIdx, e.target.value)}
                    className="flex-1 text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none uppercase tracking-wide"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">
                    {page.questions.length} perguntas
                  </span>
                  {pages.length > 1 && (
                    <button
                      onClick={() => removePage(pIdx)}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remover seção"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {page.questions.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <FileText size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs mb-4">Nenhuma pergunta nesta seção</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {QUESTION_TYPES.map((t) => {
                          const Icon = TYPE_ICONS[t.value];
                          return (
                            <button
                              key={t.value}
                              onClick={() => addQuestion(pIdx, t.value)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
                            >
                              <Icon size={12} />
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {page.questions.map((q, qIdx) => (
                    <QuestionEditor
                      key={q.id}
                      question={q}
                      index={qIdx}
                      isEditing={editingQuestion === q.id}
                      onToggleEdit={() =>
                        setEditingQuestion(editingQuestion === q.id ? null : q.id)
                      }
                      onUpdate={(updates) => updateQuestion(pIdx, q.id, updates)}
                      onRemove={() => removeQuestion(pIdx, q.id)}
                      onMoveUp={() => moveQuestion(pIdx, qIdx, qIdx - 1)}
                      onMoveDown={() => moveQuestion(pIdx, qIdx, qIdx + 1)}
                      onMoveToPage={(toPageIdx) => moveQuestionToPage(pIdx, q.id, toPageIdx)}
                      isFirst={qIdx === 0}
                      isLast={qIdx === page.questions.length - 1}
                      onDragStart={() => handleDragStart(pIdx, qIdx)}
                      onDragOver={(e) => handleDragOver(e, qIdx)}
                      onDrop={() => handleDrop(pIdx)}
                      pages={pages}
                      pageIdx={pIdx}
                    />
                  ))}

                  {page.questions.length > 0 && (
                    <button
                      onClick={() => addQuestion(pIdx)}
                      className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:text-brand-600 hover:border-brand-300 transition-all font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Adicionar Pergunta
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addPage}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Adicionar Seção
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function QuestionPreview({ question: q, index }) {
  if (q.type === "likert") {
    const opts = q.options || [];
    return (
      <div className="flex items-center gap-1.5 mt-2">
        {opts.slice(0, 6).map((opt, i) => (
          <span
            key={i}
            className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400"
          >
            {opt.value || i + 1}
          </span>
        ))}
        {opts.length > 6 && (
          <span className="text-[10px] text-slate-400 ml-1">+{opts.length - 6}</span>
        )}
      </div>
    );
  }
  if (q.type === "choice") {
    const opts = q.options || [];
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {opts.slice(0, 4).map((opt, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded border border-slate-200 text-[10px] text-slate-400"
          >
            {opt.label || `Opção ${i + 1}`}
          </span>
        ))}
        {opts.length > 4 && (
          <span className="text-[10px] text-slate-400">+{opts.length - 4}</span>
        )}
        {opts.length === 0 && (
          <span className="text-[10px] text-slate-300 italic">Sem opções</span>
        )}
      </div>
    );
  }
  if (q.type === "matrix") {
    return (
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
        <span>{q.rows?.length || 0} linhas</span>
        <span>×</span>
        <span>{q.columns?.length || 0} colunas</span>
      </div>
    );
  }
  if (q.type === "text" && q.multiline) {
    return (
      <div className="mt-2 h-8 rounded border border-slate-200 bg-slate-50" />
    );
  }
  if (q.type === "text") {
    return (
      <div className="mt-2 h-5 w-48 rounded border border-slate-200 bg-slate-50" />
    );
  }
  if (q.type === "number") {
    return (
      <div className="mt-2 h-5 w-20 rounded border border-slate-200 bg-slate-50" />
    );
  }
  if (q.type === "boolean") {
    return (
      <div className="flex items-center gap-2 mt-2">
        <span className="w-4 h-4 rounded border border-slate-200 bg-slate-50" />
        <span className="text-[10px] text-slate-400">Sim</span>
      </div>
    );
  }
  return null;
}

function QuestionEditor({
  question: q,
  index,
  isEditing,
  onToggleEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onMoveToPage,
  isFirst,
  isLast,
  onDragStart,
  onDragOver,
  onDrop,
  pages,
  pageIdx,
}) {
  const [localType, setLocalType] = useState(q.type);
  const [localTitle, setLocalTitle] = useState(q.title);
  const [localRequired, setLocalRequired] = useState(q.required);
  const [localOptions, setLocalOptions] = useState(
    q.options ? q.options.map((o) => ({ ...o })) : []
  );
  const [localRows, setLocalRows] = useState(
    q.rows ? q.rows.map((r) => ({ ...r })) : []
  );
  const [localColumns, setLocalColumns] = useState(
    q.columns ? q.columns.map((c) => ({ ...c })) : []
  );
  const [localMultiline, setLocalMultiline] = useState(q.multiline || false);
  const [localMin, setLocalMin] = useState(q.min);
  const [localMax, setLocalMax] = useState(q.max);
  const [localInputType, setLocalInputType] = useState(q.inputType || "text");
  const [localPlaceholder, setLocalPlaceholder] = useState(q.placeholder || "");
  const [localTrueLabel, setLocalTrueLabel] = useState(q.trueLabel || "Sim");
  const [localFalseLabel, setLocalFalseLabel] = useState(q.falseLabel || "Não");

  useEffect(() => {
    setLocalType(q.type);
    setLocalTitle(q.title);
    setLocalRequired(q.required);
    setLocalOptions(q.options ? q.options.map((o) => ({ ...o })) : []);
    setLocalRows(q.rows ? q.rows.map((r) => ({ ...r })) : []);
    setLocalColumns(q.columns ? q.columns.map((c) => ({ ...c })) : []);
    setLocalMultiline(q.multiline || false);
    setLocalMin(q.min);
    setLocalMax(q.max);
    setLocalInputType(q.inputType || "text");
    setLocalPlaceholder(q.placeholder || "");
    setLocalTrueLabel(q.trueLabel || "Sim");
    setLocalFalseLabel(q.falseLabel || "Não");
  }, [q]);

  const saveEdits = () => {
    const updates = {
      type: localType,
      title: localTitle,
      required: localRequired,
    };
    if (localType === "text") {
      updates.multiline = localMultiline;
      updates.inputType = localInputType;
      updates.placeholder = localPlaceholder;
    }
    if (localType === "number") {
      updates.min = localMin;
      updates.max = localMax;
    }
    if (localType === "boolean") {
      updates.trueLabel = localTrueLabel;
      updates.falseLabel = localFalseLabel;
    }
    if (localType === "choice" || localType === "likert") {
      updates.options = localOptions.filter((o) => o.label.trim());
    }
    if (localType === "matrix") {
      updates.rows = localRows.filter((r) => r.label.trim());
      updates.columns = localColumns.filter((c) => c.label.trim());
    }
    onUpdate(updates);
    onToggleEdit();
  };

  const addOption = () => {
    setLocalOptions((prev) => [...prev, { value: generateId(), label: "" }]);
  };

  const updateOption = (idx, field, val) => {
    setLocalOptions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeOption = (idx) => {
    setLocalOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    const id = generateId();
    setLocalRows((prev) => [...prev, { value: id, label: "" }]);
  };

  const updateRow = (idx, field, val) => {
    setLocalRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeRow = (idx) => {
    setLocalRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const addColumn = () => {
    const id = generateId();
    setLocalColumns((prev) => [...prev, { value: id, label: "" }]);
  };

  const updateColumn = (idx, field, val) => {
    setLocalColumns((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeColumn = (idx) => {
    setLocalColumns((prev) => prev.filter((_, i) => i !== idx));
  };

  const Icon = TYPE_ICONS[q.type] || AlignLeft;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-xl border transition-all ${
        isEditing
          ? "border-brand-300 bg-brand-50/30 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1 text-slate-300">
          <GripVertical size={14} />
        </div>

        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded min-w-[56px] text-center">
          <Icon size={10} className="inline mr-1 -mt-0.5" />
          {TYPE_LABELS[q.type] || q.type}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 tabular-nums">
              #{index + 1}
            </span>
            <p className="text-sm font-medium text-slate-800 truncate">
              {q.title}
            </p>
            {q.required && <span className="text-[10px] text-red-500 font-bold shrink-0">*</span>}
          </div>
          {!isEditing && <QuestionPreview question={q} index={index} />}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="flex flex-col gap-0.5 mr-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="disabled:opacity-20 hover:text-brand-600 text-slate-400 p-0.5"
              title="Mover para cima"
            >
              <ChevronUp size={11} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="disabled:opacity-20 hover:text-brand-600 text-slate-400 p-0.5"
              title="Mover para baixo"
            >
              <ChevronDown size={11} />
            </button>
          </div>
          <button
            onClick={isEditing ? saveEdits : onToggleEdit}
            className={`p-1.5 rounded-lg transition-colors ${
              isEditing
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "hover:bg-slate-100 text-slate-400"
            }`}
            title={isEditing ? "Concluir" : "Editar"}
          >
            {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Remover"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {isEditing && (
        <div className="px-4 pb-5 space-y-4 border-t border-brand-200 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {QUESTION_TYPES.map((t) => {
              const TIcon = TYPE_ICONS[t.value];
              const active = localType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setLocalType(t.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    active
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  <TIcon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Pergunta
            </label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="input text-sm"
              placeholder="Digite a pergunta..."
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localRequired}
              onChange={(e) => setLocalRequired(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-600">Obrigatória</span>
          </label>

          {localType === "boolean" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Rótulo "Verdadeiro"
                </label>
                <input
                  type="text"
                  value={localTrueLabel}
                  onChange={(e) => setLocalTrueLabel(e.target.value)}
                  className="input text-sm"
                  placeholder="Ex: Sim, Concordo, Ativo..."
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Rótulo "Falso"
                </label>
                <input
                  type="text"
                  value={localFalseLabel}
                  onChange={(e) => setLocalFalseLabel(e.target.value)}
                  className="input text-sm"
                  placeholder="Ex: Não, Discordo, Inativo..."
                />
              </div>
            </div>
          )}

          {localType === "text" && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localMultiline}
                  onChange={(e) => setLocalMultiline(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-600">Texto longo (textarea)</span>
              </label>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={localPlaceholder}
                  onChange={(e) => setLocalPlaceholder(e.target.value)}
                  className="input text-sm"
                  placeholder="Texto de exemplo..."
                />
              </div>
            </>
          )}

          {localType === "number" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Mínimo
                </label>
                <input
                  type="number"
                  value={localMin ?? ""}
                  onChange={(e) => setLocalMin(e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Máximo
                </label>
                <input
                  type="number"
                  value={localMax ?? ""}
                  onChange={(e) => setLocalMax(e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
            </div>
          )}

          {(localType === "choice" || localType === "likert") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Opções
                </label>
                <button
                  onClick={addOption}
                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <Plus size={10} />
                  Adicionar
                </button>
              </div>
              <div className="space-y-1">
                {localOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-4 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(idx, "label", e.target.value)}
                      className="input text-xs flex-1"
                      placeholder="Rótulo da opção..."
                    />
                    <button
                      onClick={() => removeOption(idx)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {localOptions.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">Nenhuma opção. Adicione pelo menos uma.</p>
                )}
              </div>
              {localType === "choice" && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={q.multiple}
                    onChange={(e) => onUpdate({ multiple: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-600">Múltipla escolha (checkboxes)</span>
                </label>
              )}
            </div>
          )}

          {localType === "matrix" && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Linhas</label>
                  <button onClick={addRow} className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <Plus size={10} />
                    Adicionar
                  </button>
                </div>
                <div className="space-y-1">
                  {localRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 w-4 text-center shrink-0">{idx + 1}</span>
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) => updateRow(idx, "label", e.target.value)}
                        className="input text-xs flex-1"
                        placeholder="Texto da linha..."
                      />
                      <button onClick={() => removeRow(idx)} className="p-1 text-slate-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Colunas</label>
                  <button onClick={addColumn} className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <Plus size={10} />
                    Adicionar
                  </button>
                </div>
                <div className="space-y-1">
                  {localColumns.map((col, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 w-4 text-center shrink-0">{idx + 1}</span>
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => updateColumn(idx, "label", e.target.value)}
                        className="input text-xs flex-1"
                        placeholder="Texto da coluna..."
                      />
                      <button onClick={() => removeColumn(idx)} className="p-1 text-slate-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {pages.length > 1 && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Mover para
              </label>
              <div className="flex flex-wrap gap-1">
                {pages.map((p, i) => {
                  if (i === pageIdx) return null;
                  return (
                    <button
                      key={i}
                      onClick={() => onMoveToPage(i)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-medium text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
                    >
                      {p.title || `Seção ${i + 1}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
