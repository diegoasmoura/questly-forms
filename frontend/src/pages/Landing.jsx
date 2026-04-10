import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-brand-50">
      {/* Nav */}
      <nav className="flex justify-between items-center h-[90px] px-5 bg-white">
        <Link to="/" className="text-2xl font-bold text-brand-950 tracking-tight">
          curious
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/login" className="btn btn-ghost text-sm">
            Log In
          </Link>
          <Link to="/register" className="btn btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-16 px-5 bg-brand-100">
        <h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-brand-950 leading-[0.9] tracking-tight mb-6"
          style={{ letterSpacing: "-0.02em" }}
        >
          Curious today.
          <br />
          Impact tomorrow.
        </h1>
        <p className="text-lg md:text-xl text-brand-600 max-w-lg mx-auto leading-relaxed">
          Evidence-based tools for scientific discovery and better real-world outcomes.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to="/register" className="btn btn-primary text-base px-8 py-3">
            Start Building Forms
          </Link>
          <Link to="/login" className="btn btn-secondary text-base px-8 py-3">
            Log In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 max-w-6xl mx-auto">
        <h2 className="text-3xl font-semibold text-brand-950 text-center mb-4">
          Everything you need to create powerful forms
        </h2>
        <p className="text-brand-500 text-center max-w-xl mx-auto mb-16">
          Build, share, and analyze forms with a modern, intuitive platform designed for healthcare professionals.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
            title="Drag & Drop Builder"
            description="Create forms visually with our intuitive builder. No coding required."
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.364m-9.566 7.55l9.566 5.364m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            }
            title="Share with Patients"
            description="Generate unique links for each patient. Track who filled what and when."
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
            title="Analytics Dashboard"
            description="View responses, track completion rates, and export data effortlessly."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-brand-950 text-white text-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4">
          Ready to get started?
        </h2>
        <p className="text-brand-300 mb-8 max-w-md mx-auto">
          Create your free account and start building forms in minutes.
        </p>
        <Link to="/register" className="btn bg-white text-brand-950 hover:bg-brand-100 text-base px-8 py-3">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 text-center text-sm text-brand-400">
        <p>Built with SurveyJS • Curious Forms Platform</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card p-8 card-hover">
      <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-950 mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-brand-950 mb-2">{title}</h3>
      <p className="text-brand-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
