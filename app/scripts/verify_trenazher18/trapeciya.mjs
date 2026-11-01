/* scripts/verify_trenazher18/trapeciya.mjs — задачи 13–16 тренажёра
   (тема «Трапеция»). Трапеция ABCD: основания AD и BC, AD внизу.
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
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/trenazher/trapeciya');

/** Трапеция: A(0; 0), D(ad; 0), B(x; h), C(x + bc; h). */
const trap = (ad, bc, x, h) => ({ A: [0, 0], D: [ad, 0], B: [x, h], C: [x + bc, h] });
function sluchaynayaTrap(rnd) {
  const ad = 4 + rnd() * 10;
  const bc = ad * (0.15 + 0.7 * rnd());
  return trap(ad, bc, (rnd() * 2 - 0.5) * (ad - bc), 1 + rnd() * 8);
}
const etoTrap = ({ A, B, C, D }) => sinUgla(A, D, B, C) < 1e-9 && dist(A, D) > dist(B, C);

/* 13. Средняя линия MN пересекает BD в P, AC в Q: PQ = (AD − BC)/2. */
function proveritSredlin(sch, { A, B, C, D, M, N, P, Q }, imya) {
  sch.fakt(
    `${imya}: AD ∥ BC, M и N — середины боковых, P на BD и MN, Q на AC и MN`,
    etoTrap({ A, B, C, D }) &&
      blizko(dist(M, mid(A, B)), 0) &&
      blizko(dist(N, mid(C, D)), 0) &&
      naPryamoy(B, D, P) &&
      naPryamoy(M, N, P) &&
      naPryamoy(A, C, Q) &&
      naPryamoy(M, N, Q),
  );
  sch.fakt(`${imya}: PQ = (AD − BC)/2`, blizko(dist(P, Q), (dist(A, D) - dist(B, C)) / 2));
}
function sredlinPoTrap({ A, B, C, D }) {
  const M = mid(A, B);
  const N = mid(C, D);
  return { A, B, C, D, M, N, P: peresech(M, N, B, D), Q: peresech(M, N, A, C) };
}
const SREDLIN = {
  id: 'tp-sredlin',
  b(sch) {
    const otvety = [
      [0, 3],
      [3, 5],
      [-2, 7],
      [6, 4],
    ].map(([x, h]) => {
      const p = sredlinPoTrap(trap(11, 5, x, h));
      return dist(p.P, p.Q);
    });
    sch.fakt(
      'б) PQ не зависит от формы трапеции',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiSredlinTrap(t);
    sch.fakt('данные: AD = 11, BC = 5', blizko(dist(p.A, p.D), 11) && blizko(dist(p.B, p.C), 5));
    return dist(p.P, p.Q);
  },
  a(rnd, sch) {
    proveritSredlin(sch, sredlinPoTrap(sluchaynayaTrap(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritSredlin(sch, L().tochkiSredlinTrap(t), 'чертёж');
  },
};

/* 14. Равнобедренная трапеция, высота CH: AH = (AD + BC)/2. */
function proveritRavnobokuyu(sch, { A, B, C, D, H }, imya) {
  sch.fakt(
    `${imya}: равнобедренная трапеция, CH ⊥ AD`,
    etoTrap({ A, B, C, D }) &&
      blizko(dist(A, B), dist(C, D)) &&
      naPryamoy(A, D, H) &&
      blizko(ugol(C, H, A), 90, 1e-6),
  );
  sch.fakt(`${imya}: AH = (AD + BC)/2`, blizko(dist(A, H), (dist(A, D) + dist(B, C)) / 2));
}
const ravnob = (ad, bc, h) => trap(ad, bc, (ad - bc) / 2, h);
const RAVNOBOKAYA = {
  id: 'tp-ravnobokaya',
  b(sch) {
    /* AC = 10, CH = 6: AH = 8 = (AD + BC)/2 — но здесь трапеции строятся по основаниям
       с суммой 16 и проверяется AC = 10. */
    const otvety = [1, 3, 5, 7].map((bc) => {
      const t = ravnob(16 - bc, bc, 6);
      sch.fakt('б) AC = 10, CH = 6', blizko(dist(t.A, t.C), 10));
      return ploshchad([t.A, t.B, t.C, t.D]);
    });
    sch.fakt(
      'б) площадь не зависит от оснований',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiRavnobokoy(t);
    sch.fakt(
      'данные: AC = 10, CH = 6, трапеция равнобедренная',
      blizko(dist(p.A, p.C), 10) &&
        blizko(dist(p.C, p.H), 6) &&
        blizko(dist(p.A, p.B), dist(p.C, p.D)),
    );
    return ploshchad([p.A, p.B, p.C, p.D]);
  },
  a(rnd, sch) {
    const ad = 3 + rnd() * 10;
    const t = ravnob(ad, ad * (0.1 + 0.8 * rnd()), 1 + rnd() * 8);
    proveritRavnobokuyu(sch, { ...t, H: osnovanie(t.C, t.A, t.D) }, 'а)');
  },
  scena(t, sch) {
    proveritRavnobokuyu(sch, L().tochkiRavnobokoy(t), 'чертёж');
  },
};

/* 15. Прямая через O ∥ основаниям пересекает AB в K, CD в L: KO = OL. */
function babochkaPoTrap({ A, B, C, D }) {
  const O = peresech(A, C, B, D);
  const vdol = add(O, [1, 0]);
  return { A, B, C, D, O, K: peresech(O, vdol, A, B), L: peresech(O, vdol, C, D) };
}
function proveritBabochku(sch, { A, B, C, D, O, K, L: Lt }, imya) {
  sch.fakt(
    `${imya}: O = AC ∩ BD, K на AB, L на CD, KL ∥ AD`,
    etoTrap({ A, B, C, D }) &&
      naPryamoy(A, C, O) &&
      naPryamoy(B, D, O) &&
      naPryamoy(A, B, K) &&
      naPryamoy(C, D, Lt) &&
      sinUgla(K, Lt, A, D) < 1e-9,
  );
  sch.fakt(`${imya}: KO = OL`, blizko(dist(K, O), dist(O, Lt)));
}
const BABOCHKA = {
  id: 'tp-babochka',
  b(sch) {
    const otvety = [
      [0, 2],
      [1, 4],
      [-2, 3],
      [4, 6],
    ].map(([x, h]) => {
      const p = babochkaPoTrap(trap(6, 3, x, h));
      return dist(p.K, p.L);
    });
    sch.fakt(
      'б) KL не зависит от формы трапеции',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiBabochki(t);
    sch.fakt('данные: BC = 3, AD = 6', blizko(dist(p.B, p.C), 3) && blizko(dist(p.A, p.D), 6));
    return dist(p.K, p.L);
  },
  a(rnd, sch) {
    proveritBabochku(sch, babochkaPoTrap(sluchaynayaTrap(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritBabochku(sch, L().tochkiBabochki(t), 'чертёж');
  },
};

/* 16. ∠A + ∠D = 90°, M и N — середины BC и AD: MN = (AD − BC)/2. */
/** Трапеция по AD, AB и углу A; угол D = 90° − A; верхнее основание — на высоте B. */
function ugol90(ad, ab, uA) {
  const A = [0, 0];
  const D = [ad, 0];
  const B = polar(uA, ab);
  const C = peresech(D, add(D, polar(180 - (90 - uA))), B, add(B, [1, 0]));
  return { A, B, C, D };
}
function proveritUgol90(sch, { A, B, C, D, M, N }, imya) {
  sch.fakt(
    `${imya}: трапеция, ∠A + ∠D = 90°, M и N — середины оснований`,
    etoTrap({ A, B, C, D }) &&
      blizko(ugol(B, A, D) + ugol(C, D, A), 90, 1e-6) &&
      blizko(dist(M, mid(B, C)), 0) &&
      blizko(dist(N, mid(A, D)), 0),
  );
  sch.fakt(`${imya}: MN = (AD − BC)/2`, blizko(dist(M, N), (dist(A, D) - dist(B, C)) / 2));
}
const UGOL_90 = {
  id: 'tp-ugol-90',
  b(sch) {
    /* AD = 14, AB = 6: угол A подбираем так, чтобы BC = 4. */
    const uA = koren(
      (u) => {
        const t = ugol90(14, 6, u);
        return t.C[0] - t.B[0] - 4;
      },
      10,
      80,
    );
    const t = ugol90(14, 6, uA);
    sch.fakt(
      'б) AD = 14, BC = 4, AB = 6, ∠A + ∠D = 90°',
      blizko(dist(t.A, t.D), 14) &&
        blizko(dist(t.B, t.C), 4) &&
        blizko(dist(t.A, t.B), 6) &&
        blizko(ugol(t.B, t.A, t.D) + ugol(t.C, t.D, t.A), 90, 1e-6),
    );
    return ploshchad([t.A, t.B, t.C, t.D]);
  },
  nachalo(t, sch) {
    const p = L().tochkiUgol90(t);
    sch.fakt(
      'данные: AD = 14, BC = 4, AB = 6',
      blizko(dist(p.A, p.D), 14) && blizko(dist(p.B, p.C), 4) && blizko(dist(p.A, p.B), 6),
    );
    return ploshchad([p.A, p.B, p.C, p.D]);
  },
  a(rnd, sch) {
    const ad = 4 + rnd() * 10;
    const uA = 15 + rnd() * 60;
    /* AB — не длиннее стороны прямоугольного треугольника APD, иначе трапеции нет. */
    const ab = ad * Math.cos((uA * Math.PI) / 180) * (0.1 + 0.8 * rnd());
    const t = ugol90(ad, ab, uA);
    proveritUgol90(sch, { ...t, M: mid(t.B, t.C), N: mid(t.A, t.D) }, 'а)');
  },
  scena(t, sch) {
    proveritUgol90(sch, L().tochkiUgol90(t), 'чертёж');
  },
};

export const ZADACHI = [SREDLIN, RAVNOBOKAYA, BABOCHKA, UGOL_90];
