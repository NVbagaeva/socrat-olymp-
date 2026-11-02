/**
 * Линейные иконки страницы «Решить вариант онлайн» — по мотивам Lucide
 * (ISC): сетка 24×24, скруглённые концы. Толщина линии задаётся в CSS
 * в пикселях экрана (vector-effect: non-scaling-stroke), поэтому у
 * иконки 20px в списке и 32px у заголовка карточки линия одна и та же.
 */

const RISUNKI = {
  sloi: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  kniga: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </>
  ),
  galka: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  stolbiki: <path d="M6 20v-5M12 20v-9M18 20V5" />,
  kvadratGalka: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  vopros: (
    <>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2.5 21.5z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </>
  ),
  pauza: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6M14 9v6" />
    </>
  ),
  zamok: (
    <>
      <rect x="4.5" y="11" width="15" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  vozvrat: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  oblako: (
    <>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="m9.5 14 2 2 4-4" />
    </>
  ),
  list: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  play: <path className="onl-ik__zalivka" d="M8 5.5v13l10.5-6.5z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4.5M12 8h.01" />
    </>
  ),
  shapochka: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c3 2.5 9 2.5 12 0v-5" />
    </>
  ),
  strelka: <path d="M5 12h14M13 6l6 6-6 6" />,
  mishen: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  sekundomer: (
    <>
      <path d="M10 2h4M12 14l3-3" />
      <circle cx="12" cy="14" r="8" />
    </>
  ),
} as const;

export type IkonkaId = keyof typeof RISUNKI;

export function Ikonka({ id, className }: { id: IkonkaId; className?: string }) {
  return (
    <svg
      className={className === undefined ? 'onl-ik' : `onl-ik ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {RISUNKI[id]}
    </svg>
  );
}
