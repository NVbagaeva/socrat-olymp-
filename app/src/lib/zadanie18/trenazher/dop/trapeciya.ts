/**
 * Чертежи перенесённых задач тренажёра №18, тема «Трапеция». Трапеция ABCD с
 * основаниями AD (внизу) и BC.
 * Тексты — content/zadanie18/trenazherDop/trapeciya.ts; функции точек берёт
 * и проверка scripts/verify_schemes/trenazherDop.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { add, foot, intersect, mid, mul, polar, sub } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { scena } from './obshchee';

/** Трапеция: A(0; 0), D(ad; 0), B(x; h), C(x + bc; h). */
function trapeciya(ad: number, bc: number, x: number, h: number): Tochki {
  return { A: [0, 0], D: [ad, 0], B: [x, h], C: [x + bc, h] };
}

/* ── tp-ravnobokaya: Равнобедренная трапеция: проекция диагонали ─────────────── */

export function tochkiRavnobokoy(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  return { A, B, C, D, H: foot(C, A, D), G: foot(B, A, D) };
}

/** Равнобедренная трапеция: AD = ad, BC = bc, высота h. */
function ravnobokaya(ad: number, bc: number, h: number): Tochki {
  return trapeciya(ad, bc, (ad - bc) / 2, h);
}

export const TP_RAVNOBOKAYA = scena({
  id: 'tp-ravnobokaya',
  /* AD = 12, BC = 4, CH = 6: AH = 8, AC = 10. */
  nachalo: ravnobokaya(12, 4, 6),
  postroit(t) {
    const { A, B, C, D, H, G } = tochkiRavnobokoy(t);
    const el: Element[] = [
      mnog('f-abg', [A, B, G], { gruppy: ['proekcii'], cvet: 'a' }),
      mnog('f-dch', [D, C, H], { gruppy: ['proekcii'], cvet: 'a' }),
      mnog('f-ach', [A, C, H], { gruppy: ['pl'], cvet: 'b' }),
      otr('AB', A, B, { shtrihi: 1 }),
      otr('BC', B, C, { gruppy: ['ah'], cvet: 'b' }),
      otr('CD', C, D, { shtrihi: 1 }),
      otr('DA', D, A),
      otr('AC', A, C, { gruppy: ['pl'], cvet: 'b' }),
      otr('CH', C, H, { stil: 'punktir' }),
      ug('pH', C, H, D, { pryamoy: true }),
      otr('BG', B, G, { skrytyy: true, stil: 'punktir', gruppy: ['proekcii'], cvet: 'a' }),
      ug('pG', B, G, A, { skrytyy: true, pryamoy: true, gruppy: ['proekcii'], cvet: 'a' }),
      otr('AG-r', A, G, { skrytyy: true, shtrihi: 2, gruppy: ['proekcii'], cvet: 'c' }),
      otr('HD-r', H, D, { skrytyy: true, shtrihi: 2, gruppy: ['proekcii'], cvet: 'c' }),
      otr('GH-r', G, H, { skrytyy: true, gruppy: ['ah'], cvet: 'b' }),
      otr('AH', A, H, { skrytyy: true, gruppy: ['ah', 'pl'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('H', H),
      tch('G', G, { skrytyy: true, gruppy: ['proekcii', 'ah'], cvet: 'a' }),
    ];
    return el;
  },
});

/* ── tp-babochka: Отрезок через точку пересечения диагоналей ──────────────── */

export function tochkiBabochki(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const O = intersect(A, C, B, D) ?? mid(A, C);
  const vdol = add(O, sub(D, A));
  return {
    A,
    B,
    C,
    D,
    O,
    K: intersect(O, vdol, A, B) ?? O,
    L: intersect(O, vdol, C, D) ?? O,
  };
}

export const TP_BABOCHKA = scena({
  id: 'tp-babochka',
  /* BC = 3, AD = 6. */
  nachalo: trapeciya(6, 3, 1, 4),
  postroit(t) {
    const { A, B, C, D, O, K, L } = tochkiBabochki(t);
    const el: Element[] = [
      mnog('f-boc', [B, O, C], { gruppy: ['bab'], cvet: 'a' }),
      mnog('f-doa', [D, O, A], { gruppy: ['bab'], cvet: 'b' }),
      mnog('f-ako', [A, K, O], { gruppy: ['pod1'], cvet: 'b' }),
      mnog('f-abc', [A, B, C], { gruppy: ['pod1'], cvet: 'a' }),
      mnog('f-dlo', [D, L, O], { gruppy: ['pod2'], cvet: 'b' }),
      mnog('f-dcb', [D, C, B], { gruppy: ['pod2'], cvet: 'a' }),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['pod1', 'pod2'], cvet: 'a' }),
      otr('CD', C, D),
      otr('DA', D, A),
      otr('AC', A, C),
      otr('BD', B, D),
      otr('KO', K, O, { shtrihi: 1, gruppy: ['pod1', 'otv'], cvet: 'b' }),
      otr('OL', O, L, { shtrihi: 1, gruppy: ['pod2', 'otv'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('O', O),
      tch('K', K),
      tch('L', L),
    ];
    return el;
  },
});

/* ── tp-ugol-90: Сумма углов при основании 90° ───────────────────────────── */

export function tochkiUgol90(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const P = intersect(A, B, D, C) ?? mid(B, C);
  return { A, B, C, D, P, M: mid(B, C), N: mid(A, D) };
}

/** AD = ad, угол A (градусы), k = BC : AD: P — вершина прямого угла над AD. */
function ugol90(ad: number, uA: number, k: number): Tochki {
  const A: T2 = [0, 0];
  const D: T2 = [ad, 0];
  const P = polar(uA, ad * Math.cos((uA * Math.PI) / 180));
  const B = add(A, mul(sub(P, A), 1 - k));
  const C = add(D, mul(sub(P, D), 1 - k));
  return { A, B, C, D };
}

export const TP_UGOL_90 = scena({
  id: 'tp-ugol-90',
  /* AD = 14, BC = 4, AB = 6: PA = 8,4, cos A = 0,6. */
  nachalo: ugol90(14, (Math.acos(0.6) * 180) / Math.PI, 4 / 14),
  postroit(t) {
    const { A, B, C, D, P, M, N } = tochkiUgol90(t);
    const el: Element[] = [
      mnog('f-apd', [A, P, D], { gruppy: ['p', 'h'], cvet: 'a' }),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['med'], cvet: 'b' }),
      otr('CD', C, D),
      otr('DA', D, A, { gruppy: ['med'], cvet: 'a' }),
      otr('BP', B, P, { stil: 'prodolzhenie' }),
      otr('CP', C, P, { stil: 'prodolzhenie' }),
      ug('pP', A, P, D, { pryamoy: true, gruppy: ['p'], cvet: 'b' }),
      otr('PN', P, N, { stil: 'punktir', gruppy: ['pryamaya', 'med'], cvet: 'c' }),
      otr('AN-r', A, N, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      otr('ND-r', N, D, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      otr('BM-r', B, M, { skrytyy: true, shtrihi: 2, gruppy: ['med'], cvet: 'b' }),
      otr('MC-r', M, C, { skrytyy: true, shtrihi: 2, gruppy: ['med'], cvet: 'b' }),
      ug('uA', B, A, D, { skrytyy: true, gruppy: ['p'], cvet: 'c' }),
      ug('uD', A, D, C, { skrytyy: true, gruppy: ['p'], cvet: 'c', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('P', P),
      tch('M', M),
      tch('N', N),
    ];
    return el;
  },
});
