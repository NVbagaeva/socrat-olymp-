/**
 * №16 (варианты 1–2): (qˣ − q^b)·|x − a| ≥ 0 (или ≤ 0).
 *
 * Модуль неотрицателен: знак произведения задаёт показательный
 * множитель, а точка x = a подходит всегда. Ловушка — потерять
 * изолированную точку x = a по ту сторону от b.
 */

import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PU16 {
  /** Основание q > 1 (2, 3, 5). */
  q: number;
  /** Показатель b: q^b — целое. */
  b: number;
  /** Точка модуля a ≠ b. */
  a: number;
  znak: 'ge' | 'le';
}

export function chislaU16(p: PU16) {
  if (!(p.q > 1 && Number.isInteger(p.q))) throw new Error('u16: основание');
  if (!(p.b >= 0 && Number.isInteger(p.b))) throw new Error('u16: показатель');
  if (p.a === p.b) throw new Error('u16: точки совпадают');
  const c = p.q ** p.b;
  const B = { tex: String(p.b), v: p.b };
  const A = { tex: String(p.a), v: p.a };
  const kuski: Kus[] = [];
  if (p.znak === 'ge') {
    if (p.a < p.b) kuski.push({ lo: A, hi: A, loZ: true, hiZ: true });
    kuski.push({ lo: B, hi: null, loZ: true, hiZ: false });
  } else {
    kuski.push({ lo: null, hi: B, loZ: false, hiZ: true });
    if (p.a > p.b) kuski.push({ lo: A, hi: A, loZ: true, hiZ: true });
  }
  return { c, kuski, izol: p.znak === 'ge' ? p.a < p.b : p.a > p.b };
}

function sobrat(p: PU16): Chast2Zadacha {
  const ch = chislaU16(p);
  const zn = p.znak === 'ge' ? '\\ge' : '\\le';
  const modul = p.a === 0 ? '|x|' : `|x${p.a > 0 ? '-' : '+'}${Math.abs(p.a)}|`;
  const ner = `\\left(${p.q}^{x}-${ch.c}\\right)\\cdot${modul}${zn}0`;
  const otv = mnozhTex(ch.kuski);
  const pokaz =
    p.znak === 'ge'
      ? `${p.q}^x\\ge${ch.c}\\iff x\\ge${p.b}`
      : `${p.q}^x\\le${ch.c}\\iff x\\le${p.b}`;
  return {
    no: 16,
    shablon: 'u16.pokazModul',
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
        title: 'Точка, где модуль равен нулю',
        lines: [
          `При $x=${p.a}$ второй множитель равен нулю, произведение равно нулю — неравенство выполнено. Значит, $x=${p.a}$ — решение.`,
        ],
      },
      {
        title: 'Остальные $x$',
        lines: [
          `При $x\\ne${p.a}$ модуль положителен, и на него можно разделить: $${p.q}^x-${ch.c}${zn}0$. Так как $${ch.c}=${p.q}^{${p.b}}$ и функция $y=${p.q}^x$ возрастает (основание больше $1$), $${pokaz}$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          ch.izol
            ? `Точка $x=${p.a}$ не входит в найденный луч, её нужно добавить отдельно: $${otv}$.`
            : `Точка $x=${p.a}$ уже лежит в найденном луче: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Модуль неотрицателен: точка, где он равен нулю, — решение', formula: `x=${p.a}` },
      { slovo: 'Иначе делим на модуль', formula: pokaz },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), c: ch.c },
  };
}

export const U16_POKAZ_MODUL: Shablon2<PU16> = {
  no: 16,
  prototip:
    'Произведение показательного множителя и модуля: знак по показательному, изолированная точка нуля модуля',
  sobrat,
};
