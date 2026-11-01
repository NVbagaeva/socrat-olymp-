/**
 * №16 (варианты 29–30): (x − s)(x − t)·log_q(x + c) ⋚ 0, q = qn/qd ≠ 1.
 *
 * ОДЗ: x > −c. Знак log_q(x + c) совпадает со знаком (q − 1)(x + c − 1)
 * (логарифм равен нулю при x = 1 − c, монотонен). Метод интервалов по
 * точкам s, t, 1 − c на ОДЗ.
 */

import { kuskiKontrol, kuskiPole, kuskiTex, reshitZnaki, ZNAK_TEX, type Znak } from './nZnaki';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PQ16 {
  s: number;
  t: number;
  c: number;
  /** Основание q = qn/qd. */
  qn: number;
  qd: number;
  znak: Znak;
}

export function chislaQ16(p: PQ16) {
  const q = p.qn / p.qd;
  const f = (x: number) =>
    x <= -p.c + 1e-12 ? Number.NaN : (x - p.s) * (x - p.t) * (Math.log(x + p.c) / Math.log(q));
  const kuski = reshitZnaki(f, [p.s, p.t, 1 - p.c, -p.c], p.znak);
  return { q, f, kuski };
}

const skob = (k: number) => (k === 0 ? 'x' : k > 0 ? `(x-${k})` : `(x+${-k})`);
const plus = (k: number) => (k === 0 ? '' : k > 0 ? `+${k}` : `${k}`);

function sobrat(p: PQ16): Chast2Zadacha {
  if (p.qn === p.qd || p.s === p.t) throw new Error('q16: параметры');
  const ch = chislaQ16(p);
  if (ch.kuski.length === 0) throw new Error('q16: пусто');
  const qT = p.qd === 1 ? String(p.qn) : `\\frac{${p.qn}}{${p.qd}}`;
  const mn = p.s === -p.t ? `\\left(x^2-${p.s * p.s}\\right)` : `${skob(p.s)}${skob(p.t)}`;
  const zn = ZNAK_TEX[p.znak];
  const ner = `${mn}\\log_{${qT}}(x${plus(p.c)})${zn}0`;
  const otv = kuskiTex(ch.kuski);
  const bolshe = ch.q > 1;
  const ekv = `${skob(p.s)}${skob(p.t)}${skob(1 - p.c)}${bolshe ? '' : '\\cdot(-1)'}${zn}0`;
  return {
    no: 16,
    shablon: 'q16.logMnozhitel',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: kuskiPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      { title: 'ОДЗ', lines: [`$x${plus(p.c)}>0$, то есть $x>${-p.c}$.`] },
      {
        title: 'Знак логарифма',
        lines: [
          `$\\log_{${qT}}(x${plus(p.c)})=0$ при $x=${1 - p.c}$. Основание ${bolshe ? 'больше' : 'меньше'} $1$, функция ${bolshe ? 'возрастает' : 'убывает'}: логарифм ${bolshe ? 'положителен' : 'отрицателен'} при $x>${1 - p.c}$ и ${bolshe ? 'отрицателен' : 'положителен'} при $${-p.c}<x<${1 - p.c}$.`,
          `Значит, на ОДЗ неравенство равносильно $${ekv}$ — множитель $\\log$ заменён выражением того же знака.`,
        ],
      },
      {
        title: 'Метод интервалов',
        lines: [
          `Отмечаем на луче $x>${-p.c}$ точки $${[...new Set([p.s, p.t, 1 - p.c])]
            .filter((x) => x > -p.c)
            .sort((a, b) => a - b)
            .join(
              ';\\ ',
            )}$ и расставляем знаки.${[p.s, p.t].some((x) => x <= -p.c) ? ` Точки вне ОДЗ в ответ не входят.` : ''}`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'ОДЗ', formula: `x>${-p.c}` },
      { slovo: 'Логарифм равен нулю', formula: `x=${1 - p.c}` },
      { slovo: 'Замена множителя тем же знаком', formula: ekv },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: kuskiKontrol(ch.kuski) },
  };
}

export const Q16_LOG_MNOZHITEL: Shablon2<PQ16> = {
  no: 16,
  prototip:
    'Произведение многочлена на логарифм: знак логарифма как у (q − 1)(x + c − 1), метод интервалов на ОДЗ',
  sobrat,
};
