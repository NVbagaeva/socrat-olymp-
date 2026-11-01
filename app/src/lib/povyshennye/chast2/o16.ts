/**
 * №16 (варианты 13–14): дробь с модулем.
 *
 * (|x − a| − b)/(x² − c²) ∨ 0, b > 0, c > 0: нули числителя x = a ± b,
 * знаменателя x = ±c. Метод интервалов на всей прямой.
 */

import { kuskiPoTochkam } from './oMnozh';
import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PO16 {
  a: number;
  b: number;
  c: number;
  znak: 'le' | 'ge';
}

export function chislaO16(p: PO16) {
  if (!(p.b > 0 && p.c > 0)) throw new Error('o16: b, c > 0');
  const tochki = [p.a - p.b, p.a + p.b, -p.c, p.c];
  if (new Set(tochki).size !== 4) throw new Error('o16: точки совпадают');
  const f = (x: number) => (Math.abs(x - p.a) - p.b) / (x * x - p.c * p.c);
  const istina = (x: number) => {
    if (Math.abs(Math.abs(x) - p.c) < 1e-12) return false;
    const v = f(x);
    return p.znak === 'le' ? v <= 1e-12 : v >= -1e-12;
  };
  const kuski = kuskiPoTochkam(
    tochki.map((v) => ({ v, tex: String(v) })),
    istina,
  );
  return { tochki, kuski, f };
}

const lin = (a: number) => (a === 0 ? 'x' : `x${a > 0 ? '-' : '+'}${Math.abs(a)}`);

function sobrat(p: PO16): Chast2Zadacha {
  const ch = chislaO16(p);
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const ner = `\\dfrac{\\left|${lin(p.a)}\\right|-${p.b}}{x^2-${p.c * p.c}}${zn}0`;
  const otv = mnozhTex(ch.kuski);
  const s = [...ch.tochki].sort((u, v) => u - v);
  return {
    no: 16,
    shablon: 'o16.modulDrob',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Нули числителя и знаменателя',
        lines: [
          `Числитель обращается в нуль при $\\left|${lin(p.a)}\\right|=${p.b}$, то есть при $x=${p.a - p.b}$ и $x=${p.a + p.b}$; он отрицателен между этими точками и положителен вне отрезка $[${p.a - p.b};\\ ${p.a + p.b}]$.`,
          `Знаменатель $x^2-${p.c * p.c}=(x-${p.c})(x+${p.c})$ обращается в нуль при $x=\\pm${p.c}$ — эти точки не входят в ответ.`,
        ],
      },
      {
        title: 'Метод интервалов',
        lines: [
          `Отмечаем точки $${s.join(';\\ ')}$ и определяем знак дроби на каждом промежутке как произведение знаков числителя и знаменателя.`,
          `Нули числителя входят в ответ, так как неравенство нестрогое.`,
        ],
      },
      { title: 'Ответ', lines: [`$${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Нули числителя', formula: `x=${p.a - p.b},\\ x=${p.a + p.b}` },
      { slovo: 'Нули знаменателя (выколоты)', formula: `x=\\pm${p.c}` },
      { slovo: 'Знаки на промежутках', formula: s.join(';\\ ') },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const O16_MODUL_DROB: Shablon2<PO16> = {
  no: 16,
  prototip: 'Дробно-рациональное неравенство с модулем в числителе: метод интервалов',
  sobrat,
};
