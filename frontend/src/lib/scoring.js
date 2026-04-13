export const scoreTest = (templateId, data) => {
  if (!data) return null;

  // PHQ-9 Scoring Logic
  if (templateId === "phq9" || (data.phq9_items)) {
    const items = data.phq9_items || {};
    const totalScore = Object.values(items).reduce((sum, val) => sum + (Number(val) || 0), 0);
    
    let severity = "Mínima";
    let color = "text-emerald-600 bg-emerald-50 border-emerald-100";
    
    if (totalScore >= 20) {
      severity = "Grave";
      color = "text-red-600 bg-red-50 border-red-200";
    } else if (totalScore >= 15) {
      severity = "Moderadamente Grave";
      color = "text-orange-600 bg-orange-50 border-orange-200";
    } else if (totalScore >= 10) {
      severity = "Moderada";
      color = "text-amber-600 bg-amber-50 border-amber-200";
    } else if (totalScore >= 5) {
      severity = "Leve";
      color = "text-blue-600 bg-blue-50 border-blue-200";
    }

    const hasSuicidalIdeation = Number(items.suicide) > 0;

    return {
      type: "clinical",
      title: "Resultado PHQ-9",
      score: totalScore,
      maxScore: 27,
      severity,
      color,
      alert: hasSuicidalIdeation ? "Atenção: Ideação Suicida Detectada" : null,
      interpretation: getPHQ9Interpretation(totalScore)
    };
  }

  // GAD-7 Scoring Logic
  if (templateId === "gad7" || (data.gad7_items)) {
    const items = data.gad7_items || {};
    const totalScore = Object.values(items).reduce((sum, val) => sum + (Number(val) || 0), 0);
    
    let severity = "Mínima";
    let color = "text-emerald-600 bg-emerald-50 border-emerald-100";
    
    if (totalScore >= 15) {
      severity = "Ansiedade Grave";
      color = "text-red-600 bg-red-50 border-red-200";
    } else if (totalScore >= 10) {
      severity = "Ansiedade Moderada";
      color = "text-orange-600 bg-orange-50 border-orange-200";
    } else if (totalScore >= 5) {
      severity = "Ansiedade Leve";
      color = "text-blue-600 bg-blue-50 border-blue-200";
    }

    return {
      type: "clinical",
      title: "Resultado GAD-7",
      score: totalScore,
      maxScore: 21,
      severity,
      color,
      interpretation: "Escala de ansiedade baseada no GAD-7."
    };
  }

  return { type: "generic" };
};

const getPHQ9Interpretation = (score) => {
  if (score >= 20) return "Sintomas depressivos graves. Necessita de intervenção imediata e possível encaminhamento psiquiátrico.";
  if (score >= 15) return "Sintomas moderadamente graves. Recomenda-se psicoterapia intensiva e avaliação médica.";
  if (score >= 10) return "Sintomas moderados. Sugere-se monitoramento clínico e psicoterapia.";
  if (score >= 5) return "Sintomas leves. Acompanhamento e observação de evolução.";
  return "Sintomas mínimos ou ausentes.";
};
