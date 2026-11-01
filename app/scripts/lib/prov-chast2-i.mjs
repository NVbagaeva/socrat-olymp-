/**
 * Проверки шаблонов части 2 вариантов 15–16 (i14–i20) вторым способом:
 * 14 — нули исходного уравнения перебором;
 * 15 — координаты: B1D ⊥ AC, угол с плоскостью BCC1 через нормаль;
 * 16, 19 — множество ответа сверяется с решением на сетке;
 * 17 — минимум длины сетки перебором;
 * 18 — координаты окружностей: угол AKB, длины AB, KM;
 * 20 — перебор чисел.
 */

import { chislaMnozh, sverMnozh } from './prov-obshchee.mjs';
import { argmin, cross, dot, len, otvetPolya, provTrig, sub } from './prov-chast2-k.mjs';

export function provI({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');
  const { validirovat } = requireSrc('lib/chertezh3');

  function provI14(p, z) {
    const c = p.sg * 2 * Math.cos(Math.PI / p.u);
    ok(close(c, z.kontrol.c, 1e-12), 'i14: коэффициент');
    const f = (x) => Math.cos(3 * x) + Math.cos(x) - c * Math.cos(2 * x);
    provTrig({ ok, razobrat, vychislit }, 'i14', f, z, (p.lo * Math.PI) / 2, (p.hi * Math.PI) / 2);
  }

  function provI15(p, z) {
    const { scenariyI15 } = requireSrc('lib/povyshennye/chast2/i15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyI15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `i15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    const h = Math.sqrt(p.h2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a, a, 0];
    const D = [0, a, 0];
    const B1 = [a, 0, h];
    const C1 = [a, a, h];
    ok(Math.abs(dot(sub(D, B1), sub(C, A))) < 1e-9, 'i15: а) B1D ⊥ AC');
    const n = cross(sub(C, B), sub(C1, B));
    const v = sub(D, B1);
    const ug = Math.asin(Math.abs(dot(n, v)) / (len(n) * len(v)));
    ok(close(ug, z.kontrol.otvet, 1e-9), 'i15: угол');
    ok(close(otvetPolya(chislo, z), ug, 1e-9), 'i15: поле ответа');
  }

  function provI16(p, z) {
    const r1 = p.n1 / p.d1;
    const P = r1 + p.r2;
    const Q = -r1 * p.r2;
    const istina = (x) => {
      if (!(x > 0) || Math.abs(x - 1) < 1e-12) return false;
      const y = P * x + Q;
      if (!(y > 0)) return false;
      const v = Math.log(y) / Math.log(x);
      return p.znak === 'le' ? v <= 2 + 1e-9 : v >= 2 - 1e-9;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    sverMnozh(ok, 'i16', istina, ks, -3, 3 * p.r2 + 5, 0.000913);
  }

  function provI17(p, z) {
    const S = 2 * p.k * p.k;
    const x = argmin((t) => 2 * t + S / t, 0.01, S);
    const otv = p.vopros === 'L' ? 2 * x + S / x : p.vopros === 'x' ? x : S / x;
    ok(close(otv, z.kontrol.otvet, 1e-6), 'i17: перебор', `${otv}`);
    ok(close(otvetPolya(chislo, z), z.kontrol.otvet, 1e-12), 'i17: поле ответа');
  }

  function provI18(p, z) {
    /* Касательная — ось x, центры над ней; AB ищем из условия касания. */
    const AB = Math.sqrt((p.r + p.R) ** 2 - (p.R - p.r) ** 2);
    const O1 = [0, p.r];
    const O2 = [AB, p.R];
    ok(Math.abs(Math.hypot(O2[0] - O1[0], O2[1] - O1[1]) - (p.r + p.R)) < 1e-9, 'i18: касание');
    const t = p.r / (p.r + p.R);
    const K = [O1[0] + (O2[0] - O1[0]) * t, O1[1] + (O2[1] - O1[1]) * t];
    const KA = [-K[0], -K[1]];
    const KB = [AB - K[0], -K[1]];
    ok(Math.abs(KA[0] * KB[0] + KA[1] * KB[1]) < 1e-9, 'i18: а) угол AKB прямой');
    const M = [AB / 2, 0];
    const otv = p.nado === 'AB' ? AB : Math.hypot(K[0] - M[0], K[1] - M[1]);
    ok(close(otv, z.kontrol.otvet, 1e-9), 'i18: б)');
    ok(close(otvetPolya(chislo, z), otv, 1e-9), 'i18: поле ответа');
  }

  function provI19(p, z) {
    const f = (x) => x ** 3 - 3 * x;
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    for (let a = f(p.lo) - 3; a <= f(p.hi) + 3; a += 0.173) {
      /* Нули — смена знака по ненулевым значениям сетки плюс точные нули; касание в ±1. */
      let n = 0;
      const N = 20011;
      let prevZn = 0;
      for (let i = 0; i <= N; i += 1) {
        const x = p.lo + ((p.hi - p.lo) * i) / N;
        const cur = f(x) - a;
        const zn = Math.abs(cur) < 1e-12 ? 0 : Math.sign(cur);
        if (zn === 0) n += 1;
        else if (prevZn !== 0 && zn !== prevZn) n += 1;
        if (zn !== 0) prevZn = zn;
        else prevZn = 0;
      }
      for (const e of [-1, 1])
        if (Math.abs(f(e) - a) < 1e-12 && ((e - p.lo) * N) % (p.hi - p.lo) !== 0) n += 1;
      ok(
        (n === p.n) === ks.some((k) => a > k.lo - 1e-9 && a < k.hi + 1e-9),
        `i19: a=${a.toFixed(3)}`,
      );
    }
  }

  function provI20(p, z) {
    const sc = (n) =>
      String(n)
        .split('')
        .reduce((s, c) => s + Number(c), 0);
    let est9 = false;
    for (let n = 1; n < 2_000_000 && !est9; n += 1) if (sc(n) === p.S && n % 9 === 0) est9 = true;
    ok(est9 === z.kontrol.daA || (!est9 && p.S > 30), 'i20: а)');
    let tri = false;
    for (let n = 100; n <= 999; n += 1) if (sc(n) === p.S && n % p.d === 0) tri = true;
    ok(tri === z.kontrol.daB, 'i20: б)');
    let m = 0;
    for (let n = 1; m === 0 && n < 10_000_000; n += 1) if (sc(n) === p.S && n % p.d === 0) m = n;
    ok(m === z.kontrol.min, 'i20: в)');
  }

  return {
    'i14.kosTroynoy': provI14,
    'i15.prizmaDiag': provI15,
    'i16.logOsnovanie': provI16,
    'i17.uchastok': provI17,
    'i18.dveOkrKasanie': provI18,
    'i19.kubOtrezok': provI19,
    'i20.summaCifr': provI20,
  };
}
