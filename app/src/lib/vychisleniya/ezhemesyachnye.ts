/**
 * Задание №8 для раздела «Ежемесячные варианты»: свои выражения на
 * числах варианта. Разбор — строками с формулами (как черновики
 * прототипов раздела, `Draft`), второй счёт — численно функциями Math.
 * В банк и генератор №8 не входят.
 */

import { d } from './tex';
import type { Draft } from './types';

const r9 = (x: number) => Math.round(x * 1e9) / 1e9;

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
  return {
    uslovie: `Найдите значение выражения $\\left(\\left(\\dfrac{${a}}{${z}}\\right)^2-\\left(\\dfrac{${b}}{${z}}\\right)^2\\right):${k}$.`,
    otvet,
    razbor: [
      `Возводить большие дроби в квадрат не нужно: по формуле разности квадратов $x^2-y^2=(x-y)(x+y)$.`,
      `$\\dfrac{${a}}{${z}}-\\dfrac{${b}}{${z}}=\\dfrac{${a - b}}{${z}}=${d(raz)}$, $\\dfrac{${a}}{${z}}+\\dfrac{${b}}{${z}}=\\dfrac{${a + b}}{${z}}=${d(sum)}$.`,
      `$${d(raz)}\\cdot${d(sum)}=${d(r9(raz * sum))}$, и $${d(r9(raz * sum))}:${k}=${d(otvet)}$.`,
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
      'По формулам приведения: $\\sin\\left(x-\\dfrac{3\\pi}{2}\\right)=\\cos x$ (сдвиг на $-\\dfrac{3\\pi}{2}$ меняет синус на косинус, знак — по четверти), $\\cos(x+2\\pi)=\\cos x$ (полный оборот).',
      '$\\cos\\left(x-\\dfrac{\\pi}{6}\\right)=\\sin\\left(\\dfrac{\\pi}{2}+x-\\dfrac{\\pi}{6}\\right)=\\sin\\left(x+\\dfrac{\\pi}{3}\\right)$, так как $\\cos t=\\sin\\left(\\dfrac{\\pi}{2}+t\\right)$.',
      `После сокращения остаётся $${k}\\sin\\dfrac{19\\pi}{6}=${k}\\sin\\left(2\\pi+\\dfrac{7\\pi}{6}\\right)=${k}\\sin\\dfrac{7\\pi}{6}=${k}\\cdot\\left(-\\dfrac12\\right)=${d(otvet)}$.`,
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
      `Деление на $\\log_b ${c}$ — это умножение на $\\log_{${c}} b$: $\\dfrac{1}{\\log_b ${c}}=\\log_{${c}} b$.`,
      `Выражение равно $\\log_{${c}}${A1}\\cdot\\log_{${c}}${B1}-\\log_{${c}}${A2}\\cdot\\log_{${c}}${B2}$. Обозначим $t=\\log_{${c}}2$: $\\log_{${c}}${A1}=2+t$, $\\log_{${c}}${B1}=3+t$, $\\log_{${c}}${A2}=4+t$, $\\log_{${c}}${B2}=1+t$.`,
      '$(2+t)(3+t)-(4+t)(1+t)=6+5t+t^2-4-5t-t^2=2$.',
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
  const t = (k: number) => (k === 1 ? 't' : `${k}t`);
  return {
    uslovie: `Найдите $\\dfrac{a}{b}$, если $\\dfrac{${lin(p, q, 'a', 'b')}}{${lin(r, s, 'a', 'b')}}=${d(v)}$.`,
    otvet,
    razbor: [
      `Разделим числитель и знаменатель на $b$ и обозначим $t=\\dfrac{a}{b}$: $\\dfrac{${lin(p, q, 't', '')}}{${lin(r, s, 't', '')}}=${d(v)}$.`,
      `По свойству пропорции: $${t(p)}+${q}=${d(v)}(${t(r)}+${s})$, $${t(p)}+${q}=${v * r === 1 ? '' : d(v * r)}t${v * s < 0 ? '' : '+'}${d(v * s)}$.`,
      `$${d(p - v * r)}t=${d(v * s - q)}$, $t=\\dfrac{${d(v * s - q)}}{${d(p - v * r)}}=${d(otvet)}$.`,
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
