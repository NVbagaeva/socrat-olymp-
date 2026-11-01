/* scripts/verify_opornye18/novye.mjs — новые опорные задачи №18
   (условия из курса подготовки, решения — content/zadanie18/opornye/novye.ts).

   Устройство — как в treugolnik.mjs: b() строит фигуру по данным б)
   здесь, без кода сайта, и возвращает ответ; nachalo() сверяет
   исходное положение чертежа с данными б); a() проверяет утверждение
   а) на случайной фигуре, построенной здесь; scena() — на случайном
   положении чертежа (касания, перпендикулярность, коллинеарность). */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  add,
  blizko,
  dist,
  doPryamoy,
  incentr,
  koren,
  mid,
  mul,
  naPryamoy,
  osnovanie,
  peresech,
  ploshchad,
  polar,
  pryamayaOkr,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/opornye/novye');
const RAD = Math.PI / 180;
const vO = (p, q, r) => blizko(dist(p, q), r, 1e-6);

/* ── 656. Диагонали трапеции ─────────────────────────────────────── */

function trapPoDiag(a, b, d1, d2) {
  /* A(0;0), D(a;0), BC = b на высоте h; AC = d1, BD = d2 — подбор h. */
  const s = a + b;
  const x = (d1 * d1 - d2 * d2 + s * s) / (2 * s);
  const h = Math.sqrt(d1 * d1 - x * x);
  const A = [0, 0];
  const D = [a, 0];
  const C = [x, h];
  const B = [x - b, h];
  return { A, B, C, D };
}
function proveritDiagTrap(sch, { A, B, C, D }, imya) {
  sch.fakt(
    `${imya}: ABCD — трапеция (BC ∥ AD)`,
    blizko(B[1], C[1], 1e-9) && blizko(A[1], D[1], 1e-9),
  );
  const O = peresech(A, C, B, D);
  sch.fakt(`${imya}: AC ⊥ BD`, blizko(ugol(A, O, B), 90, 1e-6));
}
const DIAG_TRAP = {
  id: 'diagonali-trapecii',
  b(sch) {
    const p = trapPoDiag(9, 4, 12, 5);
    sch.fakt(
      'б) данные: AD = 9, BC = 4, AC = 12, BD = 5',
      vO(p.A, p.D, 9) && vO(p.B, p.C, 4) && vO(p.A, p.C, 12) && vO(p.B, p.D, 5),
    );
    proveritDiagTrap(sch, p, 'б)');
    return ploshchad([p.A, p.B, p.C, p.D]);
  },
  nachalo(t, sch) {
    const p = L().tochkiDiagTrap(t);
    sch.fakt(
      'данные: 9, 4, 12, 5',
      vO(p.A, p.D, 9) && vO(p.B, p.C, 4) && vO(p.A, p.C, 12) && vO(p.B, p.D, 5),
    );
    return ploshchad([p.A, p.B, p.C, p.D]);
  },
  a(rnd, sch) {
    const a = 6 + rnd() * 6;
    const b = a * (0.2 + rnd() * 0.6);
    const u = (25 + rnd() * 40) * RAD;
    proveritDiagTrap(sch, trapPoDiag(a, b, (a + b) * Math.cos(u), (a + b) * Math.sin(u)), 'а)');
  },
  scena(t, sch) {
    proveritDiagTrap(sch, L().tochkiDiagTrap(t), 'чертёж');
  },
};

/* ── 657. Касающиеся окружности: EF ──────────────────────────────── */

function kasOkr(r1, r2) {
  /* Касательная — ось x; центры над ней, окружности касаются. */
  const A = [0, 0];
  const O1 = [0, r1];
  const xb = koren((x) => Math.hypot(x, r1 - r2) - (r1 + r2), 0, 10 * (r1 + r2));
  const B = [xb, 0];
  const O2 = [xb, r2];
  const K = add(O1, mul(sub(O2, O1), r1 / (r1 + r2)));
  /* N на AB, NK ⊥ O1O2 (общая внутренняя касательная). */
  const n = sub(O2, O1);
  const N = peresech(K, add(K, [-n[1], n[0]]), A, B);
  const E = peresech(A, K, O1, N);
  const F = peresech(B, K, O2, N);
  return { A, B, O1, O2, K, N, E, F, r1, r2 };
}
function proveritKasEF(sch, p, imya) {
  const { A, B, O1, O2, K, N, E, F, r1, r2 } = p;
  sch.fakt(
    `${imya}: касание окружностей в K, AB касается обеих`,
    vO(O1, K, r1) &&
      vO(O2, K, r2) &&
      blizko(dist(O1, O2), r1 + r2) &&
      blizko(doPryamoy(O1, A, B), r1) &&
      blizko(doPryamoy(O2, A, B), r2),
  );
  sch.fakt(
    `${imya}: ∠O₁NO₂ = ∠AKB = 90°`,
    blizko(ugol(O1, N, O2), 90, 1e-6) && blizko(ugol(A, K, B), 90, 1e-6),
  );
  sch.fakt(
    `${imya}: E, F — середины AK, BK; EF = AB/2`,
    blizko(dist(E, mid(A, K)), 0) &&
      blizko(dist(F, mid(B, K)), 0) &&
      blizko(dist(E, F), dist(A, B) / 2),
  );
}
const KAS_EF = {
  id: 'kasayushchiesya-ef',
  b(sch) {
    const p = kasOkr(8, 2);
    proveritKasEF(sch, p, 'б)');
    return dist(p.E, p.F);
  },
  nachalo(t, sch) {
    const p = L().tochkiKasEF(t);
    sch.fakt('данные: радиусы 8 и 2', blizko(p.r1, 8) && blizko(p.r2, 2));
    proveritKasEF(sch, p, 'чертёж б)');
    return dist(p.E, p.F);
  },
  a(rnd, sch) {
    const r1 = 2 + rnd() * 8;
    proveritKasEF(sch, kasOkr(r1, r1 * (0.1 + rnd() * 0.85)), 'а)');
  },
  scena(t, sch) {
    proveritKasEF(sch, L().tochkiKasEF(t), 'чертёж');
  },
};

/* ── 658. Квадраты на сторонах ───────────────────────────────────── */

/** Вершина квадрата при Q на стороне PQ — с другой стороны от X. */
function kvVershina(p, q, x) {
  const v = sub(p, q);
  const n1 = [-v[1], v[0]];
  const m = mid(p, q);
  const s = (x[0] - m[0]) * n1[0] + (x[1] - m[1]) * n1[1];
  return add(q, s > 0 ? [v[1], -v[0]] : n1);
}
function kvadraty(A, B, C) {
  const D = kvVershina(A, C, B);
  const K = kvVershina(B, C, A);
  return { A, B, C, D, K, M: mid(A, B), O1: mid(A, D), O2: mid(B, K) };
}
function proveritKvadraty(sch, { A, B, C, D, K, M }, imya) {
  sch.fakt(
    `${imya}: квадраты построены вне треугольника`,
    blizko(ugol(A, C, D), 90, 1e-6) &&
      blizko(dist(C, D), dist(A, C)) &&
      blizko(ugol(B, C, K), 90, 1e-6) &&
      blizko(dist(C, K), dist(B, C)) &&
      Math.sign((D[0] - A[0]) * (C[1] - A[1]) - (D[1] - A[1]) * (C[0] - A[0])) !==
        Math.sign((B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])),
  );
  sch.fakt(`${imya}: CM = DK/2`, blizko(dist(C, M), dist(D, K) / 2));
}
const KVADRATY = {
  id: 'kvadraty-na-storonah',
  b(sch) {
    const C = [0, 0];
    const A = [14, 0];
    const B = polar(150, 16);
    const p = kvadraty(A, B, C);
    proveritKvadraty(sch, p, 'б)');
    sch.fakt('б) MO₁ = MO₂', blizko(dist(p.M, p.O1), dist(p.M, p.O2)));
    return dist(p.M, p.O1);
  },
  nachalo(t, sch) {
    const p = L().tochkiKvadraty(t);
    sch.fakt(
      'данные: AC = 14, BC = 16, ∠C = 150°',
      vO(p.A, p.C, 14) && vO(p.B, p.C, 16) && blizko(ugol(p.A, p.C, p.B), 150, 1e-6),
    );
    sch.fakt(
      'чертёж: O₁, O₂ — центры квадратов',
      blizko(dist(p.O1, p.A), dist(p.O1, p.C)) && blizko(ugol(p.A, p.O1, p.C), 90, 1e-6),
    );
    return dist(p.M, p.O1);
  },
  a(rnd, sch) {
    const A = [rnd() * 10, rnd() * 10];
    const B = [rnd() * 10 + 5, rnd() * 10 - 8];
    const C = [rnd() * 10 - 10, rnd() * 10 - 5];
    if (Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])) < 4) return;
    proveritKvadraty(sch, kvadraty(A, B, C), 'а)');
  },
  scena(t, sch) {
    proveritKvadraty(sch, L().tochkiKvadraty(t), 'чертёж');
  },
};

/* ── 659. Две окружности, диаметр CA ─────────────────────────────── */

function dveOkr(r1, r2, h) {
  const A = [0, -h];
  const B = [0, h];
  const O1 = [-Math.sqrt(r1 * r1 - h * h), 0];
  const O2 = [Math.sqrt(r2 * r2 - h * h), 0];
  const C = sub(mul(O1, 2), A);
  const k2 = { c: O2, r: r2 };
  const dal = (p, q) => pryamayaOkr(p, q, k2).reduce((x, z) => (z.t > x.t ? z : x)).p;
  return { A, B, C, D: dal(C, A), E: dal(C, B), O1, O2, r1, r2 };
}
function proveritDveOkr(sch, { A, B, C, D, O1, O2, r1, r2 }, imya) {
  sch.fakt(
    `${imya}: CA — диаметр первой, D — на второй за A`,
    vO(O1, C, r1) &&
      blizko(dist(C, A), 2 * r1) &&
      vO(O2, D, r2) &&
      blizko(dist(C, D), dist(C, A) + dist(A, D)),
  );
  const s1 = [dist(C, B), dist(B, D), dist(C, D)];
  const s2 = [dist(O1, A), dist(A, O2), dist(O1, O2)];
  const k = s1[0] / s2[0];
  sch.fakt(
    `${imya}: △CBD ∼ △O₁AO₂ (C→O₁, B→A, D→O₂)`,
    blizko(s1[1] / s2[1], k, 1e-6) && blizko(s1[2] / s2[2], k, 1e-6),
  );
}
const DVE_OKR = {
  id: 'dve-okruzhnosti-diametr',
  b(sch) {
    /* r подбирается из условия ∠DAE = ∠BAC при R = 4r, AB = 2. */
    const r = koren(
      (r) => {
        const p = dveOkr(r, 4 * r, 1);
        return ugol(p.D, p.A, p.E) - ugol(p.B, p.A, p.C);
      },
      1.05,
      6,
    );
    const p = dveOkr(r, 4 * r, 1);
    proveritDveOkr(sch, p, 'б)');
    sch.fakt(
      'б) ∠DAE = ∠BAC, AE — диаметр второй',
      blizko(ugol(p.D, p.A, p.E), ugol(p.B, p.A, p.C), 1e-6) &&
        blizko(dist(p.A, p.E), 2 * p.r2, 1e-6),
    );
    return dist(p.A, p.D);
  },
  nachalo(t, sch) {
    const p = L().tochkiDveOkr(t);
    sch.fakt(
      'данные: R = 4r, AB = 2, ∠DAE = ∠BAC',
      blizko(p.r2, 4 * p.r1) &&
        vO(p.A, p.B, 2) &&
        blizko(ugol(p.D, p.A, p.E), ugol(p.B, p.A, p.C), 1e-6),
    );
    return dist(p.A, p.D);
  },
  a(rnd, sch) {
    const r1 = 1.1 + rnd() * 2;
    const k = 1.15 + rnd() * 3;
    const p = dveOkr(r1, r1 * k, 1);
    /* Условие задачи: продолжения CA и CB пересекают вторую окружность
       (не касаются её в A или B). */
    if (dist(p.A, p.D) < 0.1 || dist(p.B, p.E) < 0.1) return;
    proveritDveOkr(sch, p, `а) r = ${r1.toFixed(3)}, R/r = ${k.toFixed(3)}`);
  },
  scena(t, sch) {
    proveritDveOkr(sch, L().tochkiDveOkr(t), 'чертёж');
  },
};

/* ── 660. Окружность через центр большей ─────────────────────────── */

function cherezCentr(cosFi, R, znak) {
  const O = [0, 0];
  const A = [0, R];
  const fi = Math.acos(cosFi) * znak;
  const C = [R * Math.sin(fi), R * Math.cos(fi)];
  const B = sub(O, C);
  /* M — вторая (кроме O) точка прямой BC на окружности с диаметром AO. */
  const per = pryamayaOkr(B, C, { c: mid(A, O), r: R / 2 })
    .map((x) => x.p)
    .filter((p) => dist(p, O) > 1e-9);
  const M = per[0];
  const P = sub(O, A);
  const Q = pryamayaOkr(A, M, { c: O, r: R })
    .map((x) => x.p)
    .find((p) => dist(p, A) > 1e-9);
  const K = peresech(P, C, A, Q);
  return { O, A, B, C, M, P, Q, K, R };
}
function proveritCherezCentr(sch, { O, A, B, C, M, P, Q, R }, imya) {
  sch.fakt(
    `${imya}: M на меньшей окружности и на BC, Q на большей`,
    vO(mid(A, O), M, R / 2) && naPryamoy(B, C, M, 1e-7) && vO(O, Q, R) && naPryamoy(A, M, Q, 1e-7),
  );
  sch.fakt(`${imya}: PQ ∥ BC`, naPryamoy([0, 0], sub(Q, P), sub(C, B), 1e-7));
}
const CHEREZ_CENTR = {
  id: 'okruzhnost-cherez-centr',
  b(sch) {
    /* sin ∠AOC = √15/4; C — на дуге AQ без P ⇒ cos > 0. */
    const p = cherezCentr(0.25, 1, 1);
    proveritCherezCentr(sch, p, 'б)');
    const q = cherezCentr(-0.25, 1, 1);
    sch.fakt(
      'б) при cos ∠AOC = −1/4 точка C не на дуге AQ без P (случай невозможен)',
      dist(q.C, q.P) < dist(q.C, q.A),
    );
    sch.fakt('б) K между A и Q', blizko(dist(p.A, p.K) + dist(p.K, p.Q), dist(p.A, p.Q)));
    return dist(p.K, p.A) / dist(p.Q, p.K);
  },
  nachalo(t, sch) {
    const p = L().tochkiCherezCentr(t);
    sch.fakt(
      'данные: sin ∠AOC = √15/4',
      blizko(Math.sin(ugol(p.A, p.O, p.C) * RAD), Math.sqrt(15) / 4),
    );
    return dist(p.K, p.A) / dist(p.Q, p.K);
  },
  a(rnd, sch) {
    proveritCherezCentr(
      sch,
      cherezCentr(Math.cos((15 + rnd() * 70) * RAD), 1 + rnd() * 5, rnd() < 0.5 ? 1 : -1),
      'а)',
    );
  },
  scena(t, sch) {
    proveritCherezCentr(sch, L().tochkiCherezCentr(t), 'чертёж');
  },
};

/* ── 661. Вписанная окружность KLM ───────────────────────────────── */

function vpisKLM(K, L_, M) {
  const I = incentr(K, L_, M);
  return { K, L: L_, M, I, A: osnovanie(I, K, L_), B: osnovanie(I, L_, M), C: osnovanie(I, M, K) };
}
function proveritVpisKLM(sch, { K, L: L_, M, I, A, B, C }, imya) {
  const r = doPryamoy(I, K, L_);
  sch.fakt(
    `${imya}: окружность касается сторон в A, B, C`,
    blizko(doPryamoy(I, L_, M), r) &&
      blizko(doPryamoy(I, M, K), r) &&
      vO(I, A, r) &&
      vO(I, B, r) &&
      vO(I, C, r),
  );
  sch.fakt(
    `${imya}: KC = (KL + KM − LM)/2`,
    blizko(dist(K, C), (dist(K, L_) + dist(K, M) - dist(L_, M)) / 2),
  );
}
const VPIS_KLM = {
  id: 'vpisannaya-otrezki',
  b(sch) {
    /* KC : CM = 3 : 2, ∠K = 60°: подбор LA = u при KC = 3, CM = 2. */
    const u = koren((u) => (2 + u) ** 2 - ((3 + u) ** 2 + 25 - 5 * (3 + u)), 0.01, 100);
    const K = [0, 0];
    const L_ = [3 + u, 0];
    const M = polar(60, 5);
    const p = vpisKLM(K, L_, M);
    proveritVpisKLM(sch, p, 'б)');
    sch.fakt('б) KC : CM = 3 : 2', blizko(dist(K, p.C) / dist(p.C, M), 1.5));
    return dist(p.B, L_) / dist(p.B, M);
  },
  nachalo(t, sch) {
    const p = L().tochkiVpisKLM(t);
    sch.fakt(
      'данные: KC : CM = 3 : 2, ∠K = 60°',
      blizko(dist(p.K, p.C) / dist(p.C, p.M), 1.5) && blizko(ugol(p.L, p.K, p.M), 60, 1e-6),
    );
    return dist(p.B, p.L) / dist(p.B, p.M);
  },
  a(rnd, sch) {
    const K = [0, 0];
    const L_ = [4 + rnd() * 8, 0];
    const M = polar(25 + rnd() * 110, 3 + rnd() * 8);
    proveritVpisKLM(sch, vpisKLM(K, L_, M), 'а)');
  },
  scena(t, sch) {
    proveritVpisKLM(sch, L().tochkiVpisKLM(t), 'чертёж');
  },
};

/* ── 662. Высоты и перпендикуляры ────────────────────────────────── */

function vysPerp(A, B, C) {
  const K = osnovanie(A, B, C);
  const M = osnovanie(C, A, B);
  return { A, B, C, K, M, E: osnovanie(M, A, K), H: osnovanie(K, C, M) };
}
function proveritVysPerp(sch, { A, B, C, E, H }, imya) {
  sch.fakt(`${imya}: EH ∥ AC`, naPryamoy([0, 0], sub(H, E), sub(C, A), 1e-7));
  const cb = Math.cos(ugol(A, B, C) * RAD);
  sch.fakt(`${imya}: EH : AC = cos²B`, blizko(dist(E, H) / dist(A, C), cb * cb, 1e-7));
}
const VYS_PERP = {
  id: 'vysoty-perpendikulyary',
  b(sch) {
    /* ∠B = 30°, остальные углы любые: ответ от них не зависит. */
    const otvety = [80, 65, 100].map((uA) => {
      const uC = 150 - uA;
      const B = [0, 0];
      const C = [10, 0];
      const A = polar(30, (10 * Math.sin(uC * RAD)) / Math.sin(uA * RAD));
      const p = vysPerp(A, B, C);
      proveritVysPerp(sch, p, `б) ∠A = ${uA}°`);
      return dist(p.E, p.H) / dist(A, C);
    });
    sch.fakt(
      'б) ответ не зависит от остальных углов',
      otvety.every((x) => blizko(x, otvety[0])),
    );
    return otvety[0];
  },
  nachalo(t, sch) {
    const p = L().tochkiVysPerp(t);
    sch.fakt('данные: ∠B = 30°', blizko(ugol(p.A, p.B, p.C), 30, 1e-6));
    return dist(p.E, p.H) / dist(p.A, p.C);
  },
  a(rnd, sch) {
    const B = [0, 0];
    const C = [10, 0];
    const uB = 15 + rnd() * 70;
    const uC = 15 + rnd() * (150 - uB);
    const uA = 180 - uB - uC;
    if (uA < 10) return;
    proveritVysPerp(
      sch,
      vysPerp(polar(uB, (10 * Math.sin(uC * RAD)) / Math.sin(uA * RAD)), B, C),
      'а)',
    );
  },
  scena(t, sch) {
    proveritVysPerp(sch, L().tochkiVysPerp(t), 'чертёж');
  },
};

/* ── 663. Биссектриса и средняя линия ────────────────────────────── */

function bissSred(b, a) {
  const C = [0, 0];
  const A = [-b, 0];
  const B = [0, a];
  const M = mid(A, B);
  const N = mid(B, C);
  const u = Math.atan2(B[1] - A[1], B[0] - A[0]) / 2;
  const L_ = peresech(A, add(A, [Math.cos(u), Math.sin(u)]), M, N);
  return { A, B, C, M, N, L: L_ };
}
function proveritBissSred(sch, { A, B, C, M, L: L_ }, imya) {
  const s1 = [dist(B, L_), dist(L_, C), dist(B, C)];
  const s2 = [dist(A, M), dist(M, L_), dist(A, L_)];
  const k = s1[0] / s2[0];
  sch.fakt(
    `${imya}: △BLC ∼ △AML (B→A, L→M, C→L)`,
    blizko(s1[1] / s2[1], k, 1e-7) && blizko(s1[2] / s2[2], k, 1e-7),
  );
  sch.fakt(`${imya}: AL — биссектриса угла A`, blizko(ugol(B, A, L_), ugol(L_, A, C), 1e-7));
}
const BISS_SRED = {
  id: 'bissektrisa-srednyaya-liniya',
  b(sch) {
    const p = bissSred(7, 24);
    sch.fakt('б) cos A = 7/25', blizko(Math.cos(ugol(p.B, p.A, p.C) * RAD), 7 / 25));
    proveritBissSred(sch, p, 'б)');
    return ploshchad([p.B, p.L, p.C]) / ploshchad([p.A, p.M, p.L]);
  },
  nachalo(t, sch) {
    const p = L().tochkiBissSred(t);
    sch.fakt('данные: cos A = 7/25', blizko(Math.cos(ugol(p.B, p.A, p.C) * RAD), 7 / 25));
    return ploshchad([p.B, p.L, p.C]) / ploshchad([p.A, p.M, p.L]);
  },
  a(rnd, sch) {
    const b = 3 + rnd() * 10;
    proveritBissSred(sch, bissSred(b, b * (0.3 + rnd() * 3)), 'а)');
  },
  scena(t, sch) {
    proveritBissSred(sch, L().tochkiBissSred(t), 'чертёж');
  },
};

/* ── 664. Вневписанные окружности прямоугольного треугольника ────── */

/** Центр вневписанной окружности напротив вершины P треугольника PQR. */
function vnevpis(P, Q, R) {
  const a = dist(Q, R);
  const b = dist(P, R);
  const c = dist(P, Q);
  const s = -a + b + c;
  const c0 = [(-a * P[0] + b * Q[0] + c * R[0]) / s, (-a * P[1] + b * Q[1] + c * R[1]) / s];
  return { c: c0, r: doPryamoy(c0, Q, R) };
}
function proveritVnevpis(sch, A, B, C, imya) {
  const ka = vnevpis(A, B, C);
  const kb = vnevpis(B, C, A);
  sch.fakt(
    `${imya}: обе окружности касаются прямых AB, BC, CA`,
    [ka, kb].every(
      (k) =>
        blizko(doPryamoy(k.c, A, B), k.r) &&
        blizko(doPryamoy(k.c, B, C), k.r) &&
        blizko(doPryamoy(k.c, C, A), k.r),
    ),
  );
  /* Катеты — внутренние касательные (окружности по разные стороны), гипотенуза — внешняя. */
  const storona = (p, q, x) =>
    Math.sign((q[0] - p[0]) * (x[1] - p[1]) - (q[1] - p[1]) * (x[0] - p[0]));
  sch.fakt(
    `${imya}: катеты — внутренние, гипотенуза — внешняя касательные`,
    storona(A, C, ka.c) !== storona(A, C, kb.c) &&
      storona(C, B, ka.c) !== storona(C, B, kb.c) &&
      storona(A, B, ka.c) === storona(A, B, kb.c),
  );
  const p = (dist(A, B) + dist(B, C) + dist(C, A)) / 2;
  const T = osnovanie(ka.c, A, B);
  sch.fakt(`${imya}: отрезок касательной из A до окружности = полупериметр`, blizko(dist(A, T), p));
  return { ka, kb, S: ploshchad([A, B, C]) };
}
const VNEVPIS = {
  id: 'vnevpisannye-pryamougolnyy',
  b(sch) {
    /* Катеты подбором: радиусы вневписанных к катетам — 4 и 8. */
    const a = koren(
      (a) => {
        const b = koren((b) => vnevpis([0, b], [a, 0], [0, 0]).r - 4, 1e-6, 1e6);
        return vnevpis([a, 0], [0, 0], [0, b]).r - 8;
      },
      /* При данном a радиус окружности у катета BC — между a/2 и a: корень
         есть при 4 < a < 8; у концов промежутка подбор b упирается в край. */
      4.5,
      7.5,
    );
    const b = koren((b) => vnevpis([0, b], [a, 0], [0, 0]).r - 4, 1e-6, 1e6);
    const r = proveritVnevpis(sch, [0, b], [a, 0], [0, 0], 'б)');
    sch.fakt('б) радиусы 4 и 8', blizko(r.ka.r, 4, 1e-7) && blizko(r.kb.r, 8, 1e-7));
    return r.S;
  },
  nachalo(t, sch) {
    const p = L().tochkiVnevpis(t);
    const r = proveritVnevpis(sch, p.A, p.B, p.C, 'чертёж б)');
    sch.fakt(
      'данные: радиусы 4 и 8',
      blizko(Math.min(r.ka.r, r.kb.r), 4, 1e-7) && blizko(Math.max(r.ka.r, r.kb.r), 8, 1e-7),
    );
    return r.S;
  },
  a(rnd, sch) {
    const a = 2 + rnd() * 10;
    proveritVnevpis(sch, [0, a * (0.3 + rnd() * 3)], [a, 0], [0, 0], 'а)');
  },
  scena(t, sch) {
    const p = L().tochkiVnevpis(t);
    proveritVnevpis(sch, p.A, p.B, p.C, 'чертёж');
  },
};

/* ── 665. Квадрат и треугольник CMN ──────────────────────────────── */

function kvadratPer(m) {
  const s = 7;
  const n = koren((n) => m + n + Math.hypot(m, n) - 2 * s, 1e-9, s);
  const A = [0, 0];
  const B = [0, s];
  const C = [s, s];
  const D = [s, 0];
  return { A, B, C, D, M: [s - m, s], N: [s, s - n], s };
}
function proveritKvadratPer(sch, { A, B, C, D, M, N, s }, imya) {
  sch.fakt(`${imya}: периметр CMN = 14`, blizko(dist(C, M) + dist(C, N) + dist(M, N), 14));
  sch.fakt(
    `${imya}: окружность (A; 7) касается MN и прямых BC, CD в B и D`,
    blizko(doPryamoy(A, M, N), s) &&
      blizko(doPryamoy(A, B, C), s) &&
      blizko(doPryamoy(A, C, D), s) &&
      blizko(dist(osnovanie(A, B, C), B), 0) &&
      blizko(dist(osnovanie(A, C, D), D), 0),
  );
  sch.fakt(`${imya}: ∠MAN = 45°`, blizko(ugol(M, A, N), 45, 1e-7));
}
const KVADRAT_PER = {
  id: 'kvadrat-perimetr',
  b(sch) {
    const otvety = [1, 3, 5.5].map((m) => {
      const p = kvadratPer(m);
      proveritKvadratPer(sch, p, `б) CM = ${m}`);
      return ugol(p.M, p.A, p.N);
    });
    return otvety[1];
  },
  nachalo(t, sch) {
    const p = L().tochkiKvadratPer(t);
    proveritKvadratPer(sch, p, 'чертёж б)');
    return ugol(p.M, p.A, p.N);
  },
  a(rnd, sch) {
    proveritKvadratPer(sch, kvadratPer(0.3 + rnd() * 6.4), 'а)');
  },
  scena(t, sch) {
    proveritKvadratPer(sch, L().tochkiKvadratPer(t), 'чертёж');
  },
};

/* ── 666. Середины сторон и основание высоты ─────────────────────── */

function serVys(uA, uC, a) {
  const uB = 180 - uA - uC;
  const B = [0, 0];
  const C = [a, 0];
  const A = polar(uB, (a * Math.sin(uC * RAD)) / Math.sin(uA * RAD));
  return { A, B, C, H: osnovanie(A, B, C), A1: mid(B, C), B1: mid(A, C), C1: mid(A, B) };
}
function proveritSerVys(sch, { A1, B1, C1, H }, imya) {
  const ax = A1;
  /* Окружность через A1, B1, C1: H на ней. */
  const ug = ugol(B1, C1, A1) + ugol(B1, H, A1);
  const vpis = blizko(ug, 180, 1e-6) || blizko(ugol(B1, C1, A1), ugol(B1, H, A1), 1e-6);
  sch.fakt(`${imya}: A₁, B₁, C₁, H на одной окружности`, vpis && dist(ax, H) > 1e-6);
}
const SER_VYS = {
  id: 'serediny-i-vysota',
  b(sch) {
    const p = serVys(60, 45, 2 * Math.sqrt(3));
    proveritSerVys(sch, p, 'б)');
    return dist(p.A1, p.H);
  },
  nachalo(t, sch) {
    const p = L().tochkiSerVys(t);
    sch.fakt(
      'данные: ∠A = 60°, ∠C = 45°, BC = 2√3',
      blizko(ugol(p.B, p.A, p.C), 60, 1e-6) &&
        blizko(ugol(p.A, p.C, p.B), 45, 1e-6) &&
        vO(p.B, p.C, 2 * Math.sqrt(3)),
    );
    return dist(p.A1, p.H);
  },
  a(rnd, sch) {
    const uA = 30 + rnd() * 80;
    const uC = 20 + rnd() * Math.min(65, 150 - uA);
    if (180 - uA - uC < 20 || 180 - uA - uC > 88 || Math.abs(uA + 2 * uC - 180) < 6) return;
    proveritSerVys(sch, serVys(uA, uC, 5), 'а)');
  },
  scena(t, sch) {
    proveritSerVys(sch, L().tochkiSerVys(t), 'чертёж');
  },
};

/* ── 668. Квадрат на гипотенузе: CM : OM ─────────────────────────── */

function kvGip(b, a) {
  const C = [0, 0];
  const A = [b, 0];
  const B = [0, a];
  /* Центр квадрата — по другую сторону AB от C, на расстоянии AB/2 от середины. */
  const m = mid(A, B);
  const n = sub(B, A);
  let O = add(m, mul([n[1], -n[0]], 0.5));
  if (dist(O, C) < dist(m, C)) O = add(m, mul([-n[1], n[0]], 0.5));
  return { A, B, C, O, M: peresech(O, C, A, B), I: incentr(A, B, C) };
}
function proveritKvGip(sch, { A, B, C, O, I }, imya) {
  sch.fakt(
    `${imya}: O — центр квадрата на AB вне треугольника`,
    blizko(dist(O, A), dist(O, B)) && blizko(ugol(A, O, B), 90, 1e-6),
  );
  sch.fakt(`${imya}: центр вписанной окружности на OC`, naPryamoy(O, C, I, 1e-7));
}
const KV_GIP = {
  id: 'kvadrat-na-gipotenuze-otnoshenie',
  b(sch) {
    const p = kvGip(4, 3);
    sch.fakt('б) sin A = 0,6', blizko(dist(p.B, p.C) / dist(p.A, p.B), 0.6));
    proveritKvGip(sch, p, 'б)');
    return dist(p.C, p.M) / dist(p.O, p.M);
  },
  nachalo(t, sch) {
    const p = L().tochkiKvGipOtn(t);
    sch.fakt('данные: sin A = 0,6', blizko(dist(p.B, p.C) / dist(p.A, p.B), 0.6));
    return dist(p.C, p.M) / dist(p.O, p.M);
  },
  a(rnd, sch) {
    const b = 2 + rnd() * 10;
    proveritKvGip(sch, kvGip(b, b * (0.2 + rnd() * 3)), 'а)');
  },
  scena(t, sch) {
    proveritKvGip(sch, L().tochkiKvGipOtn(t), 'чертёж');
  },
};

/* ── 669. Вписанный KLMN с LM = MN ───────────────────────────────── */

function vpisLMN(uM, s, km) {
  const polu = 180 - uM;
  const M = polar(90);
  const L_ = polar(90 + polu);
  const N = polar(90 - polu);
  const K = polar(90 + polu + s * (360 - 2 * polu));
  const k = km / dist(K, M);
  const sk = (p) => mul(p, k);
  const P = peresech(K, M, L_, N);
  return { K: sk(K), L: sk(L_), M: sk(M), N: sk(N), P: sk(P) };
}
function proveritVpisLMN(sch, { K, L: L_, M, N, P }, imya) {
  sch.fakt(
    `${imya}: LM = MN, P — точка пересечения KM и LN`,
    blizko(dist(L_, M), dist(M, N)) && naPryamoy(K, M, P, 1e-7) && naPryamoy(L_, N, P, 1e-7),
  );
  sch.fakt(`${imya}: KM·MP = LM²`, blizko(dist(K, M) * dist(M, P), dist(L_, M) ** 2, 1e-7));
}
const VPIS_LMN = {
  id: 'vpisannyy-ravnye-hordy',
  b(sch) {
    /* Все положения K на дуге LN: площадь одна и та же. */
    const otvety = [0.1, 0.3, 0.5, 0.75, 0.93].map((s) => {
      const p = vpisLMN(150, s, 8);
      proveritVpisLMN(sch, p, `б) K на ${Math.round(s * 100)} % дуги`);
      return ploshchad([p.K, p.L, p.M, p.N]);
    });
    sch.fakt(
      'б) площадь не зависит от положения K (все случаи)',
      otvety.every((x) => blizko(x, otvety[0], 1e-7)),
    );
    return otvety[2];
  },
  nachalo(t, sch) {
    const p = L().tochkiVpisLMN(t);
    sch.fakt(
      'данные: KM = 8, ∠LMN = 150°',
      vO(p.K, p.M, 8) && blizko(ugol(p.L, p.M, p.N), 150, 1e-6),
    );
    return ploshchad([p.K, p.L, p.M, p.N]);
  },
  a(rnd, sch) {
    proveritVpisLMN(sch, vpisLMN(95 + rnd() * 75, 0.05 + rnd() * 0.9, 1 + rnd() * 9), 'а)');
  },
  scena(t, sch) {
    proveritVpisLMN(sch, L().tochkiVpisLMN(t), 'чертёж');
  },
};

export const ZADACHI = [
  DIAG_TRAP,
  KAS_EF,
  KVADRATY,
  DVE_OKR,
  CHEREZ_CENTR,
  VPIS_KLM,
  VYS_PERP,
  BISS_SRED,
  VNEVPIS,
  KVADRAT_PER,
  SER_VYS,
  KV_GIP,
  VPIS_LMN,
];
