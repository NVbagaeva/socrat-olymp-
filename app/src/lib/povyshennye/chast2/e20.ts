/**
 * №20 (варианты 9–10): на доске N трёхзначных чисел; есть число с нулём
 * в разряде десятков, число с нулём в разряде единиц и число без нулей.
 * Цифры числа с нулём переставляют по убыванию, без нуля — по
 * возрастанию; S₁ и S₂ — суммы старого и нового ряда.
 *
 * Классы: T = a0b (b ≠ 0), U = ab0 (b ≠ 0), W = a00, Z — без нулей.
 * Условия: есть число из T∪W, из U∪W и из Z.
 * а) S₂ − S₁ = D: число и перестановка его цифр сравнимы по модулю 9.
 * б) S₂ = k·S₁ (или S₁ = k·S₂): пример поиском или «нет» по пункту в.
 * в) Наибольшее отношение — дробная задача: итерации Динкельбаха по
 *    наилучшим числам классов (при фиксированном λ выгодно взять все
 *    числа, кроме обязательных, одинаковыми).
 */

import type { Chast2Zadacha, Shablon2 } from './types';

type Klass = 'T' | 'U' | 'W' | 'Z';
/** Класс или объединение «с нулём в разряде десятков/единиц». */
type KlassS = Klass | 'TW' | 'UW';
const KLASSY: readonly Klass[] = ['T', 'U', 'W', 'Z'];

export interface PE20 {
  N: number;
  /** max — наибольшее S₂/S₁, min — наибольшее S₁/S₂. */
  cel: 'max' | 'min';
  /** а) S₂ − S₁ = D (0 — «равна»). */
  D: number;
  /** б) во сколько раз. */
  k: number;
}

function klassRaw(n: number): Klass {
  const b = Math.floor(n / 10) % 10;
  const c = n % 10;
  if (b === 0 && c === 0) return 'W';
  if (b === 0) return 'T';
  if (c === 0) return 'U';
  return 'Z';
}

function novoeRaw(n: number): number {
  const d = String(n).split('').map(Number);
  const s = klassRaw(n) === 'Z' ? d.sort((x, y) => x - y) : d.sort((x, y) => y - x);
  return Number(s.join(''));
}

const VSE = Array.from({ length: 900 }, (_, i) => i + 100);
const KL = new Map(VSE.map((n) => [n, klassRaw(n)]));
const NOV = new Map(VSE.map((n) => [n, novoeRaw(n)]));
export const klass = (n: number): Klass => KL.get(n)!;
export const novoe = (n: number): number => NOV.get(n)!;

/** Покрытие условий набором классов: [T∪W, U∪W, Z]. */
function pokryto(kl: Iterable<Klass>): [boolean, boolean, boolean] {
  const s = new Set(kl);
  return [s.has('T') || s.has('W'), s.has('U') || s.has('W'), s.has('Z')];
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

interface Nabor {
  /** [число, сколько раз]. */
  chisla: [number, number][];
  S1: number;
  S2: number;
}

const nabor = (chisla: [number, number][]): Nabor => ({
  chisla,
  S1: chisla.reduce((s, [n, c]) => s + n * c, 0),
  S2: chisla.reduce((s, [n, c]) => s + novoe(n) * c, 0),
});

/** Числитель и знаменатель отношения: S₂/S₁ (max) или S₁/S₂ (min). */
const chisl = (cel: PE20['cel'], n: number) => (cel === 'max' ? novoe(n) : n);
const znam = (cel: PE20['cel'], n: number) => (cel === 'max' ? n : novoe(n));

/** Лучшее число класса по h(n) = Q·chisl − P·znam (при равенстве — меньшее). */
function luchshee(
  cel: PE20['cel'],
  P: number,
  Q: number,
  kl: Klass | null,
): { n: number; h: number } {
  let best = { n: 0, h: -Infinity };
  for (const n of VSE) {
    if (kl !== null && klass(n) !== kl) continue;
    const h = Q * chisl(cel, n) - P * znam(cel, n);
    if (h > best.h) best = { n, h };
  }
  return best;
}

/** Наилучший набор при λ = P/Q: заполнитель + обязательные числа. */
function luchshiyNabor(p: PE20, P: number, Q: number): { nab: Nabor; H: number } {
  const L = Object.fromEntries(KLASSY.map((k) => [k, luchshee(p.cel, P, Q, k)])) as Record<
    Klass,
    { n: number; h: number }
  >;
  let best: { nab: Nabor; H: number } | null = null;
  for (const f of KLASSY)
    for (let mask = 0; mask < 8; mask += 1) {
      const dop = KLASSY.filter((k) => k !== f).filter((_, i) => mask & (1 << i));
      const cov = pokryto([f, ...dop]);
      if (!cov.every(Boolean)) continue;
      const nf = p.N - dop.length;
      const H = nf * L[f].h + dop.reduce((s, k) => s + L[k].h, 0);
      if (best === null || H > best.H)
        best = { nab: nabor([[L[f].n, nf], ...dop.map((k): [number, number] => [L[k].n, 1])]), H };
    }
  return best!;
}

export function optimumE20(p: PE20): { P: number; Q: number; nab: Nabor } {
  let nab = nabor([
    [100, 1],
    [111, p.N - 1],
  ]);
  for (let it = 0; it < 50; it += 1) {
    const ch = p.cel === 'max' ? nab.S2 : nab.S1;
    const zn = p.cel === 'max' ? nab.S1 : nab.S2;
    const g = gcd(ch, zn);
    const P = ch / g;
    const Q = zn / g;
    const b = luchshiyNabor(p, P, Q);
    if (b.H <= 0) return { P, Q, nab };
    nab = b.nab;
  }
  throw new Error('e20: итерации не сошлись');
}

/**
 * Пример набора с Σ(α·новое + β·старое) = R: c чисел u, m чисел w и
 * обязательные числа для непокрытых условий.
 */
export function primerE20(N: number, al: number, be: number, R: number): Nabor | null {
  const g = (n: number) => al * novoe(n) + be * n;
  /* Кандидаты в обязательные числа по видам. */
  const KAND: Record<string, number[]> = {
    W: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    T: [101, 102, 103, 104, 105, 106, 107, 108, 109, 201, 209, 901],
    U: [110, 120, 130, 140, 150, 160, 170, 180, 190, 210, 910],
    Z: [111, 112, 113, 119, 121, 199, 211, 911, 999],
  };
  for (const u of VSE)
    for (const w of VSE) {
      if (w <= u) continue;
      const cov = pokryto([klass(u), klass(w)]);
      const vidy: string[] = [];
      if (!cov[0] && !cov[1]) vidy.push('W');
      else if (!cov[0]) vidy.push('T');
      else if (!cov[1]) vidy.push('U');
      if (!cov[2]) vidy.push('Z');
      const ost = N - vidy.length;
      const gu = g(u);
      const gw = g(w);
      if (gu === gw) continue;
      const vars: number[][] = vidy.reduce<number[][]>(
        (acc, v) => acc.flatMap((x) => KAND[v]!.map((n) => [...x, n])),
        [[]],
      );
      for (const dop of vars) {
        const chs = R - ost * gw - dop.reduce((s, n) => s + g(n), 0);
        if (chs % (gu - gw) !== 0) continue;
        const c = chs / (gu - gw);
        if (c < 1 || c > ost - 1) continue;
        const vse: [number, number][] = [
          [u, c],
          [w, ost - c],
        ];
        for (const n of dop) {
          const e = vse.find(([x]) => x === n);
          if (e) e[1] += 1;
          else vse.push([n, 1]);
        }
        return nabor(vse);
      }
    }
  return null;
}

const pokaz = (nab: Nabor) =>
  nab.chisla
    .map(([n, c]) =>
      c === 1
        ? `число $${n}$`
        : `${c} ${c % 10 === 1 && c % 100 !== 11 ? 'число' : c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 12 || c % 100 > 14) ? 'числа' : 'чисел'} $${n}$`,
    )
    .join(', ');
const novyeT = (nab: Nabor) => nab.chisla.map(([n]) => `$${n}\\to${novoe(n)}$`).join(', ');
const summa = (nab: Nabor, kakie: 1 | 2) =>
  nab.chisla
    .map(([n, c]) => `${c === 1 ? '' : `${c}\\cdot`}${kakie === 1 ? n : novoe(n)}`)
    .join('+');

const IMYA: Record<Klass, string> = {
  T: 'вида $\\overline{a0b}$, $b\\ne0$',
  U: 'вида $\\overline{ab0}$, $b\\ne0$',
  W: 'вида $\\overline{a00}$',
  Z: 'без нулей',
};

function sobrat(p: PE20): Chast2Zadacha {
  if (p.N < 4) throw new Error('e20: N');
  const max = p.cel === 'max';
  const opt = optimumE20(p);
  const { P, Q } = opt;
  const optV = P / Q;
  /* а) */
  const aMozhno = p.D % 9 === 0;
  const aPrim = aMozhno ? primerE20(p.N, 1, -1, p.D) : null;
  if (aMozhno && aPrim === null) throw new Error('e20: нет примера а');
  /* б) */
  const bPrim = p.k > optV ? null : max ? primerE20(p.N, 1, -p.k, 0) : primerE20(p.N, -p.k, 1, 0);
  if (bPrim === null && p.k <= optV) throw new Error('e20: б не решён');
  const aVopros =
    p.D === 0
      ? 'Может ли сумма чисел нового ряда быть равна сумме чисел исходного ряда?'
      : `Может ли сумма чисел нового ряда быть ${p.D > 0 ? 'больше' : 'меньше'} суммы чисел исходного ряда ровно на $${Math.abs(p.D)}$?`;
  const bVopros = max
    ? `Может ли сумма чисел нового ряда быть в $${p.k}$ раз больше суммы чисел исходного ряда?`
    : `Может ли сумма чисел нового ряда быть в $${p.k}$ раз меньше суммы чисел исходного ряда?`;
  const vVopros = max
    ? 'В какое наибольшее число раз сумма чисел нового ряда может быть больше суммы чисел исходного ряда?'
    : 'В какое наибольшее число раз сумма чисел нового ряда может быть меньше суммы чисел исходного ряда?';
  const uslovie =
    `На доске записано $${p.N}$ натуральных трёхзначных чисел (числа могут повторяться). Среди них есть хотя бы одно число с цифрой $0$ в разряде десятков, хотя бы одно число с цифрой $0$ в разряде единиц и хотя бы одно число, в записи которого нет нулей. ` +
    `В каждом числе, в записи которого есть $0$, цифры переставили в порядке убывания, а в каждом числе без нулей — в порядке возрастания. Получился новый ряд из $${p.N}$ чисел.\n` +
    `а) ${aVopros}\n` +
    `б) ${bVopros}\n` +
    `в) ${vVopros}`;
  const otvV = `\\dfrac{${P}}{${Q}}`;
  const S1 = 'S_1';
  const S2 = 'S_2';
  const pr = (nab: Nabor) =>
    `Например, ${pokaz(nab)} (${novyeT(nab)}): $${S1}=${summa(nab, 1)}=${nab.S1}$, $${S2}=${summa(nab, 2)}=${nab.S2}$.`;

  /* в) оценка: h(n) = Q·числитель − P·знаменатель. */
  const h = (n: number) => Q * chisl(p.cel, n) - P * znam(p.cel, n);
  const hT = max ? `${Q}\\cdot n'-${P}\\cdot n` : `${Q}\\cdot n-${P}\\cdot n'`;
  const glob = luchshee(p.cel, P, Q, null);
  const kStar = klass(glob.n);
  const M = Object.fromEntries(KLASSY.map((k) => [k, luchshee(p.cel, P, Q, k)])) as Record<
    Klass,
    { n: number; h: number }
  >;
  const covStar = pokryto([kStar]);
  /* Случаи свидетелей непокрытых условий. */
  const sluchai: { opis: string; kl: KlassS[] }[] = [];
  const nadoZ = !covStar[2];
  const z: KlassS[] = nadoZ ? ['Z'] : [];
  if (!covStar[0] && !covStar[1]) {
    sluchai.push({ opis: 'есть число вида $\\overline{a00}$', kl: ['W', ...z] });
    sluchai.push({
      opis: 'чисел вида $\\overline{a00}$ нет; тогда есть число вида $\\overline{a0b}$ и число вида $\\overline{ab0}$',
      kl: ['T', 'U', ...z],
    });
  } else if (!covStar[0]) {
    sluchai.push({ opis: 'есть число с нулём в разряде десятков', kl: ['TW', ...z] });
  } else if (!covStar[1]) {
    sluchai.push({ opis: 'есть число с нулём в разряде единиц', kl: ['UW', ...z] });
  } else sluchai.push({ opis: 'все условия', kl: z });
  const mx = (k: KlassS) =>
    k === 'TW' ? (M.T.h >= M.W.h ? M.T : M.W) : k === 'UW' ? (M.U.h >= M.W.h ? M.U : M.W) : M[k];
  const ocenki = sluchai.map((s) => {
    const sum = (p.N - s.kl.length) * glob.h + s.kl.reduce((t, k) => t + mx(k).h, 0);
    if (sum > 0) throw new Error('e20: оценка не сходится');
    const opisKl = s.kl
      .map((k) =>
        k === 'TW'
          ? 'с нулём в разряде десятков'
          : k === 'UW'
            ? 'с нулём в разряде единиц'
            : IMYA[k],
      )
      .join('; ');
    return `${sluchai.length > 1 ? `Если ${s.opis}: в` : 'В'}ыделим по одному числу каждого нужного вида (${opisKl}), для них $h\\le${s.kl.map((k) => mx(k).h).join('$, $h\\le')}$; для остальных $${p.N - s.kl.length}$ чисел $h\\le${glob.h}$. Сумма: $\\sum h\\le${p.N - s.kl.length}\\cdot${glob.h}${s.kl.map((k) => (mx(k).h < 0 ? `${mx(k).h}` : `+${mx(k).h}`)).join('')}=${sum}${sum < 0 ? '<0' : ''}$.`;
  });
  const used = new Set<Klass>([
    kStar,
    ...sluchai.flatMap((s) =>
      s.kl.flatMap((k) =>
        k === 'TW' ? (['T', 'W'] as Klass[]) : k === 'UW' ? (['U', 'W'] as Klass[]) : [k],
      ),
    ),
  ]);
  const tablM = KLASSY.filter((k) => used.has(k)).map(
    (k) => `числа ${IMYA[k]}: наибольшее $h=${M[k].h}$ при $n=${M[k].n}$ ($n'=${novoe(M[k].n)}$)`,
  );

  return {
    no: 20,
    shablon: 'e20.perestanovkaCifr',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Ответ', pole: { vid: 'danet', verno: aMozhno } },
      { bukva: 'б', podpis: 'Ответ', pole: { vid: 'danet', verno: bPrim !== null } },
      { bukva: 'в', podpis: 'Наибольшее отношение', pole: { vid: 'chislo', verno: `${P}/${Q}` } },
    ],
    otvet: `а) ${aMozhno ? 'да' : 'нет'}; б) ${bPrim !== null ? 'да' : 'нет'}; в) $${otvV}$`,
    reshenie: [
      {
        title: 'а)',
        lines: aMozhno
          ? [
              `Да. ${pr(aPrim!)} ${p.D === 0 ? 'Суммы равны.' : `$${S2}-${S1}=${aPrim!.S2 - aPrim!.S1}$.`}`,
              'Все условия выполнены: есть число с нулём в разряде десятков, число с нулём в разряде единиц и число без нулей.',
            ]
          : [
              'Перестановка цифр не меняет сумму цифр, а число и сумма его цифр дают одинаковые остатки при делении на $9$. Значит, каждое новое число сравнимо со старым по модулю $9$, и $S_2-S_1$ делится на $9$.',
              `Число $${Math.abs(p.D)}$ на $9$ не делится — нет.`,
            ],
      },
      {
        title: 'б)',
        lines:
          bPrim !== null
            ? [
                `Да. ${pr(bPrim)} ${max ? `$${bPrim.S2}=${p.k}\\cdot${bPrim.S1}$` : `$${bPrim.S1}=${p.k}\\cdot${bPrim.S2}$`}.`,
              ]
            : [
                `Нет: в пункте в) доказано, что отношение не больше $${otvV}<${p.k}$ (так как $${P}<${p.k}\\cdot${Q}=${p.k * Q}$).`,
              ],
      },
      {
        title: 'в) Оценка',
        lines: [
          `Обозначим через $n'$ число, полученное из $n$. Докажем, что ${max ? `$${S2}\\le${otvV}\\,${S1}$` : `$${S1}\\le${otvV}\\,${S2}$`}, то есть $\\sum h(n)\\le0$, где $h(n)=${hT}$.`,
          `Перебором цифр в каждом виде чисел: ${tablM.join('; ')}.`,
          `Наибольшее значение $h$ среди всех трёхзначных чисел — $${glob.h}$ при $n=${glob.n}$.`,
          ...ocenki,
          `Итак, всегда ${max ? `$${S2}\\le${otvV}\\,${S1}$` : `$${S1}\\le${otvV}\\,${S2}$`}.`,
        ],
      },
      {
        title: 'в) Пример',
        lines: [
          `${pr(opt.nab)} Отношение $${max ? '\\dfrac{S_2}{S_1}' : '\\dfrac{S_1}{S_2}'}=${otvV}$.`,
          `Ответ: $${otvV}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Остатки при делении на 9 / пример',
        formula: aMozhno ? `${S2}-${S1}=${p.D}` : `${S2}\\equiv ${S1}\\pmod 9`,
      },
      {
        slovo: 'б) Пример или оценка из в)',
        formula: bPrim !== null ? '\\text{да}' : `${otvV}<${p.k}`,
      },
      { slovo: 'в) Оценка через $h(n)$ и пример', formula: otvV },
    ],
    kontrol: { P, Q, a: aMozhno ? 1 : 0, b: bPrim !== null ? 1 : 0, otn: optV, hMax: h(glob.n) },
  };
}

export const E20_PERESTANOVKA: Shablon2<PE20> = {
  no: 20,
  prototip: 'Перестановка цифр трёхзначных чисел: остатки по модулю 9 и наибольшее отношение сумм',
  sobrat,
};
