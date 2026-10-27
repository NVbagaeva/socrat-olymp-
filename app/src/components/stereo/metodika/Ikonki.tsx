/**
 * Значки новых экранов №3 — линейные, 24×24, цвет берут от текста
 * (currentColor): роль задаёт CSS рамки, а не значок.
 */

import type { ReactNode } from 'react';

function Ikonka({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className === undefined ? 'o3i' : `o3i ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

/** «Идея метода»: мишень со стрелой. */
export const IkIdeya = ({ className }: P) => (
  <Ikonka className={className}>
    <circle cx="11" cy="13" r="8" />
    <circle cx="11" cy="13" r="4" />
    <path d="M11 13l9-9M16 4h4v4" />
  </Ikonka>
);

/** Алгоритм: шестерёнка. */
export const IkAlgoritm = ({ className }: P) => (
  <Ikonka className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
  </Ikonka>
);

export const IkKub = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M12 2l9 5v10l-9 5-9-5V7z" />
    <path d="M3 7l9 5 9-5M12 12v10" />
  </Ikonka>
);

export const IkTreugolnik = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M12 3L22 20H2z" />
  </Ikonka>
);

/** Задача: лист с галочкой. */
export const IkZadacha = ({ className }: P) => (
  <Ikonka className={className}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V2.5h6V4M9 13l2 2 4-4" />
  </Ikonka>
);

export const IkLovushka = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M12 3L22 20H2z" />
    <path d="M12 10v4M12 17h.01" />
  </Ikonka>
);

export const IkKrestik = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M7 7l10 10M17 7L7 17" />
  </Ikonka>
);

export const IkGalochka = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Ikonka>
);

export const IkVazhno = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M12 6v8M12 18h.01" />
  </Ikonka>
);

/** «Лайфхак»: лампочка. */
export const IkLampa = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
  </Ikonka>
);

export const IkKniga = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5c-3-.5-6 0-8 1.5zM12 6v14.5" />
  </Ikonka>
);

export const IkStrelka = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Ikonka>
);

export const IkNazad = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M15 6l-6 6 6 6" />
  </Ikonka>
);

export const IkVpered = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M9 6l6 6-6 6" />
  </Ikonka>
);

export const IkVniz = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M6 9l6 6 6-6" />
  </Ikonka>
);

export const IkInfo = ({ className }: P) => (
  <Ikonka className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Ikonka>
);

export const IkPlyus = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M12 5v14M5 12h14" />
  </Ikonka>
);

export const IkMinus = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M5 12h14" />
  </Ikonka>
);

/** Повернуть чертёж. */
export const IkPovorot = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
  </Ikonka>
);

/** Перерешать: круговая стрелка. */
export const IkPovtor = ({ className }: P) => (
  <Ikonka className={className}>
    <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.6M20 4v4.6h-4.6M20 12a8 8 0 0 1-13.7 5.7L4 15.4M4 20v-4.6h4.6" />
  </Ikonka>
);

export const IkZakryt = IkKrestik;
