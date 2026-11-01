/**
 * №16 (варианты 15–16): логарифм с переменным основанием.
 *
 * log_x(px + q) ∨ 2, где x² − px − q = (x − r1)(x − r2):
 * p = r1 + r2, q = −r1·r2. ОДЗ: x > 0, x ≠ 1, px + q > 0.
 * При x > 1 неравенство равносильно px + q ∨ x², при 0 < x < 1 — с
 * обратным знаком. Метод рационализации: (x − 1)(px + q − x²) ∨ 0.
 */

import { kuskiPoTochkam, drobTex } from './oMnozh';
import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PI16 {
  /** r1 = n1/d1. */
  n1: number;
  d1: number;
  r2: number;
  znak: 'le' | 'ge';
}

export function chislaI16(p: PI16) {
  const r1 = p.n1 / p.d1;
  if (!(r1 < p.r2)) throw new Error('i16: r1 < r2');
  const P = r1 + p.r2;
  const Q = -r1 * p.r2;
  if (Math.abs(P) < 1e-12) throw new Error('i16: p = 0');
  const istina = (x: number) => {
    if (x <= 0 || Math.abs(x - 1) < 1e-12) return false;
    const y = P * x + Q;
    if (y <= 1e-12) return false;
    const v = Math.log(y) / Math.log(x);
    return p.znak === 'le' ? v <= 2 + 1e-9 : v >= 2 - 1e-9;
  };
  const tochki = [
    { v: r1, tex: drobTex(p.n1, p.d1) },
    { v: p.r2, tex: String(p.r2) },
    { v: 1, tex: '1' },
    { v: -Q / P, tex: drobTex(Math.round((-Q / P) * p.d1 * 1000), p.d1 * 1000) },
  ];
  const kuski = kuskiPoTochkam(tochki, istina, { v: 0, tex: '0' }, false);
  if (kuski.length === 0) throw new Error('i16: пусто');
  return { r1, P, Q, kuski };
}

function koefTex(v: number): string {
  const d = [1, 2, 3, 4, 5, 6, 8, 10].find((k) => Math.abs(v * k - Math.round(v * k)) < 1e-9) ?? 1;
  return drobTex(Math.round(v * d), d);
}

function sobrat(p: PI16): Chast2Zadacha {
  const ch = chislaI16(p);
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const PT = koefTex(ch.P);
  const QT = koefTex(ch.Q);
  const arg = `${PT === '1' ? '' : PT === '-1' ? '-' : PT}x${ch.Q >= 0 ? '+' : ''}${QT}`;
  const otv = mnozhTex(ch.kuski);
  return {
    no: 16,
    shablon: 'i16.logOsnovanie',
    uslovie: `Решите неравенство $\\log_{x}\\left(${arg}\\right)${zn}2$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'ОДЗ',
        lines: [`Основание: $x>0$, $x\\ne1$; аргумент: $${arg}>0$.`],
      },
      {
        title: 'Рационализация',
        lines: [
          `$2=\\log_x x^2$. Для $x>0$, $x\\ne1$ знак разности $\\log_x A-\\log_x B$ совпадает со знаком $(x-1)(A-B)$. Неравенство равносильно $(x-1)\\left(${arg}-x^2\\right)${zn}0$ на ОДЗ.`,
          `$${arg}-x^2=-(x-${drobTex(p.n1, p.d1)})(x-${p.r2})$; отмечаем точки $${drobTex(p.n1, p.d1)}$, $1$, $${p.r2}$ и границы ОДЗ.`,
        ],
      },
      { title: 'Ответ', lines: [`С учётом ОДЗ: $${otv}$.`] },
    ],
    razbor: [
      { slovo: 'ОДЗ', formula: `x>0,\\ x\\ne1,\\ ${arg}>0` },
      { slovo: 'Рационализация', formula: `(x-1)\\left(${arg}-x^2\\right)${zn}0` },
      { slovo: 'Нули', formula: `x=${drobTex(p.n1, p.d1)},\\ x=1,\\ x=${p.r2}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), P: ch.P, Q: ch.Q },
  };
}

export const I16_LOG_OSNOVANIE: Shablon2<PI16> = {
  no: 16,
  prototip: 'Логарифмическое неравенство с переменным основанием: ОДЗ и метод рационализации',
  sobrat,
};
