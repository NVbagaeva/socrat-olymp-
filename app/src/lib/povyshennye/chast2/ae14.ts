/**
 * №14 (варианты 17–18): log_b x + k·log_x b = m.
 *
 * t = log_b x (x > 0, x ≠ 1, t ≠ 0): t + k/t = m ⇒ t² − mt + k = 0,
 * корни t1, t2 — целые, ненулевые, k = t1·t2, m = t1 + t2. x = b^{t}.
 * б) Корни на отрезке [lo; hi].
 */

import { drobTex } from './oMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PAE14 {
  b: number;
  t1: number;
  t2: number;
  lo: number;
  hi: number;
}

const stepenTex = (b: number, t: number) => (t >= 0 ? String(b ** t) : drobTex(1, b ** -t));

export function chislaAE14(p: PAE14) {
  if (!(p.t1 < p.t2) || p.t1 === 0 || p.t2 === 0) throw new Error('ae14: t1 < t2, не нули');
  const k = p.t1 * p.t2;
  const m = p.t1 + p.t2;
  if (m === 0) throw new Error('ae14: m = 0');
  const korni = [p.t1, p.t2].map((t) => ({ v: p.b ** t, tex: stepenTex(p.b, t) }));
  const vybor = korni.filter((x) => x.v >= p.lo - 1e-12 && x.v <= p.hi + 1e-12);
  if (vybor.length === 0 || vybor.length === 2)
    throw new Error('ae14: отбор должен оставить один корень');
  return { k, m, korni, vybor };
}

function sobrat(p: PAE14): Chast2Zadacha {
  const ch = chislaAE14(p);
  const kT = ch.k === 1 ? '' : ch.k === -1 ? '-' : String(ch.k);
  const plus = ch.k > 0 ? '+' : '';
  const ur = `\\log_{${p.b}}x${plus}${kT}\\log_{x}${p.b}=${ch.m}`;
  const kT2 = ch.korni.map((x) => x.tex);
  const vT = ch.vybor.map((x) => x.tex);
  return {
    no: 14,
    shablon: 'ae14.logObratnyy',
    uslovie: `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $[${p.lo};\\ ${p.hi}]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Корни', pole: { vid: 'korni', verno: kT2 } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vT } },
    ],
    otvet: `а) $${kT2.join(';\\ ')}$; б) $${vT.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) ОДЗ и замена',
        lines: [
          `ОДЗ: $x>0$, $x\\ne1$. По формуле перехода $\\log_x ${p.b}=\\dfrac{1}{\\log_{${p.b}}x}$. Пусть $t=\\log_{${p.b}}x$, $t\\ne0$: $t+\\dfrac{${ch.k}}{t}=${ch.m}$.`,
          `Умножаем на $t\\ne0$: $t^2-${ch.m}t${ch.k > 0 ? '+' : ''}${ch.k}=0$, $t=${p.t1}$ или $t=${p.t2}$.`,
        ],
      },
      {
        title: 'а) Обратная замена',
        lines: [
          `$x=${p.b}^{${p.t1}}=${ch.korni[0]!.tex}$ и $x=${p.b}^{${p.t2}}=${ch.korni[1]!.tex}$; оба корня входят в ОДЗ.`,
          `Ответ а): $${kT2.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор',
        lines: [
          `На отрезке $[${p.lo};\\ ${p.hi}]$ лежит $${vT.join(';\\ ')}$. Ответ б): $${vT.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Переход к одному основанию', formula: `\\log_x ${p.b}=\\frac{1}{\\log_{${p.b}}x}` },
      { slovo: 'Квадратное уравнение', formula: `t^2-${ch.m}t${ch.k > 0 ? '+' : ''}${ch.k}=0` },
      { slovo: 'Корни', formula: kT2.join(';\\ ') },
      { slovo: 'Отбор', formula: vT.join(';\\ ') },
    ],
    kontrol: { korni: ch.korni.map((x) => x.v), vybor: ch.vybor.map((x) => x.v) },
  };
}

export const AE14_LOG_OBRATNYY: Shablon2<PAE14> = {
  no: 14,
  prototip: 'Логарифмическое уравнение с взаимно обратными логарифмами: замена и отбор на отрезке',
  sobrat,
};
