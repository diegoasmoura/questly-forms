import { useState, useEffect, useCallback } from "react";
import { Check, X, AlertCircle } from "lucide-react";

let toastId = 0;
let addToastFn = null;

export function toast(message, type = "success", duration = 3000) {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type, duration });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onRemove]);

  const bg = t.type === "success" ? "bg-emerald-600" : "bg-red-500";
  const Icon = t.type === "success" ? Check : AlertCircle;

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${bg} animate-slide-up`}
      style={{ animation: "slideUp 0.3s ease-out" }}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{t.message}</span>
      <button onClick={() => onRemove(t.id)} className="p-0.5 hover:opacity-80 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}
