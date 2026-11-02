/* scripts/verify_schemes/trenazherDop/otnosheniya.mjs — перенесённые задачи
   тренажёра, тема «Отношения отрезков». Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../../lib/load-ts.mjs';
import {
  add,
  blizko,
  delit,
  dist,
  mid,
  mul,
  naPryamoy,
  peresech,
  ploshchad,
  sinUgla,
  sluchaynyyTreugolnik,
  sub,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/trenazher/dop/otnosheniya');

/** Масштабировать фигуру так, чтобы площадь многоугольника pts стала S. */
function vPloshchad(t, pts, S) {
  const k = Math.sqrt(S / ploshchad(pts(t)));
  return Object.fromEntries(Object.entries(t).map(([i, p]) => [i, mul(p, k)]));
}

/* ot-mediany: Медианы AM и BN, точка G: AG : GM = 2 : 1. */
function mediany({ A, B, C }) {
  const M = mid(B, C);
  const N = mid(A, C);
  return { A, B, C, M, N, G: peresech(A, M, B, N) };
}
function proveritMediany(sch, { A, B, C, M, N, G }, imya) {
  sch.fakt(
    `${imya}: M, N — середины BC, AC; G на AM и BN`,
    blizko(dist(M, mid(B, C)), 0) &&
      blizko(dist(N, mid(A, C)), 0) &&
      naPryamoy(A, M, G) &&
      naPryamoy(B, N, G),
  );
  sch.fakt(`${imya}: AG : GM = 2 : 1`, blizko(dist(A, G), 2 * dist(G, M)));
}
const MEDIANY = {
  id: 'ot-mediany',
  b(sch, rnd) {
    const otvety = Array.from({ length: 5 }, () => {
      const t = mediany(vPloshchad(sluchaynyyTreugolnik(rnd), (x) => [x.A, x.B, x.C], 24));
      return ploshchad([t.A, t.G, t.B]);
    });
    sch.fakt(
      'б) S(AGB) не зависит от формы треугольника',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiMedian(t);
    sch.fakt('данные: S(ABC) = 24', blizko(ploshchad([p.A, p.B, p.C]), 24));
    return ploshchad([p.A, p.G, p.B]);
  },
  a(rnd, sch) {
    proveritMediany(sch, mediany(sluchaynyyTreugolnik(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritMediany(sch, L().tochkiMedian(t), 'чертёж');
  },
};

/* ot-menelay: M — середина AB, BK : KC = 3 : 1, P = MK ∩ AC за точкой C: CP : PA = 1 : 3. */
function menelay({ A, B, C }) {
  const M = mid(A, B);
  const K = delit(B, C, 3, 1);
  return { A, B, C, M, K, P: peresech(M, K, A, C) };
}
function proveritMenelaya(sch, { A, B, C, M, K, P }, imya) {
  sch.fakt(
    `${imya}: M — середина AB, BK = 3KC, P на MK и AC за точкой C`,
    blizko(dist(M, mid(A, B)), 0) &&
      blizko(dist(B, K), 3 * dist(K, C)) &&
      naPryamoy(B, C, K) &&
      naPryamoy(M, K, P) &&
      naPryamoy(A, C, P) &&
      blizko(dist(A, P), dist(A, C) + dist(C, P)),
  );
  sch.fakt(`${imya}: CP : PA = 1 : 3`, blizko(3 * dist(C, P), dist(P, A)));
}
const MENELAY = {
  id: 'ot-menelay',
  b(sch, rnd) {
    const otvety = Array.from({ length: 5 }, () => {
      const t = sluchaynyyTreugolnik(rnd);
      const k = 8 / dist(t.A, t.C);
      const p = menelay({ A: mul(t.A, k), B: mul(t.B, k), C: mul(t.C, k) });
      return dist(p.C, p.P);
    });
    sch.fakt(
      'б) CP не зависит от формы треугольника',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiMenelaya(t);
    sch.fakt('данные: AC = 8', blizko(dist(p.A, p.C), 8));
    return dist(p.C, p.P);
  },
  a(rnd, sch) {
    proveritMenelaya(sch, menelay(sluchaynyyTreugolnik(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritMenelaya(sch, L().tochkiMenelaya(t), 'чертёж');
  },
};

/* ot-cheva: BA₁ : A₁C = 1 : 2, CB₁ : B₁A = 2 : 1, P = AA₁ ∩ BB₁, C₁ = CP ∩ AB: C₁ — середина AB. */
function cheva({ A, B, C }) {
  const A1 = delit(B, C, 1, 2);
  const B1 = delit(C, A, 2, 1);
  const P = peresech(A, A1, B, B1);
  return { A, B, C, A1, B1, P, C1: peresech(C, P, A, B) };
}
function proveritChevu(sch, { A, B, C, A1, B1, P, C1 }, imya) {
  sch.fakt(
    `${imya}: отношения на сторонах, P на AA₁ и BB₁, C₁ на CP и AB`,
    blizko(2 * dist(B, A1), dist(A1, C)) &&
      blizko(dist(C, B1), 2 * dist(B1, A)) &&
      naPryamoy(A, A1, P) &&
      naPryamoy(B, B1, P) &&
      naPryamoy(C, P, C1) &&
      naPryamoy(A, B, C1),
  );
  sch.fakt(`${imya}: C₁ — середина AB`, blizko(dist(A, C1), dist(C1, B)));
}
const CHEVA = {
  id: 'ot-cheva',
  b(sch, rnd) {
    const otvety = Array.from({ length: 5 }, () => {
      const p = cheva(sluchaynyyTreugolnik(rnd));
      return dist(p.A, p.P) / dist(p.P, p.A1);
    });
    sch.fakt(
      'б) AP : PA₁ не зависит от формы треугольника',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiChevy(t);
    sch.fakt(
      'данные: BA₁ : A₁C = 1 : 2, CB₁ : B₁A = 2 : 1',
      blizko(2 * dist(p.B, p.A1), dist(p.A1, p.C)) && blizko(dist(p.C, p.B1), 2 * dist(p.B1, p.A)),
    );
    return dist(p.A, p.P) / dist(p.P, p.A1);
  },
  a(rnd, sch) {
    proveritChevu(sch, cheva(sluchaynyyTreugolnik(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritChevu(sch, L().tochkiChevy(t), 'чертёж');
  },
};

/* ot-parallelogramm: Параллелограмм ABCD, K — середина BC, CM : MD = 1 : 2; P = AK ∩ BD, Q = AM ∩ BD: BP = BD/3. */
function parallelogramm({ A, B, D }) {
  const C = add(B, sub(D, A));
  const K = mid(B, C);
  const M = delit(C, D, 1, 2);
  return { A, B, C, D, K, M, P: peresech(A, K, B, D), Q: peresech(A, M, B, D) };
}
function proveritParallelogramm(sch, { A, B, C, D, K, M, P, Q }, imya) {
  sch.fakt(
    `${imya}: ABCD — параллелограмм, K — середина BC, CM = MD/2, P и Q на BD`,
    sinUgla(A, B, D, C) < 1e-9 &&
      sinUgla(A, D, B, C) < 1e-9 &&
      blizko(dist(K, mid(B, C)), 0) &&
      blizko(2 * dist(C, M), dist(M, D)) &&
      naPryamoy(B, D, P) &&
      naPryamoy(A, K, P) &&
      naPryamoy(B, D, Q) &&
      naPryamoy(A, M, Q),
  );
  sch.fakt(`${imya}: BP = BD/3`, blizko(3 * dist(B, P), dist(B, D)));
}
const PARALLELOGRAMM = {
  id: 'ot-parallelogramm',
  b(sch, rnd) {
    const otvety = Array.from({ length: 5 }, () => {
      const { A, B, C } = sluchaynyyTreugolnik(rnd);
      const t = vPloshchad({ A, B, D: C }, (x) => [x.A, x.B, x.D], 30);
      const p = parallelogramm(t);
      sch.fakt('б) S(ABCD) = 60', blizko(ploshchad([p.A, p.B, p.C, p.D]), 60));
      return ploshchad([p.A, p.P, p.Q]);
    });
    sch.fakt(
      'б) S(APQ) не зависит от формы',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiParallelogramma(t);
    sch.fakt('данные: S(ABCD) = 60', blizko(ploshchad([p.A, p.B, p.C, p.D]), 60));
    return ploshchad([p.A, p.P, p.Q]);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritParallelogramm(sch, parallelogramm({ A, B, D: C }), 'а)');
  },
  scena(t, sch) {
    proveritParallelogramm(sch, L().tochkiParallelogramma(t), 'чертёж');
  },
};

export const ZADACHI = [MEDIANY, MENELAY, CHEVA, PARALLELOGRAMM];
