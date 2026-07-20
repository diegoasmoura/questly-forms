import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { convertSurveyJSToCustom } from "../lib/formSchema";
import CustomFormRenderer from "../components/CustomFormRenderer";

export default function FormPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getForm(id)
      .then((data) => {
        setForm(data);
        setSchema(convertSurveyJSToCustom(data.schema));
      })
      .catch((err) => {
        setError(err.message || "Formulário não encontrado");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[var(--sage)]" size={32} />
          <p className="text-sm text-[var(--text-secondary)]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Erro ao Carregar</h1>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!form || !schema) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col overflow-hidden">
      <header className="bg-[var(--surface)] border-b border-[var(--border)] shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[var(--surface-alt)] rounded-[10px] transition-colors"
            >
              <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">
                {form.title}
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-medium">Modo de Teste</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 md:p-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <CustomFormRenderer
            schema={schema}
            preview
            formTitle={form.title}
          />
        </div>
      </div>
    </div>
  );
}
