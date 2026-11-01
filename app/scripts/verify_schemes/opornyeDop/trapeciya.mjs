/* scripts/verify_schemes/opornyeDop/trapeciya.mjs — опорная задача 11 (тема
   «Трапеция»). Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../../lib/load-ts.mjs';
import { add, blizko, dist, mid, naPryamoy, peresech, polar, sinUgla, sub } from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornyeDop/trapeciya');

/* Трапеция: AD на оси x длины a, BC = b на высоте h со сдвигом s. */
function trap(a, b, h, s) {
  const A = [0, 0];
  const D = [a, 0];
  const B = [s, h];
  const C = [s + b, h];
  return { A, B, C, D, O: peresech(A, C, B, D) };
}
function sluchaynayaTrap(rnd) {
  const a = 2 + rnd() * 10;
  return trap(a, a * (0.05 + rnd() * 0.9), 0.5 + rnd() * 10, (rnd() * 2 - 1) * a);
}

/* 11. P, M, O, N на одной прямой. */
function chetyre({ A, B, C, D, O }) {
  return { A, B, C, D, O, P: peresech(A, B, D, C), M: mid(B, C), N: mid(A, D) };
}
function proveritChetyre(sch, { P, M, O, N }, imya) {
  sch.fakt(
    `${imya}: P, M, O, N на одной прямой`,
    naPryamoy(P, M, N, 1e-8) && naPryamoy(M, O, N, 1e-8),
  );
}

const CHETYRE = {
  id: 'chetyre-tochki-trapecii',
  b(sch) {
    const otvety = [50, 70, 90, 115].map((u) => {
      const N = [3, 0];
      const M = add(N, polar(u, 4));
      const p = chetyre({
        A: [0, 0],
        D: [6, 0],
        B: sub(M, [1, 0]),
        C: add(M, [1, 0]),
        O: peresech([0, 0], add(M, [1, 0]), sub(M, [1, 0]), [6, 0]),
      });
      proveritChetyre(sch, p, 'б)');
      sch.fakt('б) PM = 2, MO = 1', blizko(dist(p.P, p.M), 2) && blizko(dist(p.M, p.O), 1));
      return dist(p.P, p.O);
    });
    sch.fakt(
      'б) PO не зависит от наклона MN',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiChetyreh(t);
    sch.fakt(
      'данные: BC = 2, AD = 6, MN = 4',
      blizko(dist(p.B, p.C), 2) && blizko(dist(p.A, p.D), 6) && blizko(dist(p.M, p.N), 4),
    );
    return dist(p.P, p.O);
  },
  a(rnd, sch) {
    proveritChetyre(sch, chetyre(sluchaynayaTrap(rnd)), 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiChetyreh(t);
    sch.fakt('чертёж: BC ∥ AD', sinUgla(p.A, p.D, p.B, p.C) < 1e-9);
    proveritChetyre(sch, p, 'чертёж');
  },
};

export const ZADACHI = [CHETYRE];
