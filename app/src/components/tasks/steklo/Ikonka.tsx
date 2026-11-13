/**
 * Значки «Стеклянной сцены»: один контур, 24×24, цвет от текста.
 * Набор общий для карты задания и тренажёра; новые значки — сюда.
 */

export type IkonkaName =
  | 'mix'
  | 'temy'
  | 'oshibki'
  | 'lampa'
  | 'zakladka'
  | 'zakladka-on'
  | 'chasy'
  | 'da'
  | 'net'
  | 'strelka'
  | 'nazad'
  | 'otlozheno'
  /** Узнать тип по условию: лупа (№13, «Определи тип»). */
  | 'tip';

const PATHS: Record<IkonkaName, string> = {
  mix: 'M4 7h3l8 10h5M4 17h3l2.5-3.1M14.5 10.1 15 9.5 15 7h5M17 4l3 3-3 3M17 14l3 3-3 3',
  temy: 'M4 6h10M4 12h16M4 18h7M17 4v4M14 16v4',
  oshibki: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5',
  lampa: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V15h7v-1.1A6 6 0 0 0 12 3Z',
  zakladka: 'M7 4h10v16l-5-3.5L7 20V4Z',
  'zakladka-on': 'M7 4h10v16l-5-3.5L7 20V4Z',
  chasy: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  da: 'M5 12.5 10 17l9-10',
  net: 'M6 6l12 12M18 6 6 18',
  strelka: 'M5 12h14M13 6l6 6-6 6',
  nazad: 'M19 12H5M11 6l-6 6 6 6',
  otlozheno: 'M7 4h10v16l-5-3.5L7 20V4ZM9 9h6',
  tip: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20M8 10.5h5',
};

export function Ikonka({ name, className }: { name: IkonkaName; className?: string }) {
  return (
    <svg
      className={className === undefined ? 'stk-ico' : `stk-ico ${className}`}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill={name === 'zakladka-on' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
