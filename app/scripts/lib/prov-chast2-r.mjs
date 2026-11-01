/**
 * Проверки шаблонов части 2 вариантов 31–36 (r14–r20, свои задачи
 * раздела) вторым способом — для scripts/check-povyshennye-chast2.mjs:
 * 14 — уравнение из текста условия: точки серий — корни, корни на
 *      отрезке перебором совпадают с ответом б);
 * 15 — координаты: площадь сечения, угол плоскостей, расстояние;
 * 16 — неравенство на сетке по параметрам задачи;
 * 17 — оптимум перебором с мелким шагом;
 * 18 — построение в координатах (ромб, трапеция; для треугольника —
 *      точка касания по найденному радиусу);
 * 19 — число решений перебором для точек и середин промежутков ответа;
 * 20 — полный перебор.
 */

import { chislaMnozh, nuli, seriya, sverMnozh } from './prov-obshchee.mjs';

const sub = (u, v) => u.map((x, i) => x - v[i]);
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
const len = (u) => Math.sqrt(dot(u, u));

/** Левая часть уравнения №14 из TeX условия — в функцию x (свой разбор, без кода шаблона). */
function texFunkciya(tex) {
  let s = tex
    .replace(/\\left|\\right/g, '')
    .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{?(\d+)\}?/g, 'Math.sqrt($1)')
    .replace(/\\(sin|cos)\^2x/g, 'Math.$1(x)**2')
    .replace(/\\(sin|cos)2x/g, 'Math.$1(2*x)')
    .replace(/\\(sin|cos)\s*x/g, 'Math.$1(x)')
    .replace(/\s+/g, '');
  /* Неявное умножение: «2Math», «)Math», «)(», «3(». */
  s = s.replace(/(\d|\))(?=Math|\()/g, '$1*');
  return new Function('x', `return ${s};`);
}

export function provR({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');
  const { cepochka } = requireSrc('lib/povyshennye/chast2/r20');

  /* ── 14 ── */
  function provR14(p, z) {
    const PI = Math.PI;
    const lev = z.uslovie.match(/\$([^$]*)=0\$/)[1];
    let f;
    if (p.vid === 'koren') {
      const fn = p.f === 'sin' ? Math.sin : Math.cos;
      const gn = p.f === 'sin' ? Math.cos : Math.sin;
      f = (x) => {
        const u = p.sigma * gn(x);
        return u < -1e-12 ? NaN : (2 * fn(x) - p.m) * Math.sqrt(Math.max(0, u));
      };
    } else {
      f = texFunkciya(lev);
      ok(Number.isFinite(f(0.3)), `r14: условие разбирается: ${lev}`);
    }
    /* У вида с корнем — по множителям: √u при u ≈ 1e−16 даёт 1e−8. */
    const koren = (x) => {
      if (p.vid !== 'koren') return Math.abs(f(x)) < 1e-9;
      const fn = p.f === 'sin' ? Math.sin : Math.cos;
      const gn = p.f === 'sin' ? Math.cos : Math.sin;
      return (
        Math.abs(gn(x)) < 1e-12 || (Math.abs(2 * fn(x) - p.m) < 1e-9 && p.sigma * gn(x) >= -1e-12)
      );
    };
    const serii = z.punkty[0].pole.verno;
    for (const s of serii)
      for (let n = -3; n <= 3; n += 1) {
        const x = seriya(razobrat, vychislit, s, n);
        ok(koren(x), `r14: серия ${s}, n=${n} — корень`, String(f(x)));
      }
    /* Корни на отрезке: множители по отдельности (касание корня с областью
       перебор знаков не ловит), иначе — нули левой части. */
    const lo = (p.lo * PI) / 2;
    const hi = (p.hi * PI) / 2;
    let vse;
    if (p.vid === 'koren') {
      const fn = p.f === 'sin' ? Math.sin : Math.cos;
      const gn = p.f === 'sin' ? Math.cos : Math.sin;
      const a = nuli(gn, lo - 1e-9, hi + 1e-9);
      const b = nuli((x) => 2 * fn(x) - p.m, lo - 1e-9, hi + 1e-9).filter(
        (x) => p.sigma * gn(x) >= -1e-12,
      );
      vse = [...a, ...b];
    } else vse = nuli(f, lo - 1e-9, hi + 1e-9, 1e-3, 1e-10);
    vse = vse.filter((x) => x >= lo - 1e-9 && x <= hi + 1e-9).sort((u, v) => u - v);
    vse = vse.filter((x, i) => i === 0 || Math.abs(x - vse[i - 1]) > 1e-6);
    const otv = z.punkty[1].pole.verno.map((t) => chislo(t));
    ok(
      otv.length === vse.length && otv.every((x, i) => close(x, vse[i], 1e-6)),
      `r14: корни на отрезке`,
      `${vse} vs ${otv}`,
    );
  }

  /* ── 15 ── */
  function provR15(p, z) {
    const a = p.a;
    const h = p.hN / p.hD;
    let v;
    if (p.vid === 'kvPrizma') {
      const B = [a, 0, 0];
      const D = [0, a, 0];
      const M = [a, a, h / 2];
      v = len(cross(sub(D, B), sub(M, B))) / 2;
    } else if (p.vid === 'piramida') {
      const B = [a, 0, 0];
      const D = [0, a, 0];
      const S = [a / 2, a / 2, h];
      const M = [(S[0] + a) / 2, (S[1] + a) / 2, h / 2];
      const n = cross(sub(D, B), sub(M, B));
      v = Math.acos(Math.abs(n[2]) / len(n));
    } else {
      const A = [0, 0, 0];
      const B = [a, 0, 0];
      const C = [a / 2, (a * Math.sqrt(3)) / 2, 0];
      const M = [C[0], C[1], h / 2];
      const n = cross(sub(B, A), sub(M, A));
      v = Math.abs(dot(n, sub(C, A))) / len(n);
    }
    ok(close(v, z.kontrol.otv, 1e-9), `r15 ${p.vid}: координаты`, `${v} vs ${z.kontrol.otv}`);
    ok(close(chislo(z.punkty[1].pole.verno), v, 1e-9), `r15 ${p.vid}: запись ответа`);
  }

  /* ── 16 ── */
  function provR16(p, z) {
    let istina;
    if (p.vid === 'pokazDrob') {
      istina = (x) => {
        const t = p.b ** x;
        const zn = t - p.b ** p.ga;
        if (Math.abs(zn) < 1e-12) return false;
        const v = ((t - p.b ** p.al) * (t - p.b ** p.be)) / zn;
        return p.znak === 'le' ? v <= 0 : v >= 0;
      };
    } else if (p.vid === 'logKvadrat') {
      istina = (x) => {
        if (x + p.s <= 0) return false;
        const y = Math.log(x + p.s) / Math.log(p.b);
        const v = (y - p.al) * (y - p.be);
        return p.znak === 'le' ? v <= 1e-12 : v >= -1e-12;
      };
    } else {
      const w2 = p.u1 + p.u2 + 1 - p.w1;
      const r = p.u1 * p.u2 - p.w1 * w2;
      const q = p.q[0] / p.q[1];
      istina = (x) => {
        const A = (x - p.u1) * (x - p.u2);
        const B = x + r;
        if (A <= 0 || B <= 0) return false;
        return Math.log(A) / Math.log(q) <= Math.log(B) / Math.log(q) + 1e-12;
      };
    }
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, `r16 ${p.vid}`, istina, ks, -30, 60, 0.0011);
    /* Закрытые концы — решения, открытые — нет. */
    for (const k of ks) {
      if (Number.isFinite(k.lo)) ok(istina(k.lo) === k.loZ, `r16: левый конец ${k.lo}`);
      if (Number.isFinite(k.hi)) ok(istina(k.hi) === k.hiZ, `r16: правый конец ${k.hi}`);
    }
  }

  /* ── 17 ── */
  function provR17(p, z) {
    let best;
    if (p.vid === 'korobka') {
      let b = [-1, 0];
      for (let x = 1e-5; x < p.b / 2; x += 1e-5) {
        const V = x * (p.a - 2 * x) * (p.b - 2 * x);
        if (V > b[0]) b = [V, x];
      }
      best = p.vopros === 'V' ? b[0] : b[1];
    } else if (p.vid === 'pribyl') {
      let b = [-Infinity, 0];
      for (let q = p.c; q * q < p.A; q += 1e-5) {
        const P = (q - p.c) * (p.A - q * q);
        if (P > b[0]) b = [P, q];
      }
      best = p.vopros === 'P' ? b[0] : b[1];
    } else {
      let b = [Infinity, 0];
      for (let x = 0; x <= p.L; x += 1e-5) {
        const T = (p.L - x) / p.v1 + Math.hypot(x, p.d) / p.v2;
        if (T < b[0]) b = [T, x];
      }
      best = p.vopros === 'T' ? b[0] : p.L - b[1];
    }
    ok(
      Math.abs(best - z.kontrol.otv) < 1e-4 * Math.max(1, Math.abs(best)),
      `r17 ${p.vid}: перебор`,
      `${best} vs ${z.kontrol.otv}`,
    );
    ok(close(chislo(z.punkty[0].pole.verno), z.kontrol.otv, 1e-9), `r17: запись ответа`);
  }

  /* ── 18 ── */
  function provR18(p, z) {
    let v;
    if (p.vid === 'rombMediana') {
      const A = [-p.d1 / 2, 0];
      const B = [0, p.d2 / 2];
      const C = [p.d1 / 2, 0];
      const D = [0, -p.d2 / 2];
      const M = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
      /* K = AM ∩ BD (x = 0). */
      const t = -A[0] / (M[0] - A[0]);
      const K = [0, A[1] + t * (M[1] - A[1])];
      const BK = Math.hypot(K[0] - B[0], K[1] - B[1]);
      const KD = Math.hypot(D[0] - K[0], D[1] - K[1]);
      ok(close(BK / KD, 0.5, 1e-12), 'r18 ромб: BK : KD = 1 : 2');
      v = Math.hypot(K[0] - A[0], K[1] - A[1]);
    } else if (p.vid === 'vpisPryam') {
      /* По ответу r строим катеты m + r, n + r: треугольник прямоугольный,
         точка касания на гипотенузе делит её на m и n, площадь равна mn. */
      const r = z.kontrol.otv;
      const AC = p.m + r;
      const BC = p.n + r;
      const AB = Math.hypot(AC, BC);
      ok(close(AB, p.m + p.n, 1e-12), 'r18: AB = m + n');
      ok(close((AC + BC - AB) / 2, r, 1e-12), 'r18: радиус по формуле r = (a + b − c)/2');
      ok(close((AC * BC) / 2, p.m * p.n, 1e-12), 'r18: площадь равна mn');
      v = r;
    } else {
      const AB = Math.hypot(p.p, p.q);
      const al = Math.atan2(p.q, p.p);
      const A = [0, 0];
      const B = [AB * Math.cos(2 * al), AB * Math.sin(2 * al)];
      const P = [p.p * Math.cos(al), p.p * Math.sin(al)];
      ok(close(Math.hypot(B[0] - P[0], B[1] - P[1]), p.q, 1e-12), 'r18 трапеция: BP');
      ok(Math.abs(dot(sub(A, P), sub(B, P))) < 1e-9, 'r18 трапеция: угол APB прямой');
      v = B[1];
    }
    ok(close(v, z.kontrol.otv, 1e-9), `r18 ${p.vid}: построение`, `${v} vs ${z.kontrol.otv}`);
    ok(close(chislo(z.punkty[1].pole.verno), v, 1e-9), `r18: запись ответа`);
  }

  /* ── 19 ── */
  function chisloResheniy(p, a) {
    let xs;
    if (p.vid === 'polukrug') {
      const k = p.kn / p.kd;
      const g = (x) => Math.sqrt(Math.max(0, p.R * p.R - x * x)) - k * x - a;
      xs = nuli(g, -p.R, p.R, 1e-4, 1e-9);
      /* Концы полуокружности перебор знаков не проверяет — отдельно. */
      for (const x of [-p.R, p.R])
        if (Math.abs(g(x)) < 1e-12 && !xs.some((y) => Math.abs(y - x) < 1e-6)) xs.push(x);
    } else if (p.vid === 'okrModul') {
      xs = nuli((x) => x * x + (Math.abs(x) + a) ** 2 - p.R * p.R, -2 * p.R, 2 * p.R, 1e-4, 1e-9);
    } else {
      const k = p.s * p.s;
      xs = nuli(
        (x) => Math.abs(x * x - (k + 1) * x + k) - a * x,
        -3 * k - 20,
        3 * k + 20,
        1e-4,
        1e-9,
      );
    }
    return xs.length;
  }
  function provR19(p, z) {
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const tochki = [];
    for (const k of ks) {
      const lo = Number.isFinite(k.lo) ? k.lo : k.hi - 7;
      const hi = Number.isFinite(k.hi) ? k.hi : k.lo + 7;
      tochki.push((lo + hi) / 2);
      if (Number.isFinite(k.lo)) tochki.push(k.lo, k.lo - 0.05);
      if (Number.isFinite(k.hi)) tochki.push(k.hi, k.hi + 0.05);
    }
    for (const a of tochki) {
      const vOtvete = ks.some(
        (k) =>
          (k.loZ ? a >= k.lo - 1e-12 : a > k.lo + 1e-12) &&
          (k.hiZ ? a <= k.hi + 1e-12 : a < k.hi - 1e-12),
      );
      const n = chisloResheniy(p, a);
      ok((n === p.kol) === vOtvete, `r19 ${p.vid}: a = ${a}`, `решений ${n}, в ответе ${vOtvete}`);
    }
  }

  /* ── 20 ── */
  function provR20(p, z) {
    let a;
    let b;
    let v;
    if (p.vid === 'ceny') {
      a = false;
      for (let P = 1; P <= 5000 && !a; P += 1)
        for (let q = 1; q < 100; q += 1) {
          const c = cepochka(P, q);
          if (c !== null && (p.aTip === 'D' ? P - c[1] === p.D : c[1] === P)) {
            a = true;
            break;
          }
        }
      b = false;
      for (let q = 1; q < 100; q += 1) if (cepochka(p.P0, q) !== null) b = true;
      for (v = 1; cepochka(v, p.p0) === null; v += 1);
    } else if (p.vid === 'deliteli') {
      const tau = (n) => {
        let c = 0;
        for (let d = 1; d * d <= n; d += 1) if (n % d === 0) c += d * d === n ? 1 : 2;
        return c;
      };
      a = false;
      b = false;
      v = 0;
      for (let N = 1; N <= 200000; N += 1)
        if (tau(N) === p.k) {
          if (v === 0) v = N;
          if (Number.isInteger(Math.sqrt(N))) a = true;
          if (N % 30 === 0) b = true;
        }
      /* Квадраты с нечётным числом делителей бывают большими: 2^(k−1). */
      if (p.k % 2 === 1) a = true;
    } else {
      const N = p.N;
      const A = p.A1[0] / p.A1[1];
      a = false;
      for (let n = 2; n <= N; n += 1) {
        const S = n * A;
        if (
          Math.abs(S - Math.round(S)) < 1e-9 &&
          S >= (n * (n + 1)) / 2 - 1e-9 &&
          S <= (n * (2 * N - n + 1)) / 2 + 1e-9
        )
          a = true;
      }
      /* б): существует набор из n чисел и B — перебираем суммы. */
      b = false;
      for (let n = 2; n <= N - 1 && !b; n += 1)
        for (let S = (n * (n + 1)) / 2; S <= (n * (2 * N - n + 1)) / 2 && !b; S += 1) {
          const B = S / n + p.D * (n + 1);
          if (Number.isInteger(B) && B <= N) {
            /* Набор с суммой S без числа B: при n ≤ N − 1 такой есть почти всегда — проверим явно перебором малых n. */
            if (n <= 3) {
              const rec = (st, acc, s) => {
                if (b) return;
                if (acc.length === n) {
                  if (s === S && !acc.includes(B)) b = true;
                  return;
                }
                for (let x = st; x <= N; x += 1) rec(x + 1, [...acc, x], s + x);
              };
              rec(1, [], 0);
            }
          }
        }
      v = 0;
      for (let n = 2; n <= N; n += 1) {
        const S = n * p.A2;
        if (S >= (n * (n + 1)) / 2 && S <= (n * (2 * N - n + 1)) / 2) v = n;
      }
    }
    ok(a === z.kontrol.a, `r20 ${p.vid} а)`, `${a}`);
    ok(b === z.kontrol.b, `r20 ${p.vid} б)`, `${b}`);
    ok(v === z.kontrol.v, `r20 ${p.vid} в)`, `${v} vs ${z.kontrol.v}`);
  }

  return {
    'r14.trig': provR14,
    'r15.stereo': provR15,
    'r16.neravenstvo': provR16,
    'r17.ekstremum': provR17,
    'r18.planimetriya': provR18,
    'r19.parametr': provR19,
    'r20.teoriyaChisel': provR20,
  };
}
