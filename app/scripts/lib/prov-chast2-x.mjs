/**
 * Проверки шаблонов части 2 вариантов 7–8 (x14–x20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs:
 * 14 — корни sin 2x = 2/s перебором (эквивалентно исходному на ОДЗ),
 *      исходное уравнение в найденных точках;
 * 15 — координаты: BD·AM = 0, угол AM с основанием через синус;
 * 16 — неравенство на сетке по исходной записи (два логарифма);
 * 17 — наибольшая площадь перебором по x;
 * 18 — центры и радиусы вписанных окружностей по координатам;
 * 19 — число корней |f(x)| = a для сетки a (два квадратных уравнения);
 * 20 — полный перебор трёхзначных чисел.
 */

import { chislaMnozh, sverMnozh, vMnozh } from './prov-obshchee.mjs';
import { dot, len, otvetPolya, provTrig, sub } from './prov-chast2-k.mjs';
import { koncy, maksimum } from './prov-chast2-n.mjs';

/** Различные корни x² + Bx + C = 0. */
function korniKv(B, C) {
  const D = B * B - 4 * C;
  if (D < -1e-12) return [];
  if (Math.abs(D) < 1e-12) return [-B / 2];
  return [(-B - Math.sqrt(D)) / 2, (-B + Math.sqrt(D)) / 2];
}

export function chisloRazlichnyh(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s.filter((x, i) => i === 0 || Math.abs(x - s[i - 1]) > 1e-9).length;
}

export function provX({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provX14(p, z) {
    const s = z.kontrol.s;
    const g = (x) => Math.sin(2 * x) - 2 / s;
    provTrig({ ok, razobrat, vychislit }, 'x14', g, z, (p.lo * Math.PI) / 4, (p.hi * Math.PI) / 4);
    for (const x of z.kontrol.vybor)
      ok(Math.abs(Math.tan(x) + 1 / Math.tan(x) - s) < 1e-7, `x14: исходное уравнение в ${x}`);
  }

  function provX15(p, z) {
    const { scenariyX15 } = requireSrc('lib/povyshennye/chast2/x15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyX15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `x15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a, a, 0];
    const D = [0, a, 0];
    const M = [a, a, (p.h * p.m) / (p.m + p.n)];
    ok(Math.abs(dot(sub(D, B), sub(M, A))) < 1e-9, 'x15: а) BD ⊥ AM');
    const ugol = Math.asin(M[2] / len(sub(M, A)));
    ok(close(ugol, z.kontrol.otvet, 1e-9), 'x15: угол', `${ugol} / ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), ugol, 1e-9), 'x15: поле ответа');
    void C;
  }

  function provX16(p, z) {
    const istina = (x) => {
      if (!(x + p.p > 0 && x + p.q > 0)) return false;
      const v = (Math.log(x + p.p) + Math.log(x + p.q)) / Math.log(p.b);
      return p.znak === 'le' ? v <= p.c + 1e-9 : v >= p.c - 1e-9;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'x16', istina, ks, -20, 60, 0.00097);
    koncy(ok, 'x16', istina, ks);
  }

  function provX17(p, z) {
    const S = (x) => (x * (p.B - 2 * p.k2 * x)) / p.k1;
    const x = maksimum(S, 0, p.B / (2 * p.k2));
    const y = (p.B - 2 * p.k2 * x) / p.k1;
    const otv = p.vopros === 'S' ? S(x) : y;
    ok(close(otv, z.kontrol.otvet, 1e-6), 'x17: максимум перебором', `${otv} / ${z.kontrol.otvet}`);
    ok(close(chislo(z.punkty[0].pole.verno), otv, 1e-6), 'x17: поле ответа');
  }

  function provX18(p, z) {
    const C = [0, 0];
    const B = [p.a, 0];
    const A = [0, p.b];
    const s = (p.b * p.b) / (p.a * p.a + p.b * p.b);
    const H = [A[0] + s * (B[0] - A[0]), A[1] + s * (B[1] - A[1])];
    const d = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1]);
    const rad = (P, Q, R) => {
      const S2 = Math.abs((Q[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q[1] - P[1]));
      return S2 / (d(P, Q) + d(Q, R) + d(R, P));
    };
    const r = rad(A, B, C);
    const r1 = rad(A, C, H);
    const r2 = rad(B, C, H);
    ok(close(r + r1 + r2, d(C, H), 1e-9), 'x18: а) r + r₁ + r₂ = CH');
    const otv = p.nado === 'r1' ? r1 : r2;
    ok(close(otv, z.kontrol.otvet, 1e-9), 'x18: радиус', `${otv} / ${z.kontrol.otvet}`);
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'x18: поле ответа');
  }

  function provX19(p, z) {
    /* |x² − 2bx − c| = a ⇔ x² − 2bx − c = a или = −a. */
    const chislo4 = (a) => {
      if (a < 0) return 0;
      return chisloRazlichnyh([...korniKv(-2 * p.b, -p.c - a), ...korniKv(-2 * p.b, -p.c + a)]);
    };
    const nado = (n) => (p.vopros === 'dva' ? n === 2 : p.vopros === 'chetyre' ? n === 4 : n >= 3);
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'x19', (a) => nado(chislo4(a)), ks, -5, 60, 0.0097);
    for (const k of ks)
      for (const x of [k.lo, k.hi])
        if (Number.isFinite(x)) ok(nado(chislo4(x)) === vMnozh(ks, x), `x19: конец ${x}`);
  }

  function provX20(p, z) {
    const cif = (N) => [Math.floor(N / 100), Math.floor(N / 10) % 10, N % 10];
    const est = (k) => {
      for (let N = 100; N < 1000; N += 1) if (N === k * cif(N).reduce((u, v) => u + v)) return true;
      return false;
    };
    ok(est(p.k1) === z.punkty[0].pole.verno, 'x20: а)');
    ok(est(p.k2) === z.punkty[1].pole.verno, 'x20: б)');
    let m = Infinity;
    for (let N = 100; N < 1000; N += 1) {
      const c = cif(N);
      if (p.ogr === 'raznye' && new Set(c).size !== 3) continue;
      if (p.ogr === 'bez0' && c.includes(0)) continue;
      m = Math.min(m, N / c.reduce((u, v) => u + v));
    }
    ok(close(m, z.kontrol.min, 1e-12), 'x20: в) перебором');
    ok(close(otvetPolya(chislo, z), m, 1e-12), 'x20: поле ответа');
  }

  return {
    'x14.tgCtg': provX14,
    'x15.prizmaBD': provX15,
    'x16.summaLog': provX16,
    'x17.uchastok': provX17,
    'x18.trivpisannye': provX18,
    'x19.modulParaboly': provX19,
    'x20.summaCifr': provX20,
  };
}
