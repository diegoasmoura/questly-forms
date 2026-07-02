import { useState, useEffect } from "react";

export function useQuickNotes() {
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("questly_dashboard_notes") || "[]");
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState("");

  useEffect(() => {
    localStorage.setItem("questly_dashboard_notes", JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      completed: false,
    };
    setNotes((prev) => [...prev, newNote]);
    setNewNoteText("");
  };

  const toggleNote = (id) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n))
    );
  };

  const editNote = (id, newText) => {
    if (!newText.trim()) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text: newText.trim() } : n))
    );
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notes,
    newNoteText,
    setNewNoteText,
    addNote,
    toggleNote,
    editNote,
    deleteNote,
  };
}
