/* scripts/verify_schemes/bissektrisa.mjs — схема «Биссектриса».

   На N случайных треугольниках: L — точка на BC с ∠BAL = ∠LAC;
   BL/LC = AB/AC; D на прямой AB, CD ∥ AL, AD = AC; N на AC, LN ∥ AB,
   AN = NL; W на описанной окружности и на прямой AL; △ABL ∼ △AWC;
   AL·LW = BL·LC; AL² = AB·AC − BL·LC. Плюс экран.

   Запуск: node scripts/verify_schemes/bissektrisa.mjs [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  blizko,
  dist,
  orient,
  proveritEkran,
  schetchik,
  ugol,
  zerno,
} from './obshchee.mjs';

export function proverit(N = 1000) {
  const { BISSEKTRISA, tochkiBissektrisy } = requireSrc('lib/zadanie18/skhemy/bissektrisa');
  const sch = schetchik('Схема «Биссектриса»');
  const rnd = zerno(18002);
  let tesno = 0;
  let ekranov = 0;
  let n = 0;
  while (n < N) {
    const t = {
      A: [rnd() * 10 - 2, rnd() * 8 - 2],
      B: [rnd() * 10 - 2, rnd() * 8 - 2],
      C: [rnd() * 10 - 2, rnd() * 8 - 2],
    };
    const uA = ugol(t.B, t.A, t.C);
    const uB = ugol(t.A, t.B, t.C);
    const uC = ugol(t.A, t.C, t.B);
    if (Math.min(uA, uB, uC) < 3 || Math.min(dist(t.A, t.B), dist(t.B, t.C), dist(t.A, t.C)) < 0.3)
      continue;
    n += 1;
    const { A, B, C, L, D, N: Nn, W, O, R } = tochkiBissektrisy(t);
    const e = 1e-6;
    const ab = dist(A, B);
    const ac = dist(A, C);
    const bl = dist(B, L);
    const lc = dist(L, C);
    const al = dist(A, L);
    const tag = `A=${A.map((x) => x.toFixed(3))} B=${B.map((x) => x.toFixed(3))} C=${C.map((x) => x.toFixed(3))}`;
    sch.fakt(
      'построение: L на отрезке BC, ∠BAL = ∠LAC',
      Math.abs(orient(B, C, L)) < e * 10 &&
        blizko(bl + lc, dist(B, C)) &&
        blizko(ugol(B, A, L), ugol(L, A, C), 1e-6),
      tag,
    );
    sch.fakt('BL / LC = AB / AC', blizko(bl / lc, ab / ac), tag);
    sch.fakt(
      'D на прямой AB, CD ∥ AL',
      Math.abs(orient(A, B, D)) < e * 100 &&
        Math.abs(orient([0, 0], [D[0] - C[0], D[1] - C[1]], [L[0] - A[0], L[1] - A[1]])) < e * 100,
      tag,
    );
    sch.fakt('AD = AC', blizko(dist(A, D), ac), tag);
    sch.fakt(
      '∠ADC = ∠BAL и ∠ACD = ∠LAC',
      blizko(ugol(A, D, C), ugol(B, A, L), 1e-6) && blizko(ugol(A, C, D), ugol(L, A, C), 1e-6),
      tag,
    );
    /* D — за точкой A (на продолжении BA): тогда BA/AD — отношение отрезков угла B. */
    sch.fakt('A между B и D', blizko(dist(B, A) + dist(A, D), dist(B, D)), tag);
    sch.fakt(
      'N на AC, LN ∥ AB',
      Math.abs(orient(A, C, Nn)) < e * 100 &&
        Math.abs(orient([0, 0], [Nn[0] - L[0], Nn[1] - L[1]], [B[0] - A[0], B[1] - A[1]])) <
          e * 100,
      tag,
    );
    sch.fakt('AN = NL', blizko(dist(A, Nn), dist(Nn, L)), tag);
    sch.fakt(
      'W на описанной окружности и на прямой AL, L между A и W',
      blizko(dist(O, W), R) &&
        Math.abs(orient(A, L, W)) < e * 100 &&
        blizko(al + dist(L, W), dist(A, W)),
      tag,
    );
    sch.fakt('∠ABL = ∠AWC', blizko(ugol(A, B, L), ugol(A, W, C), 1e-6), tag);
    sch.fakt('AB·AC = AL·AW', blizko(ab * ac, al * dist(A, W)), tag);
    sch.fakt('AL·LW = BL·LC', blizko(al * dist(L, W), bl * lc), tag);
    sch.fakt('AL² = AB·AC − BL·LC', blizko(al * al, ab * ac - bl * lc), tag);
    if (Math.min(uA, uB, uC) >= 15) {
      ekranov += 1;
      const lit = [[], ['otnoshenie'], ['paral-c'], ['paral-l'], ['dlina']][n % 5];
      tesno += proveritEkran(BISSEKTRISA, t, rnd, sch, lit);
    }
  }
  for (let i = 0; i < 300; i += 1) {
    const t = BISSEKTRISA.sluchaynaya(rnd);
    sch.fakt(
      'случайное положение карточки допустимо',
      ['A', 'B', 'C'].every((k) => BISSEKTRISA.ogranichit(k, t[k], t) !== null),
    );
  }
  sch.fakt(
    'начальное положение допустимо',
    ['A', 'B', 'C'].every(
      (k) => BISSEKTRISA.ogranichit(k, BISSEKTRISA.nachalo[k], BISSEKTRISA.nachalo) !== null,
    ),
  );
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno} на ${ekranov} экранах`);
  return { plokho, tesno, ekranov };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
}
