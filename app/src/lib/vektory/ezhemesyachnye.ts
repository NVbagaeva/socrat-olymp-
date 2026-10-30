/**
 * Шаблоны раздела «Ежемесячные варианты» для задания №2: своя задача
 * на числах варианта с тем же языком условия и шагами разбора, что у
 * прототипов раздела (prototypes/common.ts). В банк и генератор №2 не
 * входят.
 */

import { d, grad, modul, skalyarnoe, vec } from './tex';
import { shagOtvet } from './prototypes/common';
import type { Generated } from './types';

const otr = (n: string) => `\\overrightarrow{${n}}`;

/* ── Конец вектора по началу и координатам ──────────────────────── */

export interface KonecVektora {
  /** Начало A. */
  ax: number;
  ay: number;
  /** Координаты вектора AB. */
  vx: number;
  vy: number;
}

/**
 * Начало вектора и его координаты → абсцисса конца. Подвох — вычесть
 * вместо сложить: координаты вектора — разность «конец минус начало».
 */
export function konecVektora(p: KonecVektora): Generated {
  const bx = p.ax + p.vx;
  const by = p.ay + p.vy;
  return {
    uslovie: `Вектор $${otr('AB')}$ с началом в точке $A(${d(p.ax)};\\ ${d(p.ay)})$ имеет координаты $(${d(p.vx)};\\ ${d(p.vy)})$. Найдите абсциссу точки $B$.`,
    risunok: null,
    otvet: bx,
    /* Второй счёт — в плавающей арифметике: сдвиг на длину вектора вдоль его направления. */
    proverka: p.ax + Math.hypot(p.vx, p.vy) * Math.cos(Math.atan2(p.vy, p.vx)),
    shagi: [
      {
        zagolovok: 'Координаты вектора через начало и конец',
        stroki: [
          `Координаты вектора — разность координат конца и начала: $${otr('AB')}=(x_B-x_A;\\ y_B-y_A)$.`,
          `Значит, $x_B-x_A=${d(p.vx)}$, то есть $x_B=x_A+${p.vx < 0 ? `(${d(p.vx)})` : d(p.vx)}$.`,
        ],
      },
      {
        zagolovok: 'Подставляем',
        stroki: [
          `$x_B=${d(p.ax)}+${p.vx < 0 ? `(${d(p.vx)})` : d(p.vx)}=${d(bx)}$.`,
          `Проверка: $B(${d(bx)};\\ ${d(by)})$, $${otr('AB')}=(${d(bx)}-(${d(p.ax)});\\ ${d(by)}-${p.ay < 0 ? `(${d(p.ay)})` : d(p.ay)})=(${d(p.vx)};\\ ${d(p.vy)})$ — верно.`,
        ],
      },
      shagOtvet(bx),
    ],
    params: { ...p },
    signature: `ev2kon|${p.ax}|${p.ay}|${p.vx}|${p.vy}`,
    prototype: 'EV2-KONEC',
    seed: 'fixed',
  };
}

/* ── Скалярное произведение в прямоугольном треугольнике ────────── */

export interface SkalyarnoeVTreugolnike {
  /** Гипотенуза AB = k√3. */
  k: number;
}

/**
 * Прямоугольный треугольник ABC (C = 90°), ∠A = 2∠B, то есть A = 60°,
 * B = 30°; CH — высота. BC·CH: векторы «выходят» из разных точек —
 * подвох в угле между ними, он тупой (180° − ∠BCH = 120°).
 */
export function skalyarnoeVTreugolnike(p: SkalyarnoeVTreugolnike): Generated {
  /* BC = AB·cos 30° = k√3·√3/2 = 3k/2; CH = BC·sin 30° = 3k/4. */
  const bc = (3 * p.k) / 2;
  const ch = bc / 2;
  const otvet = -bc * ch * 0.5;
  /* Второй счёт — координаты: C(0; 0), B(bc; 0), A(0; bc·tg30°). */
  const A: [number, number] = [0, bc * Math.tan(Math.PI / 6)];
  const B: [number, number] = [bc, 0];
  const t =
    (A[0] * (A[0] - B[0]) + A[1] * (A[1] - B[1])) / ((A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2);
  const H: [number, number] = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])];
  const proverka = (0 - B[0]) * H[0] + (0 - B[1]) * H[1];
  return {
    uslovie: `В треугольнике $ABC$ угол $C$ прямой, гипотенуза $AB$ равна $${d(p.k)}\\sqrt{3}$, угол $BAC$ в $2$ раза больше угла $ABC$, $CH$ — высота. Найдите скалярное произведение векторов $${otr('BC')}$ и $${otr('CH')}$.`,
    risunok: null,
    otvet,
    proverka,
    shagi: [
      {
        zagolovok: 'Углы треугольника',
        stroki: [
          'Сумма острых углов прямоугольного треугольника $90^\\circ$: $\\angle B+2\\angle B=90^\\circ$, $\\angle B=30^\\circ$, $\\angle A=60^\\circ$.',
        ],
      },
      {
        zagolovok: 'Длины векторов',
        stroki: [
          `$BC=AB\\cdot\\cos 30^\\circ=${d(p.k)}\\sqrt{3}\\cdot\\dfrac{\\sqrt{3}}{2}=${d(bc)}$.`,
          `В треугольнике $BCH$ угол $H$ прямой, $CH$ лежит против угла $30^\\circ$: $CH=\\dfrac{BC}{2}=${d(ch)}$.`,
        ],
      },
      {
        zagolovok: 'Угол между векторами',
        stroki: [
          `Угол между векторами считают, отложив их от одной точки. Вектор $${otr('BC')}$ входит в точку $C$, а $${otr('CH')}$ из неё выходит, поэтому угол между ними — не $\\angle BCH$, а смежный с ним.`,
          `$\\angle BCH=90^\\circ-\\angle B=${grad(60)}$, угол между векторами $180^\\circ-60^\\circ=${grad(120)}$.`,
        ],
      },
      {
        zagolovok: 'Формула через длины и угол',
        stroki: [
          `$${skalyarnoe(otr('BC'), otr('CH'))}=${modul(otr('BC'))}\\cdot${modul(otr('CH'))}\\cdot\\cos120^\\circ=${d(bc)}\\cdot${d(ch)}\\cdot\\left(-\\dfrac12\\right)=${d(otvet)}$.`,
        ],
      },
      shagOtvet(otvet),
    ],
    params: { ...p },
    signature: `ev2tr|${p.k}`,
    prototype: 'EV2-TREUGOLNIK',
    seed: 'fixed',
  };
}

/* ── Длина по скалярному произведению ───────────────────────────── */

export interface DlinaPoSkalyarnomu {
  /** |a| = k√3 (угол 30°) или k√2 (угол 45°). */
  k: number;
  ugol: 30 | 45;
  /** a·b. */
  s: number;
}

/**
 * Обратная к B2: даны |a|, угол и a·b — найти |b|. Произведение
 * k√3·cos 30° = 1,5k (или k√2·cos 45° = k) — корень уходит.
 */
export function dlinaPoSkalyarnomu(p: DlinaPoSkalyarnomu): Generated {
  const r = p.ugol === 30 ? 3 : 2;
  const proizv = (p.k * r) / 2;
  const otvet = p.s / proizv;
  const la = `${p.k === 1 ? '' : d(p.k)}\\sqrt{${r}}`;
  const cosTex = `\\dfrac{\\sqrt{${r}}}{2}`;
  return {
    uslovie: `Длина вектора $${vec('a')}$ равна $${la}$, угол между векторами $${vec('a')}$ и $${vec('b')}$ равен $${grad(p.ugol)}$, а скалярное произведение $${skalyarnoe(vec('a'), vec('b'))}$ равно $${d(p.s)}$. Найдите длину вектора $${vec('b')}$.`,
    risunok: null,
    otvet,
    proverka: p.s / (p.k * Math.sqrt(r) * Math.cos((p.ugol * Math.PI) / 180)),
    shagi: [
      {
        zagolovok: 'Формула через длины и угол',
        stroki: [
          `$${skalyarnoe(vec('a'), vec('b'))}=${modul(vec('a'))}\\cdot${modul(vec('b'))}\\cdot\\cos\\alpha$, откуда $${modul(vec('b'))}=\\dfrac{${skalyarnoe(vec('a'), vec('b'))}}{${modul(vec('a'))}\\cdot\\cos\\alpha}$.`,
        ],
      },
      {
        zagolovok: 'Знаменатель',
        stroki: [
          `$${modul(vec('a'))}\\cdot\\cos ${grad(p.ugol)}=${la}\\cdot${cosTex}=\\dfrac{${d(p.k)}\\cdot${r}}{2}=${d(proizv)}$.`,
        ],
      },
      {
        zagolovok: 'Подставляем',
        stroki: [`$${modul(vec('b'))}=\\dfrac{${d(p.s)}}{${d(proizv)}}=${d(otvet)}$.`],
      },
      shagOtvet(otvet),
    ],
    params: { ...p },
    signature: `ev2dl|${p.k}|${p.ugol}|${p.s}`,
    prototype: 'EV2-DLINA-SKALYAR',
    seed: 'fixed',
  };
}
