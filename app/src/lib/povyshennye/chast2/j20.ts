/**
 * №20 (варианты 17–18): три различных натуральных числа: второе равно
 * λ·S(первого), третье — μ·S(второго) (S — сумма цифр).
 *
 * Число и сумма его цифр дают одинаковые остатки при делении на 9:
 * сумма трёх чисел ≡ S(1 + λ + λμ) (mod 9), где S = S(первого). Если
 * g = НОД(9, 1 + λ + λμ) > 1, сумма делится на g.
 * а) Сумма A (кратна g) — пример перебором. б) Сумма B (не кратна g) — нет.
 * в) Третье число T: S(второго) = T/μ, второе = λs, s = S(первого) ≤ 36;
 *    считаем четырёхзначные числа с суммой цифр s по всем подходящим s.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PJ20 {
  lam: number;
  mu: number;
  /** а) сумма, которая получается; б) сумма, которая невозможна. */
  A: number;
  B: number;
  /** в) третье число. */
  T: number;
}

const S = (n: number) =>
  String(n)
    .split('')
    .reduce((x, y) => x + Number(y), 0);

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Четырёхзначных чисел с суммой цифр s. */
export function chetyrehznach(s: number): number {
  let k = 0;
  for (let n = 1000; n <= 9999; n += 1) if (S(n) === s) k += 1;
  return k;
}

export function chislaJ20(p: PJ20) {
  const g = gcd(9, 1 + p.lam + p.lam * p.mu);
  if (g === 1) throw new Error('j20: g = 1');
  if (p.A % g !== 0 || p.B % g === 0) throw new Error('j20: A или B');
  /* а) пример. */
  let primer: [number, number, number] | null = null;
  for (let n = p.A; n >= 1 && primer === null; n -= 1) {
    const v = p.lam * S(n);
    const t = p.mu * S(v);
    if (n + v + t === p.A && n !== v && v !== t && n !== t) primer = [n, v, t];
  }
  if (primer === null) throw new Error('j20: нет примера');
  /* в) */
  if (p.T % p.mu !== 0) throw new Error('j20: T не кратно μ');
  const sv = p.T / p.mu;
  const ss: { s: number; v: number; k: number; ok: boolean }[] = [];
  for (let s = 1; s <= 36; s += 1) {
    const v = p.lam * s;
    if (S(v) === sv) ss.push({ s, v, k: chetyrehznach(s), ok: v !== p.T });
  }
  const itog = ss.filter((x) => x.ok).reduce((a, x) => a + x.k, 0);
  /* Проверка перебором. */
  let perebor = 0;
  for (let n = 1000; n <= 9999; n += 1) {
    const v = p.lam * S(n);
    const t = p.mu * S(v);
    if (t === p.T && n !== v && v !== t && n !== t) perebor += 1;
  }
  if (perebor !== itog) throw new Error(`j20: в) ${perebor} ≠ ${itog}`);
  return { g, primer, sv, ss, itog };
}

const RAZ: Record<number, string> = {
  1: 'сумме',
  2: 'удвоенной сумме',
  3: 'утроенной сумме',
  4: 'учетверённой сумме',
  5: 'упятерённой сумме',
};

function sobrat(p: PJ20): Chast2Zadacha {
  const ch = chislaJ20(p);
  const raz = (k: number) => RAZ[k] ?? `сумме, умноженной на ${k}`;
  const uslovie =
    `На доске написаны три различных натуральных числа. Второе число равно ${raz(p.lam)} цифр первого, а третье равно ${raz(p.mu)} цифр второго.\n` +
    `а) Может ли сумма этих чисел быть равна ${p.A}?\n` +
    `б) Может ли сумма этих чисел быть равна ${p.B}?\n` +
    `в) Найдите количество четырёхзначных чисел, которые могут быть первым числом в тройке, при условии, что третье число равно ${p.T}.`;
  const [n, v, t] = ch.primer;
  const kf = 1 + p.lam + p.lam * p.mu;
  const vLines = [
    `Третье число $${p.T}=${p.mu}\\cdot S(\\text{второго})$, значит, сумма цифр второго равна $${ch.sv}$. Второе число равно $${p.lam}s$, где $s$ — сумма цифр первого; для четырёхзначного первого $1\\le s\\le36$, второе не больше $${p.lam * 36}$.`,
    `Подходят $s$, при которых $S(${p.lam}s)=${ch.sv}$: ${ch.ss.map((x) => `$s=${x.s}$ (второе $${x.v}$${x.ok ? '' : `, совпадает с третьим — не подходит`})`).join(', ')}.`,
    `Количество четырёхзначных чисел с суммой цифр $s$ (решения $a+b+c+d=s$ в цифрах, $a\\ge1$ — по формуле включений и исключений): ${ch.ss
      .filter((x) => x.ok)
      .map((x) => `$N(${x.s})=${x.k}$`)
      .join(', ')}.`,
    `Первое число четырёхзначное, второе и третье меньше $1000$ — все три различны. Итого: $${ch.ss
      .filter((x) => x.ok)
      .map((x) => x.k)
      .join('+')}=${ch.itog}$.`,
  ];
  return {
    no: 20,
    shablon: 'j20.summyCifr',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: true } },
      { bukva: 'б', pole: { vid: 'danet', verno: false } },
      { bukva: 'в', podpis: 'Количество', pole: { vid: 'chislo', verno: `${ch.itog}` } },
    ],
    otvet: `а) да; б) нет; в) $${ch.itog}$`,
    reshenie: [
      {
        title: 'а) Пример',
        lines: [
          `Да: $${n}$, $${v}=${p.lam}\\cdot${S(n)}$, $${t}=${p.mu}\\cdot${S(v)}$; $${n}+${v}+${t}=${p.A}$.`,
        ],
      },
      {
        title: 'б) Остатки при делении на 9',
        lines: [
          `Число и сумма его цифр дают одинаковые остатки при делении на $9$. Пусть $s$ — сумма цифр первого числа $N$. Тогда $N\\equiv s$, второе $=${p.lam}s$, третье $\\equiv${p.mu}\\cdot${p.lam}s\\pmod 9$.`,
          `Сумма трёх чисел $\\equiv s(1+${p.lam}+${p.lam * p.mu})=${kf}s\\pmod 9$, и так как $${kf}$ делится на $${ch.g}$, сумма делится на $${ch.g}$.`,
          `$${p.B}$ на $${ch.g}$ не делится — нет.`,
        ],
      },
      { title: 'в) Подсчёт', lines: [...vLines, `Ответ: а) да; б) нет; в) $${ch.itog}$.`] },
    ],
    razbor: [
      { slovo: 'а) Пример', formula: `${n}+${v}+${t}=${p.A}` },
      { slovo: 'б) Остатки по модулю 9', formula: `${kf}s\\ \\vdots\\ ${ch.g}` },
      {
        slovo: 'в) Возможные суммы цифр первого числа',
        formula: ch.ss
          .filter((x) => x.ok)
          .map((x) => x.s)
          .join(';\\ '),
      },
      { slovo: 'в) Ответ', formula: `${ch.itog}` },
    ],
    kontrol: { itog: ch.itog, primer: [n, v, t], g: ch.g },
  };
}

export const J20_SUMMY_CIFR: Shablon2<PJ20> = {
  no: 20,
  prototip:
    'Три числа через суммы цифр: признак делимости на 9, пример и подсчёт четырёхзначных чисел',
  sobrat,
};
