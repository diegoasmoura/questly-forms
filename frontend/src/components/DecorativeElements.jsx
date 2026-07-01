const Leaf = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 120 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M60 10C30 40 10 80 15 120C20 145 40 155 60 150C80 145 95 130 100 105C105 80 95 50 75 25C65 12 62 8 60 10Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M60 10C65 45 70 80 85 110"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

const CircleBlob = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="100"
      cy="100"
      r="85"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeDasharray="4 6"
      opacity="0.4"
    />
    <circle
      cx="100"
      cy="100"
      r="60"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      opacity="0.2"
    />
    <circle cx="100" cy="100" r="25" fill="currentColor" opacity="0.08" />
  </svg>
);

const BrushStroke = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 300 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 20C40 15 80 25 120 20C160 15 200 25 240 20C260 17 280 22 290 20"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.15"
    />
    <path
      d="M30 25C70 20 110 30 150 25C190 20 230 30 270 25"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.1"
    />
  </svg>
);

const Dots = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 200 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="30" cy="20" r="3" fill="currentColor" opacity="0.1" />
    <circle cx="80" cy="10" r="2" fill="currentColor" opacity="0.08" />
    <circle cx="140" cy="25" r="4" fill="currentColor" opacity="0.06" />
    <circle cx="170" cy="8" r="2" fill="currentColor" opacity="0.1" />
    <circle cx="50" cy="50" r="2.5" fill="currentColor" opacity="0.08" />
    <circle cx="110" cy="45" r="3.5" fill="currentColor" opacity="0.06" />
    <circle cx="180" cy="55" r="2" fill="currentColor" opacity="0.08" />
    <circle cx="20" cy="75" r="3" fill="currentColor" opacity="0.06" />
    <circle cx="90" cy="80" r="2" fill="currentColor" opacity="0.1" />
    <circle cx="150" cy="70" r="3" fill="currentColor" opacity="0.08" />
  </svg>
);

const Squiggle = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 100 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 15C15 5 25 25 35 15C45 5 55 25 65 15C75 5 85 25 95 15"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.12"
    />
  </svg>
);

export default function DecorativeElements() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <Leaf className="absolute -top-8 -left-4 w-28 h-36 text-brand-200 dark:text-brand-800 rotate-12" />
        <Leaf className="absolute -bottom-6 -right-2 w-32 h-40 text-secondary-200 dark:text-secondary-800 -rotate-12 scale-x-[-1]" />
        <CircleBlob className="absolute top-1/3 -right-10 w-44 h-44 text-peach/40 dark:text-peach/20" />
        <BrushStroke className="absolute bottom-12 left-1/4 w-72 h-8 text-brand-300 dark:text-brand-700" />
        <Dots className="absolute top-24 right-1/4 w-40 h-20 text-slate-400 dark:text-slate-600" />
        <Squiggle className="absolute top-1/2 left-8 w-20 h-6 text-lavender/40 dark:text-lavender/30" />
        <Squiggle className="absolute bottom-1/3 right-16 w-24 h-7 text-secondary-300 dark:text-secondary-700 rotate-45" />
      </div>
    </>
  );
}
