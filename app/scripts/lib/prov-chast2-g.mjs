/**
 * Проверки шаблонов части 2 вариантов 13–14 (g14–g20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — исходное уравнение по параметрам, нули перебором, отбор на отрезке;
 * 15 — координаты: плоскость через N, K параллельно BD, сечение по
 *      рёбрам призмы, площадь шнурком, объём пирамиды;
 * 16 — неравенство на сетке по исходной записи;
 * 18 — ромб строится численно (угол — подбором DB = DM), точка P —
 *      подбором на луче BH, радиус — S/p или описанной окружностью;
 * 19 — число корней по x для сетки a (кусочно-линейное уравнение);
 * 20 — примеры проверяются, формула наибольшей суммы — полным перебором
 *      на маленьких наборах.
 */

import { chislaMnozh, nuli, sverMnozh, vMnozh } from './prov-obshchee.mjs';

const sub = (u, v) => u.map((x, i) => x - v[i]);
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
const len = (u) => Math.sqrt(dot(u, u));

let formulaProverena = false;

export function provG({ ok, close, requireSrc }) {
  const { chislo } = requireSrc('lib/chast2/vyrazhenie');

  function provG14(p, z) {
    const S = p.t1 + p.t2;
    const P = p.t1 * p.t2;
    const c = p.q ** p.e;
    const B1 = p.q ** p.u1;
    const B2 = p.q ** p.u2;
    const sk = p.sg * p.k;
    const f = (x) => B1 ** ((p.e + 2 * sk * x) / p.u1) - S * B2 ** ((p.e + sk * x) / p.u2) + c * P;
    const g = (x) => f(x) / (Math.abs(B1 ** ((p.e + 2 * sk * x) / p.u1)) + c * P);
    const vse = nuli(g, -6, 6, 1e-3, 1e-12);
    ok(
      vse.length === z.kontrol.korni.length &&
        vse.every((x, i) => Math.abs(x - z.kontrol.korni[i]) < 1e-6),
      'g14: корни перебором совпадают',
      `${vse} / ${z.kontrol.korni}`,
    );
    const otr = vse.filter((x) => x >= p.lo - 1e-9 && x <= p.hi + 1e-9);
    ok(
      otr.length === z.kontrol.vybor.length &&
        otr.every((x, i) => Math.abs(x - z.kontrol.vybor[i]) < 1e-6),
      'g14: корни на отрезке',
    );
    const pole = z.punkty[0].pole.verno.map(chislo);
    ok(
      pole.every((x, i) => Math.abs(x - z.kontrol.korni[i]) < 1e-9),
      'g14: поле ответа а) — те же числа',
    );
  }

  function provG15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyG15 } = requireSrc('lib/povyshennye/chast2/g15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyG15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `g15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const h = Math.sqrt(z.kontrol.h2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a, a, 0];
    const D = [0, a, 0];
    const up = (X) => [X[0], X[1], h];
    const [A1, B1, C1, D1] = [A, B, C, D].map(up);
    const N = [a / 2, 0, 0];
    const t = p.m / (p.m + p.n);
    const K = [C1[0] + t * (D1[0] - C1[0]), a, h];
    const n = cross(sub(K, N), sub(D, B));
    const ca1 = sub(A1, C);
    ok(len(cross(n, ca1)) < 1e-9 * len(n) * len(ca1), 'g15: CA₁ ⊥ α (нормаль ∥ CA₁)');
    /* Сечение: пересечения плоскости с рёбрами. */
    const f = (X) => dot(n, sub(X, N));
    const reb = [
      [A, B],
      [B, C],
      [C, D],
      [D, A],
      [A1, B1],
      [B1, C1],
      [C1, D1],
      [D1, A1],
      [A, A1],
      [B, B1],
      [C, C1],
      [D, D1],
    ];
    const tochki = [];
    for (const [U, V] of reb) {
      const fu = f(U);
      const fv = f(V);
      if (Math.abs(fu) < 1e-12) tochki.push(U);
      if (fu * fv < 0) {
        const s = fu / (fu - fv);
        tochki.push(U.map((x, i) => x + s * (V[i] - x)));
      }
    }
    ok(tochki.length === 6, 'g15: сечение — шестиугольник', String(tochki.length));
    /* Площадь: проекция на плоскость, упорядочение по углу. */
    const c0 = tochki.reduce((s, X) => s.map((v, i) => v + X[i] / tochki.length), [0, 0, 0]);
    const e1 = sub(tochki[0], c0);
    const e2 = cross(n, e1);
    const u1 = e1.map((x) => x / len(e1));
    const u2 = e2.map((x) => x / len(e2));
    const pl = tochki
      .map((X) => [dot(sub(X, c0), u1), dot(sub(X, c0), u2)])
      .sort((P1, P2) => Math.atan2(P1[1], P1[0]) - Math.atan2(P2[1], P2[0]));
    let S = 0;
    for (let i = 0; i < pl.length; i += 1) {
      const [x1, y1] = pl[i];
      const [x2, y2] = pl[(i + 1) % pl.length];
      S += x1 * y2 - x2 * y1;
    }
    S = Math.abs(S) / 2;
    const dC = Math.abs(f(C)) / len(n);
    const nado = p.nado === 'V' ? (S * dC) / 3 : S;
    ok(close(nado, z.kontrol.otvet, 1e-9), `g15: ответ ${p.nado}`, `${nado} vs ${z.kontrol.otvet}`);
    ok(close(chislo(z.punkty[1].pole.verno), z.kontrol.otvet, 1e-9), 'g15: поле ответа');
  }

  function provG16(p, z) {
    const lg = (b, x) => Math.log(x) / Math.log(b);
    const levo = (x) => {
      const u = (x - p.c) / (x + p.c);
      const w = x * x - p.c * p.c;
      if (!(u > 0 && w > 0)) return NaN;
      return p.sg * lg(1 / p.q, u) + 2 * lg(p.q * p.q, w);
    };
    const istina = (x) => {
      const v = levo(x);
      if (!Number.isFinite(v)) return false;
      return p.znak === 'ge' ? v >= p.K - 1e-12 : v <= p.K + 1e-12;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'g16', istina, ks, -60, 60, 0.0011);
    for (const k of ks)
      for (const [x, zakr] of [
        [k.lo, k.loZ],
        [k.hi, k.hiZ],
      ])
        if (Number.isFinite(x))
          ok(istina(x) === zakr, `g16: конец ${x.toFixed(4)} ${zakr ? 'входит' : 'не входит'}`);
  }

  function provG18(p, z) {
    const s = 1;
    const mu = p.m / (p.m + p.n);
    /* Угол B подбираем: DB = DM при B(0;0), C(s;0), A = s(cos β; sin β). */
    const razn = (beta) => {
      const A = [Math.cos(beta), Math.sin(beta)];
      const D = [A[0] + s, A[1]];
      const M = [mu, 0];
      return Math.hypot(D[0], D[1]) - Math.hypot(D[0] - M[0], D[1] - M[1]);
    };
    let l = Math.PI / 2 + 1e-9;
    let r = Math.PI - 1e-9;
    for (let i = 0; i < 200; i += 1) {
      const m = (l + r) / 2;
      if (razn(l) * razn(m) <= 0) r = m;
      else l = m;
    }
    const beta = (l + r) / 2;
    const cosOstr = -Math.cos(beta);
    ok(Math.abs(cosOstr - z.kontrol.cos) < 1e-9, 'g18: косинус острого угла', `${cosOstr}`);
    const A = [Math.cos(beta), Math.sin(beta)];
    const D = [A[0] + s, A[1]];
    const M = [mu, 0];
    const d = [D[0] - M[0], D[1] - M[1]];
    const t = -(M[0] * d[0] + M[1] * d[1]) / (d[0] ** 2 + d[1] ** 2);
    const H = [M[0] + t * d[0], M[1] + t * d[1]];
    const u = [H[0] / Math.hypot(...H), H[1] / Math.hypot(...H)];
    const Pl = (lam) => [lam * u[0], lam * u[1]];
    const dist = (X, Y) => Math.hypot(X[0] - Y[0], X[1] - Y[1]);
    const B = [0, 0];
    let otv;
    if (p.vid === 'vpis') {
      /* AB + PD = BP + AD. */
      const g = (lam) => s + dist(Pl(lam), D) - lam - s;
      let a0 = 1e-6;
      let b0 = 10;
      for (let i = 0; i < 200; i += 1) {
        const m = (a0 + b0) / 2;
        if (g(a0) * g(m) <= 0) b0 = m;
        else a0 = m;
      }
      const P = Pl((a0 + b0) / 2);
      const pts = [A, B, P, D];
      let S = 0;
      for (let i = 0; i < 4; i += 1)
        S += pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1];
      S = Math.abs(S) / 2;
      const per = s + dist(B, P) + dist(P, D) + s;
      otv = S / (per / 2);
    } else {
      /* Окружность через A, B, D; P на луче — на ней. */
      const ax = A[0];
      const ay = A[1];
      const dx = D[0];
      const dy = D[1];
      const det = 2 * (ax * dy - ay * dx);
      const ox = ((ax * ax + ay * ay) * dy - (dx * dx + dy * dy) * ay) / det;
      const oy = ((dx * dx + dy * dy) * ax - (ax * ax + ay * ay) * dx) / det;
      const R = Math.hypot(ox, oy);
      const lam = 2 * (u[0] * ox + u[1] * oy);
      ok(lam > 0, 'g18: точка P на луче BH');
      ok(
        Math.abs(Math.hypot(lam * u[0] - ox, lam * u[1] - oy) - R) < 1e-9,
        'g18: P на окружности ABD',
      );
      otv = R;
    }
    const masht = Math.sqrt(p.s2);
    ok(
      close(otv * masht, z.kontrol.otvet, 1e-8),
      'g18: радиус',
      `${otv * masht} vs ${z.kontrol.otvet}`,
    );
    ok(close(chislo(z.punkty[1].pole.verno), z.kontrol.otvet, 1e-9), 'g18: поле ответа');
  }

  function provG19(p, z) {
    const beta = p.beta[0] / p.beta[1];
    const gamma = (p.sg * p.g[0]) / p.g[1];
    const c = p.c[0] / p.c[1];
    /* Число корней |x − βa| + |kx − kγa| = c + σax: на каждом куске линейно. */
    const kolvo = (a) => {
      const f = (x) =>
        Math.abs(x - beta * a) + Math.abs(p.k * x - p.k * gamma * a) - c - p.sg * a * x;
      const tochki = [beta * a, gamma * a].sort((u, v) => u - v);
      const granicy = [-1e7, ...tochki, 1e7];
      const korni = [];
      for (let i = 0; i + 1 < granicy.length; i += 1) {
        const L = granicy[i];
        const R = granicy[i + 1];
        const fl = f(L);
        const fr = f(R);
        if (Math.abs(fl - fr) < 1e-12) {
          if (Math.abs(fl) < 1e-12) return Infinity;
          continue;
        }
        const x = L + (fl / (fl - fr)) * (R - L);
        if (x >= L - 1e-9 && x <= R + 1e-9 && Math.abs(f(x)) < 1e-7) korni.push(x);
      }
      return korni.filter((x, i) => korni.findIndex((y) => Math.abs(y - x) < 1e-7) === i).length;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const znak = p.sg < 0 ? 1 : -1;
    const istina = (a) => (p.nol ? znak * a >= 0 : znak * a > 0) && kolvo(a) === p.N;
    sverMnozh(ok, 'g19', istina, ks, -8, 8, 0.00097);
    for (const k of ks)
      for (const [x, zakr] of [
        [k.lo, k.loZ],
        [k.hi, k.hiZ],
      ])
        if (Number.isFinite(x))
          ok(istina(x) === zakr, `g19: конец ${x.toFixed(5)}`, String(kolvo(x)));
    ok(vMnozh(ks, znak * 20) === (p.N === 1), 'g19: большие |a|');
  }

  function provG20(p, z) {
    const { goditsyaG20, chislaG20 } = requireSrc('lib/povyshennye/chast2/g20');
    const k = z.kontrol;
    ok(goditsyaG20(k.primerV, p.p, p.q) && k.primerV.length === p.N, 'g20: пример в) годится');
    ok(k.primerV.reduce((a, b) => a + b, 0) === k.maks, 'g20: сумма примера в)');
    ok(goditsyaG20(k.primerA, p.p, p.q) && k.primerA.includes(-p.X1), 'g20: пример а)');
    if (k.mozhnoB)
      ok(goditsyaG20(k.primerB, p.p, p.q) && k.primerB.includes(p.X2), 'g20: пример б)');
    /* Формула наибольшей суммы — полный перебор на малых наборах (один раз). */
    if (!formulaProverena) {
      formulaProverena = true;
      for (const [N, pp, q] of [
        [5, 1, 2],
        [6, 2, 3],
        [6, 1, 3],
        [5, 2, 3],
      ]) {
        let best = -Infinity;
        const vals = [];
        for (let v = -24; v <= 4; v += 1) vals.push(v);
        const rec = (start, nabor) => {
          if (nabor.length === N) {
            if (goditsyaG20(nabor, pp, q))
              best = Math.max(
                best,
                nabor.reduce((a, b) => a + b, 0),
              );
            return;
          }
          for (let i = start; i < vals.length; i += 1) rec(i + 1, [...nabor, vals[i]]);
        };
        rec(0, []);
        const f = chislaG20({ N, p: pp, q, X1: 1000, X2: 1000 }).maks;
        ok(best === f, `g20: формула в) на наборе N=${N}, p=${pp}, q=${q}`, `${best} vs ${f}`);
      }
    }
  }

  return {
    'g14.pokazKvadrat': provG14,
    'g15.prizmaSechenie': provG15,
    'g16.logDrob': provG16,
    'g18.rombVysota': provG18,
    'g19.dvaModulya': provG19,
    'g20.summyNabora': provG20,
  };
}
