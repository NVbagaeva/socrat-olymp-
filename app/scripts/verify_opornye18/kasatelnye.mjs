/* scripts/verify_opornye18/kasatelnye.mjs — задачи 7–9 (тема «Касательные»).
   Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  add,
  blizko,
  dist,
  doPryamoy,
  koren,
  mul,
  osnovanie,
  peresech,
  polar,
  pryamayaOkr,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornye/kasatelnye');

/* 7. Касательная AB и секущая ACD: △ABC ∼ △ADB. */
function proveritKasSek(sch, { A, B, C, D }, okr, imya) {
  sch.fakt(
    `${imya}: AB касается окружности в B, C и D на окружности, C между A и D`,
    blizko(ugol(A, B, okr.c), 90, 1e-6) &&
      blizko(dist(okr.c, C), okr.r) &&
      blizko(dist(okr.c, D), okr.r) &&
      blizko(dist(A, C) + dist(C, D), dist(A, D)),
  );
  sch.fakt(`${imya}: ∠ABC = ∠ADB`, blizko(ugol(A, B, C), ugol(A, D, B), 1e-6));
  const k = dist(A, B) / dist(A, D);
  sch.fakt(
    `${imya}: AB/AD = AC/AB = BC/DB`,
    blizko(dist(A, C) / dist(A, B), k) && blizko(dist(B, C) / dist(D, B), k),
  );
}

const KAS_SEK = {
  id: 'kasatelnaya-sekushchaya',
  b(sch) {
    /* Окружность касается AB в B и проходит через D: AB = 6, AD = BD = 9. */
    const A = [0, 0];
    const B = [6, 0];
    const D = [3, Math.sqrt(81 - 9)];
    /* Центр (6; y): равноудалён от B и D. */
    const y = ((D[0] - 6) ** 2 + D[1] ** 2) / (2 * D[1]);
    const okr = { c: [6, y], r: y };
    const per = pryamayaOkr(A, D, okr);
    const C = per.reduce((x, z) => (z.t < x.t ? z : x)).p;
    sch.fakt('б) данные согласованы: AC = 4', blizko(dist(A, C), 4));
    proveritKasSek(sch, { A, B, C, D }, okr, 'б)');
    return dist(B, C);
  },
  nachalo(t, sch) {
    const p = L().tochkiKasSek(t);
    sch.fakt(
      'данные: AB = 6, AC = 4, BD = 9',
      blizko(dist(p.A, p.B), 6) && blizko(dist(p.A, p.C), 4) && blizko(dist(p.B, p.D), 9),
    );
    return dist(p.B, p.C);
  },
  a(rnd, sch) {
    const okr = { c: [rnd() * 4 - 2, rnd() * 4 - 2], r: 1 + rnd() * 4 };
    const A = add(okr.c, polar(rnd() * 360, okr.r * (1.3 + rnd() * 2)));
    /* Касательная: B на окружности, ∠ABO = 90°. */
    const d = dist(A, okr.c);
    const u = (Math.atan2(A[1] - okr.c[1], A[0] - okr.c[0]) * 180) / Math.PI;
    const fi = (Math.acos(okr.r / d) * 180) / Math.PI;
    const B = add(okr.c, polar(u + (rnd() < 0.5 ? fi : -fi), okr.r));
    /* Секущая под случайным углом к AO, меньше угла касательной. */
    const dir = sub(okr.c, A);
    const alfa = (rnd() * 2 - 1) * 0.85 * Math.asin(okr.r / d);
    const v = [
      dir[0] * Math.cos(alfa) - dir[1] * Math.sin(alfa),
      dir[0] * Math.sin(alfa) + dir[1] * Math.cos(alfa),
    ];
    const per = pryamayaOkr(A, add(A, v), okr);
    proveritKasSek(sch, { A, B, C: per[0].p, D: per[1].p }, okr, 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiKasSek(t);
    proveritKasSek(sch, p, p.krug, 'чертёж');
  },
};

/* 8. Описанная равнобедренная трапеция: боковая = полусумме оснований. */
function opisTrap(a, b) {
  /* Высоту находим из касания: расстояние от центра (0; h/2) до AB равно h/2. */
  const h = koren(
    (h) => doPryamoy([0, h / 2], [-a / 2, 0], [-b / 2, h]) - h / 2,
    1e-6,
    10 * (a + b),
  );
  const A = [-a / 2, 0];
  const B = [-b / 2, h];
  const C = [b / 2, h];
  const D = [a / 2, 0];
  const I = [0, h / 2];
  return { A, B, C, D, I, r: h / 2, K: osnovanie(I, A, B), N: osnovanie(I, C, D) };
}
function proveritOpisTrap(sch, { A, B, C, D, I, r }, imya) {
  sch.fakt(
    `${imya}: окружность касается всех четырёх сторон`,
    [
      [A, B],
      [B, C],
      [C, D],
      [D, A],
    ].every(([p, q]) => blizko(doPryamoy(I, p, q), r)),
  );
  sch.fakt(
    `${imya}: AB = CD = (AD + BC)/2`,
    blizko(dist(A, B), (dist(A, D) + dist(B, C)) / 2) && blizko(dist(A, B), dist(C, D)),
  );
}

const OPIS_TRAP = {
  id: 'opisannaya-trapeciya',
  b(sch) {
    const p = opisTrap(8, 2);
    proveritOpisTrap(sch, p, 'б)');
    sch.fakt('б) AK = 4, BK = 1', blizko(dist(p.A, p.K), 4) && blizko(dist(p.B, p.K), 1));
    return dist(p.K, p.N);
  },
  nachalo(t, sch) {
    const p = L().tochkiOpisTrap(t);
    sch.fakt('данные: AD = 8, BC = 2', blizko(dist(p.A, p.D), 8) && blizko(dist(p.B, p.C), 2));
    sch.fakt('б) KX = XN = 8/5', blizko(dist(p.K, p.X), 1.6) && blizko(dist(p.X, p.N), 1.6));
    return dist(p.K, p.N);
  },
  a(rnd, sch) {
    const a = 2 + rnd() * 10;
    proveritOpisTrap(sch, opisTrap(a, a * (0.05 + rnd() * 0.9)), 'а)');
  },
  scena(t, sch) {
    proveritOpisTrap(sch, L().tochkiOpisTrap(t), 'чертёж');
  },
};

/* 9. Внешнее касание окружностей: ∠AKB = 90°. */
function kasOkr(R, r) {
  const O1 = [0, 0];
  const O2 = [R + r, 0];
  /* Общая внешняя касательная n·x = R, |n| = 1: n·O₂ − R = −r... с той же стороны. */
  const nx = (R - r) / (R + r);
  const n = [nx, Math.sqrt(1 - nx * nx)];
  const A = add(O1, mul(n, R));
  const B = add(O2, mul(n, r));
  return { O1, O2, A, B, K: [R, 0] };
}
function proveritKasOkr(sch, { O1, O2, A, B, K, R, r }, imya) {
  sch.fakt(
    `${imya}: AB касается обеих окружностей, K — точка касания`,
    blizko(ugol(O1, A, B), 90, 1e-6) &&
      blizko(ugol(O2, B, A), 90, 1e-6) &&
      blizko(dist(O1, K), R) &&
      blizko(dist(O2, K), r) &&
      blizko(dist(O1, O2), R + r),
  );
  sch.fakt(`${imya}: ∠AKB = 90°`, blizko(ugol(A, K, B), 90, 1e-6));
  sch.fakt(`${imya}: AB = 2√(Rr)`, blizko(dist(A, B), 2 * Math.sqrt(R * r)));
}

const KAS_OKR = {
  id: 'kasayushchiesya-okruzhnosti',
  b(sch) {
    const p = kasOkr(9, 4);
    proveritKasOkr(sch, { ...p, R: 9, r: 4 }, 'б)');
    /* Касательная в K пересекает AB в M: AM = 6. */
    const M = peresech(p.K, add(p.K, [0, 1]), p.A, p.B);
    sch.fakt(
      'б) AM = MK = MB = 6',
      [p.A, p.K, p.B].every((x) => blizko(dist(M, x), 6)),
    );
    return dist(p.A, p.K);
  },
  nachalo(t, sch) {
    const p = L().tochkiKasOkr(t);
    sch.fakt('данные: радиусы 9 и 4', blizko(p.R, 9) && blizko(p.r, 4));
    proveritKasOkr(sch, p, 'нач.');
    sch.fakt(
      'б) L — середина AK, O₁M ⟂ AK',
      blizko(dist(p.A, p.L), dist(p.L, p.K)) && blizko(ugol(p.A, p.L, p.O1), 90, 1e-6),
    );
    return dist(p.A, p.K);
  },
  a(rnd, sch) {
    const R = 0.5 + rnd() * 8;
    const r = 0.5 + rnd() * 8;
    proveritKasOkr(sch, { ...kasOkr(R, r), R, r }, 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiKasOkr(t);
    proveritKasOkr(sch, p, 'чертёж');
    sch.fakt(
      'чертёж: MA = MK = MB',
      blizko(dist(p.M, p.A), dist(p.M, p.K)) && blizko(dist(p.M, p.B), dist(p.M, p.K)),
    );
  },
};

export const ZADACHI = [KAS_SEK, OPIS_TRAP, KAS_OKR];
