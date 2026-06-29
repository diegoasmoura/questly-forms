export function convertSurveyJSToCustom(schema) {
  if (!schema) return null;
  if (schema.pages?.[0]?.questions || schema.questions) return schema;

  const custom = {
    title: schema.title || "Formulário",
    pages: [],
  };

  const surveyPages = schema.pages || [{ elements: schema.elements || [] }];

  surveyPages.forEach((page) => {
    const customPage = {
      title: page.title || page.name || "Seção",
      questions: [],
    };

    (page.elements || []).forEach((el) => {
      if (!el || !el.type || el.type === "html" || el.type === "expression") return;
      const q = { id: el.name, title: el.title || el.name, required: !!el.isRequired };

      switch (el.type) {
        case "text":
        case "comment":
          q.type = "text";
          q.multiline = el.type === "comment";
          q.inputType = el.inputType === "number" ? "number" : "text";
          if (el.placeholder) q.placeholder = el.placeholder;
          break;
        case "number":
          q.type = "number";
          if (el.min !== undefined) q.min = el.min;
          if (el.max !== undefined) q.max = el.max;
          break;
        case "boolean":
        case "yesno":
          q.type = "boolean";
          break;
        case "radiogroup":
        case "checkbox":
        case "dropdown":
          q.type = "choice";
          q.multiple = el.type === "checkbox";
          q.options = (el.choices || []).map((o) =>
            typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.text || o.label || String(o.value) }
          );
          break;
        case "rating":
        case "likert":
          q.type = "likert";
          q.options = (el.rateValues || el.choices || []).map((o) =>
            typeof o === "string" || typeof o === "number"
              ? { value: o, label: String(o) }
              : { value: o.value, label: o.text || o.label || String(o.value) }
          );
          if (q.options.length === 0) {
            const min = el.rateMin ?? 1;
            const max = el.rateMax ?? 5;
            for (let i = min; i <= max; i++) q.options.push({ value: i, label: String(i) });
          }
          break;
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
          break;
        default:
          q.type = "text";
      }
      customPage.questions.push(q);
    });

    if (customPage.questions.length > 0) {
      custom.pages.push(customPage);
    }
  });

  return custom;
}
