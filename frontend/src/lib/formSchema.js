export function createEmptySchema(title = "Novo Formulário") {
  return {
    title,
    pages: [{ title: "Seção 1", questions: [] }],
  };
}

export function convertSurveyJSToCustom(surveyjsSchema) {
  if (!surveyjsSchema) return createEmptySchema();
  if (surveyjsSchema.pages?.[0]?.questions || surveyjsSchema.questions) {
    return surveyjsSchema;
  }

  const custom = {
    title: surveyjsSchema.title || "Formulário",
    pages: [],
  };

  const surveyPages = surveyjsSchema.pages || [{ elements: surveyjsSchema.elements || [] }];

  surveyPages.forEach((page) => {
    const customPage = {
      title: page.title || page.name || "Seção",
      questions: [],
    };

    (page.elements || []).forEach((el) => {
      if (!el || !el.type || el.type === "html" || el.type === "expression") return;
      const q = convertElement(el);
      if (q) customPage.questions.push(q);
    });

    if (customPage.questions.length > 0) {
      custom.pages.push(customPage);
    }
  });

  return custom;
}

function convertElement(el) {
  const q = { id: el.name, title: el.title || el.name, required: !!el.isRequired };

  switch (el.type) {
    case "text":
    case "comment":
      q.type = el.type === "comment" || el.inputType === "color" ? "text" : "text";
      q.multiline = el.type === "comment" || el.inputType === "color";
      q.inputType = el.inputType === "number" ? "number" : "text";
      if (el.placeholder) q.placeholder = el.placeholder;
      return q;

    case "number":
      q.type = "number";
      if (el.min !== undefined) q.min = el.min;
      if (el.max !== undefined) q.max = el.max;
      return q;

    case "boolean":
    case "yesno":
      q.type = "boolean";
      return q;

    case "radiogroup":
      q.type = "choice";
      q.multiple = false;
      q.options = (el.choices || []).map(mapOption);
      return q;

    case "checkbox":
      q.type = "choice";
      q.multiple = true;
      q.options = (el.choices || []).map(mapOption);
      return q;

    case "dropdown":
      q.type = "choice";
      q.multiple = false;
      q.options = (el.choices || []).map(mapOption);
      return q;

    case "rating":
    case "likert":
      q.type = "likert";
      q.options = (el.rateValues || el.choices || []).map(mapOption);
      if (q.options.length === 0) {
        const min = el.rateMin ?? 1;
        const max = el.rateMax ?? 5;
        for (let i = min; i <= max; i++) {
          q.options.push({ value: i, label: String(i) });
        }
      }
      return q;

    case "matrix":
    case "matrixdropdown":
      q.type = "matrix";
      q.rows = (el.rows || []).map((r) => ({
        value: r.value || r,
        label: r.text || r.label || String(r.value || r),
      }));
      q.columns = (el.columns || el.choices || []).map((c) => ({
        value: c.value ?? c,
        label: c.text || c.label || String(c.value ?? c),
      }));
      return q;

    case "image":
    case "file":
      return null;

    default:
      q.type = "text";
      return q;
  }
}

function mapOption(o) {
  if (typeof o === "string" || typeof o === "number") {
    return { value: o, label: String(o) };
  }
  return { value: o.value, label: o.text || o.label || String(o.value) };
}

export function generateId() {
  return "q_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
}

export const QUESTION_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "boolean", label: "Sim/Não" },
  { value: "choice", label: "Escolha" },
  { value: "likert", label: "Escala Likert" },
  { value: "matrix", label: "Matriz" },
];

export const TYPE_LABELS = {
  text: "Texto",
  number: "Número",
  boolean: "Sim/Não",
  choice: "Escolha",
  likert: "Escala",
  matrix: "Matriz",
};
