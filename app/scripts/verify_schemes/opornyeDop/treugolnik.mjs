/* scripts/verify_schemes/opornyeDop/treugolnik.mjs — опорная задача 7 (тема «Треугольник»).

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
  mid,
  ploshchad,
  poStoronam,
  sluchaynyyTreugolnik,
  sub,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornyeDop/treugolnik');

/* 7. Медиана AM: AM < (AB + AC)/2; площадь по двум сторонам и медиане. */
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

export const ZADACHI = [MEDIANA];
