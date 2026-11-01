/**
 * №20 (варианты 7–8): трёхзначное число и сумма его цифр.
 *
 * а) Может ли трёхзначное N быть ровно в k₁ раз больше суммы цифр S(N)?
 * б) То же для k₂.
 * в) Наименьшее значение N/S(N) среди трёхзначных чисел с ограничением
 *    («vse» — любые, «raznye» — попарно различные цифры, «bez0» — без нулей).
 * Ответы — полным перебором; в решении — пример или оценка через
 * N = 100x + 10y + z, S = x + y + z: N − kS = (100 − k)x + (10 − k)y + (1 − k)z.
 */

import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PX20 {
  k1: number;
  k2: number;
  ogr: 'vse' | 'raznye' | 'bez0';
}

const OGR: Record<PX20['ogr'], string> = {
  vse: 'трёхзначных чисел',
  raznye: 'трёхзначных чисел с попарно различными цифрами',
  bez0: 'трёхзначных чисел, в записи которых нет нуля',
};

function cifry(N: number): number[] {
  return [Math.floor(N / 100), Math.floor(N / 10) % 10, N % 10];
}

export function chislaX20(p: PX20) {
  const primer = (k: number) => {
    for (let N = 100; N <= 999; N += 1) {
      const s = cifry(N).reduce((u, v) => u + v, 0);
      if (N === k * s) return N;
    }
    return null;
  };
  const pA = primer(p.k1);
  const pB = primer(p.k2);
  let best = { N: 0, S: 1 };
  for (let N = 100; N <= 999; N += 1) {
    const c = cifry(N);
    if (p.ogr === 'raznye' && new Set(c).size !== 3) continue;
    if (p.ogr === 'bez0' && c.includes(0)) continue;
    const S = c.reduce((u, v) => u + v, 0);
    if (best.N === 0 || N * best.S < best.N * S) best = { N, S };
  }
  return { pA, pB, best, min: rat(best.N, best.S) };
}

function sobrat(p: PX20): Chast2Zadacha {
  if (p.k1 === p.k2) throw new Error('x20: k1 = k2');
  const ch = chislaX20(p);
  const otvV = ratTex(ch.min);
  const da = (x: number | null) => x !== null;
  const gcd = (u: number, v: number): number => (v === 0 ? u : gcd(v, u % v));
  const stroka = (k: number, N: number | null) => {
    if (N !== null)
      return `Да, например $${N}=${k}\\cdot${cifry(N).reduce((u, v) => u + v, 0)}$, а $${cifry(N).join('+')}=${cifry(N).reduce((u, v) => u + v, 0)}$.`;
    /* N ≡ S (mod 9) ⇒ (k − 1)·S делится на 9 ⇒ S кратно 9/НОД(k − 1, 9). */
    const shag = 9 / gcd(k - 1, 9);
    const kand: number[] = [];
    for (let S = shag; S <= 27; S += shag) if (k * S >= 100 && k * S <= 999) kand.push(S);
    const spisok = kand
      .map(
        (S) =>
          `$${k}\\cdot${S}=${k * S}$ (сумма цифр $${cifry(k * S).reduce((u, v) => u + v, 0)}$)`,
      )
      .join(', ');
    return (
      `Нет. Число и сумма его цифр дают одинаковые остатки при делении на $9$, поэтому $N-S=${k - 1}S$ делится на $9$, и сумма цифр $S$ кратна $${shag}$; кроме того, $S\\le27$ и $100\\le ${k}S\\le999$. ` +
      (kand.length === 0
        ? 'Таких значений $S$ нет.'
        : `Остаются ${spisok} — ни в одном случае сумма цифр не равна $S$.`)
    );
  };
  const [b0, b1, b2] = cifry(ch.best.N);
  return {
    no: 20,
    shablon: 'x20.summaCifr',
    uslovie:
      `Для трёхзначного числа $N$ обозначим через $S(N)$ сумму его цифр.\n` +
      `а) Существует ли трёхзначное число, которое ровно в $${p.k1}$ раз больше суммы своих цифр?\n` +
      `б) Существует ли трёхзначное число, которое ровно в $${p.k2}$ раз больше суммы своих цифр?\n` +
      `в) Найдите наименьшее значение дроби $\\dfrac{N}{S(N)}$ среди ${OGR[p.ogr]}.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: da(ch.pA) } },
      { bukva: 'б', pole: { vid: 'danet', verno: da(ch.pB) } },
      {
        bukva: 'в',
        podpis: 'Наименьшее значение',
        pole: { vid: 'chislo', verno: otvV.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `а) ${da(ch.pA) ? 'да' : 'нет'}; б) ${da(ch.pB) ? 'да' : 'нет'}; в) $${otvV}$`,
    reshenie: [
      { title: 'а)', lines: [stroka(p.k1, ch.pA)] },
      { title: 'б)', lines: [stroka(p.k2, ch.pB)] },
      {
        title: 'в) Оценка и пример',
        lines: [
          'Дробь $\\dfrac{N}{S}$ тем меньше, чем меньше число при той же сумме цифр. Сотни делают число большим, поэтому первую цифру берём наименьшей допустимой, а остальные — наибольшими допустимыми: при фиксированной первой цифре $x$ дробь $\\dfrac{100x+10y+z}{x+y+z}=1+\\dfrac{99x+9y}{x+y+z}$ убывает с ростом $z$ и при необходимости с ростом $y$.',
          `Сравнивая варианты с наименьшей первой цифрой (и учитывая ограничение на цифры), получаем наименьшее значение при $N=${ch.best.N}$: $\\dfrac{${ch.best.N}}{${b0}+${b1}+${b2}}=${otvV}$.`,
          `Ответ в): $${otvV}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Запись числа через цифры', formula: 'N=100x+10y+z,\\ S=x+y+z' },
      { slovo: 'а), б) Пример или невозможность', formula: `N-kS=(100-k)x+(10-k)y+(1-k)z` },
      {
        slovo: 'в) Первая цифра поменьше, остальные побольше',
        formula: `\\frac{${ch.best.N}}{${ch.best.S}}=${otvV}`,
      },
    ],
    kontrol: { a: da(ch.pA), b: da(ch.pB), min: toNumber(ch.min) },
  };
}

export const X20_SUMMA_CIFR: Shablon2<PX20> = {
  no: 20,
  prototip: 'Трёхзначное число и сумма его цифр: кратность, наименьшее отношение N/S(N)',
  sobrat,
};
