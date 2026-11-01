/** Проверки вторым способом для семьи U (варианты 1–2). */
import { doPloskosti, tochkiProverki, vMnozhestve } from './prov-chast2-uvw-obshchee.mjs';

export function provU({ ok, close }) {
  function provU14(p, z) {
    const { c, d, lo, hi } = z.kontrol;
    const f = (x) => Math.tan(x) + c / Math.tan(x) - d;
    const korni = [];
    const N = 200000;
    const a = lo * Math.PI;
    const b = hi * Math.PI;
    for (let i = 0; i <= N; i++) {
      const x = a + ((b - a) * i) / N;
      const y = x + (b - a) / N;
      const fx = f(x);
      const fy = f(y);
      if (
        Number.isFinite(fx) &&
        Number.isFinite(fy) &&
        Math.abs(Math.tan(x)) < 1e3 &&
        Math.abs(Math.tan(y)) < 1e3 &&
        Math.abs(1 / Math.tan(x)) < 1e3 &&
        fx * fy <= 0
      ) {
        const r = Math.abs(fx) < Math.abs(fy) ? x : y;
        if (!korni.some((k) => Math.abs(k - r) < 1e-3)) korni.push(r);
      }
    }
    const vern = z.kontrol.korni.map((k) => k * Math.PI);
    ok(
      korni.length === vern.length && vern.every((v) => korni.some((k) => Math.abs(k - v) < 1e-3)),
      'u14: корни перебором',
      `${korni} vs ${vern}`,
    );
  }
  function provU15(p, z) {
    const a = p.a;
    const h = (a * p.m) / (p.m + p.n);
    const B = [a, 0, 0];
    const C = [a, a, 0];
    const D = [0, a, 0];
    const M = [a, a, h];
    ok(close(doPloskosti(C, B, D, M), z.kontrol.otvet, 1e-9), 'u15: расстояние по координатам');
  }
  function provU16(p, z) {
    const pred = (x) => {
      const v = (p.q ** x - p.q ** p.b) * Math.abs(x - p.a);
      return p.znak === 'ge' ? v >= -1e-12 : v <= 1e-12;
    };
    for (const x of tochkiProverki(z.kontrol.kuski))
      ok(pred(x) === vMnozhestve(z.kontrol.kuski, x), 'u16: точка множества', String(x));
    ok(pred(p.a) && vMnozhestve(z.kontrol.kuski, p.a), 'u16: изолированная точка');
  }
  function provU17(p, z) {
    const k = 1 + p.r / 100;
    const X = z.kontrol.X;
    const dolg = (p.S * k - X) * k - X;
    ok(Math.abs(dolg) < 1e-6, 'u17: долг погашен', String(dolg));
    const nado = p.vopros === 'X' ? X : 2 * X - p.S;
    ok(close(nado, z.kontrol.otvet, 1e-12), 'u17: ответ');
  }
  function provU18(p, z) {
    const d = 2 * Math.sqrt(p.R * p.r);
    const O1 = [0, p.R];
    const O2 = [d, p.r];
    const t = p.R / (p.R + p.r);
    const Ky = O1[1] + (O2[1] - O1[1]) * t;
    const Kx = O1[0] + (O2[0] - O1[0]) * t;
    ok(Math.abs(Math.hypot(Kx - O1[0], Ky - O1[1]) - p.R) < 1e-9, 'u18: K на первой окружности');
    ok(Math.abs(Kx * (Kx - d) + Ky * Ky) < 1e-9, 'u18: угол AKB прямой');
    ok(close(Ky, z.kontrol.otvet, 1e-9), 'u18: расстояние до AB');
  }
  function provU19(p, z) {
    const chislo = (a) => {
      const s = new Set([p.b]);
      for (let i = 0; i <= 40000; i++) {
        const x0 = p.b + (i / 40000) * 60;
        const f = (x) => x * x - 2 * p.m * x + a;
        const x1 = x0 + 60 / 40000;
        if (f(x0) === 0) s.add(Math.round(x0 * 1e6) / 1e6);
        else if (f(x0) * f(x1) < 0) s.add(Math.round(((x0 + x1) / 2) * 1e3) / 1e3);
      }
      const D = p.m * p.m - a;
      if (Math.abs(D) < 1e-12 && p.m >= p.b) s.add(p.m);
      return new Set([...s].map((x) => Math.round(x * 1e2) / 1e2)).size;
    };
    for (const a of tochkiProverki(z.kontrol.kuski))
      ok((chislo(a) === 2) === vMnozhestve(z.kontrol.kuski, a), 'u19: число корней', String(a));
  }
  function provU20(p, z) {
    const n = p.n;
    const verh = [];
    for (let x = Math.floor(n / 2) + 1; x <= n; x++) verh.push(x);
    let antichain = true;
    for (const x of verh) for (const y of verh) if (x < y && y % x === 0) antichain = false;
    const nech = [];
    for (let x = 1; x <= n; x += 2) nech.push(x);
    ok(antichain && verh.length === nech.length, 'u20: пример и число цепочек');
    ok(z.kontrol.maks === nech.length, 'u20: наибольшее количество');
    ok(z.kontrol.summa === verh.reduce((s, x) => s + x, 0), 'u20: сумма');
    ok(z.kontrol.daA === (p.k <= nech.length ? 1 : 0), 'u20: пункт а');
  }
  return {
    'u14.tgCtg': provU14,
    'u15.kubPlosk': provU15,
    'u16.pokazModul': provU16,
    'u17.kredit2': provU17,
    'u18.dveOkrKasat': provU18,
    'u19.trehchlenKoren': provU19,
    'u20.nedelimye': provU20,
  };
}
