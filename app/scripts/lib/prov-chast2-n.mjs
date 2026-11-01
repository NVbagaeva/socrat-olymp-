/**
 * Проверки шаблонов части 2 вариантов 25–26 (n14–n20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — исходное уравнение по ln x, нули перебором, отбор на отрезке;
 * 15 — координаты: нормали плоскостей BDM и ASC, площадь сечения
 *      векторным произведением, объём MBCD смешанным произведением;
 * 16 — неравенство на сетке по исходной записи (показательные функции);
 * 17 — максимум C(t) перебором и золотым сечением;
 * 18 — параллелограмм строится численно (AD и угол A — подбором),
 *      радиус — S/p, площадь — по координатам;
 * 19 — число общих точек окружности и сторон квадрата (пересечение
 *      с каждым отрезком) для сетки a;
 * 20 — полный перебор сумм подряд идущих чисел.
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

/** Точка максимума f на [a; b]: сетка, затем золотое сечение. */
export function maksimum(f, a, b, n = 20000) {
  let best = a;
  for (let i = 0; i <= n; i += 1) {
    const x = a + ((b - a) * i) / n;
    if (f(x) > f(best)) best = x;
  }
  let l = Math.max(a, best - (b - a) / n);
  let r = Math.min(b, best + (b - a) / n);
  for (let i = 0; i < 200; i += 1) {
    const m1 = l + (r - l) * 0.382;
    const m2 = l + (r - l) * 0.618;
    if (f(m1) < f(m2)) l = m1;
    else r = m2;
  }
  return (l + r) / 2;
}

/** Конец ответа входит в множество решений тогда и только тогда, когда он закрыт. */
export function koncy(ok, where, istina, ks) {
  for (const k of ks)
    for (const [x, zakr] of [
      [k.lo, k.loZ],
      [k.hi, k.hiZ],
    ])
      if (Number.isFinite(x))
        ok(istina(x) === zakr, `${where}: конец ${x.toFixed(4)} ${zakr ? 'входит' : 'не входит'}`);
}

/** Сверка с неравенством f ⋚ 0 (f — NaN вне ОДЗ). */
export function istinaZnak(f, znak) {
  return (x) => {
    const v = f(x);
    if (!Number.isFinite(v)) return false;
    const e = 1e-9;
    if (znak === 'le') return v <= e;
    if (znak === 'ge') return v >= -e;
    if (znak === 'lt') return v < -e;
    return v > e;
  };
}

export function provN({ ok, close, requireSrc }) {
  const { chislo } = requireSrc('lib/chast2/vyrazhenie');

  function provN14(p, z) {
    const A = -(p.t1 + p.t2) - 2 * p.s;
    const B = p.t1 * p.t2 - p.s * p.s;
    const M = p.q ** p.s;
    ok(z.uslovie.includes(`\\log_{${p.q}}^2(${M}x)`), 'n14: в условии log²(Mx) с тем же M');
    const lq = (x) => Math.log(x) / Math.log(p.q);
    /* По u = ln x: x = e^u > 0. */
    const g = (u) => {
      const x = Math.exp(u);
      return lq(M * x) ** 2 + A * lq(x) + B;
    };
    const vse = nuli(g, -15, 15, 1e-3, 1e-10).map(Math.exp);
    const korni = z.kontrol.korni;
    ok(
      vse.length === korni.length && vse.every((x, i) => close(x, korni[i], 1e-6)),
      'n14: корни перебором совпадают',
      `${vse} / ${korni}`,
    );
    const otr = vse.filter((x) => x >= p.lo - 1e-9 && x <= p.hi + 1e-9);
    const pb = z.punkty[1].pole.verno.map(chislo);
    ok(
      otr.length === pb.length && otr.every((x, i) => close(x, pb[i], 1e-6)),
      'n14: корни на отрезке',
    );
    const pa = z.punkty[0].pole.verno.map(chislo);
    ok(
      pa.length === korni.length && pa.every((x, i) => close(x, korni[i], 1e-9)),
      'n14: поле ответа а) — те же числа',
    );
  }

  function provN15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyN15 } = requireSrc('lib/povyshennye/chast2/n15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyN15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `n15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const h = Math.sqrt(p.b2 - p.a2 / 2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a, a, 0];
    const D = [0, a, 0];
    const S = [a / 2, a / 2, h];
    ok(close(len(sub(S, A)), Math.sqrt(p.b2), 1e-9), 'n15: SA = b');
    const M = S.map((x, i) => (x + C[i]) / 2);
    const n1 = cross(sub(D, B), sub(M, B));
    const n2 = cross(sub(S, A), sub(C, A));
    ok(Math.abs(dot(n1, n2)) < 1e-9 * len(n1) * len(n2), 'n15: (BDM) ⊥ (ASC)');
    const otv =
      p.nado === 'S'
        ? len(cross(sub(D, B), sub(M, B))) / 2
        : Math.abs(dot(sub(B, M), cross(sub(C, M), sub(D, M)))) / 6;
    ok(close(otv, z.kontrol.otvet, 1e-9), `n15: ${p.nado} по координатам`, `${otv}`);
    ok(close(chislo(z.punkty[1].pole.verno), otv, 1e-9), 'n15: поле ответа');
  }

  function provN16(p, z) {
    const u = p.q ** p.e1;
    const v = p.q ** p.e2;
    const w = p.q ** p.e3;
    const f = (x) => {
      const den = p.q ** x - w;
      if (Math.abs(den) < 1e-12) return NaN;
      return (p.q ** (2 * x) - (u + v) * p.q ** x + u * v) / den;
    };
    const istina = istinaZnak(f, p.znak);
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'n16', istina, ks, -12, 12, 0.00097);
    koncy(ok, 'n16', istina, ks);
  }

  function provN17(p, z) {
    const T1 = p.r * p.T2;
    ok(
      z.uslovie.includes(`T_1=${T1}`) && z.uslovie.includes(`T_2=${p.T2}`),
      'n17: T₁, T₂ в условии',
    );
    const C = (t) => 2 ** (-t / T1) - 2 ** (-t / p.T2);
    const t = maksimum(C, 0, 20 * T1);
    ok(close(t, z.kontrol.t, 1e-5), 'n17: максимум перебором', `${t} / ${z.kontrol.t}`);
    ok(close(chislo(z.punkty[0].pole.verno), t, 1e-5), 'n17: поле ответа');
  }

  function provN18(p, z) {
    /* A(0;0), D(d;0), B = a(cos α; sin α); K — биссектриса A ∩ BC. */
    const a = p.a;
    const stroit = (al, d) => {
      const B = [a * Math.cos(al), a * Math.sin(al)];
      const D = [d, 0];
      const C = [B[0] + d, B[1]];
      /* Биссектриса A: направление (cos α/2; sin α/2), прямая BC: y = B[1]. */
      const K = [B[1] / Math.tan(al / 2), B[1]];
      /* Биссектриса угла D: между DA и DC. */
      const e1 = [-1, 0];
      const dc = sub(C, D);
      const e2 = dc.map((x) => x / len(dc));
      const bis = [e1[0] + e2[0], e1[1] + e2[1]];
      const tK = B[1] / bis[1];
      const K2 = [D[0] + tK * bis[0], B[1]];
      return { B, C, D, K, K2 };
    };
    /* При данном α подбираем d: точки пересечения биссектрис с BC совпадают. */
    const podobratD = (al) => {
      let l = 1e-6;
      let r = 10 * a;
      const raz = (d) => {
        const s = stroit(al, d);
        return s.K[0] - s.K2[0];
      };
      for (let i = 0; i < 200; i += 1) {
        const m = (l + r) / 2;
        if (raz(l) * raz(m) <= 0) r = m;
        else l = m;
      }
      return (l + r) / 2;
    };
    const otn = (al) => {
      const d = podobratD(al);
      const s = stroit(al, d);
      return len(s.K) / len(sub(s.D, s.K));
    };
    let l = 0.01;
    let r = Math.PI - 0.01;
    const cel = p.m / p.n;
    for (let i = 0; i < 200; i += 1) {
      const m = (l + r) / 2;
      if ((otn(l) - cel) * (otn(m) - cel) <= 0) r = m;
      else l = m;
    }
    const al = (l + r) / 2;
    const d = podobratD(al);
    const s = stroit(al, d);
    ok(close(d, 2 * a, 1e-7), 'n18: а) AD = 2AB при построении');
    ok(s.K[0] >= s.B[0] - 1e-9 && s.K[0] <= s.C[0] + 1e-9, 'n18: K на стороне BC');
    const AK = len(s.K);
    const KD = len(sub(s.D, s.K));
    ok(close(AK, z.kontrol.AK, 1e-6) && close(KD, z.kontrol.KD, 1e-6), 'n18: AK, KD');
    const otv =
      p.nado === 'r' ? (AK * KD) / (AK + KD + d) : Math.abs(s.B[0] * s.D[1] - s.B[1] * s.D[0]);
    ok(close(otv, z.kontrol.otvet, 1e-6), `n18: ${p.nado} по координатам`, `${otv}`);
    ok(close(chislo(z.punkty[1].pole.verno), otv, 1e-6), 'n18: поле ответа');
  }

  function provN19(p, z) {
    const { c, R } = p;
    const V = [
      [c, 0],
      [0, c],
      [-c, 0],
      [0, -c],
    ];
    /* Общие точки окружности с центром (a; 0) и сторон квадрата. */
    const kolvo = (a) => {
      const pts = [];
      for (let i = 0; i < 4; i += 1) {
        const P = V[i];
        const Q = V[(i + 1) % 4];
        const dv = sub(Q, P);
        const w = [P[0] - a, P[1]];
        const A2 = dot(dv, dv);
        const B2 = 2 * dot(dv, w);
        const C2 = dot(w, w) - R * R;
        let D = B2 * B2 - 4 * A2 * C2;
        if (Math.abs(D) < 1e-9) D = 0;
        if (D < 0) continue;
        for (const s of [(-B2 - Math.sqrt(D)) / (2 * A2), (-B2 + Math.sqrt(D)) / (2 * A2)])
          if (s >= -1e-9 && s <= 1 + 1e-9) {
            const X = [P[0] + s * dv[0], P[1] + s * dv[1]];
            if (!pts.some((Y) => len(sub(X, Y)) < 1e-6)) pts.push(X);
          }
      }
      return pts.length;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const istina = (a) => kolvo(a) === p.N;
    sverMnozh(ok, 'n19', istina, ks, -c - R - 2, c + R + 2, 0.00097);
    koncy(ok, 'n19', istina, ks);
  }

  function provN20(p, z) {
    /* Все записи S суммой L ≥ 2 подряд идущих натуральных чисел. */
    const zapisi = (S) => {
      const out = [];
      for (let m = 1; m < S; m += 1)
        for (let L = 2, s = m; s <= S; L += 1) {
          s += m + L - 1;
          if (s === S) out.push({ m, L });
        }
      return out;
    };
    const a = zapisi(p.S1).length > 0;
    const b = zapisi(p.S2).some((x) => x.L === p.L2);
    const v = Math.max(...zapisi(p.S3).map((x) => x.L));
    ok(a === z.kontrol.a, 'n20: а) перебором');
    ok(b === z.kontrol.b, 'n20: б) перебором');
    ok(v === z.kontrol.v, 'n20: в) перебором', `${v} / ${z.kontrol.v}`);
    ok(z.punkty[0].pole.verno === a && z.punkty[1].pole.verno === b, 'n20: поля да/нет');
    ok(chislo(z.punkty[2].pole.verno) === v, 'n20: поле в)');
  }

  return {
    'n14.logKvadrat': provN14,
    'n15.piramidaSeredina': provN15,
    'n16.pokazDrob': provN16,
    'n17.koncentraciya': provN17,
    'n18.parallBiss': provN18,
    'n19.kvadratOkr': provN19,
    'n20.podryad': provN20,
  };
}
