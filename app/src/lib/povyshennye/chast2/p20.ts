/**
 * №20 (варианты 27–28): набор гирь массами 1, 2, …, n граммов (по одной
 * каждой массы) раскладывают на группы равной массы.
 *
 * Нужно: k делит S = n(n + 1)/2 и масса группы S/k ≥ n (группа с самой
 * тяжёлой гирей). а), б) — да/нет с примером (перебор) или причиной;
 * в) наибольшее k для n₃: k ≤ S/n = (n + 1)/2, пример — пары i и n + 1 − i
 * (и одиночная n при нечётном n).
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PP20 {
  n1: number;
  k1: number;
  n2: number;
  k2: number;
  n3: number;
}

/** Разбиение {1, …, n} на k групп с суммой S/k; null — нельзя. */
export function razlozhit(n: number, k: number): number[][] | null {
  const S = (n * (n + 1)) / 2;
  if (S % k !== 0) return null;
  const T = S / k;
  if (T < n) return null;
  const gr: number[][] = Array.from({ length: k }, () => []);
  const sum = new Array<number>(k).fill(0);
  const shag = (x: number): boolean => {
    if (x === 0) return true;
    const vidano = new Set<number>();
    for (let i = 0; i < k; i += 1) {
      if (sum[i]! + x > T || vidano.has(sum[i]!)) continue;
      vidano.add(sum[i]!);
      sum[i]! += x;
      gr[i]!.push(x);
      if (shag(x - 1)) return true;
      sum[i]! -= x;
      gr[i]!.pop();
    }
    return false;
  };
  return shag(n) ? gr.map((g) => [...g].sort((a, b) => a - b)) : null;
}

const summa = (n: number) => (n * (n + 1)) / 2;

function grTex(gr: number[][]): string {
  return gr.map((g) => `\\{${g.join(',\\,')}\\}`).join(',\\ ');
}

function chastLines(n: number, k: number, gr: number[][] | null): string[] {
  const S = summa(n);
  if (gr !== null)
    return [
      `Да. Общая масса $1+2+\\ldots+${n}=${S}$ г, каждая группа — $${S / k}$ г: $${grTex(gr)}$.`,
    ];
  if (S % k !== 0)
    return [
      `Нет. Общая масса $1+2+\\ldots+${n}=${S}$ г не делится на $${k}$, поэтому равных по массе групп не получится.`,
    ];
  return [
    `Нет. Общая масса $${S}$ г, масса каждой группы была бы $${S / k}$ г. Но гиря массой $${n}$ г тяжелее, и группа, в которую она попадёт, весит больше $${S / k}$ г.`,
  ];
}

export function chislaP20(p: PP20) {
  const a = razlozhit(p.n1, p.k1);
  const b = razlozhit(p.n2, p.k2);
  const kMax = Math.floor((p.n3 + 1) / 2);
  const v = razlozhit(p.n3, kMax);
  if (v === null) throw new Error('p20: в) нет примера');
  return { a, b, kMax, v };
}

function sobrat(p: PP20): Chast2Zadacha {
  const ch = chislaP20(p);
  const n3 = p.n3;
  const S3 = summa(n3);
  const uslovie =
    `Имеется набор гирь массами $1,\\ 2,\\ 3,\\ \\ldots,\\ n$ граммов — по одной гире каждой массы. Все гири набора нужно разложить на несколько групп так, чтобы массы всех групп были одинаковыми.\n` +
    `а) Можно ли это сделать при $n=${p.n1}$, если групп должно быть $${p.k1}$?\n` +
    `б) Можно ли это сделать при $n=${p.n2}$, если групп должно быть $${p.k2}$?\n` +
    `в) Какое наибольшее количество групп можно получить при $n=${n3}$?`;
  const vLines = [
    `Оценка. Общая масса $${S3}$ г. Гиря массой $${n3}$ г лежит в одной из групп, поэтому масса каждой группы не меньше $${n3}$ г, и групп не больше $\\dfrac{${S3}}{${n3}}=${(n3 + 1) / 2 === ch.kMax ? ch.kMax : `${(n3 + 1) / 2}`}$${(n3 + 1) / 2 === ch.kMax ? '' : `, то есть не больше $${ch.kMax}$`}.`,
    `Пример на $${ch.kMax}$ групп${n3 % 2 === 1 ? ` (гиря $${n3}$ — отдельно, остальные — парами $i$ и $${n3}-i$)` : ` (пары $i$ и $${n3 + 1}-i$)`}: $${grTex(ch.v)}$.`,
  ];
  const otv = `а) ${ch.a ? 'да' : 'нет'}; б) ${ch.b ? 'да' : 'нет'}; в) $${ch.kMax}$`;
  return {
    no: 20,
    shablon: 'p20.giri',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.a !== null } },
      { bukva: 'б', pole: { vid: 'danet', verno: ch.b !== null } },
      {
        bukva: 'в',
        podpis: 'Наибольшее количество групп',
        pole: { vid: 'chislo', verno: String(ch.kMax) },
      },
    ],
    otvet: otv,
    reshenie: [
      { title: `а) $n=${p.n1}$, $${p.k1}$ групп`, lines: chastLines(p.n1, p.k1, ch.a) },
      { title: `б) $n=${p.n2}$, $${p.k2}$ групп`, lines: chastLines(p.n2, p.k2, ch.b) },
      { title: 'в) Оценка и пример', lines: [...vLines, `Ответ: ${otv}.`] },
    ],
    razbor: [
      { slovo: 'Общая масса делится на число групп', formula: 'k\\mid\\dfrac{n(n+1)}{2}' },
      { slovo: 'Группа с самой тяжёлой гирей', formula: '\\dfrac{n(n+1)}{2k}\\ge n' },
      { slovo: 'Оценка числа групп', formula: `k\\le\\dfrac{n+1}{2}` },
      { slovo: 'Ответ в)', formula: String(ch.kMax) },
    ],
    kontrol: { a: ch.a !== null, b: ch.b !== null, v: ch.kMax },
  };
}

export const P20_GIRI: Shablon2<PP20> = {
  no: 20,
  prototip: 'Гири 1, 2, …, n: разбиение на группы равной массы — да/нет и наибольшее число групп',
  sobrat,
};
