/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №2.
 *
 * Своя задача на числах, которые задаёт вариант (не случайных): тот же
 * язык условия и те же шаги разбора, что у прототипов раздела
 * (prototypes/common.ts), поэтому лист учителя (`shagiHtml2`) и разбор
 * собираются как у задач банка. В банк и генератор №2 не входят.
 */

import { d, kombinatsiya, vec } from './tex';
import {
  dany,
  shagKombinatsiya,
  shagOtvet,
  shagSkalyarnoe,
  signatureOf,
} from './prototypes/common';
import type { Generated, Tochka } from './types';

/** k·a и m·b заданы координатами a и b: скалярное произведение k·a на m·b. */
export interface SkalyarnoeKombinatsiy {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Множители при векторах: целый и десятичный (0,5; 1,5 …). */
  k: number;
  m: number;
}

const umn = (k: number, p: Tochka): Tochka => [
  Math.round(k * p[0] * 1e9) / 1e9,
  Math.round(k * p[1] * 1e9) / 1e9,
];

export function skalyarnoeKombinatsiy(p: SkalyarnoeKombinatsiy): Generated {
  const a: Tochka = [p.ax, p.ay];
  const b: Tochka = [p.bx, p.by];
  const u = umn(p.k, a);
  const v = umn(p.m, b);
  const otvet = u[0] * v[0] + u[1] * v[1];
  const ka = kombinatsiya([[p.k, 'a']]);
  const mb = kombinatsiya([[p.m, 'b']]);
  return {
    uslovie: `${dany([
      ['a', a],
      ['b', b],
    ])} Найдите скалярное произведение векторов $${ka}$ и $${mb}$.`,
    risunok: null,
    otvet,
    /* Второй счёт: множители выносятся за скобку, (k·m)·(a·b). */
    proverka: p.k * p.m * (p.ax * p.bx + p.ay * p.by),
    shagi: [
      shagKombinatsiya([[p.k, 'a', a]], u, 'u'),
      shagKombinatsiya([[p.m, 'b', b]], v, 'v'),
      {
        ...shagSkalyarnoe(['u', u], ['v', v]),
        zagolovok: `Скалярное произведение $${vec('u')}\\cdot${vec('v')}$ по координатам`,
      },
      shagOtvet(otvet),
    ],
    params: { ...p },
    signature: `${signatureOf([a, b])}|${d(p.k)}|${d(p.m)}`,
    prototype: 'P2-KM',
    seed: 'fixed',
  };
}
