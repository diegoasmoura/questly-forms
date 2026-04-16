import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";

export default function FormPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const surveyRef = useRef(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getForm(id)
      .then((data) => {
        setForm(data);
      })
      .catch((err) => {
        setError(err.message || "Formulário não encontrado");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="text-sm text-emerald-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Erro ao Carregar</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!form || !form.schema) return null;

  const survey = new Model(form.schema);
  survey.mode = "edit";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-500" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {form.title}
              </h1>
              <p className="text-xs text-slate-500">Modo de Teste</p>
            </div>
          </div>
        </div>
      </header>

      {/* Survey Container */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="bg-white rounded-xl border border-slate-200 min-h-full" style={{ maxWidth: '100%' }}>
          <Survey model={survey} ref={surveyRef} />
        </div>
      </div>
    </div>
  );
}
