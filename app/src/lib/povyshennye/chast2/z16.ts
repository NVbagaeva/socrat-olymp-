/**
 * №16: дробное показательное неравенство с корнем в числителе.
 *
 * (q^{2x+α} + x − s√x − t)/(q^{2x+γ} − q^e) ≥ q^{α−γ} (или ≤). После
 * переноса правой части показательные слагаемые числителя сокращаются,
 * остаётся квадратный трёхчлен от √x с корнями y₁ < y₂, знаменатель
 * меняет знак в x₀ = (e − γ)/2. Ответ собирается разбором знаков на
 * промежутках — как в образцах: вариант 1 (≥, x₀ между y₁² и y₂²) и
 * вариант 2 (≤, x₀ левее обоих корней).
 *
 * Степень записывается через q^{2x+…} или через B^{x+…}, B = q².
 */

import type { Mnozhestvo } from '@/lib/chast2/sravnenie';
import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface P16 {
  /** Основание: 2 или 3. */
  q: number;
  /** Показатель в знаменателе справа: q^e (q^{2x+γ} = q^e при x₀ = (e − γ)/2). */
  e: number;
  y1: number;
  y2: number;
  /** Сдвиг показателя в числителе: q^{2x+α} (по умолчанию 1). */
  alpha?: number;
  /** Сдвиг показателя в знаменателе: q^{2x+γ} (по умолчанию 0). */
  gamma?: number;
  /** Знак неравенства (по умолчанию ≥). */
  znak?: 'ge' | 'le';
  /** Запись степени: через q^{2x+…} или через (q²)^{x+…}. */
  vidN?: 'q' | 'B';
  vidD?: 'q' | 'B';
}

export function chisla16(p: P16) {
  const alpha = p.alpha ?? 1;
  const gamma = p.gamma ?? 0;
  const k = p.q ** (alpha - gamma);
  const R = p.q ** p.e;
  const s = p.y1 + p.y2;
  const t = k * R - p.y1 * p.y2;
  const x0 = (p.e - gamma) / 2;
  return { alpha, gamma, k, R, s, t, x0, B: p.q * p.q };
}

/** Кусок ответа: промежуток или точка. */
export interface Kusok16 {
  lo: number;
  loZ: boolean;
  hi: number;
  hiZ: boolean;
}

/** Решение неравенства разбором знаков: точные концы y₁², y₂², x₀, 0. */
export function reshit16(p: P16): Kusok16[] {
  const { x0 } = chisla16(p);
  const a = p.y1 * p.y1;
  const b = p.y2 * p.y2;
  const ge = (p.znak ?? 'ge') === 'ge';
  const chisl = (x: number) => (Math.sqrt(x) - p.y1) * (Math.sqrt(x) - p.y2);
  const ok = (x: number) => {
    if (x === x0) return false;
    const v = chisl(x) / (x - x0);
    return ge ? v >= 0 : v <= 0;
  };
  const tochki = [...new Set([0, a, b, x0])].sort((u, v) => u - v);
  const out: Kusok16[] = [];
  const dobavit = (k: Kusok16) => {
    const last = out[out.length - 1];
    if (last !== undefined && last.hi === k.lo && (last.hiZ || k.loZ)) {
      last.hi = k.hi;
      last.hiZ = k.hiZ;
    } else out.push(k);
  };
  for (let i = 0; i < tochki.length; i += 1) {
    const x = tochki[i]!;
    const nx = tochki[i + 1] ?? Infinity;
    /* Точка: ноль числителя (или x = 0) — подходит, если не x₀. */
    const vTochke = x !== x0 && (chisl(x) === 0 ? true : ok(x));
    const mid = nx === Infinity ? x + 1 : (x + nx) / 2;
    const vInterval = ok(mid);
    if (vTochke && !vInterval) dobavit({ lo: x, loZ: true, hi: x, hiZ: true });
    if (vInterval) {
      const nxOk = nx !== Infinity && nx !== x0 && (chisl(nx) === 0 || ok(nx));
      dobavit({ lo: x, loZ: vTochke, hi: nx, hiZ: nxOk });
    }
  }
  /* Точка, уже поглощённая промежутком справа, сливается в dobavit. */
  return out;
}

const chTex = (x: number) =>
  x === Infinity ? '+\\infty' : Number.isInteger(x) ? String(x) : dec(x);
const chPole = (x: number) => (x === Infinity ? 'inf' : String(x).replace('.', ','));

export function mnozhestvoTex(kuski: readonly Kusok16[]): string {
  if (kuski.length === 0) return '\\varnothing';
  return kuski
    .map((k) =>
      k.lo === k.hi
        ? `\\left\\{${chTex(k.lo)}\\right\\}`
        : `\\left${k.loZ ? '[' : '('}${chTex(k.lo)};\\ ${chTex(k.hi)}\\right${k.hiZ && k.hi !== Infinity ? ']' : ')'}`,
    )
    .join('\\cup');
}

function vPole(kuski: readonly Kusok16[]): Mnozhestvo {
  return {
    kuski: kuski.map((k) =>
      k.lo === k.hi
        ? { t: 'tochka' as const, x: chPole(k.lo) }
        : {
            t: 'interval' as const,
            lo: chPole(k.lo),
            loZakr: k.loZ,
            hi: chPole(k.hi),
            hiZakr: k.hiZ && k.hi !== Infinity,
          },
    ),
  };
}

/** Пересечение ответа с (x₀; +∞) или [0; x₀). */
function chast(kuski: readonly Kusok16[], x0: number, pravee: boolean): Kusok16[] {
  return kuski
    .map((k) => {
      const lo = pravee ? Math.max(k.lo, x0) : k.lo;
      const hi = pravee ? k.hi : Math.min(k.hi, x0);
      if (lo > hi || (lo === hi && (lo === x0 || !(k.loZ && k.hiZ)))) return null;
      return {
        lo,
        loZ: lo === k.lo ? k.loZ && lo !== x0 : false,
        hi,
        hiZ: hi === k.hi ? k.hiZ && hi !== x0 : false,
      };
    })
    .filter((k): k is Kusok16 => k !== null);
}

/** Степень q^{2x+c} или B^{x+c/2}. */
function stepen(q: number, c: number, vid: 'q' | 'B'): string {
  if (vid === 'B' && c % 2 === 0) {
    const h = c / 2;
    return `${q * q}^{x${h === 0 ? '' : h > 0 ? `+${h}` : `${h}`}}`;
  }
  return `${q}^{2x${c === 0 ? '' : c > 0 ? `+${c}` : `${c}`}}`;
}

function sobrat(p: P16): Chast2Zadacha {
  const { alpha, gamma, k, R, s, t, x0 } = chisla16(p);
  const a = p.y1 * p.y1;
  const b = p.y2 * p.y2;
  const ge = (p.znak ?? 'ge') === 'ge';
  if (t <= 0 || (p.e - gamma) % 2 === 0 || alpha < gamma || p.y1 >= p.y2 || p.y1 < 1)
    throw new Error('z16: не та структура');
  const kuski = reshit16(p);
  if (kuski.length < 2) throw new Error('z16: ответ без двух кусков');
  const c0 = p.y1 * p.y2;
  const x0t = dec(x0);
  const sx = s === 1 ? '' : String(s);
  const zn = ge ? '\\ge' : '\\le';
  const chN = stepen(p.q, alpha, p.vidN ?? 'q');
  const chD = stepen(p.q, gamma, p.vidD ?? 'B');
  const drob = `\\dfrac{${chN}+x-${sx}\\sqrt x-${t}}{${chD}-${R}}`;
  const kq = k === 1 ? '' : `${k}\\cdot`;
  const vychet = `${chN}+x-${sx}\\sqrt x-${t}-${kq}\\left(${chD}-${R}\\right)`;
  const kv = `x-${sx}\\sqrt x+${c0}`;
  const mn = `\\left(\\sqrt x-${p.y1}\\right)\\left(\\sqrt x-${p.y2}\\right)`;
  const den = `${p.q}^{2x${gamma === 0 ? '' : `+${gamma}`}}-${p.q}^{${p.e}}`;
  const otvet = mnozhestvoTex(kuski);
  const pr = chast(kuski, x0, true);
  const lv = chast(kuski, x0, false);
  const nado = (pos: boolean) => (pos === ge ? '\\ge0' : '\\le0');
  const podmn = (ks: Kusok16[]) =>
    ks.length === 0 ? 'решений нет' : `$x\\in${mnozhestvoTex(ks)}$`;
  const otNuly = [a, b].filter((z) => z !== x0);

  return {
    no: 16,
    shablon: 'z16.pokazKoren',
    uslovie: `Решите неравенство $${drob}${zn} ${k}.$`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: vPole(kuski) },
      },
    ],
    otvet: `$${otvet}$`,
    reshenie: [
      {
        title: 'Область определения',
        lines: [
          `Корень определён при $x\\ge0$. Знаменатель не равен нулю: $${den}\\ne0$, то есть $2x${gamma === 0 ? '' : `+${gamma}`}\\ne${p.e}$, $x\\ne${x0t}$.`,
        ],
      },
      {
        title: 'Переносим правую часть',
        lines: [
          `$\\dfrac{${vychet}}{${chD}-${R}}${zn}0$. Так как $${kq}${chD}=${chN}$, показательные слагаемые числителя сокращаются:`,
          `$\\dfrac{${kv}}{${den}}${zn}0$.`,
        ],
      },
      {
        title: 'Раскладываем числитель',
        lines: [
          `Числитель — квадратный трёхчлен относительно $\\sqrt x$ с корнями $${p.y1}$ и $${p.y2}$ (по теореме Виета: $${p.y1}+${p.y2}=${s}$, $${p.y1}\\cdot${p.y2}=${c0}$):`,
          `$\\dfrac{${mn}}{${den}}${zn}0$.`,
        ],
      },
      {
        title: 'Знак знаменателя',
        lines: [
          `Функция $y=${p.q}^{u}$ возрастает, поэтому знаменатель положителен при $x>${x0t}$ и отрицателен при $x<${x0t}$.`,
        ],
      },
      {
        title: `Случай $x>${x0t}$`,
        lines: [
          `Знаменатель положителен, нужно $${mn}${nado(true)}$. Числитель меняет знак только в точках $x=${a}$ и $x=${b}$; с учётом $x>${x0t}$ получаем ${podmn(pr)}.`,
        ],
      },
      {
        title: `Случай $0\\le x<${x0t}$`,
        lines: [
          `Знаменатель отрицателен, нужно $${mn}${nado(false)}$. С учётом $0\\le x<${x0t}$ получаем ${podmn(lv)}.`,
        ],
      },
      { title: 'Ответ', lines: [`$x\\in${otvet}$.`] },
    ],
    razbor: [
      {
        slovo: 'Область определения: $x\\ge0$ и знаменатель не ноль',
        formula: `x\\ge0,\\ x\\ne${x0t}`,
      },
      {
        slovo: 'Переносим правую часть — показательные слагаемые сокращаются',
        formula: `\\dfrac{${kv}}{${den}}${zn}0`,
      },
      { slovo: 'Раскладываем числитель как трёхчлен от $\\sqrt x$', formula: mn },
      {
        slovo: 'Разбираем два случая по знаку знаменателя',
        formula: `x>${x0t}:\\ ${pr.length === 0 ? '\\varnothing' : mnozhestvoTex(pr)};\\quad x<${x0t}:\\ ${lv.length === 0 ? '\\varnothing' : mnozhestvoTex(lv)}`,
      },
      { slovo: 'Собираем ответ', formula: otvet },
    ],
    utochnenie: { u: `точки ${otNuly.join(' и/или ')}` },
    kontrol: {
      x0,
      kuski: kuski.flatMap((q) => [
        q.lo,
        q.hi === Infinity ? 1e9 : q.hi,
        q.loZ ? 1 : 0,
        q.hiZ ? 1 : 0,
      ]),
      a,
      b,
    },
  };
}

export const Z16_POKAZ_KOREN: Shablon2<P16> = {
  no: 16,
  prototip: 'Показательная дробь с √x в числителе: сокращение, трёхчлен от √x, два случая',
  sobrat,
};
