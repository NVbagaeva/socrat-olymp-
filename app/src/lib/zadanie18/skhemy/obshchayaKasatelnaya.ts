/**
 * Схема 15. Общая касательная двух окружностей.
 *
 * Окружности (O₁, R) и (O₂, r) не пересекаются: a = O₁O₂ > R + r.
 * MN — общая внешняя касательная, PQ — общая внутренняя. Тянутся
 * центры и ручки радиусов.
 */

import { mnog, okr, otr, ruchka, tch, ug } from '@/lib/skhemy/dsl';
import { add, chisloTeX, dist, mul, sub } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-9, -8, 14, 8] as const;

export function tochkiObshchey(t: Tochki) {
  const O1 = t.O1!;
  const O2 = t.O2!;
  const R = dist(O1, t.R1!);
  const r = dist(O2, t.R2!);
  const a = dist(O1, O2);
  const th = Math.atan2(O2[1] - O1[1], O2[0] - O1[0]);
  const e = (u: number): T2 => [Math.cos(u), Math.sin(u)];
  const fi = Math.acos(Math.max(-1, Math.min(1, (R - r) / a)));
  const M = add(O1, mul(e(th + fi), R));
  const N = add(O2, mul(e(th + fi), r));
  const psi = Math.acos(Math.max(-1, Math.min(1, (R + r) / a)));
  const P = add(O1, mul(e(th - psi), R));
  const Q = add(O2, mul(e(th - psi), -r));
  /* H — основание перпендикуляра из O₂ на O₁M (прямоугольная трапеция). */
  const H = add(O1, mul(e(th + fi), R - r));
  /* G — на продолжении O₁P: O₁G = R + r. */
  const G = add(O1, mul(e(th - psi), R + r));
  return { O1, O2, R, r, a, M, N, P, Q, H, G };
}

function postroit(t: Tochki): Kadr {
  const { O1, O2, R, r, a, M, N, P, Q, H, G } = tochkiObshchey(t);
  const el: Element[] = [
    mnog('f-trap', [O1, M, N, O2], { gruppy: ['vneshnyaya'], cvet: 'a' }),
    mnog('f-tri', [O1, H, O2], { gruppy: ['vneshnyaya'], cvet: 'b' }),
    mnog('f-tri2', [O1, G, O2], { gruppy: ['vnutrennyaya'], cvet: 'b' }),
    okr('o1', O1, R),
    okr('o2', O2, r),
    otr('MN', M, N, { shag: 1, gruppy: ['vneshnyaya'], cvet: 'b' }),
    otr('PQ', P, Q, { shag: 2, gruppy: ['vnutrennyaya'], cvet: 'b' }),
    otr('O1O2', O1, O2, {
      skrytyy: true,
      stil: 'punktir',
      gruppy: ['vneshnyaya', 'vnutrennyaya'],
      cvet: 'c',
    }),
    otr('O1M', O1, M, { skrytyy: true, gruppy: ['vneshnyaya'], cvet: 'a' }),
    otr('O2N', O2, N, { skrytyy: true, gruppy: ['vneshnyaya'], cvet: 'a' }),
    otr('O2H', O2, H, { skrytyy: true, stil: 'punktir', gruppy: ['vneshnyaya'], cvet: 'b' }),
    otr('O1G', O1, G, { skrytyy: true, gruppy: ['vnutrennyaya'], cvet: 'a' }),
    otr('O2Q', O2, Q, { skrytyy: true, gruppy: ['vnutrennyaya'], cvet: 'a' }),
    otr('O2G', O2, G, { skrytyy: true, stil: 'punktir', gruppy: ['vnutrennyaya'], cvet: 'b' }),
    ug('pM', O1, M, N, { pryamoy: true, skrytyy: true, gruppy: ['vneshnyaya'], cvet: 'a' }),
    ug('pN', O2, N, M, { pryamoy: true, skrytyy: true, gruppy: ['vneshnyaya'], cvet: 'a' }),
    ug('pH', O1, H, O2, { pryamoy: true, skrytyy: true, gruppy: ['vneshnyaya'], cvet: 'b' }),
    ug('pG', O1, G, O2, { pryamoy: true, skrytyy: true, gruppy: ['vnutrennyaya'], cvet: 'b' }),
    ruchka('R1', t.R1!),
    ruchka('R2', t.R2!),
    tch('O_1', O1),
    tch('O_2', O2),
    tch('M', M, { shag: 1 }),
    tch('N', N, { shag: 1 }),
    tch('P', P, { shag: 2 }),
    tch('Q', Q, { shag: 2 }),
    tch('H', H, { skrytyy: true, gruppy: ['vneshnyaya'], cvet: 'b' }),
    tch('G', G, { skrytyy: true, gruppy: ['vnutrennyaya'], cvet: 'b' }),
  ];
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$MN = ${chisloTeX(dist(M, N))}$`,
      `$\\sqrt{a^2-(R-r)^2} = ${chisloTeX(Math.sqrt(a * a - (R - r) ** 2))}$`,
      `$PQ = ${chisloTeX(dist(P, Q))}$`,
      `$\\sqrt{a^2-(R+r)^2} = ${chisloTeX(Math.sqrt(a * a - (R + r) ** 2))}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const { R, r, a } = tochkiObshchey(t);
  return R > 0.8 && r > 0.6 && a > R + r + 0.8 && r <= R * 1.6;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  const q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

function prisposobit(novye: Tochki, prezhnie: Tochki, imya: string): Tochki | null {
  const s: Record<string, T2> = { ...novye };
  if (imya === 'O1') s.R1 = add(prezhnie.R1!, sub(novye.O1!, prezhnie.O1!));
  if (imya === 'O2') s.R2 = add(prezhnie.R2!, sub(novye.O2!, prezhnie.O2!));
  return goditsya(s) ? s : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 300; i += 1) {
    const R = 1.8 + rnd() * 1.4;
    const r = 0.8 + rnd() * 1.2;
    const a = R + r + 1.2 + rnd() * 2.5;
    const t: Tochki = { O1: [0, 0], R1: [0, -R], O2: [a, rnd() * 2 - 1], R2: [a, -r] };
    const s = { ...t, R2: [t.O2![0], t.O2![1] - r] as T2 };
    if (goditsya(s)) return s;
  }
  return NACHALO;
}

const NACHALO: Tochki = { O1: [0, 0], R1: [0, -2.8], O2: [7, 0.3], R2: [7, -1.3] };

export const OBSHCHAYA_KASATELNAYA: ZhivayaSkhema = {
  id: 'obshchaya-kasatelnaya',
  nachalo: NACHALO,
  podvizhnye: ['O1', 'O2', 'R1', 'R2'],
  pole: POLE,
  postroit,
  ogranichit,
  prisposobit,
  sluchaynaya,
  shagi: [
    'Две окружности, $O_1O_2 = a > R + r$',
    'Общая внешняя касательная $MN$',
    'Общая внутренняя касательная $PQ$',
  ],
  imenaRuchek: {
    O1: 'Центр первой окружности',
    O2: 'Центр второй окружности',
    R1: 'Радиус первой окружности',
    R2: 'Радиус второй окружности',
  },
};
