/* scripts/verify_trenazher18/treugolnik.mjs — задачи 1–4 тренажёра
   (тема «Треугольник»).

   У каждой задачи (как в verify_opornye18):
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
  incentr,
  koren,
  mid,
  naPryamoy,
  osnovanie,
  peresech,
  perimetr,
  ploshchad,
  poStoronam,
  polar,
  sinUgla,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/trenazher/treugolnik');
const ostryy = ({ A, B, C }) => Math.max(ugol(B, A, C), ugol(A, B, C), ugol(A, C, B)) < 89;

/* 1. Середины сторон: AMNK — параллелограмм. */
function proveritSredlin(sch, { A, B, C, M, N, K }, imya) {
  sch.fakt(
    `${imya}: M, N, K — середины AB, BC, CA`,
    blizko(dist(A, M), dist(M, B)) &&
      blizko(dist(B, N), dist(N, C)) &&
      blizko(dist(A, K), dist(K, C)) &&
      naPryamoy(A, B, M) &&
      naPryamoy(B, C, N) &&
      naPryamoy(A, C, K),
  );
  sch.fakt(
    `${imya}: MN ∥ AK, MN = AK; NK ∥ AM, NK = AM`,
    sinUgla(M, N, A, K) < 1e-9 &&
      blizko(dist(M, N), dist(A, K)) &&
      sinUgla(N, K, A, M) < 1e-9 &&
      blizko(dist(N, K), dist(A, M)),
  );
}
const SREDLIN = {
  id: 'tr-sredlin',
  b(sch) {
    const otvety = [6, 9, 12, 16, 20].map((bc) => {
      const { A, B, C } = poStoronam(bc, 14, 10);
      return perimetr([A, mid(A, B), mid(B, C), mid(A, C)]);
    });
    sch.fakt(
      'б) периметр не зависит от BC',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiSredlin(t);
    sch.fakt('данные: AB = 10, AC = 14', blizko(dist(p.A, p.B), 10) && blizko(dist(p.A, p.C), 14));
    return perimetr([p.A, p.M, p.N, p.K]);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritSredlin(sch, { A, B, C, M: mid(A, B), N: mid(B, C), K: mid(A, C) }, 'а)');
  },
  scena(t, sch) {
    proveritSredlin(sch, L().tochkiSredlin(t), 'чертёж');
  },
};

/* 2. Высоты AA₁, BB₁: ∠AA₁B₁ = ∠ABB₁; A₁B₁ = AB·cos C. */
function proveritVysoty(sch, { A, B, C, A1, B1 }, imya) {
  sch.fakt(
    `${imya}: A₁ на BC, B₁ на AC, AA₁ ⊥ BC, BB₁ ⊥ AC`,
    naPryamoy(B, C, A1) &&
      naPryamoy(A, C, B1) &&
      blizko(ugol(A, A1, B), 90, 1e-6) &&
      blizko(ugol(B, B1, A), 90, 1e-6),
  );
  sch.fakt(`${imya}: ∠AA₁B₁ = ∠ABB₁`, blizko(ugol(A, A1, B1), ugol(A, B, B1), 1e-6));
  sch.fakt(
    `${imya}: A₁B₁ = AB·cos C`,
    blizko(dist(A1, B1), dist(A, B) * Math.cos((ugol(A, C, B) * Math.PI) / 180)),
  );
}
const VYSOTY = {
  id: 'tr-vysoty',
  b(sch) {
    const otvety = [50, 60, 70, 80].map((uA) => {
      const uB = 135 - uA;
      const A = [0, 0];
      const B = [12, 0];
      const C = peresech(A, polar(uA), B, add(B, polar(180 - uB)));
      sch.fakt(
        'б) треугольник остроугольный, ∠C = 45°',
        ostryy({ A, B, C }) && blizko(ugol(A, C, B), 45),
      );
      return dist(osnovanie(A, B, C), osnovanie(B, A, C));
    });
    sch.fakt(
      'б) A₁B₁ не зависит от углов A и B',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiVysot(t);
    sch.fakt(
      'данные: AB = 12, ∠C = 45°, остроугольный',
      blizko(dist(p.A, p.B), 12) && blizko(ugol(p.A, p.C, p.B), 45) && ostryy(p),
    );
    return dist(p.A1, p.B1);
  },
  a(rnd, sch) {
    let t;
    do t = sluchaynyyTreugolnik(rnd, 10);
    while (!ostryy(t));
    proveritVysoty(sch, { ...t, A1: osnovanie(t.A, t.B, t.C), B1: osnovanie(t.B, t.A, t.C) }, 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiVysot(t);
    sch.fakt('чертёж: треугольник остроугольный', ostryy(p));
    proveritVysoty(sch, p, 'чертёж');
  },
};

/* 3. Биссектрисы AA₁, BB₁, точка I: AI : IA₁ = (AB + AC) : BC. */
function bissektrisa(v, p, q) {
  return peresech(v, add(v, add(ed(sub(p, v)), ed(sub(q, v)))), p, q);
}
function proveritIncentr(sch, { A, B, C, A1, B1, I }, imya) {
  sch.fakt(
    `${imya}: A₁, B₁ — концы биссектрис, I — их пересечение`,
    blizko(ugol(B, A, A1), ugol(A1, A, C), 1e-6) &&
      blizko(ugol(A, B, B1), ugol(B1, B, C), 1e-6) &&
      naPryamoy(B, C, A1) &&
      naPryamoy(A, C, B1) &&
      naPryamoy(A, A1, I) &&
      naPryamoy(B, B1, I),
  );
  sch.fakt(
    `${imya}: AI : IA₁ = (AB + AC) : BC`,
    blizko(dist(A, I) / dist(I, A1), (dist(A, B) + dist(A, C)) / dist(B, C)),
  );
}
const INCENTR = {
  id: 'tr-incentr',
  b() {
    const { A, B, C } = poStoronam(10, 9, 6);
    const I = incentr(A, B, C);
    const A1 = peresech(A, I, B, C);
    return dist(A, I) / dist(I, A1);
  },
  nachalo(t, sch) {
    const p = L().tochkiIncentra(t);
    sch.fakt(
      'данные: AB = 6, AC = 9, BC = 10',
      blizko(dist(p.A, p.B), 6) && blizko(dist(p.A, p.C), 9) && blizko(dist(p.B, p.C), 10),
    );
    return dist(p.A, p.I) / dist(p.I, p.A1);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    const A1 = bissektrisa(A, B, C);
    const B1 = bissektrisa(B, A, C);
    proveritIncentr(sch, { A, B, C, A1, B1, I: peresech(A, A1, B, B1) }, 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiIncentra(t);
    sch.fakt(
      'чертёж: I — центр вписанной окружности',
      blizko(dist(p.I, incentr(p.A, p.B, p.C)), 0),
    );
    proveritIncentr(sch, p, 'чертёж');
  },
};

/* 4. Медиана AM: AB² + AC² = 2AM² + BC²/2; площадь по AB, AC, AM. */
function proveritMedianu(sch, { A, B, C, M }, imya) {
  sch.fakt(`${imya}: M — середина BC`, blizko(dist(B, M), dist(M, C)) && naPryamoy(B, C, M));
  sch.fakt(
    `${imya}: AB² + AC² = 2AM² + BC²/2`,
    blizko(dist(A, B) ** 2 + dist(A, C) ** 2, 2 * dist(A, M) ** 2 + dist(B, C) ** 2 / 2),
  );
}
const MEDIANA = {
  id: 'tr-mediana',
  b(sch) {
    /* BC подбирается так, чтобы медиана AM была равна 7, — без формулы медианы. */
    const tr = (a) => poStoronam(a, 9, 7);
    const a = koren(
      (x) => {
        const { A, B, C } = tr(x);
        return dist(A, mid(B, C)) - 7;
      },
      2.5,
      15.5,
    );
    const { A, B, C } = tr(a);
    sch.fakt(
      'б) AB = 7, AC = 9, AM = 7',
      blizko(dist(A, B), 7) && blizko(dist(A, C), 9) && blizko(dist(A, mid(B, C)), 7),
    );
    return ploshchad([A, B, C]);
  },
  nachalo(t, sch) {
    const p = L().tochkiMediany(t);
    sch.fakt(
      'данные: AB = 7, AC = 9, AM = 7',
      blizko(dist(p.A, p.B), 7) && blizko(dist(p.A, p.C), 9) && blizko(dist(p.A, p.M), 7),
    );
    sch.fakt(
      'чертёж: ABDC — параллелограмм',
      blizko(dist(p.B, p.D), dist(p.A, p.C)) && blizko(dist(p.C, p.D), dist(p.A, p.B)),
    );
    return ploshchad([p.A, p.B, p.C]);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritMedianu(sch, { A, B, C, M: mid(B, C) }, 'а)');
  },
  scena(t, sch) {
    proveritMedianu(sch, L().tochkiMediany(t), 'чертёж');
  },
};

export const ZADACHI = [SREDLIN, VYSOTY, INCENTR, MEDIANA];
