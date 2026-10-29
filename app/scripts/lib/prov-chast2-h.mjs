/**
 * Проверки шаблонов части 2 вариантов 15–16 (h14–h20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — уравнение по слагаемым из параметров, нули перебором, отбор;
 * 15 — координаты: N как пересечение DK и SO, прямая через N ∥ SC,
 *      расстояние и угол между DK и SC через векторы;
 * 16 — неравенство на сетке по исходной записи;
 * 18 — трапеция по найденным основаниям: касание окружности с CD,
 *      отношение отрезков, радиус описанной — через треугольник ACD;
 * 19 — число решений системы: многочлен 4-й степени по x, корни
 *      методом Дюрана — Кернера;
 * 20 — полный перебор трёхзначных чисел.
 */

import { chislaMnozh, nuli, sverMnozh } from './prov-obshchee.mjs';

const sub = (u, v) => u.map((x, i) => x - v[i]);
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
const len = (u) => Math.sqrt(dot(u, u));

/** Корни многочлена (коэффициенты от старшего) — Дюран — Кернер. */
function korniMnogochlena(c) {
  const n = c.length - 1;
  const a = c.map((x) => x / c[0]);
  let z = Array.from({ length: n }, (_, k) => {
    const ug = (2 * Math.PI * k) / n + 0.4;
    return [0.9 * Math.cos(ug) * 3, 0.9 * Math.sin(ug) * 3];
  });
  const mul = (u, v) => [u[0] * v[0] - u[1] * v[1], u[0] * v[1] + u[1] * v[0]];
  const div = (u, v) => {
    const d = v[0] * v[0] + v[1] * v[1];
    return [(u[0] * v[0] + u[1] * v[1]) / d, (u[1] * v[0] - u[0] * v[1]) / d];
  };
  const val = (x) => {
    let r = [1, 0];
    for (let i = 1; i <= n; i += 1) r = [mul(r, x)[0] + a[i], mul(r, x)[1]];
    return r;
  };
  for (let it = 0; it < 600; it += 1) {
    z = z.map((zi, i) => {
      let den = [1, 0];
      z.forEach((zj, j) => {
        if (j !== i) den = mul(den, [zi[0] - zj[0], zi[1] - zj[1]]);
      });
      const d = div(val(zi), den);
      return [zi[0] - d[0], zi[1] - d[1]];
    });
  }
  return z;
}

export function provH({ ok, close, requireSrc }) {
  const { chislo } = requireSrc('lib/chast2/vyrazhenie');

  function provH14(p, z) {
    const lg = (b, x) => Math.log(x) / Math.log(b);
    const f = (x) => {
      const u = x + p.c;
      if (!(u > 0)) return NaN;
      let s = 0;
      for (const ch of p.chleny) {
        const osn = p.q ** (ch.e[0] / ch.e[1]);
        const v = (ch.A[0] / ch.A[1]) * lg(osn, u ** ch.w) ** ch.k;
        s += ch.prav ? -v : v;
      }
      return s + p.Clev[0] / p.Clev[1] - p.Cprav[0] / p.Cprav[1];
    };
    /* Переходим к t = log_q(x + c), чтобы шаг был равномерным по логарифму. */
    const g = (t) => f(p.q ** t - p.c);
    const tk = nuli(g, -8, 8, 1e-3, 1e-9);
    const xs = tk.map((t) => p.q ** t - p.c);
    ok(
      xs.length === z.kontrol.korni.length &&
        xs.every((x, i) => close(x, z.kontrol.korni[i], 1e-7)),
      'h14: корни перебором',
      `${xs} / ${z.kontrol.korni}`,
    );
    const lo = Math.log(p.lo.y[0] / p.lo.y[1]) / Math.log(p.lo.b[0] / p.lo.b[1]);
    const hi = Math.log(p.hi.y[0] / p.hi.y[1]) / Math.log(p.hi.b[0] / p.hi.b[1]);
    const v = xs.filter((x) => x >= lo && x <= hi);
    ok(
      v.length === z.kontrol.vybor.length && v.every((x, i) => close(x, z.kontrol.vybor[i], 1e-7)),
      'h14: отбор',
    );
    ok(
      z.punkty[0].pole.verno.map(chislo).every((x, i) => close(x, z.kontrol.korni[i], 1e-9)),
      'h14: поле а)',
    );
  }

  function provH15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyH15 } = requireSrc('lib/povyshennye/chast2/h15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyH15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `h15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const h = Math.sqrt(p.h2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a, a, 0];
    const D = [0, a, 0];
    const S = [a / 2, a / 2, h];
    const K = [(S[0] + B[0]) / 2, (S[1] + B[1]) / 2, h / 2];
    /* N = DK ∩ (SAC): плоскость SAC — x = y. */
    const s = (D[0] - D[1]) / (D[0] - D[1] - (K[0] - K[1]));
    const N = D.map((x, i) => x + s * (K[i] - x));
    /* Прямая через N ∥ SC до SA (параметр по SA) или до AC. */
    const sc = sub(C, S);
    if (p.delit === 'SA') {
      /* N + λ·sc = S + μ·(A − S): решаем по координатам x и z (в плоскости x = y). */
      const sa = sub(A, S);
      const r = sub(S, N);
      const det = sc[0] * -sa[2] - -sa[0] * sc[2];
      const mu = (sc[0] * r[2] - r[0] * sc[2]) / det;
      ok(Math.abs(mu - 1 / 3) < 1e-9, 'h15: SQ : QA = 1 : 2', String(mu));
    } else {
      const lam = -N[2] / sc[2];
      const P = N.map((x, i) => x + lam * sc[i]);
      ok(Math.abs(P[0] / a - 2 / 3) < 1e-9 && Math.abs(P[0] - P[1]) < 1e-9, 'h15: AP : PC = 2 : 1');
    }
    const dk = sub(K, D);
    const nn = cross(dk, sc);
    const rasst = Math.abs(dot(sub(S, D), nn)) / len(nn);
    const ugol = Math.acos(Math.abs(dot(dk, sc)) / (len(dk) * len(sc)));
    const nado = p.nado === 'rasst' ? rasst : ugol;
    ok(close(nado, z.kontrol.otvet, 1e-9), `h15: ${p.nado}`, `${nado} vs ${z.kontrol.otvet}`);
  }

  function provH16(p, z) {
    const istina = (x) => {
      const pod = p.luch === 'le' ? p.x0 - x : x - p.x0;
      if (pod < 0) return false;
      const zn =
        p.B ** (x * x - p.e1) - (p.B ** (2 * p.e2 - p.e1) + 1) * p.B ** (0.5 * x * x - p.e2) + 1;
      if (Math.abs(zn) < 1e-12) return false;
      const v = Math.sqrt(pod) / zn;
      return p.znak === 'le' ? v <= 0 : v >= 0;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'h16', istina, ks, -12, 12, 0.00071);
    for (const k of ks)
      for (const [x, zakr] of [
        [k.lo, k.loZ],
        [k.hi, k.hiZ],
      ])
        if (Number.isFinite(x)) ok(istina(x) === zakr, `h16: конец ${x.toFixed(4)}`);
  }

  function provH18(p, z) {
    const { r, b, d } = z.kontrol;
    const H = 2 * r;
    const A = [-d, 0];
    const D = [d, 0];
    const B = [-b, H];
    const C = [b, H];
    const dist = (X, Y) => Math.hypot(X[0] - Y[0], X[1] - Y[1]);
    ok(
      close(dist(C, D), p.L, 1e-9) && close(dist(A, B), p.L, 1e-9),
      'h18: боковые стороны равны L',
    );
    /* Вторая окружность (r; r) касается CD: расстояние до прямой CD = r. */
    const O2 = [r, r];
    const v = [D[0] - C[0], D[1] - C[1]];
    const w = [O2[0] - C[0], O2[1] - C[1]];
    const dl = Math.hypot(...v);
    const rast = Math.abs(v[0] * w[1] - v[1] * w[0]) / dl;
    ok(close(rast, r, 1e-9), 'h18: окружность касается CD');
    const proj = (v[0] * w[0] + v[1] * w[1]) / dl;
    ok(close(proj / (dl - proj), p.m / p.n, 1e-9), 'h18: CT : TD = m : n');
    ok(close(dist([-r, r], O2), 2 * r, 1e-12), 'h18: окружности касаются');
    let nado;
    if (p.nado === 'R') {
      /* Радиус описанной около ACD: abc/(4S). */
      const a1 = dist(A, C);
      const b1 = dist(C, D);
      const c1 = dist(A, D);
      const S = Math.abs((C[0] - A[0]) * (D[1] - A[1]) - (D[0] - A[0]) * (C[1] - A[1])) / 2;
      nado = (a1 * b1 * c1) / (4 * S);
    } else if (p.nado === 'S') nado = ((2 * b + 2 * d) / 2) * H;
    else nado = dist(A, C);
    ok(close(nado, z.kontrol.otvet, 1e-9), `h18: ${p.nado}`, `${nado} vs ${z.kontrol.otvet}`);
  }

  function provH19(p, z) {
    const al = p.alfa[0] / p.alfa[1];
    const be = p.beta[0] / p.beta[1];
    const ga = p.gamma[0] / p.gamma[1];
    const ka = p.kappa[0] / p.kappa[1];
    /* X = x + αa, Y = ax + (γ + β)a: X⁴ − Y⁴ − κa²(X² − Y²) — многочлен по x. */
    const kolvo = (a) => {
      const X = [1, al * a];
      const Y = [a, (ga + be) * a];
      const pmul = (u, v) => {
        const r = Array(u.length + v.length - 1).fill(0);
        u.forEach((x, i) => v.forEach((y, j) => (r[i + j] += x * y)));
        return r;
      };
      const X2 = pmul(X, X);
      const Y2 = pmul(Y, Y);
      const X4 = pmul(X2, X2);
      const Y4 = pmul(Y2, Y2);
      /* Коэффициенты от старшей степени: X2 сдвинут на две степени вниз. */
      const cc = [0, 1, 2, 3, 4].map(
        (i) => X4[i] - Y4[i] - ka * a * a * ((i >= 2 ? X2[i - 2] : 0) - (i >= 2 ? Y2[i - 2] : 0)),
      );
      let st = 0;
      while (st < cc.length && Math.abs(cc[st]) < 1e-12) st += 1;
      const ost = cc.slice(st);
      if (ost.length === 0) return Infinity;
      if (ost.length === 1) return 0;
      const kor = korniMnogochlena(ost)
        .filter((q) => Math.abs(q[1]) < 1e-5)
        .map((q) => q[0]);
      return kor.filter((x, i) => kor.findIndex((y) => Math.abs(y - x) < 1e-4) === i).length;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const vDom = (a) => (p.dom === 'pol' ? a > 0 : p.dom === 'otr' ? a < 0 : true);
    const istina = (a) => vDom(a) && kolvo(a) === 4;
    sverMnozh(ok, 'h19', istina, ks, -9, 9, 0.0137, 2e-3);
    /* Исключённые точки внутри — действительно не 4 решения. */
    for (const k of ks)
      for (const x of [k.lo, k.hi])
        if (Number.isFinite(x) && vDom(x))
          ok(kolvo(x) !== 4, `h19: на границе ${x.toFixed(4)} не 4 решения`, String(kolvo(x)));
  }

  function provH20(p, z) {
    const { cifryH20 } = requireSrc('lib/povyshennye/chast2/h20');
    const D = cifryH20(p);
    let mx = -Infinity;
    let mn = Infinity;
    const est = (k) => {
      for (const a of D)
        for (const b of D)
          for (const c of D) if (100 * a + 10 * b + c === k * a * b * c) return true;
      return false;
    };
    for (const a of D)
      for (const b of D)
        for (const c of D) {
          const r = (100 * a + 10 * b + c) / (a * b * c);
          mx = Math.max(mx, r);
          mn = Math.min(mn, r);
        }
    ok(est(p.k1), 'h20: а) пример существует');
    ok(est(p.k2) === z.kontrol.daB, 'h20: б) перебором');
    ok(close(p.nado === 'max' ? mx : mn, z.kontrol.otvC, 1e-12), 'h20: в) перебором');
    const n1 = z.kontrol.p1;
    const d1 = String(n1).split('').map(Number);
    ok(
      d1.every((x) => D.includes(x)) && n1 === p.k1 * d1[0] * d1[1] * d1[2],
      'h20: пример а) верен',
    );
  }

  return {
    'h14.logKub': provH14,
    'h15.pravPiramida': provH15,
    'h16.korenPokaz': provH16,
    'h18.trapeciyaDveOkr': provH18,
    'h19.pryamyeOkr': provH19,
    'h20.chisloProizv': provH20,
  };
}
