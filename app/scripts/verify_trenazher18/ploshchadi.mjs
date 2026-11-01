/* scripts/verify_trenazher18/ploshchadi.mjs — задачи 21–24 тренажёра
   (тема «Площади»). Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  add,
  blizko,
  delit,
  dist,
  doPryamoy,
  ed,
  mid,
  mul,
  naPryamoy,
  peresech,
  ploshchad,
  polar,
  sinUgla,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/trenazher/ploshchadi');

/* 21. BM : MC = 2 : 3, N — середина AM: S(ABM) : S(AMC) = 2 : 3. */
function vysota({ A, B, C }) {
  const M = delit(B, C, 2, 3);
  return { A, B, C, M, N: mid(A, M) };
}
function proveritVysotu(sch, { A, B, C, M, N }, imya) {
  sch.fakt(
    `${imya}: BM : MC = 2 : 3, N — середина AM`,
    naPryamoy(B, C, M) && blizko(3 * dist(B, M), 2 * dist(M, C)) && blizko(dist(N, mid(A, M)), 0),
  );
  sch.fakt(
    `${imya}: S(ABM) : S(AMC) = 2 : 3`,
    blizko(3 * ploshchad([A, B, M]), 2 * ploshchad([A, M, C])),
  );
}
const OBSHCHAYA_VYSOTA = {
  id: 'pl-obshchaya-vysota',
  b(sch, rnd) {
    const otvety = Array.from({ length: 5 }, () => {
      const t = sluchaynyyTreugolnik(rnd);
      const k = Math.sqrt(40 / ploshchad([t.A, t.B, t.C]));
      const p = vysota({ A: mul(t.A, k), B: mul(t.B, k), C: mul(t.C, k) });
      return ploshchad([p.A, p.B, p.N]);
    });
    sch.fakt(
      'б) S(ABN) не зависит от формы треугольника',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiObshchVysoty(t);
    sch.fakt('данные: S(ABC) = 40', blizko(ploshchad([p.A, p.B, p.C]), 40));
    return ploshchad([p.A, p.B, p.N]);
  },
  a(rnd, sch) {
    proveritVysotu(sch, vysota(sluchaynyyTreugolnik(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritVysotu(sch, L().tochkiObshchVysoty(t), 'чертёж');
  },
};

/* 22. AK : KB = 1 : 2, AL : LC = 3 : 1: S(AKL) = S(ABC)/4. */
function obshchiyUgol({ A, B, C }) {
  return { A, B, C, K: delit(A, B, 1, 2), L: delit(A, C, 3, 1) };
}
function proveritUgol(sch, { A, B, C, K, L: Lt }, imya) {
  sch.fakt(
    `${imya}: AK : KB = 1 : 2, AL : LC = 3 : 1`,
    naPryamoy(A, B, K) &&
      blizko(2 * dist(A, K), dist(K, B)) &&
      naPryamoy(A, C, Lt) &&
      blizko(dist(A, Lt), 3 * dist(Lt, C)),
  );
  sch.fakt(`${imya}: S(AKL) = S(ABC)/4`, blizko(4 * ploshchad([A, K, Lt]), ploshchad([A, B, C])));
}
const OBSHCHIY_UGOL = {
  id: 'pl-obshchiy-ugol',
  b() {
    const A = [0, 0];
    const B = polar(17, 9);
    const C = polar(47, 8);
    const p = obshchiyUgol({ A, B, C });
    return ploshchad([p.K, p.B, p.C, p.L]);
  },
  nachalo(t, sch) {
    const p = L().tochkiObshchUgla(t);
    sch.fakt(
      'данные: AB = 9, AC = 8, ∠A = 30°',
      blizko(dist(p.A, p.B), 9) && blizko(dist(p.A, p.C), 8) && blizko(ugol(p.B, p.A, p.C), 30),
    );
    return ploshchad([p.K, p.B, p.C, p.L]);
  },
  a(rnd, sch) {
    proveritUgol(sch, obshchiyUgol(sluchaynyyTreugolnik(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritUgol(sch, L().tochkiObshchUgla(t), 'чертёж');
  },
};

/* 23. Трапеция ABCD, M — середина CD: S(ABM) = S(ABCD)/2. */
function seredina({ A, B, C, D }) {
  return { A, B, C, D, M: mid(C, D) };
}
function proveritSeredinu(sch, { A, B, C, D, M }, imya) {
  sch.fakt(
    `${imya}: AD ∥ BC, M — середина CD`,
    sinUgla(A, D, B, C) < 1e-9 && blizko(dist(M, mid(C, D)), 0),
  );
  sch.fakt(
    `${imya}: S(ABM) = S(ABCD)/2`,
    blizko(2 * ploshchad([A, B, M]), ploshchad([A, B, C, D])),
  );
}
const RELSY = {
  id: 'pl-relsy',
  b(sch) {
    /* AD = 10, BC = 6, h = 8, AB = 10: B на высоте 8 в 6 от оси (вправо или влево). */
    const otvety = [6, -6].map((x) => {
      const t = { A: [0, 0], B: [x, 8], C: [x + 6, 8], D: [10, 0] };
      sch.fakt('б) AB = 10', blizko(dist(t.A, t.B), 10));
      const p = seredina(t);
      return doPryamoy(p.M, p.A, p.B);
    });
    sch.fakt('б) ответ не зависит от наклона AB', blizko(otvety[0], otvety[1]));
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiSerediny(t);
    sch.fakt(
      'данные: AD = 10, BC = 6, AB = 10, высота 8',
      blizko(dist(p.A, p.D), 10) &&
        blizko(dist(p.B, p.C), 6) &&
        blizko(dist(p.A, p.B), 10) &&
        blizko(doPryamoy(p.B, p.A, p.D), 8),
    );
    return doPryamoy(p.M, p.A, p.B);
  },
  a(rnd, sch) {
    const ad = 3 + rnd() * 10;
    const bc = 1 + rnd() * 10;
    const x = rnd() * 10 - 4;
    const h = 1 + rnd() * 8;
    proveritSeredinu(sch, seredina({ A: [0, 0], B: [x, h], C: [x + bc, h], D: [ad, 0] }), 'а)');
  },
  scena(t, sch) {
    proveritSeredinu(sch, L().tochkiSerediny(t), 'чертёж');
  },
};

/* 24. Биссектриса AL: AL = 2·AB·AC·cos(A/2)/(AB + AC). */
function bissektrisa({ A, B, C }) {
  return { A, B, C, L: peresech(A, add(A, add(ed(sub(B, A)), ed(sub(C, A)))), B, C) };
}
function proveritBiss(sch, { A, B, C, L: Lt }, imya) {
  sch.fakt(
    `${imya}: L на BC, ∠BAL = ∠LAC`,
    naPryamoy(B, C, Lt) && blizko(ugol(B, A, Lt), ugol(Lt, A, C), 1e-6),
  );
  const u = (ugol(B, A, C) * Math.PI) / 360;
  sch.fakt(
    `${imya}: AL = 2·AB·AC·cos(A/2)/(AB + AC)`,
    blizko(dist(A, Lt), (2 * dist(A, B) * dist(A, C) * Math.cos(u)) / (dist(A, B) + dist(A, C))),
  );
}
const BISSEKTRISA = {
  id: 'pl-bissektrisa',
  b() {
    return dist([0, 0], bissektrisa({ A: [0, 0], B: polar(-30, 3), C: polar(90, 6) }).L);
  },
  nachalo(t, sch) {
    const p = L().tochkiBissektrisy(t);
    sch.fakt(
      'данные: AB = 3, AC = 6, ∠A = 120°',
      blizko(dist(p.A, p.B), 3) && blizko(dist(p.A, p.C), 6) && blizko(ugol(p.B, p.A, p.C), 120),
    );
    return dist(p.A, p.L);
  },
  a(rnd, sch) {
    proveritBiss(sch, bissektrisa(sluchaynyyTreugolnik(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritBiss(sch, L().tochkiBissektrisy(t), 'чертёж');
  },
};

export const ZADACHI = [OBSHCHAYA_VYSOTA, OBSHCHIY_UGOL, RELSY, BISSEKTRISA];
