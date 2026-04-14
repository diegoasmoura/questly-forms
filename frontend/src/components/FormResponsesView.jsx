import { useState } from "react";
import { Check, X, ChevronDown, ChevronRight, FileText } from "lucide-react";

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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
        <Check size={10} /> {isAnormal && value !== "Sim" ? 'Anormal' : 'Sim'}
      </span>
    );
  }
  if (value === "Não" || isNormal) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
        <X size={10} /> {isNormal && value !== "Não" ? 'Não' : 'Não'}
      </span>
    );
  }
  return <span className="text-xs text-gray-800 font-medium whitespace-nowrap">{String(value)}</span>;
}

function ObjectRows({ obj }) {
  const entries = Object.entries(obj).filter(([, v]) => !isEmptyValue(v));
  
  if (entries.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(([k, v]) => {
        let displayValue;
        
        if (typeof v === 'object' && v !== null) {
          displayValue = v.valor || v.value || v.resposta || v.teve_tem || Object.values(v)[0];
        } else {
          displayValue = String(v);
        }
        
        return (
          <div key={k} className="flex items-start justify-between gap-4 py-0.5">
            <span className="text-xs text-gray-600 flex-1 min-w-0">
              {formatLabel(k)}:
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

function MatrixRows({ value, rows }) {
  if (!rows || rows.length === 0) {
    return <ObjectRows obj={value} />;
  }
  
  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((row, idx) => {
        const rowKey = row.value || row;
        const rowValue = value[rowKey];
        
        if (isEmptyValue(rowValue)) {
          return (
            <div key={rowKey} className="flex items-start justify-between gap-4 py-0.5">
              <span className="text-xs text-gray-600 flex-1 min-w-0">
                {row.text || formatLabel(String(rowKey))}:
              </span>
              <div className="flex-shrink-0">
                <SimpleValue value="Não" />
              </div>
            </div>
          );
        }
        
        let displayValue;
        if (typeof rowValue === 'object') {
          displayValue = rowValue.valor || rowValue.value || rowValue.resposta || rowValue.teve_tem || Object.values(rowValue)[0];
        } else {
          displayValue = String(rowValue);
        }
        
        return (
          <div key={rowKey} className="flex items-start justify-between gap-4 py-0.5">
            <span className="text-xs text-gray-600 flex-1 min-w-0">
              {row.text || formatLabel(String(rowKey))}:
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
    if (questionType === 'matrixdropdown') {
      return <MatrixRows value={value} rows={question?.rows} />;
    }
    return <ObjectRows obj={value} />;
  }
  
  return <SimpleValue value={value} />;
}

function QuestionRow({ title, value, questionType, question }) {
  if (isEmptyValue(value)) {
    return null;
  }
  
  const isComplexValue = typeof value === 'object' || Array.isArray(value);
  
  if (isComplexValue) {
    return (
      <div className="py-2 border-b border-gray-100">
        <div className="text-xs text-gray-700 font-medium mb-2">{title}</div>
        <ValueDisplay value={value} questionType={questionType} question={question} />
      </div>
    );
  }
  
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100">
      <span className="text-xs text-gray-700 font-medium flex-1 min-w-0">{title}</span>
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
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {answered.length}
          </span>
          {isOpen ? (
            <ChevronDown size={16} className="text-gray-500" />
          ) : (
            <ChevronRight size={16} className="text-gray-500" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 py-2 bg-white">
          {answered.map(q => (
            <QuestionRow 
              key={q.name} 
              title={q.title} 
              value={data[q.name]} 
              questionType={q.type}
              question={q}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FormResponsesView({ schema, data }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <FileText size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Sem dados de resposta</p>
      </div>
    );
  }
  
  const entries = Object.entries(data).filter(([, v]) => !isEmptyValue(v));
  
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <FileText size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Nenhuma resposta registrada</p>
      </div>
    );
  }
  
  const { sections } = buildQuestionMap(schema);
  
  if (sections.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-gray-500 mb-3 font-bold">Respostas ({entries.length})</p>
        {entries.map(([key, value]) => (
          <QuestionRow
            key={key}
            title={key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
            value={value}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
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
