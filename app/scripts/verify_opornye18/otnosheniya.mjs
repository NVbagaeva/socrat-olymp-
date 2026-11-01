/* scripts/verify_opornye18/otnosheniya.mjs — задачи 13–14 (тема
   «Отношения отрезков»). Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  add,
  blizko,
  delit,
  dist,
  ed,
  mid,
  peresech,
  ploshchad,
  polar,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornye/otnosheniya');

/* 13. BM : MC = 2 : 1, K — середина AM, N = BK ∩ AC: AN : NC = 2 : 3. */
function menelay(A, B, C) {
  const M = delit(B, C, 2, 1);
  const K = mid(A, M);
  return { A, B, C, M, K, N: peresech(B, K, A, C) };
}
function proveritMenelay(sch, { A, C, N }, imya) {
  sch.fakt(
    `${imya}: N на AC, AN : NC = 2 : 3`,
    blizko(dist(A, N) + dist(N, C), dist(A, C)) && blizko(dist(A, N) / dist(N, C), 2 / 3),
  );
}

const MENELAY = {
  id: 'menelay-ploshchad',
  b(sch) {
    const otvety = [
      [
        [3, 6],
        [0, 0],
        [10, 0],
      ],
      [
        [-2, 5],
        [0, 0],
        [12, 0],
      ],
      [
        [9, 7.5],
        [0, 0],
        [8, 0],
      ],
    ].map(([A, B, C]) => {
      const p = menelay(A, B, C);
      sch.fakt('б) S(ABC) = 30', blizko(ploshchad([A, B, C]), 30));
      return ploshchad([p.K, p.M, p.C, p.N]);
    });
    sch.fakt(
      'б) площадь KMCN не зависит от формы',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiMenelaya(t);
    sch.fakt('данные: S(ABC) = 30', blizko(ploshchad([p.A, p.B, p.C]), 30));
    sch.fakt(
      'б) S(AMC) = 10, S(AKN) = 2',
      blizko(ploshchad([p.A, p.M, p.C]), 10) && blizko(ploshchad([p.A, p.K, p.N]), 2),
    );
    return ploshchad([p.K, p.M, p.C, p.N]);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritMenelay(sch, menelay(A, B, C), 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiMenelaya(t);
    sch.fakt(
      'чертёж: BM : MC = 2 : 1, AK = KM',
      blizko(dist(p.B, p.M) / dist(p.M, p.C), 2) && blizko(dist(p.A, p.K), dist(p.K, p.M)),
    );
    proveritMenelay(sch, p, 'чертёж');
  },
};

/* 14. Биссектриса AL ∩ медиана BM = P: BP : PM = 2AB : AC. */
function bissMed(A, B, C) {
  const M = mid(A, C);
  const L0 = peresech(A, add(A, add(ed(sub(B, A)), ed(sub(C, A)))), B, C);
  return { A, B, C, M, L: L0, P: peresech(A, L0, B, M) };
}
function proveritBissMed(sch, { A, B, C, M, L: L0, P }, imya) {
  sch.fakt(
    `${imya}: ∠BAL = ∠LAC, P на BM`,
    blizko(ugol(B, A, L0), ugol(L0, A, C), 1e-6) && blizko(dist(B, P) + dist(P, M), dist(B, M)),
  );
  sch.fakt(
    `${imya}: BP : PM = 2AB : AC`,
    blizko(dist(B, P) / dist(P, M), (2 * dist(A, B)) / dist(A, C)),
  );
}

const BISS_MED = {
  id: 'bissektrisa-i-mediana',
  b(sch) {
    /* sin A = 20 / (½·6·8) = 5/6: угол A острый или тупой — ответ один. */
    const sinA = 20 / 24;
    const uA = (Math.asin(sinA) * 180) / Math.PI;
    const otvety = [uA, 180 - uA].map((u) => {
      const A = [0, 0];
      const p = bissMed(A, polar(u, 6), [8, 0]);
      sch.fakt('б) S(ABC) = 20', blizko(ploshchad([p.A, p.B, p.C]), 20));
      return ploshchad([p.A, p.B, p.P]);
    });
    sch.fakt('б) ответ одинаков при остром и тупом A', blizko(otvety[0], otvety[1]));
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiBissMed(t);
    sch.fakt(
      'данные: AB = 6, AC = 8, S(ABC) = 20',
      blizko(dist(p.A, p.B), 6) &&
        blizko(dist(p.A, p.C), 8) &&
        blizko(ploshchad([p.A, p.B, p.C]), 20),
    );
    return ploshchad([p.A, p.B, p.P]);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritBissMed(sch, bissMed(A, B, C), 'а)');
  },
  scena(t, sch) {
    proveritBissMed(sch, L().tochkiBissMed(t), 'чертёж');
  },
};

export const ZADACHI = [MENELAY, BISS_MED];
