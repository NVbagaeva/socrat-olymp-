/**
 * №16 (варианты 19–20): дробь с квадратным трёхчленом от логарифма.
 *
 * (log²_q x − S·log_q x + P)/(x − d) ∨ 0, S = α + β, P = αβ (α < β целые):
 * числитель (t − α)(t − β), t = log_q x, обращается в нуль при x = q^α
 * и x = q^β; знаменатель — при x = d. ОДЗ x > 0. Метод интервалов.
 */

import { rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PK16 {
  q: number;
  al: number;
  be: number;
  /** Нуль знаменателя (натуральное). */
  d: number;
  znak: 'le' | 'ge';
}

const stepen = (q: number, e: number): Rat => (e >= 0 ? rat(q ** e) : rat(1, q ** -e));

export function chislaK16(p: PK16) {
  if (!(p.al < p.be)) throw new Error('k16: α < β');
  const x1 = stepen(p.q, p.al);
  const x2 = stepen(p.q, p.be);
  const dR = rat(p.d);
  const vse = [
    { x: x1, nul: true },
    { x: x2, nul: true },
    { x: dR, nul: false },
  ].sort((a, b) => toNumber(a.x) - toNumber(b.x));
  if (new Set(vse.map((t) => toNumber(t.x))).size !== 3) throw new Error('k16: точки совпадают');
  const f = (x: number) => {
    const t = Math.log(x) / Math.log(p.q);
    return ((t - p.al) * (t - p.be)) / (x - p.d);
  };
  const nado = (v: number) => (p.znak === 'le' ? v < 0 : v > 0);
  /* Атомы: интервалы между 0, точками, +∞ и сами точки; затем склейка. */
  type Atom = { tochka: boolean; lo: number; hi: number; vhodit: boolean };
  const g = vse.map((t) => toNumber(t.x));
  const atomy: Atom[] = [];
  const kraya = [0, ...g, Infinity];
  for (let i = 0; i < kraya.length - 1; i += 1) {
    const L = kraya[i]!;
    const R = kraya[i + 1]!;
    if (i > 0) atomy.push({ tochka: true, lo: L, hi: L, vhodit: vse[i - 1]!.nul });
    const mid = R === Infinity ? 2 * L + 1 : (L + R) / 2;
    atomy.push({ tochka: false, lo: L, hi: R, vhodit: nado(f(mid)) });
  }
  const tex = (v: number) => {
    const t = vse.find((u) => toNumber(u.x) === v);
    return t === undefined ? '0' : ratTex(t.x);
  };
  const kuski: Kus[] = [];
  let i = 0;
  while (i < atomy.length) {
    if (!atomy[i]!.vhodit) {
      i += 1;
      continue;
    }
    const nach = atomy[i]!;
    let j = i;
    while (j + 1 < atomy.length && atomy[j + 1]!.vhodit) j += 1;
    const kon = atomy[j]!;
    kuski.push({
      lo: { tex: tex(nach.lo), v: nach.lo },
      hi: kon.hi === Infinity ? null : { tex: tex(kon.hi), v: kon.hi },
      loZ: nach.tochka,
      hiZ: kon.tochka,
    });
    i = j + 1;
  }
  return { x1, x2, dR, vse, kuski, f };
}

function sobrat(p: PK16): Chast2Zadacha {
  const ch = chislaK16(p);
  const S = p.al + p.be;
  const P = p.al * p.be;
  const L = `\\log_{${p.q}}`;
  const chl = (k: number, s: string) =>
    k === 0 ? '' : `${k > 0 ? '+' : '-'}${Math.abs(k) === 1 ? '' : Math.abs(k)}${s}`;
  const chisl = `${L}^2x${chl(-S, `${L}x`)}${P === 0 ? '' : P > 0 ? `+${P}` : `${P}`}`;
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const ner = `\\dfrac{${chisl}}{x-${p.d}}${zn}0`;
  const otv = mnozhTex(ch.kuski);
  const mn = (a: number) => `\\left(t${a > 0 ? '-' : '+'}${Math.abs(a)}\\right)`;
  const razl = `${p.al === 0 ? 't' : mn(p.al)}${p.be === 0 ? 't' : mn(p.be)}`;
  return {
    no: 16,
    shablon: 'k16.logDrob',
    uslovie: `Решите неравенство $${ner}$.`,
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
        title: 'ОДЗ и замена',
        lines: [
          `Логарифм определён при $x>0$; знаменатель не равен нулю: $x\\ne${p.d}$.`,
          `Пусть $t=${L}x$. Числитель $t^2${chl(-S, 't')}${P === 0 ? '' : P > 0 ? `+${P}` : `${P}`}=${razl}$ обращается в нуль при $t=${p.al}$ и $t=${p.be}$, то есть при $x=${ratTex(ch.x1)}$ и $x=${ratTex(ch.x2)}$.`,
        ],
      },
      {
        title: 'Знаки множителей',
        lines: [
          `Функция $${L}x$ возрастает, поэтому числитель положителен при $0<x<${ratTex(ch.x1)}$ и при $x>${ratTex(ch.x2)}$, отрицателен между этими числами.`,
          `Знаменатель $x-${p.d}$ отрицателен при $x<${p.d}$ и положителен при $x>${p.d}$.`,
        ],
      },
      {
        title: 'Метод интервалов',
        lines: [
          `Отмечаем на луче $x>0$ точки $${ch.vse.map((t) => ratTex(t.x)).join(',\\ ')}$; знак дроби — произведение знаков числителя и знаменателя. Нули числителя входят в ответ (неравенство нестрогое), точка $x=${p.d}$ — нет.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'ОДЗ', formula: `x>0,\\ x\\ne${p.d}` },
      { slovo: 'Замена и разложение числителя', formula: razl },
      { slovo: 'Нули числителя', formula: `x=${ratTex(ch.x1)},\\ x=${ratTex(ch.x2)}` },
      { slovo: 'Ответ методом интервалов', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const K16_LOG_DROB: Shablon2<PK16> = {
  no: 16,
  prototip:
    'Дробь: квадратный трёхчлен от логарифма над линейным знаменателем, метод интервалов на луче x > 0',
  sobrat,
};
