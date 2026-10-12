/* Линейные значки «Весь №12»: плитки шаблонов и сводка. Стиль — как у
   значков навигации сайта: обводка currentColor, без заливки. */

export type TemplateIconName =
  | 'clock'
  | 'sheet'
  | 'shield'
  | 'chart'
  | 'parabola'
  | 'exp'
  | 'hyperbola'
  | 'wave'
  | 'sliders';

const PATHS: Record<TemplateIconName, string[]> = {
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  sheet: ['M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5z', 'M14 3.5V8h4', 'M9 12h6M9 15h6M9 18h4'],
  shield: ['M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z', 'm8.8 12 2.2 2.2 4.2-4.4'],
  chart: ['M4 19h16', 'M4 19V5', 'm6 16 4-5 3 3 5-7'],
  parabola: ['M5 5c1.5 9 3.5 13 7 13s5.5-4 7-13', 'M4 19h16'],
  exp: ['M4 19h16', 'M4 17c5 0 9-1 11-4s3-6 4-9'],
  hyperbola: ['M5 11c4 0 6-2 6-7', 'M13 20c0-5 2-7 6-7', 'M4 12h16M12 4v16'],
  wave: ['M3 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0', 'M3 12h18'],
  sliders: ['M4 7h10M18 7h2', 'M4 17h4M12 17h8', 'M16 5v4', 'M10 15v4'],
};

export function TemplateIcon({ name }: { name: TemplateIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
