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
  const arg = (x) => A14[p.a](x) + p.z * B14[p.b](x);
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
  const f = (x) =>
    (p.q ** (2 * x + 1) + x - (p.y1 + p.y2) * Math.sqrt(x) - (p.q ** (p.e + 1) - p.y1 * p.y2)) /
      (p.q ** (2 * x) - p.q ** p.e) -
    p.q;
  const { a, x0, b } = z.kontrol;
  const vnutri = (x) => (x >= a - 1e-12 && x < x0) || x >= b - 1e-12;
  /* Сетка на [0; max(12, y₂² + 3)]. Дробь при больших x отличается от q
     на 1e-9…1e-12 — это настоящая величина, погрешность счёта на порядки
     меньше; точки, где |f| < 1e-13, не сравниваются — там знак сверяет
     сетка mpmath с 60 знаками (check_povyshennye_chast2.py). */
  let plokho = 0;
  let mimo = 0;
  const kray = Math.max(12, b + 3);
  for (let i = 0; i * 0.0005 <= kray; i += 1) {
    const x = i * 0.0005;
    const v = f(x);
    if (!Number.isFinite(v)) continue;
    if (Math.abs(x - a) < 1e-9 || Math.abs(x - b) < 1e-9) {
      if (Math.abs(v) > 1e-6) plokho += 1;
      continue;
    }
    if (Math.abs(v) < 1e-13) {
      mimo += 1;
      continue;
    }
    if (v > 0 !== vnutri(x)) {
      plokho += 1;
      if (plokho < 4) console.error(`    №16: x = ${x}, f = ${v}`);
    }
  }
  void mimo;
  ok(plokho === 0, '№16: ответ совпал с сеткой', `${plokho} точек`);
  ok(a < x0 && x0 < b, '№16: та же структура [y₁²; x₀) ∪ [y₂²; +∞)');
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

function prov19(p, z) {
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
  const q = p.p + 20;
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

const PROV = {
  'z14.logTrig': prov14,
  'z15.rombPiramida': prov15,
  'z16.pokazKoren': prov16,
  'z17.kachka': prov17,
  'z18.pyatiugolnik': prov18,
  'z19.logKoren': prov19,
  'z20.zabor': prov20,
};

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
      PROV[zp.s](zp.p, z);
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
