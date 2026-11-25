/**
 * Вывод устного счёта в HTML: вопрос примера и шаги разбора через
 * KaTeX (тот же набор, что у всего сайта — lib/tex.ts), пояснения —
 * через типограф.
 */

import { katex } from '@/lib/graph/katex';
import { displayAnswer } from '@/lib/otvet';
import { typeset } from '@/lib/tex';
import { tipograf } from '@/lib/tipograf';
import { chisloTex, tex as texOf } from './chislo';
import type { Hod } from './sessiya';
import type { Primer, Shag, Zveno } from './types';

function formula(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false });
}

const zvenoTex = (z: Zveno): string => (typeof z === 'string' ? texOf(z) : z.tex);

/** Вопрос примера: «85^2», «48 · 52», «56 = □ · 8». */
export function voprosHtml(p: Primer): string {
  return formula(p.tex);
}

/** Корни уравнения в TeX: «x_1 = 3,\ x_2 = 4» или «x = 5», если корень один. */
export function korniTex(otvety: readonly string[]): string {
  const [a = '', b = a] = otvety;
  if (a === b) return `x = ${chisloTex(a)}`;
  return `x_1 = ${chisloTex(a)},\ x_2 = ${chisloTex(b)}`;
}

/** Пример с ответом: «85² = 7225», у уравнения — с корнями. */
export function primerSOtvetomHtml(p: Primer): string {
  if (p.otvety !== undefined) return formula(`${p.tex},\quad ${korniTex(p.otvety)}`);
  if (p.v === 'men' || p.v === 'bol') {
    const kto = p.v === 'men' ? '\text{меньший корень}' : '\text{больший корень}';
    return formula(`${p.tex},\quad ${kto}\ ${chisloTex(p.otvet)}`);
  }
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
    cep: s.cep.length === 0 ? '' : formula(s.cep.map(zvenoTex).join(' = ')),
  };
}

/** Текст с формулами (правила, пояснения) — с типографом. */
export function tekstHtml(s: string): string {
  return typeset(tipograf(s));
}

/** Что ввёл ученик — для показа: «3», у корней — «3; 4». */
export function vvodText(h: Pick<Hod, 'vvod' | 'vvody'>): string {
  return (h.vvody ?? [h.vvod]).map(displayAnswer).join('; ');
}

/** Верный ответ для показа: «7225», у корней — «3 и 4». */
export function otvetText(p: Pick<Primer, 'otvet' | 'otvety'>): string {
  if (p.otvety === undefined) return displayAnswer(p.otvet);
  const [a = '', b = a] = p.otvety;
  return a === b ? displayAnswer(a) : `${displayAnswer(a)} и ${displayAnswer(b)}`;
}
