/**
 * №20 (варианты 23–24): числа 1, 2, …, N без пар с суммой, кратной k.
 *
 * Из чисел 1…N выбирают несколько так, чтобы сумма никаких двух
 * выбранных не делилась на k. По остаткам: из классов r и k − r можно
 * брать числа только одного; класса 0 — не больше одного числа; при
 * чётном k класса k/2 — не больше одного. Наибольшее количество —
 * Σ max(n_r, n_{k−r}) + [n_0 > 0] + [k чётно]·[n_{k/2} > 0].
 * а) Можно ли выбрать X чисел? б) Есть ли набор наибольшего размера,
 * содержащий число t? в) Наибольшее количество.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PM20 {
  N: number;
  k: number;
  X: number;
  t: number;
}

export function chislaM20(p: PM20) {
  /* cnt[r] — сколько чисел из 1…N дают остаток r. */
  const cnt = Array.from({ length: p.k }, (_, r) => {
    let c = 0;
    for (let x = 1; x <= p.N; x += 1) if (x % p.k === r) c += 1;
    return c;
  });
  let max = cnt[0]! > 0 ? 1 : 0;
  const pary: { r: number; s: number; vz: number }[] = [];
  for (let r = 1; r < p.k - r; r += 1) {
    const s = p.k - r;
    const vz = cnt[r]! >= cnt[s]! ? r : s;
    pary.push({ r, s, vz });
    max += Math.max(cnt[r]!, cnt[s]!);
  }
  const chet = p.k % 2 === 0;
  if (chet && cnt[p.k / 2]! > 0) max += 1;
  const daA = p.X <= max;
  const rt = p.t % p.k;
  let daB: boolean;
  if (rt === 0 || (chet && rt === p.k / 2)) daB = true;
  else daB = cnt[rt]! >= cnt[p.k - rt]!;
  return { cnt, max, pary, chet, daA, rt, daB };
}

function sobrat(p: PM20): Chast2Zadacha {
  const ch = chislaM20(p);
  const uslovie =
    `Из чисел $1,\\ 2,\\ \\ldots,\\ ${p.N}$ выбирают несколько различных так, чтобы сумма никаких двух выбранных чисел не делилась на ${p.k}.\n` +
    `а) Можно ли выбрать ${p.X} чисел?\n` +
    `б) Можно ли выбрать наибольшее возможное количество чисел так, чтобы среди них было число ${p.t}?\n` +
    `в) Какое наибольшее количество чисел можно выбрать?`;
  const sostav = ch.pary.map(
    (u) =>
      `$\\max(${ch.cnt[u.r]},${ch.cnt[u.s]})=${Math.max(ch.cnt[u.r]!, ch.cnt[u.s]!)}$ из остатков $${u.r}$ и $${u.s}$`,
  );
  const ostT = `${ch.cnt.map((c, r) => `$n_{${r}}=${c}$`).join(', ')}`;
  const bLine = ch.daB
    ? ch.rt === 0 || (ch.chet && ch.rt === p.k / 2)
      ? `Да. Число ${p.t} даёт остаток ${ch.rt}; из этого класса в наибольший набор входит ровно одно число — можно взять именно ${p.t}.`
      : `Да. Число ${p.t} даёт остаток ${ch.rt}, а класс остатка ${ch.rt} не меньше парного класса $${p.k - ch.rt}$ ($${ch.cnt[ch.rt]}\\ge${ch.cnt[p.k - ch.rt]}$): в наибольшем наборе можно брать весь класс ${ch.rt}.`
    : `Нет. Число ${p.t} даёт остаток ${ch.rt}; класс этого остатка меньше парного ($${ch.cnt[ch.rt]}<${ch.cnt[p.k - ch.rt]}$). Если в наборе есть хоть одно число с остатком ${ch.rt}, то чисел с остатком ${p.k - ch.rt} в нём нет, и из этой пары классов взято не больше ${ch.cnt[ch.rt]} чисел — набор не наибольший.`;
  return {
    no: 20,
    shablon: 'm20.ostatki',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.daA } },
      { bukva: 'б', pole: { vid: 'danet', verno: ch.daB } },
      {
        bukva: 'в',
        podpis: 'Наибольшее количество',
        pole: { vid: 'chislo', verno: String(ch.max) },
      },
    ],
    otvet: `а) ${ch.daA ? 'да' : 'нет'}; б) ${ch.daB ? 'да' : 'нет'}; в) $${ch.max}$`,
    reshenie: [
      {
        title: 'Остатки при делении на ' + p.k,
        lines: [
          `Сумма двух чисел делится на ${p.k} тогда и только тогда, когда сумма их остатков равна 0 или ${p.k}. Количества чисел с каждым остатком: ${ostT}.`,
          `Числа с остатками $r$ и ${p.k}$-r$ ($r\\ne0${ch.chet ? `,\\ ${p.k / 2}` : ''}$) нельзя брать вместе; чисел с остатком 0${ch.chet ? ` и с остатком ${p.k / 2}` : ''} можно взять не больше одного.`,
        ],
      },
      {
        title: 'в) Оценка и пример',
        lines: [
          `Оценка: ${sostav.join('; ')}${ch.cnt[0]! > 0 ? '; одно число с остатком 0' : ''}${ch.chet && ch.cnt[p.k / 2]! > 0 ? `; одно число с остатком ${p.k / 2}` : ''}. Всего не больше $${ch.max}$.`,
          `Пример: берём все числа из большего класса каждой пары${ch.cnt[0]! > 0 ? `, число ${p.k}` : ''}${ch.chet && ch.cnt[p.k / 2]! > 0 ? ` и число ${p.k / 2}` : ''} — суммы двух таких чисел не делятся на ${p.k}. Ответ в): $${ch.max}$.`,
        ],
      },
      {
        title: 'а) и б)',
        lines: [
          ch.daA
            ? `а) Да: $${p.X}\\le${ch.max}$, достаточно взять ${p.X} чисел из набора в).`
            : `а) Нет: $${p.X}>${ch.max}$ — больше наибольшего количества.`,
          `б) ${bLine}`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Остатки при делении', formula: `r+s\\equiv0\\pmod{${p.k}}` },
      { slovo: 'Пары классов — берём больший', formula: `\\max(n_r,n_{${p.k}-r})` },
      {
        slovo: 'Нулевой класс — одно число',
        formula: ch.chet ? `n_0,\\ n_{${p.k / 2}}\\to1` : 'n_0\\to1',
      },
      { slovo: 'Ответ в)', formula: String(ch.max) },
    ],
    kontrol: { a: ch.daA, b: ch.daB, v: ch.max },
  };
}

export const M20_OSTATKI: Shablon2<PM20> = {
  no: 20,
  prototip:
    'Наибольший набор чисел 1…N без пар с суммой, кратной k: классы остатков, оценка и пример',
  sobrat,
};
