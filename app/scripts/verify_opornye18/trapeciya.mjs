/* scripts/verify_opornye18/trapeciya.mjs — задачи 10–12 (тема «Трапеция»).
   Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  add,
  blizko,
  dist,
  koren,
  mid,
  naPryamoy,
  osnovanie,
  peresech,
  ploshchad,
  polar,
  sinUgla,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornye/trapeciya');

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

/* 10. «Бабочка»: S(AOB) = S(COD). */
function proveritBabochku(sch, { A, B, C, D, O }, imya) {
  sch.fakt(`${imya}: BC ∥ AD`, sinUgla(A, D, B, C) < 1e-9);
  sch.fakt(`${imya}: S(ABD) = S(ACD)`, blizko(ploshchad([A, B, D]), ploshchad([A, C, D])));
  sch.fakt(`${imya}: S(AOB) = S(COD)`, blizko(ploshchad([A, O, B]), ploshchad([C, O, D])));
  sch.fakt(
    `${imya}: S(AOB)² = S(BOC)·S(AOD)`,
    blizko(ploshchad([A, O, B]) ** 2, ploshchad([B, O, C]) * ploshchad([A, O, D])),
  );
}

const BABOCHKA = {
  id: 'babochka-ploshchad',
  b(sch) {
    /* Для нескольких форм: BC подбирается так, чтобы S(BOC) : S(AOD) = 4 : 9,
       затем высота — так, чтобы S(AOD) = 9. */
    const otvety = [
      [6, -1],
      [5, 2],
      [8, 0.5],
    ].map(([a, s]) => {
      const b = koren(
        (b) => {
          const t = trap(a, b, 1, s);
          return ploshchad([t.B, t.O, t.C]) / ploshchad([t.A, t.O, t.D]) - 4 / 9;
        },
        1e-6,
        a - 1e-6,
      );
      const t1 = trap(a, b, 1, s);
      const h = 9 / ploshchad([t1.A, t1.O, t1.D]);
      const t = trap(a, b, h, s);
      sch.fakt(
        'б) S(BOC) = 4, S(AOD) = 9',
        blizko(ploshchad([t.B, t.O, t.C]), 4) && blizko(ploshchad([t.A, t.O, t.D]), 9),
      );
      return ploshchad([t.A, t.B, t.C, t.D]);
    });
    sch.fakt(
      'б) площадь не зависит от формы',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().trapeciya(t);
    sch.fakt(
      'данные: S(BOC) = 4, S(AOD) = 9',
      blizko(ploshchad([p.B, p.O, p.C]), 4) && blizko(ploshchad([p.A, p.O, p.D]), 9),
    );
    return ploshchad([p.A, p.B, p.C, p.D]);
  },
  a(rnd, sch) {
    proveritBabochku(sch, sluchaynayaTrap(rnd), 'а)');
  },
  scena(t, sch) {
    proveritBabochku(sch, L().trapeciya(t), 'чертёж');
  },
};

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

/* 12. Равнобедренная трапеция с перпендикулярными диагоналями. */
function perpDiag(a, b) {
  /* Высота — из перпендикулярности диагоналей, без формулы. */
  const sk = (h) => {
    const t = trap(a, b, h, (a - b) / 2);
    const u = sub(t.C, t.A);
    const v = sub(t.D, t.B);
    return u[0] * v[0] + u[1] * v[1];
  };
  return trap(a, b, koren(sk, 1e-6, 10 * a), (a - b) / 2);
}
function proveritPerp(sch, { A, B, C, D, O }, imya) {
  sch.fakt(
    `${imya}: трапеция равнобедренная, диагонали перпендикулярны`,
    blizko(dist(A, B), dist(C, D)) && sinUgla(A, D, B, C) < 1e-9 && blizko(ugol(A, O, D), 90, 1e-6),
  );
  const h = dist(B, osnovanie(B, A, D));
  sch.fakt(`${imya}: высота = (AD + BC)/2`, blizko(h, (dist(A, D) + dist(B, C)) / 2));
}

const PERP_DIAG = {
  id: 'perpendikulyarnye-diagonali',
  b(sch) {
    /* BC = x, AD = 2x: боковая сторона пропорциональна x, подгоняем x под 5. */
    const x = 5 / dist(perpDiag(2, 1).A, perpDiag(2, 1).B);
    const t = perpDiag(2 * x, x);
    proveritPerp(sch, t, 'б)');
    sch.fakt('б) боковая = 5, BC² = 10', blizko(dist(t.A, t.B), 5) && blizko(x * x, 10));
    return ploshchad([t.A, t.B, t.C, t.D]);
  },
  nachalo(t, sch) {
    const p = L().tochkiPerpDiag(t);
    sch.fakt(
      'данные: боковая 5, AD = 2BC',
      blizko(dist(p.A, p.B), 5) && blizko(dist(p.A, p.D), 2 * dist(p.B, p.C)),
    );
    return ploshchad([p.A, p.B, p.C, p.D]);
  },
  a(rnd, sch) {
    const a = 2 + rnd() * 10;
    proveritPerp(sch, perpDiag(a, a * (0.05 + rnd() * 0.9)), 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiPerpDiag(t);
    proveritPerp(sch, p, 'чертёж');
    sch.fakt('чертёж: PQ проходит через O', naPryamoy(p.P, p.O, p.Q, 1e-8));
  },
};

export const ZADACHI = [BABOCHKA, CHETYRE, PERP_DIAG];
