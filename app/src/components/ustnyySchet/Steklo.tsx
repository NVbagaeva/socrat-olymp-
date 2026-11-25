/**
 * Иллюстрация шапки раздела: стеклянное кольцо таймера из синего
 * полупрозрачного стекла с тёплой оранжевой подсветкой (стиль
 * иллюстраций сайта) и знаки действий внутри. Только декор.
 */
export function Steklo() {
  return (
    <svg className="us-steklo" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="us-steklo-teplo" cx="0.72" cy="0.24" r="0.75">
          <stop offset="0" stopColor="var(--us-warm)" stopOpacity="0.7" />
          <stop offset="0.6" stopColor="var(--us-warm)" stopOpacity="0.12" />
          <stop offset="1" stopColor="var(--us-warm)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="us-steklo-kolco" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="var(--us-glass-1)" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="var(--us-glass-2)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--us-glass-3)" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="us-steklo-blik" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--chertezh-fon)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--chertezh-fon)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#us-steklo-teplo)" />
      <circle
        cx="100"
        cy="100"
        r="66"
        fill="none"
        stroke="url(#us-steklo-kolco)"
        strokeWidth="26"
      />
      <path
        d="M58 64a56 56 0 0 1 58-26"
        fill="none"
        stroke="url(#us-steklo-blik)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle
        cx="100"
        cy="100"
        r="79"
        fill="none"
        stroke="var(--us-glass-3)"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <circle
        cx="100"
        cy="100"
        r="53"
        fill="none"
        stroke="var(--us-glass-3)"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <g
        className="us-steklo__znaki"
        fill="none"
        stroke="var(--us-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <path d="M84 84l14 14M98 84 84 98" />
        <path d="M110 91h16M118 83v16" />
        <path d="M84 116h16M84 123h16" />
        <path d="M110 120h16" />
        <circle cx="118" cy="113" r="1.5" fill="var(--us-ink)" />
        <circle cx="118" cy="127" r="1.5" fill="var(--us-ink)" />
      </g>
    </svg>
  );
}
