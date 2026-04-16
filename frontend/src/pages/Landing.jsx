import { Link } from "react-router-dom";
import { motion } from "framer-motion";

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
    <div className="flex items-center justify-center py-16 overflow-hidden">
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
    <div className="min-h-screen bg-slate-50 relative flex flex-col">
      {/* Grid Background */}
      <BackgroundGrid color="#10b981" cellSize="40px" strokeWidth="1" fade={true} />

      {/* Nav */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full px-6 py-4 shrink-0"
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
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="inline-block px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Cadastrar
              </Link>
            </motion.div>
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
            className="space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight"
            >
              Formulários clínicos,
              <br />
              <span className="text-emerald-600">sem fricção</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg text-slate-500 max-w-xl mx-auto"
            >
              Chega de papéis confusos e respostas difíceis de interpretar.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-base text-slate-600 max-w-xl mx-auto"
            >
              O Questly Form transforma seus formulários em experiências digitais organizadas, padronizadas e prontas para análise.
            </motion.p>
          </motion.div>
        </div>
      </main>

      {/* Skewed Scroll Animation - 3 columns */}
      <SkewedInfiniteScroll />

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 sm:gap-8 justify-center py-12 px-6 relative z-10"
      >
        <span className="text-sm text-slate-600 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Mais agilidade no atendimento
        </span>
        <span className="text-sm text-slate-600 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Mais clareza nas respostas
        </span>
        <span className="text-sm text-slate-600 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Mais tempo para seus pacientes
        </span>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="w-full py-6 shrink-0"
      >
        <p className="text-xs text-slate-400 text-center">
          Questly Form 2025. Todos os direitos reservados.
        </p>
      </motion.footer>
    </div>
  );
}
