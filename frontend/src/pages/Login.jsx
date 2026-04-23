import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigateWithTransition } from "../lib/useNavigateWithTransition";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BackgroundGrid = ({ color = '#10b981', cellSize = '40px', strokeWidth = '1', fade = true, className = '' }) => {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' stroke='${color}' stroke-width='${strokeWidth}' fill-opacity='0.3' fill='none'>
      <path d='M 100 0 L 100 200'/>
      <path d='M 0 100 L 200 100'/>
    </svg>
  `;
  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `url("${svgDataUrl}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: cellSize,
        maskImage: fade
          ? `radial-gradient(ellipse 80% 80% at 50% 50%, white 0%, transparent 100%)`
          : undefined,
        WebkitMaskImage: fade
          ? `radial-gradient(ellipse 80% 80% at 50% 50%, white 0%, transparent 100%)`
          : undefined,
      }}
    />
  );
};

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigateWithTransition();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/home");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-slate-100 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent"
              />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-slate-600 font-medium"
              >
                Entrando...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="min-h-screen bg-slate-100 flex"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {/* Left - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-16">
          <div className="max-w-md text-white">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
              <ArrowLeft size={18} />
              <span className="text-sm">Voltar ao início</span>
            </Link>
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-sm rotate-45 bg-emerald-700 flex items-center justify-center">
                <span className="text-xl font-bold -rotate-45">Q</span>
              </div>
              <span className="text-2xl font-semibold">Questly Forms</span>
            </div>
            <h1 className="text-4xl font-semibold leading-tight mb-4">
              Gerencie seus instrumentos clínicos com facilidade
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              A plataforma completa para profissionais de saúde mental criarem e analisarem avaliações psicológicas.
            </p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 relative overflow-hidden">
          <BackgroundGrid color="#10b981" cellSize="40px" strokeWidth="1" fade={true} />
          <div className="w-full max-w-md relative z-10">
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
      </motion.div>
    </>
  );
}
