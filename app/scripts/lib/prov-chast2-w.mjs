/** Проверки вторым способом для семьи W (варианты 5–6). */
import {
  cross3,
  dot3,
  len3,
  sub3,
  tochkiProverki,
  vMnozhestve,
} from './prov-chast2-uvw-obshchee.mjs';

export function provW({ ok, close }) {
  function provW15(p, z) {
    const a = Math.sqrt(p.a2);
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a / 2, (a * Math.sqrt(3)) / 2, 0];
    const D = [a / 2, (a * Math.sqrt(3)) / 6, a * Math.sqrt(2 / 3)];
    ok(Math.abs(dot3(sub3(B, A), sub3(D, C))) < 1e-9, 'w15: AB ⊥ CD');
    const n = cross3(sub3(B, A), sub3(D, C));
    const d = Math.abs(dot3(n, sub3(C, A))) / len3(n);
    ok(close(d, z.kontrol.otvet, 1e-9), 'w15: расстояние между скрещивающимися');
  }
  function provW16(p, z) {
    const pred = (x) => {
      if (Math.abs(x - p.a) < 1e-12) return false;
      const v = Math.log(Math.abs(x - p.a)) / Math.log(p.q);
      return p.znak === 'le' ? v <= p.k + 1e-12 : v >= p.k - 1e-12;
    };
    for (const x of tochkiProverki(z.kontrol.kuski))
      ok(pred(x) === vMnozhestve(z.kontrol.kuski, x), 'w16: точка множества', String(x));
  }
  function provW17(p, z) {
    const S = 2 * p.t * p.t;
    let best = Infinity;
    for (let x = 0.01; x < 10 * p.t; x += 0.0005) best = Math.min(best, 2 * x + S / x);
    const nado = p.vopros === 'L' ? best : best * p.c;
    ok(Math.abs(nado - z.kontrol.otvet) < 1e-3 * Math.max(1, nado), 'w17: минимум перебором');
  }
  function provW18(p, z) {
    const h = (p.a + p.b) / 2;
    const A = [0, 0];
    const C = [(p.a + p.b) / 2, h];
    const B = [(p.a - p.b) / 2, h];
    const D = [p.a, 0];
    const dot = (C[0] - A[0]) * (D[0] - B[0]) + (C[1] - A[1]) * (D[1] - B[1]);
    ok(Math.abs(dot) < 1e-9, 'w18: диагонали перпендикулярны при h = средней линии');
    ok(close(((p.a + p.b) / 2) * h, z.kontrol.otvet, 1e-12), 'w18: площадь');
  }
  function provW19(p, z) {
    const chislo = (a) => {
      const s = new Set();
      const f = (x) => x * x - p.s * Math.abs(x) + p.t - a;
      const N = 60000;
      for (let i = 0; i < N; i++) {
        const x0 = -30 + (60 * i) / N;
        const x1 = x0 + 60 / N;
        if (Math.abs(f(x0)) < 1e-12) s.add(Math.round(x0 * 1e4) / 1e4);
        else if (f(x0) * f(x1) < 0) s.add(Math.round(((x0 + x1) / 2) * 1e2) / 1e2);
      }
      for (const x of [p.s / 2, -p.s / 2, 0]) if (Math.abs(f(x)) < 1e-12) s.add(x);
      return new Set([...s].map((x) => Math.round(x * 10) / 10 + 0)).size;
    };
    for (const a of tochkiProverki(z.kontrol.kuski))
      ok((chislo(a) === p.N) === vMnozhestve(z.kontrol.kuski, a), 'w19: число решений', String(a));
  }
  function provW20(p, z) {
    const N = Math.max(p.n1, p.M + 2 * (p.k + 1), p.N);
    const win = [false];
    for (let n = 1; n <= N; n++) {
      let w = false;
      for (let t = 1; t <= p.k && t <= n; t++) if (!win[n - t]) w = true;
      win.push(w);
    }
    ok(z.kontrol.daA === (win[p.n1] ? 1 : 0), 'w20: пункт а');
    let b = p.M + 1;
    while (win[b]) b++;
    ok(z.kontrol.b === b, 'w20: пункт б');
    let v = 0;
    for (let n = 1; n <= p.N; n++) if (!win[n]) v++;
    ok(z.kontrol.v === v, 'w20: пункт в');
  }
  return {
    'w15.tetraedr': provW15,
    'w16.logModul': provW16,
    'w17.zaborStena': provW17,
    'w18.trapeciyaPerp': provW18,
    'w19.vGrafik': provW19,
    'w20.kamni': provW20,
  };
}
