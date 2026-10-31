/* scripts/verify_schemes/mediana.mjs — схема «Удвоение медианы».

   На N случайных треугольниках: M — середина AC, MD = BM, B, M, D на
   одной прямой; ABCD — параллелограмм (AD = BC, CD = AB, AD ∥ BC);
   △AMD = △CMB, ∠MDA = ∠MBC, S(ABD) = S(ABC); 4BM² = 2AB² + 2BC² − AC²;
   ∠ABD = ∠ABM, ∠ADB = ∠CBM; BM < (AB + BC)/2. Плюс экран.

   Запуск: node scripts/verify_schemes/mediana.mjs [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, orient, proveritEkran, schetchik, ugol, zerno } from './obshchee.mjs';

export function proverit(N = 1000) {
  const { MEDIANA, tochkiMediany } = requireSrc('lib/zadanie18/skhemy/mediana');
  const sch = schetchik('Схема «Удвоение медианы»');
  const rnd = zerno(18003);
  let tesno = 0;
  let ekranov = 0;
  let n = 0;
  while (n < N) {
    const t = {
      A: [rnd() * 10 - 2, rnd() * 8 - 2],
      B: [rnd() * 10 - 2, rnd() * 8 - 2],
      C: [rnd() * 10 - 2, rnd() * 8 - 2],
    };
    const ugly = [ugol(t.B, t.A, t.C), ugol(t.A, t.B, t.C), ugol(t.A, t.C, t.B)];
    if (Math.min(...ugly) < 3 || Math.min(dist(t.A, t.B), dist(t.B, t.C), dist(t.A, t.C)) < 0.3)
      continue;
    n += 1;
    const { A, B, C, M, D } = tochkiMediany(t);
    const ab = dist(A, B);
    const bc = dist(B, C);
    const ac = dist(A, C);
    const bm = dist(B, M);
    const tag = `A=${A.map((x) => x.toFixed(3))} B=${B.map((x) => x.toFixed(3))} C=${C.map((x) => x.toFixed(3))}`;
    sch.fakt(
      'построение: AM = MC, BM = MD, B–M–D на прямой',
      blizko(dist(A, M), dist(M, C)) &&
        blizko(bm, dist(M, D)) &&
        blizko(bm + dist(M, D), dist(B, D)),
      tag,
    );
    sch.fakt(
      'ABCD — параллелограмм: AD = BC, CD = AB, AD ∥ BC',
      blizko(dist(A, D), bc) &&
        blizko(dist(C, D), ab) &&
        Math.abs(orient([0, 0], [D[0] - A[0], D[1] - A[1]], [C[0] - B[0], C[1] - B[1]])) < 1e-6,
      tag,
    );
    sch.fakt(
      '△AMD = △CMB, ∠MDA = ∠MBC',
      blizko(dist(A, D), bc) && blizko(ugol(M, D, A), ugol(M, B, C), 1e-6),
      tag,
    );
    sch.fakt('S(ABD) = S(ABC)', blizko(Math.abs(orient(A, B, D)), Math.abs(orient(A, B, C))), tag);
    sch.fakt(
      '4BM² = 2AB² + 2BC² − AC²',
      blizko(4 * bm * bm, 2 * ab * ab + 2 * bc * bc - ac * ac),
      tag,
    );
    sch.fakt(
      '∠ABD = ∠ABM, ∠ADB = ∠CBM',
      blizko(ugol(A, B, D), ugol(A, B, M), 1e-6) && blizko(ugol(A, D, B), ugol(C, B, M), 1e-6),
      tag,
    );
    sch.fakt('BM < (AB + BC)/2', bm < (ab + bc) / 2, tag);
    if (Math.min(...ugly) >= 15) {
      ekranov += 1;
      const lit = [[], ['parall'], ['ravnye'], ['formula'], ['abd']][n % 5];
      tesno += proveritEkran(MEDIANA, t, rnd, sch, lit);
    }
  }
  for (let i = 0; i < 300; i += 1) {
    const t = MEDIANA.sluchaynaya(rnd);
    sch.fakt(
      'случайное положение карточки допустимо',
      ['A', 'B', 'C'].every((k) => MEDIANA.ogranichit(k, t[k], t) !== null),
    );
  }
  sch.fakt(
    'начальное положение допустимо',
    ['A', 'B', 'C'].every(
      (k) => MEDIANA.ogranichit(k, MEDIANA.nachalo[k], MEDIANA.nachalo) !== null,
    ),
  );
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno} на ${ekranov} экранах`);
  return { plokho, tesno, ekranov };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
}
