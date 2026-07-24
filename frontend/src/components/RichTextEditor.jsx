import { useRef, useEffect } from "react";
import { Bold, Italic, Heading2, List, Quote } from "lucide-react";

export default function RichTextEditor({ value, onChange, placeholder = "Descreva como foi a sessão (Evolução clínica)...", minHeight = "140px", maxHeight = "220px" }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-alt)] overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[var(--sage)] focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--surface)] overflow-x-auto hide-scrollbar">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-1.5 rounded-[8px] hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors"
          title="Negrito (Ctrl+B)"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-1.5 rounded-[8px] hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors"
          title="Itálico (Ctrl+I)"
        >
          <Italic size={15} />
        </button>
        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h2>")}
          className="p-1.5 rounded-[8px] hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors"
          title="Título de Seção"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-1.5 rounded-[8px] hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors"
          title="Lista de Tópicos"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<blockquote>")}
          className="p-1.5 rounded-[8px] hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors"
          title="Citação / Fala do Paciente"
        >
          <Quote size={15} />
        </button>
      </div>

      {/* Editor Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight, maxHeight }}
        className="p-3.5 text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none overflow-y-auto leading-relaxed prose prose-sm max-w-none [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-[var(--dark-green)] [&_h2]:mt-2 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--sage)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-1"
        data-placeholder={placeholder}
      />
    </div>
  );
}
