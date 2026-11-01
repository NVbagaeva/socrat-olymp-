/**
 * Проверки шаблонов части 2 вариантов 13–14 (o14–o20) вторым способом:
 * 14 — нули исходного уравнения перебором, серии и отбор;
 * 15 — координаты: BC ⊥ AM, BC ⊥ SM, расстояние от A до (SBC) через нормаль;
 * 16, 19 — множество ответа сверяется с решением на сетке;
 * 18 — координаты: углы HCL и LCM, длины HL и HM;
 * 20 — пары (a, b) перебором по делителям НОК.
 */

import { chislaMnozh, sverMnozh } from './prov-obshchee.mjs';
import { cross, dot, len, otvetPolya, provTrig, sub } from './prov-chast2-k.mjs';

export function provO({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provO14(p, z) {
    const f = (x) => p.b ** (2 * Math.cos(x)) - z.kontrol.S * p.b ** Math.cos(x) + z.kontrol.P;
    provTrig({ ok, razobrat, vychislit }, 'o14', f, z, (p.lo * Math.PI) / 2, (p.hi * Math.PI) / 2);
  }

  function provO15(p, z) {
    const { scenariyO15 } = requireSrc('lib/povyshennye/chast2/o15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyO15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `o15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const h = Math.sqrt(p.h2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a / 2, (a * Math.sqrt(3)) / 2, 0];
    const O = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, 0];
    const S = [O[0], O[1], h];
    const M = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2, 0];
    ok(
      Math.abs(dot(sub(C, B), sub(M, A))) < 1e-9 && Math.abs(dot(sub(C, B), sub(M, S))) < 1e-9,
      'o15: а) BC ⊥ AM, SM',
    );
    const n = cross(sub(B, S), sub(C, S));
    const d = Math.abs(dot(n, sub(A, S))) / len(n);
    ok(close(d, z.kontrol.otvet, 1e-9), 'o15: расстояние');
    ok(close(otvetPolya(chislo, z), d, 1e-9), 'o15: поле ответа');
  }

  function provMnozh(imya, istina, z, a, b) {
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, imya, istina, ks, a, b, 0.000913);
  }

  function provO16(p, z) {
    const istina = (x) => {
      const den = x * x - p.c * p.c;
      if (Math.abs(den) < 1e-12) return false;
      const v = (Math.abs(x - p.a) - p.b) / den;
      return p.znak === 'le' ? v <= 1e-12 : v >= -1e-12;
    };
    provMnozh('o16', istina, z, -20, 20);
  }

  function provO18(p, z) {
    const c = Math.hypot(p.a, p.b);
    const A = [0, p.b];
    const B = [p.a, 0];
    const u = [B[0] - A[0], B[1] - A[1]];
    const t = -(u[0] * A[0] + u[1] * A[1]) / (u[0] * u[0] + u[1] * u[1]);
    const H = [A[0] + u[0] * t, A[1] + u[1] * t];
    /* L — точка гипотенузы на прямой y = x (биссектриса прямого угла). */
    const s = A[1] / (A[1] + B[0]);
    const L = [A[0] + u[0] * s, A[1] + u[1] * s];
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const ug = (P, Q) =>
      Math.acos((P[0] * Q[0] + P[1] * Q[1]) / (Math.hypot(...P) * Math.hypot(...Q)));
    ok(Math.abs(ug(H, L) - ug(L, M)) < 1e-9, 'o18: а) CL — биссектриса угла HCM');
    const d = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
    const otv = p.nado === 'HL' ? d(H, L) : d(H, M);
    ok(close(otv, z.kontrol.otvet, 1e-9) && close(c, z.kontrol.c, 1e-12), 'o18: б)');
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'o18: поле ответа');
  }

  function provO19(p, z) {
    const korni = (a) => {
      const g = (x) => x * x - 2 * Math.abs(x) - a;
      const xs = [-p.c];
      for (let x = -p.c; x <= 50; x += 0.0007) {
        const x1 = x + 0.0007;
        if (g(x) * g(x1) < 0) {
          let l = x;
          let r = x1;
          for (let k = 0; k < 80; k += 1) {
            const m = (l + r) / 2;
            if (g(l) * g(m) <= 0) r = m;
            else l = m;
          }
          xs.push((l + r) / 2);
        }
      }
      /* касание: минимумы −1 в ±1 и максимум 0 в 0 */
      for (const e of [-1, 0, 1])
        if (e > -p.c && Math.abs(e * e - 2 * Math.abs(e) - a) < 1e-12) xs.push(e);
      return xs.sort((u, v) => u - v).filter((x, i, m) => i === 0 || x - m[i - 1] > 1e-9).length;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    for (let a = -3; a <= p.c * p.c + 5; a += 0.137)
      ok(
        (korni(a) === p.n) === ks.some((k) => a > k.lo - 1e-9 && a < k.hi + 1e-9),
        `o19: a=${a.toFixed(3)}`,
      );
  }

  function provO20(p, z) {
    const L = p.d * p.m;
    const nod = (a, b) => (b === 0 ? a : nod(b, a % b));
    const summy = [];
    for (let a = p.d; a <= L; a += p.d)
      for (let b = a; b <= L; b += p.d)
        if (nod(a, b) === p.d && (a * b) / p.d === L) summy.push(a + b);
    ok(summy.includes(p.X) === z.kontrol.daA, 'o20: а)');
    ok(summy.includes(p.Y) === z.kontrol.daB, 'o20: б)');
    ok(Math.min(...summy) === z.kontrol.min, 'o20: в)');
  }

  return {
    'o14.pokazKos': provO14,
    'o15.piramidaRasst': provO15,
    'o16.modulDrob': provO16,
    'o18.bissVysotaMediana': provO18,
    'o19.wKoren': provO19,
    'o20.nodNok': provO20,
  };
}
