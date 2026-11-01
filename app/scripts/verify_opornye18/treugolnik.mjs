/* scripts/verify_opornye18/treugolnik.mjs — задачи 1–3 (тема «Треугольник»).

   У каждой задачи:
     b(sch)          — пункт б) по данным, построенный здесь заново, без lib/;
     nachalo(t, sch) — те же данные на исходном положении чертежа (точки — из lib/);
     a(rnd, sch)     — утверждение а) на случайной фигуре, построенной здесь;
     scena(t, sch)   — утверждение а) на случайном положении чертежа. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  add,
  blizko,
  dist,
  ed,
  mid,
  opisannaya,
  osnovanie,
  peresech,
  ploshchad,
  poStoronam,
  polar,
  sinUgla,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornye/treugolnik');

/* 1. Высоты AA₁, CC₁: △A₁BC₁ ∼ △ABC с k = cos B; радиус окружности A₁BC₁. */
function proveritVysoty(sch, { A, B, C, A1, C1 }, imya) {
  const k = Math.cos((ugol(A, B, C) * Math.PI) / 180);
  sch.fakt(
    `${imya}: BA₁/BA = BC₁/BC = A₁C₁/AC = cos B`,
    blizko(dist(B, A1) / dist(B, A), k) &&
      blizko(dist(B, C1) / dist(B, C), k) &&
      blizko(dist(A1, C1) / dist(A, C), k),
  );
  sch.fakt(
    `${imya}: ∠BA₁C₁ = ∠BAC, ∠BC₁A₁ = ∠BCA`,
    blizko(ugol(B, A1, C1), ugol(B, A, C), 1e-6) && blizko(ugol(B, C1, A1), ugol(B, C, A), 1e-6),
  );
}
function vysoty(A, B, C) {
  return { A, B, C, A1: osnovanie(A, B, C), C1: osnovanie(C, A, B) };
}
function ostryy({ A, B, C }) {
  return Math.max(ugol(B, A, C), ugol(A, B, C), ugol(A, C, B)) < 89;
}

const VYSOTY = {
  id: 'vysoty-radius',
  b(sch) {
    /* AC = 12, ∠B = 60°; ответ не должен зависеть от остальных углов. */
    const otvety = [40, 55, 70, 80].map((uA) => {
      const uC = 120 - uA;
      const A = [0, 0];
      const C = [12, 0];
      const B = peresech(A, polar(uA), C, add(C, polar(180 - uC)));
      const { A1, C1 } = vysoty(A, B, C);
      return opisannaya(A1, B, C1).r;
    });
    sch.fakt(
      'б) радиус не зависит от углов A и C',
      otvety.every((r) => blizko(r, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiVysotRadius(t);
    sch.fakt(
      'данные: AC = 12, ∠B = 60°, треугольник остроугольный',
      blizko(dist(p.A, p.C), 12) && blizko(ugol(p.A, p.B, p.C), 60) && ostryy(p),
    );
    /* Шаги б): R = 4√3, BH = 2r. */
    const r = opisannaya(p.A1, p.B, p.C1).r;
    sch.fakt(
      'б) R(ABC) = 4√3, BH = 2r',
      blizko(opisannaya(p.A, p.B, p.C).r, 4 * Math.sqrt(3)) && blizko(dist(p.B, p.H), 2 * r),
    );
    return r;
  },
  a(rnd, sch) {
    let t;
    do t = sluchaynyyTreugolnik(rnd, 10);
    while (!ostryy(t));
    proveritVysoty(sch, vysoty(t.A, t.B, t.C), 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiVysotRadius(t);
    sch.fakt('чертёж: треугольник остроугольный', ostryy(p));
    proveritVysoty(sch, p, 'чертёж');
    sch.fakt(
      'чертёж: A₁, C₁ на окружности с диаметром BH',
      blizko(ugol(p.B, p.A1, p.H), 90, 1e-6) && blizko(ugol(p.B, p.C1, p.H), 90, 1e-6),
    );
  },
};

/* 2. Биссектриса AL, LK ∥ AB: AK = KL. */
function bissParallel(A, B, C) {
  const L0 = peresech(A, add(A, add(ed(sub(B, A)), ed(sub(C, A)))), B, C);
  const K = peresech(L0, add(L0, sub(B, A)), A, C);
  return { A, B, C, L: L0, K };
}
function proveritBiss(sch, { A, B, C, L: L0, K }, imya) {
  sch.fakt(
    `${imya}: L на BC, ∠BAL = ∠LAC; K на AC, KL ∥ AB`,
    blizko(dist(B, L0) + dist(L0, C), dist(B, C)) &&
      blizko(ugol(B, A, L0), ugol(L0, A, C), 1e-6) &&
      blizko(dist(A, K) + dist(K, C), dist(A, C)) &&
      sinUgla(A, B, K, L0) < 1e-9,
  );
  sch.fakt(`${imya}: AK = KL`, blizko(dist(A, K), dist(K, L0)));
  sch.fakt(`${imya}: ∠KLA = ∠LAB`, blizko(ugol(K, L0, A), ugol(L0, A, B), 1e-6));
}

const BISSEKTRISA = {
  id: 'bissektrisa-parallel',
  b(sch) {
    const otvety = [30, 60, 90, 120].map((uA) => {
      const A = [0, 0];
      const p = bissParallel(A, polar(uA, 15), [10, 0]);
      sch.fakt('б) KC = 10 − KL', blizko(dist(p.K, p.C), 10 - dist(p.K, p.L)));
      return dist(p.K, p.L);
    });
    sch.fakt(
      'б) KL не зависит от угла A',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiBissParallel(t);
    sch.fakt('данные: AB = 15, AC = 10', blizko(dist(p.A, p.B), 15) && blizko(dist(p.A, p.C), 10));
    return dist(p.K, p.L);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritBiss(sch, bissParallel(A, B, C), 'а)');
  },
  scena(t, sch) {
    proveritBiss(sch, L().tochkiBissParallel(t), 'чертёж');
  },
};

/* 3. Медиана AM: AM < (AB + AC)/2; площадь по двум сторонам и медиане. */
function proveritMedianu(sch, { A, B, C, M, D }, imya) {
  sch.fakt(
    `${imya}: M — середина BC, MD = AM, BD = AC`,
    blizko(dist(B, M), dist(M, C)) &&
      blizko(dist(M, D), dist(A, M)) &&
      blizko(dist(B, D), dist(A, C)),
  );
  sch.fakt(`${imya}: AM < (AB + AC)/2`, dist(A, M) < (dist(A, B) + dist(A, C)) / 2);
  sch.fakt(`${imya}: S(ABD) = S(ABC)`, blizko(ploshchad([A, B, D]), ploshchad([A, B, C])));
}

const MEDIANA = {
  id: 'mediana-ploshchad',
  b(sch) {
    /* Сторона BC из формулы медианы: 4·AM² = 2AB² + 2AC² − BC². */
    const a = Math.sqrt(2 * 13 ** 2 + 2 * 15 ** 2 - 4 * 7 ** 2);
    const { A, B, C } = poStoronam(a, 15, 13);
    sch.fakt(
      'б) треугольник с AB = 13, AC = 15 и медианой AM = 7 существует',
      blizko(dist(A, B), 13) && blizko(dist(A, C), 15) && blizko(dist(A, mid(B, C)), 7),
    );
    return ploshchad([A, B, C]);
  },
  nachalo(t, sch) {
    const p = L().tochkiMediany(t);
    sch.fakt(
      'данные: AB = 13, AC = 15, AM = 7',
      blizko(dist(p.A, p.B), 13) && blizko(dist(p.A, p.C), 15) && blizko(dist(p.A, p.M), 7),
    );
    return ploshchad([p.A, p.B, p.C]);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    const M = mid(B, C);
    proveritMedianu(sch, { A, B, C, M, D: sub(add(M, M), A) }, 'а)');
  },
  scena(t, sch) {
    proveritMedianu(sch, L().tochkiMediany(t), 'чертёж');
  },
};

export const ZADACHI = [VYSOTY, BISSEKTRISA, MEDIANA];
