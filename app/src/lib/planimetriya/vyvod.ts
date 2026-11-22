/**
 * Вывод вопросами в карточке справочника (Tema1.vyvod): шаги набраны
 * KaTeX, у шага со слоем — чертёж карточки до этого слоя (буквы α, β,
 * S появляются по ходу шагов). Один источник для веб-карточки, окна
 * «Показать свойство» и PDF.
 */

import type { Tema1 } from '../../content/spravochnik1/tipy';
import { katex } from '../graph/katex';
import { typeset } from '../tex';
import { renderPlan } from './render';
import { chertezhTemy } from './spravochnik-chertezhi';

export interface ShagVyvodaHtml {
  voprosHtml: string;
  otvetHtml: string;
  texHtml: string[];
  /** Чертёж шага: что появилось на этом шаге; null — без чертежа. */
  risunokSvg: string | null;
}

function display(tex: string): string {
  return katex.renderToString(`\\displaystyle ${tex}`, { throwOnError: false, displayMode: false });
}

export function vyvodHtml(
  t: Tema1,
  razmer: { shirina: number; vysota: number } = { shirina: 240, vysota: 150 },
): ShagVyvodaHtml[] {
  if (t.vyvod === undefined) return [];
  const ch = chertezhTemy(t.id);
  const r = Array.isArray(ch) ? ch[0] : ch;
  return t.vyvod.map((s) => ({
    voprosHtml: typeset(s.vopros),
    otvetHtml: typeset(s.otvet),
    texHtml: (s.tex ?? []).map(display),
    risunokSvg:
      s.sloy === undefined || r === undefined
        ? null
        : renderPlan(r.scena, {
            ...r.optsii,
            ...razmer,
            rezhim: { rezhim: 'podskazka', shag: s.sloy },
          }),
  }));
}
