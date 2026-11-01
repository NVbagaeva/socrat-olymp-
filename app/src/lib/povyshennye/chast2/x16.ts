/**
 * №16 (варианты 7–8): log_b(x + p) + log_b(x + q) ⋚ c.
 *
 * ОДЗ: x > −p и x > −q, то есть x > L = max(−p; −q). На ОДЗ сумма
 * логарифмов — логарифм произведения, основание b > 1, поэтому
 * неравенство равносильно (x + p)(x + q) ⋚ bᶜ. Корни квадратного
 * трёхчлена (x + p)(x + q) − bᶜ: r₁ < min(−p; −q) (оба множителя
 * отрицательны) и r₂ > L. Ответ: «le» — (L; r₂], «ge» — [r₂; +∞).
 */

import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PX16 {
  b: number;
  p: number;
  q: number;
  c: number;
  znak: 'le' | 'ge';
}

const sl = (k: number) => (k === 0 ? 'x' : k > 0 ? `x+${k}` : `x-${-k}`);

export function chislaX16(p: PX16) {
  if (p.p === p.q || p.b < 2 || p.c < 1) throw new Error('x16: параметры');
  const B = p.b ** p.c;
  const s = p.p + p.q;
  const pr = p.p * p.q - B;
  const D = s * s - 4 * pr;
  const r2 = (-s + Math.sqrt(D)) / 2;
  const r1 = (-s - Math.sqrt(D)) / 2;
  if (!Number.isInteger(r2) || !Number.isInteger(r1)) throw new Error('x16: корни не целые');
  const L = Math.max(-p.p, -p.q);
  if (!(r2 > L && r1 < L)) throw new Error('x16: корни');
  const kuski: Kus[] =
    p.znak === 'le'
      ? [{ lo: { tex: String(L), v: L }, hi: { tex: String(r2), v: r2 }, loZ: false, hiZ: true }]
      : [{ lo: { tex: String(r2), v: r2 }, hi: null, loZ: true, hiZ: false }];
  return { B, s, pr, r1, r2, L, kuski };
}

function sobrat(p: PX16): Chast2Zadacha {
  const ch = chislaX16(p);
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const ner = `\\log_{${p.b}}(${sl(p.p)})+\\log_{${p.b}}(${sl(p.q)})${zn}${p.c}`;
  const otv = mnozhTex(ch.kuski);
  const trehchlen = `x^2${ch.s === 0 ? '' : ch.s > 0 ? `+${ch.s}x` : `-${-ch.s}x`}${ch.pr === 0 ? '' : ch.pr > 0 ? `+${ch.pr}` : `-${-ch.pr}`}`;
  return {
    no: 16,
    shablon: 'x16.summaLog',
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
        title: 'Область допустимых значений',
        lines: [
          `Аргументы логарифмов положительны: $${sl(p.p)}>0$ и $${sl(p.q)}>0$, то есть $x>${ch.L}$.`,
        ],
      },
      {
        title: 'Переход к квадратному неравенству',
        lines: [
          `На области допустимых значений $\\log_{${p.b}}(${sl(p.p)})+\\log_{${p.b}}(${sl(p.q)})=\\log_{${p.b}}\\big((${sl(p.p)})(${sl(p.q)})\\big)$, а $${p.c}=\\log_{${p.b}}${ch.B}$.`,
          `Основание $${p.b}>1$, функция $y=\\log_{${p.b}}t$ возрастает, поэтому неравенство равносильно $(${sl(p.p)})(${sl(p.q)})${zn}${ch.B}$, то есть $${trehchlen}${zn}0$.`,
          `Корни трёхчлена: $x_1=${ch.r1}$, $x_2=${ch.r2}$; ${p.znak === 'le' ? `неравенство выполнено при $${ch.r1}\\le x\\le ${ch.r2}$` : `неравенство выполнено при $x\\le${ch.r1}$ и при $x\\ge${ch.r2}$`}.`,
        ],
      },
      {
        title: 'Учитываем область допустимых значений',
        lines: [
          `Пересекаем с условием $x>${ch.L}$ (корень $${ch.r1}$ лежит левее): получаем $${otv}$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Область допустимых значений', formula: `x>${ch.L}` },
      {
        slovo: 'Сумма логарифмов — логарифм произведения',
        formula: `(${sl(p.p)})(${sl(p.q)})${zn}${ch.B}`,
      },
      { slovo: 'Корни квадратного трёхчлена', formula: `x_1=${ch.r1},\\ x_2=${ch.r2}` },
      { slovo: 'Ответ с учётом ОДЗ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), r2: ch.r2, L: ch.L },
  };
}

export const X16_SUMMA_LOG: Shablon2<PX16> = {
  no: 16,
  prototip:
    'Логарифмическое неравенство: сумма двух логарифмов, переход к квадратному с учётом ОДЗ',
  sobrat,
};
