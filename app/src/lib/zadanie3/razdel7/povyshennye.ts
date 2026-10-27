/**
 * Раздел VII для «Вариантов повышенной сложности»: прототип той же
 * формы, что P03-74, но спрашивают полную поверхность призмы, а не
 * объём. В список прототипов раздела (тренажёр, банк, «Собрать вариант»)
 * не входит — его берёт только раздел вариантов.
 *
 * Проверка формулу 8r² + 8rh не повторяет: строится настоящий
 * параллелепипед, и площади его граней меряются по координатам.
 */

import { surfaceArea } from '../../solid/measure';
import { boxAround } from './common';
import { boxAroundCylinder } from './drawings';
import { ru } from '../format';
import { type Prototype, num } from '../types';

/* ── P03-74S. Призма около цилиндра: полная поверхность ─────────── */

export const P03_74S: Prototype = {
  id: 'P03-74S',
  razdel: 'VII',
  nazvanie: 'Правильная четырёхугольная призма около цилиндра: полная поверхность',
  tip: 'полная поверхность правильной четырёхугольной призмы, описанной около цилиндра',
  zadachnik: [254, 257],
  status: 'добавить',
  format: 'десятичная',

  uslovie: (p) =>
    `Цилиндр вписан в правильную четырёхугольную призму. Радиус основания цилиндра равен ${ru(num(p, 'r'))}, ` +
    `высота цилиндра равна ${ru(num(p, 'h'))}. Найдите площадь полной поверхности призмы.`,

  dopustimo: (p) => num(p, 'r') > 0 && num(p, 'h') > 0 && num(p, 'h') !== 2 * num(p, 'r'),

  otvet: (p) => 8 * num(p, 'r') ** 2 + 8 * num(p, 'r') * num(p, 'h'),

  /* Площадь поверхности настоящего параллелепипеда по координатам граней. */
  poModeli: (p) => surfaceArea(boxAround(num(p, 'r'), num(p, 'h'))),

  chertezh: () =>
    boxAroundCylinder('Правильная четырёхугольная призма, описанная около цилиндра', 3.6),

  shagi: (p) => {
    const r = num(p, 'r');
    const h = num(p, 'h');
    const a = 2 * r;
    const osn = 2 * a * a;
    const bok = 4 * a * h;
    return [
      {
        text: `Основание призмы — квадрат, в который вписан круг основания цилиндра: сторона равна диаметру, $2\\cdot ${ru(r)} = ${ru(a)}$. Высота призмы равна высоте цилиндра, ${ru(h)}.`,
        value: a,
      },
      {
        text: `Два основания: $2\\cdot ${ru(a)}^2 = ${ru(osn)}$. Четыре боковые грани: $4\\cdot ${ru(a)}\\cdot ${ru(h)} = ${ru(bok)}$.`,
        value: bok,
      },
      {
        text: `Полная поверхность: $${ru(osn)} + ${ru(bok)} = ${ru(osn + bok)}$.`,
        value: osn + bok,
      },
    ];
  },

  varianty: [],
};

/* ── Конус: радиус и образующая меняются — во сколько раз боковая ── */

/** Множитель «в k раз»: v = 1 — увеличится, 0 — уменьшится. */
const mnozh = (k: number, v: number) => (v === 1 ? k : 1 / k);
const izmenitsya = (v: number) => (v === 1 ? 'увеличится' : 'уменьшится');

/** «в 5 раз», «в 2 раза», «в 12 раз», «в 2,5 раза». */
function vRaz(k: number): string {
  const d = k % 10;
  const a = !Number.isInteger(k) || (d >= 2 && d <= 4 && Math.floor(k / 10) % 10 !== 1);
  return `в ${ru(k)} раз${a ? 'а' : ''}`;
}

/** Во сколько раз меняется боковая поверхность; больше 1 — растёт. */
/** Во сколько раз изменилась площадь — из целых: больший множитель на меньший. */
function vRazBokovoy(p: Parameters<Prototype['otvet']>[0]): number {
  const verh = (num(p, 'rv') === 1 ? num(p, 'r') : 1) * (num(p, 'lv') === 1 ? num(p, 'l') : 1);
  const niz = (num(p, 'rv') === 1 ? 1 : num(p, 'r')) * (num(p, 'lv') === 1 ? 1 : num(p, 'l'));
  return Math.round((Math.max(verh, niz) / Math.min(verh, niz)) * 1e9) / 1e9;
}

function otnoshenieBokovoy(p: Parameters<Prototype['otvet']>[0]): number {
  return mnozh(num(p, 'r'), num(p, 'rv')) * mnozh(num(p, 'l'), num(p, 'lv'));
}

/** Боковая поверхность конуса по сетке: сумма площадей узких треугольников-граней. */
function bokovayaPoSetke(r: number, l: number): number {
  const h = Math.sqrt(l * l - r * r);
  const n = 20000;
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    const a = (2 * Math.PI * i) / n;
    const b = (2 * Math.PI * (i + 1)) / n;
    const P = [r * Math.cos(a), r * Math.sin(a), 0];
    const Q = [r * Math.cos(b), r * Math.sin(b), 0];
    /* Площадь треугольника с вершиной (0, 0, h): половина модуля векторного произведения. */
    const u = [P[0]!, P[1]!, -h];
    const w = [Q[0]!, Q[1]!, -h];
    const c = [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
    s += Math.hypot(c[0]!, c[1]!, c[2]!) / 2;
  }
  return s;
}

export const PV03_KONUS_BOKOVAYA: Prototype = {
  id: 'PV03-konus-bokovaya',
  razdel: 'VII',
  nazvanie: 'Конус: радиус и образующая меняются — во сколько раз меняется боковая поверхность',
  tip: 'отношение площадей боковых поверхностей конусов',
  zadachnik: [234, 237],
  status: 'добавить',
  format: 'десятичная',
  uslovie: (p) => {
    const q = otnoshenieBokovoy(p);
    return (
      `Во сколько раз ${izmenitsya(q > 1 ? 1 : 0)} площадь боковой поверхности конуса, ` +
      `если радиус его основания ${izmenitsya(num(p, 'rv'))} ${vRaz(num(p, 'r'))}, ` +
      `а образующая ${izmenitsya(num(p, 'lv'))} ${vRaz(num(p, 'l'))}?`
    );
  },
  dopustimo: (p) =>
    num(p, 'r') > 1 &&
    num(p, 'l') > 1 &&
    Number.isInteger(num(p, 'r')) &&
    Number.isInteger(num(p, 'l')) &&
    Math.abs(otnoshenieBokovoy(p) - 1) > 1e-9,
  otvet: (p) => {
    return vRazBokovoy(p);
  },
  /* Два настоящих конуса: площади по сетке граней, затем отношение. Образующая
     первого много длиннее радиуса — высота второго существует при любых множителях. */
  poModeli: (p) => {
    const r1 = 1;
    const l1 = 1000;
    const q =
      bokovayaPoSetke(
        r1 * mnozh(num(p, 'r'), num(p, 'rv')),
        l1 * mnozh(num(p, 'l'), num(p, 'lv')),
      ) / bokovayaPoSetke(r1, l1);
    return Math.round((q > 1 ? q : 1 / q) * 1e6) / 1e6;
  },
  chertezh: () => ({
    alt: 'Конус',
    bodies: [{ kind: 'cone', base: [0, 0, 0], r: 2.2, h: 4.2 }],
  }),
  shagi: (p) => {
    const r = num(p, 'r');
    const l = num(p, 'l');
    const rk = mnozh(r, num(p, 'rv'));
    const lk = mnozh(l, num(p, 'lv'));
    const q = rk * lk;
    const vo = vRazBokovoy(p);
    const tex = (k: number, v: number) => (v === 1 ? ru(k) : `\\dfrac1{${ru(k)}}`);
    return [
      {
        text: 'Площадь боковой поверхности конуса $S = \\pi r l$: она пропорциональна и радиусу основания $r$, и образующей $l$.',
      },
      {
        text: `Новые радиус и образующая: $${tex(r, num(p, 'rv'))}\\,r$ и $${tex(l, num(p, 'lv'))}\\,l$, поэтому $S' = \\pi\\cdot ${tex(r, num(p, 'rv'))}\\,r\\cdot ${tex(l, num(p, 'lv'))}\\,l = ${q > 1 ? `${ru(vo)}\\,S` : `\\dfrac{S}{${ru(vo)}}`}$.`,
        value: q,
      },
      {
        text: `Площадь ${izmenitsya(q > 1 ? 1 : 0)} ${vRaz(vo)}.`,
        value: vo,
      },
    ];
  },
  varianty: [],
};
