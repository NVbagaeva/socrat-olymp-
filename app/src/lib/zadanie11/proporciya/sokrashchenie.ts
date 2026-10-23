/**
 * «Считаем с умом»: сначала сокращаем, потом умножаем.
 *
 * Выражение x = (n₁·n₂·…)/m. Знаменатель раскладывается на простые
 * множители; для каждого множителя ищется множитель числителя, который
 * на него делится. Делимость объясняется признаком (2, 3, 4, 5, 9, 10,
 * 25 — «оканчивается на …», «сумма цифр …»), для остальных — прямым
 * делением с проверкой умножением. Если сократить нечего — честно:
 * «сократить нельзя, делим».
 *
 * Каждый шаг — пояснение и выкладка с зачёркиванием (\cancel):
 * новое число мелко сверху (в числителе) или снизу (в знаменателе).
 */

import { d, factor } from '../num';
import type { ShagSokr } from './bloki';

const cifry = (n: number): number[] =>
  String(Math.abs(Math.round(n)))
    .split('')
    .map(Number);
const summaCifr = (n: number): string => {
  const c = cifry(n);
  return `${c.join(' + ')} = ${c.reduce((a, b) => a + b, 0)}`;
};

/** Почему n делится на g — признаком, если он есть; иначе null. */
export function priznak(n: number, g: number): string | null {
  const N = `$${d(n)}$`;
  const last = cifry(n).at(-1) ?? 0;
  const last2 = n % 100;
  switch (g) {
    case 2:
      return `${N} оканчивается чётной цифрой $${last}$ — делится на $2$`;
    case 4:
      return `две последние цифры ${N} образуют число $${last2}$, оно делится на $4$ — значит, и ${N} делится на $4$`;
    case 5:
      return `${N} оканчивается на $${last}$ — делится на $5$`;
    case 25:
      return `${N} оканчивается на $${String(last2).padStart(2, '0')}$ — делится на $25$`;
    case 10:
      return `${N} оканчивается нулём — делится на $10$`;
    case 3:
      return `сумма цифр ${N}: $${summaCifr(n)}$ — делится на $3$ (признак делимости на $3$)`;
    case 9:
      return `сумма цифр ${N}: $${summaCifr(n)}$ — делится на $9$ (признак делимости на $9$)`;
    default:
      return null;
  }
}

/** Разложение на простые множители TeX: 87 → «3\\cdot29», 8 → «2\\cdot2\\cdot2». */
export function razlozhenieTex(n: number): string {
  return factor(n)
    .flatMap(([p, k]) => Array.from({ length: k }, () => d(p)))
    .join('\\cdot');
}

const isInt = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;

export interface Sokrashchenie {
  shagi: ShagSokr[];
  /** Значение выражения. */
  itog: number;
  /** Удалось ли что-то сократить. */
  sokratili: boolean;
}

/**
 * Сократить и посчитать x = (ch[0]·ch[1]·…)/zn. Числа — целые
 * положительные; если это не так, шаги без сокращения («считаем»).
 */
export function sokratit(ch: number[], zn: number, x = 'x'): Sokrashchenie {
  const shagi: ShagSokr[] = [];
  const itogVsego = ch.reduce((a, b) => a * b, 1) / zn;
  if (!ch.every((n) => isInt(n) && n > 0) || !isInt(zn) || zn <= 0) {
    shagi.push({
      tekst: 'Числа не целые — сокращать нечего, считаем.',
      tex: `${x}=${d(itogVsego)}`,
      na: 1,
    });
    return { shagi, itog: itogVsego, sokratili: false };
  }
  const nums = ch.map((n) => Math.round(n));
  let den = Math.round(zn);
  let sokratili = false;

  /** Выкладка: x = (числитель с зачёркиванием)/(знаменатель с зачёркиванием). */
  const vykladka = (i: number, novoe: number, staryyZn: number, novyyZn: number): string => {
    const top = nums
      .map((n, j) => (j === i ? `\\cancel{${d(n)}}^{\\,${d(novoe)}}` : d(n)))
      .join('\\cdot');
    const bottom = `\\cancel{${d(staryyZn)}}_{\\,${d(novyyZn)}}`;
    return `${x}=\\dfrac{${top}}{${bottom}}`;
  };
  /** То же для сокращения на 10 сразу в двух местах. */
  const sokratitNa = (i: number, g: number, tekst: string) => {
    const staryy = den;
    const novoe = (nums[i] as number) / g;
    const tex = vykladka(i, novoe, staryy, staryy / g);
    nums[i] = novoe;
    den = staryy / g;
    shagi.push({ tekst, tex, na: g });
    sokratili = true;
  };

  if (den === 1) {
    const itog = nums.reduce((a, b) => a * b, 1);
    shagi.push({
      tekst: 'Знаменателя нет — просто перемножаем.',
      tex: `${x}=${nums.map(d).join('\\cdot')}=${d(itog)}`,
      na: 1,
    });
    return { shagi, itog, sokratili: false };
  }

  // Разложение знаменателя — с чего начинается поиск.
  const prost = factor(den);
  if (prost.length === 1 && prost[0]?.[1] === 1) {
    shagi.push({
      tekst: `Знаменатель $${d(den)}$ — простое число: проверяем, делится ли на него числитель.`,
      tex: '',
      na: 1,
    });
  } else {
    shagi.push({
      tekst: `Раскладываем знаменатель на множители: $${d(den)}=${razlozhenieTex(den)}$.`,
      tex: '',
      na: 1,
    });
  }

  // Сначала нули: оба оканчиваются на 0 — сокращаем на 10.
  for (;;) {
    const i = nums.findIndex((n) => n % 10 === 0);
    if (den % 10 !== 0 || i < 0) break;
    sokratitNa(
      i,
      10,
      `$${d(nums[i] as number)}$ и $${d(den)}$ оканчиваются нулём — сокращаем на $10$.`,
    );
  }

  // Затем простые множители знаменателя по возрастанию.
  for (const [p] of factor(den)) {
    for (;;) {
      if (den % p !== 0) break;
      // Сколько раз p ещё в знаменателе и какой множитель числителя делится.
      let k = 0;
      for (let t = den; t % p === 0; t /= p) k += 1;
      let best = -1;
      let bestM = 0;
      nums.forEach((n, j) => {
        let m = 0;
        for (let t = n; t % p === 0 && m < k; t /= p) m += 1;
        if (m > bestM) {
          bestM = m;
          best = j;
        }
      });
      if (best < 0) break;
      const g = p ** bestM;
      const n = nums[best] as number;
      const pr = priznak(n, g);
      const tekst = pr
        ? `Проверяем: ${pr}. Сокращаем на $${d(g)}$: $${d(n)}:${d(g)}=${d(n / g)}$, $${d(den)}:${d(g)}=${d(den / g)}$.`
        : `Делим: $${d(n)}:${d(g)}=${d(n / g)}$ (проверка: $${d(g)}\\cdot${d(n / g)}=${d(n)}$). Сокращаем на $${d(g)}$.`;
      sokratitNa(best, g, tekst);
    }
  }

  const proizv = nums.reduce((a, b) => a * b, 1);
  if (den === 1) {
    shagi.push({
      tekst: sokratili
        ? 'Знаменатель сократился полностью — осталось перемножить.'
        : 'Перемножаем.',
      tex: `${x}=${nums.map(d).join('\\cdot')}=${d(proizv)}`,
      na: 1,
    });
    return { shagi, itog: proizv, sokratili };
  }
  const itog = proizv / den;
  shagi.push({
    tekst: sokratili
      ? 'Больше сократить нечего — делим.'
      : 'Сократить нельзя: числитель не делится ни на один множитель знаменателя — делим.',
    tex: `${x}=\\dfrac{${nums.map(d).join('\\cdot')}}{${d(den)}}=${nums.length > 1 ? `\\dfrac{${d(proizv)}}{${d(den)}}=` : ''}${d(itog)}`,
    na: 1,
  });
  return { shagi, itog, sokratili };
}

/**
 * Проверка цепочки: каждое сокращение делит нацело и сохраняет
 * значение, итог — значение исходного выражения. Пусто — всё верно.
 */
export function proveritSokrashchenie(ch: number[], zn: number, s: Sokrashchenie): string[] {
  const err: string[] = [];
  const want = ch.reduce((a, b) => a * b, 1) / zn;
  if (Math.abs(s.itog - want) > 1e-9 * Math.max(1, Math.abs(want))) {
    err.push(`итог ${s.itog} вместо ${want}`);
  }
  for (const sh of s.shagi) {
    if (sh.na > 1) {
      // В выкладке: \cancel{A}^{\,B} и \cancel{C}_{\,D} — A = B·na, C = D·na.
      const num = (t: string) => Number(t.replace(/\\,/g, '').replace('{,}', '.'));
      const up = /\\cancel\{([^}]*)\}\^\{\\,([^}]*)\}/.exec(sh.tex);
      const dn = /\\cancel\{([^}]*)\}_\{\\,([^}]*)\}/.exec(sh.tex);
      if (!up || !dn) {
        err.push(`шаг без зачёркивания: ${sh.tex}`);
        continue;
      }
      const [a, b, c, e] = [num(up[1] ?? ''), num(up[2] ?? ''), num(dn[1] ?? ''), num(dn[2] ?? '')];
      if (a !== b * sh.na || c !== e * sh.na) {
        err.push(`сокращение на ${sh.na} неверно: ${a}→${b}, ${c}→${e}`);
      }
    }
  }
  return err;
}
