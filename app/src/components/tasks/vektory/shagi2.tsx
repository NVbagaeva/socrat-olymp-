import { typeset } from '@/lib/tex';
import type { Shag as ShagRazbora } from '@/lib/vektory/types';
import type { Shag } from '../steklo';
import { otvetTekstom } from '../trening/bank/shagi';

export { otvetTekstom };

/** Последний шаг разбора генератора — «Ответ»: на карте ответ стоит своей строкой. */
const OTVET = 'Ответ';

/**
 * Разбор генератора №2 → шаги «Стеклянной сцены». Названия и строки —
 * дословно из генератора, набраны KaTeX. Работает и на сборке, и в
 * браузере.
 */
export function shagiIz2(shagi: readonly ShagRazbora[], { bezOtveta = false } = {}): Shag[] {
  return shagi
    .filter((s) => !(bezOtveta && s.zagolovok === OTVET))
    .map((s) => ({
      zagolovok: s.zagolovok.replace(/\$/g, ''),
      ...(s.zagolovok.includes('$') ? { zagolovokHtml: typeset(s.zagolovok) } : {}),
      chtoHtml: s.stroki.map((line) => `<p>${typeset(line)}</p>`).join(''),
      formulaHtml: '',
    }));
}

/** Рисунок №2 (готовый SVG движка) в обёртке. */
export function RisunokSvg({ svg }: { svg: string }) {
  return <span className="vp-wrap" dangerouslySetInnerHTML={{ __html: svg }} />;
}
