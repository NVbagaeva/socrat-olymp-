/** Проверки вторым способом для семьи V (варианты 3–4). */
import { tochkiProverki, vMnozhestve } from './prov-chast2-uvw-obshchee.mjs';

export function provV({ ok, close }) {
  function provV14(p, z) {
    const { c, s, lo, hi } = z.kontrol;
    const korni = [];
    const N = 240000;
    for (let i = 0; i <= N; i++) {
      const x = Math.PI * (lo + ((hi - lo) * i) / N);
      if (s * Math.sin(x) < -1e-9) continue;
      const v = Math.abs(2 * Math.cos(x) - c) * Math.sqrt(Math.max(0, s * Math.sin(x)));
      if (v < 2e-5 && !korni.some((k) => Math.abs(k - x) < 1e-3)) korni.push(x);
    }
    const vern = z.kontrol.korni.map((k) => k * Math.PI);
    ok(
      korni.length === vern.length && vern.every((v) => korni.some((k) => Math.abs(k - v) < 2e-3)),
      'v14: корни перебором',
      `${korni.length} vs ${vern.length}`,
    );
  }
  function provV15(p, z) {
    const a = Math.sqrt(p.a2);
    const h = Math.sqrt(p.h2);
    const C1 = [a / 2, (a * Math.sqrt(3)) / 2, h];
    const M = [a / 2, 0, 0];
    /* Плоскость ABB₁ — y = 0: синус угла = |y|/|C₁M|. */
    const ugol = Math.asin(C1[1] / Math.hypot(C1[0] - M[0], C1[1] - M[1], C1[2] - M[2]));
    ok(close(ugol, z.kontrol.otvet, 1e-9), 'v15: угол по координатам');
  }
  function provV16(p, z) {
    const pred = (x) => {
      if (x < p.a - 1e-12 || x <= 0) return false;
      const v = Math.sqrt(Math.max(0, x - p.a)) * (Math.log(x) / Math.log(p.q) - p.c);
      return p.znak === 'ge' ? v >= -1e-12 : v <= 1e-12;
    };
    for (const x of tochkiProverki(z.kontrol.kuski))
      ok(pred(x) === vMnozhestve(z.kontrol.kuski, x), 'v16: точка множества', String(x));
  }
  function provV18(p, z) {
    const R = (p.AH + p.HB) / 2;
    const xH = -R + p.AH;
    const cd = 2 * Math.sqrt(R * R - xH * xH);
    ok(close(cd, z.kontrol.otvet, 1e-9), 'v18: хорда по координатам');
  }
  function provV19(p, z) {
    const chislo = (a) => {
      const roots = [];
      const D = (a + p.r) ** 2 - 4 * a * p.r;
      for (const x of [
        (a + p.r - Math.sqrt(Math.max(0, D))) / 2,
        (a + p.r + Math.sqrt(Math.max(0, D))) / 2,
      ])
        if (x >= p.L - 1e-9 && x <= p.H + 1e-9 && !roots.some((y) => Math.abs(y - x) < 1e-9))
          roots.push(x);
      return roots.length;
    };
    for (const a of tochkiProverki(z.kontrol.kuski))
      ok((chislo(a) === 1) === vMnozhestve(z.kontrol.kuski, a), 'v19: число корней', String(a));
  }
  function provV20(p, z) {
    /* Достижимые значения a_j перебором. */
    let sloy = new Set([1]);
    const dost = [null, sloy];
    for (let j = 2; j <= Math.max(p.k, 12); j++) {
      const nov = new Set();
      for (const v of sloy) for (let w = v + 1; w <= 2 * v && w <= 5000; w++) nov.add(w);
      sloy = nov;
      dost.push(sloy);
    }
    ok(z.kontrol.daA === (dost[p.k].has(p.N1) ? 1 : 0), 'v20: пункт а');
    let n = 1;
    while (!dost[n]?.has(p.N2)) n++;
    ok(z.kontrol.n === n, 'v20: пункт б');
    let best = new Map([[1, 1]]);
    for (let j = 2; j <= p.m; j++) {
      const nb = new Map();
      for (const [v, s] of best)
        for (let w = v + 1; w <= 2 * v; w++) nb.set(w, Math.max(nb.get(w) ?? 0, s + w));
      best = nb;
    }
    ok(z.kontrol.summa === Math.max(...best.values()), 'v20: пункт в');
  }
  return {
    'v14.kosKoren': provV14,
    'v15.prizmaMediana': provV15,
    'v16.korenLog': provV16,
    'v18.diametrHorda': provV18,
    'v19.dvaKornya': provV19,
    'v20.udvoenie': provV20,
  };
}
