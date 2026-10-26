/**
 * Проверки шаблонов части 2 вариантов 3–4 (b14–b20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs.
 *
 * Каждая проверка считает ответ заново, не трогая формул шаблона:
 * 14 — уравнение из текста условия, корни сменой знака и минимумами |f|;
 * 15 — координаты: объёмы по определителю, угол по нормалям;
 * 16 — неравенство из текста условия на сетке;
 * 17 — перебор R;
 * 18 — координаты: E по равенству углов, площади по формуле шнурка;
 * 19 — число корней уравнения по x для сетки a;
 * 20 — полный перебор покупок.
 */

/** TeX-выражение условия в функцию x: степени, \cdot, \sqrt, {,}. */
export function texFunkciya(tex) {
  let s = tex
    .replace(/\{,\}/g, '.')
    .replace(/\\cdot/g, '*')
    .replace(/\\left|\\right/g, '')
    .replace(/\\sqrt\{([^{}]*)\}/g, 'Math.sqrt($1)')
    .replace(/\s+/g, '');
  /* Степени: a^{…} → a**(…), x^3 → x**3. */
  s = s.replace(/\^\{/g, '**(').replace(/\^(\d)/g, '**$1');
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  /* Неявное умножение: 3x, 2(, )x, )( . */
  s = s
    .replace(/(\d)x/g, '$1*x')
    .replace(/(\d)\(/g, '$1*(')
    .replace(/\)x/g, ')*x')
    .replace(/\)\(/g, ')*(');
  /* Унарный минус перед степенью: -x**2 — в JS нужна скобка. */
  s = s.replace(/(^|[(+\-*])-x\*\*(\d)/g, '$1-(x**$2)');
  return new Function('x', `return ${s};`);
}

export function provB({ ok, close, requireSrc }) {
  const { validirovat } = requireSrc('lib/chertezh3');
  const { scenariyB15 } = requireSrc('lib/povyshennye/chast2/b15');

  function provB14(p, z) {
    /* Уравнение — из текста условия. */
    const m = z.uslovie.match(/Решите уравнение \$(.*)=0\$/);
    ok(m !== null, '№14: уравнение в условии');
    if (m === null) return;
    const f = texFunkciya(m[1]);
    /* Делим на B^{xⁿ}, чтобы числа были умеренными. */
    const h = (x) => f(x) / p.B ** (x ** p.n);
    const korni = [];
    const step = 1e-4;
    /* Диапазон, где степени ещё конечны в double. */
    const X = Math.min(6, (900 / Math.log2(p.B)) ** (1 / p.n));
    let prev = h(-X);
    for (let x = -X + step; x <= X; x += step) {
      const v = h(x);
      if (prev * v < 0) {
        let a = x - step;
        let b = x;
        for (let i = 0; i < 60; i += 1) {
          const c = (a + b) / 2;
          if (h(a) * h(c) <= 0) b = c;
          else a = c;
        }
        korni.push((a + b) / 2);
      }
      prev = v;
    }
    /* Двойные корни (касание): локальные минимумы |h|. */
    for (const x0 of z.kontrol.korni)
      if (!korni.some((x) => Math.abs(x - x0) < 1e-6) && Math.abs(h(x0)) < 1e-9) korni.push(x0);
    korni.sort((a, b) => a - b);
    ok(
      korni.length === z.kontrol.korni.length &&
        korni.every((x, i) => close(x, z.kontrol.korni[i], 1e-7)),
      '№14: корни уравнения из условия',
      `${korni} vs ${z.kontrol.korni}`,
    );
    const v = korni.filter((x) => x >= p.lo - 1e-12 && x <= p.hi + 1e-12);
    ok(
      v.length === z.kontrol.otbor.length && v.every((x, i) => close(x, z.kontrol.otbor[i], 1e-7)),
      '№14 б): отбор на отрезке',
    );
  }

  const sub3 = (a, b) => a.map((x, i) => x - b[i]);
  const crs = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const dot3 = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const obemTetr = (a, b, c, d) => Math.abs(dot3(sub3(b, a), crs(sub3(c, a), sub3(d, a)))) / 6;

  function provB15(p, z) {
    /* Основание: AB = BC = a, угол B по виду основания. */
    const ugolB = { prav: 60, pryam: 90, tupoy: 120 }[p.osn];
    const t = (ugolB * Math.PI) / 180;
    const B = [0, 0, 0];
    const A = [p.a, 0, 0];
    const C = [p.a * Math.cos(t), p.a * Math.sin(t), 0];
    const H = p.h;
    const up = (P, u) => [P[0], P[1], u];
    const V = obemTetr(A, B, C, up(A, H)) * 3;
    /* Часть с ребром AC: пирамида B·A C N' N = два тетраэдра. */
    const chast = (u) => obemTetr(B, A, C, up(C, u)) + obemTetr(B, A, up(C, u), up(A, u));
    const naiti = (f) => {
      let lo = 0;
      let hi = H;
      for (let i = 0; i < 100; i += 1) {
        const m = (lo + hi) / 2;
        if (chast(m) / V < f) lo = m;
        else hi = m;
      }
      return (lo + hi) / 2;
    };
    const fa = p.fa ? p.fa[0] / p.fa[1] : 0.5;
    const fb = p.fb ? p.fb[0] / p.fb[1] : 1 / 3;
    const u1 = naiti(fa);
    const u2 = naiti(fb);
    ok(close(u1, z.kontrol.an, 1e-9), '№15 а): AN по объёму', `${u1} vs ${z.kontrol.an}`);
    ok(close(u2, z.kontrol.ak, 1e-9), '№15 б): AK по объёму', `${u2} vs ${z.kontrol.ak}`);
    const m = z.uslovie.match(/AN:NA_1=(\d+):(\d+)/);
    ok(
      m !== null && close(Number(m[1]) / Number(m[2]), u1 / (H - u1), 1e-9),
      '№15 а): отношение в условии',
    );
    ok(z.uslovie.includes(`AB:AA_1=${p.a}:${p.h}`), '№15 б): AB : AA₁ в условии');
    /* Угол между плоскостями — по нормалям. */
    const n1 = crs(sub3(up(A, u1), B), sub3(up(C, u1), B));
    const n2 = crs(sub3(up(A, u2), B), sub3(up(C, u2), B));
    const cos = Math.abs(dot3(n1, n2)) / Math.sqrt(dot3(n1, n1) * dot3(n2, n2));
    ok(
      close(cos, z.kontrol.cos, 1e-9),
      '№15 б): косинус по нормалям',
      `${cos} vs ${z.kontrol.cos}`,
    );
    for (const punkt of ['a', 'b']) {
      const sc = scenariyB15(p, punkt);
      const zam = validirovat(sc, { uslovie: z.uslovie, otvet: '' });
      ok(zam.length === 0, `№15: чертёж пункта ${punkt} без замечаний`, zam.join('; '));
    }
  }

  function provB16(p, z) {
    const m = z.uslovie.match(/Решите неравенство \$(.*)\\(ge|le)(-?\d+)\$\./);
    ok(m !== null, '№16: неравенство в условии');
    if (m === null) return;
    /* log^k_{осн}(M−x²) → (Math.log(y)/Math.log(осн))**k. */
    let lev = m[1].replace(/\{,\}/g, '.');
    lev = lev.replace(
      /(\d*)\\log\^(\d)_\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\\left\((\d+)-x\^2\\right\)/g,
      (_s, k, st, osn, M) => {
        const o = osn
          .replace(/\\sqrt\[3\]\{(\d+)\}/, 'Math.cbrt($1)')
          .replace(/\\sqrt\{(\d+)\}/, 'Math.sqrt($1)');
        return `${k === '' ? '' : `${k}*`}(Math.log(${M}-x*x)/Math.log(${o}))**${st}`;
      },
    );
    const f = new Function('x', `return ${lev} - (${m[3]});`);
    const ge = m[2] === 'ge';
    const ks = [];
    for (let i = 0; i < z.kontrol.kuski.length; i += 4) {
      const [lo, hi, loZ, hiZ] = z.kontrol.kuski.slice(i, i + 4);
      ks.push({ lo, hi, loZ: loZ === 1, hiZ: hiZ === 1 });
    }
    const vnutri = (x) =>
      ks.some((q) => (x > q.lo && x < q.hi) || (q.loZ && x === q.lo) || (q.hiZ && x === q.hi));
    const M = p.M;
    const kray = Math.sqrt(M);
    const koncy = ks.flatMap((q) => [q.lo, q.hi]);
    let plokho = 0;
    let sravneno = 0;
    for (let x = -kray + 1e-4; x < kray; x += 1e-4) {
      if (koncy.some((c) => Math.abs(x - c) < 1e-6)) continue;
      const v = f(x);
      if (!Number.isFinite(v) || Math.abs(v) < 1e-9) continue;
      sravneno += 1;
      if ((ge ? v > 0 : v < 0) !== vnutri(x)) plokho += 1;
    }
    ok(sravneno > 1.9 * kray * 1e4 * 0.9, '№16: неравенство из условия считается', `${sravneno}`);
    ok(plokho === 0, '№16: ответ совпал с сеткой', `${plokho} точек`);
    /* Концы: ноль левой части или граница области определения. */
    for (const c of koncy) {
      const v = f(c);
      ok(
        Math.abs(Math.abs(c) - kray) < 1e-9 || Math.abs(v) < 1e-6,
        `№16: конец ${c} — ноль или граница ОДЗ`,
      );
    }
  }

  function provB17(p, z) {
    let best = 0;
    let arg = 0;
    for (let R = 0.001; R < 60; R += 0.001) {
      const P = (p.E / (p.r + R)) ** 2 * R;
      if (P > best) {
        best = P;
        arg = R;
      }
    }
    const nado = (p.vopros ?? 'R') === 'R' ? arg : best;
    ok(
      Math.abs(nado - z.kontrol.otvet) < 2e-3 * Math.max(1, nado),
      '№17: максимум перебором',
      `${nado} vs ${z.kontrol.otvet}`,
    );
  }

  /* ── 18 ── */
  const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const peres = (P1, P2, Q1, Q2) => {
    const d1 = sub2(P2, P1);
    const d2 = sub2(Q2, Q1);
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    const t = ((Q1[0] - P1[0]) * d2[1] - (Q1[1] - P1[1]) * d2[0]) / den;
    return [P1[0] + t * d1[0], P1[1] + t * d1[1]];
  };
  const pl = (...pts) =>
    Math.abs(
      pts.reduce(
        (s, P, i) => s + P[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * P[1],
        0,
      ),
    ) / 2;
  const ugol = (A, V, B) => {
    const u = sub2(A, V);
    const w = sub2(B, V);
    return Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(...u) / Math.hypot(...w));
  };

  function provB18(p, z) {
    const a = p.vid === 'tri' ? 1 : Math.sqrt(p.a2);
    const d = p.vid === 'tri' ? Math.sqrt(3) : Math.sqrt(p.d2);
    const A = [0, 0];
    const B = [0, a];
    const C = [d, a];
    const D = [d, 0];
    /* E на BC: ∠ADB = ∠BDE — бисекцией по абсциссе. */
    let lo = 0;
    let hi = d;
    for (let i = 0; i < 200; i += 1) {
      const xm = (lo + hi) / 2;
      if (ugol(B, D, [xm, a]) < ugol(A, D, B)) lo = xm;
      else hi = xm;
    }
    const E = [(lo + hi) / 2, a];
    if (p.vid === 'tri') {
      ok(
        Math.abs(ugol(E, D, C) - Math.PI / 6) < 1e-9,
        '№18: DB и DE делят угол ADC на три равные части',
      );
    }
    const O = peres(B, D, A, C);
    const N = peres(B, D, A, E);
    const P = peres(A, C, D, E);
    const m = z.uslovie.match(/BN:ND=(\d+):(\d+)/);
    ok(
      m !== null &&
        close(
          Number(m[1]) / Number(m[2]),
          Math.hypot(...sub2(N, B)) / Math.hypot(...sub2(D, N)),
          1e-9,
        ),
      '№18 а): BN : ND',
    );
    let otv;
    if (p.vopros === 'AEP_BD') otv = pl(A, N, O) / pl(N, E, P, O);
    else if (p.vopros === 'ONEC_DE') otv = pl(E, C, P) / pl(O, N, E, P);
    else if (p.vopros === 'BCD_AE') otv = pl(B, N, E) / pl(N, E, C, D);
    else otv = pl(O, N, E, C) / (a * d);
    ok(
      close(otv, z.kontrol.otvet, 1e-9),
      '№18 б): площади по координатам',
      `${otv} vs ${z.kontrol.otvet}`,
    );
    /* Точки на своих отрезках. */
    ok(
      N[0] > 0 && N[0] < O[0] && P[0] > O[0] && P[0] < d && E[0] > 0 && E[0] < d,
      '№18: точки N, P, E на отрезках',
    );
  }

  function provB19(p, z) {
    const { R, c, m } = p;
    const k = z.kontrol.k;
    /* Решения по x: смена знака и нули на границах. */
    const reshenij = (a) => {
      const F = (x) => Math.sqrt(Math.max(0, R * R - x ** 4)) + c - a * x * x + m * a;
      const X = Math.sqrt(R);
      const out = [];
      const N = 20000;
      let prev = F(-X);
      if (Math.abs(prev) < 1e-12) out.push(-X);
      for (let i = 1; i <= N; i += 1) {
        const x = -X + (2 * X * i) / N;
        const v = F(x);
        if (Math.abs(v) < 1e-12) out.push(x);
        else if (prev * v < 0 && Math.abs(prev) >= 1e-12) out.push(x);
        prev = v;
      }
      return out.length;
    };
    const ks = [];
    for (let i = 0; i < z.kontrol.kuski.length; i += 4) {
      const [lo, hi, loZ, hiZ] = z.kontrol.kuski.slice(i, i + 4);
      ks.push({ lo, hi, loZ: loZ === 1, hiZ: hiZ === 1 });
    }
    const vOtvete = (a) =>
      ks.some(
        (q) =>
          (a > q.lo && a < q.hi) ||
          (q.loZ && Math.abs(a - q.lo) < 1e-12) ||
          (q.hiZ && Math.abs(a - q.hi) < 1e-12),
      );
    const osobye = z.kontrol.osobye;
    const plokho = [];
    for (let a = -16; a <= 16; a += 0.0137) {
      if (osobye.some((o) => Math.abs(a - o) < 0.003)) continue;
      if ((reshenij(a) === k) !== vOtvete(a)) plokho.push(a.toFixed(3));
    }
    ok(
      plokho.length === 0,
      '№19: множество значений a совпало с подсчётом корней',
      plokho.slice(0, 5).join(', '),
    );
    /* Касание: в точке ответа прямая касается дуги — у квадратного
       уравнения по t нулевой дискриминант. */
    for (const q of ks)
      if (q.lo === q.hi) {
        const a = q.lo;
        const b = -a * m - c;
        const D = (2 * a * b) ** 2 - 4 * (1 + a * a) * (b * b - R * R);
        ok(Math.abs(D) < 1e-6, '№19: изолированная точка ответа — касание');
      }
  }

  function provB20(p, z) {
    const [c1, c2, c3, c4] = p.ceny;
    const mozhno = new Map();
    for (let a = 0; a * c1 <= p.M; a += 1)
      for (let b = 0; a * c1 + b * c2 <= p.M; b += 1)
        for (let c = 0; a * c1 + b * c2 + c * c3 <= p.M; c += 1)
          for (let d = 0; a * c1 + b * c2 + c * c3 + d * c4 <= p.M; d += 1) {
            const s = [a, b, c, d].sort((x, y) => y - x);
            if (s[0] - s[1] > 2 || s[1] - s[2] > 2 || s[2] - s[3] > 2) continue;
            const N = a + b + c + d;
            const cena = a * c1 + b * c2 + c * c3 + d * c4;
            const was = mozhno.get(N) ?? { min: Infinity, max: -Infinity };
            mozhno.set(N, { min: Math.min(was.min, cena), max: Math.max(was.max, cena) });
          }
    ok(mozhno.has(p.A), `№20 а): ${p.A} можно`);
    ok(!mozhno.has(p.B), `№20 б): ${p.B} нельзя`);
    let L;
    if (p.vid === 'max') L = Math.max(...mozhno.keys());
    else L = Math.min(...[...mozhno.entries()].filter(([, v]) => p.M - v.max < c1).map(([N]) => N));
    ok(L === z.kontrol.L, '№20 в): перебор', `${L} vs ${z.kontrol.L}`);
  }

  return {
    'b14.pokazStepen': provB14,
    'b15.prizmaPloskost': provB15,
    'b16.logBikvadrat': provB16,
    'b17.dzhoul': provB17,
    'b18.pryamougolnik': provB18,
    'b19.koren4': provB19,
    'b20.pokupka': provB20,
  };
}
