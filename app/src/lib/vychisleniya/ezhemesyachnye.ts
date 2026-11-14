/**
 * Задание №8 для раздела «Ежемесячные варианты»: свои выражения на
 * числах варианта. Решение — по шагам (`Shag`: что делаем и почему, и
 * выкладка), как у прототипов раздела (`Draft`), второй счёт — численно
 * функциями Math. В банк и генератор №8 не входят. Как писать шаги —
 * docs/zadanie-8-razbory.md.
 */

import { gcd } from './numbers';
import { shag } from './prototypes/common';
import { d, frac } from './tex';
import type { Draft } from './types';

const r9 = (x: number) => Math.round(x * 1e9) / 1e9;

/** Произведение множителей без единиц; пусто — 1. */
const proizv = (xs: number[]) => {
  const ys = xs.filter((x) => x !== 1);
  return ys.length === 0 ? '1' : ys.join('\\cdot ');
};

/* ── Разность квадратов дробей ──────────────────────────────────── */

export interface RaznostKvadratov {
  /** ((a/z)² − (b/z)²) : k. */
  a: number;
  b: number;
  z: number;
  k: number;
}

/**
 * Числа большие, а по формуле разности квадратов знаменатели
 * сокращаются: (a − b)/z и (a + b)/z — удобные числа.
 */
export function raznostKvadratov(p: RaznostKvadratov): Draft {
  const { a, b, z, k } = p;
  const raz = (a - b) / z;
  const sum = (a + b) / z;
  const otvet = r9((raz * sum) / k);
  /* (a − b)/z и (a + b)/z — несократимыми дробями. */
  const g1 = gcd(a - b, z);
  const [Xn, Xd] = [(a - b) / g1, z / g1];
  const g2 = gcd(a + b, z);
  const [Yn, Yd] = [(a + b) / g2, z / g2];
  const drob = (n: number, m: number) => (m === 1 ? `${n}` : `\\dfrac{${n}}{${m}}`);
  const dz = (n: number) => `\\dfrac{${n}}{${z}}`;
  const skobki = `\\left(${dz(a)}-${dz(b)}\\right)\\left(${dz(a)}+${dz(b)}\\right)`;
  const sokr = `${drob(Xn, Xd)}\\cdot ${drob(Yn, Yd)}`;
  /* Знаменатель Xd·Yd·k сокращается с одним из множителей числителя целиком? */
  const M = Xd * Yd * k;
  const celikom = M > 1 && [Xn, Yn].find((x) => x % M === 0);
  const vNize = proizv([Xd, Yd, k]);
  return {
    uslovie: `Найдите значение выражения $\\left(\\left(\\dfrac{${a}}{${z}}\\right)^2-\\left(\\dfrac{${b}}{${z}}\\right)^2\\right):${k}$.`,
    otvet,
    razbor: [
      shag(
        'Возводить большие дроби в квадрат не нужно — раскладываем по формуле разности квадратов $x^2-y^2=(x-y)(x+y)$',
        `\\left(${dz(a)}\\right)^2-\\left(${dz(b)}\\right)^2 = ${skobki}`,
      ),
      shag(
        'Знаменатели одинаковые — вычитаем и складываем числители, дроби сокращаем',
        `${skobki} = ${dz(a - b)}\\cdot ${dz(a + b)}${g1 === 1 && g2 === 1 ? '' : ` = ${sokr}`}`,
      ),
      shag(
        celikom
          ? `Делим на $${k}$ и сокращаем, не перемножая: $${vNize} = ${M}$ сокращается с $${celikom}$ в числителе`
          : `Делим на $${k}$ и сокращаем дробь, не перемножая большие числа`,
        `${sokr} : ${k} = \\dfrac{${proizv([Xn, Yn])}}{${vNize}} = ${
          celikom && celikom !== M ? `${proizv([celikom / M, celikom === Xn ? Yn : Xn])} = ` : ''
        }${d(otvet)}`,
      ),
    ],
    params: { ...p },
    proverka: ((a / z) ** 2 - (b / z) ** 2) / k,
    signature: `ev8kv|${a}|${b}|${z}|${k}`,
  };
}

/* ── Формулы приведения ─────────────────────────────────────────── */

/**
 * 6·sin(19π/6)·sin(x + π/3)·sin(x − 3π/2) / (cos(x − π/6)·cos(x + 2π)):
 * sin(x − 3π/2) = cos x, cos(x + 2π) = cos x, cos(x − π/6) = sin(x + π/3)
 * — всё с x сокращается, остаётся 6·sin(19π/6) = −3.
 */
export interface TrigPrivedenieEV {
  k: number;
}

export function trigSokrashchenie(p: TrigPrivedenieEV): Draft {
  const { k } = p;
  const otvet = r9(k * -0.5);
  const f = (x: number) =>
    (k *
      Math.sin((19 * Math.PI) / 6) *
      Math.sin(x + Math.PI / 3) *
      Math.sin(x - (3 * Math.PI) / 2)) /
    (Math.cos(x - Math.PI / 6) * Math.cos(x + 2 * Math.PI));
  return {
    uslovie: `Найдите значение выражения $\\dfrac{${k}\\sin\\dfrac{19\\pi}{6}\\cdot\\sin\\left(x+\\dfrac{\\pi}{3}\\right)\\cdot\\sin\\left(x-\\dfrac{3\\pi}{2}\\right)}{\\cos\\left(x-\\dfrac{\\pi}{6}\\right)\\cdot\\cos(x+2\\pi)}$.`,
    otvet,
    razbor: [
      shag(
        'Прибавляем к углу полный оборот $2\\pi$ — синус не меняется. Остаётся сдвиг на $\\dfrac{\\pi}{2}$: $\\sin\\left(t+\\dfrac{\\pi}{2}\\right)=\\cos t$',
        '\\sin\\left(x-\\dfrac{3\\pi}{2}\\right)=\\sin\\left(x-\\dfrac{3\\pi}{2}+2\\pi\\right)=\\sin\\left(x+\\dfrac{\\pi}{2}\\right)=\\cos x',
      ),
      shag('Сдвиг на $2\\pi$ — полный оборот, косинус не меняется', '\\cos(x+2\\pi)=\\cos x'),
      shag(
        'Косинус переводим в синус той же формулой: $\\cos t=\\sin\\left(t+\\dfrac{\\pi}{2}\\right)$',
        '\\cos\\left(x-\\dfrac{\\pi}{6}\\right)=\\sin\\left(x-\\dfrac{\\pi}{6}+\\dfrac{\\pi}{2}\\right)=\\sin\\left(x+\\dfrac{\\pi}{3}\\right)',
      ),
      shag(
        'Подставляем: $\\sin\\left(x+\\dfrac{\\pi}{3}\\right)$ и $\\cos x$ стоят и в числителе, и в знаменателе — сокращаем их',
        `\\dfrac{${k}\\sin\\dfrac{19\\pi}{6}\\cdot\\sin\\left(x+\\dfrac{\\pi}{3}\\right)\\cdot\\cos x}{\\sin\\left(x+\\dfrac{\\pi}{3}\\right)\\cdot\\cos x}=${k}\\sin\\dfrac{19\\pi}{6}`,
      ),
      shag(
        'Отбрасываем полный оборот $2\\pi$, затем $\\sin(\\pi+\\alpha)=-\\sin\\alpha$, и остаётся табличное значение',
        `${k}\\sin\\dfrac{19\\pi}{6}=${k}\\sin\\left(2\\pi+\\dfrac{7\\pi}{6}\\right)=${k}\\sin\\left(\\pi+\\dfrac{\\pi}{6}\\right)=-${k}\\sin\\dfrac{\\pi}{6}=-${k}\\cdot\\dfrac12=${d(otvet)}`,
      ),
    ],
    params: { ...p },
    /* Второй счёт: выражение при нескольких x — значение одно и то же. */
    proverka: r9((f(0.3) + f(1.1) + f(2.7)) / 3),
    signature: `ev8trig|${k}`,
  };
}

/* ── Логарифмы: частное через переход к основанию ───────────────── */

/**
 * log_c(c²·2) / log_{c³·2} c − log_c(c⁴·2) / log_{c·2} c: каждое
 * частное — произведение логарифмов по основанию c, обозначим
 * t = log_c 2; квадраты t сокращаются.
 */
export interface LogChastnye {
  c: number;
}

export function logChastnye(p: LogChastnye): Draft {
  const { c } = p;
  /* (2 + t)(3 + t) − (4 + t)(1 + t) = 6 + 5t + t² − 4 − 5t − t² = 2. */
  const A1 = c ** 2 * 2;
  const B1 = c ** 3 * 2;
  const A2 = c ** 4 * 2;
  const B2 = c * 2;
  const L = (x: number) => Math.log(x) / Math.log(c);
  return {
    uslovie: `Найдите значение выражения $\\dfrac{\\log_{${c}}${A1}}{\\log_{${B1}}${c}}-\\dfrac{\\log_{${c}}${A2}}{\\log_{${B2}}${c}}$.`,
    otvet: 2,
    razbor: [
      shag(
        `Логарифмы в знаменателях «перевёрнуты»: $\\dfrac{1}{\\log_{b} ${c}}=\\log_{${c}} b$, поэтому деление заменяем умножением`,
        `\\dfrac{\\log_{${c}}${A1}}{\\log_{${B1}}${c}}-\\dfrac{\\log_{${c}}${A2}}{\\log_{${B2}}${c}}=\\log_{${c}}${A1}\\cdot\\log_{${c}}${B1}-\\log_{${c}}${A2}\\cdot\\log_{${c}}${B2}`,
      ),
      shag(
        `Каждое число — степень $${c}$, умноженная на $2$. Логарифм произведения — сумма логарифмов, обозначим $t=\\log_{${c}}2$`,
        `\\log_{${c}}${A1}=\\log_{${c}}\\left(${c}^{2}\\cdot 2\\right)=2+t,\\quad \\log_{${c}}${B1}=3+t,\\quad \\log_{${c}}${A2}=4+t,\\quad \\log_{${c}}${B2}=1+t`,
      ),
      shag(
        'Подставляем и раскрываем скобки: $t^2$ и $5t$ взаимно уничтожаются',
        '(2+t)(3+t)-(4+t)(1+t)=6+5t+t^2-\\left(4+5t+t^2\\right)=2',
      ),
    ],
    params: { ...p },
    proverka: L(A1) / (Math.log(c) / Math.log(B1)) - L(A2) / (Math.log(c) / Math.log(B2)),
    signature: `ev8log|${c}`,
  };
}

/* ── Отношение по пропорции ─────────────────────────────────────── */

export interface OtnosheniePoDrobi {
  /** (p·a + q·b)/(r·a + s·b) = v → a/b. */
  p: number;
  q: number;
  r: number;
  s: number;
  v: number;
}

export function otnosheniePoDrobi(x: OtnosheniePoDrobi): Draft {
  const { p, q, r, s, v } = x;
  if (q <= 0 || s <= 0) throw new Error('№8: свободные коэффициенты должны быть положительны');
  /* (p t + q) = v(r t + s) → t(p − v r) = v s − q. */
  const otvet = r9((v * s - q) / (p - v * r));
  const lin = (k: number, m: number, a: string, b: string) =>
    `${k === 1 ? '' : k}${a}${m < 0 ? '-' : '+'}${Math.abs(m) === 1 && b !== '' ? '' : Math.abs(m)}${b}`;
  /* Коэффициент при t: 1 — t, −1 — −t. */
  const kt = (k: number) => (k === 1 ? 't' : k === -1 ? '-t' : `${d(k)}t`);
  const vr = r9(v * r);
  const vs = r9(v * s);
  const A = r9(p - vr);
  const B = r9(vs - q);
  const pr = (k: number) => (k < 0 ? `(${d(k)})` : d(k));
  const tDrob =
    Number.isInteger(A) && Number.isInteger(B) ? frac(B, A) : `\\dfrac{${d(B)}}{${d(A)}}`;
  const reshenie = [`\\left(${p}-${pr(vr)}\\right)t=${d(vs)}-${q}`, `${kt(A)}=${d(B)}`];
  if (A !== 1) reshenie.push(`t=${tDrob}${tDrob === d(otvet) ? '' : `=${d(otvet)}`}`);
  return {
    uslovie: `Найдите $\\dfrac{a}{b}$, если $\\dfrac{${lin(p, q, 'a', 'b')}}{${lin(r, s, 'a', 'b')}}=${d(v)}$.`,
    otvet,
    razbor: [
      shag(
        'Делим числитель и знаменатель на $b$ — дробь от этого не меняется — и обозначаем $t=\\dfrac{a}{b}$',
        `\\dfrac{${lin(p, q, 'a', 'b')}}{${lin(r, s, 'a', 'b')}}=\\dfrac{${lin(p, q, 't', '')}}{${lin(r, s, 't', '')}}=${d(v)}`,
      ),
      shag(
        'По свойству пропорции умножаем обе части на знаменатель и раскрываем скобки',
        `${lin(p, q, 't', '')}=${d(v)}\\left(${lin(r, s, 't', '')}\\right)=${kt(vr)}${vs < 0 ? '-' : '+'}${d(Math.abs(vs))}`,
      ),
      shag(
        'Слагаемые с $t$ переносим влево, числа — вправо, и делим на коэффициент при $t$',
        reshenie.join(',\\quad '),
      ),
    ],
    params: { ...x },
    /* Второй счёт: подставим a = t, b = 1 в исходную дробь. */
    proverka: (() => {
      const val = (p * otvet + q) / (r * otvet + s);
      return Math.abs(val - v) < 1e-9 ? otvet : NaN;
    })(),
    signature: `ev8otn|${p}|${q}|${r}|${s}|${v}`,
  };
}
