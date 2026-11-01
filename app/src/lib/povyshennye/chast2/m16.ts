/**
 * №16 (варианты 23–24): группировка показательных и логарифмических
 * множителей.
 *
 * q^x·log_p x − d·q^x − c·log_p x + c·d ∨ 0, c = q^e, ⇔
 * (q^x − c)(log_p x − d) ∨ 0, x > 0. Оба множителя возрастают; нули:
 * x₁ = e (q^x = c) и x₂ = p^d. «le»: между нулями; «ge»: вне них.
 */

import { rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PM16 {
  q: number;
  e: number;
  p: number;
  d: number;
  znak: 'le' | 'ge';
}

const stepen = (b: number, k: number): Rat => (k >= 0 ? rat(b ** k) : rat(1, b ** -k));

export function chislaM16(p: PM16) {
  if (!(p.e >= 1) || !(p.p > 1) || !(p.q > 1)) throw new Error('m16: параметры');
  const c = p.q ** p.e;
  const x1 = rat(p.e);
  const x2 = stepen(p.p, p.d);
  if (toNumber(x1) === toNumber(x2)) throw new Error('m16: нули совпадают');
  const [lo, hi] = toNumber(x1) < toNumber(x2) ? [x1, x2] : [x2, x1];
  const K = (r: Rat) => ({ tex: ratTex(r), v: toNumber(r) });
  const kuski: Kus[] =
    p.znak === 'le'
      ? [{ lo: K(lo), hi: K(hi), loZ: true, hiZ: true }]
      : [
          { lo: { tex: '0', v: 0 }, hi: K(lo), loZ: false, hiZ: true },
          { lo: K(hi), hi: null, loZ: true, hiZ: false },
        ];
  return { c, x1, x2, lo, hi, kuski };
}

function sobrat(p: PM16): Chast2Zadacha {
  const ch = chislaM16(p);
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const L = `\\log_{${p.p}}x`;
  const dT = p.d < 0 ? `(${p.d})` : `${p.d}`;
  const chl = (k: number, s: string) =>
    k === 0 ? '' : `${k > 0 ? '+' : '-'}${Math.abs(k) === 1 ? '' : `${Math.abs(k)}\\cdot`}${s}`;
  const ner = `${p.q}^x\\cdot${L}${chl(-p.d, `${p.q}^x`)}-${ch.c}\\cdot${L}${ch.c * p.d >= 0 ? '+' : '-'}${Math.abs(ch.c * p.d)}${zn}0`;
  const otv = mnozhTex(ch.kuski);
  return {
    no: 16,
    shablon: 'm16.gruppirovka',
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
        title: 'Группировка',
        lines: [
          `ОДЗ: $x>0$. Группируем: $${p.q}^x\\left(${L}-${dT}\\right)-${ch.c}\\left(${L}-${dT}\\right)=\\left(${p.q}^x-${ch.c}\\right)\\left(${L}-${dT}\\right)$.`,
          `Неравенство: $\\left(${p.q}^x-${ch.c}\\right)\\left(${L}-${dT}\\right)${zn}0$.`,
        ],
      },
      {
        title: 'Знаки множителей',
        lines: [
          `$${p.q}^x-${ch.c}$ возрастает и обращается в нуль при $x=${p.e}$ ($${ch.c}=${p.q}^{${p.e}}$).`,
          `$${L}-${dT}$ возрастает и обращается в нуль при $x=${p.p}^{${p.d}}=${ratTex(ch.x2)}$.`,
        ],
      },
      {
        title: 'Метод интервалов',
        lines: [
          `Слева от меньшего нуля оба множителя отрицательны, справа от большего — оба положительны: произведение положительно; между нулями — отрицательно.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Группируем слагаемые',
        formula: `\\left(${p.q}^x-${ch.c}\\right)\\left(${L}-${dT}\\right)${zn}0`,
      },
      { slovo: 'Нули множителей', formula: `x=${p.e},\\ x=${ratTex(ch.x2)}` },
      { slovo: 'Оба множителя возрастают', formula: '\\text{знаки: }+,\\ -,\\ +' },
      { slovo: 'Ответ с учётом $x>0$', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), c: ch.c },
  };
}

export const M16_GRUPPIROVKA: Shablon2<PM16> = {
  no: 16,
  prototip:
    'Показательно-логарифмическое неравенство: группировка в произведение (q^x − c)(log_p x − d), метод интервалов',
  sobrat,
};
