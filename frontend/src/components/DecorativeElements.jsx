/**
 * DecorativeElements — QF Human Crafted Digital
 *
 * Elementos puramente visuais/artesanais. Nunca decoram áreas funcionais.
 * Ficam num layer fixo atrás de todo o conteúdo (z-0 / pointer-events-none).
 *
 * Catálogo:
 *  - LeafDetailed     — folha botânica com nervuras desenhadas à mão
 *  - BotanicalSprig   — galho com 3 folhinhas
 *  - WatercolorBlob   — mancha aquarelada com blur suave
 *  - OrganicCircle    — círculo imperfeito (stroke variado)
 *  - InkDots          — pontos irregulares como tinta pingada
 *  - HandBrushStroke  — pincelada horizontal orgânica
 */

/* ─── Folha botânica detalhada com nervuras ───────────────────────── */
const LeafDetailed = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 100 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Contorno principal da folha */}
    <path
      d="M50 8 C28 28 14 58 18 92 C22 118 36 132 50 130 C64 128 76 116 80 92 C84 66 72 34 55 14 C52 10 50 7 50 8Z"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Nervura central */}
    <path
      d="M50 8 C52 40 56 72 68 100"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
    {/* Nervuras laterais esquerda */}
    <path d="M48 30 C40 34 30 36 22 38" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.45" />
    <path d="M49 50 C40 55 30 58 21 62" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.4" />
    <path d="M50 70 C42 76 34 80 26 85" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.35" />
    {/* Nervuras laterais direita */}
    <path d="M52 34 C60 37 68 38 76 38" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.45" />
    <path d="M53 54 C61 58 68 60 76 62" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.4" />
    <path d="M55 74 C63 79 70 82 77 86" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.35" />
  </svg>
);

/* ─── Galho botânico com 3 folhinhas ──────────────────────────────── */
const BotanicalSprig = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Haste principal */}
    <path
      d="M20 110 C35 85 55 60 70 30"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
    />
    {/* Folha 1 — topo */}
    <path
      d="M70 30 C55 20 42 22 38 35 C50 35 62 32 70 30Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path d="M70 30 C60 27 48 30 42 35" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
    {/* Folha 2 — meio-esquerda */}
    <path
      d="M52 62 C38 50 25 52 22 64 C34 65 46 63 52 62Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      opacity="0.75"
    />
    <path d="M52 62 C40 58 28 61 24 66" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
    {/* Folha 3 — meio-direita */}
    <path
      d="M60 50 C74 40 86 44 86 56 C76 56 65 52 60 50Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      opacity="0.75"
    />
    <path d="M60 50 C72 46 82 50 84 56" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
  </svg>
);

/* ─── Mancha aquarelada com blur ──────────────────────────────────── */
const WatercolorBlob = ({ className = "", color = "var(--sage-light)" }) => (
  <div
    className={`rounded-[60%_40%_55%_45%_/_50%_60%_40%_55%] ${className}`}
    style={{
      background: color,
      filter: "blur(28px)",
      opacity: 0.55,
    }}
  />
);

/* ─── Círculo orgânico imperfeito ─────────────────────────────────── */
const OrganicCircle = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Círculo exterior ligeiramente irregular */}
    <path
      d="M100 14 C130 12 158 28 170 55 C184 86 178 122 158 144 C136 168 104 178 74 166 C44 154 22 128 18 96 C14 64 30 34 56 20 C70 13 86 15 100 14Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      opacity="0.25"
    />
    {/* Círculo interior */}
    <path
      d="M100 40 C120 38 140 50 148 70 C158 94 150 122 132 136 C112 152 86 152 68 138 C50 124 44 98 54 76 C62 58 80 42 100 40Z"
      stroke="currentColor"
      strokeWidth="0.9"
      fill="none"
      opacity="0.15"
    />
    {/* Preenchimento muito suave no centro */}
    <circle cx="100" cy="100" r="30" fill="currentColor" opacity="0.05" />
  </svg>
);

/* ─── Pontos irregulares como tinta pingada ───────────────────────── */
const InkDots = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 180 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="20"  cy="18"  r="3.5" fill="currentColor" opacity="0.12" />
    <circle cx="45"  cy="8"   r="2"   fill="currentColor" opacity="0.08" />
    <circle cx="72"  cy="22"  r="4"   fill="currentColor" opacity="0.07" />
    <circle cx="98"  cy="10"  r="2.5" fill="currentColor" opacity="0.10" />
    <circle cx="128" cy="20"  r="3"   fill="currentColor" opacity="0.09" />
    <circle cx="156" cy="6"   r="2"   fill="currentColor" opacity="0.07" />
    <circle cx="35"  cy="50"  r="2"   fill="currentColor" opacity="0.08" />
    <circle cx="60"  cy="62"  r="3.5" fill="currentColor" opacity="0.06" />
    <circle cx="90"  cy="55"  r="2"   fill="currentColor" opacity="0.09" />
    <circle cx="118" cy="66"  r="4"   fill="currentColor" opacity="0.07" />
    <circle cx="148" cy="52"  r="2.5" fill="currentColor" opacity="0.08" />
    <circle cx="172" cy="72"  r="2"   fill="currentColor" opacity="0.06" />
  </svg>
);

/* ─── Pincelada horizontal orgânica ──────────────────────────────── */
const HandBrushStroke = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 320 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Traço principal com espessura variada */}
    <path
      d="M8 18 C30 14 58 22 92 17 C126 12 158 24 194 18 C228 12 260 22 312 16"
      stroke="currentColor"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.14"
    />
    {/* Segundo traço mais fino — sensação de pincel real */}
    <path
      d="M20 23 C55 19 90 28 130 22 C170 16 210 26 280 20"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.08"
    />
    {/* Terceiro traço — quase invisível */}
    <path
      d="M40 28 C80 25 120 32 160 27 C200 22 240 30 300 26"
      stroke="currentColor"
      strokeWidth="0.8"
      fill="none"
      strokeLinecap="round"
      opacity="0.05"
    />
  </svg>
);

/* ─── Composição padrão (layer fixo de fundo) ─────────────────────── */
export default function DecorativeElements() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Canto superior esquerdo — folha grande verde-sage */}
      <LeafDetailed className="absolute -top-10 -left-6 w-28 h-40 text-[var(--sage)] opacity-[0.18] rotate-12" />

      {/* Canto inferior direito — folha espelhada verde escuro */}
      <LeafDetailed className="absolute -bottom-8 -right-4 w-32 h-44 text-[var(--dark-green)] opacity-[0.14] -rotate-6 scale-x-[-1]" />

      {/* Canto superior direito — galho botânico pêssego */}
      <BotanicalSprig className="absolute top-8 -right-6 w-36 h-36 text-[var(--peach)] opacity-[0.20] rotate-45" />

      {/* Centro esquerda — galho botânico roxo suave */}
      <BotanicalSprig className="absolute top-1/2 -left-8 w-28 h-28 text-[var(--purple)] opacity-[0.15] -rotate-30 scale-x-[-1]" />

      {/* Manchas aquareladas — fora das áreas de card */}
      <WatercolorBlob
        className="absolute -top-20 right-[15%] w-64 h-64"
        color="var(--peach-light)"
      />
      <WatercolorBlob
        className="absolute bottom-[-60px] left-[8%] w-56 h-56"
        color="var(--sage-light)"
      />
      <WatercolorBlob
        className="absolute top-[35%] -right-20 w-48 h-48"
        color="var(--purple-light)"
      />

      {/* Círculos orgânicos */}
      <OrganicCircle className="absolute top-[18%] right-[10%] w-44 h-44 text-[var(--peach)] opacity-60" />
      <OrganicCircle className="absolute bottom-[22%] left-[5%] w-36 h-36 text-[var(--sage)] opacity-50" />

      {/* Pontos de tinta — espalhados no topo */}
      <InkDots className="absolute top-16 left-[15%] w-44 h-20 text-[var(--dark-green)] opacity-80" />
      <InkDots className="absolute bottom-24 right-[20%] w-40 h-16 text-[var(--purple)] opacity-70" />

      {/* Pinceladas horizontais — zona inferior e média */}
      <HandBrushStroke className="absolute bottom-16 left-[10%] w-80 h-9 text-[var(--sage)]" />
      <HandBrushStroke className="absolute top-[55%] right-[5%] w-64 h-7 text-[var(--peach)] rotate-[-3deg]" />
    </div>
  );
}

/* Exportações nomeadas para uso pontual em páginas específicas */
export { LeafDetailed, BotanicalSprig, WatercolorBlob, OrganicCircle, InkDots, HandBrushStroke };
