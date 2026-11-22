/**
 * Вывод устного счёта в HTML: вопрос примера и шаги разбора через
 * KaTeX (тот же набор, что у всего сайта — lib/tex.ts), пояснения —
 * через типограф.
 */

import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import { tipograf } from '@/lib/tipograf';
import { chisloTex, tex as texOf } from './chislo';
import type { Primer, Shag, Zveno } from './types';

function formula(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false });
}

const zvenoTex = (z: Zveno): string => (typeof z === 'string' ? texOf(z) : z.tex);

/** Вопрос примера: «85^2», «48 · 52», «56 = □ · 8». */
export function voprosHtml(p: Primer): string {
  return formula(p.tex);
}

/** Пример с ответом: «85² = 7225». */
export function primerSOtvetomHtml(p: Primer): string {
  const ans = `${chisloTex(p.otvet)}${p.ed === '%' ? '\\,\\%' : ''}`;
  if (p.v === 'obr' || p.v === 'kv') {
    return formula(p.tex.replace('\\square', `\\boxed{${ans}}`));
  }
  return formula(`${p.tex} = ${ans}`);
}

export interface ShagHtml {
  tekst: string | null;
  cep: string;
}

/** Шаг разбора: пояснение (с формулами) и цепочка равенств. */
export function shagHtml(s: Shag): ShagHtml {
  return {
    tekst: s.tekst === undefined ? null : typeset(tipograf(s.tekst)),
    cep: formula(s.cep.map(zvenoTex).join(' = ')),
  };
}

/** Текст с формулами (правила, пояснения) — с типографом. */
export function tekstHtml(s: string): string {
  return typeset(tipograf(s));
}
