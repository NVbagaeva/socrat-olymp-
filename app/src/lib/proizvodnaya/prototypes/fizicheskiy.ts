/**
 * Группа I. Физический смысл производной: скорость по закону движения.
 *
 *   9.1.1 — скорость в заданный момент t₀;
 *   9.1.2 — момент времени, когда скорость равна заданной.
 *
 * Закон движения строится «с конца»: сначала скорость v(t) — целый
 * многочлен, затем x(t) = ∫v. Поэтому x′ сокращается без остатка:
 * (p/3)·3t² = p·t², (q/2)·2t = q·t. Решение показывает и это сокращение.
 *
 * Решение: сначала производная, потом уравнение, ОДЗ t ≥ 0 и отбор
 * корня по смыслу.
 */

import type { Rng } from '../../veroyatnost/generator';
import { d } from '../tex';
import type { Draft } from '../types';
import { proto, shag, vopros } from './common';

/** Сюжеты: что движется и что такое x. Длина и время — всегда метры и секунды. */
const SYUZHETY: { kto: string; x: string }[] = [
  { kto: 'Дрон-курьер летит вдоль прямой улицы', x: 'расстояние от пункта вылета (в метрах)' },
  { kto: 'Электросамокат едет по прямой велодорожке', x: 'расстояние от точки старта (в метрах)' },
  { kto: 'Модель ракеты стартует вертикально вверх', x: 'высота над землёй (в метрах)' },
  { kto: 'Робот-доставщик едет по прямому коридору', x: 'расстояние от склада (в метрах)' },
  { kto: 'Беспилотный катер идёт по прямому каналу', x: 'расстояние от причала (в метрах)' },
  { kto: 'Радиоуправляемая машинка едет по прямой трассе', x: 'расстояние от линии старта (в метрах)' },
  { kto: 'Квадрокоптер для съёмки поднимается вдоль стены', x: 'высота над землёй (в метрах)' },
  { kto: 'Подводный дрон погружается вдоль троса', x: 'глубина погружения (в метрах)' },
  { kto: 'Игрушечный вездеход движется по прямой', x: 'расстояние от точки старта (в метрах)' },
  { kto: 'Роботизированная тележка едет по прямому конвейеру', x: 'расстояние от начала ленты (в метрах)' },
  { kto: 'Электрокар едет по прямой испытательной трассе', x: 'расстояние от точки старта (в метрах)' },
  { kto: 'Робот-пылесос движется вдоль прямой стены', x: 'расстояние от док-станции (в метрах)' },
];

/** Член вида (num/den)·t^pow со знаком; num может быть любого знака. */
function chlen(num: number, den: number, pow: number, first: boolean): string {
  if (num === 0) {
    return '';
  }
  const abs = Math.abs(num);
  const g = gcd(abs, den);
  const n = abs / g;
  const m = den / g;
  const sign = num < 0 ? '-' : first ? '' : '+';
  const tp = pow === 0 ? '' : pow === 1 ? 't' : `t^{${pow}}`;
  let k: string;
  if (m === 1) {
    k = n === 1 && pow !== 0 ? '' : String(n);
  } else {
    k = `\\frac{${n}}{${m}}`;
  }
  return `${sign}${k}${tp}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Многочлен по списку (числитель, знаменатель, степень), старшие вперёд. */
function mnogochlen(terms: [number, number, number][]): string {
  let out = '';
  for (const [n, m, pow] of terms) {
    out += chlen(n, m, pow, out === '');
  }
  return out === '' ? '0' : out;
}

interface Zakon {
  p: number; // x'(t) = p t² + q t + s
  q: number;
  s: number;
  c: number; // x(0)
}

/** x(t) в TeX. */
function xTex(z: Zakon): string {
  return mnogochlen([
    [z.p, 3, 3],
    [z.q, 2, 2],
    [z.s, 1, 1],
    [z.c, 1, 0],
  ]);
}

/** v(t) = x′(t) в TeX. */
function vTex(z: Zakon): string {
  return mnogochlen([
    [z.p, 1, 2],
    [z.q, 1, 1],
    [z.s, 1, 0],
  ]);
}

function vAt(z: Zakon, t: number): number {
  return z.p * t * t + z.q * t + z.s;
}

function xAt(z: Zakon, t: number): number {
  return (z.p * t * t * t) / 3 + (z.q * t * t) / 2 + z.s * t + z.c;
}

/** Строка «(член)′ = … = результат» с показом сокращения коэффициента и показателя. */
function stroka(num: number, den: number, pow: number): string {
  const term = chlen(num, den, pow, true);
  const res = chlen(num * pow, den, pow - 1, true);
  const coef = chlen(num, den, 0, true);
  const trivial = coef === '1' || coef === '-1';
  if (pow === 1) {
    return `\\left(${term}\\right)' = ${d(num / den)}`;
  }
  return trivial
    ? `\\left(${term}\\right)' = ${res}`
    : `\\left(${term}\\right)' = ${coef}\\cdot ${pow}t${pow === 2 ? '' : '^{' + (pow - 1) + '}'} = ${res}`;
}

/** Шаг «Находим производную» с показом сокращения. */
function shagProizvodnaya(z: Zakon) {
  const rows: string[] = [];
  if (z.p !== 0) {
    rows.push(stroka(z.p, 3, 3));
  }
  if (z.q !== 0) {
    rows.push(stroka(z.q, 2, 2));
  }
  if (z.s !== 0) {
    rows.push(stroka(z.s, 1, 1));
  }
  if (z.c !== 0) {
    rows.push(`(${d(z.c)})' = 0`);
  }
  return shag(
    "Находим скорость $v(t)=x'(t)$",
    "Скорость — производная закона движения: $v(t)=x'(t)$. Берём производную по слагаемым; коэффициент и показатель степени сокращаются.",
    ...rows.map((row) => `$${row}$`),
    `$v(t)=${vTex(z)}$`,
  );
}

/** Случайный закон: кубический или квадратичный. */
function zakon(r: Rng, kubicheskiy: boolean): Zakon | null {
  const p = kubicheskiy ? r.pick([1, 1, 2, -1]) : 0;
  const q = r.pick([-8, -6, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
  const s = r.int(-9, 9);
  const c = r.pick([0, 0, r.int(-12, 12)]);
  if (!kubicheskiy && q === 0) {
    return null;
  }
  return { p, q, s, c };
}

function sujet(r: Rng) {
  return r.pick(SYUZHETY);
}

/** Условие общей частью: сюжет и закон. */
function zakonTekst(su: { kto: string; x: string }, z: Zakon): string {
  return `${su.kto} по закону $x(t)=${xTex(z)}$, где $x$ — ${su.x}, $t$ — время движения (в секундах).`;
}

/* ── 9.1.1 ───────────────────────────────────────────────────────── */

const P111 = proto({
  id: '9.1.1',
  gruppa: 'I',
  nazvanie: 'Скорость в заданный момент по закону движения',
  kratko: 'Скорость в момент $t_0$',
  risunok: false,
  generate(r: Rng): Draft | null {
    const kub = r.next() < 0.55;
    const z = zakon(r, kub);
    if (z === null) {
      return null;
    }
    const t0 = r.int(1, 10);
    const v = vAt(z, t0);
    if (v <= 0 || v > 150) {
      return null;
    }
    const su = sujet(r);
    const vt = vTex(z);
    const uslovie = `${zakonTekst(su, z)} Найдите скорость движения (в м/с) в момент времени $t=${t0}$ с.`;
    const lines = [`$v(${t0})=${podstavit(z, t0)}=${v}$`];
    return {
      uslovie,
      risunok: null,
      zapros: null,
      otvet: v,
      proverka: z.p * t0 ** 2 + z.q * t0 + z.s,
      shagi: [
        shagProizvodnaya(z),
        shag(`Подставляем $t=${t0}$`, ...lines),
        shag('Ответ', `Скорость в момент $t=${t0}$ с равна $${v}$ м/с.`, `**Ответ: ${v}**`),
      ],
      podskazka: [
        vopros(
          r,
          'Как связаны скорость и закон движения $x(t)$?',
          '$v(t)=x\'(t)$',
          [
            { tekst: '$v(t)=x(t)$', pochemu: 'Это само расстояние, а не скорость.' },
            { tekst: '$v(t)=\\dfrac{x(t)}{t}$', pochemu: 'Так считают среднюю скорость, а нужна скорость в момент.' },
            { tekst: '$v(t)=x\'\'(t)$', pochemu: 'Вторая производная — ускорение.' },
          ],
          'Скорость в момент времени — это производная закона движения.',
        ),
        vopros(
          r,
          'Чему равна производная $x\'(t)$?',
          `$${vt}$`,
          wrongV(z).map((w) => ({ tekst: `$${w.tex}$`, pochemu: w.why })),
          `$v(t)=${vt}$`,
        ),
        vopros(
          r,
          `Чему равна скорость при $t=${t0}$?`,
          `$${v}$`,
          [
            { tekst: `$${fmtNum(xAt(z, t0))}$`, pochemu: 'Это расстояние $x(t_0)$: подставили $t_0$ в закон движения, а не в производную.' },
            { tekst: `$${v - z.s}$`, pochemu: 'Потеряно слагаемое без $t$ в производной.' },
            { tekst: `$${v + 2 * Math.abs(z.q)}$`, pochemu: 'Вычислительная ошибка при подстановке: пересчитайте.' },
          ].filter((o) => o.tekst !== `$${v}$`),
        ),
      ],
      params: { p: z.p, q: z.q, s: z.s, c: z.c, t0 },
      signature: `${z.p}|${z.q}|${z.s}|${z.c}|${t0}`,
      vid: kub ? 'kub' : 'kvad',
    };
  },
});

function fmtNum(x: number): string {
  return d(Math.round(x * 100) / 100);
}

/** Подстановка в v(t) с расстановкой скобок у отрицательных. */
function podstavit(z: Zakon, t: number): string {
  const tt = t < 0 ? `(${t})` : `${t}`;
  const parts: string[] = [];
  if (z.p !== 0) {
    parts.push(`${z.p === 1 ? '' : z.p === -1 ? '-' : z.p + '\\cdot '}${tt}^{2}`);
  }
  if (z.q !== 0) {
    const sign = parts.length === 0 ? (z.q < 0 ? '-' : '') : z.q < 0 ? '-' : '+';
    const k = Math.abs(z.q) === 1 ? '' : `${Math.abs(z.q)}\\cdot `;
    parts.push(`${sign}${k}${tt}`);
  }
  if (z.s !== 0) {
    const sign = parts.length === 0 ? (z.s < 0 ? '-' : '') : z.s < 0 ? '-' : '+';
    parts.push(`${sign}${Math.abs(z.s)}`);
  }
  return parts.join('');
}

/** Типичные неверные производные: для вопроса подсказки. */
function wrongV(z: Zakon): { tex: string; why: string }[] {
  const out: { tex: string; why: string }[] = [];
  if (z.p !== 0) {
    out.push({
      tex: mnogochlen([
        [z.p, 3, 2],
        [z.q, 1, 1],
        [z.s, 1, 0],
      ]),
      why: 'Показатель степени не умножен на коэффициент: $(\\frac{p}{3}t^3)\'=p\\,t^2$, а не $\\frac{p}{3}t^2$.',
    });
  }
  out.push({
    tex: mnogochlen([
      [z.p, 1, 2],
      [z.q, 2, 1],
      [z.s, 1, 0],
    ]),
    why: 'Член с $t^2$ при дифференцировании удваивается: $(\\frac{q}{2}t^2)\'=q\\,t$.',
  });
  if (z.c !== 0) {
    out.push({
      tex: `${vTex(z)}${z.c < 0 ? '-' : '+'}${Math.abs(z.c)}`,
      why: 'Производная постоянного слагаемого равна нулю, оно не остаётся в ответе.',
    });
  }
  return out;
}

/* ── 9.1.2 ───────────────────────────────────────────────────────── */

const P112 = proto({
  id: '9.1.2',
  gruppa: 'I',
  nazvanie: 'Момент времени, когда скорость равна заданной',
  kratko: 'Момент, когда $v=v_0$',
  risunok: false,
  generate(r: Rng): Draft | null {
    const p = r.pick([1, 1, 1, 2]);
    const dvoynoy = r.next() < 0.18;
    const r1 = r.int(1, 12);
    const r2 = dvoynoy ? r1 : -r.int(1, 9);
    const q = -p * (r1 + r2);
    const sNul = p * r1 * r2; // свободный член уравнения v(t)=v0
    const v0 = r.int(4, 60);
    const s = sNul + v0;
    const c = r.pick([0, 0, r.int(-10, 10)]);
    /* Нечётное q даёт в законе движения дробь со знаменателем 2 — это нормально. */
    const z: Zakon = { p, q, s, c };
    const su = sujet(r);
    const uravnenie = vTex({ ...z, s: s - v0 }); // p t² + q t + s − v0
    const lhs = `${vTex(z)}`;
    const uslovie = `${zakonTekst(su, z)} В какой момент времени (в секундах) скорость движения будет равна $${v0}$ м/с?`;
    const sumR = r1 + r2;
    const prodR = r1 * r2;
    const shagi = [
      shagProizvodnaya(z),
      shag(
        'Составляем уравнение',
        `Скорость должна быть равна $${v0}$ м/с: $v(t)=${v0}$.`,
        `$${lhs}=${v0}$`,
        p === 1
          ? `$${uravnenie}=0$`
          : `$${uravnenie}=0$ — делим обе части на $${p}$: $t^{2}${slag(q / p)}${slag2(sNul / p)}=0$.`,
      ),
      shag(
        'Решаем квадратное уравнение',
        `По теореме Виета: $t_1+t_2=${sumR}$, $t_1\\cdot t_2=${prodR}$.`,
        dvoynoy
          ? `Корни совпадают: $t=${r1}$ (дискриминант равен $0$).`
          : `Подходят числа $${r1}$ и $${r2}$: $${r1}+(${r2})=${sumR}$, $${r1}\\cdot(${r2})=${prodR}$.`,
      ),
      shag(
        'ОДЗ и отбор корня по смыслу',
        'Время движения не может быть отрицательным: $t\\geqslant 0$.',
        dvoynoy ? `Корень $t=${r1}$ подходит.` : `Корень $t=${r2}$ не подходит, остаётся $t=${r1}$.`,
      ),
      shag('Ответ', `Скорость равна $${v0}$ м/с в момент $t=${r1}$ с.`, `**Ответ: ${r1}**`),
    ];
    return {
      uslovie,
      risunok: null,
      zapros: null,
      otvet: r1,
      proverka: nayti(z, v0),
      shagi,
      podskazka: [
        vopros(
          r,
          'Что нужно сначала сделать с законом движения $x(t)$?',
          'Найти производную: $v(t)=x\'(t)$',
          [
            { tekst: `Приравнять $x(t)=${v0}$`, pochemu: `Число $${v0}$ — это скорость, а не расстояние.` },
            { tekst: 'Подставить $v_0$ вместо $t$', pochemu: 'Неизвестно время $t$, подставлять нечего.' },
            { tekst: 'Найти вторую производную', pochemu: 'Вторая производная — ускорение, оно в задаче не нужно.' },
          ],
          'Сначала производная: скорость — это $x\'(t)$.',
        ),
        vopros(
          r,
          'Какое уравнение нужно решить?',
          `$${lhs}=${v0}$`,
          [
            { tekst: `$${xTex(z)}=${v0}$`, pochemu: 'Здесь стоит $x(t)$, а скорость равна производной.' },
            { tekst: `$${lhs}=0$`, pochemu: `Скорость равна $${v0}$, а не нулю.` },
            { tekst: `$${vTex({ ...z, s: s + v0 })}=0$`, pochemu: 'Знак при $v_0$ потерян: $v_0$ переносим влево со знаком минус.' },
          ],
          'Скорость равна $v_0$: $x\'(t)=v_0$.',
        ),
        vopros(
          r,
          dvoynoy ? 'Сколько корней у уравнения и какой подходит?' : 'Какой корень подходит по смыслу задачи?',
          `$t=${r1}$`,
          dvoynoy
            ? [
                { tekst: `$t=${-r1}$`, pochemu: 'Время не может быть отрицательным.' },
                { tekst: `$t=${r1}$ и $t=${-r1}$`, pochemu: 'Дискриминант равен нулю, корень один.' },
              ]
            : [
                { tekst: `$t=${r2}$`, pochemu: 'Время не может быть отрицательным: $t\\geqslant 0$.' },
                { tekst: `$t=${r1}$ и $t=${r2}$ вместе`, pochemu: 'Ответом служит одно число — корень, подходящий по смыслу.' },
              ],
          'Время $t\\geqslant 0$, поэтому отрицательный корень отбрасываем.',
        ),
      ],
      params: { p, q, s, c, v0 },
      signature: `${p}|${q}|${s}|${c}|${v0}`,
      vid: dvoynoy ? 'dvoynoy' : 'raznye',
    };
  },
});

/** Решение уравнения v(t)=v0 перебором неотрицательных t: независимый счёт. */
function nayti(z: Zakon, v0: number): number {
  for (let t = 0; t <= 60; t += 1) {
    if (vAt(z, t) === v0) {
      return t;
    }
  }
  return Number.NaN;
}

function slag(x: number): string {
  return x === 0 ? '' : `${x < 0 ? '-' : '+'}${Math.abs(x) === 1 ? '' : Math.abs(x)}t`;
}

function slag2(x: number): string {
  return x === 0 ? '' : `${x < 0 ? '-' : '+'}${Math.abs(x)}`;
}


export const FIZICHESKIY = [P111, P112];
