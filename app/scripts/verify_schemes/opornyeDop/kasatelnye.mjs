/* scripts/verify_schemes/opornyeDop/kasatelnye.mjs — опорная задача 10 (тема
   «Касательные»). Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../../lib/load-ts.mjs';
import { blizko, dist, doPryamoy, koren, osnovanie } from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornyeDop/kasatelnye');

/* 10. Описанная равнобедренная трапеция: боковая = полусумме оснований. */
function opisTrap(a, b) {
  /* Высоту находим из касания: расстояние от центра (0; h/2) до AB равно h/2. */
  const h = koren(
    (h) => doPryamoy([0, h / 2], [-a / 2, 0], [-b / 2, h]) - h / 2,
    1e-6,
    10 * (a + b),
  );
  const A = [-a / 2, 0];
  const B = [-b / 2, h];
  const C = [b / 2, h];
  const D = [a / 2, 0];
  const I = [0, h / 2];
  return { A, B, C, D, I, r: h / 2, K: osnovanie(I, A, B), N: osnovanie(I, C, D) };
}
function proveritOpisTrap(sch, { A, B, C, D, I, r }, imya) {
  sch.fakt(
    `${imya}: окружность касается всех четырёх сторон`,
    [
      [A, B],
      [B, C],
      [C, D],
      [D, A],
    ].every(([p, q]) => blizko(doPryamoy(I, p, q), r)),
  );
  sch.fakt(
    `${imya}: AB = CD = (AD + BC)/2`,
    blizko(dist(A, B), (dist(A, D) + dist(B, C)) / 2) && blizko(dist(A, B), dist(C, D)),
  );
}

const OPIS_TRAP = {
  id: 'opisannaya-trapeciya',
  b(sch) {
    const p = opisTrap(8, 2);
    proveritOpisTrap(sch, p, 'б)');
    sch.fakt('б) AK = 4, BK = 1', blizko(dist(p.A, p.K), 4) && blizko(dist(p.B, p.K), 1));
    return dist(p.K, p.N);
  },
  nachalo(t, sch) {
    const p = L().tochkiOpisTrap(t);
    sch.fakt('данные: AD = 8, BC = 2', blizko(dist(p.A, p.D), 8) && blizko(dist(p.B, p.C), 2));
    sch.fakt('б) KX = XN = 8/5', blizko(dist(p.K, p.X), 1.6) && blizko(dist(p.X, p.N), 1.6));
    return dist(p.K, p.N);
  },
  a(rnd, sch) {
    const a = 2 + rnd() * 10;
    proveritOpisTrap(sch, opisTrap(a, a * (0.05 + rnd() * 0.9)), 'а)');
  },
  scena(t, sch) {
    proveritOpisTrap(sch, L().tochkiOpisTrap(t), 'чертёж');
  },
};

export const ZADACHI = [OPIS_TRAP];
