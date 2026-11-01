/**
 * №14 (варианты 25–26): log²_q(Mx) + A·log_q x + B = 0, M = q^s.
 *
 * t = log_q x: log_q(Mx) = s + t, уравнение (t + s)² + At + B = 0, то есть
 * t² + (2s + A)t + s² + B = 0 с целыми корнями t₁, t₂; x = q^{t₁}, q^{t₂}.
 * б) Отбор на отрезке [lo; hi] сравнением степеней.
 */

import { stepen } from './chisla';
import { dec, rat, ratTex, type Rat } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PN14 {
  q: number;
  /** M = q^s. */
  s: number;
  /** Корни по t = log_q x, разные целые. */
  t1: number;
  t2: number;
  lo: number;
  hi: number;
}

/** «+3t», «-t», «+5» — слагаемое со знаком; первое — без «+». */
function chlen(k: number, tex: string, pervyy = false): string {
  if (k === 0) return '';
  const zn = k < 0 ? '-' : pervyy ? '' : '+';
  const m = Math.abs(k);
  return `${zn}${m === 1 && tex !== '' ? '' : m}${tex}`;
}

export function chislaN14(p: PN14) {
  const A = -(p.t1 + p.t2) - 2 * p.s;
  const B = p.t1 * p.t2 - p.s * p.s;
  const M = p.q ** p.s;
  const korni = [p.t1, p.t2].sort((a, b) => a - b).map((t) => ({ t, x: stepen(p.q, rat(t)) }));
  const v = (x: Rat) => Number(x.n) / Number(x.d);
  const vybor = korni.filter((k) => v(k.x) >= p.lo - 1e-12 && v(k.x) <= p.hi + 1e-12);
  return { A, B, M, korni, vybor, v };
}

function sobrat(p: PN14): Chast2Zadacha {
  if (p.t1 === p.t2 || p.s < 1) throw new Error('n14: параметры');
  const ch = chislaN14(p);
  const lev = `\\log_{${p.q}}^2(${ch.M}x)${chlen(ch.A, `\\log_{${p.q}}x`)}${chlen(ch.B, '')}=0`;
  const kT = ch.korni.map((k) => ratTex(k.x));
  const vT = ch.vybor.map((k) => ratTex(k.x));
  const pole = (s: string) => s.replace(/\\dfrac/g, '\\frac');
  const b2 = 2 * p.s + ch.A;
  const c2 = p.s * p.s + ch.B;
  const kv = `t^2${chlen(b2, 't')}${chlen(c2, '')}=0`;
  const otrezok = `\\left[${dec(p.lo)};\\ ${dec(p.hi)}\\right]`;
  const sravn = ch.korni.map((k) => {
    const x = ch.v(k.x);
    const vnutri = x >= p.lo - 1e-12 && x <= p.hi + 1e-12;
    return `$${ratTex(k.x)}${vnutri ? '\\in' : '\\notin'}${otrezok}$`;
  });
  return {
    no: 14,
    shablon: 'n14.logKvadrat',
    uslovie: `а) Решите уравнение $${lev}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $${otrezok}$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Корни уравнения', pole: { vid: 'korni', verno: kT.map(pole) } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vT.map(pole) } },
    ],
    otvet: `а) $${kT.join(';\\ ')}$; б) ${vT.length === 0 ? 'корней нет' : `$${vT.join(';\\ ')}$`}`,
    reshenie: [
      {
        title: 'ОДЗ и замена',
        lines: [
          `Уравнение имеет смысл при $x>0$. На ОДЗ $\\log_{${p.q}}(${ch.M}x)=\\log_{${p.q}}${ch.M}+\\log_{${p.q}}x=${p.s}+\\log_{${p.q}}x$.`,
          `Обозначим $t=\\log_{${p.q}}x$: $(t+${p.s})^2${chlen(ch.A, 't')}${chlen(ch.B, '')}=0$, то есть $${kv}$.`,
        ],
      },
      {
        title: 'Квадратное уравнение',
        lines: [
          `По теореме Виета (или через дискриминант) $t_1=${Math.min(p.t1, p.t2)}$, $t_2=${Math.max(p.t1, p.t2)}$: их сумма равна $${-b2}$, произведение — $${c2}$.`,
          `Обратная замена: $\\log_{${p.q}}x=${ch.korni[0]!.t}$ или $\\log_{${p.q}}x=${ch.korni[1]!.t}$, откуда $x=${kT[0]}$ или $x=${kT[1]}$. Оба числа положительны — входят в ОДЗ.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `${sravn.join(', ')}.`,
          `Ответ: а) $${kT.join(';\\ ')}$; б) ${vT.length === 0 ? 'корней на отрезке нет' : `$${vT.join(';\\ ')}$`}.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'ОДЗ', formula: 'x>0' },
      { slovo: 'Логарифм произведения — сумма', formula: `\\log_{${p.q}}(${ch.M}x)=${p.s}+t` },
      { slovo: 'Квадратное уравнение', formula: kv },
      { slovo: 'Обратная замена и отбор', formula: kT.join(';\\ ') },
    ],
    kontrol: {
      korni: ch.korni.map((k) => ch.v(k.x)),
      vybor: ch.vybor.map((k) => ch.v(k.x)),
    },
  };
}

export const N14_LOG_KVADRAT: Shablon2<PN14> = {
  no: 14,
  prototip:
    'Квадрат логарифма произведения: log_q(Mx) = s + log_q x, квадратное по t, отбор степеней на отрезке',
  sobrat,
};
