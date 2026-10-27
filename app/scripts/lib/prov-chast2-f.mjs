/**
 * Проверки шаблонов части 2 вариантов 11–12 (f14–f20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — уравнение из текста условия (обе части под корнем), нули перебором;
 * 15 — координаты: точка N как пересечение DK с плоскостью SAC,
 *      отношение на AC или SA, угол между прямыми;
 * 16 — числитель из текста условия, неравенство на сетке;
 * 17 — максимум плотности перебором энергии;
 * 18 — трапеция строится по касанию и перпендикулярности, BNOG по
 *      координатам: площадь шнурком, радиусы — формулами треугольника;
 * 19 — число корней по x для сетки a;
 * 20 — перебор вместимостей и числа альбомов.
 */

import { chislaMnozh, nuli, seriya, sverMnozh, trigFunkciya, vMnozh } from './prov-obshchee.mjs';

export function provF({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');

  function provF14(p, z) {
    const m = z.uslovie.match(/\\sqrt\{(.*?)\}=\\sqrt\{(.*)\}\$\./);
    ok(m !== null, 'f14: уравнение в условии');
    if (m === null) return;
    const L = trigFunkciya(m[1]);
    const R = trigFunkciya(m[2]);
    const phi = (x) => (L(x) - R(x)) ** 2 + Math.min(0, R(x)) ** 2;
    const koren = (x) => Math.abs(L(x) - R(x)) < 1e-9 && R(x) > -1e-12;
    const serii = z.punkty[0].pole.verno;
    for (const s of serii)
      for (let n = -3; n <= 3; n += 1)
        ok(koren(seriya(razobrat, vychislit, s, n)), `f14: серия ${s} при n=${n}`);
    const vse = nuli(phi, -2 * Math.PI, 2 * Math.PI, 1e-3, 1e-14);
    const iz = (x) =>
      serii.some((s) => {
        for (let n = -10; n <= 10; n += 1)
          if (Math.abs(seriya(razobrat, vychislit, s, n) - x) < 1e-5) return true;
        return false;
      });
    ok(
      vse.length > 0 && vse.every(iz),
      'f14: все корни на [−2π; 2π] — в сериях',
      String(vse.length),
    );
    /* Каждая серия даёт корни на [−2π; 2π] (лишних серий нет). */
    ok(
      serii.every((s) => {
        for (let n = -10; n <= 10; n += 1) {
          const x = seriya(razobrat, vychislit, s, n);
          if (x >= -2 * Math.PI && x <= 2 * Math.PI && vse.some((y) => Math.abs(y - x) < 1e-5))
            return true;
        }
        return false;
      }),
      'f14: серии найдены перебором',
    );
    const lo = (p.lo[0] / p.lo[1]) * Math.PI;
    const hi = (p.hi[0] / p.hi[1]) * Math.PI;
    const naOtr = nuli(phi, lo - 0.01, hi + 0.01, 1e-3, 1e-14).filter(
      (x) => x >= lo - 1e-6 && x <= hi + 1e-6,
    );
    const otv = z.punkty[1].pole.verno.map(chislo).sort((a, b) => a - b);
    ok(
      naOtr.length === otv.length && naOtr.every((x, i) => close(x, otv[i], 1e-6)),
      'f14: корни на отрезке',
      `${naOtr} / ${otv}`,
    );
  }

  const sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]];
  const add = (P, Q) => [P[0] + Q[0], P[1] + Q[1], P[2] + Q[2]];
  const mul = (P, t) => [P[0] * t, P[1] * t, P[2] * t];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const cr = (u, v) => [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const dl = (u) => Math.sqrt(dot(u, u));

  function provF15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyF15 } = requireSrc('lib/povyshennye/chast2/f15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyF15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `f15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = chislo((z.uslovie.match(/AB=(.*?)\$/) ?? [])[1] ?? '');
    const h = chislo((z.uslovie.match(/SA=(.*?)\$/) ?? [])[1] ?? '');
    ok(Number.isFinite(a) && Number.isFinite(h), 'f15: AB и SA в условии');
    const T = { A: [0, 0, 0], B: [a, 0, 0], C: [a, a, 0], D: [0, a, 0], S: [0, 0, h] };
    const K = mul(add(T.S, T.B), 0.5);
    /* N = DK ∩ (SAC). */
    const n = cr(sub(T.C, T.A), sub(T.S, T.A));
    const t = dot(n, sub(T.A, T.D)) / dot(n, sub(K, T.D));
    const N = add(T.D, mul(sub(K, T.D), t));
    const v = sub(T.C, T.S);
    if (p.delit === 'AC') {
      /* Пересечение с плоскостью z = 0 — на прямой AC. */
      const P = add(N, mul(v, -N[2] / v[2]));
      ok(
        close(P[0], P[1]) && close(dl(sub(P, T.A)) / dl(sub(T.C, P)), 2),
        'f15: а) AP : PC = 2 : 1',
      );
    } else {
      const Q = add(N, mul(v, -N[0] / v[0]));
      ok(
        close(Q[1], 0, 1e-9) && close(dl(sub(Q, T.S)) / dl(sub(T.A, Q)), 0.5),
        'f15: а) SQ : QA = 1 : 2',
      );
    }
    const pr = sub(T[p.pr[1]], T[p.pr[0]]);
    const dk = sub(K, T.D);
    const ugol = Math.acos(Math.abs(dot(pr, dk)) / dl(pr) / dl(dk));
    ok(close(ugol, chislo(z.punkty[1].pole.verno), 1e-9), 'f15: угол между прямыми', `${ugol}`);
  }

  function provF16(p, z) {
    const m = z.uslovie.match(/\\dfrac\{(.*?)\}\{\\log/);
    ok(m !== null, 'f16: числитель в условии');
    if (m === null) return;
    const u = razobrat(m[1]);
    ok(u !== null, 'f16: числитель разобран', m[1]);
    if (u === null) return;
    const num = (x) => vychislit(u, { x });
    const lg = (y) => Math.log(y) / Math.log(1 / p.q);
    const den = (x) => {
      const w = p.c ** x - p.d;
      return lg(w) ** 2 + p.sg * lg(w * w) + 1;
    };
    const ist = (x) => {
      const v = num(x) / den(x);
      if (!Number.isFinite(v)) return false;
      return p.znak === 'le' ? v <= 1e-12 : v >= -1e-12;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kon = ks.flatMap((k) => [k.lo, k.hi]).filter(Number.isFinite);
    sverMnozh(ok, 'f16', ist, ks, Math.min(...kon) - 2, Math.max(...kon) + 2, 2e-4);
  }

  function provF17(p, z) {
    /* Максимум по s = ε/(kT): f ∝ √s·e^{−s}. */
    const g = (s) => Math.sqrt(s) * Math.exp(-s);
    /* g унимодальна на (0; 10): золотое сечение. */
    let l = 1e-9;
    let r = 10;
    for (let i = 0; i < 200; i += 1) {
      const m1 = l + (r - l) * 0.382;
      const m2 = l + (r - l) * 0.618;
      if (g(m1) > g(m2)) r = m2;
      else l = m1;
    }
    const best = (l + r) / 2;
    const k = 1.38e-23;
    if (p.vopros === 'eps') {
      ok(
        close(best * k * p.T, chislo(z.punkty[0].pole.verno), 1e-5),
        'f17: энергия максимума перебором',
      );
    } else {
      const eps = chislo((z.uslovie.match(/\\varepsilon=(.*?)\$ Дж/) ?? [])[1] ?? '');
      ok(
        close(eps / (best * k), Number(z.punkty[0].pole.verno), 1e-5),
        'f17: температура перебором',
      );
    }
  }

  function provF18(p, z) {
    const R =
      p.dano === 'R'
        ? Number((z.uslovie.match(/\$R=(\d+)\$/) ?? [])[1])
        : Number((z.uslovie.match(/\$AD=(\d+)\$/) ?? [])[1]) / 2;
    ok(R === p.R, 'f18: R из условия');
    /* D(0;0), A(0;2R), O(R;R); BC ⊥ биссектрисе y = x и касается окружности: x + y = c0. */
    const c0 = 2 * R + R * Math.SQRT2;
    const B = [c0 - 2 * R, 2 * R];
    const C = [c0, 0];
    const O = [R, R];
    const G = [R, 2 * R];
    const N = [c0 / 2, c0 / 2];
    const d = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
    ok(
      close(d(O, N), R) &&
        close((N[0] - O[0]) * (C[0] - B[0]) + (N[1] - O[1]) * (C[1] - B[1]), 0, 1e-12),
      'f18: N — касание BC',
    );
    ok(close(d(B, p.dok === 'BN' ? N : G), (Math.SQRT2 - 1) * R), `f18: а) ${p.dok}`);
    const kv = [B, N, O, G];
    let S = 0;
    for (let i = 0; i < 4; i += 1)
      S += kv[i][0] * kv[(i + 1) % 4][1] - kv[(i + 1) % 4][0] * kv[i][1];
    S = Math.abs(S) / 2;
    const P = kv.reduce((s, X, i) => s + d(X, kv[(i + 1) % 4]), 0);
    const a = d(B, N);
    const b = d(N, O);
    const c = d(O, B);
    const Ro =
      (a * b * c) /
      (4 * (Math.abs((N[0] - B[0]) * (O[1] - B[1]) - (N[1] - B[1]) * (O[0] - B[0])) / 2));
    const v = { r: (2 * S) / P, Ro, S, P }[p.nado];
    ok(close(v, chislo(z.punkty[1].pole.verno), 1e-9), `f18: б) ${p.nado}`, `${v}`);
  }

  function provF19(p, z) {
    const m = z.uslovie.match(/\\\\ (.*?)=(.*?)\\end\{cases\}/);
    ok(m !== null, 'f19: второе уравнение');
    if (m === null) return;
    const uL = razobrat(m[1]);
    const uR = razobrat(m[2]);
    const zn = p.vid === 'minus' ? -1 : 1;
    const chislo19 = (a) => {
      if (a < 0) return 0;
      const y = vychislit(uR, { a }) - vychislit(uL, { y: 0 });
      /* Корни по u = |x| ≥ 0: u > 0 даёт два решения, u = 0 — одно. */
      const F = (u) =>
        ((u + zn * a * a) ** 2 +
          (y - p.t * a) * (y + p.t * a) -
          ((p.R ** 2 - p.t ** 2) * a * a - 2 * p.s * y - p.s ** 2)) /
        (1 + a ** 4);
      const X = a * a + p.R * a + 5;
      const us = nuli(F, 0, X, X / 4000, 1e-11).filter((u) => u > 1e-6);
      return 2 * us.length + (Math.abs(F(0)) < 1e-11 ? 1 : 0);
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kon = ks.flatMap((k) => [k.lo, k.hi]).filter(Number.isFinite);
    const a1 = Math.max(...kon) + 3;
    let plokho = 0;
    for (let a = 0.00377; a < a1; a += a1 / 200) {
      /* Около особых a корни по u сливаются — окрестности пропускаем. */
      if (kon.some((c) => Math.abs(c - a) < 0.03)) continue;
      if ((chislo19(a) === p.k) !== vMnozh(ks, a)) plokho += 1;
    }
    ok(plokho === 0, 'f19: число решений на сетке a', String(plokho));
    for (const k of ks.filter((q) => q.lo === q.hi))
      ok(chislo19(k.lo) === p.k, `f19: отдельная точка a=${k.lo}`);
  }

  function provF20(p, z) {
    const N = [];
    const ks = new Set();
    for (let B = p.B0 + 1; B < p.B1; B += 1)
      for (let s = p.s0 + 1; s < p.s1; s += 1)
        for (let k = 1; k <= 500; k += 1)
          if (k * B === (k + p.d) * s && p.e < s) {
            N.push(k * B - p.e);
            ks.add(k);
          }
    ok(N.length > 0, 'f20: варианты есть');
    ok(ks.has(p.k0) === z.punkty[0].pole.verno, 'f20: а) перебором');
    ok(Math.min(...N) === Number(z.punkty[1].pole.verno), 'f20: б) наименьшее');
    ok(Math.max(...N) === Number(z.punkty[2].pole.verno), 'f20: в) наибольшее');
  }

  return {
    'f14.koren3': provF14,
    'f15.piramidaMediany': provF15,
    'f16.drobLog': provF16,
    'f17.raspredelenie': provF17,
    'f18.trapeciyaOkr': provF18,
    'f19.moduliKoren': provF19,
    'f20.albomy': provF20,
  };
}
