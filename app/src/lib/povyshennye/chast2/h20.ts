/**
 * №20 (варианты 15–16): трёхзначное число abc с цифрами из множества D
 * (все цифры, нечётные, чётные, не меньше d, не больше d), произведение
 * цифр abc ≠ 0. Отношение числа к произведению цифр:
 *   N/P = 100/(bc) + 10/(ac) + 1/(ab) —
 * каждое слагаемое убывает по каждой цифре, поэтому наибольшее отношение —
 * у числа из одинаковых наименьших цифр (111/d²), наименьшее — из
 * одинаковых наибольших.
 * а), б) «Может ли число быть в k раз больше произведения»: да — пример
 * (полный перебор), нет — k вне отрезка [min; max].
 */

import { rat, ratTex, type Rat } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PH20 {
  cifry: 'vse' | 'nechet' | 'chet' | 'ge' | 'le';
  /** Порог для 'ge' / 'le'. */
  d?: number;
  k1: number;
  k2: number;
  nado: 'max' | 'min';
}

export function cifryH20(p: PH20): number[] {
  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  switch (p.cifry) {
    case 'vse':
      return all;
    case 'nechet':
      return all.filter((x) => x % 2 === 1);
    case 'chet':
      return all.filter((x) => x % 2 === 0);
    case 'ge':
      return all.filter((x) => x >= (p.d ?? 1));
    case 'le':
      return all.filter((x) => x <= (p.d ?? 9));
  }
}

export function chislaH20(p: PH20) {
  const D = cifryH20(p);
  const primery = (k: number) => {
    const out: number[] = [];
    for (const a of D)
      for (const b of D)
        for (const c of D)
          if (100 * a + 10 * b + c === k * a * b * c) out.push(100 * a + 10 * b + c);
    return out;
  };
  const dmin = Math.min(...D);
  const dmax = Math.max(...D);
  const maks = rat(111, dmin * dmin);
  const mini = rat(111, dmax * dmax);
  const p1 = primery(p.k1);
  const p2 = primery(p.k2);
  if (p1.length === 0) throw new Error('h20: а) нет примера');
  const vneOtr = p.k2 > Number(maks.n) / Number(maks.d) || p.k2 < Number(mini.n) / Number(mini.d);
  if (p2.length === 0 && !vneOtr) throw new Error('h20: б) «нет» без оценки');
  return { D, dmin, dmax, maks, mini, p1, p2 };
}

const OPIS: Record<PH20['cifry'], (d?: number) => string> = {
  vse: () => '',
  nechet: () => ' Все цифры числа нечётные.',
  chet: () => ' Все цифры числа чётные.',
  ge: (d) => ` Все цифры числа не меньше $${d}$.`,
  le: (d) => ` Все цифры числа не больше $${d}$.`,
};

function sobrat(p: PH20): Chast2Zadacha {
  const ch = chislaH20(p);
  const otvC: Rat = p.nado === 'max' ? ch.maks : ch.mini;
  const otvCT = ratTex(otvC);
  const ab = '\\overline{abc}';
  const uslovie =
    `В трёхзначном числе $${ab}$ (равно $100a+10b+c$) произведение его цифр $abc$ не равно $0$.${OPIS[p.cifry](p.d)}\n` +
    `а) Может ли число $${ab}$ быть в ${p.k1} раз больше произведения $abc$?\n` +
    `б) Может ли число $${ab}$ быть в ${p.k2} раз больше произведения $abc$?\n` +
    `в) Найдите ${p.nado === 'max' ? 'наибольшее' : 'наименьшее'} возможное отношение числа $${ab}$ к произведению $abc$.`;
  const primer = (n: number, k: number) => {
    const [a, b, c] = String(n).split('').map(Number) as [number, number, number];
    return `$${n}=${k}\\cdot${a * b * c}$, где $${a * b * c}=${a}\\cdot${b}\\cdot${c}$`;
  };
  const daB = ch.p2.length > 0;
  const formula = `\\dfrac{${ab}}{abc}=\\dfrac{100}{bc}+\\dfrac{10}{ac}+\\dfrac{1}{ab}`;
  const ocenka =
    p.k2 > Number(ch.maks.n) / Number(ch.maks.d)
      ? `каждое слагаемое не больше, чем при $a=b=c=${ch.dmin}$: $\\dfrac{${ab}}{abc}\\le\\dfrac{111}{${ch.dmin * ch.dmin}}${ch.dmin === 1 ? '=111' : ''}$`
      : `каждое слагаемое не меньше, чем при $a=b=c=${ch.dmax}$: $\\dfrac{${ab}}{abc}\\ge\\dfrac{111}{${ch.dmax * ch.dmax}}=${ratTex(ch.mini)}$`;
  const bLines = daB
    ? [`Да: ${primer(ch.p2[0]!, p.k2)}.`]
    : [
        `Нет. Запишем $${formula}$. Все слагаемые убывают при увеличении любой цифры, поэтому ${ocenka}.`,
        `Отношение не может равняться $${p.k2}$, так как $${p.k2}${p.k2 > Number(ch.maks.n) / Number(ch.maks.d) ? '>' + ratTex(ch.maks) : '<' + ratTex(ch.mini)}$.`,
      ];
  const d0 = p.nado === 'max' ? ch.dmin : ch.dmax;
  return {
    no: 20,
    shablon: 'h20.chisloProizv',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: true } },
      { bukva: 'б', pole: { vid: 'danet', verno: daB } },
      {
        bukva: 'в',
        podpis: p.nado === 'max' ? 'Наибольшее отношение' : 'Наименьшее отношение',
        pole: { vid: 'chislo', verno: otvCT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `а) да; б) ${daB ? 'да' : 'нет'}; в) $${otvCT}$`,
    reshenie: [
      { title: 'а) Пример', lines: [`Да: ${primer(ch.p1[0]!, p.k1)}.`] },
      { title: 'б)', lines: bLines },
      {
        title: 'в) Оценка',
        lines: [
          `$${formula}$. Цифры $a$, $b$, $c$ ${p.cifry === 'vse' ? 'от $1$ до $9$' : `из множества $\\{${ch.D.join(';\\ ')}\\}$`}; каждое слагаемое уменьшается при увеличении любой цифры.`,
          p.nado === 'max'
            ? `Поэтому отношение наибольшее, когда все цифры наименьшие: $a=b=c=${d0}$, отношение $\\dfrac{100+10+1}{${d0 * d0}}=${otvCT}$ (число $${111 * d0}$).`
            : `Поэтому отношение наименьшее, когда все цифры наибольшие: $a=b=c=${d0}$, отношение $\\dfrac{100+10+1}{${d0 * d0}}=${otvCT}$ (число $${111 * d0}$).`,
          `Ответ: а) да; б) ${daB ? 'да' : 'нет'}; в) $${otvCT}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Пример подбором',
        formula: `${ch.p1[0]}=${p.k1}\\cdot${String(ch.p1[0])
          .split('')
          .map(Number)
          .reduce((x, y) => x * y, 1)}`,
      },
      { slovo: 'Отношение как сумма трёх дробей', formula },
      { slovo: 'Монотонность по каждой цифре', formula: `a=b=c=${d0}` },
      { slovo: 'в) Ответ', formula: otvCT },
    ],
    kontrol: {
      otvC: Number(otvC.n) / Number(otvC.d),
      daB,
      p1: ch.p1[0]!,
      p2: ch.p2[0] ?? 0,
    },
  };
}

export const H20_CHISLO_PROIZV: Shablon2<PH20> = {
  no: 20,
  prototip:
    'Трёхзначное число и произведение цифр: может ли отношение быть равным k; наибольшее или наименьшее отношение',
  sobrat,
};
