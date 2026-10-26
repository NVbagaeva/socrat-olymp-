/**
 * Проверки шаблонов части 2 вариантов 9–10 (e14–e20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — уравнение из текста условия, нули перебором по x;
 * 15 — трапеция по длинам сторон из условия, высота призмы из равенства,
 *      расстояние через векторное произведение;
 * 16 — неравенство на сетке;
 * 17 — минимум сноса перебором угла;
 * 18 — координаты: высоты, ортоцентр, описанная окружность KBN;
 * 19 — уравнения из текста условия, общие точки на окружности для сетки a;
 * 20 — пример из решения пересчитан, наибольшее отношение — динамикой
 *      по числу чисел и покрытым условиям.
 */

import { chislaMnozh, nuli, sverMnozh, vMnozh } from './prov-obshchee.mjs';

export function provE({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');

  function provE14(p, z) {
    const m = z.uslovie.match(
      /\\log\^2_\{(.*?)\}\\left\((.*?)\\right\)(.*?)\\log_\{(\d+)\}\\left\(.*?\\right\)(.*?)=0\$/,
    );
    ok(m !== null, 'e14: уравнение в условии');
    if (m === null) return;
    const osn = chislo(m[1]);
    const q = Number(m[4]);
    const k1 = m[3] === '-' ? -1 : m[3] === '+' || m[3] === '' ? 1 : chislo(m[3]);
    const k0 = m[5] === '' ? 0 : chislo(m[5]);
    ok([osn, k1, k0].every(Number.isFinite), 'e14: коэффициенты разобраны', m.slice(1).join(' | '));
    const F = (x) => {
      const A = p.c ** Math.sqrt(x) + p.s;
      if (A <= 0) return NaN;
      const L = Math.log(A);
      return (L / Math.log(osn)) ** 2 + (k1 * L) / Math.log(q) + k0;
    };
    const korni = nuli(F, 0, 80, 1e-3).filter((x) => x >= 0);
    const otv = z.punkty[0].pole.verno.map(chislo).sort((a, b) => a - b);
    ok(
      korni.length === otv.length && korni.every((x, i) => close(x, otv[i], 1e-6)),
      'e14: корни перебором',
      `${korni} / ${otv}`,
    );
    const lo = p.k1 * p.k1;
    const hi = p.k2 * p.k2;
    const b = z.punkty[1].pole.verno.map(chislo).sort((x, y) => x - y);
    const nado = korni.filter((x) => x >= lo - 1e-6 && x <= hi + 1e-6);
    ok(
      nado.length === b.length && nado.every((x, i) => close(x, b[i], 1e-6)),
      'e14: отбор на отрезке',
    );
  }

  const sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const cr = (u, v) => [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];

  function provE15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyE15 } = requireSrc('lib/povyshennye/chast2/e15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyE15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `e15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const num = (re) => Number((z.uslovie.match(re) ?? [])[1]);
    const AB = num(/\$AB=(\d+)\$/);
    const BC = num(/\$BC=(\d+)\$/);
    const CD = num(/\$CD=(\d+)\$/);
    const AD = num(/\$AD=(\d+)\$/);
    ok([AB, BC, CD, AD].every(Number.isFinite), 'e15: стороны в условии');
    /* A(0;0), D(AD;0), B(x;y), C(x + BC; y): |AB|, |CD| заданы. */
    const x = (CD * CD - AB * AB - (BC - AD) ** 2) / (2 * (BC - AD));
    const y = Math.sqrt(AB * AB - x * x);
    const A = [0, 0];
    const B = [x, y];
    const C = [x + BC, y];
    const D = [AD, 0];
    const h =
      p.usl === 'BC1=A1C1'
        ? Math.sqrt(Math.hypot(C[0] - A[0], C[1] - A[1]) ** 2 - BC * BC)
        : Math.sqrt(Math.hypot(D[0] - B[0], D[1] - B[1]) ** 2 - AD * AD);
    /* а) суммы противоположных сторон равны, высота призмы = диаметр. */
    ok(close(AB + CD, BC + AD) && close(h, y), 'e15: а) вписанный шар');
    const T = {};
    for (const [k, P] of Object.entries({ A, B, C, D })) {
      T[k] = [P[0], P[1], 0];
      T[`${k}1`] = [P[0], P[1], h];
    }
    const n = cr(sub(T[p.pl[1]], T[p.pl[0]]), sub(T[p.pl[2]], T[p.pl[0]]));
    const rho = Math.abs(dot(n, sub(T[p.t], T[p.pl[0]]))) / Math.sqrt(dot(n, n));
    ok(close(rho, chislo(z.punkty[1].pole.verno), 1e-9), 'e15: расстояние', `${rho}`);
  }

  function provE16(p, z) {
    const K = p.p ** (p.m - p.n);
    const g = (x) =>
      p.p ** (x * x - p.m) * (p.q ** (x * x - p.n) + K) -
      (p.p * p.p) ** (x * x - (p.m + p.n) / 2) -
      p.q ** (x * x - p.n);
    const ist = (x) => {
      const v = g(x);
      const t = 1e-12 * (p.q ** (x * x) + 1);
      return { lt: v < -t, gt: v > t, le: v <= t, ge: v >= -t }[p.znak];
    };
    sverMnozh(ok, 'e16', ist, chislaMnozh(z.punkty[0].pole.verno, chislo), -4.5, 4.5, 1e-3);
  }

  function provE17(p, z) {
    const l = (a) => (p.h * (p.u + p.v * Math.cos(a))) / (p.v * Math.sin(a));
    let best = Infinity;
    for (let a = 1e-4; a < Math.PI; a += 1e-5) best = Math.min(best, l(a));
    ok(close(best, Number(z.punkty[0].pole.verno), 1e-6), 'e17: минимум перебором', `${best}`);
  }

  function provE18(p, z) {
    const c = Math.hypot(p.a, p.m);
    const A = [-p.a, 0];
    const C = [p.a, 0];
    const B = [0, p.m];
    const proj = (P, X, Y) => {
      const u = [Y[0] - X[0], Y[1] - X[1]];
      const t = ((P[0] - X[0]) * u[0] + (P[1] - X[1]) * u[1]) / (u[0] ** 2 + u[1] ** 2);
      return [X[0] + t * u[0], X[1] + t * u[1]];
    };
    const K = proj(C, A, B);
    const N = proj(A, B, C);
    /* Описанная окружность KBN. */
    const ocentr = (P, Q, R) => {
      const d = 2 * (P[0] * (Q[1] - R[1]) + Q[0] * (R[1] - P[1]) + R[0] * (P[1] - Q[1]));
      const s = (X) => X[0] ** 2 + X[1] ** 2;
      return [
        (s(P) * (Q[1] - R[1]) + s(Q) * (R[1] - P[1]) + s(R) * (P[1] - Q[1])) / d,
        (s(P) * (R[0] - Q[0]) + s(Q) * (P[0] - R[0]) + s(R) * (Q[0] - P[0])) / d,
      ];
    };
    const O = ocentr(K, B, N);
    const R = Math.hypot(O[0] - K[0], O[1] - K[1]);
    const KN = Math.hypot(K[0] - N[0], K[1] - N[1]);
    const v = p.nado === 'R' ? R : KN;
    ok(close(v, chislo(z.punkty[1].pole.verno), 1e-9), `e18: ${p.nado}`, `${v}`);
    ok(close(c, Number((z.uslovie.match(/AB=(\d+)/) ?? [])[1])), 'e18: AB в условии');
    /* а) углы AKH (CNH) и KPO. */
    const H = [0, (p.a * p.a) / p.m];
    const P = [0, K[1]];
    const ugol = (X, V, Y) => {
      const u = [X[0] - V[0], X[1] - V[1]];
      const w = [Y[0] - V[0], Y[1] - V[1]];
      return Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(...u) / Math.hypot(...w));
    };
    const t1 =
      p.tr === 'AKH'
        ? [ugol(K, A, H), ugol(A, K, H), ugol(A, H, K)]
        : [ugol(N, C, H), ugol(C, N, H), ugol(C, H, N)];
    const t2 = [ugol(P, K, O), ugol(K, P, O), ugol(K, O, P)];
    ok(
      t1.every((x, i) => close(x, t2[i], 1e-9)),
      'e18: а) углы треугольников равны',
    );
  }

  function provE19(p, z) {
    const m = z.uslovie.match(/\\begin\{cases\}(.*?)=(.*?),\\\\ (.*?)=(.*?)\\end\{cases\}/);
    ok(m !== null, 'e19: система в условии');
    if (m === null) return;
    const U = m.slice(1, 5).map((t) => razobrat(t.replace(/\\left|\\right/g, '')));
    ok(
      U.every((u) => u !== null),
      'e19: уравнения разобраны',
    );
    if (!U.every((u) => u !== null)) return;
    const F1 = (x, y) => vychislit(U[0], { x, y }) - vychislit(U[1], { x, y });
    const F2 = (x, y, a) => vychislit(U[2], { x, y, a }) - vychislit(U[3], { x, y, a });
    /* Первое уравнение — окружность (cx; cy), r: проверяем в точках. */
    let naOkr = true;
    for (let t = 0; t < 6; t += 0.7)
      naOkr &&= Math.abs(F1(p.cx + p.r * Math.cos(t), p.cy + p.r * Math.sin(t))) < 1e-8;
    ok(naOkr && Math.abs(F1(p.cx, p.cy)) > 1, 'e19: первое уравнение — окружность');
    const chislo19 = (a) => {
      const f = (t) =>
        F2(p.cx + p.r * Math.cos(t), p.cy + p.r * Math.sin(t), a) / (1 + a * a + p.r * p.r);
      const t0 = 0.123456;
      return nuli(f, t0, t0 + 2 * Math.PI, 3e-3, 1e-10).filter((t) => t < t0 + 2 * Math.PI - 1e-7)
        .length;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kon = ks.flatMap((k) => [k.lo, k.hi]).filter(Number.isFinite);
    const a0 = Math.min(...kon) - 2;
    const a1 = Math.max(...kon) + 2;
    let plokho = 0;
    for (let a = a0 + 0.00731; a < a1; a += (a1 - a0) / 250) {
      /* У касания два корня по углу сливаются — окрестности особых a пропускаем. */
      if (kon.some((c) => Math.abs(c - a) < 0.03)) continue;
      if ((chislo19(a) === p.k) !== vMnozh(ks, a)) plokho += 1;
    }
    ok(plokho === 0, 'e19: число решений на сетке a', String(plokho));
    for (const k of ks.filter((q) => q.lo === q.hi))
      ok(chislo19(k.lo) === p.k, 'e19: отдельная точка ответа');
  }

  /* ── 20 ── */
  const novoe = (n) => {
    const d = String(n).split('').map(Number);
    return Number((d.includes(0) ? d.sort((x, y) => y - x) : d.sort((x, y) => x - y)).join(''));
  };
  const maska = (n) => {
    const s = String(n);
    return (s[1] === '0' ? 1 : 0) | (s[2] === '0' ? 2 : 0) | (s.includes('0') ? 0 : 4);
  };
  /** Пример «Например, 12 чисел $102$, …, число $999$ (…)» из строки решения. */
  const primer = (stroka) => {
    const t = stroka.slice(stroka.indexOf('Например,'), stroka.indexOf('('));
    const out = [];
    for (const m of t.matchAll(/(?:(\d+) (?:числа|чисел|число)|число) \$(\d+)\$/g))
      out.push([Number(m[2]), m[1] ? Number(m[1]) : 1]);
    return out;
  };
  const summy = (nab) => ({
    N: nab.reduce((s, [, c]) => s + c, 0),
    S1: nab.reduce((s, [n, c]) => s + n * c, 0),
    S2: nab.reduce((s, [n, c]) => s + novoe(n) * c, 0),
    mask: nab.reduce((s, [n]) => s | maska(n), 0),
  });

  function provE20(p, z) {
    const max = p.cel === 'max';
    const [P, Q] = z.punkty[2].pole.verno.split('/').map(Number);
    /* Динамика: наибольшая Σ(Q·числ − P·знам) по N числам с покрытием всех условий. */
    const g = [];
    for (let n = 100; n <= 999; n += 1)
      g.push([maska(n), max ? Q * novoe(n) - P * n : Q * n - P * novoe(n)]);
    /* Лучшее по каждой маске класса. */
    const best = new Map();
    for (const [mk, v] of g) best.set(mk, Math.max(best.get(mk) ?? -Infinity, v));
    let dp = new Array(8).fill(-Infinity);
    dp[0] = 0;
    for (let i = 0; i < p.N; i += 1) {
      const nd = new Array(8).fill(-Infinity);
      for (let s = 0; s < 8; s += 1) {
        if (dp[s] === -Infinity) continue;
        for (const [mk, v] of best) {
          /* Условия: 1 — ноль в десятках, 2 — в единицах, 4 — без нулей. */
          const t = s | mk;
          nd[t] = Math.max(nd[t], dp[s] + v);
        }
      }
      dp = nd;
    }
    ok(dp[7] === 0, 'e20: в) наибольшее Σ(Q·числ − P·знам) равно 0', String(dp[7]));
    const vv = z.reshenie.find((e) => e.title === 'в) Пример').lines[0];
    const nv = summy(primer(vv));
    ok(
      nv.N === p.N && nv.mask === 7 && (max ? nv.S2 * Q === nv.S1 * P : nv.S1 * Q === nv.S2 * P),
      'e20: в) пример',
    );
    /* а) */
    const aDa = z.punkty[0].pole.verno;
    let vse9 = true;
    for (let n = 100; n <= 999; n += 1) vse9 &&= (novoe(n) - n) % 9 === 0;
    ok(vse9, 'e20: перестановка не меняет остаток по модулю 9');
    if (aDa) {
      const na = summy(primer(z.reshenie[0].lines[0]));
      ok(na.N === p.N && na.mask === 7 && na.S2 - na.S1 === p.D, 'e20: а) пример');
    } else ok(p.D % 9 !== 0, 'e20: а) D не делится на 9');
    /* б) */
    if (z.punkty[1].pole.verno) {
      const nb = summy(primer(z.reshenie[1].lines[0]));
      ok(
        nb.N === p.N && nb.mask === 7 && (max ? nb.S2 === p.k * nb.S1 : nb.S1 === p.k * nb.S2),
        'e20: б) пример',
      );
    } else ok(p.k * Q > P, 'e20: б) k больше наибольшего отношения');
  }

  return {
    'e14.logKoren': provE14,
    'e15.prizmaTrapeciya': provE15,
    'e16.pokazRazlozh': provE16,
    'e17.snos': provE17,
    'e18.vysotyRavnobedr': provE18,
    'e19.okrPrjamye': provE19,
    'e20.perestanovkaCifr': provE20,
  };
}
