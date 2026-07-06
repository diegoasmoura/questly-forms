import { useState } from "react";
import { Trash2, Plus, Pencil, Check, X } from "lucide-react";

export function QuickNotesWidget({ notes, newNoteText, setNewNoteText, addNote, toggleNote, editNote, deleteNote }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditValue(note.text);
  };

  const saveEdit = () => {
    if (editingId) {
      editNote(editingId, editValue);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setEditingId(null);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 flex flex-col lg:flex-1 lg:min-h-0">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-3 flex-shrink-0">
        Lembretes Rápidos
      </p>
      
      <div className="lg:flex-1 overflow-y-auto pr-1 mb-2 lg:min-h-0 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[12px] text-[var(--text-muted)] py-4 text-center">Nenhum lembrete cadastrado</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notes.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-2 group py-2 border-b border-[var(--border)] last:border-b-0">
                {editingId === n.id ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={saveEdit}
                      className="flex-1 bg-[var(--surface-alt)] border border-[var(--sage)] rounded-[6px] px-2 py-1 text-[12px] text-[var(--text-primary)] focus:outline-none transition-colors"
                    />
                  </div>
                ) : (
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={n.completed}
                      onChange={() => toggleNote(n.id)}
                      className="w-[14px] h-[14px] rounded border-[var(--border)] text-[var(--sage)] focus:ring-[var(--sage)] cursor-pointer"
                    />
                    <span className={`text-[12px] truncate transition-all duration-150 ${n.completed ? "line-through text-[var(--text-muted)] opacity-60" : "text-[var(--text-primary)] font-medium"}`}>
                      {n.text}
                    </span>
                  </label>
                )}

                {editingId !== n.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => startEditing(n)}
                      className="text-[var(--text-muted)] hover:text-[var(--blue)] p-0.5 rounded transition-colors"
                      title="Editar"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 p-0.5 rounded transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 flex-shrink-0">
        <input
          type="text"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder="Adicionar lembrete..."
          className="flex-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-[10px] px-3 py-1.5 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--sage)] transition-colors"
        />
        <button
          onClick={addNote}
          disabled={!newNoteText.trim()}
          className="w-[32px] h-[32px] rounded-[10px] bg-[var(--sage)] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--dark-green)] transition-colors flex-shrink-0"
          title="Adicionar"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
