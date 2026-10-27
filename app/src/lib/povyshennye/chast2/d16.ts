/**
 * №16 (варианты 7–8): log_{b₁}(log_{b₂}(px + q)) ⋚ 0, основания вида
 * √m ± k (или натуральное). Внешний логарифм сравнивается с нулём:
 * внутренний больше 1 или лежит между 0 и 1 — в зависимости от знака
 * и основания b₁; затем внутренний сравнивается с 0 и 1, и линейное
 * неравенство даёт промежуток с концами (c − q)/p, c ∈ {0, 1, b₂}.
 */

import type { Mnozhestvo } from '@/lib/chast2/sravnenie';
import { add, div, mul, neg, rat, toNumber } from '@/lib/zadanie15/core/rational';
import { sKornem, skTex, skToNumber, type SKornem } from './chisla';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

/** Основание: √m + k (k может быть отрицательным) или натуральное число. */
export interface Osn {
  m: number;
  k: number;
}

export interface PD16 {
  b1: Osn;
  b2: Osn;
  p: number;
  q: number;
  znak: 'ge' | 'le';
}

const osnVal = (o: Osn): SKornem =>
  o.m === 0 ? { u: rat(o.k), k: rat(0), m: 1n } : sKornem(rat(o.k), rat(o.m), 1);

function osnTex(o: Osn): string {
  if (o.m === 0) return `${o.k}`;
  return `\\sqrt{${o.m}}${o.k === 0 ? '' : o.k > 0 ? `+${o.k}` : `${o.k}`}`;
}

/** x = (c − q)/p для c = u + k√m. */
function xIz(c: SKornem, p: PD16): SKornem {
  return { u: div(add(c.u, rat(-p.q)), rat(p.p)), k: div(c.k, rat(p.p)), m: c.m };
}

interface Kon {
  x: SKornem;
  z: boolean;
}

export function otvetD16(p: PD16): {
  lo: Kon;
  hi: Kon;
  yLo: string;
  yHi: string;
  vnutr: 'ge1' | 'mezhdu';
} {
  const b1 = skToNumber(osnVal(p.b1));
  const b2v = osnVal(p.b2);
  const b2 = skToNumber(b2v);
  if (b1 <= 0 || b1 === 1 || b2 <= 0 || b2 === 1) throw new Error('d16: основание');
  const ge = p.znak === 'ge';
  /* Внутренний L: L ≥ 1 или 0 < L ≤ 1. */
  const vnutr: 'ge1' | 'mezhdu' = b1 > 1 === ge ? 'ge1' : 'mezhdu';
  const nol: SKornem = { u: rat(0), k: rat(0), m: 1n };
  const odin: SKornem = { u: rat(1), k: rat(0), m: 1n };
  /* y = px + q на промежутке (yLo; yHi] и т. п. */
  let lo: Kon;
  let hi: Kon;
  let yLo: string;
  let yHi: string;
  if (vnutr === 'ge1') {
    if (b2 > 1) {
      lo = { x: b2v, z: true };
      hi = { x: { u: rat(10n ** 9n), k: rat(0), m: 1n }, z: false };
      yLo = `y\\ge${osnTex(p.b2)}`;
      yHi = '';
    } else {
      lo = { x: nol, z: false };
      hi = { x: b2v, z: true };
      yLo = `0<y\\le${osnTex(p.b2)}`;
      yHi = '';
    }
  } else if (b2 > 1) {
    lo = { x: odin, z: false };
    hi = { x: b2v, z: true };
    yLo = `1<y\\le${osnTex(p.b2)}`;
    yHi = '';
  } else {
    lo = { x: b2v, z: true };
    hi = { x: odin, z: false };
    yLo = `${osnTex(p.b2)}\\le y<1`;
    yHi = '';
  }
  /* Переход к x: y = px + q; при p < 0 концы меняются местами. */
  const xl = { x: xIz(lo.x, p), z: lo.z };
  const xh = { x: xIz(hi.x, p), z: hi.z };
  if (toNumber(lo.x.u) > 1e8) throw new Error('d16: неограниченный ответ не поддержан');
  return p.p > 0 ? { lo: xl, hi: xh, yLo, yHi, vnutr } : { lo: xh, hi: xl, yLo, yHi, vnutr };
}

const kT = (x: SKornem) => skTex(x);

function sobrat(p: PD16): Chast2Zadacha {
  const o = otvetD16(p);
  const b1 = skToNumber(osnVal(p.b1));
  const b2 = skToNumber(osnVal(p.b2));
  const lin = `${p.p === 1 ? '' : p.p === -1 ? '-' : p.p}x${p.q === 0 ? '' : p.q > 0 ? `+${p.q}` : `${p.q}`}`;
  const linR =
    p.q === 0
      ? `${p.p}x`
      : `${p.q}${p.p > 0 ? '+' : '-'}${Math.abs(p.p) === 1 ? '' : Math.abs(p.p)}x`;
  const linShow = p.p < 0 ? linR : lin;
  const zn = p.znak === 'ge' ? '\\ge' : '\\le';
  const ner = `\\log_{${osnTex(p.b1)}}\\left(\\log_{${osnTex(p.b2)}}\\left(${linShow}\\right)\\right)${zn}0`;
  const otv = `\\left${o.lo.z ? '[' : '('}${kT(o.lo.x)};\\ ${kT(o.hi.x)}\\right${o.hi.z ? ']' : ')'}`;
  const pole: Mnozhestvo = {
    kuski: [{ t: 'interval', lo: kT(o.lo.x), loZakr: o.lo.z, hi: kT(o.hi.x), hiZakr: o.hi.z }],
  };
  const L = `\\log_{${osnTex(p.b2)}}\\left(${linShow}\\right)`;
  const sravn = (b: number, t: string) => `$${t}${b > 1 ? '>' : '<'}1$`;
  const b1t = osnTex(p.b1);
  const b2t = osnTex(p.b2);
  const vnutrTex = o.vnutr === 'ge1' ? `${L}\\ge1` : `0<${L}\\le1`;
  const yTex =
    o.vnutr === 'ge1'
      ? b2 > 1
        ? `${linShow}\\ge${b2t}`
        : `0<${linShow}\\le${b2t}`
      : b2 > 1
        ? `1<${linShow}\\le${b2t}`
        : `${b2t}\\le ${linShow}<1`;

  return {
    no: 16,
    shablon: 'd16.logLog',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество решений', pole: { vid: 'promezhutki', verno: pole } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Внешний логарифм',
        lines: [
          `${sravn(b1, b1t)}, поэтому функция $y=\\log_{${b1t}}t$ ${b1 > 1 ? 'возрастает' : 'убывает'}; $0=\\log_{${b1t}}1$. Неравенство равносильно ${o.vnutr === 'ge1' ? 'условию' : 'двойному неравенству'} $${vnutrTex}$ (условие $${L}>0$ — область определения внешнего логарифма).`,
        ],
      },
      {
        title: 'Внутренний логарифм',
        lines: [
          `${sravn(b2, b2t)}, функция $y=\\log_{${b2t}}t$ ${b2 > 1 ? 'возрастает' : 'убывает'}; $1=\\log_{${b2t}}\\left(${b2t}\\right)$, $0=\\log_{${b2t}}1$.`,
          `Получаем $${yTex}$.`,
        ],
      },
      {
        title: 'Решаем линейное неравенство',
        lines: [
          `${p.p < 0 ? `Делим на $${p.p}<0$ — знаки неравенства меняются: ` : ''}$x\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Сравниваем внешний логарифм с $\\log 1$', formula: vnutrTex },
      { slovo: 'Сравниваем внутренний логарифм с 0 и 1', formula: yTex },
      { slovo: 'Решаем линейное неравенство', formula: otv },
    ],
    utochnenie: { u: 'граничных точек' },
    kontrol: {
      lo: skToNumber(o.lo.x),
      hi: skToNumber(o.hi.x),
      loZ: o.lo.z,
      hiZ: o.hi.z,
    },
  };
}

void mul;
void neg;
void ratTex;

export const D16_LOG_LOG: Shablon2<PD16> = {
  no: 16,
  prototip: 'Логарифм от логарифма с иррациональными основаниями: сравнение с 0 и 1',
  sobrat,
};
