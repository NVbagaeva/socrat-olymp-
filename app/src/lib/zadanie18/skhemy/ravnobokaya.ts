/**
 * Схема 18. Равнобедренная трапеция.
 *
 * Трапеция симметрична относительно оси y: A = (−a, 0), D = (a, 0),
 * B = (−b, h), C = (b, h). Тянутся D (полуоснование a) и C (b и h).
 * Если боковая сторона почти равна средней линии, C «примагничивается»
 * к положению, где в трапецию можно вписать окружность.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import { chisloTeX, dist } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const MAGNIT = 0.12;

export function tochkiRavnobokoy(t: Tochki) {
  const a = t.D![0];
  const b = t.C![0];
  const h = t.C![1];
  const A: T2 = [-a, 0];
  const D: T2 = [a, 0];
  const B: T2 = [-b, h];
  const C: T2 = [b, h];
  const H: T2 = [-b, 0];
  const H2: T2 = [b, 0];
  const bok = dist(A, B);
  const vpisana = Math.abs(bok - (a + b)) < 1e-6;
  return { A, B, C, D, H, H2, a, b, h, bok, vpisana };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, D, H, H2, a, b, h, bok, vpisana } = tochkiRavnobokoy(t);
  const el: Element[] = [
    mnog('f-abh', [A, B, H], { gruppy: ['proekcii'], cvet: 'b' }),
    okr('vp', [0, h / 2], h / 2, { skrytyy: !vpisana, gruppy: ['vpisannaya'], cvet: 'c' }),
    otr('AD', A, D),
    otr('BC', B, C),
    otr('AB', A, B, { shtrihi: 1, gruppy: ['ravenstvo', 'vpisannaya'], cvet: 'a' }),
    otr('CD', C, D, { shtrihi: 1, gruppy: ['ravenstvo', 'vpisannaya'], cvet: 'a' }),
    otr('BH', B, H, { shag: 1, stil: 'punktir' }),
    otr('CH2', C, H2, { shag: 1, stil: 'punktir', gruppy: ['proekcii'], cvet: 'b' }),
    otr('AH', A, H, { skrytyy: true, gruppy: ['proekcii'], cvet: 'b' }),
    otr('AH2', A, H2, { skrytyy: true, gruppy: ['proekcii'], cvet: 'a' }),
    otr('AC', A, C, {
      skrytyy: true,
      stil: 'punktir',
      gruppy: ['proekcii', 'ravenstvo'],
      cvet: 'a',
    }),
    otr('BD', B, D, { skrytyy: true, stil: 'punktir', gruppy: ['ravenstvo'], cvet: 'a' }),
    ug('pH', A, H, B, { pryamoy: true, shag: 1 }),
    ug('pH2', D, H2, C, { pryamoy: true, shag: 1 }),
    ug('uA', D, A, B, { skrytyy: true, gruppy: ['ravenstvo'], cvet: 'c' }),
    ug('uD', C, D, A, { skrytyy: true, gruppy: ['ravenstvo'], cvet: 'c' }),
    tch('A', A),
    tch('B', B),
    tch('C', C),
    tch('D', D),
    tch('H', H, { shag: 1 }),
    tch('H_1', H2, { shag: 1 }),
  ];
  return {
    elementy: el,
    zametka: vpisana
      ? 'Боковая сторона равна средней линии — в трапецию **вписана окружность**, и $h = \\sqrt{AD\\cdot BC}$.'
      : 'Подвигай $C$: когда боковая сторона сравняется со средней линией, появится вписанная окружность.',
    znacheniya: [
      `$AH = ${chisloTeX(a - b)} = \\tfrac{AD - BC}{2}$`,
      `$AH_1 = ${chisloTeX(a + b)} = \\tfrac{AD + BC}{2}$`,
      `$AB = ${chisloTeX(bok)}$`,
      `$h = ${chisloTeX(h)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const a = t.D![0];
  const b = t.C![0];
  const h = t.C![1];
  return a > 1.5 && a < 7 && b > 0.5 && b < a - 0.5 && h > 1 && h < 7;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  let q: T2 = imya === 'D' ? [p[0], 0] : [p[0], p[1]];
  if (imya === 'C') {
    const a = t.D![0];
    const b = q[0];
    const hv = 2 * Math.sqrt(Math.max(0, a * b));
    /* Вписанная окружность: боковая = a + b ⇔ h² = 4ab. */
    if (b > 0 && Math.abs(q[1] - hv) < MAGNIT * hv) q = [b, hv];
  }
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 200; i += 1) {
    const a = 2.5 + rnd() * 2;
    const b = 0.8 + rnd() * (a - 1.6);
    const h = rnd() < 0.3 ? 2 * Math.sqrt(a * b) : 1.5 + rnd() * 3;
    const t: Tochki = { D: [a, 0], C: [b, h] };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { D: [3.8, 0], C: [1.6, 2.8] };

export const RAVNOBOKAYA: ZhivayaSkhema = {
  id: 'ravnobokaya',
  nachalo: NACHALO,
  podvizhnye: ['D', 'C'],
  pole: [-8, -2, 8, 8],
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: ['Равнобедренная трапеция $ABCD$, $AB = CD$', 'Высоты $BH$ и $CH_1$'],
};
