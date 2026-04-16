import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-16">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-lg bg-emerald-700 flex items-center justify-center">
              <span className="text-xl font-bold">Q</span>
            </div>
            <span className="text-2xl font-semibold">Questly</span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight mb-4">
            Gerencie seus formulários clínicos com facilidade
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            A plataforma completa para profissionais de saúde mental criarem e analisarem avaliações psicológicas.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-12">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center">
              <span className="text-white font-semibold">Q</span>
            </div>
            <span className="text-xl font-semibold text-slate-900">Questly</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Entrar</h2>
            <p className="text-slate-600">Preencha seus dados para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@exemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Entrar"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Não tem uma conta?{" "}
            <Link to="/register" className="font-medium text-emerald-700 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
