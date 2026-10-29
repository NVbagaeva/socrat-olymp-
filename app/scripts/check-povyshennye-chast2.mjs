#!/usr/bin/env node
/* scripts/check-povyshennye-chast2.mjs — часть 2 (задания 14–20)
   вариантов повышенной сложности.

   Запуск: pnpm test:povyshennye-chast2 [--json файл]

   Каждый ответ шаблона (он считается формулой) сверяется вторым,
   независимым способом:
     14 — значение исходного выражения из определений функций в точках
          серий и поиск нулей на отрезке перебором с шагом;
     15 — координаты: угол DK с основанием, SK : KC и расстояние между
          прямыми DK и BC по формуле смешанного произведения;
     16 — неравенство на сетке x ∈ [0; 60] с шагом 0,0005;
     17 — максимум A(τ) перебором при нескольких n;
     18 — пятиугольник строится численно (C — подбором касания),
          касание всех сторон, C, O, P на одной прямой, площадь по
          координатам;
     19 — для сетки значений a корни исходного уравнения ищутся
          численно; множество «ровно два корня» сравнивается с ответом;
     20 — полный перебор длин из секций.
   Плюс: версии различаются, баллы и плашки (склонение, сумма 33),
   ссылки на теоремы, чертежи движками без замечаний, формулы KaTeX.
   --json — числа версий для sympy (scripts/check_povyshennye_chast2.py). */

import fs from 'node:fs';
import { requireSrc } from './lib/load-ts.mjs';
import { provB } from './lib/prov-chast2-b.mjs';
import { provD } from './lib/prov-chast2-d.mjs';
import { provE } from './lib/prov-chast2-e.mjs';
import { provF } from './lib/prov-chast2-f.mjs';
import { provG } from './lib/prov-chast2-g.mjs';
import { provH } from './lib/prov-chast2-h.mjs';
import { provJ } from './lib/prov-chast2-j.mjs';

const { MAX_BALL, MAX_PART1, MAX_PART2, MAX_TOTAL, ballText } = requireSrc(
  'content/variantOnline/bally',
);
const { GOTOVY, S_CHAST2 } = requireSrc('lib/povyshennye/dannye/index');
const { zadacha2, SHABLONY_2 } = requireSrc('lib/povyshennye/chast2/index');
const { reshenieHtml, uslovieHtml, razborHtml, teoremaHtml, teoremyZadach } = requireSrc(
  'lib/povyshennye/chast2/html',
);
const { TEOREMY, ssylkiV, chertezhTeoremy } = requireSrc('lib/teoremy');
const { scenariy15 } = requireSrc('lib/povyshennye/chast2/z15');
const { chertezh18 } = requireSrc('lib/povyshennye/chast2/z18');
const { scenariyC15 } = requireSrc('lib/povyshennye/chast2/c15');
const { chertezhC18 } = requireSrc('lib/povyshennye/chast2/c18');
const { validirovat } = requireSrc('lib/chertezh3');
const { proverit } = requireSrc('lib/chast2/sravnenie');
const { kriteriiZadaniya } = requireSrc('content/variantOnline/kriterii');

let failures = 0;
let checks = 0;
function ok(cond, where, message = '') {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${where}${message ? `: ${message}` : ''}`);
  }
}
const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

/* ── Баллы и плашки ──────────────────────────────────────────── */
console.log('Баллы и плашки');
ok(MAX_PART1 === 13 && MAX_PART2 === 20 && MAX_TOTAL === 33, 'максимумы 13 + 20 = 33');
const max2 = { 14: 2, 15: 3, 16: 2, 17: 2, 18: 3, 19: 4, 20: 4 };
for (const [no, b] of Object.entries(max2)) ok(MAX_BALL[no] === b, `максимум №${no} = ${b}`);
const sklon = {
  1: '1 балл',
  2: '2 балла',
  3: '3 балла',
  4: '4 балла',
  5: '5 баллов',
  11: '11 баллов',
  20: '20 баллов',
  21: '21 балл',
  33: '33 балла',
};
for (const [n, t] of Object.entries(sklon))
  ok(ballText(Number(n)) === t, `«${t}»`, ballText(Number(n)));
for (const no of Object.keys(max2)) {
  const k = kriteriiZadaniya(Number(no));
  ok(
    k[0].ball === MAX_BALL[no] && k[k.length - 1].ball === 0,
    `критерии №${no}: от ${MAX_BALL[no]} до 0`,
  );
}

/* ── Независимые проверки по шаблонам ─────────────────────────── */

const A14 = {
  'c-': (x) => Math.SQRT2 * Math.cos(x - Math.PI / 2),
  'c+': (x) => Math.SQRT2 * Math.cos(x + Math.PI / 2),
  's+': (x) => Math.SQRT2 * Math.sin(x + Math.PI / 2),
  's-': (x) => Math.SQRT2 * Math.sin(x - Math.PI / 2),
  spi: (x) => Math.SQRT2 * Math.sin(Math.PI - x),
  cpi: (x) => Math.SQRT2 * Math.cos(Math.PI - x),
  c32: (x) => Math.SQRT2 * Math.cos((3 * Math.PI) / 2 - x),
  s32: (x) => Math.SQRT2 * Math.sin((3 * Math.PI) / 2 + x),
};
const B14 = {
  'c-4': (x) => Math.cos(x - Math.PI / 4),
  'c+4': (x) => Math.cos(x + Math.PI / 4),
  's+4': (x) => Math.sin(x + Math.PI / 4),
  's-4': (x) => Math.sin(x - Math.PI / 4),
};
const LOG14 = {
  2: [2, -0.5],
  4: [4, -0.25],
  '0,5': [0.5, 0.5],
  '0,25': [0.25, 0.25],
  r2: [Math.SQRT2, -1],
};

function prov14(p, z) {
  const [osn, prav] = LOG14[p.log];
  const arg = (x) => (p.za ?? 1) * A14[p.a](x) + p.z * B14[p.b](x);
  const f = (x) => Math.log(arg(x)) / Math.log(osn) - prav;
  for (const x0 of z.kontrol.serii)
    for (const n of [-3, 0, 2]) {
      const x = x0 + 2 * Math.PI * n;
      ok(arg(x) > 0 && Math.abs(f(x)) < 1e-9, `№14: x = ${x.toFixed(4)} — корень`);
    }
  /* Корни на отрезке: где аргумент равен 1/√2 (уравнение без логарифма). */
  const g = (x) => arg(x) - Math.SQRT1_2;
  const korni = [];
  const N = 60000;
  for (let i = 0; i <= N; i += 1) {
    const x = z.kontrol.lo + ((z.kontrol.hi - z.kontrol.lo) * i) / N;
    const xs = z.kontrol.lo + ((z.kontrol.hi - z.kontrol.lo) * (i + 1)) / N;
    if (Math.abs(g(x)) < 1e-9) korni.push(x);
    else if (i < N && g(x) * g(xs) < 0) {
      let a = x;
      let b = xs;
      for (let k = 0; k < 60; k += 1) {
        const m = (a + b) / 2;
        if (g(a) * g(m) <= 0) b = m;
        else a = m;
      }
      korni.push((a + b) / 2);
    }
  }
  /* Касание без смены знака: g достигает 0 в экстремуме — ищем минимумы |g|. */
  for (let i = 1; i < N; i += 1) {
    const h = (z.kontrol.hi - z.kontrol.lo) / N;
    const x = z.kontrol.lo + h * i;
    if (
      Math.abs(g(x)) < 1e-6 &&
      Math.abs(g(x)) <= Math.abs(g(x - h)) &&
      Math.abs(g(x)) <= Math.abs(g(x + h))
    )
      korni.push(x);
  }
  const ux = [...new Set(korni.map((x) => Math.round(x * 1e6) / 1e6))].sort((a, b) => a - b);
  const uniq = ux.filter((x, i) => i === 0 || x - ux[i - 1] > 1e-4);
  ok(uniq.length === 2, '№14: на отрезке ровно два корня', String(uniq.length));
  ok(
    uniq.length === z.kontrol.korni.length &&
      uniq.every((x, i) => close(x, z.kontrol.korni[i], 1e-5)),
    '№14: корни на отрезке совпали',
    `${uniq.map((x) => x.toFixed(5))} vs ${z.kontrol.korni.map((x) => x.toFixed(5))}`,
  );
}

const sub = (a, b) => a.map((x, i) => x - b[i]);
const crs = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const nrm = (a) => Math.sqrt(dot(a, a));

function prov15(p, z) {
  /* Ромб из условия заново: угол ABC = 120°, сторона √a2. */
  const a = Math.sqrt(p.a2);
  const B = [0, 0, 0];
  const A = [a, 0, 0];
  const C = [a * Math.cos((2 * Math.PI) / 3), a * Math.sin((2 * Math.PI) / 3), 0];
  const Dp = [A[0] + C[0] - B[0], A[1] + C[1] - B[1], 0];
  const O = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, 0];
  const h = z.kontrol.h;
  if (p.h2 !== undefined)
    ok(close(h * h, p.h2[0] / p.h2[1], 1e-12), '№15: высота из условия', `${h * h} vs ${p.h2}`);
  const S = [O[0], O[1], h];
  /* Точку K находим по углу (бисекция), а не по ответу шаблона. */
  const ugol = (t) => {
    const K = C.map((x, i) => x + t * (S[i] - x));
    const v = sub(K, Dp);
    return Math.atan2(v[2], Math.hypot(v[0], v[1]));
  };
  let lo = 1e-9;
  let hi = 1 - 1e-9;
  const phi = (p.phi * Math.PI) / 180;
  for (let k = 0; k < 80; k += 1) {
    const m = (lo + hi) / 2;
    if (ugol(m) < phi) lo = m;
    else hi = m;
  }
  const t = (lo + hi) / 2;
  ok(close(t, z.kontrol.k, 1e-7), '№15: CK/CS по углу', `${t} vs ${z.kontrol.k}`);
  const m = z.uslovie.match(/SK:KC=(\d+):(\d+)/);
  ok(
    m !== null && close(Number(m[1]) / Number(m[2]), (1 - t) / t, 1e-7),
    '№15 а): отношение из условия верно',
  );
  const K = C.map((x, i) => x + t * (S[i] - x));
  const u = sub(K, Dp);
  const v = sub(C, B);
  const nn = crs(u, v);
  const d = Math.abs(dot(sub(B, Dp), nn)) / nrm(nn);
  ok(close(d, z.kontrol.otvet, 1e-7), '№15 б): расстояние', `${d} vs ${z.kontrol.otvet}`);
  ok(nrm(nn) > 1e-6, '№15: прямые не параллельны (скрещиваются)');
  /* Чертежи — движком, сценарий без ошибок. */
  for (const punkt of ['a', 'b']) {
    const sc = scenariy15(p, punkt);
    const pr = validirovat(sc);
    const oshibki = Array.isArray(pr) ? pr : (pr?.oshibki ?? pr?.problems ?? []);
    ok(
      oshibki.length === 0,
      `№15: чертёж пункта ${punkt} без замечаний`,
      JSON.stringify(oshibki).slice(0, 200),
    );
  }
}

function prov16(p, z) {
  const alpha = p.alpha ?? 1;
  const gamma = p.gamma ?? 0;
  const k = p.q ** (alpha - gamma);
  const t = k * p.q ** p.e - p.y1 * p.y2;
  const ge = (p.znak ?? 'ge') === 'ge';
  const f = (x) =>
    (p.q ** (2 * x + alpha) + x - (p.y1 + p.y2) * Math.sqrt(x) - t) /
      (p.q ** (2 * x + gamma) - p.q ** p.e) -
    k;
  /* Условие задачи в тексте — то же неравенство. */
  ok(z.uslovie.includes(ge ? '\\ge' : '\\le'), '№16: знак неравенства в условии');
  ok(z.uslovie.includes(`\\sqrt x-${t}`), '№16: свободный член в условии', `${t}`);
  const { a, x0, b } = z.kontrol;
  const ks = [];
  for (let i = 0; i < z.kontrol.kuski.length; i += 4) {
    const [lo, hi, loZ, hiZ] = z.kontrol.kuski.slice(i, i + 4);
    ks.push({ lo, hi, loZ: loZ === 1, hiZ: hiZ === 1 });
  }
  const vnutri = (x) =>
    ks.some((q) => (x > q.lo && x < q.hi) || (q.loZ && x === q.lo) || (q.hiZ && x === q.hi));
  /* Сетка на [0; max(12, y₂² + 3)]. Дробь при больших x отличается от k
     на 1e-9…1e-12 — это настоящая величина, погрешность счёта на порядки
     меньше; точки, где |f| < 1e-13, не сравниваются — там знак сверяет
     сетка mpmath с 60 знаками (check_povyshennye_chast2.py). */
  let plokho = 0;
  const kray = Math.max(12, b + 3);
  for (let i = 0; i * 0.0005 <= kray; i += 1) {
    const x = i * 0.0005;
    const v = f(x);
    if (!Number.isFinite(v) || Math.abs(x - x0) < 1e-9) continue;
    if (Math.abs(x - a) < 1e-9 || Math.abs(x - b) < 1e-9) {
      if (Math.abs(v) > 1e-6) plokho += 1;
      if (!vnutri(x)) plokho += 1;
      continue;
    }
    if (Math.abs(v) < 1e-13) continue;
    if ((ge ? v > 0 : v < 0) !== vnutri(x)) {
      plokho += 1;
      if (plokho < 4) console.error(`    №16: x = ${x}, f = ${v}`);
    }
  }
  ok(plokho === 0, '№16: ответ совпал с сеткой', `${plokho} точек`);
  ok(!vnutri(x0), '№16: точка разрыва не в ответе');
  ok(ks.length >= 2, '№16: в ответе не меньше двух кусков');
}

function prov17(p, z) {
  const T = z.kontrol.T;
  for (const n of [0.05, 0.2, 0.35, 0.49]) {
    const A = (t) => (t * t) / Math.sqrt((T * T - t * t) ** 2 + n * t * t * T * T);
    let best = 0;
    let bt = 0;
    for (let t = 0.001; t < 5 * T; t += 0.0005) {
      const v = A(t);
      if (v > best) {
        best = v;
        bt = t;
      }
    }
    ok(Math.abs(bt - T * Math.sqrt(2 / (2 - n))) < 2e-3, `№17: максимум при n = ${n}`, `${bt}`);
  }
  const verno = z.punkty[0].pole;
  ok(
    proverit(verno, `${String(T).replace('.', ',')}*sqrt(2/(2-n))`) === 'sovpadaet',
    '№17: автопроверка принимает ответ',
  );
}

function prov18(p, z) {
  const { e, b, l } = p;
  const d = b - e;
  const h = Math.sqrt(l * l - d * d);
  const A = [-e, 0];
  const E = [e, 0];
  const B = [-b, h];
  const D = [b, h];
  /* Окружность касается AE, AB и DE: центр на оси, r подбираем. */
  const distLine = (P, Q, X) =>
    Math.abs((Q[0] - P[0]) * (X[1] - P[1]) - (Q[1] - P[1]) * (X[0] - P[0])) /
    Math.hypot(Q[0] - P[0], Q[1] - P[1]);
  let lo = 0;
  let hi = h;
  for (let k = 0; k < 100; k += 1) {
    const r = (lo + hi) / 2;
    if (distLine(A, B, [0, r]) > r) lo = r;
    else hi = r;
  }
  const r = (lo + hi) / 2;
  ok(close(r, z.kontrol.r, 1e-9), '№18: радиус', `${r} vs ${z.kontrol.r}`);
  ok(r < h, '№18: центр внутри трапеции');
  /* C на оси выше BD: BC касается окружности. */
  let c1 = h + 1e-6;
  let c2 = h + 1000;
  for (let k = 0; k < 200; k += 1) {
    const c = (c1 + c2) / 2;
    /* Пока C низко, прямая BC проходит ближе r к центру — поднимаем C. */
    if (distLine(B, [0, c], [0, r]) < r) c1 = c;
    else c2 = c;
  }
  const C = [0, (c1 + c2) / 2];
  const P = [A, B, C, D, E];
  for (let i = 0; i < 5; i += 1) {
    const X = P[i];
    const Y = P[(i + 1) % 5];
    ok(
      Math.abs(distLine(X, Y, [0, r]) - r) < 1e-7,
      `№18: касание стороны ${'ABCDE'[i]}${'ABCDE'[(i + 1) % 5]}`,
    );
    /* Точка касания — внутри стороны. */
    const t =
      ((0 - X[0]) * (Y[0] - X[0]) + (r - X[1]) * (Y[1] - X[1])) /
      ((Y[0] - X[0]) ** 2 + (Y[1] - X[1]) ** 2);
    ok(
      t > 1e-6 && t < 1 - 1e-6,
      `№18: касание внутри стороны ${'ABCDE'[i]}${'ABCDE'[(i + 1) % 5]}`,
    );
  }
  let S = 0;
  for (let i = 0; i < 5; i += 1) S += P[i][0] * P[(i + 1) % 5][1] - P[(i + 1) % 5][0] * P[i][1];
  S = Math.abs(S) / 2;
  ok(close(S, z.kontrol.S, 1e-7), '№18 б): площадь по координатам', `${S} vs ${z.kontrol.S}`);
  ok(Math.abs(C[0]) < 1e-12, '№18 а): C, O, P на одной прямой');
  /* Выпуклость: все повороты одного знака. */
  const zn = P.map((X, i) => {
    const Y = P[(i + 1) % 5];
    const Z = P[(i + 2) % 5];
    return Math.sign((Y[0] - X[0]) * (Z[1] - Y[1]) - (Y[1] - X[1]) * (Z[0] - Y[0]));
  });
  ok(
    zn.every((s) => s === zn[0]),
    '№18: пятиугольник выпуклый',
  );
  for (const punkt of ['a', 'b']) {
    const svg = chertezh18(p, punkt);
    ok(svg.startsWith('<svg') && !svg.includes('NaN'), `№18: чертёж пункта ${punkt}`);
  }
}

function prov19z(p, z) {
  /* Зеркальный вид: корни исходного уравнения при x ≤ a, |x| > |a|,
     сменой знака левой минус правой части; ответ — «ровно один корень». */
  const { m, b } = p;
  const F = (a, x) => {
    const u = a - x;
    const L = Math.log(x * x - a * a) / Math.log(b);
    return u ** 1.5 + m * x - (x + u ** 1.5 / m) * L - m * a + a * L;
  };
  const korni = (a) => {
    const lo = -Math.sqrt(a * a + 4 * b ** m) - 20;
    const hi = a;
    const K = 60000;
    const out = [];
    let prev = null;
    for (let i = 1; i < K; i += 1) {
      const x = lo + ((hi - lo) * i) / K;
      if (Math.abs(x) <= Math.abs(a)) {
        prev = null;
        continue;
      }
      const v = F(a, x);
      if (!Number.isFinite(v)) continue;
      if (Math.abs(v) < 1e-12) out.push(x);
      else if (prev !== null && prev.v * v < 0) out.push(x);
      prev = { x, v };
    }
    const N = b ** m;
    for (const x of [a - m * m, -Math.sqrt(a * a + N)])
      if (
        x <= a &&
        Math.abs(x) > Math.abs(a) + 1e-9 &&
        Math.abs(F(a, x)) < 1e-8 &&
        !out.some((y) => Math.abs(y - x) < 1e-3)
      )
        out.push(x);
    const s = out.sort((x, y) => x - y);
    return s.filter((x, i) => i === 0 || x - s[i - 1] > 1e-3).length;
  };
  const { granica, tochka } = z.kontrol;
  const vOtvete = (a) => a >= granica - 1e-12 || Math.abs(a - tochka) < 1e-12;
  const plokho = [];
  for (let a = -14; a <= 14; a += 0.0173) {
    if (Math.abs(a - granica) < 0.01 || Math.abs(a - tochka) < 0.01) continue;
    if ((korni(a) === 1) !== vOtvete(a)) plokho.push(a.toFixed(3));
  }
  for (const a of [granica, tochka]) if (korni(a) !== 1) plokho.push(`граница ${a}`);
  if (korni(granica - 1e-4) === 1) plokho.push('левее границы — один корень');
  ok(
    plokho.length === 0,
    '№19: множество «ровно один корень» совпало',
    plokho.slice(0, 5).join(', '),
  );
}

function prov19(p, z) {
  if (p.zerk === true) return prov19z(p, z);
  const { m, b, c } = p;
  const N = b ** c;
  const F = (a, x) => {
    const u = x - a;
    const L = Math.log(a * a - x * x) / Math.log(b);
    return (a + u ** 1.5 / m) * L + c * x - (c / m) * u ** 1.5 - c * a - x * L;
  };
  /* Корни на (a; −a): нули F (смена знака) и касания не встречаются —
     все корни простые; совпадающие корни считаются один раз. */
  const korni = (a) => {
    if (a >= 0) return 0;
    const lo = a;
    const hi = -a;
    const K = 40000;
    const out = [];
    let prev = null;
    for (let i = 1; i < K; i += 1) {
      const x = lo + ((hi - lo) * i) / K;
      const v = F(a, x);
      if (!Number.isFinite(v)) continue;
      if (Math.abs(v) < 1e-12) out.push(x);
      else if (prev !== null && prev.v * v < 0) out.push(x);
      prev = { x, v };
    }
    /* Корни, у которых F не меняет знак (совпадение двух корней), ищем
       по формулам множителей и проверяем подстановкой. */
    const kand = [a + m * m, Math.sqrt(Math.max(0, a * a - N)), -Math.sqrt(Math.max(0, a * a - N))];
    for (const x of kand)
      if (x > a && x < -a && Math.abs(F(a, x)) < 1e-8 && !out.some((y) => Math.abs(y - x) < 1e-3))
        out.push(x);
    const s = out.sort((x, y) => x - y);
    return s.filter((x, i) => i === 0 || x - s[i - 1] > 1e-3).length;
  };
  const { levyy, pravyy, tochka } = z.kontrol;
  const vOtvete = (a) => (a >= levyy - 1e-12 && a < pravyy) || Math.abs(a - tochka) < 1e-12;
  let plokho = [];
  for (let a = -14; a <= 3; a += 0.0173) {
    if (Math.abs(a - levyy) < 0.01 || Math.abs(a - pravyy) < 0.01 || Math.abs(a - tochka) < 0.01)
      continue;
    if ((korni(a) === 2) !== vOtvete(a)) plokho.push(a.toFixed(3));
  }
  for (const a of [levyy, tochka, pravyy - 1e-6]) if (korni(a) !== 2) plokho.push(`граница ${a}`);
  if (korni(pravyy) === 2) plokho.push(`−√N входит`);
  ok(
    plokho.length === 0,
    '№19: множество «ровно два корня» совпало',
    plokho.slice(0, 5).join(', '),
  );
}

function prov20(p, z) {
  const q = p.q ?? p.p + 20;
  const maxLen = 3000;
  const can = new Set();
  /* Полный перебор: число секций и нахлёстов каждого вида. */
  for (let k = 1; k * (p.S - q) <= maxLen + p.S; k += 1)
    for (let a = 0; a <= k - 1; a += 1) can.add(k * p.S - a * q - (k - 1 - a) * p.p);
  ok(can.has(p.A), `№20 а): ${p.A} собирается`);
  ok(!can.has(p.B), `№20 б): ${p.B} не собирается`);
  let L = null;
  for (let len = 10; len <= 2000; len += 10) {
    let all = true;
    for (let t = len; t <= maxLen - 200; t += 10) if (!can.has(t)) all = false;
    if (all) {
      L = len;
      break;
    }
  }
  ok(L === z.kontrol.L, '№20 в): наименьшая L', `${L} vs ${z.kontrol.L}`);
}

/* ── Семья C (варианты 5, 6) ───────────────────────────────────── */

/** Нули функции на [lo; hi]: смена знака + бисекция. */
function nuli(f, lo, hi, N = 60000) {
  const out = [];
  let px = lo;
  let pv = f(lo);
  for (let i = 1; i <= N; i += 1) {
    const x = lo + ((hi - lo) * i) / N;
    const v = f(x);
    if (Math.abs(v) < 1e-13) out.push(x);
    else if (pv * v < 0) {
      let a = px;
      let b = x;
      for (let k = 0; k < 70; k += 1) {
        const m = (a + b) / 2;
        if (f(a) * f(m) <= 0) b = m;
        else a = m;
      }
      out.push((a + b) / 2);
    }
    px = x;
    pv = v;
  }
  const s = out.sort((a, b) => a - b);
  return s.filter((x, i) => i === 0 || x - s[i - 1] > 1e-6);
}

function provC14(p, z) {
  const f = (x) => p.a * Math.sin(2 * x) + p.b * Math.cos(2 * x) - p.c;
  /* Серии: arctg t + πn — корни при разных n. */
  for (const t of z.kontrol.t)
    for (const n of [-4, 0, 3]) {
      const x = Math.atan(t) + Math.PI * n;
      ok(Math.abs(f(x)) < 1e-9, `№14: x = ${x.toFixed(4)} — корень`);
    }
  /* Других корней нет: на периоде π ровно два нуля. */
  ok(nuli(f, 0.001, Math.PI + 0.001).length === 2, '№14: на периоде два корня');
  const kor = nuli(f, z.kontrol.lo, z.kontrol.hi);
  ok(
    kor.length === 2 && kor.every((x, i) => close(x, z.kontrol.korni[i], 1e-7)),
    '№14: корни на отрезке совпали',
    `${kor} vs ${z.kontrol.korni}`,
  );
}

function provC15(p, z) {
  const m = Math.sqrt(p.ac2) / 2;
  const bm = Math.sqrt(p.l2 - m * m);
  const A = [-m, 0, 0];
  const B = [0, -bm, 0];
  const C = [m, 0, 0];
  const h = Math.sqrt(p.h2[0] / p.h2[1]);
  /* tg из условия — разбором текста не берём: считаем по данным шаблона
     и проверяем, что H по нему восстанавливается однозначно. */
  const tgM = z.uslovie.match(/равен \$([^$]+)\$/);
  ok(tgM !== null, '№15: тангенс в условии');
  const d = z.kontrol.d;
  /* H внутри угла ABC на расстоянии d от прямых AB и BC: пересечение
     прямых, параллельных AB и BC и сдвинутых внутрь угла. */
  const sdvig = (P, Q, X) => {
    /* Единичная нормаль к PQ в сторону точки X. */
    const v = [Q[0] - P[0], Q[1] - P[1]];
    let nn = [-v[1], v[0]];
    const L = Math.hypot(...nn);
    nn = [nn[0] / L, nn[1] / L];
    if ((X[0] - P[0]) * nn[0] + (X[1] - P[1]) * nn[1] < 0) nn = [-nn[0], -nn[1]];
    return { P: [P[0] + d * nn[0], P[1] + d * nn[1]], v };
  };
  const l1 = sdvig(B, A, C);
  const l2 = sdvig(B, C, A);
  const det = l1.v[0] * -l2.v[1] - l1.v[1] * -l2.v[0];
  const rx = l2.P[0] - l1.P[0];
  const ry = l2.P[1] - l1.P[1];
  const s = (rx * -l2.v[1] - ry * -l2.v[0]) / det;
  const H = [l1.P[0] + s * l1.v[0], l1.P[1] + s * l1.v[1], 0];
  const S = [H[0], H[1], h];
  /* Тангенс двугранного угла при AB — по нормалям плоскостей. */
  const tgDv = (P, Q, R) => {
    const nn = crs(sub(Q, P), sub(R, P));
    const cos = Math.abs(nn[2]) / nrm(nn);
    return Math.sqrt(1 - cos * cos) / cos;
  };
  ok(close(tgDv(S, A, B), tgDv(S, B, C), 1e-9), '№15: углы при AB и BC равны');
  ok(close(tgDv(S, A, B), h / d, 1e-9), '№15: тангенс из условия');
  /* Центр сферы: точка, равноудалённая от S, A, B, C (линейная система). */
  const rows = [B, C, S].map((X) => [
    2 * (X[0] - A[0]),
    2 * (X[1] - A[1]),
    2 * (X[2] - A[2]),
    dot(X, X) - dot(A, A),
  ]);
  const det3 = (M) =>
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const M0 = rows.map((r) => r.slice(0, 3));
  const D0 = det3(M0);
  const O = [0, 1, 2].map(
    (j) => det3(M0.map((r, i) => r.map((x, c) => (c === j ? rows[i][3] : x)))) / D0,
  );
  ok(Math.hypot(O[0] - H[0], O[1] - H[1]) < 1e-9, '№15 а): центр сферы на прямой SH');
  ok(O[2] < h, '№15 а): центр сферы на луче SH');
  ok(
    close(tgDv(S, A, C), z.kontrol.otvet, 1e-9),
    '№15 б): тангенс',
    `${tgDv(S, A, C)} vs ${z.kontrol.otvet}`,
  );
  for (const punkt of ['a', 'b']) {
    const pr = validirovat(scenariyC15(p, punkt));
    const oshibki = Array.isArray(pr) ? pr : (pr?.oshibki ?? pr?.problems ?? []);
    ok(
      oshibki.length === 0,
      `№15: чертёж пункта ${punkt} без замечаний`,
      JSON.stringify(oshibki).slice(0, 200),
    );
  }
}

const OSN16 = { '0,5': 0.5, '0,25': 0.25, '0,2': 0.2, '0,1': 0.1, '0,04': 0.04 };
const chislo16 = (s) => OSN16[s] ?? Number(s);

function provC16(p, z) {
  const P = chislo16(p.p);
  const R = chislo16(p.r);
  const b = chislo16(p.b);
  const c = p.c[0] / p.c[1];
  const f = (x) => {
    const W = p.k * x - p.s;
    if (W <= 0) return NaN;
    const L = p.zE * W;
    const E = P ** L - R ** L;
    const lg = Math.log(W) / Math.log(b);
    const G = (p.forma === 'minus' ? 1 : -1) * (lg * lg - c * c);
    return p.logNum ? G / E : E / G;
  };
  ok(z.uslovie.includes(p.znak === 'ge' ? '\\ge' : '\\le'), '№16: знак неравенства в условии');
  const ks = [];
  for (let i = 0; i < z.kontrol.kuski.length; i += 4) {
    const [lo, hi, loZ, hiZ] = z.kontrol.kuski.slice(i, i + 4);
    ks.push({ lo, hi, loZ: loZ === 1, hiZ: hiZ === 1 });
  }
  const vnutri = (x) =>
    ks.some(
      (q) =>
        (x > q.lo + 1e-12 && x < q.hi - 1e-12) ||
        (q.loZ && Math.abs(x - q.lo) < 1e-12) ||
        (q.hiZ && Math.abs(x - q.hi) < 1e-12),
    );
  /* Сетка вокруг области: шаг 0,0002 рядом с концами, 0,01 дальше. */
  const x0 = z.kontrol.x0;
  const kray = ks.flatMap((q) => [q.lo, q.hi]).filter((x) => Math.abs(x) < 1e8);
  const lo = Math.min(...kray, x0) - 5;
  const hi = Math.max(...kray, x0) + 5;
  let plokho = 0;
  const tochki = [];
  for (let x = lo; x <= hi; x += 0.01) tochki.push(x);
  for (const e of kray) for (let i = -200; i <= 200; i += 1) tochki.push(e + i * 0.0002);
  for (const x of tochki) {
    if (kray.some((e) => Math.abs(x - e) < 1e-9)) continue;
    const v = f(x);
    const verno = Number.isFinite(v) && (p.znak === 'ge' ? v >= 0 : v <= 0);
    if (verno !== vnutri(x)) {
      plokho += 1;
      if (plokho < 4) console.error(`    №16C: x = ${x}, f = ${v}`);
    }
  }
  ok(plokho === 0, '№16: ответ совпал с сеткой', `${plokho} точек`);
  /* Концы: закрытые — нули числителя, открытые — вне области или нули знаменателя. */
  for (const q of ks)
    for (const [x, zakr] of [
      [q.lo, q.loZ],
      [q.hi, q.hiZ],
    ]) {
      if (Math.abs(x) > 1e8) continue;
      const v = f(x);
      ok(
        zakr ? Math.abs(v) < 1e-9 : !Number.isFinite(v) || Math.abs(v) > 1e6,
        `№16: конец ${x} ${zakr ? 'входит' : 'не входит'}`,
        String(v),
      );
    }
  ok(ks.length === 2, '№16: два промежутка');
}

const GAZ17 = [28, 4, 40, 20, 16, 44, 2];

function provC17(p, z) {
  const M = GAZ17[p.gaz] / 1000;
  for (const R of [8.31, 8.314, 8.5]) {
    const T = p.T;
    const f = (v) =>
      4 *
      Math.PI *
      v *
      v *
      (M / (2 * Math.PI * R * T)) ** 1.5 *
      Math.exp((-M * v * v) / (2 * R * T));
    /* Перебор с уточнением. */
    let best = 0;
    for (let v = 1; v < 10000; v += 1) if (f(v) > f(best)) best = v;
    let a = best - 1;
    let b = best + 1;
    for (let k = 0; k < 200; k += 1) {
      const m1 = a + (b - a) / 3;
      const m2 = b - (b - a) / 3;
      if (f(m1) < f(m2)) a = m1;
      else b = m2;
    }
    ok(Math.abs((a + b) / 2 - Math.sqrt(z.kontrol.K * R)) < 1e-4, `№17: максимум при R = ${R}`);
  }
  const pole = z.punkty[0].pole;
  ok(
    proverit(pole, `\\sqrt{\\frac{2\\cdot${p.T}R}{${M}}}`) === 'sovpadaet',
    '№17: ответ = √(2RT/M)',
  );
}

function provC18(p, z) {
  const a = p.AD / 2;
  const b = p.BC / 2;
  const h = Math.sqrt(p.AB * p.AB - (a - b) ** 2);
  const A = [-a, 0];
  const D = [a, 0];
  const B = [-b, h];
  const C = [b, h];
  const K = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const M = [(C[0] + D[0]) / 2, (C[1] + D[1]) / 2];
  const okr = (P, Q, X) => {
    const d = 2 * (P[0] * (Q[1] - X[1]) + Q[0] * (X[1] - P[1]) + X[0] * (P[1] - Q[1]));
    const sq = (T) => T[0] * T[0] + T[1] * T[1];
    const ux = (sq(P) * (Q[1] - X[1]) + sq(Q) * (X[1] - P[1]) + sq(X) * (P[1] - Q[1])) / d;
    const uy = (sq(P) * (X[0] - Q[0]) + sq(Q) * (P[0] - X[0]) + sq(X) * (Q[0] - P[0])) / d;
    return { c: [ux, uy], r: Math.hypot(P[0] - ux, P[1] - uy) };
  };
  const [P1, P2, P3, P4] = p.vid === 'AKMD' ? [A, K, M, D] : [K, B, C, M];
  const o = okr(P1, P2, P3);
  ok(
    Math.abs(Math.hypot(P4[0] - o.c[0], P4[1] - o.c[1]) - o.r) < 1e-9,
    '№18: четвёртая вершина на окружности',
  );
  ok(close(o.r, z.kontrol.R, 1e-9), '№18 б): радиус', `${o.r} vs ${z.kontrol.R}`);
  for (const punkt of ['a', 'b']) {
    const svg = chertezhC18(p, punkt);
    ok(svg.startsWith('<svg') && !svg.includes('NaN'), `№18: чертёж пункта ${punkt}`);
  }
}

/* а) №18 для всех трапеций: перебор форм с центром вне трапеции. */
function proverkaUtverzhdeniyaC18() {
  let plokho = 0;
  let vsego = 0;
  for (let a = 1; a <= 12; a += 0.5)
    for (let b = 0.25; b < a; b += 0.25)
      for (let h = 0.1; h < 12; h += 0.1) {
        const vne = (u, w, t) => (w * w + t * t - u * u) / (2 * t) < 0;
        if (!vne(a, b, h)) continue;
        vsego += 1;
        if (!vne(a, (a + b) / 2, h / 2)) plokho += 1;
        if (!vne((a + b) / 2, b, h / 2)) plokho += 1;
      }
  ok(
    vsego > 1000 && plokho === 0,
    '№18 а): утверждение верно на переборе трапеций',
    `${plokho} из ${vsego}`,
  );
}

function provC19(p, z) {
  const { k } = p;
  const pp = p.p;
  /* Левая минус правая часть исходного уравнения. */
  const g =
    p.vid === 'shest'
      ? (x, a) => Math.abs(x) * (k * x * x + (k + pp) * a) - x * x * (a + k * pp) - a * a
      : (x, a) => x * x * (a + k * pp) - Math.abs(x) * (k * x * x - (k - pp) * a) - a * a;
  const chislo = (a) => {
    const X = 4 * (Math.abs(a) + pp + k + 2);
    const pos = nuli((x) => g(x, a), 1e-9, X, 40000).length;
    const nol = Math.abs(g(0, a)) < 1e-12 ? 1 : 0;
    return 2 * pos + nol;
  };
  const ks = [];
  for (let i = 0; i < z.kontrol.kuski.length; i += 4) {
    const [lo, hi, loZ, hiZ] = z.kontrol.kuski.slice(i, i + 4);
    ks.push({ lo, hi, loZ: loZ === 1, hiZ: hiZ === 1 });
  }
  const vOtvete = (a) =>
    ks.some((q) => (a > q.lo && a < q.hi) || (q.loZ && a === q.lo) || (q.hiZ && a === q.hi));
  const krit = [0, z.kontrol.aStar, z.kontrol.gran];
  const plokho = [];
  for (let a = -6.03; a <= Math.max(25, z.kontrol.aStar + 5); a += 0.0731) {
    if (krit.some((c) => Math.abs(a - c) < 0.02)) continue;
    if ((chislo(a) === z.kontrol.N) !== vOtvete(a)) plokho.push(a.toFixed(3));
  }
  ok(
    plokho.length === 0,
    `№19: множество «ровно ${z.kontrol.N} корней» совпало`,
    plokho.slice(0, 5).join(', '),
  );
  ok(
    !vOtvete(z.kontrol.aStar) && !vOtvete(0) && !vOtvete(z.kontrol.gran),
    '№19: критические точки не в ответе',
  );
}

function provC20(p, z) {
  const Lo = 10 ** (p.razr - 1);
  const U = 10 ** p.razr - 1;
  const { r } = p;
  /* а) и б): перебор начал n, m (удвоенные средние — целые). */
  const ravny = (k) => {
    for (let m = Lo; m + r * k - 1 <= U; m += 1) {
      /* 2Q₁ = 2n + k − 1 = 2m + rk − 1. */
      const n2 = 2 * m + r * k - k;
      if (n2 % 2 === 0 && n2 / 2 >= Lo && n2 / 2 + k - 1 <= U) return true;
    }
    return false;
  };
  ok(ravny(p.ka), `№20 а): при k = ${p.ka} средние равны`);
  ok(!ravny(p.kb), `№20 б): при k = ${p.kb} — нет`);
  /* в): для каждого k и n — крайние допустимые m (модуль разности линеен по m). */
  const kMax = p.razr === 5 ? p.k0 + 200 : Math.floor((U - Lo + 1) / (r + 1));
  let best = p.rezhim === 'min' ? Infinity : -Infinity;
  for (let k = p.k0; k <= kMax; k += 1)
    for (let n = Lo; n + k - 1 <= U; n += 1) {
      const kand = [Lo, n - r * k, n + k, U - r * k + 1].filter(
        (m) => m >= Lo && m + r * k - 1 <= U && (m + r * k - 1 < n || m > n + k - 1),
      );
      for (const m of kand) {
        const q1 = n + (k - 1) / 2;
        const q2 = m + (r * k - 1) / 2;
        const vse = (k * q1 + r * k * q2) / ((r + 1) * k);
        const v = Math.abs((q1 + q2) / 2 - vse);
        best = p.rezhim === 'min' ? Math.min(best, v) : Math.max(best, v);
      }
    }
  ok(close(best, z.kontrol.otv, 1e-9), `№20 в): ${p.rezhim}`, `${best} vs ${z.kontrol.otv}`);
}

const PROV = {
  ...provB({ ok, close, requireSrc }),
  ...provD({ ok, close, requireSrc }),
  ...provE({ ok, close, requireSrc }),
  ...provF({ ok, close, requireSrc }),
  ...provG({ ok, close, requireSrc }),
  ...provH({ ok, close, requireSrc }),
  ...provJ({ ok, close, requireSrc }),
  'z14.logTrig': prov14,
  'z15.rombPiramida': prov15,
  'z16.pokazKoren': prov16,
  'z17.kachka': prov17,
  'z18.pyatiugolnik': prov18,
  'z19.logKoren': prov19,
  'z20.zabor': prov20,
  'c14.tgPodstanovka': provC14,
  'c15.sferaPiramida': provC15,
  'c16.pokazLog': provC16,
  'c17.maksvell': provC17,
  'c18.trapeciyaSrednyaya': provC18,
  'c19.modul': provC19,
  'c20.srednie': provC20,
};
proverkaUtverzhdeniyaC18();

/* ── Варианты ─────────────────────────────────────────────────── */
const json = [];
for (const k of S_CHAST2) {
  ok(GOTOVY.includes(k), `вариант ${k} с частью 2 есть в GOTOVY`);
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`);
  const versii = VARIANT.chast2 ?? [];
  console.log(`Вариант ${k}: ${versii.length} версий`);
  ok(versii.length === 6, `вариант ${k}: 6 версий части 2`);
  /* Версии различаются: ни одна задача не повторяет параметры другой версии. */
  for (let j = 0; j < 7; j += 1) {
    const ps = versii.map((v) => JSON.stringify(v[j]?.p));
    ok(new Set(ps).size === ps.length, `вариант ${k}, №${14 + j}: версии различаются`);
  }
  versii.forEach((zapisi, vi) => {
    const kv = `${k}.${vi + 1}`;
    ok(zapisi.length === 7, `${kv}: семь задач`);
    const zadachi = [];
    zapisi.forEach((zp, j) => {
      let z;
      try {
        z = zadacha2(zp);
      } catch (err) {
        ok(false, `${kv} №${14 + j}: шаблон собрался`, String(err));
        return;
      }
      zadachi.push(z);
      ok(z.no === 14 + j, `${kv}: №${14 + j} на своём месте`);
      ok(SHABLONY_2[zp.s].no === z.no, `${kv}: шаблон ${zp.s} — для №${z.no}`);
      ok(PROV[zp.s] !== undefined, `${kv}: проверка вторым способом для ${zp.s}`);
      PROV[zp.s]?.(zp.p, z);
      /* Решение по этапам, разбор по шагам, формулы набираются. */
      ok(z.reshenie.length >= 3, `${kv} №${z.no}: решение по этапам`);
      ok(z.razbor.length >= 3, `${kv} №${z.no}: разбор по шагам`);
      for (const html of [uslovieHtml(z.uslovie), reshenieHtml(z, 'ekran'), razborHtml(z)]) {
        ok(
          !html.includes('katex-error') && !/\$[^$]*\$/.test(html.replace(/<[^>]+>/g, '')),
          `${kv} №${z.no}: формулы набраны`,
        );
      }
      /* Ссылки на теоремы — в справочнике; у 15 и 18 они есть. */
      const ids = z.reshenie.flatMap((e) => e.lines.flatMap(ssylkiV));
      for (const id of ids) ok(TEOREMY[id] !== undefined, `${kv} №${z.no}: теорема ${id} есть`);
      if (z.no === 15 || z.no === 18)
        ok(ids.length >= 4, `${kv} №${z.no}: ссылки на теоремы`, String(ids.length));
      /* Верный ответ принимает автопроверка. */
      for (const pt of z.punkty) {
        if (pt.pole === null || pt.pole.vid === 'danet') continue;
        const vvod =
          pt.pole.vid === 'korni' || pt.pole.vid === 'serii' ? pt.pole.verno : pt.pole.verno;
        ok(
          proverit(pt.pole, vvod) === 'sovpadaet',
          `${kv} №${z.no}: верный ответ проходит автопроверку`,
        );
      }
      json.push({ v: kv, s: zp.s, p: zp.p, kontrol: z.kontrol });
    });
    ok(teoremyZadach(zadachi).length >= 6, `${kv}: теоремы для листа учителя`);
  });
}

/* ── Справочник теорем ───────────────────────────────────────── */
console.log('Справочник теорем');
for (const [id, t] of Object.entries(TEOREMY)) {
  ok(t.dokazatelstvo.length >= 2, `теорема ${id}: доказательство по шагам`);
  const svg = chertezhTeoremy(id);
  ok(svg.startsWith('<svg') && !svg.includes('NaN'), `теорема ${id}: чертёж движком`);
  ok(!teoremaHtml(id).includes('katex-error'), `теорема ${id}: формулы`);
}

const iJson = process.argv.indexOf('--json');
if (iJson > 0) fs.writeFileSync(process.argv[iJson + 1], JSON.stringify(json, null, 1));

console.log(`\nПроверок: ${checks}, ошибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
