/**
 * DecorativeElements — QF Human Crafted Digital
 * Elementos extraídos diretamente do template (Shapes sólidos, brush strokes, botânica detalhada).
 */

const BotanicalSprig = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 180 C 70 130, 90 90, 130 30" stroke="var(--dark-green)" strokeWidth="3" strokeLinecap="round" />
    <path d="M 66 150 C 40 140, 10 150, 5 170 C 25 180, 50 170, 66 150 Z" fill="var(--brand-50)" stroke="var(--dark-green)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M 66 150 C 45 150, 25 155, 5 170" stroke="var(--dark-green)" strokeWidth="1.5" />
    <path d="M 76 120 C 105 125, 135 145, 140 170 C 120 165, 95 145, 76 120 Z" fill="var(--brand-50)" stroke="var(--dark-green)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M 76 120 C 100 130, 120 145, 140 170" stroke="var(--dark-green)" strokeWidth="1.5" />
    <path d="M 92 80 C 70 60, 35 55, 20 75 C 40 90, 70 90, 92 80 Z" fill="var(--brand-50)" stroke="var(--dark-green)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M 92 80 C 70 70, 45 70, 20 75" stroke="var(--dark-green)" strokeWidth="1.5" />
    <path d="M 110 60 C 135 55, 160 65, 175 90 C 160 80, 135 75, 110 60 Z" fill="var(--brand-50)" stroke="var(--dark-green)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M 110 60 C 135 65, 155 75, 175 90" stroke="var(--dark-green)" strokeWidth="1.5" />
    <path d="M 130 30 C 120 5, 125 -15, 150 -25 C 150 0, 145 15, 130 30 Z" fill="var(--brand-50)" stroke="var(--dark-green)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M 130 30 C 135 10, 145 0, 150 -25" stroke="var(--dark-green)" strokeWidth="1.5" />
  </svg>
);

const PeachBlob = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 20 75 C 10 30, 60 10, 100 15 C 150 20, 190 40, 180 90 C 170 140, 120 145, 80 135 C 30 125, 30 120, 20 75 Z" fill="var(--peach-light)" />
    <path d="M 40 40 L 160 100 M 50 30 L 170 90 M 30 50 L 150 110 M 20 70 L 130 125" stroke="var(--peach)" strokeWidth="1" opacity="0.15" strokeLinecap="round" />
  </svg>
);

const SageBrush = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 300 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 20 50 C 60 30, 150 10, 280 40 C 270 60, 180 80, 40 70 Z" fill="var(--brand-100)" />
    <path d="M 10 55 C 50 35, 140 15, 270 45" stroke="var(--brand-200)" strokeWidth="4" opacity="0.4" strokeLinecap="round" />
    <path d="M 30 45 C 70 25, 160 5, 290 35" stroke="var(--brand-200)" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
  </svg>
);

const PeachCircle = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="var(--peach-light)" />
  </svg>
);

const InkDots = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="3" fill="var(--dark-green)" opacity="0.5" />
    <circle cx="45" cy="15" r="2.5" fill="var(--dark-green)" opacity="0.4" />
    <circle cx="70" cy="25" r="2" fill="var(--dark-green)" opacity="0.5" />
    <circle cx="30" cy="45" r="2.5" fill="var(--dark-green)" opacity="0.45" />
    <circle cx="55" cy="40" r="3" fill="var(--dark-green)" opacity="0.5" />
    <circle cx="80" cy="50" r="2" fill="var(--dark-green)" opacity="0.4" />
    <circle cx="40" cy="65" r="2" fill="var(--dark-green)" opacity="0.5" />
    <circle cx="65" cy="70" r="2.5" fill="var(--dark-green)" opacity="0.4" />
  </svg>
);

export default function DecorativeElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* ─── MOBILE & DESKTOP ─── */}
      
      {/* Galho verde saindo sutilmente da esquerda (posição segura) */}
      <BotanicalSprig className="absolute top-[10%] -left-8 w-40 h-40 opacity-90 rotate-12" />

      {/* Círculo Pêssego limpo no canto superior direito */}
      <PeachCircle className="absolute -top-10 -right-10 w-40 h-40 opacity-80" />

      {/* Canto inferior esquerdo: Mancha Pêssego + Pincelada Verde */}
      <div className="absolute bottom-4 -left-10 opacity-90 scale-75 md:scale-100 origin-bottom-left">
        <PeachBlob className="absolute top-0 left-0 w-64 h-48" />
        <SageBrush className="absolute top-12 left-4 w-72 h-20 rotate-[-10deg]" />
      </div>

      {/* Pontilhados orgânicos para dar o tom artesanal */}
      <InkDots className="absolute top-[25%] right-6 w-24 h-20" />
      <InkDots className="absolute bottom-[20%] left-6 w-24 h-20 hidden md:block" />

      {/* ─── APENAS DESKTOP ─── */}
      {/* Mais galhos e formas preenchendo as grandes áreas cinzas/brancas */}
      <BotanicalSprig className="hidden lg:block absolute bottom-12 -right-6 w-56 h-56 opacity-80 scale-x-[-1] -rotate-12" />
      <PeachBlob className="hidden lg:block absolute top-[40%] -right-16 w-80 h-64 opacity-60 rotate-45" />
      <PeachCircle className="hidden xl:block absolute top-[55%] left-[5%] w-32 h-32 opacity-60" />
    </div>
  );
}

