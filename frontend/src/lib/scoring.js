const ysqSchemas = [
  { code: "pe", name: "Privação Emocional", start: 1, end: 9 },
  { code: "ai_ab", name: "Abandono/Instabilidade", start: 10, end: 26 },
  { code: "da", name: "Desconfiança/Abuso", start: 27, end: 43 },
  { code: "is", name: "Isolamento Social", start: 44, end: 53 },
  { code: "dv", name: "Defectividade/Vergonha", start: 54, end: 68 },
  { code: "fr", name: "Fracasso", start: 69, end: 77 },
  { code: "di", name: "Dependência/Incompetência", start: 78, end: 92 },
  { code: "vd", name: "Vulnerabilidade ao Dano", start: 93, end: 104 },
  { code: "em", name: "Emaranhamento", start: 105, end: 115 },
  { code: "sb", name: "Subjugação", start: 116, end: 125 },
  { code: "as", name: "Autossacrifício", start: 126, end: 142 },
  { code: "ie", name: "Inibição Emocional", start: 143, end: 151 },
  { code: "pi", name: "Padrões Inflexíveis", start: 152, end: 167 },
  { code: "ag", name: "Arrogo/Grandiosidade", start: 168, end: 178 },
  { code: "ai_id", name: "Autodisciplina Insuficiente", start: 179, end: 193 },
  { code: "ba", name: "Busca de Aprovação", start: 194, end: 207 },
  { code: "np", name: "Negatividade/Pessimismo", start: 208, end: 218 },
  { code: "pp", name: "Postura Punitiva", start: 219, end: 232 },
];

const ysqSchemaCodes = new Set(ysqSchemas.map(s => s.code));

function hasYsqMatrixData(data) {
  return Object.keys(data).some(k => ysqSchemaCodes.has(k));
}

function hasYsqIndividualData(data) {
  const keys = Object.keys(data);
  if (keys.length === 0) return false;
  const numericKeys = keys.filter(k => /^\d+$/.test(k));
  if (numericKeys.length === 0) return false;
  const inRange = numericKeys.filter(k => Number(k) >= 1 && Number(k) <= 232);
  return inRange.length >= 5;
}

function getItemScore(data, itemNumber) {
  const str = String(itemNumber);
  const val = data[str];
  if (val !== undefined && val !== null) {
    const n = Number(val);
    if (n >= 1 && n <= 6) return n;
  }
  return null;
}

function computeYsqResult(data, getScore) {
  const schemaResults = ysqSchemas.map(schema => {
    let sum = 0;
    let count = 0;
    for (let n = schema.start; n <= schema.end; n++) {
      const score = getScore(data, n);
      if (score !== null) {
        sum += score;
        count++;
      }
    }
    const avg = count > 0 ? Math.round((sum / count) * 100) / 100 : null;
    const severity = severityFromAvg(avg);
    return {
      code: schema.code,
      name: schema.name,
      average: avg,
      level: severity?.level || "N/A",
      color: severity?.color || "",
      itemCount: schema.end - schema.start + 1,
      answeredCount: count,
    };
  });

  const validAvgs = schemaResults.filter(r => r.average !== null).map(r => r.average);
  const overallAvg = validAvgs.length > 0
    ? Math.round((validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length) * 100) / 100
    : null;
  const overallSeverity = severityFromAvg(overallAvg);
  const highest = schemaResults.reduce((max, r) => (r.average !== null && (max === null || r.average > max)) ? r.average : max, null);
  const highestSchema = highest !== null ? schemaResults.find(r => r.average === highest) : null;

  return {
    type: "clinical",
    title: "YSQ-L3 - Perfil de Esquemas",
    score: overallAvg,
    maxScore: 6,
    severity: overallSeverity?.level || "N/A",
    color: overallSeverity?.color || "",
    alert: highest !== null && highest > 4.5
      ? `Atenção: ${highestSchema?.name || "Esquema"} com média ${highest.toFixed(2)} (Muito Alta)`
      : null,
    interpretation: overallAvg !== null
      ? `Média geral de ${overallAvg.toFixed(2)} de 6 pontos. ${schemaResults.filter(r => r.level === "Alta" || r.level === "Muito Alta").length} esquema(s) com nível elevado.`
      : "Nenhum dado de esquema disponível para análise.",
    schemaDetails: schemaResults,
  };
}

const severityFromAvg = (avg) => {
  if (avg === null || avg === undefined) return null;
  if (avg <= 2.0) return { level: "Baixa", color: "text-secondary-600 bg-secondary-50 border-secondary-100" };
  if (avg <= 3.5) return { level: "Moderada", color: "text-amber-600 bg-amber-50 border-amber-200" };
  if (avg <= 4.5) return { level: "Alta", color: "text-orange-600 bg-orange-50 border-orange-200" };
  return { level: "Muito Alta", color: "text-red-600 bg-red-50 border-red-200" };
};

export const scoreTest = (templateId, data) => {
  if (!data) return null;

  // YSQ-L3 Scoring Logic
  if (templateId === "ysq_l3" || hasYsqMatrixData(data) || hasYsqIndividualData(data)) {
    if (hasYsqMatrixData(data)) {
      return computeYsqResult(data, (d, n) => {
        for (const schema of ysqSchemas) {
          const matrixData = d[schema.code];
          if (matrixData && typeof matrixData === "object") {
            const score = Number(matrixData[String(n)]);
            if (score >= 1 && score <= 6) return score;
          }
        }
        return null;
      });
    }
    return computeYsqResult(data, (d, n) => {
      const score = Number(d[String(n)]);
      return (score >= 1 && score <= 6) ? score : null;
    });
  }

  // PHQ-9 Scoring Logic
  if (templateId === "phq9" || (data.phq9_items)) {
    const items = data.phq9_items || {};
    const totalScore = Object.values(items).reduce((sum, val) => sum + (Number(val) || 0), 0);
    
    let severity = "Mínima";
    let color = "text-secondary-600 bg-secondary-50 border-secondary-100";
    
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
    let color = "text-secondary-600 bg-secondary-50 border-secondary-100";
    
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
