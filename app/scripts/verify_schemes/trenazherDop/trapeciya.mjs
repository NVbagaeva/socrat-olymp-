/* scripts/verify_schemes/trenazherDop/trapeciya.mjs — перенесённые задачи
   тренажёра, тема «Трапеция». Трапеция ABCD: основания AD и BC, AD внизу. Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../../lib/load-ts.mjs';
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

const L = () => requireSrc('lib/zadanie18/trenazher/dop/trapeciya');

/** Трапеция: A(0; 0), D(ad; 0), B(x; h), C(x + bc; h). */
const trap = (ad, bc, x, h) => ({ A: [0, 0], D: [ad, 0], B: [x, h], C: [x + bc, h] });
function sluchaynayaTrap(rnd) {
  const ad = 4 + rnd() * 10;
  const bc = ad * (0.15 + 0.7 * rnd());
  return trap(ad, bc, (rnd() * 2 - 0.5) * (ad - bc), 1 + rnd() * 8);
}
const etoTrap = ({ A, B, C, D }) => sinUgla(A, D, B, C) < 1e-9 && dist(A, D) > dist(B, C);

/* tp-ravnobokaya: Равнобедренная трапеция, высота CH: AH = (AD + BC)/2. */
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
  b(sch, _rnd, d) {
    /* Трапеции строятся по основаниям с суммой 2√(AC² − CH²) и высотой CH;
       проверяется, что диагональ равна данной AC. */
    const summa = 2 * Math.sqrt(d.AC ** 2 - d.CH ** 2);
    const otvety = [0.05, 0.2, 0.35, 0.45].map((k) => {
      const bc = summa * k;
      const t = ravnob(summa - bc, bc, d.CH);
      sch.fakt(`б) AC = ${d.AC}, CH = ${d.CH}`, blizko(dist(t.A, t.C), d.AC));
      return ploshchad([t.A, t.B, t.C, t.D]);
    });
    sch.fakt(
      'б) площадь не зависит от оснований',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch, d) {
    const p = L().tochkiRavnobokoy(t);
    sch.fakt(
      `данные: AC = ${d.AC}, CH = ${d.CH}, трапеция равнобедренная`,
      blizko(dist(p.A, p.C), d.AC) &&
        blizko(dist(p.C, p.H), d.CH) &&
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

/* tp-babochka: Прямая через O ∥ основаниям пересекает AB в K, CD в L: KO = OL. */
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
  b(sch, _rnd, d) {
    const otvety = [
      [0, 2],
      [1, 4],
      [-2, 3],
      [4, 6],
    ].map(([x, h]) => {
      const p = babochkaPoTrap(trap(d.AD, d.BC, x, h));
      return dist(p.K, p.L);
    });
    sch.fakt(
      'б) KL не зависит от формы трапеции',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch, d) {
    const p = L().tochkiBabochki(t);
    sch.fakt(
      `данные: BC = ${d.BC}, AD = ${d.AD}`,
      blizko(dist(p.B, p.C), d.BC) && blizko(dist(p.A, p.D), d.AD),
    );
    return dist(p.K, p.L);
  },
  a(rnd, sch) {
    proveritBabochku(sch, babochkaPoTrap(sluchaynayaTrap(rnd)), 'а)');
  },
  scena(t, sch) {
    proveritBabochku(sch, L().tochkiBabochki(t), 'чертёж');
  },
};

/* tp-ugol-90: ∠A + ∠D = 90°, M и N — середины BC и AD: MN = (AD − BC)/2. */
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
  b(sch, _rnd, d) {
    /* По AD и AB угол A подбираем так, чтобы BC совпало с данным. */
    const uA = koren(
      (u) => {
        const t = ugol90(d.AD, d.AB, u);
        return t.C[0] - t.B[0] - d.BC;
      },
      10,
      80,
    );
    const t = ugol90(d.AD, d.AB, uA);
    sch.fakt(
      `б) AD = ${d.AD}, BC = ${d.BC}, AB = ${d.AB}, ∠A + ∠D = 90°`,
      blizko(dist(t.A, t.D), d.AD) &&
        blizko(dist(t.B, t.C), d.BC) &&
        blizko(dist(t.A, t.B), d.AB) &&
        blizko(ugol(t.B, t.A, t.D) + ugol(t.C, t.D, t.A), 90, 1e-6),
    );
    return ploshchad([t.A, t.B, t.C, t.D]);
  },
  nachalo(t, sch, d) {
    const p = L().tochkiUgol90(t);
    sch.fakt(
      `данные: AD = ${d.AD}, BC = ${d.BC}, AB = ${d.AB}`,
      blizko(dist(p.A, p.D), d.AD) && blizko(dist(p.B, p.C), d.BC) && blizko(dist(p.A, p.B), d.AB),
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

export const ZADACHI = [RAVNOBOKAYA, BABOCHKA, UGOL_90];
