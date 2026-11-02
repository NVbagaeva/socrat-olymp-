/* scripts/verify_schemes/trenazherDop/treugolnik.mjs — перенесённые задачи
   тренажёра, тема «Треугольник».

   У каждой задачи:
     b(sch)          — пункт б) по данным, построенный здесь заново, без lib/;
     nachalo(t, sch) — те же данные на чертеже задачи (точки — из lib/);
     a(rnd, sch)     — утверждение а) на случайной фигуре, построенной здесь;
     scena(t, sch)   — утверждение а) на чертеже задачи. */

import { requireSrc } from '../../lib/load-ts.mjs';
import {
  add,
  blizko,
  dist,
  ed,
  incentr,
  mid,
  naPryamoy,
  peresech,
  perimetr,
  poStoronam,
  sinUgla,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/trenazher/dop/treugolnik');

/* tr-sredlin: Середины сторон: AMNK — параллелограмм. */
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

/* tr-incentr: Биссектрисы AA₁, BB₁, точка I: AI : IA₁ = (AB + AC) : BC. */
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

export const ZADACHI = [SREDLIN, INCENTR];
