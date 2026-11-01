/**
 * Чертежи опорных задач №18 — сцены движка lib/skhemy без подвижных
 * точек: фигура построена в масштабе по числам условия, поэтому
 * проверка (scripts/verify_schemes/opornye.mjs) считает ответ прямо
 * по координатам. Тексты задач — content/zadanie18/opornye.ts.
 *
 * Группы подсветки зажигают шаги решения: «h» — высоты, «okr» —
 * вспомогательная окружность и т. д. (имена — внутри одной задачи).
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  RAD,
  dist,
  foot,
  incircle,
  intersect,
  lerp,
  mid,
  polar,
  tangentPoints,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

/** Сцена без подвижных точек: чертёж задачи, а не живая схема. */
function scena(id: string, t: Tochki, elementy: (t: Tochki) => Element[]): ZhivayaSkhema {
  return {
    id,
    nachalo: t,
    podvizhnye: [],
    pole: [-100, -100, 100, 100],
    postroit: (x) => ({ elementy: elementy(x), zametka: null, znacheniya: [] }),
    ogranichit: () => null,
    sluchaynaya: () => t,
    shagi: ['Чертёж задачи'],
  };
}

/* ── 1. Высоты: A₁BC₁ ∼ ABC, A₁C₁ = AC·cos B ───────────────────── */

/** ∠B = 60°, AC = 10, треугольник остроугольный (∠A ≈ 65°, ∠C ≈ 55°). */
export function tochkiVysoty() {
  const A: T2 = [0, 0];
  const C: T2 = [10, 0];
  const R = 10 / (2 * Math.sin(60 * RAD));
  const O: T2 = [5, R * Math.cos(60 * RAD)];
  const q = polar(100, R);
  const B: T2 = [O[0] + q[0], O[1] + q[1]];
  return { A, B, C, A1: foot(A, B, C), C1: foot(C, A, B) };
}

const VYSOTY = (() => {
  const { A, B, C, A1, C1 } = tochkiVysoty();
  return scena('op-vysoty', { A, B, C, A1, C1 }, (t) => [
    mnog('f-abc', [t.A!, t.B!, t.C!], { gruppy: ['podobie'], cvet: 'a' }),
    mnog('f-a1bc1', [t.A1!, t.B!, t.C1!], { gruppy: ['podobie', 'koef'], cvet: 'b' }),
    otr('AB', t.A!, t.B!),
    otr('BC', t.B!, t.C!),
    otr('CA', t.C!, t.A!, { gruppy: ['otvet'], cvet: 'a' }),
    otr('AA1', t.A!, t.A1!, { gruppy: ['h', 'koef'], cvet: 'a' }),
    otr('CC1', t.C!, t.C1!, { gruppy: ['h', 'koef'], cvet: 'a' }),
    otr('A1C1', t.A1!, t.C1!, { gruppy: ['podobie', 'otvet'], cvet: 'b' }),
    ug('pA1', t.A!, t.A1!, t.B!, { pryamoy: true, gruppy: ['h', 'koef'], cvet: 'a' }),
    ug('pC1', t.C!, t.C1!, t.B!, { pryamoy: true, gruppy: ['h', 'koef'], cvet: 'a' }),
    ug('uB', t.A!, t.B!, t.C!, { gruppy: ['koef', 'podobie', 'otvet'], cvet: 'b' }),
    tch('A', t.A!),
    tch('B', t.B!),
    tch('C', t.C!),
    tch('A_1', t.A1!),
    tch('C_1', t.C1!),
  ]);
})();

/* ── 2. Трезубец: WB = WI ──────────────────────────────────────── */

/** Окружность радиуса 6, BC = 6√3 (∠A = 60°), W — середина дуги BC без A. */
export function tochkiTrezubec() {
  const R = 6;
  const A = polar(112, R);
  const B = polar(210, R);
  const C = polar(330, R);
  const W: T2 = [0, -R];
  const vp = incircle(A, B, C);
  return { O: [0, 0] as T2, R, A, B, C, W, I: vp.c };
}

const TREZUBEC = (() => {
  const { O, R, A, B, C, W, I } = tochkiTrezubec();
  return scena('op-trezubec', { O, A, B, C, W, I }, (t) => [
    okr('opis', t.O!, R),
    mnog('f-wbi', [t.W!, t.B!, t.I!], { gruppy: ['ravnobed'], cvet: 'b' }),
    otr('AB', t.A!, t.B!),
    otr('BC', t.B!, t.C!),
    otr('CA', t.C!, t.A!),
    otr('AW', t.A!, t.W!, { gruppy: ['ugly', 'bis'], cvet: 'a' }),
    otr('BI', t.B!, t.I!, { gruppy: ['ugly', 'bis'], cvet: 'a' }),
    otr('WB', t.W!, t.B!, { gruppy: ['ravnobed', 'otvet'], cvet: 'b', shtrihi: 1 }),
    otr('WI', t.W!, t.I!, { gruppy: ['ravnobed'], cvet: 'b', shtrihi: 1 }),
    otr('WC', t.W!, t.C!, { skrytyy: true, gruppy: ['ugly'], cvet: 'a' }),
    ug('uBAW', t.B!, t.A!, t.W!, { gruppy: ['ugly', 'bis', 'otvet'], cvet: 'a' }),
    ug('uWAC', t.W!, t.A!, t.C!, { gruppy: ['ugly', 'bis'], cvet: 'a' }),
    ug('uWBC', t.W!, t.B!, t.C!, { skrytyy: true, gruppy: ['ugly'], cvet: 'a' }),
    tch('A', t.A!),
    tch('B', t.B!),
    tch('C', t.C!),
    tch('W', t.W!),
    tch('I', t.I!),
  ]);
})();

/* ── 3. Касательная и секущая: MA² = MB·MC ─────────────────────── */

/** M в начале координат, секущая по оси x: MB = 4, MC = 9; центр выше секущей на 3. */
export function tochkiKasatelnaya() {
  const M: T2 = [0, 0];
  const B: T2 = [4, 0];
  const C: T2 = [9, 0];
  const O: T2 = [6.5, 3];
  const r = dist(O, B);
  const kas = tangentPoints(M, { c: O, r });
  /* Точка касания над секущей — чертёж не слипается. */
  const A = kas === null ? O : kas[0][1] > kas[1][1] ? kas[0] : kas[1];
  return { M, B, C, O, r, A };
}

const KASATELNAYA = (() => {
  const { M, B, C, O, r, A } = tochkiKasatelnaya();
  return scena('op-kasatelnaya', { M, B, C, O, A }, (t) => [
    okr('k', t.O!, r),
    mnog('f-mab', [t.M!, t.A!, t.B!], { gruppy: ['podobie'], cvet: 'a' }),
    mnog('f-mca', [t.M!, t.C!, t.A!], { gruppy: ['podobie'], cvet: 'b' }),
    otr('MA', t.M!, t.A!, { gruppy: ['podobie', 'otvet'], cvet: 'b' }),
    otr('MC', t.M!, t.C!, { gruppy: ['otvet'], cvet: 'a' }),
    otr('AB', t.A!, t.B!, { gruppy: ['ugol'], cvet: 'a' }),
    otr('AC', t.A!, t.C!, { gruppy: ['ugol'], cvet: 'a' }),
    ug('uMAB', t.M!, t.A!, t.B!, { gruppy: ['ugol', 'podobie'], cvet: 'b' }),
    ug('uACB', t.A!, t.C!, t.B!, { gruppy: ['ugol', 'podobie'], cvet: 'b' }),
    ug('uM', t.A!, t.M!, t.C!, { dugi: 2, gruppy: ['podobie'], cvet: 'a' }),
    tch('M', t.M!),
    tch('A', t.A!),
    tch('B', t.B!),
    tch('C', t.C!),
  ]);
})();

/* ── 4. Бабочка: S(AOB) = S(COD), S = (√S₁ + √S₂)² ────────────── */

/** BC : AD = 2 : 3, высота 5: S(BOC) = 4, S(AOD) = 9. */
export function tochkiBabochka() {
  const A: T2 = [0, 0];
  const D: T2 = [6, 0];
  const B: T2 = [1.5, 5];
  const C: T2 = [5.5, 5];
  const O = intersect(A, C, B, D) ?? mid(A, C);
  return { A, B, C, D, O };
}

const BABOCHKA = (() => {
  const t0 = tochkiBabochka();
  return scena('op-babochka', t0, (t) => [
    mnog('f-abd', [t.A!, t.B!, t.D!], { gruppy: ['abd'], cvet: 'a' }),
    mnog('f-acd', [t.A!, t.C!, t.D!], { gruppy: ['abd'], cvet: 'b' }),
    mnog('f-aob', [t.A!, t.O!, t.B!], { gruppy: ['kryla', 'summa'], cvet: 'b' }),
    mnog('f-cod', [t.C!, t.O!, t.D!], { gruppy: ['kryla', 'summa'], cvet: 'b' }),
    mnog('f-boc', [t.B!, t.O!, t.C!], { gruppy: ['podobie', 'summa'], cvet: 'a' }),
    mnog('f-aod', [t.A!, t.O!, t.D!], { gruppy: ['podobie', 'summa'], cvet: 'a' }),
    otr('AB', t.A!, t.B!),
    otr('BC', t.B!, t.C!),
    otr('CD', t.C!, t.D!),
    otr('DA', t.D!, t.A!),
    otr('AC', t.A!, t.C!),
    otr('BD', t.B!, t.D!),
    tch('A', t.A!),
    tch('B', t.B!),
    tch('C', t.C!),
    tch('D', t.D!),
    tch('O', t.O!),
  ]);
})();

/* ── 5. Менелай: BP : PK = 3 : 2, AP : PM = 4 : 1 ──────────────── */

/** AK : KC = 2 : 1, M — середина BC, P = AM ∩ BK. */
export function tochkiMenelay() {
  const A: T2 = [0, 0];
  const C: T2 = [9, 0];
  const B: T2 = [3, 6];
  const K = lerp(A, C, 2 / 3);
  const M = mid(B, C);
  const P = intersect(A, M, B, K) ?? M;
  return { A, B, C, K, M, P };
}

const MENELAY = (() => {
  const t0 = tochkiMenelay();
  return scena('op-menelay', t0, (t) => [
    mnog('f-bkc', [t.B!, t.K!, t.C!], { gruppy: ['men'], cvet: 'a' }),
    mnog('f-abp', [t.A!, t.B!, t.P!], { gruppy: ['ploshchad'], cvet: 'b' }),
    mnog('f-abk', [t.A!, t.B!, t.K!], { gruppy: ['abk'], cvet: 'a' }),
    otr('AB', t.A!, t.B!),
    otr('BC', t.B!, t.C!),
    otr('AK', t.A!, t.K!, { gruppy: ['men'], cvet: 'b', shtrihi: 2 }),
    otr('KC', t.K!, t.C!, { shtrihi: 1 }),
    otr('AM', t.A!, t.M!, { gruppy: ['men'], cvet: 'b' }),
    otr('BK', t.B!, t.K!, { gruppy: ['ploshchad'], cvet: 'a' }),
    tch('A', t.A!),
    tch('B', t.B!),
    tch('C', t.C!),
    tch('K', t.K!),
    tch('M', t.M!),
    tch('P', t.P!),
  ]);
})();

/* ── 6. Касающиеся окружности: ∠AKB = 90°, AB = 2√(rR) ─────────── */

/** Радиусы 4 и 9, общая касательная — ось x. */
export function tochkiKasayushchiesya() {
  const r1 = 4;
  const r2 = 9;
  const A: T2 = [0, 0];
  const B: T2 = [2 * Math.sqrt(r1 * r2), 0];
  const O1: T2 = [0, r1];
  const O2: T2 = [B[0], r2];
  const K = lerp(O1, O2, r1 / (r1 + r2));
  /* Общая внутренняя касательная в K перпендикулярна O₁O₂ и пересекает AB в M. */
  const n: T2 = [-(O2[1] - O1[1]), O2[0] - O1[0]];
  const M = intersect(K, [K[0] + n[0], K[1] + n[1]], A, B) ?? mid(A, B);
  return { r1, r2, A, B, O1, O2, K, M };
}

const KASAYUSHCHIESYA = (() => {
  const { r1, r2, A, B, O1, O2, K, M } = tochkiKasayushchiesya();
  return scena('op-kasayushchiesya', { A, B, O1, O2, K, M }, (t) => [
    okr('k1', t.O1!, r1),
    okr('k2', t.O2!, r2),
    okr('naAB', t.M!, dist(t.M!, t.A!), {
      stil: 'punktir',
      skrytyy: true,
      gruppy: ['pryamoy'],
      cvet: 'c',
    }),
    mnog('f-trap', [t.O1!, t.A!, t.B!, t.O2!], { gruppy: ['trapeciya'], cvet: 'a' }),
    otr('AB', t.A!, t.B!, { gruppy: ['otvet', 'trapeciya'], cvet: 'b' }),
    otr('MK', t.M!, t.K!, { gruppy: ['kas'], cvet: 'b', shtrihi: 1 }),
    otr('MA', t.M!, t.A!, { skrytyy: true, gruppy: ['kas'], cvet: 'b', shtrihi: 1 }),
    otr('MB', t.M!, t.B!, { skrytyy: true, gruppy: ['kas'], cvet: 'b', shtrihi: 1 }),
    otr('KA', t.K!, t.A!, { gruppy: ['pryamoy'], cvet: 'a' }),
    otr('KB', t.K!, t.B!, { gruppy: ['pryamoy'], cvet: 'a' }),
    otr('O1O2', t.O1!, t.O2!, { stil: 'punktir', gruppy: ['trapeciya'], cvet: 'a' }),
    otr('O1A', t.O1!, t.A!, { stil: 'punktir', gruppy: ['trapeciya'], cvet: 'a' }),
    otr('O2B', t.O2!, t.B!, { stil: 'punktir', gruppy: ['trapeciya'], cvet: 'a' }),
    ug('uK', t.A!, t.K!, t.B!, { pryamoy: true, gruppy: ['pryamoy'], cvet: 'a' }),
    tch('A', t.A!),
    tch('B', t.B!),
    tch('K', t.K!),
    tch('M', t.M!, { skrytyy: true, gruppy: ['kas', 'pryamoy'], cvet: 'b' }),
    tch('O_1', t.O1!),
    tch('O_2', t.O2!),
  ]);
})();

const REESTR: Readonly<Record<string, ZhivayaSkhema>> = {
  'vysoty-podobie': VYSOTY,
  'trezubec-wb-wi': TREZUBEC,
  'kasatelnaya-sekushchaya': KASATELNAYA,
  'babochka-ploshchad': BABOCHKA,
  'menelay-otnoshenie': MENELAY,
  'kasayushchiesya-pryamoy-ugol': KASAYUSHCHIESYA,
};

/** Чертёж опорной задачи; страницы строятся только для задач с чертежом. */
export function chertezhOpornoy18(id: string): ZhivayaSkhema {
  const s = REESTR[id];
  if (s === undefined) throw new Error(`Нет чертежа опорной задачи ${id}`);
  return s;
}

export function estChertezhOpornoy18(id: string): boolean {
  return REESTR[id] !== undefined;
}
