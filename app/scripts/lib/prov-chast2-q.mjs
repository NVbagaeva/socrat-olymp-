/**
 * Проверки шаблонов части 2 вариантов 29–30 (q14–q20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — нули показательного множителя перебором, ОДЗ корня — подстановкой,
 *      отбор на отрезке;
 * 15 — координаты: SA · BC = 0, основание перпендикуляра из D на SA,
 *      плоскость BCH ⊥ SA, объём SBCH смешанным произведением, площадь
 *      BCH векторным;
 * 16 — неравенство на сетке по исходной записи;
 * 17 — максимум прибыли (выручки) перебором и золотым сечением;
 * 18 — квадрат по координатам: AM · BN = 0, площади шнурком;
 * 19 — число решений через x² + x + a = R² (y² = x + a) для сетки a;
 * 20 — наборы различных чисел — динамикой «количество → достижимые суммы».
 */

import { chislaMnozh, nuli, sverMnozh } from './prov-obshchee.mjs';
import { istinaZnak, koncy, maksimum } from './prov-chast2-n.mjs';

const sub = (u, v) => u.map((x, i) => x - v[i]);
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
const len = (u) => Math.sqrt(dot(u, u));
const shnur = (pts) =>
  Math.abs(
    pts.reduce((s, P, i) => {
      const Q = pts[(i + 1) % pts.length];
      return s + P[0] * Q[1] - P[1] * Q[0];
    }, 0),
  ) / 2;

export function provQ({ ok, close, requireSrc }) {
  const { chislo } = requireSrc('lib/chast2/vyrazhenie');

  function provQ14(p, z) {
    const u = p.q ** p.e1;
    const v = p.q ** p.e2;
    ok(
      z.uslovie.includes(`${p.q * p.q}^{x}-${u + v}\\cdot ${p.q}^{x}+${u * v}`),
      'q14: показательный множитель в условии',
    );
    const pod = (x) => (p.vid === 'leq' ? p.c - x : x - p.c);
    const pokaz = (x) => (p.q ** (2 * x) - (u + v) * p.q ** x + u * v) / (p.q ** (2 * x) + u * v);
    const f = (x) => (pod(x) < 0 ? NaN : Math.sqrt(pod(x)) * pokaz(x));
    const kand = [...nuli(pokaz, -10, 10, 1e-3, 1e-12), p.c];
    const korni = [];
    for (const x of kand)
      if (Number.isFinite(f(x)) && Math.abs(f(x)) < 1e-9 && !korni.some((y) => close(x, y, 1e-6)))
        korni.push(x);
    korni.sort((a, b) => a - b);
    ok(kand.length > korni.length, 'q14: есть посторонний корень');
    const pa = z.punkty[0].pole.verno.map(chislo);
    ok(
      pa.length === korni.length && pa.every((x, i) => close(x, korni[i], 1e-6)),
      'q14: корни перебором',
      `${korni} / ${pa}`,
    );
    const otr = korni.filter((x) => x >= p.lo - 1e-9 && x <= p.hi + 1e-9);
    const pb = z.punkty[1].pole.verno.map(chislo);
    ok(
      pb.length === otr.length && pb.every((x, i) => close(x, otr[i], 1e-6)),
      'q14: корни на отрезке',
    );
  }

  function provQ15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyQ15 } = requireSrc('lib/povyshennye/chast2/q15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyQ15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `q15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a / 2, (a * Math.sqrt(3)) / 2, 0];
    const O = [a / 2, (a * Math.sqrt(3)) / 6, 0];
    const h = Math.sqrt(p.b2 - dot(O, O));
    const S = [O[0], O[1], h];
    ok(close(len(sub(S, C)), Math.sqrt(p.b2), 1e-9), 'q15: SC = b');
    ok(Math.abs(dot(sub(S, A), sub(C, B))) < 1e-9, 'q15: а) SA ⊥ BC');
    const D = B.map((x, i) => (x + C[i]) / 2);
    const sa = sub(A, S);
    const t = dot(sub(D, S), sa) / dot(sa, sa);
    const H = S.map((x, i) => x + t * sa[i]);
    ok(t > 0 && t < 1, 'q15: H на ребре SA');
    ok(
      Math.abs(dot(sub(B, H), sa)) < 1e-9 && Math.abs(dot(sub(C, H), sa)) < 1e-9,
      'q15: плоскость BCH ⊥ SA',
    );
    ok(close(t, z.kontrol.dolya, 1e-9), 'q15: SH : SA');
    const otv =
      p.nado === 'V'
        ? Math.abs(dot(sub(B, S), cross(sub(C, S), sub(H, S)))) / 6
        : len(cross(sub(B, H), sub(C, H))) / 2;
    ok(close(otv, z.kontrol.otvet, 1e-9), `q15: ${p.nado} по координатам`, `${otv}`);
    ok(close(chislo(z.punkty[1].pole.verno), otv, 1e-9), 'q15: поле ответа');
  }

  function provQ16(p, z) {
    const q = p.qn / p.qd;
    const f = (x) => {
      if (x + p.c <= 0) return NaN;
      return (x - p.s) * (x - p.t) * (Math.log(x + p.c) / Math.log(q));
    };
    const istina = istinaZnak(f, p.znak);
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'q16', istina, ks, -p.c - 2, 40, 0.00097);
    koncy(ok, 'q16', istina, ks);
  }

  function provQ17(p, z) {
    const N = (c) => p.A * Math.exp(-c / p.k);
    const F = p.vopros === 'pribyl' ? (c) => (c - p.c) * N(c) : (c) => c * N(c);
    const opt = maksimum(F, 0, p.c + 30 * p.k);
    ok(close(opt, z.kontrol.opt, 1e-5), 'q17: максимум перебором', `${opt}`);
    ok(close(chislo(z.punkty[0].pole.verno), opt, 1e-5), 'q17: поле ответа');
  }

  function provQ18(p, z) {
    const s = 1;
    const t = p.u / p.w;
    const A = [0, 0];
    const B = [0, s];
    const C = [s, s];
    const D = [s, 0];
    const M = [t * s, s];
    const N = [s, s - t * s];
    ok(close(len(sub(M, B)), len(sub(N, C)), 1e-12), 'q18: BM = CN');
    /* P = AM ∩ BN: A + λ(M − A) = B + μ(N − B). */
    const am = sub(M, A);
    const bn = sub(N, B);
    const det = am[0] * -bn[1] - am[1] * -bn[0];
    const r = sub(B, A);
    const lam = (r[0] * -bn[1] - r[1] * -bn[0]) / det;
    const P = [A[0] + lam * am[0], A[1] + lam * am[1]];
    ok(Math.abs(dot(am, bn)) < 1e-12, 'q18: а) AM ⊥ BN');
    const otv = p.nado === 'PMCN' ? shnur([P, M, C, N]) : shnur([A, P, N, D]);
    ok(close(otv, z.kontrol.otvet, 1e-9), `q18: ${p.nado} по координатам`, `${otv}`);
    ok(close(chislo(z.punkty[1].pole.verno), otv, 1e-9), 'q18: поле ответа');
  }

  function provQ19(p, z) {
    const R = p.Rn / p.Rd;
    /* y = √(x + a) ⇔ y ≥ 0, y² = x + a; подстановка: x² + x + a − R² = 0,
       корень x годится при x + a ≥ 0 (тогда y = √(x + a) единственно). */
    const kolvo = (a) => {
      let D = 1 - 4 * (a - R * R);
      if (Math.abs(D) < 1e-10) D = 0;
      if (D < 0) return 0;
      const xs = D === 0 ? [-0.5] : [(-1 - Math.sqrt(D)) / 2, (-1 + Math.sqrt(D)) / 2];
      return xs.filter((x) => x + a >= -1e-10).length;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const istina = (a) => kolvo(a) === p.N;
    sverMnozh(ok, 'q19', istina, ks, -R - 3, R * R + 3, 0.00097);
    koncy(ok, 'q19', istina, ks);
  }

  function provQ20(p, z) {
    /* dost[n] — множество сумм n различных чисел из набора. */
    const dost = (nabor) => {
      const d = Array.from({ length: nabor.length + 1 }, () => new Set());
      d[0].add(0);
      for (const x of nabor)
        for (let n = nabor.length; n >= 1; n -= 1) for (const s of d[n - 1]) d[n].add(s + x);
      return d;
    };
    const vse = Array.from({ length: p.M }, (_, i) => i + 1);
    const dv = dost(vse);
    const dn = dost(vse.filter((x) => x % 2 === 1));
    const a = dv[p.k1]?.has(p.k1 * p.A) ?? false;
    const b = dn[p.k2]?.has(p.k2 * p.A) ?? false;
    let v = 0;
    for (let n = 2; n <= p.M; n += 1) if (dv[n].has(n * p.A)) v = n;
    ok(a === z.kontrol.a, 'q20: а) динамикой');
    ok(b === z.kontrol.b, 'q20: б) динамикой');
    ok(v === z.kontrol.v, 'q20: в) динамикой', `${v} / ${z.kontrol.v}`);
    ok(z.punkty[0].pole.verno === a && z.punkty[1].pole.verno === b, 'q20: поля да/нет');
    ok(chislo(z.punkty[2].pole.verno) === v, 'q20: поле в)');
  }

  return {
    'q14.korenPokaz': provQ14,
    'q15.piramidaPerp': provQ15,
    'q16.logMnozhitel': provQ16,
    'q17.cenaSpros': provQ17,
    'q18.kvadratPerp': provQ18,
    'q19.okrKoren': provQ19,
    'q20.sredneeNabora': provQ20,
  };
}
