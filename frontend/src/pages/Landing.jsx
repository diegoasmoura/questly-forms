import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SkewedInfiniteScroll = () => {
  const responses = [
    { id: "1", text: "Não, de forma alguma" },
    { id: "2", text: "Sim, alguns dias" },
    { id: "3", text: "Sim, mais da metade dos dias" },
    { id: "4", text: "Sim, todos os dias" },
    { id: "5", text: "Nunca" },
    { id: "6", text: "Raramente" },
    { id: "7", text: "Às vezes" },
    { id: "8", text: "Frequentemente" },
    { id: "9", text: "Sempre" },
    { id: "10", text: "Não me incomoda" },
    { id: "11", text: "É um pouco problemático" },
    { id: "12", text: "É bastante problemático" },
    { id: "13", text: "É extremamente problemático" },
    { id: "14", text: "Pouco ou nada" },
    { id: "15", text: "Um pouco" },
    { id: "16", text: "Bastante" },
    { id: "17", text: "Extremamente" },
    { id: "18", text: "1 a 2 dias" },
    { id: "19", text: "3 a 4 dias" },
    { id: "20", text: "5 a 7 dias" },
    { id: "21", text: "Quase todos os dias" },
    { id: "22", text: "Todo dia" },
    { id: "23", text: "Nenhuma vez" },
    { id: "24", text: "Várias vezes" },
  ];

  const duplicatedResponses = [...responses, ...responses, ...responses, ...responses, ...responses];

  return (
    <div className="flex items-center justify-center py-20 overflow-hidden">
      <div
        className="relative w-full max-w-screen-xl overflow-hidden"
        style={{
          maskComposite: "intersect",
          maskImage: `
            linear-gradient(to right, transparent, black 5rem),
            linear-gradient(to left, transparent, black 5rem),
            linear-gradient(to bottom, transparent, black 5rem),
            linear-gradient(to top, transparent, black 5rem)
          `,
          WebkitMaskComposite: "intersect",
          WebkitMaskImage: `
            linear-gradient(to right, transparent, black 5rem),
            linear-gradient(to left, transparent, black 5rem),
            linear-gradient(to bottom, transparent, black 5rem),
            linear-gradient(to top, transparent, black 5rem)
          `,
        }}
      >
        <div className="mx-auto grid h-[300px] w-[380px] animate-skew-scroll grid-cols-1 gap-4 sm:w-[750px] sm:grid-cols-3">
          {duplicatedResponses.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex cursor-pointer items-center space-x-3 rounded-lg border border-slate-200 bg-white/90 px-4 py-3 shadow-md transition-all hover:-translate-y-1 hover:translate-x-1 hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="h-4 w-4 rounded-full border border-slate-400 bg-white flex items-center justify-center flex-none" />
              <p className="text-slate-600 text-xs font-medium leading-tight">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(16, 185, 129, 0.15) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <motion.nav
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full px-6 py-4"
        >
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-lg font-semibold text-slate-900">Questly Form</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Começar
              </Link>
            </div>
          </div>
        </motion.nav>

        {/* Hero - Centered */}
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight"
              >
                Avalie.
                <br />
                <span className="text-emerald-600">Acompanhe.</span>
                <br />
                Evolua.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg text-slate-500 leading-relaxed max-w-lg mx-auto"
              >
                Formulários clínicos que entendem seus pacientes.
                Escalas validadas, scoring automático e gráficos de evolução — tudo em um só lugar.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 justify-center"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                  Começar agora
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Já tenho conta
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </main>

        {/* Skewed Scroll Animation */}
        <SkewedInfiniteScroll />

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full py-8 mt-auto"
        >
          <p className="text-xs text-slate-400 text-center">
            Questly Form 2025. Todos os direitos reservados.
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
