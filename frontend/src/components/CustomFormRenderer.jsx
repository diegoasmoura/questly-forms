import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TYPE_LABELS } from "../lib/formSchema";
import { Loader2, AlertCircle, Check, ChevronDown, ChevronRight, ChevronLeft, ChevronUp } from "lucide-react";

export default function CustomFormRenderer({
  schema,
  data,
  onChange,
  onComplete,
  readOnly = false,
  preview = false,
  formTitle,
}) {
  const [values, setValues] = useState(data || {});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const displayMode = schema?.mode || (schema?.stepper ? "stepper" : "continuous");

  const allQuestions = useMemo(() => {
    if (!schema?.pages) return [];
    return schema.pages.flatMap((p) => p.questions || []);
  }, [schema]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const allQuestionsRef = useRef(allQuestions);
  allQuestionsRef.current = allQuestions;
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const autoAdvanceRef = useRef(null);

  const handleChange = useCallback(
    (questionId, value) => {
      if (readOnly) return;
      const next = { ...values, [questionId]: value };
      setValues(next);
      setErrors((prev) => ({ ...prev, [questionId]: null }));
      onChange?.(next);
      if (displayMode === "stepper" && currentIdxRef.current < allQuestionsRef.current.length - 1) {
        const q = allQuestionsRef.current.find(q => q.id === questionId);
        const autoAdvanceTypes = ["radiogroup", "boolean", "rating", "likert"];
        if (q && autoAdvanceTypes.includes(q.type)) {
          clearTimeout(autoAdvanceRef.current);
          autoAdvanceRef.current = setTimeout(() => {
            setCurrentIdx((prev) => Math.min(prev + 1, allQuestionsRef.current.length - 1));
          }, 500);
        }
      }
    },
    [readOnly, onChange, values, displayMode]
  );

  const validate = useCallback(() => {
    const errs = {};
    const pages = schema?.pages || [];
    for (const page of pages) {
      for (const q of page.questions || []) {
        if (q.required) {
          const val = values[q.id];
          if (val === undefined || val === null || val === "") {
            errs[q.id] = "Campo obrigatório";
          } else if (Array.isArray(val) && val.length === 0) {
            errs[q.id] = "Campo obrigatório";
          } else if (typeof val === "object" && !Array.isArray(val)) {
            const hasAny = Object.values(val).some((v) => v !== undefined && v !== null && v !== "");
            if (!hasAny) errs[q.id] = "Campo obrigatório";
          }
        }
      }
    }
    setErrors(errs);
    return errs;
  }, [schema, values]);

  const handleSubmit = useCallback(async () => {
    if (readOnly) return;
    const errs = validate();
    const errKeys = Object.keys(errs);
    if (errKeys.length > 0) {
      alert("Existem campos obrigatórios não preenchidos. Por favor, revise suas respostas.");
      if (displayMode === "stepper") {
        const firstErrorIdx = allQuestionsRef.current.findIndex(q => errKeys.includes(q.id));
        if (firstErrorIdx !== -1) {
          setCurrentIdx(firstErrorIdx);
        }
      }
      return;
    }
    if (preview) {
      setSubmitted(true);
      return;
    }
    setSaving(true);
    try {
      await onComplete?.(values);
      setSubmitted(true);
    } catch {
      setErrors({ _form: "Erro ao enviar. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }, [readOnly, preview, validate, onComplete, values, displayMode]);

  const answeredCount = useMemo(() => {
    return allQuestions.filter((q) => {
      const v = values[q.id];
      return v !== undefined && v !== null && v !== "";
    }).length;
  }, [allQuestions, values]);

  const goNext = useCallback(() => {
    setCurrentIdx((prev) => Math.min(prev + 1, allQuestionsRef.current.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIdx((prev) => Math.max(prev - 1, 0));
  }, []);
  useEffect(() => {
    if (displayMode !== "stepper") return;
    const handleKeyDown = (e) => {
      const idx = currentIdxRef.current;
      const q = allQuestionsRef.current[idx];
      if (!q) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 6 && q.type === "likert") {
        e.preventDefault();
        const opt = q.options?.[num - 1];
        if (opt) handleChange(q.id, opt.value);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (idx > 0) setCurrentIdx(idx - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const v = valuesRef.current[q.id];
        const hasValue = v !== undefined && v !== null && v !== "";
        if (hasValue && idx < allQuestionsRef.current.length - 1) {
          setCurrentIdx(idx + 1);
        }
      } else if (e.key === "Enter") {
        const v = valuesRef.current[q.id];
        const hasValue = v !== undefined && v !== null && v !== "";
        if (hasValue) {
          e.preventDefault();
          if (idx >= allQuestionsRef.current.length - 1) {
            handleSubmit();
          } else {
            setCurrentIdx(idx + 1);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [displayMode, handleChange, handleSubmit]);

  if (!schema) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Schema não disponível</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 rounded-[20px] bg-[var(--sage-light)] flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-[var(--dark-green)] dark:text-[var(--sage)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Muito Obrigado!</h2>
        <p className="text-[var(--text-secondary)]">Suas respostas foram enviadas com sucesso.</p>
      </div>
    );
  }

  const pages = schema.pages || [];

  if (displayMode === "stepper") {
    const q = allQuestions[currentIdx];
    const isLikert = q?.type === "likert";
    if (!q) {
      return (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma pergunta encontrada</p>
        </div>
    );
  }

  if (displayMode === "paginated") {
    const page = pages[currentPage];
    if (!page) {
      return (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma seção encontrada</p>
        </div>
      );
    }
    const startQ = pages.slice(0, currentPage).reduce((sum, p) => sum + p.questions.length, 0);
    const totalQuestions = allQuestions.length;

    return (
      <div className="space-y-5">
        {formTitle && (
          <h1 className="text-lg font-bold text-[var(--text-primary)] text-center">{formTitle}</h1>
        )}

        {errors._form && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {errors._form}
          </div>
        )}

        <div className="card overflow-hidden">
          {page.title && (
            <div className="flex items-center justify-between px-5 py-4 bg-[var(--surface-alt)] border-b border-[var(--border)]">
              <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
                {page.title}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {page.questions.length} pergunta{page.questions.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="px-5 py-4 space-y-5">
            {page.questions.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-muted)] italic py-8">Nenhuma pergunta nesta seção</p>
            ) : (
              page.questions.map((q) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  value={values[q.id]}
                  error={errors[q.id]}
                  onChange={(v) => handleChange(q.id, v)}
                  readOnly={readOnly}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="btn btn-ghost text-sm px-4 py-2 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {startQ + 1}–{Math.min(startQ + page.questions.length, totalQuestions)} de {totalQuestions}
          </span>

          {readOnly ? (
            <span className="text-xs text-[var(--text-muted)] italic">Visualização</span>
          ) : currentPage >= pages.length - 1 ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-primary px-6 py-2 text-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : preview ? "Finalizar Teste" : "Enviar Respostas"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
              className="btn btn-primary px-5 py-2 text-sm"
            >
              Próxima <ChevronRight size={16} />
            </button>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] tabular-nums">
          {answeredCount} de {totalQuestions} respondidas
        </p>
      </div>
    );
  }

  return (
      <div className="max-w-xl mx-auto space-y-5">
        {formTitle && (
          <h1 className="text-lg font-bold text-[var(--text-primary)] text-center">{formTitle}</h1>
        )}

        {errors._form && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {errors._form}
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="px-7 py-7">
            <div className="text-xs font-semibold text-[var(--sage)] uppercase tracking-wider mb-3">
              Pergunta {q.id} de {allQuestions.length}
            </div>

            <p
              className="text-xl font-bold text-[var(--text-primary)] leading-relaxed mb-8"
              style={{ minHeight: "5rem" }}
            >
              {q.title}
            </p>

            {isLikert && q.options ? (
              <>
                <div className="grid grid-cols-6 gap-2 mb-6">
                  {q.options.map((opt) => {
                    const selected = String(values[q.id]) === String(opt.value);
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => handleChange(q.id, opt.value)}
                        className={`aspect-square rounded-xl border-2 font-semibold transition-all duration-150 flex flex-col items-center justify-center ${
                          selected
                            ? "bg-[var(--sage)] text-white border-[var(--sage)] scale-105 shadow-md"
                            : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--sage)] hover:bg-[var(--surface-alt)]"
                        }`}
                      >
                        <span className="text-lg leading-none">{opt.value}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[var(--border)] pt-4 space-y-1">
                  {q.options.map((opt) => {
                    const selected = String(values[q.id]) === String(opt.value);
                    return (
                      <div
                        key={String(opt.value)}
                        className={`flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                          selected
                            ? "bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[var(--sage)] font-bold"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded border flex items-center justify-center font-bold text-xs shrink-0 ${
                          selected
                            ? "bg-[var(--sage)] text-white border-[var(--sage)]"
                            : "border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface)]"
                        }`}>
                          {opt.value}
                        </span>
                        <span className="text-[var(--text-secondary)]">{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="min-h-[120px]">
                <QuestionField
                  key={q.id + "_" + currentIdx}
                  question={q}
                  value={values[q.id]}
                  error={errors[q.id]}
                  onChange={(v) => handleChange(q.id, v)}
                  readOnly={false}
                />
              </div>
            )}

            {errors[q.id] && (
              <p className="text-xs text-red-500 mt-3">{errors[q.id]}</p>
            )}
          </div>

          <div className="px-7 py-4 bg-[var(--surface-alt)] border-t border-[var(--border)] flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="btn btn-ghost text-sm px-4 py-2 disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            {readOnly ? (
              <span className="text-xs text-[var(--text-muted)] italic">Visualização</span>
            ) : currentIdx === allQuestions.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="btn btn-primary px-6 py-2 text-sm"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : preview ? "Finalizar Teste" : "Finalizar"
                }
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!values[q.id] && values[q.id] !== 0}
                className="btn btn-primary px-5 py-2 text-sm disabled:opacity-40"
              >
                Próxima <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] tabular-nums">
          {answeredCount} de {allQuestions.length} respondidas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {formTitle && (
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{formTitle}</h1>
      )}

      {errors._form && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          {errors._form}
        </div>
      )}

      {pages.map((page, pIdx) => (
        <PageRenderer
          key={pIdx}
          page={page}
          values={values}
          errors={errors}
          onChange={handleChange}
          readOnly={readOnly}
          preview={preview}
        />
      ))}

      {!readOnly && (
        <div className="pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary px-8 py-3"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : preview ? "Finalizar Teste" : "Enviar Respostas"
            }
          </button>
        </div>
      )}
    </div>
  );
}

function PageRenderer({ page, values, errors, onChange, readOnly, preview }) {
  const [open, setOpen] = useState(true);
  const questions = page.questions || [];

  if (questions.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      {page.title && (
        <button
          type="button"
          onClick={() => !preview && setOpen(!open)}
          className="w-full flex items-center justify-between px-5 py-4 bg-[var(--surface-alt)] border-b border-[var(--border)]"
        >
          <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
            {page.title}
          </span>
          {!preview && (
            open ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />
          )}
        </button>
      )}
      {open && (
        <div className="px-5 py-4 space-y-5">
          {questions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={values[q.id]}
              error={errors[q.id]}
              onChange={(v) => onChange(q.id, v)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionField({ question, value, error, onChange, readOnly }) {
  const q = question;

  const renderField = () => {
    switch (q.type) {
      case "text":
        return <TextField question={q} value={value} onChange={onChange} readOnly={readOnly} />;
      case "number":
        return <NumberField question={q} value={value} onChange={onChange} readOnly={readOnly} />;
      case "boolean":
        return <BooleanField question={q} value={value} onChange={onChange} readOnly={readOnly} />;
      case "choice":
        return <ChoiceField question={q} value={value} onChange={onChange} readOnly={readOnly} />;
      case "likert":
        return <LikertField question={q} value={value} onChange={onChange} readOnly={readOnly} />;
      case "matrix":
        return <MatrixField question={q} value={value} onChange={onChange} readOnly={readOnly} />;
      default:
        return <TextField question={q} value={value} onChange={onChange} readOnly={readOnly} />;
    }
  };

  return (
    <div>
      <label className={`block text-sm font-bold mb-1.5 ${error ? "text-red-600" : "text-[var(--text-primary)]"}`}>
        {q.title}
        {q.required && <span className="text-red-500 ml-1">*</span>}
        <span className="ml-2 text-[10px] text-[var(--text-muted)] uppercase font-bold">
          {TYPE_LABELS[q.type] || q.type}
        </span>
      </label>
      {renderField()}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function TextField({ question, value, onChange, readOnly }) {
  if (readOnly) {
    return <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-2 rounded-lg">{value || "—"}</p>;
  }
  if (question.multiline) {
    return (
      <textarea
        className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage)]/20 outline-none transition-all resize-y min-h-[80px]"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || ""}
        rows={3}
      />
    );
  }
  return (
    <input
      type={question.inputType || "text"}
      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage)]/20 outline-none transition-all"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || ""}
    />
  );
}

function NumberField({ question, value, onChange, readOnly }) {
  if (readOnly) {
    return <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-2 rounded-lg">{value ?? "—"}</p>;
  }
  return (
    <input
      type="number"
      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage)]/20 outline-none transition-all"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      min={question.min}
      max={question.max}
    />
  );
}

function BooleanField({ question, value, onChange, readOnly }) {
  const trueLabel = question.trueLabel || "Sim";
  const falseLabel = question.falseLabel || "Não";
  const isChecked = value === true || value === "true" || trueLabel === "Sim" && value === "Sim";
  if (readOnly) {
    return (
      <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-2 rounded-lg">
        {isChecked ? trueLabel : falseLabel}
      </p>
    );
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
          isChecked
            ? "bg-[var(--sage)] text-white shadow-sm"
            : "bg-[var(--surface)] text-[var(--text-secondary)] border-2 border-[var(--border)] hover:border-[var(--sage)] hover:text-[var(--sage)]"
        }`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
          !isChecked
            ? "bg-[#EF4444] text-white shadow-sm"
            : "bg-[var(--surface)] text-[var(--text-secondary)] border-2 border-[var(--border)] hover:border-red-500 hover:text-red-500"
        }`}
      >
        {falseLabel}
      </button>
    </div>
  );
}

function ChoiceField({ question, value, onChange, readOnly }) {
  const options = question.options || [];
  const selectedValue = Array.isArray(value) ? value : value ? [value] : [];

  if (readOnly) {
    const labels = selectedValue
      .map((v) => options.find((o) => String(o.value) === String(v))?.label || v)
      .join(", ");
    return <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-2 rounded-lg">{labels || "—"}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const checked = selectedValue.some((v) => String(v) === String(opt.value));
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => {
              if (question.multiple) {
                const next = checked
                  ? selectedValue.filter((v) => String(v) !== String(opt.value))
                  : [...selectedValue, opt.value];
                onChange(next);
              } else {
                onChange(opt.value);
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              checked
                ? "bg-[var(--sage)] text-white shadow-sm"
                : "bg-[var(--surface)] text-[var(--text-secondary)] border-2 border-[var(--border)] hover:border-[var(--sage)] hover:text-[var(--sage)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function LikertField({ question, value, onChange, readOnly }) {
  const options = question.options || [];

  if (readOnly) {
    const label = options.find((o) => String(o.value) === String(value))?.label || value || "—";
    return <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-2 rounded-lg">{label}</p>;
  }

  const cols = Math.min(options.length, 6);

  return (
    <>
      <div
        className="grid gap-2 mb-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const selected = String(value) === String(opt.value);
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`aspect-square rounded-xl border-2 font-semibold transition-all duration-150 flex flex-col items-center justify-center ${
                selected
                  ? "bg-[var(--sage)] text-white border-[var(--sage)] scale-105 shadow-sm"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--sage)] hover:bg-[var(--surface-alt)]"
              }`}
            >
              {opt.value}
            </button>
          );
        })}
      </div>
      {options.some((o) => o.label !== String(o.value)) && (
        <div className="space-y-1.5">
          {options.map((opt) => {
            const selected = String(value) === String(opt.value);
            return (
              <div
                key={String(opt.value)}
                className={`flex items-center gap-3 text-xs rounded-lg px-2 py-1 transition-colors ${
                  selected ? "bg-[var(--sage-light)] text-[var(--dark-green)] dark:text-[var(--sage)] font-medium" : "text-[var(--text-secondary)]"
                }`}
              >
                <span className={`w-6 h-6 rounded border flex items-center justify-center font-bold shrink-0 ${
                  selected
                    ? "bg-[var(--sage)] text-white border-[var(--sage)]"
                    : "border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface)]"
                }`}>
                  {opt.value}
                </span>
                <span className="text-[var(--text-secondary)]">{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function MatrixField({ question, value, onChange, readOnly }) {
  const rows = question.rows || [];
  const columns = question.columns || [];

  const matrixValue = value || {};

  if (readOnly) {
    return (
      <div className="space-y-1">
        {rows.map((row) => {
          const col = columns.find((c) => String(c.value) === String(matrixValue[row.value]));
          return (
            <div key={row.value} className="flex items-center gap-3 py-1.5 px-3 bg-[var(--surface-alt)] rounded-lg text-sm">
              <span className="flex-1 text-[var(--text-secondary)]">{row.label}</span>
              <span className="font-medium text-[var(--text-primary)]">{col?.label || matrixValue[row.value] || "—"}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 text-xs font-medium text-[var(--text-muted)]" />
            {columns.map((col) => (
              <th
                key={String(col.value)}
                className="text-center py-2 px-2 text-xs font-medium text-[var(--text-muted)] min-w-[80px]"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={row.value} className={rIdx % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface-alt)]/50"}>
              <td className="py-2 pr-4 text-xs text-[var(--text-secondary)]">{row.label}</td>
              {columns.map((col) => {
                const checked = String(matrixValue[row.value]) === String(col.value);
                return (
                  <td key={String(col.value)} className="text-center py-2">
                    <input
                      type="radio"
                      name={`${question.id}_${row.value}`}
                      checked={checked}
                      onChange={() => onChange({ ...matrixValue, [row.value]: col.value })}
                      className="w-4 h-4 border-[var(--border)] text-[var(--sage)] focus:ring-[var(--sage)] bg-[var(--surface)]"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
