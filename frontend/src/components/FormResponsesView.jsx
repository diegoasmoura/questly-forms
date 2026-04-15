import { useState } from "react";
import { Check, X, ChevronDown, ChevronRight, FileText, ClipboardList } from "lucide-react";

const TRANSLATION_MAP = {
  // GAD-7
  nervous: "Sentir-se nervoso, ansioso ou muito tenso",
  control: "Não ser capaz de parar ou controlar a preocupação",
  worrying: "Preocupar-se demais com diversas coisas",
  relax: "Dificuldade para relaxar",
  restless: "Estar tão inquieto que é difícil permanecer sentado",
  annoyed: "Tornar-se facilmente irritável ou aborrecido",
  afraid: "Sentir medo, como se algo terrível pudesse acontecer",
  // PHQ-9
  interest: "Pouco interesse ou prazer em fazer as coisas",
  down: "Sentir-se triste, deprimido ou sem esperança",
  sleep: "Dificuldade para adormecer ou dormir demais",
  tired: "Sentir-se cansado ou com pouca energia",
  appetite: "Falta de apetite ou comer demais",
  fail: "Sentir-se mal consigo mesmo ou que é um fracasso",
  concentrate: "Dificuldade para concentrar-se nas coisas",
  moving: "Movimentar-se ou falar tão lentamente que outras pessoas poderiam perceber",
  thoughts: "Pensamentos de que seria melhor estar morto ou de se machucar",
};

const COLUMN_TRANSLATION = {
  0: "Nenhuma vez",
  1: "Vários dias",
  2: "Mais da metade dos dias",
  3: "Quase todos os dias",
};

function getTranslatedLabel(key) {
  if (TRANSLATION_MAP[key]) return TRANSLATION_MAP[key];
  return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

function buildQuestionMap(schema) {
  const map = {};
  const sections = [];
  
  if (!schema) return { map, sections };
  
  try {
    const pages = schema.pages || [];
    
    pages.forEach(page => {
      if (page.name === 'inicio') return;
      
      const pageQuestions = [];
      
      function extractQuestions(elements) {
        if (!elements || !Array.isArray(elements)) return;
        elements.forEach(el => {
          if (!el) return;
          if (el.name && el.type && el.type !== 'html' && el.type !== 'expression') {
            const question = {
              name: el.name,
              title: el.title || el.name,
              type: el.type,
              choices: el.choices,
              rows: el.rows,
              columns: el.columns
            };
            pageQuestions.push(question);
            map[el.name] = question;
          }
          if (el.elements) extractQuestions(el.elements);
          if (el.panels) {
            (el.panels || []).forEach(p => extractQuestions(p.elements));
          }
        });
      }
      
      extractQuestions(page.elements || []);
      
      if (pageQuestions.length > 0) {
        sections.push({
          title: page.title || page.name || 'Seção',
          questions: pageQuestions
        });
      }
    });
  } catch (e) {
    console.error("Error building question map:", e);
  }
  
  return { map, sections };
}

function formatValue(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "string") {
    const l = v.toLowerCase();
    if (l === "sim" || l === "yes" || l === "true") return "Sim";
    if (l === "não" || l === "nao" || l === "no" || l === "false") return "Não";
    return v;
  }
  if (Array.isArray(v)) return v;
  if (typeof v === "object") return v;
  return String(v);
}

function isEmptyValue(v) {
  if (v === null || v === undefined || v === "") return true;
  if (typeof v === "object") {
    if (Array.isArray(v)) {
      if (v.length === 0) return true;
      return v.every(item => {
        if (typeof item !== 'object' || item === null) return false;
        return Object.values(item).every(val => 
          val === null || val === undefined || val === ""
        );
      });
    }
    return Object.keys(v).length === 0;
  }
  return false;
}

function formatLabel(key) {
  if (TRANSLATION_MAP[key]) return TRANSLATION_MAP[key];
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
}

function SimpleValue({ value }) {
  const strValue = String(value).toLowerCase();
  const isAnormal = strValue === 'anormal' || strValue === 'yes' || strValue === 'true';
  const isNormal = strValue === 'normal' || strValue === 'nao' || strValue === 'não' || strValue === 'no' || strValue === 'false';
  
  if (value === "Sim" || isAnormal) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-100">
        <Check size={12} /> {isAnormal && value !== "Sim" ? 'Anormal' : 'Sim'}
      </span>
    );
  }
  if (value === "Não" || isNormal) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-100">
        <X size={12} /> {isNormal && value !== "Não" ? 'Não' : 'Não'}
      </span>
    );
  }
  return <span className="text-sm text-brand-800 font-medium whitespace-nowrap bg-brand-50 px-3 py-1.5 rounded-lg">{String(value)}</span>;
}

function ObjectRows({ obj }) {
  const entries = Object.entries(obj).filter(([, v]) => !isEmptyValue(v));
  
  if (entries.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-0.5 bg-brand-50/50 rounded-lg p-2">
      {entries.map(([k, v]) => {
        let displayValue;
        
        if (typeof v === 'object' && v !== null) {
          displayValue = v.valor || v.value || v.resposta || v.teve_tem || Object.values(v)[0];
        } else {
          displayValue = String(v);
        }
        
        return (
          <div key={k} className="flex items-start justify-between gap-3 py-1 px-2 bg-white rounded-lg">
            <span className="text-[11px] text-brand-600 flex-1 min-w-0">
              {formatLabel(k)}
            </span>
            <div className="flex-shrink-0">
              <SimpleValue value={displayValue} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatrixRows({ value, rows, columns }) {
  if (!rows || rows.length === 0) {
    return <ObjectRows obj={value} />;
  }
  
  const cols = columns && columns.length > 0 ? columns : [];
  
  return (
    <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
      {/* Header */}
      <div className="flex bg-brand-100 border-b border-brand-200">
        <div className="flex-1 px-4 py-3">
          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Questão</span>
        </div>
        <div className="flex">
          {cols.map((col, idx) => (
            <div 
              key={idx} 
              className="px-2 py-3 text-center border-l border-brand-200"
              style={{ width: '80px' }}
            >
              <span className="text-xs font-medium text-brand-700 leading-tight block">
                {col.text}
              </span>
              <span className="text-xs text-brand-500 font-bold">
                ({col.value})
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {rows.map((row, rowIdx) => {
        const rowKey = row.value || row;
        const rowValue = value[rowKey];
        const rowLabel = row.text || getTranslatedLabel(String(rowKey));
        
        let displayValue = null;
        if (!isEmptyValue(rowValue)) {
          if (typeof rowValue === 'object') {
            displayValue = rowValue.valor || rowValue.value || rowValue.resposta || rowValue.teve_tem || Object.values(rowValue)[0];
          } else {
            displayValue = rowValue;
          }
        }
        
        const bgColor = rowIdx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/50';
        
        return (
          <div 
            key={rowKey} 
            className={`flex border-b border-brand-100 last:border-b-0 ${bgColor}`}
          >
            <div className="flex-1 px-4 py-3.5">
              <span className="text-sm text-brand-700 leading-relaxed">
                {rowLabel}
              </span>
            </div>
            <div className="flex items-center">
              {cols.map((col, colIdx) => {
                const isSelected = displayValue === col.value;
                return (
                  <div 
                    key={colIdx} 
                    className="flex items-center justify-center py-3.5 border-l border-brand-100"
                    style={{ width: '80px' }}
                  >
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-brand-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ArrayRows({ value }) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-1">
      {value.map((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          const rows = <ObjectRows key={idx} obj={item} />;
          if (rows === null) return null;
          return rows;
        }
        return (
          <div key={idx} className="flex items-center gap-2">
            <SimpleValue value={item} />
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
}

function ValueDisplay({ value, questionType, question }) {
  if (isEmptyValue(value)) {
    return null;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (questionType === 'matrixdynamic') {
      const rendered = <ArrayRows value={value} />;
      return rendered;
    }
    return <ArrayRows value={value} />;
  }
  
  if (typeof value === "object" && value !== null) {
    if (questionType === 'matrixdropdown' || questionType === 'matrix') {
      return <MatrixRows value={value} rows={question?.rows} columns={question?.columns} />;
    }
    return <ObjectRows obj={value} />;
  }
  
  return <SimpleValue value={value} />;
}

function QuestionRow({ title, value, questionType, question, isLast }) {
  if (isEmptyValue(value)) {
    return null;
  }
  
  const isComplexValue = typeof value === 'object' || Array.isArray(value);
  
  if (isComplexValue) {
    return (
      <div className={`py-3 ${!isLast ? 'border-b border-brand-50' : ''}`}>
        <div className="text-xs text-brand-600 font-medium mb-2">{title}</div>
        <ValueDisplay value={value} questionType={questionType} question={question} />
      </div>
    );
  }
  
  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${!isLast ? 'border-b border-brand-50' : ''}`}>
      <span className="text-xs text-brand-700 font-medium flex-1 min-w-0">{title}</span>
      <div className="flex-shrink-0">
        <ValueDisplay value={value} questionType={questionType} question={question} />
      </div>
    </div>
  );
}

function SectionPanel({ title, questions, data }) {
  const [isOpen, setIsOpen] = useState(true);
  
  const answered = questions.filter(q => {
    const v = data[q.name];
    return !isEmptyValue(v);
  });
  
  if (answered.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl border border-brand-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-brand-50/50 hover:bg-brand-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ClipboardList size={16} className="text-brand-500" />
          <span className="text-sm font-bold text-brand-800 uppercase tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-brand-500 bg-brand-100 px-3 py-1 rounded-full">
            {answered.length} respostas
          </span>
          {isOpen ? (
            <ChevronDown size={18} className="text-brand-400" />
          ) : (
            <ChevronRight size={18} className="text-brand-400" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-5 py-4">
          {answered.map((q, idx) => (
            <QuestionRow 
              key={q.name} 
              title={q.title} 
              value={data[q.name]} 
              questionType={q.type}
              question={q}
              isLast={idx === answered.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FormResponsesView({ schema, data }) {
  if (!schema) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-brand-300">
        <FileText size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Schema não disponível</p>
        <p className="text-xs text-brand-400 mt-1">As perguntas não podem ser exibidas sem o schema do formulário.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-brand-300">
        <FileText size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Sem dados de resposta</p>
      </div>
    );
  }
  
  const entries = Object.entries(data).filter(([, v]) => !isEmptyValue(v));
  
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-brand-300">
        <FileText size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Nenhuma resposta registrada</p>
      </div>
    );
  }
  
  const { sections } = buildQuestionMap(schema);
  
  if (sections.length === 0) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-brand-100">
          <ClipboardList size={16} className="text-brand-500" />
          <p className="text-xs text-brand-600 font-bold uppercase tracking-wide">Respostas ({entries.length})</p>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-4">
          {entries.map(([key, value]) => (
            <QuestionRow
              key={key}
              title={key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
              value={value}
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-3 border-b border-brand-100">
        <ClipboardList size={16} className="text-brand-500" />
        <p className="text-xs text-brand-600 font-bold uppercase tracking-wide">Respostas do Paciente</p>
      </div>
      {sections.map((section, i) => (
        <SectionPanel
          key={i}
          title={section.title}
          questions={section.questions}
          data={data}
        />
      ))}
    </div>
  );
}
