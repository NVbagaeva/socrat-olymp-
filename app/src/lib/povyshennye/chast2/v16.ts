/**
 * №16 (варианты 3–4): √(x − a)·(log_q x − c) ≥ 0 (≤ 0).
 *
 * Область: x ≥ a и x > 0 (a > 0). x = a — решение всегда (корень равен
 * нулю). При x > a знак задаёт логарифм: log_q x − c ≥ 0 ⇔ x ≥ q^c.
 */

import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PV16 {
  a: number;
  q: number;
  c: number;
  znak: 'ge' | 'le';
}

export function chislaV16(p: PV16) {
  if (!(p.a > 0 && p.q > 1 && p.c >= 1)) throw new Error('v16: данные');
  const t = p.q ** p.c;
  if (t === p.a) throw new Error('v16: совпадение');
  const A = { tex: String(p.a), v: p.a };
  const T = { tex: String(t), v: t };
  const kuski: Kus[] = [];
  if (p.znak === 'ge') {
    if (t > p.a) {
      kuski.push({ lo: A, hi: A, loZ: true, hiZ: true });
      kuski.push({ lo: T, hi: null, loZ: true, hiZ: false });
    } else kuski.push({ lo: A, hi: null, loZ: true, hiZ: false });
  } else if (t > p.a) kuski.push({ lo: A, hi: T, loZ: true, hiZ: true });
  else kuski.push({ lo: A, hi: A, loZ: true, hiZ: true });
  return { t, kuski };
}

function sobrat(p: PV16): Chast2Zadacha {
  const ch = chislaV16(p);
  const zn = p.znak === 'ge' ? '\\ge' : '\\le';
  const ner = `\\sqrt{x-${p.a}}\\cdot\\left(\\log_{${p.q}}x-${p.c}\\right)${zn}0`;
  const otv = mnozhTex(ch.kuski);
  const usl = p.znak === 'ge' ? `x\\ge${ch.t}` : `x\\le${ch.t}`;
  return {
    no: 16,
    shablon: 'v16.korenLog',
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
        title: 'Область',
        lines: [`Корень определён при $x\\ge${p.a}$, логарифм — при $x>0$; область $x\\ge${p.a}$.`],
      },
      {
        title: 'Точка $x=a$',
        lines: [`При $x=${p.a}$ корень равен нулю, неравенство выполнено: $x=${p.a}$ — решение.`],
      },
      {
        title: 'При $x>a$',
        lines: [
          `Корень положителен, знак произведения совпадает со знаком $\\log_{${p.q}}x-${p.c}$. Так как $${p.c}=\\log_{${p.q}}${ch.t}$ и основание больше $1$: $\\log_{${p.q}}x${zn}${p.c}\\iff ${usl}$.`,
          `С учётом $x>${p.a}$ и точки $x=${p.a}$ получаем $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Область', formula: `x\\ge${p.a}` },
      { slovo: 'Корень равен нулю — решение', formula: `x=${p.a}` },
      { slovo: 'Иначе знак у логарифма', formula: usl },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const V16_KOREN_LOG: Shablon2<PV16> = {
  no: 16,
  prototip:
    'Корень, умноженный на логарифмическую разность: область, точка нуля корня, монотонность логарифма',
  sobrat,
};
