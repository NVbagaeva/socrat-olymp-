/**
 * Проверки шаблонов части 2 вариантов 19–20 (k14–k20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — нули исходного уравнения перебором, серии и отбор на отрезке;
 * 15 — координаты: SC ⊥ BD и SC ⊥ BM, угол через нормали, площадь;
 * 16 — неравенство на сетке по исходной записи;
 * 17 — максимум освещённости перебором по высоте;
 * 18 — координаты: высота, биссектриса, радиус описанной окружности BHL;
 * 19 — число общих точек квадрата и окружности перебором по контуру;
 * 20 — наборы чисел строятся явно, наибольшее — перебором значений.
 */

import { chislaMnozh, nuli, seriya, sverMnozh } from './prov-obshchee.mjs';

export const sub = (u, v) => u.map((x, i) => x - v[i]);
export const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
export const cross = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
export const len = (u) => Math.sqrt(dot(u, u));
export const lerp = (P, Q, t) => P.map((x, i) => x + t * (Q[i] - x));

/**
 * №14: серии — корни, все нули f на [−4π; 4π] — в сериях, корни на
 * отрезке [lo; hi] совпадают с отбором шаблона и с полем «корни».
 */
export function provTrig({ ok, razobrat, vychislit }, imya, f, z, lo, hi) {
  const serii = z.punkty[0].pole.verno;
  for (const s of serii)
    for (let n = -3; n <= 3; n += 1)
      ok(Math.abs(f(seriya(razobrat, vychislit, s, n))) < 1e-9, `${imya}: серия ${s}, n=${n}`);
  const iz = (x) =>
    serii.some((s) => {
      for (let n = -40; n <= 40; n += 1)
        if (Math.abs(seriya(razobrat, vychislit, s, n) - x) < 1e-5) return true;
      return false;
    });
  const vse = nuli(f, -4 * Math.PI, 4 * Math.PI, 1e-3, 1e-10);
  ok(
    vse.length > 0 && vse.every(iz),
    `${imya}: все корни на [−4π; 4π] — в сериях`,
    String(vse.length),
  );
  const naOtr = nuli(f, lo - 0.01, hi + 0.01, 1e-3, 1e-10).filter(
    (x) => x >= lo - 1e-7 && x <= hi + 1e-7,
  );
  const vybor = z.kontrol.vybor;
  ok(
    naOtr.length === vybor.length && naOtr.every((x, i) => Math.abs(x - vybor[i]) < 1e-6),
    `${imya}: корни на отрезке`,
    `${naOtr.length} / ${vybor.length}`,
  );
  const pole = z.punkty[1].pole.verno
    .map((t) => seriya(razobrat, vychislit, t, 0))
    .sort((u, v) => u - v);
  ok(
    pole.length === naOtr.length && pole.every((x, i) => Math.abs(x - naOtr[i]) < 1e-6),
    `${imya}: поле «корни на отрезке»`,
  );
}

/** Число в поле ответа «chislo» последнего пункта. */
export const otvetPolya = (chislo, z) => chislo(z.punkty[z.punkty.length - 1].pole.verno);

/** Минимум функции на отрезке: сетка + золотое сечение. */
export function argmin(f, a, b) {
  let best = a;
  const N = 20000;
  for (let i = 0; i <= N; i += 1) {
    const x = a + ((b - a) * i) / N;
    if (f(x) < f(best)) best = x;
  }
  let l = Math.max(a, best - (b - a) / N);
  let r = Math.min(b, best + (b - a) / N);
  for (let i = 0; i < 200; i += 1) {
    const m1 = l + (r - l) * 0.382;
    const m2 = l + (r - l) * 0.618;
    if (f(m1) < f(m2)) r = m2;
    else l = m1;
  }
  return (l + r) / 2;
}

export function provK({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provK14(p, z) {
    const fi = Math.PI / p.fi;
    const A = (p.sg * Math.cos(fi)) / Math.sin(Math.PI / p.u);
    ok(close(A, z.kontrol.A, 1e-12), 'k14: коэффициент при sin 2x');
    const f = (x) => Math.cos(x - fi) + Math.cos(x + fi) - A * Math.sin(2 * x);
    provTrig({ ok, razobrat, vychislit }, 'k14', f, z, (p.lo * Math.PI) / 2, (p.hi * Math.PI) / 2);
  }

  function provK15(p, z) {
    const { scenariyK15 } = requireSrc('lib/povyshennye/chast2/k15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyK15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `k15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const h = Math.sqrt(z.kontrol.h2);
    const A = [-a / 2, -a / 2, 0];
    const B = [a / 2, -a / 2, 0];
    const C = [a / 2, a / 2, 0];
    const D = [-a / 2, a / 2, 0];
    const S = [0, 0, h];
    const M = lerp(S, C, p.m / (p.m + p.n));
    const SC = sub(C, S);
    ok(
      Math.abs(dot(SC, sub(D, B))) < 1e-9 && Math.abs(dot(SC, sub(M, B))) < 1e-9,
      'k15: а) SC ⊥ BD и SC ⊥ BM',
    );
    ok(len(sub(A, B)) > 0, 'k15: основание');
    const nBMD = cross(sub(M, B), sub(D, B));
    let otv;
    if (p.nado === 'ugol') otv = Math.acos(Math.abs(nBMD[2]) / len(nBMD));
    else otv = len(nBMD) / 2;
    ok(close(otv, z.kontrol.otvet, 1e-9), `k15: ${p.nado}`, `${otv} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'k15: поле ответа');
  }

  function provK16(p, z) {
    const istina = (x) => {
      if (!(x > 0) || Math.abs(x - p.d) < 1e-12) return false;
      const t = Math.log(x) / Math.log(p.q);
      const v = (t * t - (p.al + p.be) * t + p.al * p.be) / (x - p.d);
      return p.znak === 'le' ? v <= 1e-12 : v >= -1e-12;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kraj = Math.max(p.d, p.q ** p.be) * 2 + 5;
    sverMnozh(ok, 'k16', istina, ks, -3, kraj, 0.000917);
    for (const k of ks)
      for (const [x, zakr] of [
        [k.lo, k.loZ],
        [k.hi, k.hiZ],
      ])
        if (Number.isFinite(x) && x !== 0) ok(istina(x) === zakr, `k16: конец ${x}`);
  }

  function provK17(p, z) {
    const R2 = 2 * p.k * p.k;
    const E = (h) => (p.I * h) / (h * h + R2) ** 1.5;
    const h = argmin((t) => -E(t), 0.001, 20 * p.k);
    const otv = p.vopros === 'h' ? h : E(h);
    ok(close(otv, z.kontrol.otvet, 1e-6), `k17: ${p.vopros}`, `${otv} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), z.kontrol.otvet, 1e-9), 'k17: поле ответа');
  }

  function provK18(p, z) {
    /* B в начале координат, C на оси x. */
    const B = [0, 0];
    const C = [p.a, 0];
    const xA = (p.a * p.a + p.c * p.c - p.b * p.b) / (2 * p.a);
    const A = [xA, Math.sqrt(p.c * p.c - xA * xA)];
    const AC = sub(C, A);
    const t = dot(sub(B, A), AC) / dot(AC, AC);
    const H = lerp(A, C, t);
    /* Биссектриса: направление — сумма единичных векторов BA и BC. */
    const u = [A[0] / p.c + 1, A[1] / p.c];
    const L = (() => {
      const den = u[0] * AC[1] - u[1] * AC[0];
      const s = (A[0] * AC[1] - A[1] * AC[0]) / den;
      return [s * u[0], s * u[1]];
    })();
    const ug = (P, V, Q) => {
      const v1 = sub(P, V);
      const v2 = sub(Q, V);
      return Math.acos(dot(v1, v2) / (len(v1) * len(v2)));
    };
    const angA = ug(B, A, C);
    const angC = ug(A, C, B);
    ok(close(ug(H, B, L), Math.abs(angA - angC) / 2, 1e-9), 'k18: а) ∠HBL = |A − C|/2');
    ok(t > 0 && t < 1, 'k18: H на стороне AC');
    const a1 = len(sub(H, L));
    const b1 = len(sub(B, L));
    const c1 = len(sub(B, H));
    const S = Math.abs((H[0] - B[0]) * (L[1] - B[1]) - (H[1] - B[1]) * (L[0] - B[0])) / 2;
    const R = (a1 * b1 * c1) / (4 * S);
    ok(close(R, z.kontrol.otvet, 1e-9), 'k18: радиус', `${R} vs ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), R, 1e-9), 'k18: поле ответа');
  }

  function provK19(p, z) {
    const s = Math.sqrt(p.s2);
    /* Контур |u| + |v| = s по параметру τ ∈ [0; 4): расстояние до центра. */
    const tochka = (tau) => {
      const st = ((Math.floor(tau) % 4) + 4) % 4;
      const w = tau - Math.floor(tau);
      const V = [
        [s, 0],
        [0, s],
        [-s, 0],
        [0, -s],
      ];
      return lerp(V[st], V[(st + 1) % 4], w);
    };
    const kolvo = (a) => {
      const R = Math.abs(a);
      const f = (tau) => len(tochka(tau)) - R;
      /* Замкнутый контур длины 4; начало — не вершина и не середина стороны. */
      return nuli(f, -0.2371, 3.7629, 1e-3, 1e-10).length;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const istina = (a) => (p.nado === 'est' ? kolvo(a) >= 1 : kolvo(a) === p.nado);
    sverMnozh(ok, 'k19', istina, ks, -s - 1, s + 1, 0.00731, 1e-5);
    for (const k of ks)
      for (const [x, zakr] of [
        [k.lo, k.loZ],
        [k.hi, k.hiZ],
      ])
        ok(istina(x) === zakr, `k19: конец ${x}`);
  }

  function provK20(p, z) {
    const S = p.n * p.M;
    /* Набор: n различных натуральных, сумма S, наибольшее X — строим жадно. */
    const sNaib = (X) => {
      const a = Array.from({ length: p.n - 1 }, (_, i) => i + 1);
      let ost = S - X - a.reduce((u, v) => u + v, 0);
      if (ost < 0 || a[a.length - 1] >= X) return null;
      for (let i = a.length - 1; i >= 0 && ost > 0; i -= 1) {
        const pot = X - (a.length - i) - a[i];
        const d = Math.min(pot, ost);
        a[i] += d;
        ost -= d;
      }
      return ost === 0 ? [...a, X] : null;
    };
    const verno = (nab, X, pervoe) =>
      nab !== null &&
      nab.length === p.n &&
      new Set(nab).size === p.n &&
      nab.every((v) => Number.isInteger(v) && v >= 1) &&
      nab.reduce((u, v) => u + v, 0) === S &&
      (pervoe ? Math.min(...nab) === X : Math.max(...nab) === X);
    const nA = sNaib(p.X);
    ok((nA !== null && verno(nA, p.X, false)) === z.kontrol.a, 'k20: а)');
    /* б) наименьшее Y: Y, Y+1, …, остаток — в последнее. */
    const nach = Array.from({ length: p.n - 1 }, (_, i) => p.Y + i);
    const nB = [...nach, S - nach.reduce((u, v) => u + v, 0)];
    ok(verno(nB, p.Y, true) === z.kontrol.b, 'k20: б)');
    let v = 0;
    for (let X = S; X >= 1 && v === 0; X -= 1) if (verno(sNaib(X), X, false)) v = X;
    ok(v === z.kontrol.v, 'k20: в) перебором', `${v} vs ${z.kontrol.v}`);
    ok(sNaib(v + 1) === null, 'k20: в) больше нельзя');
  }

  return {
    'k14.kosSumma': provK14,
    'k15.piramidaPerp': provK15,
    'k16.logDrob': provK16,
    'k17.lampa': provK17,
    'k18.vysotaBiss': provK18,
    'k19.kvadratOkr': provK19,
    'k20.srednee': provK20,
  };
}
