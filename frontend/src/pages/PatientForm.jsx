import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";

export default function PatientForm() {
  const { token } = useParams();
  const navigate = useNavigateWithTransition();
  const surveyRef = useRef(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getSharedForm(token)
      .then((data) => {
        setForm(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleComplete = async (survey) => {
    try {
      await api.submitSharedForm(token, survey.data);
      setSubmitted(true);
    } catch (err) {
      alert("Falha ao enviar. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-slate-500" size={32} />
          <p className="text-sm text-slate-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Formulário Indisponível</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Ir para Início
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Muito Obrigado!</h1>
          <p className="text-slate-600 mb-6">
            Suas respostas foram enviadas com sucesso para seu profissional de saúde.
          </p>
          <div className="text-sm text-slate-500">
            Você já pode fechar esta janela.
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-sm rotate-45 bg-emerald-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm -rotate-45">Q</span>
            </div>
            <span className="text-sm font-medium text-slate-900">Questly Forms</span>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">{form.title}</h1>
        <div className="card p-6">
          <Survey
            model={new Model(form.schema)}
            onComplete={handleComplete}
          />
        </div>
      </main>
    </div>
  );
}
