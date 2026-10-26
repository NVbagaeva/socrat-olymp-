/**
 * №16: дробное показательное неравенство с корнем в числителе.
 *
 * (q^{2x+1} + x − s√x − t)/(q^{2x} − q^e) ≥ q. После переноса q
 * показательная часть числителя сокращается, остаётся квадратный
 * трёхчлен от √x с корнями y₁ < y₂, а знаменатель меняет знак в
 * x₀ = e/2, причём y₁² < x₀ < y₂². Ответ — [y₁²; x₀) ∪ [y₂²; +∞),
 * как в образце.
 */

import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface P16 {
  /** Основание: 2, 3 или 5. */
  q: number;
  /** Показатель в знаменателе: q^{2x} = q^e при x₀ = e/2 (e нечётное). */
  e: number;
  y1: number;
  y2: number;
}

export function chisla16(p: P16) {
  const s = p.y1 + p.y2;
  const t = p.q ** (p.e + 1) - p.y1 * p.y2;
  const x0 = p.e / 2;
  return { s, t, x0, Q: p.q * p.q, R: p.q ** p.e };
}

function sobrat(p: P16): Chast2Zadacha {
  const { s, t, x0, Q, R } = chisla16(p);
  const a = p.y1 * p.y1;
  const b = p.y2 * p.y2;
  if (!(a < x0 && x0 < b) || t <= 0 || p.e % 2 === 0) throw new Error('z16: не та структура');
  const c0 = p.y1 * p.y2;
  const x0t = dec(x0);
  const sx = s === 1 ? '' : String(s);
  const drob = `\\dfrac{${p.q}^{2x+1}+x-${sx}\\sqrt x-${t}}{${Q}^x-${R}}`;
  const vychet = `${p.q}^{2x+1}+x-${sx}\\sqrt x-${t}-${p.q}\\cdot${Q}^x+${p.q * R}`;
  const kv = `x-${sx}\\sqrt x+${c0}`;
  const mn = `\\left(\\sqrt x-${p.y1}\\right)\\left(\\sqrt x-${p.y2}\\right)`;
  const otvet = `\\left[${a};\\ ${x0t}\\right)\\cup\\left[${b};\\ +\\infty\\right)`;

  return {
    no: 16,
    shablon: 'z16.pokazKoren',
    uslovie: `Решите неравенство $${drob}\\ge ${p.q}.$`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: {
          vid: 'promezhutki',
          verno: {
            kuski: [
              {
                t: 'interval',
                lo: String(a),
                loZakr: true,
                hi: x0t.replace('{,}', ','),
                hiZakr: false,
              },
              { t: 'interval', lo: String(b), loZakr: true, hi: 'inf', hiZakr: false },
            ],
          },
        },
      },
    ],
    otvet: `$${otvet}$`,
    reshenie: [
      {
        title: 'Область определения',
        lines: [
          `Корень определён при $x\\ge0$. Знаменатель не равен нулю: $${Q}^x=${p.q}^{2x}\\ne${p.q}^{${p.e}}$, то есть $x\\ne${x0t}$.`,
        ],
      },
      {
        title: 'Переносим правую часть',
        lines: [
          `$\\dfrac{${vychet}}{${Q}^x-${R}}\\ge0$. Так как $${p.q}\\cdot${Q}^x=${p.q}^{2x+1}$, показательные слагаемые числителя сокращаются:`,
          `$\\dfrac{${kv}}{${p.q}^{2x}-${p.q}^{${p.e}}}\\ge0$.`,
        ],
      },
      {
        title: 'Раскладываем числитель',
        lines: [
          `Числитель — квадратный трёхчлен относительно $\\sqrt x$ с корнями $${p.y1}$ и $${p.y2}$ (по теореме Виета: $${p.y1}+${p.y2}=${s}$, $${p.y1}\\cdot${p.y2}=${c0}$):`,
          `$\\dfrac{${mn}}{${p.q}^{2x}-${p.q}^{${p.e}}}\\ge0$.`,
        ],
      },
      {
        title: 'Знак знаменателя',
        lines: [
          `Функция $y=${p.q}^{u}$ возрастает, поэтому $${p.q}^{2x}-${p.q}^{${p.e}}>0$ при $x>${x0t}$ и $<0$ при $x<${x0t}$.`,
        ],
      },
      {
        title: `Случай $x>${x0t}$`,
        lines: [
          `Знаменатель положителен, нужно $${mn}\\ge0$. Здесь $\\sqrt x>\\sqrt{${x0t}}>${p.y1}$, первый множитель положителен, поэтому $\\sqrt x\\ge${p.y2}$, $x\\ge${b}$.`,
        ],
      },
      {
        title: `Случай $0\\le x<${x0t}$`,
        lines: [
          `Знаменатель отрицателен, нужно $${mn}\\le0$. Здесь $\\sqrt x<\\sqrt{${x0t}}<${p.y2}$, второй множитель отрицателен, поэтому $\\sqrt x\\ge${p.y1}$, $${a}\\le x<${x0t}$.`,
        ],
      },
      { title: 'Ответ', lines: [`$x\\in${otvet}$.`] },
    ],
    razbor: [
      {
        slovo: 'Область определения: $x\\ge0$ и знаменатель не ноль',
        formula: `x\\ge0,\\ x\\ne${x0t}`,
      },
      {
        slovo: 'Переносим правую часть — показательные слагаемые сокращаются',
        formula: `\\dfrac{${kv}}{${Q}^x-${R}}\\ge0`,
      },
      { slovo: 'Раскладываем числитель как трёхчлен от √x', formula: mn },
      {
        slovo: 'Разбираем два случая по знаку знаменателя',
        formula: `x>${x0t}\\Rightarrow x\\ge${b};\\quad x<${x0t}\\Rightarrow x\\ge${a}`,
      },
      { slovo: 'Собираем ответ', formula: otvet },
    ],
    utochnenie: { u: `точки ${a} и/или ${b}` },
    kontrol: { a, x0, b },
  };
}

export const Z16_POKAZ_KOREN: Shablon2<P16> = {
  no: 16,
  prototip: 'Показательная дробь с √x в числителе: сокращение, трёхчлен от √x, два случая',
  sobrat,
};
