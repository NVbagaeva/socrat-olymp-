/* scripts/verify_opornye18/ploshchadi.mjs — задачи 15–16 (тема «Площади»).
   Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  blizko,
  delit,
  dist,
  doPryamoy,
  koren,
  ploshchad,
  poStoronam,
  sluchaynyyTreugolnik,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornye/ploshchadi');

/* 15. AK : KB = BL : LC = CM : MA = 1 : 2: S(KLM) = S(ABC)/3. */
function triUgla(A, B, C) {
  return { A, B, C, K: delit(A, B, 1, 2), L: delit(B, C, 1, 2), M: delit(C, A, 1, 2) };
}
function proveritTriUgla(sch, { A, B, C, K, L: L0, M }, imya) {
  const S = ploshchad([A, B, C]);
  sch.fakt(
    `${imya}: S(AKM) = S(BLK) = S(CML) = 2S/9`,
    [
      [A, K, M],
      [B, L0, K],
      [C, M, L0],
    ].every((t) => blizko(ploshchad(t), (2 * S) / 9)),
  );
  sch.fakt(`${imya}: S(KLM) = S/3`, blizko(ploshchad([K, L0, M]), S / 3));
}

const TRI_UGLA = {
  id: 'tri-ugla-ploshchad',
  b(sch) {
    const { A, B, C } = poStoronam(14, 15, 13);
    sch.fakt('б) S(ABC) = 84', blizko(ploshchad([A, B, C]), 84));
    const p = triUgla(A, B, C);
    return ploshchad([p.K, p.L, p.M]);
  },
  nachalo(t, sch) {
    const p = L().tochkiTrehUglov(t);
    sch.fakt(
      'данные: AB = 13, BC = 14, CA = 15',
      blizko(dist(p.A, p.B), 13) && blizko(dist(p.B, p.C), 14) && blizko(dist(p.C, p.A), 15),
    );
    return ploshchad([p.K, p.L, p.M]);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritTriUgla(sch, triUgla(A, B, C), 'а)');
  },
  scena(t, sch) {
    proveritTriUgla(sch, L().tochkiTrehUglov(t), 'чертёж');
  },
};

/* 16. Сумма расстояний от точки внутри правильного треугольника до сторон. */
function pravilnyy(a) {
  return { A: [0, 0], B: [a, 0], C: [a / 2, (a * Math.sqrt(3)) / 2] };
}
function proveritRasst(sch, { A, B, C, P }, imya) {
  const s = doPryamoy(P, A, B) + doPryamoy(P, B, C) + doPryamoy(P, C, A);
  sch.fakt(`${imya}: сумма расстояний = высота`, blizko(s, doPryamoy(C, A, B)));
}

const RASSTOYANIYA = {
  id: 'rasstoyaniya-do-storon',
  b(sch) {
    /* Сторона a неизвестна: P на высоте 1 над AB и на расстоянии 3 от CA;
       a подбирается так, чтобы расстояние до BC стало 2. */
    const tochka = (a) => {
      const { A, B, C } = pravilnyy(a);
      /* Прямая CA: √3·x − y = 0, расстояние (√3·x − 1)/2 = 3. */
      const P = [7 / Math.sqrt(3), 1];
      return { A, B, C, P };
    };
    const a = koren(
      (a) => {
        const t = tochka(a);
        return doPryamoy(t.P, t.B, t.C) - 2;
      },
      5,
      30,
    );
    const t = tochka(a);
    sch.fakt(
      'б) PK = 1, PL = 2, PM = 3, P внутри',
      blizko(doPryamoy(t.P, t.A, t.B), 1) &&
        blizko(doPryamoy(t.P, t.B, t.C), 2) &&
        blizko(doPryamoy(t.P, t.C, t.A), 3) &&
        t.P[0] > 0 &&
        t.P[0] < a,
    );
    return a;
  },
  nachalo(t, sch) {
    const p = L().tochkiRasstoyaniy(t);
    sch.fakt(
      'данные: PK = 1, PL = 2, PM = 3',
      blizko(dist(p.P, p.K), 1) && blizko(dist(p.P, p.L), 2) && blizko(dist(p.P, p.M), 3),
    );
    return dist(p.A, p.B);
  },
  a(rnd, sch) {
    const t = pravilnyy(1 + rnd() * 10);
    const u = rnd();
    const v = rnd() * (1 - u);
    const w = 1 - u - v;
    const P = [0, 1].map((i) => u * t.A[i] + v * t.B[i] + w * t.C[i]);
    proveritRasst(sch, { ...t, P }, 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiRasstoyaniy(t);
    sch.fakt(
      'чертёж: треугольник правильный',
      blizko(dist(p.A, p.B), dist(p.B, p.C)) && blizko(dist(p.B, p.C), dist(p.C, p.A)),
    );
    proveritRasst(sch, p, 'чертёж');
  },
};

export const ZADACHI = [TRI_UGLA, RASSTOYANIYA];
