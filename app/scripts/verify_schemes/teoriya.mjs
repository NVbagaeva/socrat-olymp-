/* scripts/verify_schemes/teoriya.mjs — теория №18.

   Каждая формула фактов (content/zadanie18/teoriya.ts) проверяется на
   N случайных фигурах. У факта с формулой обязана быть проверка здесь —
   иначе провал. Плюс: чертежи и схемы, на которые ссылаются факты,
   существуют, чертежи раскладываются на экране без NaN. */

import { requireSrc } from '../lib/load-ts.mjs';
import {
  blizko,
  dist,
  mid,
  opisannaya,
  orient,
  proveritEkran,
  schetchik,
  ugol,
  zerno,
} from './obshchee.mjs';

const S = (a, b, c) => Math.abs(orient(a, b, c)) / 2;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const naOkr = (c, r, u) => [c[0] + r * Math.cos(u), c[1] + r * Math.sin(u)];
function peresech(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  return [a[0] + r[0] * t, a[1] + r[1] * t];
}
const proekciya = (p, a, b) => {
  const d = [b[0] - a[0], b[1] - a[1]];
  const t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2);
  return lerp(a, b, t);
};
/** Дуга между точками окружности (градусы), не содержащая точку x. */
function duga(c, p, q, x) {
  const u = (z) => Math.atan2(z[1] - c[1], z[0] - c[0]);
  const norm = (v) => ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const d = norm(u(q) - u(p));
  const xin = norm(u(x) - u(p)) < d;
  return ((xin ? 2 * Math.PI - d : d) * 180) / Math.PI;
}

/** Невырожденный треугольник: углы не меньше 15°. */
function treugolnik(rnd) {
  for (;;) {
    const A = [rnd() * 10, rnd() * 10];
    const B = [rnd() * 10, rnd() * 10];
    const C = [rnd() * 10, rnd() * 10];
    const u = [ugol(B, A, C), ugol(A, B, C), ugol(A, C, B)];
    if (Math.min(...u) > 15) return { A, B, C };
  }
}

/** Проверки формул: id факта → (rnd) => верно ли на случайной фигуре. */
const PROVERKI = {
  'ploshchadi-podobnyh': (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const k = 0.3 + rnd() * 3;
    const f = rnd() * 6;
    const pov = (p) => [
      k * (p[0] * Math.cos(f) - p[1] * Math.sin(f)),
      k * (p[0] * Math.sin(f) + p[1] * Math.cos(f)),
    ];
    return blizko(S(pov(A), pov(B), pov(C)) / S(A, B, C), k * k);
  },
  'vysota-gipotenuza': (rnd) => {
    const A = [0, 0];
    const B = [4 + rnd() * 6, 0];
    const C = naOkr(mid(A, B), B[0] / 2, 0.3 + rnd() * 2.5);
    const H = proekciya(C, A, B);
    return (
      blizko(dist(C, H) ** 2, dist(A, H) * dist(H, B)) &&
      blizko(dist(A, C) ** 2, dist(A, B) * dist(A, H))
    );
  },
  parallelnaya: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const t = 0.1 + rnd() * 0.8;
    const M = lerp(A, B, t);
    const N = peresech(M, [M[0] + C[0] - B[0], M[1] + C[1] - B[1]], A, C);
    return (
      blizko(dist(A, M) / dist(A, B), dist(A, N) / dist(A, C)) &&
      blizko(dist(A, M) / dist(A, B), dist(M, N) / dist(B, C))
    );
  },
  vpisannyy: (rnd) => {
    const O = [0, 0];
    const a = rnd() * 6;
    const b = a + 0.3 + rnd() * 2.5;
    const c = b + 0.2 + rnd() * (2 * Math.PI - (b - a) - 0.4);
    const [A, B, C] = [naOkr(O, 5, a), naOkr(O, 5, b), naOkr(O, 5, c)];
    /* Центральный угол на дугу AB, не содержащую C. */
    return blizko(ugol(A, C, B), duga(O, A, B, C) / 2);
  },
  'ugol-hordy': (rnd) => {
    const O = [0, 0];
    const u = [0, 1, 2, 3].map(() => rnd() * 2 * Math.PI).sort((x, y) => x - y);
    /* Порядок на окружности A, C, B, D — хорды AB и CD пересекаются. */
    const [A, C, B, D] = u.map((x) => naOkr(O, 5, x));
    if (Math.min(dist(A, C), dist(C, B), dist(B, D), dist(D, A)) < 0.5) return true;
    const P = peresech(A, B, C, D);
    return blizko(ugol(A, P, C), (duga(O, A, C, B) + duga(O, B, D, A)) / 2, 1e-6);
  },
  'ugol-sekushchie': (rnd) => {
    const O = [0, 0];
    const r = 3;
    const P = naOkr(O, 5 + rnd() * 5, rnd() * 6);
    const k = (X) => {
      const d = [X[0] - P[0], X[1] - P[1]];
      const a = d[0] ** 2 + d[1] ** 2;
      const b = 2 * (d[0] * P[0] + d[1] * P[1]);
      const c = P[0] ** 2 + P[1] ** 2 - r * r;
      const D = b * b - 4 * a * c;
      if (D <= 1e-6) return null;
      return [lerp(P, X, (-b - Math.sqrt(D)) / (2 * a)), lerp(P, X, (-b + Math.sqrt(D)) / (2 * a))];
    };
    const s1 = k(naOkr(O, rnd() * r * 0.9, rnd() * 6));
    const s2 = k(naOkr(O, rnd() * r * 0.9, rnd() * 6));
    if (s1 === null || s2 === null) return true;
    const [A, B] = s1;
    const [C, D] = s2;
    if (dist(A, C) < 0.3 || dist(B, D) < 0.3) return true;
    /* Дуга BD — дальняя, AC — ближняя: обе не содержат других точек секущих. */
    const bd = duga(O, B, D, A);
    const ac = duga(O, A, C, B);
    return blizko(ugol(B, P, D), Math.abs(bd - ac) / 2, 1e-6);
  },
  'kasatelnaya-horda': (rnd) => {
    const O = [0, 0];
    const a = rnd() * 6;
    const A = naOkr(O, 5, a);
    const B = naOkr(O, 5, a + 0.3 + rnd() * 5.6);
    const C = naOkr(O, 5, a + rnd() * 2 * Math.PI);
    if (Math.min(dist(C, A), dist(C, B)) < 0.3) return true;
    /* T на касательной по ту сторону от прямой AO, что и B... выбираем T так, чтобы дуга AB внутри угла TAB не содержала C. */
    const t = [-Math.sin(a), Math.cos(a)];
    const T1 = [A[0] + t[0], A[1] + t[1]];
    const T2 = [A[0] - t[0], A[1] - t[1]];
    /* Внутри угла TAB лежит дуга AB, не содержащая C, — та сторона касательной, где C не лежит относительно AB. */
    const T = Math.sign(orient(A, B, T1)) !== Math.sign(orient(A, B, C)) ? T1 : T2;
    return (
      blizko(ugol(T, A, B), ugol(A, C, B), 1e-6) &&
      blizko(ugol(T, A, B), duga(O, A, B, C) / 2, 1e-6)
    );
  },
  'otrezki-kasatelnyh': (rnd) => {
    const O = [0, 0];
    const r = 1 + rnd() * 3;
    const d = r + 0.5 + rnd() * 6;
    const f = rnd() * 6;
    const M = naOkr(O, d, f);
    const u = Math.acos(r / d);
    const A = naOkr(O, r, f + u);
    const B = naOkr(O, r, f - u);
    return (
      blizko(ugol(O, A, M), 90) &&
      blizko(dist(M, A), dist(M, B)) &&
      blizko(ugol(A, M, O), ugol(O, M, B))
    );
  },
  hordy: (rnd) => {
    const O = [0, 0];
    const u = [0, 1, 2, 3].map(() => rnd() * 2 * Math.PI).sort((x, y) => x - y);
    const [A, C, B, D] = u.map((x) => naOkr(O, 5, x));
    const P = peresech(A, B, C, D);
    return blizko(dist(A, P) * dist(P, B), dist(C, P) * dist(P, D), 1e-6);
  },
  'kasatelnaya-sekushchaya': (rnd) => {
    const O = [0, 0];
    const r = 3;
    const M = naOkr(O, 4 + rnd() * 6, rnd() * 6);
    const X = naOkr(O, rnd() * r * 0.95, rnd() * 6);
    const d = [X[0] - M[0], X[1] - M[1]];
    const a = d[0] ** 2 + d[1] ** 2;
    const b = 2 * (d[0] * M[0] + d[1] * M[1]);
    const c = M[0] ** 2 + M[1] ** 2 - r * r;
    const D = Math.sqrt(b * b - 4 * a * c);
    const B = lerp(M, X, (-b - D) / (2 * a));
    const C = lerp(M, X, (-b + D) / (2 * a));
    const MA2 = M[0] ** 2 + M[1] ** 2 - r * r;
    return blizko(MA2, dist(M, B) * dist(M, C), 1e-6);
  },
  'vpisannyy-4': (rnd) => {
    const O = [0, 0];
    const u = [0, 1, 2, 3].map(() => rnd() * 2 * Math.PI).sort((x, y) => x - y);
    const [A, B, C, D] = u.map((x) => naOkr(O, 5, x));
    if (Math.min(dist(A, B), dist(B, C), dist(C, D), dist(D, A)) < 0.3) return true;
    /* Обратно: сдвинем D с окружности — сумма перестаёт быть 180°. */
    const D2 = [D[0] * 1.1, D[1] * 1.1];
    return (
      blizko(ugol(D, A, B) + ugol(B, C, D), 180, 1e-6) &&
      !blizko(ugol(D2, A, B) + ugol(B, C, D2), 180, 1e-6)
    );
  },
  'opisannyy-4': (rnd) => {
    const O = [0, 0];
    const r = 2;
    /* Четыре касательные в точках с промежутками меньше 180°. */
    let u;
    do {
      u = [0, 1, 2, 3].map(() => rnd() * 2 * Math.PI).sort((x, y) => x - y);
    } while (
      [u[1] - u[0], u[2] - u[1], u[3] - u[2], 2 * Math.PI - u[3] + u[0]].some(
        (x) => x > Math.PI * 0.9 || x < 0.3,
      )
    );
    const kas = u.map((x) => {
      const p = naOkr(O, r, x);
      return [p, [p[0] - Math.sin(x), p[1] + Math.cos(x)]];
    });
    const v = (i, j) => peresech(kas[i][0], kas[i][1], kas[j][0], kas[j][1]);
    const [A, B, C, D] = [v(3, 0), v(0, 1), v(1, 2), v(2, 3)];
    return blizko(dist(A, B) + dist(C, D), dist(B, C) + dist(D, A), 1e-6);
  },
  centry: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const [a, b, c] = [dist(B, C), dist(A, C), dist(A, B)];
    const s = S(A, B, C);
    const p = (a + b + c) / 2;
    /* Центр вписанной — взвешенная сумма вершин; расстояние до стороны = S/p. */
    const I = [
      (a * A[0] + b * B[0] + c * C[0]) / (2 * p),
      (a * A[1] + b * B[1] + c * C[1]) / (2 * p),
    ];
    const r = (2 * S(I, A, B)) / c;
    return (
      blizko(r, s / p) &&
      blizko(ugol(B, A, I), ugol(I, A, C)) &&
      blizko(opisannaya(A, B, C).r, (a * b * c) / (4 * s))
    );
  },
  sinusov: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const R = opisannaya(A, B, C).r;
    const sin = (x) => Math.sin((x * Math.PI) / 180);
    return (
      blizko(dist(B, C) / sin(ugol(B, A, C)), 2 * R) &&
      blizko(dist(A, C) / sin(ugol(A, B, C)), 2 * R) &&
      blizko(dist(A, B) / sin(ugol(A, C, B)), 2 * R)
    );
  },
  kosinusov: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const [a, b, c] = [dist(B, C), dist(A, C), dist(A, B)];
    return blizko(a * a, b * b + c * c - 2 * b * c * Math.cos((ugol(B, A, C) * Math.PI) / 180));
  },
  mediana: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const [a, b, c] = [dist(B, C), dist(A, C), dist(A, B)];
    return blizko(dist(A, mid(B, C)) ** 2, (2 * b * b + 2 * c * c - a * a) / 4);
  },
  bissektrisa: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const [b, c] = [dist(A, C), dist(A, B)];
    const L = lerp(B, C, c / (b + c));
    return (
      blizko(ugol(B, A, L), ugol(L, A, C)) &&
      blizko(dist(B, L) / dist(L, C), c / b) &&
      blizko(dist(A, L) ** 2, b * c - dist(B, L) * dist(L, C))
    );
  },
  'formuly-ploshchadi': (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const [a, b, c] = [dist(B, C), dist(A, C), dist(A, B)];
    const s = S(A, B, C);
    const p = (a + b + c) / 2;
    const R = opisannaya(A, B, C).r;
    const r = s / p;
    const I = [
      (a * A[0] + b * B[0] + c * C[0]) / (2 * p),
      (a * A[1] + b * B[1] + c * C[1]) / (2 * p),
    ];
    return (
      blizko(s, 0.5 * a * b * Math.sin((ugol(A, C, B) * Math.PI) / 180)) &&
      blizko((2 * S(I, B, C)) / a, r) &&
      blizko(s, (a * b * c) / (4 * R)) &&
      blizko(s, Math.sqrt(p * (p - a) * (p - b) * (p - c)))
    );
  },
  'obshchaya-vysota': (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const M = lerp(B, C, 0.1 + rnd() * 0.8);
    return blizko(S(A, B, M) / S(A, C, M), dist(B, M) / dist(M, C));
  },
  'obshchiy-ugol': (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const B1 = lerp(A, B, 0.1 + rnd() * 0.9);
    const C1 = lerp(A, C, 0.1 + rnd() * 0.9);
    return blizko(
      S(A, B1, C1) / S(A, B, C),
      (dist(A, B1) * dist(A, C1)) / (dist(A, B) * dist(A, C)),
    );
  },
  mediany: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const G = peresech(A, mid(B, C), B, mid(A, C));
    return blizko(dist(A, G) / dist(G, mid(B, C)), 2) && Math.abs(orient(C, mid(A, B), G)) < 1e-9;
  },
  falesa: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const B1 = lerp(A, B, 0.1 + rnd() * 0.8);
    const C1 = peresech(B1, [B1[0] + C[0] - B[0], B1[1] + C[1] - B[1]], A, C);
    return blizko(dist(A, B1) / dist(B1, B), dist(A, C1) / dist(C1, C));
  },
  menelay: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const C1 = lerp(A, B, 0.15 + rnd() * 0.7);
    const A1 = lerp(B, C, 0.15 + rnd() * 0.7);
    const B1 = peresech(C1, A1, C, A);
    const tb = ((B1[0] - C[0]) * (A[0] - C[0]) + (B1[1] - C[1]) * (A[1] - C[1])) / dist(C, A) ** 2;
    if (Math.abs(tb - 1) < 0.05 || Math.abs(tb) < 0.05 || dist(B1, A) > 1e4) return true;
    return (
      blizko(
        (dist(A, C1) / dist(C1, B)) * (dist(B, A1) / dist(A1, C)) * (dist(C, B1) / dist(B1, A)),
        1,
        1e-6,
      ) &&
      (tb < 0 || tb > 1)
    );
  },
  cheva: (rnd) => {
    const { A, B, C } = treugolnik(rnd);
    const w = [0.2 + rnd(), 0.2 + rnd(), 0.2 + rnd()];
    const sw = w[0] + w[1] + w[2];
    const P = [
      (w[0] * A[0] + w[1] * B[0] + w[2] * C[0]) / sw,
      (w[0] * A[1] + w[1] * B[1] + w[2] * C[1]) / sw,
    ];
    const A1 = peresech(A, P, B, C);
    const B1 = peresech(B, P, C, A);
    const C1 = peresech(C, P, A, B);
    const pr =
      (dist(A, C1) / dist(C1, B)) * (dist(B, A1) / dist(A1, C)) * (dist(C, B1) / dist(B1, A));
    /* Обратно: сдвинем C₁ — произведение уже не 1. */
    const C2 = lerp(A, B, (dist(A, C1) / dist(A, B)) * 0.8);
    const pr2 =
      (dist(A, C2) / dist(C2, B)) * (dist(B, A1) / dist(A1, C)) * (dist(C, B1) / dist(B1, A));
    return blizko(pr, 1, 1e-6) && !blizko(pr2, 1, 1e-6);
  },
};

export function proverit(N = 1000) {
  const { GLAVY_18 } = requireSrc('content/zadanie18/teoriya');
  const { risunokTeorii18, RISUNKI_TEORII_18 } = requireSrc('lib/zadanie18/teoriya');
  const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
  const sch = schetchik('Теория №18');
  const rnd = zerno(18181);
  const ids = new Set(SOBRANNYE.map((s) => s.id));
  const fakty = GLAVY_18.flatMap((g) => g.fakty);
  sch.fakt('id фактов не повторяются', new Set(fakty.map((f) => f.id)).size === fakty.length);
  for (const f of fakty) {
    if (f.formula !== undefined) {
      const pr = PROVERKI[f.id];
      sch.fakt(`формула «${f.title}» проверяется`, pr !== undefined, f.id);
      if (pr !== undefined) {
        let ok = 0;
        for (let i = 0; i < N; i += 1) if (pr(rnd)) ok += 1;
        sch.fakt(`«${f.title}»: ${f.formula.slice(0, 40)}`, ok === N, `${ok}/${N}`);
      }
    }
    if (f.risunok !== undefined)
      sch.fakt('чертёж факта существует', risunokTeorii18(f.risunok) !== undefined, f.risunok);
    if (f.skhemy !== undefined)
      sch.fakt(
        'схемы факта существуют',
        f.skhemy.every((s) => ids.has(s)),
        f.skhemy.join(', '),
      );
    if (f.dok !== undefined || f.formula !== undefined)
      sch.fakt('у теоремы есть пометка о ссылке', f.ssylka !== undefined, f.id);
  }
  let tesno = 0;
  for (const id of RISUNKI_TEORII_18) {
    const sc = risunokTeorii18(id);
    for (let i = 0; i < 8; i += 1) tesno += proveritEkran(sc, sc.nachalo, rnd, sch, ['g']);
  }
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno}`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
