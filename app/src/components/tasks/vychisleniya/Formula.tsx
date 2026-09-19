import { katex } from '@/lib/graph/katex';

export interface FormulaProps {
  /** Формула в записи TeX. Набирается на сборке. */
  tex: string;
  className?: string;
}

/** Одна формула, набранная KaTeX на сервере: в браузер уходит разметка. */
export function Formula({ tex, className }: FormulaProps) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: false });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
