/**
 * Чертежи задач тренажёра №18 — неподвижные сцены движка lib/skhemy,
 * построенные по числам условия (параметры варианта). Ответов здесь
 * нет: модуль уходит в браузер, а ответ — только отпечатком
 * (lib/zadanie18/secret.ts). Тексты и ответы — content/zadanie18/trenazher.ts.
 *
 * tochki*(p) отдают координаты: по ним scripts/verify_schemes/trenazher.mjs
 * пересчитывает данные условия и ответ.
 */

import { mnog, nepodvizhnaya, okr, otr, tch, ug, vel, velOtr, velUg } from '@/lib/skhemy/dsl';
import {
  RAD,
  circumcircle,
  dist,
  foot,
  incircle,
  intersect,
  lerp,
  mid,
  polar,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';
import * as N from '@/lib/zadanie18/opornye/novye';
import { SCENY_DOP } from './dop';

export type Parametry = Readonly<Record<string, number>>;

/** Треугольник по стороне AB = c и углам при A и B (градусы): A в начале, B на оси x. */
function poUglam(c: number, uA: number, uB: number): { A: T2; B: T2; C: T2 } {
  const uC = 180 - uA - uB;
  const b = (c * Math.sin(uB * RAD)) / Math.sin(uC * RAD);
  return { A: [0, 0], B: [c, 0], C: [b * Math.cos(uA * RAD), b * Math.sin(uA * RAD)] };
}

/** Треугольник по трём сторонам: B в начале, C на оси x, A сверху. */
function poStoronam(a: number, b: number, c: number): { A: T2; B: T2; C: T2 } {
  const x = (c * c - b * b + a * a) / (2 * a);
  return { A: [x, Math.sqrt(Math.max(0, c * c - x * x))], B: [0, 0], C: [a, 0] };
}

const tochki3 = (t: Tochki, imena: readonly string[]): Element[] =>
  imena.map((i) => tch(i, t[i.replace('_', '')]!));

/* ── 1. Высоты: A₁B₁C ∼ ABC ───────────────────────────────────── */

export function tochkiVysotyCos(p: Parametry) {
  const uC = Math.acos(p.cosC!) / RAD;
  const uA = (180 - uC) / 2 + 10;
  const { A, B, C } = poUglam(p.AB!, uA, 180 - uC - uA);
  const A1 = foot(A, B, C);
  const B1 = foot(B, A, C);
  return { A, B, C, A1, B1, H: intersect(A, A1, B, B1) ?? A1 };
}

/* ── 2. Биссектриса и параллельная: AM = ML ───────────────────── */

export function tochkiBisPar(p: Parametry) {
  const c = p.AB!;
  const b = p.AC!;
  const A: T2 = [0, 0];
  const B: T2 = [c, 0];
  const C: T2 = [b * Math.cos(70 * RAD), b * Math.sin(70 * RAD)];
  const L = lerp(B, C, c / (b + c));
  const M = lerp(C, A, dist(C, L) / dist(C, B));
  return { A, B, C, L, M };
}

/* ── 3. Удвоение медианы ──────────────────────────────────────── */

export function tochkiMediana(p: Parametry) {
  const { A, B, C } = poStoronam(p.BC!, p.AC!, p.AB!);
  const M = mid(B, C);
  return { A, B, C, M, D: [2 * M[0] - A[0], 2 * M[1] - A[1]] as T2 };
}

/* ── 4. Две высоты и окружность на BC ─────────────────────────── */

export function tochkiVysotyOkr(p: Parametry) {
  const uB = p.uB!;
  const uC = p.uC!;
  /* B в начале, C на оси x: строим с BC = 8. */
  const { A: B, B: C, C: A } = poUglam(8, uB, uC);
  return { A, B, C, B1: foot(B, A, C), C1: foot(C, A, B) };
}

/* ── 5. Трезубец: W — центр окружности AIC ───────────────────── */

export function tochkiTrezubecCentr(p: Parametry) {
  const AC = p.k! * Math.SQRT2;
  /* Прямой угол при B: A и C — концы диаметра описанной окружности. */
  const O: T2 = [0, 0];
  const R = AC / 2;
  const A: T2 = [-R, 0];
  const C: T2 = [R, 0];
  /* ∠A = половина центрального угла BOC. */
  const B = polar(2 * p.uA!, R);
  const I = incircle(A, B, C).c;
  /* W — середина дуги AC, не содержащей B. */
  const W: T2 = [0, B[1] > 0 ? -R : R];
  return { O, R, A, B, C, I, W };
}

/* ── 6. Вписанный четырёхугольник: APB ∼ DPC ─────────────────── */

export function tochkiVpisHordy(p: Parametry) {
  const { AB, AP, DP, BP } = p as Record<string, number>;
  const PC = (BP! * DP!) / AP!;
  const cosT = (AP! * AP! + BP! * BP! - AB! * AB!) / (2 * AP! * BP!);
  const t = Math.acos(cosT);
  const P: T2 = [0, 0];
  const u: T2 = [1, 0];
  const v: T2 = [Math.cos(t), Math.sin(t)];
  const A: T2 = [AP! * u[0], AP! * u[1]];
  const C: T2 = [-PC * u[0], -PC * u[1]];
  const B: T2 = [BP! * v[0], BP! * v[1]];
  const D: T2 = [-DP! * v[0], -DP! * v[1]];
  const k = circumcircle(A, B, C);
  return { P, A, B, C, D, O: k.c, R: k.r };
}

/* ── 7. Вписанная окружность прямоугольного треугольника ─────── */

export function tochkiVpisPryam(p: Parametry) {
  const a = p.AK!;
  const b = p.BK!;
  const r = (-(a + b) + Math.sqrt((a + b) ** 2 + 4 * a * b)) / 2;
  const C: T2 = [0, 0];
  const A: T2 = [0, a + r];
  const B: T2 = [b + r, 0];
  const I: T2 = [r, r];
  const K = foot(I, A, B);
  return { A, B, C, I, r, K, P: [0, r] as T2, Q: [r, 0] as T2 };
}

/* ── 8. Пересекающиеся хорды ──────────────────────────────────── */

export function tochkiHordy(p: Parametry) {
  const PD = (p.AP! * p.PB!) / p.CP!;
  const t = 65 * RAD;
  const P: T2 = [0, 0];
  const A: T2 = [-p.AP!, 0];
  const B: T2 = [p.PB!, 0];
  const C: T2 = [-p.CP! * Math.cos(t), -p.CP! * Math.sin(t)];
  const D: T2 = [PD * Math.cos(t), PD * Math.sin(t)];
  const k = circumcircle(A, B, C);
  return { P, A, B, C, D, O: k.c, R: k.r };
}

/* ── 9. Отрезок между серединами диагоналей трапеции ─────────── */

export function tochkiSredlinTrap(p: Parametry) {
  const A: T2 = [0, 0];
  const D: T2 = [p.AD!, 0];
  const B: T2 = [p.AD! * 0.22, 4];
  const C: T2 = [B[0] + p.BC!, 4];
  return { A, B, C, D, M: mid(A, C), N: mid(B, D), K: mid(C, D) };
}

/* ── 10. Равнобедренная трапеция с перпендикулярными диагоналями ─ */

export function tochkiRavnobokPerp(p: Parametry) {
  const h = p.h!;
  const a = h * 1.4;
  const b = h * 0.6;
  const A: T2 = [-a / 2, 0];
  const D: T2 = [a / 2, 0];
  const B: T2 = [-b / 2, h];
  const C: T2 = [b / 2, h];
  const O = intersect(A, C, B, D) ?? mid(A, C);
  return { A, B, C, D, O, E: [0, h] as T2, F: [0, 0] as T2 };
}

/* ── 11. Менелай в треугольнике ABL ──────────────────────────── */

export function tochkiMenelayPl() {
  const A: T2 = [0, 0];
  const B: T2 = [2, 6];
  const C: T2 = [9, 0];
  const K = lerp(A, B, 1 / 3);
  const L = lerp(B, C, 3 / 4);
  return { A, B, C, K, L, P: intersect(A, L, C, K) ?? L };
}

/* ── 12. Середина боковой стороны трапеции ────────────────────── */

export function tochkiTrapSeredina() {
  const A: T2 = [0, 0];
  const D: T2 = [9, 0];
  const B: T2 = [2, 4];
  const C: T2 = [6, 4];
  return { A, B, C, D, E: mid(C, D) };
}

/* ── 13. Общий угол ───────────────────────────────────────────── */

export function tochkiObshchiyUgol(p: Parametry) {
  const A: T2 = [0, 0];
  const B: T2 = [3, 6];
  const C: T2 = [10, 0];
  return {
    A,
    B,
    C,
    M: lerp(A, B, p.m! / (p.m! + p.n!)),
    N: lerp(A, C, p.p! / (p.p! + p.q!)),
  };
}

/* ── Данные на чертеже ────────────────────────────────────────── */

/** Число как на чертеже: десятичная запятая. */
const chislo = (x: number) => String(Math.round(x * 1e6) / 1e6).replace('.', ',');
/** Часть отношения: 1 → «x», 3 → «3x». */
const chast = (n: number, bukva: string) => (n === 1 ? bukva : `${n}${bukva}`);
/** Корень: точный квадрат — числом. */
function koren(x: number): string {
  const r = Math.round(Math.sqrt(x));
  return r * r === x ? String(r) : `√${x}`;
}

/* ── Сцены ────────────────────────────────────────────────────── */

/* На чертеже — все данные условия (длины у отрезков, градусы у углов,
   отношения частями x, площади подписью у фигуры). Ответа на чертеже
   нет: он уходит в браузер только отпечатком. */

type Postroenie = (p: Parametry) => ZhivayaSkhema;

const SCENY: Readonly<Record<string, Postroenie>> = {
  'vysoty-cos': (p) => {
    const t0 = tochkiVysotyCos(p);
    return nepodvizhnaya('tr-vysoty-cos', t0, (t) => [
      mnog('t-fig', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'figure' }),
      mnog('f-abc', [t.A!, t.B!, t.C!], { gruppy: ['podobie'], cvet: 'a' }),
      mnog('f-a1b1c', [t.A1!, t.B1!, t.C!], { gruppy: ['podobie', 'koef'], cvet: 'b' }),
      otr('AB', t.A!, t.B!, { gruppy: ['otvet'], cvet: 'a', rol: 'figure' }),
      otr('BC', t.B!, t.C!, { rol: 'figure' }),
      otr('CA', t.C!, t.A!, { rol: 'figure' }),
      otr('AA1', t.A!, t.A1!, { gruppy: ['h', 'koef'], cvet: 'a', rol: 'aux' }),
      otr('BB1', t.B!, t.B1!, { gruppy: ['h', 'koef'], cvet: 'a', rol: 'aux' }),
      otr('A1B1', t.A1!, t.B1!, { gruppy: ['podobie', 'otvet'], cvet: 'b', rol: 'aux' }),
      ug('pA1', t.A!, t.A1!, t.C!, { pryamoy: true, gruppy: ['h'], cvet: 'a' }),
      ug('pB1', t.C!, t.B1!, t.B!, { pryamoy: true, gruppy: ['h'], cvet: 'a' }),
      ug('uC', t.A!, t.C!, t.B!, { gruppy: ['koef', 'podobie'], cvet: 'b', rol: 'angle' }),
      velOtr('d-AB', chislo(p.AB!), t.A!, t.B!),
      velUg('d-cos', `cos C = ${chislo(p.cosC!)}`, t.A!, t.C!, t.B!, {
        gruppy: ['koef'],
        cvet: 'b',
      }),
      ...tochki3(t, ['A', 'B', 'C', 'A_1', 'B_1', 'H']),
    ]);
  },
  'bis-par': (p) => {
    const t0 = tochkiBisPar(p);
    return nepodvizhnaya('tr-bis-par', t0, (t) => [
      mnog('t-fig', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'figure' }),
      mnog('f-cml', [t.C!, t.M!, t.L!], { gruppy: ['podobie'], cvet: 'b' }),
      mnog('f-cab', [t.C!, t.A!, t.B!], { gruppy: ['podobie'], cvet: 'a' }),
      otr('AB', t.A!, t.B!, { gruppy: ['par', 'podobie'], cvet: 'a', rol: 'figure' }),
      otr('BC', t.B!, t.C!, { rol: 'figure' }),
      /* Сторона AC разбита в M: участок AM равен ML и оформлен как ML. */
      otr('CM', t.C!, t.M!, { rol: 'figure' }),
      otr('AL', t.A!, t.L!, { gruppy: ['bis', 'ravnobed'], cvet: 'a', rol: 'aux' }),
      otr('LM', t.L!, t.M!, {
        gruppy: ['par', 'ravnobed', 'otvet'],
        cvet: 'b',
        shtrihi: 1,
        rol: 'figure',
      }),
      otr('AM', t.A!, t.M!, { gruppy: ['ravnobed'], cvet: 'b', shtrihi: 1, rol: 'figure' }),
      ug('u1', t.B!, t.A!, t.L!, { gruppy: ['bis', 'ravnobed'], cvet: 'a' }),
      ug('u2', t.L!, t.A!, t.C!, { gruppy: ['bis', 'ravnobed'], cvet: 'a' }),
      ug('u3', t.A!, t.L!, t.M!, { gruppy: ['par', 'ravnobed'], cvet: 'a' }),
      velOtr('d-AB', chislo(p.AB!), t.A!, t.B!),
      velOtr('d-AC', chislo(p.AC!), t.A!, t.C!),
      ...tochki3(t, ['A', 'B', 'C', 'L', 'M']),
    ]);
  },
  mediana: (p) => {
    const t0 = tochkiMediana(p);
    return nepodvizhnaya('tr-mediana', t0, (t) => [
      mnog('t-fig', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'figure' }),
      mnog('f-abdc', [t.A!, t.B!, t.D!, t.C!], { gruppy: ['par'], cvet: 'a' }),
      otr('AB', t.A!, t.B!, { rol: 'figure' }),
      otr('BM', t.B!, t.M!, { gruppy: ['diag', 'otvet'], cvet: 'b', shtrihi: 2, rol: 'figure' }),
      otr('MC', t.M!, t.C!, { gruppy: ['diag', 'otvet'], cvet: 'b', shtrihi: 2, rol: 'figure' }),
      otr('CA', t.C!, t.A!, { rol: 'figure' }),
      otr('AM', t.A!, t.M!, { gruppy: ['diag'], cvet: 'b', shtrihi: 1, rol: 'aux' }),
      /* MD = AM: тот же цвет и засечки, пунктир — продолжение медианы. */
      otr('MD', t.M!, t.D!, {
        stil: 'punktir',
        gruppy: ['diag', 'par'],
        cvet: 'b',
        shtrihi: 1,
        rol: 'aux',
      }),
      otr('BD', t.B!, t.D!, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['par'],
        cvet: 'a',
        rol: 'construction',
      }),
      otr('CD', t.C!, t.D!, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['par'],
        cvet: 'a',
        rol: 'construction',
      }),
      velOtr('d-AB', chislo(p.AB!), t.A!, t.B!),
      velOtr('d-AC', chislo(p.AC!), t.A!, t.C!),
      velOtr('d-AM', koren((2 * p.AB! ** 2 + 2 * p.AC! ** 2 - p.BC! ** 2) / 4), t.A!, t.M!),
      ...tochki3(t, ['A', 'B', 'C', 'M', 'D']),
    ]);
  },
  'vysoty-okr': (p) => {
    const t0 = tochkiVysotyOkr(p);
    const k = { c: mid(t0.B, t0.C), r: dist(t0.B, t0.C) / 2 };
    return nepodvizhnaya('tr-vysoty-okr', t0, (t) => [
      mnog('t-fig', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'figure' }),
      okr('okr', k.c, k.r, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr', 'ugly'],
        cvet: 'c',
        rol: 'construction',
      }),
      otr('AB', t.A!, t.B!, { rol: 'figure' }),
      otr('BC', t.B!, t.C!, { gruppy: ['okr'], cvet: 'c', rol: 'figure' }),
      otr('CA', t.C!, t.A!, { rol: 'figure' }),
      otr('BB1', t.B!, t.B1!, { gruppy: ['pryamye'], cvet: 'a', rol: 'aux' }),
      otr('CC1', t.C!, t.C1!, { gruppy: ['pryamye'], cvet: 'a', rol: 'aux' }),
      otr('B1C1', t.B1!, t.C1!, { gruppy: ['ugly', 'otvet'], cvet: 'b', rol: 'aux' }),
      ug('pB1', t.B!, t.B1!, t.C!, { pryamoy: true, gruppy: ['pryamye', 'okr'], cvet: 'a' }),
      ug('pC1', t.C!, t.C1!, t.B!, { pryamoy: true, gruppy: ['pryamye', 'okr'], cvet: 'a' }),
      ug('uB', t.A!, t.B!, t.C!, { rol: 'angle' }),
      velUg('d-uB', `${p.uB}°`, t.A!, t.B!, t.C!),
      ug('u1', t.C1!, t.B1!, t.B!, { gruppy: ['ugly', 'otvet'], cvet: 'b' }),
      ug('u2', t.C1!, t.C!, t.B!, { gruppy: ['ugly'], cvet: 'b' }),
      ...tochki3(t, ['A', 'B', 'C', 'B_1', 'C_1']),
    ]);
  },
  'trezubec-centr': (p) => {
    const { R, ...t0 } = tochkiTrezubecCentr(p);
    return nepodvizhnaya('tr-trezubec-centr', t0, (t) => [
      okr('opis', t.O!, R, { rol: 'figure' }),
      mnog('t-fig', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'figure' }),
      okr('aic', t.W!, dist(t.W!, t.A!), {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr2'],
        cvet: 'c',
        rol: 'construction',
      }),
      otr('AB', t.A!, t.B!, { rol: 'figure' }),
      otr('BC', t.B!, t.C!, { rol: 'figure' }),
      otr('CA', t.C!, t.A!, { rol: 'figure' }),
      otr('BW', t.B!, t.W!, { gruppy: ['bis'], cvet: 'a', rol: 'aux' }),
      otr('AI', t.A!, t.I!, { gruppy: ['ugly'], cvet: 'a', rol: 'aux' }),
      otr('WA', t.W!, t.A!, {
        gruppy: ['ravn', 'okr2', 'otvet'],
        cvet: 'b',
        shtrihi: 1,
        rol: 'aux',
      }),
      otr('WI', t.W!, t.I!, {
        gruppy: ['ravn', 'okr2', 'ugly'],
        cvet: 'b',
        shtrihi: 1,
        rol: 'aux',
      }),
      otr('WC', t.W!, t.C!, { gruppy: ['ravn', 'okr2'], cvet: 'b', shtrihi: 1, rol: 'aux' }),
      ug('pB', t.A!, t.B!, t.C!, { pryamoy: true }),
      velOtr('d-AC', `${p.k}√2`, t.A!, t.C!),
      ...tochki3(t, ['A', 'B', 'C', 'I', 'W']),
    ]);
  },
  'vpis-hordy': (p) => {
    const { R, ...t0 } = tochkiVpisHordy(p);
    return nepodvizhnaya('tr-vpis-hordy', t0, (t) => [
      okr('k', t.O!, R, { rol: 'figure' }),
      mnog('f-apb', [t.A!, t.P!, t.B!], { gruppy: ['podobie'], cvet: 'a' }),
      mnog('f-dpc', [t.D!, t.P!, t.C!], { gruppy: ['podobie'], cvet: 'b' }),
      /* Хорды и диагонали с числами — navy, цветные только подписи. */
      otr('AB', t.A!, t.B!, { gruppy: ['podobie'], cvet: 'a', rol: 'aux' }),
      otr('CD', t.C!, t.D!, { gruppy: ['podobie', 'otvet'], cvet: 'b', rol: 'aux' }),
      otr('AC', t.A!, t.C!, { rol: 'aux' }),
      otr('BD', t.B!, t.D!, { rol: 'aux' }),
      ug('uA', t.B!, t.A!, t.C!, { gruppy: ['ugly'], cvet: 'a' }),
      ug('uD', t.B!, t.D!, t.C!, { gruppy: ['ugly'], cvet: 'a' }),
      velOtr('d-AB', chislo(p.AB!), t.A!, t.B!),
      velOtr('d-AP', chislo(p.AP!), t.A!, t.P!),
      velOtr('d-DP', chislo(p.DP!), t.D!, t.P!),
      ...tochki3(t, ['A', 'B', 'C', 'D', 'P']),
    ]);
  },
  'vpis-pryam': (p) => {
    const { r, ...t0 } = tochkiVpisPryam(p);
    return nepodvizhnaya('tr-vpis-pryam', t0, (t) => [
      mnog('t-fig', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'figure' }),
      okr('k', t.I!, r, { rol: 'aux' }),
      /* Отрезки касательных: равные — одинаковые засечки; длины числами — линии navy. */
      otr('AK', t.A!, t.K!, { gruppy: ['kas'], cvet: 'a', shtrihi: 1, rol: 'figure' }),
      otr('AP', t.A!, t.P!, { gruppy: ['kas'], cvet: 'a', shtrihi: 1, rol: 'figure' }),
      otr('KB', t.K!, t.B!, { gruppy: ['kas'], cvet: 'b', shtrihi: 2, rol: 'figure' }),
      otr('BQ', t.B!, t.Q!, { gruppy: ['kas'], cvet: 'b', shtrihi: 2, rol: 'figure' }),
      otr('PC', t.P!, t.C!, { gruppy: ['kas', 'pifagor'], cvet: 'c', rol: 'figure' }),
      otr('CQ', t.C!, t.Q!, { gruppy: ['kas', 'pifagor'], cvet: 'c', rol: 'figure' }),
      otr('IP', t.I!, t.P!, { stil: 'punktir', rol: 'construction' }),
      otr('IQ', t.I!, t.Q!, { stil: 'punktir', rol: 'construction' }),
      ug('pC', t.A!, t.C!, t.B!, { pryamoy: true, gruppy: ['pifagor'], cvet: 'a' }),
      velOtr('d-AK', chislo(p.AK!), t.A!, t.K!),
      velOtr('d-BK', chislo(p.BK!), t.K!, t.B!),
      ...tochki3(t, ['A', 'B', 'C', 'K', 'I', 'P', 'Q']),
    ]);
  },
  hordy: (p) => {
    const { R, ...t0 } = tochkiHordy(p);
    return nepodvizhnaya('tr-hordy', t0, (t) => [
      okr('k', t.O!, R, { rol: 'figure' }),
      mnog('f-apc', [t.A!, t.P!, t.C!], { gruppy: ['podobie'], cvet: 'a' }),
      mnog('f-dpb', [t.D!, t.P!, t.B!], { gruppy: ['podobie'], cvet: 'b' }),
      otr('AB', t.A!, t.B!, { gruppy: ['otrezki'], cvet: 'a', rol: 'aux' }),
      otr('CD', t.C!, t.D!, { gruppy: ['otrezki', 'otvet'], cvet: 'b', rol: 'aux' }),
      otr('AC', t.A!, t.C!, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['podobie'],
        cvet: 'a',
        rol: 'construction',
      }),
      otr('BD', t.B!, t.D!, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['podobie'],
        cvet: 'b',
        rol: 'construction',
      }),
      velOtr('d-AP', chislo(p.AP!), t.A!, t.P!),
      velOtr('d-PB', chislo(p.PB!), t.P!, t.B!),
      velOtr('d-CP', chislo(p.CP!), t.C!, t.P!),
      ...tochki3(t, ['A', 'B', 'C', 'D', 'P']),
    ]);
  },
  'sredlin-trap': (p) => {
    const t0 = tochkiSredlinTrap(p);
    return nepodvizhnaya('tr-sredlin-trap', t0, (t) => [
      mnog('t-fig', [t.A!, t.B!, t.C!, t.D!], { skrytyy: false, rol: 'figure' }),
      mnog('f-acd', [t.A!, t.C!, t.D!], { gruppy: ['acd'], cvet: 'a' }),
      mnog('f-bcd', [t.B!, t.C!, t.D!], { gruppy: ['bcd'], cvet: 'b' }),
      otr('AB', t.A!, t.B!, { rol: 'figure' }),
      otr('BC', t.B!, t.C!, { gruppy: ['bcd'], cvet: 'b', rol: 'figure' }),
      otr('CD', t.C!, t.D!, { rol: 'figure' }),
      otr('DA', t.D!, t.A!, { gruppy: ['acd'], cvet: 'a', rol: 'figure' }),
      otr('AC', t.A!, t.C!, { rol: 'aux' }),
      otr('BD', t.B!, t.D!, { rol: 'aux' }),
      otr('MK', t.M!, t.K!, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['acd'],
        cvet: 'a',
        rol: 'construction',
      }),
      otr('NK', t.N!, t.K!, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['bcd'],
        cvet: 'b',
        rol: 'construction',
      }),
      otr('MN', t.M!, t.N!, { gruppy: ['otvet'], cvet: 'b', rol: 'aux' }),
      velOtr('d-AD', chislo(p.AD!), t.A!, t.D!),
      velOtr('d-BC', chislo(p.BC!), t.B!, t.C!),
      ...tochki3(t, ['A', 'B', 'C', 'D', 'M', 'N']),
      tch('K', t.K!, { skrytyy: true, gruppy: ['acd', 'bcd'], cvet: 'a' }),
    ]);
  },
  'ravnobok-perp': (p) => {
    const t0 = tochkiRavnobokPerp(p);
    return nepodvizhnaya('tr-ravnobok-perp', t0, (t) => [
      /* Площадь трапеции ищется. */
      mnog('t-isk', [t.A!, t.B!, t.C!, t.D!], { skrytyy: false, rol: 'region-sought' }),
      mnog('f-aod', [t.A!, t.O!, t.D!], { gruppy: ['ravnobed'], cvet: 'a' }),
      mnog('f-boc', [t.B!, t.O!, t.C!], { gruppy: ['ravnobed'], cvet: 'b' }),
      otr('AB', t.A!, t.B!, { shtrihi: 1, rol: 'figure' }),
      otr('BC', t.B!, t.C!, { rol: 'figure' }),
      otr('CD', t.C!, t.D!, { shtrihi: 1, rol: 'figure' }),
      otr('DA', t.D!, t.A!, { rol: 'figure' }),
      otr('AC', t.A!, t.C!, { gruppy: ['diag'], cvet: 'a', rol: 'aux' }),
      otr('BD', t.B!, t.D!, { gruppy: ['diag'], cvet: 'a', rol: 'aux' }),
      /* Высота — данное условия: видна всегда, вдоль неё — её длина. */
      otr('EF', t.E!, t.F!, { stil: 'punktir', gruppy: ['h', 'otvet'], cvet: 'b', rol: 'aux' }),
      ug('pF', t.D!, t.F!, t.E!, { pryamoy: true }),
      ug('pO', t.A!, t.O!, t.D!, { pryamoy: true, gruppy: ['diag', 'ravnobed'], cvet: 'a' }),
      vel('d-h', chislo(p.h!), { vnutri: lerp(t.O!, t.F!, 0.5) }),
      vel(
        'd-S',
        'S_ABCD = ?',
        { vnutri: [(t.A![0] + t.B![0] + t.O![0]) / 3, (t.A![1] + t.B![1] + t.O![1]) / 3] },
        { rol: 'region-sought' },
      ),
      ...tochki3(t, ['A', 'B', 'C', 'D', 'O', 'E', 'F']),
    ]);
  },
  'menelay-pl': (p) => {
    const t0 = tochkiMenelayPl();
    return nepodvizhnaya('tr-menelay-pl', t0, (t) => [
      /* Площадь ABC дана: вся фигура — region. */
      mnog('t-reg', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'region' }),
      /* Площадь APC ищется. */
      mnog('t-isk', [t.A!, t.P!, t.C!], { skrytyy: false, rol: 'region-sought' }),
      mnog('f-abl', [t.A!, t.B!, t.L!], { gruppy: ['men'], cvet: 'a' }),
      mnog('f-alc', [t.A!, t.L!, t.C!], { gruppy: ['alc'], cvet: 'a' }),
      mnog('f-apc', [t.A!, t.P!, t.C!], { gruppy: ['pl'], cvet: 'b' }),
      otr('AB', t.A!, t.B!, { rol: 'figure' }),
      otr('BC', t.B!, t.C!, { rol: 'figure' }),
      otr('CA', t.C!, t.A!, { rol: 'figure' }),
      /* Части сторон: через x — синие, через y — терракотовые. */
      otr('AK', t.A!, t.K!, { rol: 'part-x' }),
      otr('KB', t.K!, t.B!, { rol: 'part-x' }),
      otr('BL', t.B!, t.L!, { rol: 'part-y' }),
      otr('LC', t.L!, t.C!, { rol: 'part-y' }),
      otr('AL', t.A!, t.L!, { gruppy: ['men'], cvet: 'a', rol: 'aux' }),
      otr('CK', t.C!, t.K!, { gruppy: ['men'], cvet: 'b', rol: 'aux' }),
      velOtr('d-AK', 'x', t.A!, t.K!, { rol: 'part-x' }),
      velOtr('d-KB', '2x', t.K!, t.B!, { rol: 'part-x' }),
      velOtr('d-BL', '3y', t.B!, t.L!, { rol: 'part-y' }),
      velOtr('d-LC', 'y', t.L!, t.C!, { rol: 'part-y' }),
      /* Площадь — внутри фигуры: в свободном четырёхугольнике BKPL. */
      vel(
        'd-S',
        `S_ABC = ${chislo(p.S!)}`,
        {
          vnutri: [
            (t.B![0] + t.K![0] + t.P![0] + t.L![0]) / 4,
            (t.B![1] + t.K![1] + t.P![1] + t.L![1]) / 4,
          ],
        },
        { rol: 'region' },
      ),
      /* APC узкий — подпись под стороной AC, снаружи. */
      velOtr('d-Sx', 'S_APC = ?', t.A!, t.C!, { rol: 'region-sought' }),
      ...tochki3(t, ['A', 'B', 'C', 'K', 'L', 'P']),
    ]);
  },
  'trap-seredina': (p) => {
    const t0 = tochkiTrapSeredina();
    return nepodvizhnaya('tr-trap-seredina', t0, (t) => [
      /* Площадь трапеции ищется, площадь ABE дана. */
      mnog('t-isk', [t.A!, t.B!, t.C!, t.D!], { skrytyy: false, rol: 'region-sought' }),
      mnog('t-reg', [t.A!, t.B!, t.E!], { skrytyy: false, rol: 'region' }),
      mnog('f-bce', [t.B!, t.C!, t.E!], { gruppy: ['ugly'], cvet: 'a' }),
      mnog('f-ade', [t.A!, t.D!, t.E!], { gruppy: ['ugly'], cvet: 'a' }),
      mnog('f-abe', [t.A!, t.B!, t.E!], { gruppy: ['abe'], cvet: 'b' }),
      otr('AB', t.A!, t.B!, { rol: 'figure' }),
      otr('BC', t.B!, t.C!, { rol: 'figure' }),
      otr('CE', t.C!, t.E!, { shtrihi: 1, rol: 'figure' }),
      otr('ED', t.E!, t.D!, { shtrihi: 1, rol: 'figure' }),
      otr('DA', t.D!, t.A!, { rol: 'figure' }),
      otr('AE', t.A!, t.E!, { gruppy: ['abe'], cvet: 'b', rol: 'aux' }),
      otr('BE', t.B!, t.E!, { gruppy: ['abe'], cvet: 'b', rol: 'aux' }),
      vel(
        'd-S',
        `S_ABE = ${chislo(p.S!)}`,
        {
          vnutri: [(t.A![0] + t.B![0] + t.E![0]) / 3, (t.A![1] + t.B![1] + t.E![1]) / 3],
        },
        { rol: 'region' },
      ),
      vel(
        'd-Sx',
        'S_ABCD = ?',
        { vnutri: [(t.A![0] + t.E![0] + t.D![0]) / 3, (t.A![1] + t.E![1] + t.D![1]) / 3] },
        { rol: 'region-sought' },
      ),
      ...tochki3(t, ['A', 'B', 'C', 'D', 'E']),
    ]);
  },
  'obshchiy-ugol': (p) => {
    const t0 = tochkiObshchiyUgol(p);
    return nepodvizhnaya('tr-obshchiy-ugol', t0, (t) => [
      /* Площадь ABC дана: вся фигура — region. */
      mnog('t-reg', [t.A!, t.B!, t.C!], { skrytyy: false, rol: 'region' }),
      /* Площадь MBCN ищется. */
      mnog('t-isk', [t.M!, t.B!, t.C!, t.N!], { skrytyy: false, rol: 'region-sought' }),
      mnog('f-amn', [t.A!, t.M!, t.N!], { gruppy: ['amn'], cvet: 'b' }),
      mnog('f-bmnc', [t.B!, t.M!, t.N!, t.C!], { gruppy: ['otvet'], cvet: 'a' }),
      otr('AB', t.A!, t.B!, { rol: 'figure' }),
      otr('BC', t.B!, t.C!, { rol: 'figure' }),
      otr('CA', t.C!, t.A!, { rol: 'figure' }),
      otr('AM', t.A!, t.M!, { rol: 'part-x' }),
      otr('MB', t.M!, t.B!, { rol: 'part-x' }),
      otr('AN', t.A!, t.N!, { rol: 'part-y' }),
      otr('NC', t.N!, t.C!, { rol: 'part-y' }),
      otr('MN', t.M!, t.N!, { rol: 'aux' }),
      ug('uA', t.B!, t.A!, t.C!, { gruppy: ['amn'], cvet: 'b', rol: 'angle' }),
      velOtr('d-AM', chast(p.m!, 'x'), t.A!, t.M!, { rol: 'part-x' }),
      velOtr('d-MB', chast(p.n!, 'x'), t.M!, t.B!, { rol: 'part-x' }),
      velOtr('d-AN', chast(p.p!, 'y'), t.A!, t.N!, { rol: 'part-y' }),
      velOtr('d-NC', chast(p.q!, 'y'), t.N!, t.C!, { rol: 'part-y' }),
      /* Площади — внутри фигуры: данная — у вершины B, искомая — в MBCN. */
      vel(
        'd-S',
        `S_ABC = ${chislo(p.S!)}`,
        {
          vnutri: lerp(
            t.B!,
            [(t.A![0] + t.B![0] + t.C![0]) / 3, (t.A![1] + t.B![1] + t.C![1]) / 3],
            0.5,
          ),
        },
        { rol: 'region' },
      ),
      vel(
        'd-Sx',
        'S_MBCN = ?',
        {
          vnutri: [
            (t.M![0] + t.B![0] + t.C![0] + t.N![0]) / 4,
            (t.M![1] + t.B![1] + t.C![1] + t.N![1]) / 4,
          ],
        },
        { rol: 'region-sought' },
      ),
      ...tochki3(t, ['A', 'B', 'C', 'M', 'N']),
    ]);
  },
};

/* Типы по новым опорным задачам: сцена опорной задачи с числами набора. */
const sNachalom = (z: ZhivayaSkhema, nachalo: Tochki): ZhivayaSkhema => ({ ...z, nachalo });
const SCENY_NOVYE: Readonly<Record<string, Postroenie>> = {
  'diag-trap': (p) => sNachalom(N.OP_DIAG_TRAP, { p: [p.a!, p.b!], q: [p.d1!, p.d2!] }),
  'kas-ef': (p) => sNachalom(N.OP_KAS_EF, { p: [p.R1!, p.R2!] }),
  kvadraty: (p) => sNachalom(N.OP_KVADRATY, { A: [p.AC!, 0], B: polar(150, p.BC!), C: [0, 0] }),
  'dve-okr': (p) => {
    /* cos α из 2cos²α + cos α / k − 1 = 0 (а): AE — диаметр, sin ∠AEB = cos α / k). */
    const k = p.k!;
    const c = (-1 / k + Math.sqrt(1 / (k * k) + 8)) / 4;
    const r = p.AB! / 2 / c;
    return sNachalom(N.OP_DVE_OKR, { p: [r, k * r], q: [p.AB! / 2, 0] });
  },
  'cherez-centr': (p) => sNachalom(N.OP_CHEREZ_CENTR, { p: [Math.acos(1 / p.d!) / RAD, 6] }),
  'vpis-klm': (p) => {
    const u = (p.m! * (p.m! + p.n!)) / (3 * p.n! - p.m!);
    return sNachalom(N.OP_VPIS_KLM, {
      K: [0, 0],
      L: [p.m! + u, 0],
      M: polar(60, p.m! + p.n!),
    });
  },
  'vys-perp': (p) => {
    const uB = p.B!;
    const uA = (180 - uB) / 2 + 8;
    const uC = 180 - uA - uB;
    return sNachalom(N.OP_VYS_PERP, {
      A: polar(uB, (10 * Math.sin(uC * RAD)) / Math.sin(uA * RAD)),
      B: [0, 0],
      C: [10, 0],
    });
  },
  'biss-sred': (p) => sNachalom(N.OP_BISS_SRED, { p: [p.b!, p.a!] }),
  vnevpis: (p) => {
    const d = p.r2! - p.r1!;
    const a = (-d + Math.sqrt(d * d + 8 * p.r1! * p.r2!)) / 2;
    return sNachalom(N.OP_VNEVPIS, { p: [a, a + d] });
  },
  'kvadrat-per': (p) => sNachalom(N.OP_KVADRAT_PER, { p: [p.m!, p.s!] }),
  'ser-vys': (p) => sNachalom(N.OP_SER_VYS, { p: [60, 45], q: [p.k!, 0] }),
  'kv-gip': (p) => sNachalom(N.OP_KV_GIP_OTN, { p: [p.b!, p.a!] }),
  'vpis-lmn': (p) => sNachalom(N.OP_VPIS_LMN, { p: [150, 0.35], q: [p.KM!, 0] }),
};

/** Чертёж задачи тренажёра: тип и параметры варианта. */
export function scena18(tip: string, p: Parametry): ZhivayaSkhema {
  const f = SCENY[tip] ?? SCENY_NOVYE[tip];
  if (f !== undefined) return f(p);
  /* Перенесённые задачи — dop/. */
  const s = SCENY_DOP[tip];
  if (s === undefined) throw new Error(`Нет чертежа задачи тренажёра ${tip}`);
  return s(p);
}

export const TIPY_SCEN_18: readonly string[] = [
  ...Object.keys(SCENY),
  ...Object.keys(SCENY_NOVYE),
  ...Object.keys(SCENY_DOP),
];
