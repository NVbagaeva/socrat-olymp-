/* scripts/verify_schemes/trenazherDop/kasatelnye.mjs — перенесённые задачи
   тренажёра, тема «Касательные». Устройство — как в treugolnik.mjs. */

import { requireSrc } from '../../lib/load-ts.mjs';
import {
  add,
  blizko,
  dist,
  doPryamoy,
  ed,
  incentr,
  kasaniya,
  korenNaSetke,
  mul,
  naOkr,
  naPryamoy,
  opisannaya,
  osnovanie,
  peresech,
  ploshchad,
  poStoronam,
  polar,
  pryamayaOkr,
  skalyar,
  sluchaynyyTreugolnik,
  sub,
  ugol,
} from './obshchee.mjs';

const L = () => requireSrc('lib/zadanie18/trenazher/dop/kasatelnye');
const perpendikulyarny = (a, b, c, d) =>
  Math.abs(skalyar(sub(b, a), sub(d, c))) / (dist(a, b) * dist(c, d)) < 1e-9;

/* ks-otrezki: Вписанная окружность касается AB в K: AK = p − BC. */
function proveritOtrezki(sch, { A, B, C, K }, imya) {
  const I = incentr(A, B, C);
  sch.fakt(`${imya}: K — точка касания на AB`, blizko(dist(K, osnovanie(I, A, B)), 0, 1e-9));
  const p = (dist(A, B) + dist(B, C) + dist(C, A)) / 2;
  sch.fakt(`${imya}: AK = p − BC`, blizko(dist(A, K), p - dist(B, C)));
}
const OTREZKI = {
  id: 'ks-otrezki',
  b() {
    const { A, B, C } = poStoronam(8, 9, 7);
    return dist(A, osnovanie(incentr(A, B, C), A, B));
  },
  nachalo(t, sch) {
    const p = L().tochkiOtrezkov(t);
    sch.fakt(
      'данные: AB = 7, BC = 8, CA = 9',
      blizko(dist(p.A, p.B), 7) && blizko(dist(p.B, p.C), 8) && blizko(dist(p.C, p.A), 9),
    );
    return dist(p.A, p.K);
  },
  a(rnd, sch) {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    proveritOtrezki(sch, { A, B, C, K: osnovanie(incentr(A, B, C), A, B) }, 'а)');
  },
  scena(t, sch) {
    proveritOtrezki(sch, L().tochkiOtrezkov(t), 'чертёж');
  },
};

/* ks-dve-kasatelnye: Касательные AB, AC: AO ⊥ BC; BC по r и AO. */
function proveritKasatelnye(sch, { O, A, r, B, C }, imya) {
  sch.fakt(
    `${imya}: B, C на окружности, OB ⊥ AB, OC ⊥ AC`,
    blizko(dist(O, B), r) &&
      blizko(dist(O, C), r) &&
      perpendikulyarny(O, B, A, B) &&
      perpendikulyarny(O, C, A, C),
  );
  sch.fakt(`${imya}: AO ⊥ BC`, perpendikulyarny(A, O, B, C));
}
const DVE_KASATELNYE = {
  id: 'ks-dve-kasatelnye',
  b() {
    const okr = { c: [0, 0], r: 6 };
    const [B, C] = kasaniya([10, 0], okr);
    return dist(B, C);
  },
  nachalo(t, sch) {
    const p = L().tochkiKasatelnyh(t);
    sch.fakt('данные: r = 6, AO = 10', blizko(p.r, 6) && blizko(dist(p.A, p.O), 10));
    proveritKasatelnye(sch, p, 'чертёж (начало)');
    return dist(p.B, p.C);
  },
  a(rnd, sch) {
    const O = [rnd() * 6, rnd() * 6];
    const r = 1 + rnd() * 5;
    const A = add(O, polar(rnd() * 360, r * (1.1 + rnd() * 3)));
    const [B, C] = kasaniya(A, { c: O, r });
    proveritKasatelnye(sch, { O, A, r, B, C }, 'а)');
  },
  scena(t, sch) {
    proveritKasatelnye(sch, L().tochkiKasatelnyh(t), 'чертёж');
  },
};

/* ks-vnutr-kasanie: Окружности касаются внутренним образом в K, хорда AB касается малой в C:
   ∠AKC = ∠CKB. */
function proveritVnutr(sch, { K, A, B, C, Q, q }, imya) {
  const big = opisannaya(K, A, B);
  sch.fakt(
    `${imya}: малая окружность проходит через K, касается AB в C и касается большой изнутри`,
    blizko(dist(Q, K), q) &&
      blizko(doPryamoy(Q, A, B), q) &&
      blizko(dist(Q, C), q) &&
      naPryamoy(A, B, C) &&
      blizko(dist(big.c, Q), big.r - q, 1e-7),
  );
  sch.fakt(`${imya}: ∠AKC = ∠CKB`, blizko(ugol(A, K, C), ugol(C, K, B), 1e-6));
}
/** По треугольнику KAB и точке C на AB: окружность через K, касающаяся AB в C. */
function malaya(K, A, B, C) {
  let n = [-(B[1] - A[1]), B[0] - A[0]];
  n = ed(n);
  const kc = sub(K, C);
  if (skalyar(kc, n) < 0) n = mul(n, -1);
  const s = skalyar(kc, kc) / (2 * skalyar(kc, n));
  return { Q: add(C, mul(n, s)), q: s };
}
const VNUTR = {
  id: 'ks-vnutr-kasanie',
  b(sch) {
    /* Подбираем AB = x: окружность через K, касающаяся AB в точке C (AC = 4),
       должна касаться описанной окружности KAB в точке K. Биссектриса здесь не используется. */
    const postroit = (x) => {
      const { A: K, B: A, C: B } = poStoronam(x, 9, 6);
      const C = add(A, mul(ed(sub(B, A)), 4));
      return { K, A, B, C, ...malaya(K, A, B, C) };
    };
    /* Касание в K ⇔ центры O, Q и точка K на одной прямой: знак векторного произведения меняется. */
    const f = (x) => {
      const p = postroit(x);
      const o = sub(opisannaya(p.K, p.A, p.B).c, p.K);
      const q = sub(p.Q, p.K);
      return (o[0] * q[1] - o[1] * q[0]) / (Math.hypot(...o) * Math.hypot(...q));
    };
    const x = korenNaSetke(f, 4.2, 14.8);
    const p = postroit(x);
    proveritVnutr(sch, p, 'б) найденная фигура');
    return x;
  },
  nachalo(t, sch) {
    const p = L().tochkiVnutrKasaniya(t);
    sch.fakt(
      'данные: KA = 6, KB = 9, AC = 4',
      blizko(dist(p.K, p.A), 6) && blizko(dist(p.K, p.B), 9) && blizko(dist(p.A, p.C), 4),
    );
    return dist(p.A, p.B);
  },
  a(rnd, sch) {
    /* Большая окружность, малая касается её в K; касательная к малой в точке C — хорда AB. */
    const R = 4 + rnd() * 6;
    const big = { c: [0, 0], r: R };
    const uk = rnd() * 360;
    const K = naOkr(big, uk);
    const q = R * (0.2 + 0.6 * rnd());
    const Q = add(K, mul(ed(sub(big.c, K)), q));
    const C = naOkr({ c: Q, r: q }, uk + 180 + (rnd() * 2 - 1) * 150);
    const kas = add(C, [-(C[1] - Q[1]), C[0] - Q[0]]);
    const per = pryamayaOkr(C, kas, big);
    if (per.length < 2) return;
    proveritVnutr(sch, { K, A: per[0].p, B: per[1].p, C, Q, q }, 'а)');
  },
  scena(t, sch) {
    proveritVnutr(sch, L().tochkiVnutrKasaniya(t), 'чертёж');
  },
};

/* ks-pryam-trap: Прямоугольная трапеция ABCD (∠A = ∠B = 90°) с вписанной окружностью: ∠COD = 90°. */
/** По высоте h и основанию AD = d: A(0; 0), B(0; h), D(d; 0), C — на прямой y = h, CD касается окружности. */
function pryamTrap(h, d) {
  const okr = { c: [h / 2, h / 2], r: h / 2 };
  const D = [d, 0];
  /* Из двух касательных из D одна — сама AD (точка касания (h/2; 0)), берём другую. */
  const T = kasaniya(D, okr).sort((p, q) => q[1] - p[1])[0];
  const C = peresech(D, T, [0, h], [1, h]);
  return { A: [0, 0], B: [0, h], C, D, O: okr.c, r: okr.r };
}
function proveritPryamTrap(sch, { A, B, C, D, O }, imya) {
  const r = doPryamoy(O, A, D);
  sch.fakt(
    `${imya}: окружность касается всех четырёх сторон, углы A и B прямые`,
    blizko(doPryamoy(O, A, B), r) &&
      blizko(doPryamoy(O, B, C), r) &&
      blizko(doPryamoy(O, C, D), r) &&
      blizko(ugol(B, A, D), 90, 1e-6) &&
      blizko(ugol(A, B, C), 90, 1e-6),
  );
  sch.fakt(`${imya}: ∠COD = 90°`, blizko(ugol(C, O, D), 90, 1e-6));
}
const PRYAM_TRAP = {
  id: 'ks-pryam-trap',
  b(sch) {
    /* OD = 20: d = r + √(400 − r²) (O = (r; r)); r подбираем по OC = 15. */
    const postroit = (r) => pryamTrap(2 * r, r + Math.sqrt(400 - r * r));
    const r = korenNaSetke((x) => dist(postroit(x).O, postroit(x).C) - 15, 1, 19.9);
    const t = postroit(r);
    sch.fakt('б) OC = 15, OD = 20', blizko(dist(t.O, t.C), 15) && blizko(dist(t.O, t.D), 20));
    proveritPryamTrap(sch, t, 'б) найденная трапеция');
    return ploshchad([t.A, t.B, t.C, t.D]);
  },
  nachalo(t, sch) {
    const p = L().tochkiPryamTrap(t);
    sch.fakt('данные: OC = 15, OD = 20', blizko(dist(p.O, p.C), 15) && blizko(dist(p.O, p.D), 20));
    return ploshchad([p.A, p.B, p.C, p.D]);
  },
  a(rnd, sch) {
    const h = 2 + rnd() * 10;
    /* AD длиннее h, иначе C уйдёт левее B. */
    const d = h * (1.1 + rnd() * 2);
    proveritPryamTrap(sch, pryamTrap(h, d), 'а)');
  },
  scena(t, sch) {
    proveritPryamTrap(sch, L().tochkiPryamTrap(t), 'чертёж');
  },
};

export const ZADACHI = [OTREZKI, DVE_KASATELNYE, VNUTR, PRYAM_TRAP];
