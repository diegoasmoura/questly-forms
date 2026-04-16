import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Nav */}
      <nav className="flex justify-between items-center h-20 px-8 lg:px-16 bg-white border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Q</span>
          </div>
          <span className="text-xl font-semibold text-slate-900">Questly</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn btn-ghost text-sm">
            Entrar
          </Link>
          <Link to="/register" className="btn btn-primary text-sm">
            Começar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-20 lg:py-32 px-8">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Para profissionais de saúde mental</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-slate-900 leading-tight mb-6 tracking-tight">
            Formulários clínicos
            <br />
            <span className="text-emerald-700">com precisão</span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed mb-10">
            Crie, compartilhe e analise avaliações psicológicas. Suporte nativo para PHQ-9, GAD-7 e outros instrumentos validados.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn btn-primary text-base px-8 py-3">
              Criar conta gratuita
            </Link>
            <Link to="/login" className="btn btn-secondary text-base px-8 py-3">
              Ver demonstração
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-8 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-900 text-center mb-12">
          Funcionalidades
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Formulários Validados</h3>
            <p className="text-sm text-slate-600 leading-relaxed">PHQ-9, GAD-7, WHO-5 e outros instrumentos com scoring automático.</p>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Gestão de Pacientes</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Organize e acompanhe o histórico de respostas de cada paciente.</p>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Análises Visuais</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Gráficos de evolução do paciente ao longo do tempo.</p>
          </div>
        </div>
      </section>

      {/* Questionnaires */}
      <section className="py-16 px-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-900 text-center mb-12">
          Questionários disponíveis
        </h2>
        
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { name: "PHQ-9", desc: "Depressão" },
            { name: "GAD-7", desc: "Ansiedade" },
            { name: "WHO-5", desc: "Bem-estar" },
            { name: "BDI-II", desc: "Beck" },
            { name: "EPDS", desc: "Pós-parto" },
            { name: "AUDIT", desc: "Álcool" },
          ].map((q, i) => (
            <div
              key={i}
              className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700"
            >
              {q.name} — {q.desc}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Pronto para começar?
          </h2>
          <p className="text-slate-600 mb-8">
            Crie sua conta gratuita e comece a usar em minutos.
          </p>
          <Link to="/register" className="btn btn-primary text-base px-10 py-3">
            Criar conta gratuita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-emerald-700">
              <span className="text-white font-semibold text-sm">Q</span>
            </div>
            <span className="text-sm font-medium text-slate-700">Questly</span>
          </div>
          <p className="text-sm text-slate-500">
            Plataforma de formulários clínicos
          </p>
        </div>
      </footer>
    </div>
  );
}
