/**
 * Проверки шаблонов части 2 вариантов 7–8 (d14–d20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs. Формулы шаблонов не
 * используются, ответ считается заново по условию:
 * 14 — нули уравнения перебором по x, серии подстановкой;
 * 15 — координаты в числах, синус через нормаль векторным произведением;
 * 16 — неравенство на сетке;
 * 17 — максимум U_L(ω) перебором;
 * 18 — угол A подбором по длине AL, площадь по формуле шнурка;
 * 19 — число общих точек прямых и окружностей для сетки a;
 * 20 — ряды программы по правилам для всех D.
 */

import { chislaMnozh, nuli, seriya, sverMnozh } from './prov-obshchee.mjs';

export function provD({ ok, close, requireSrc }) {
  const { chislo, razobrat, vychislit } = requireSrc('lib/chast2/vyrazhenie');

  function provD14(p, z) {
    const fF = p.f === 'sin' ? (x) => Math.sin(p.k * x) ** 2 : (x) => Math.cos(p.k * x) ** 2;
    const st = (osn, sdvig, s, f) =>
      s > 0 ? osn ** f + osn ** (sdvig + f) : osn ** (sdvig + f) - osn ** f;
    const r = (x) => {
      const f = fF(x);
      return st(p.A, p.p, p.sA, f) - st(p.B, p.q, p.sB, f);
    };
    const serii = z.punkty[0].pole.verno;
    for (const s of serii)
      for (let n = -4; n <= 4; n += 1) {
        const x = seriya(razobrat, vychislit, s, n);
        ok(Math.abs(r(x)) < 1e-8, `d14: серия ${s} при n=${n} — корень`);
      }
    /* Все корни на [−2π; 2π] лежат в сериях. */
    const vse = nuli(r, -2 * Math.PI, 2 * Math.PI, 1e-3);
    const iz = (x) =>
      serii.some((s) => {
        for (let n = -40; n <= 40; n += 1)
          if (Math.abs(seriya(razobrat, vychislit, s, n) - x) < 1e-6) return true;
        return false;
      });
    ok(
      vse.length > 0 && vse.every(iz),
      'd14: все корни на [−2π; 2π] — в сериях',
      String(vse.length),
    );
    const lo = (p.lo[0] / p.lo[1]) * Math.PI;
    const hi = (p.hi[0] / p.hi[1]) * Math.PI;
    const naOtr = nuli(r, lo - 0.01, hi + 0.01, 1e-3).filter(
      (x) => x >= lo - 1e-6 && x <= hi + 1e-6,
    );
    const otv = z.punkty[1].pole.verno.map(chislo).sort((a, b) => a - b);
    ok(
      naOtr.length === otv.length && naOtr.every((x, i) => close(x, otv[i], 1e-6)),
      'd14: корни на отрезке',
      `${naOtr} / ${otv}`,
    );
  }

  function provD15(p, z) {
    const { validirovat } = requireSrc('lib/chertezh3');
    const { scenariyD15 } = requireSrc('lib/povyshennye/chast2/d15');
    for (const punkt of ['a', 'b']) {
      const zam = validirovat(scenariyD15(p, punkt), { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `d15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
    const a = Math.sqrt(p.a2);
    /* h из условия: A₁OC₁ равносторонний (A₁O = AC) или AB₁ = AD. */
    const h = p.vid === 'tri' ? Math.sqrt(4 * a * a - a * a) : Math.sqrt(5 * a * a - 2 * a * a);
    const T = {
      A: [-a, 0, 0],
      B: [0, -a, 0],
      C: [a, 0, 0],
      D: [a, a, 0],
      E: [0, a, 0],
      O: [0, 0, 0],
    };
    for (const k of ['A', 'B', 'C', 'D', 'E']) T[`${k}1`] = [T[k][0], T[k][1], h];
    const sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]];
    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const cr = (u, v) => [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const d = sub(T[p.pr[1]], T[p.pr[0]]);
    const n = cr(sub(T[p.pl[1]], T[p.pl[0]]), sub(T[p.pl[2]], T[p.pl[0]]));
    const sin = Math.abs(dot(d, n)) / Math.sqrt(dot(d, d) * dot(n, n));
    const v = p.fn === 'sin' ? sin : Math.sqrt(1 - sin * sin);
    ok(close(v, chislo(z.punkty[1].pole.verno), 1e-9), `d15: ${p.fn} угла`, `${v}`);
    /* а) для 'tri': ρ(D, AB₁) = ρ(B₁, AD). */
    const rasst = (P, A, B) => {
      const u = sub(B, A);
      const w = sub(P, A);
      const c = cr(u, w);
      return Math.sqrt(dot(c, c) / dot(u, u));
    };
    if (p.vid === 'tri')
      ok(close(rasst(T.D, T.A, T.B1), rasst(T.B1, T.A, T.D)), 'd15: а) расстояния равны');
    else
      ok(
        close(rasst(T.O, T.A1, T.C1), rasst(T.A1, T.O, T.C1)) &&
          close(rasst(T.A1, T.O, T.C1), rasst(T.C1, T.O, T.A1)),
        'd15: а) три расстояния равны',
      );
  }

  function provD16(p, z) {
    const osn = (o) => (o.m === 0 ? o.k : Math.sqrt(o.m) + o.k);
    const b1 = osn(p.b1);
    const b2 = osn(p.b2);
    const L = (x) => Math.log(Math.log(p.p * x + p.q) / Math.log(b2)) / Math.log(b1);
    const ist = (x) => {
      const v = L(x);
      if (!Number.isFinite(v)) return false;
      return p.znak === 'ge' ? v >= -1e-12 : v <= 1e-12;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kon = ks
      .flatMap((k) => [k.lo, k.hi])
      .filter((x) => Number.isFinite(x) && Math.abs(x) < 1e6);
    const a = Math.min(...kon) - 3;
    const b = Math.max(...kon) + 3;
    sverMnozh(ok, 'd16', ist, ks, a, b, (b - a) / 20000);
  }

  function provD17(p, z) {
    const C = p.Cm * 1e-5;
    const UL = (w) => (p.U * p.L * w) / Math.sqrt(p.R * p.R + (w * p.L - 1 / (w * C)) ** 2);
    let best = 1;
    for (let w = 1; w <= 20000; w += 0.5) if (UL(w) > UL(best)) best = w;
    let l = best - 1;
    let r = best + 1;
    for (let i = 0; i < 100; i += 1) {
      const m1 = l + (r - l) * 0.382;
      const m2 = l + (r - l) * 0.618;
      if (UL(m1) > UL(m2)) r = m2;
      else l = m1;
    }
    ok(
      close((l + r) / 2, Number(z.punkty[0].pole.verno), 1e-6),
      'd17: максимум U_L перебором',
      `${(l + r) / 2}`,
    );
  }

  function provD18(p, z) {
    /* Угол A подбором: точка пересечения биссектрис углов A и D на расстоянии AL от A. */
    const postroit = (A2) => {
      const A = [0, 0];
      const D = [p.AD, 0];
      const B = [p.AB * Math.cos(A2), p.AB * Math.sin(A2)];
      const C = [B[0] + p.AD, B[1]];
      /* Биссектриса A: направление на угол A2/2; биссектриса D: угол π − (π − A2)/2. */
      const ua = [Math.cos(A2 / 2), Math.sin(A2 / 2)];
      const ad = Math.PI - (Math.PI - A2) / 2;
      const ud = [Math.cos(ad), Math.sin(ad)];
      /* A + t·ua = D + s·ud. */
      const det = ua[0] * -ud[1] - ua[1] * -ud[0];
      const t = ((D[0] - A[0]) * -ud[1] - (D[1] - A[1]) * -ud[0]) / det;
      const L = [t * ua[0], t * ua[1]];
      return { A, B, C, D, L, AL: t };
    };
    let l = 1e-6;
    let r = Math.PI - 1e-6;
    /* AL(A2) убывает по A2. */
    for (let i = 0; i < 200; i += 1) {
      const c = (l + r) / 2;
      if (postroit(c).AL > p.AL) l = c;
      else r = c;
    }
    const G = postroit((l + r) / 2);
    const O = [(G.B[0] + G.D[0]) / 2, (G.B[1] + G.D[1]) / 2];
    const V = p.tr[0] === 'D' ? G.D : G.A;
    const S = Math.abs((O[0] - V[0]) * (G.L[1] - V[1]) - (O[1] - V[1]) * (G.L[0] - V[0])) / 2;
    ok(close(S, Number(z.punkty[1].pole.verno), 1e-6), `d18: площадь ${p.tr}`, `${S}`);
    const OL = Math.hypot(O[0] - G.L[0], O[1] - G.L[1]);
    ok(close(OL, Math.abs(p.AB - p.AD) / 2, 1e-6), 'd18: а) OL = |AB − AD|/2');
  }

  function provD19(p, z) {
    /* Показатель второго уравнения — из текста условия. */
    const m = z.uslovie.match(/=a\^\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/);
    ok(m !== null, 'd19: показатель в условии');
    if (m === null) return;
    const u = razobrat(m[1]);
    ok(u !== null, 'd19: показатель разобран', m[1]);
    if (u === null) return;
    const D = p.D[0] / p.D[1];
    const sV = [(D - p.m) / p.k, (-D - p.m) / p.k];
    const n2 = p.p * p.p + p.q * p.q;
    const chislo19 = (a) => {
      let n = 0;
      for (const s of sV) {
        /* Точка на прямой px + qy = s. */
        const x = (s * p.p) / n2;
        const y = (s * p.q) / n2;
        const e = vychislit(u, { x, y });
        const R2 = a ** e;
        const d2 = (p.p * p.x0 + p.q * p.y0 - s) ** 2 / n2;
        n += Math.abs(d2 - R2) < 1e-9 * Math.max(1, R2) ? 1 : d2 < R2 ? 2 : 0;
      }
      return n;
    };
    const ks = chislaMnozh(z.punkty[0].pole.verno, chislo);
    const kon = ks.flatMap((k) => [k.lo, k.hi]).filter((x) => Number.isFinite(x) && x > 0);
    const b = Math.max(...kon) * 2 + 1;
    sverMnozh(ok, 'd19', (a) => a > 0 && p.nado.includes(chislo19(a)), ks, 1e-4, b, b / 30000);
    for (const k of ks.filter((q) => q.lo === q.hi))
      ok(p.nado.includes(chislo19(k.lo)), 'd19: отдельная точка ответа');
  }

  function provD20(p, z) {
    const ryad = (D) => {
      const sh = p.s * D;
      let n = p.N0 - sh;
      const out = [n];
      for (let i = 1; i < p.M; i += 1) {
        n = n > sh ? n - sh : (n - sh) ** 2;
        out.push(n);
      }
      return out;
    };
    let estA = false;
    let estB = false;
    for (let D = 2; p.N0 - p.s * D > -1e6 && D < 2000; D += 1) {
      const r = ryad(D);
      if (r.includes(p.A)) estA = true;
      if (r.includes(p.B)) estB = true;
    }
    ok(estA === z.punkty[0].pole.verno, 'd20: а) перебором D');
    ok(estB === z.punkty[1].pole.verno, 'd20: б) перебором D');
    ok(new Set(ryad(p.Dv)).size === Number(z.punkty[2].pole.verno), 'd20: в) различных чисел');
  }

  return {
    'd14.pokazTrig': provD14,
    'd15.prizmaPyatiugolnik': provD15,
    'd16.logLog': provD16,
    'd17.katushka': provD17,
    'd18.parallelogrammBiss': provD18,
    'd19.paraPryamyh': provD19,
    'd20.ryadKvadrat': provD20,
  };
}
