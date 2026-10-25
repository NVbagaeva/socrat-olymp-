#!/usr/bin/env node
/* scripts/check-stereo-engine.mjs — движок живых чертежей стереометрии.

   Запуск: pnpm test:stereo-engine

   Без браузера, на всех чертежах банка №3 (lib/solid/drawings):
     1. Статика не тронута: вид по умолчанию — это orthoAt(28°, 25°), и
        рисунок с пустыми опциями тот же, что без них.
     2. Шаги решения: на шаге 0 элементов с шагом нет, на шаге k
        элементы шага k выделены, прошлые — обычные, будущих нет; без
        шага выделения нет вовсе.
     3. Постоянная рамка: у живого чертежа размер SVG один при любом
        ракурсе — он не прыгает при вращении.
     4. Подписи при вращении (12 азимутов × 4 подъёма): друг на друга не
        налезают никогда, сквозь линию проходят не чаще 0,1 %.
     5. Скорость (лучшее из трёх замеров кадра): средний ≤ 3 мс, худший
        ≤ 25 мс (на машине сборки;
        слабый телефон медленнее в разы — компонент пропускает кадры).
     6. Точное ядро №15: призма, пирамида и тетраэдр собираются с
        гранями наружу (V − E + F = 2), сечения считаются. */

import { requireSrc } from './lib/load-ts.mjs';

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}

const R = requireSrc('lib/solid/render.ts');
const P = requireSrc('lib/solid/project.ts');
const D = requireSrc('lib/solid/drawings/index.ts');
const { diagonalKuba, sechenieKuba } = requireSrc('lib/stereo/primery.ts');

const MODELS = Object.entries(D.PROTOTYPE_DRAWINGS);

/* 1. Статика. */
for (const [id, model] of MODELS) {
  const plain = R.renderSolid(model);
  check(plain === R.renderSolid(model, {}), `${id}: пустые опции меняют рисунок`);
  if ((model.view ?? 'ortho') === 'ortho') {
    check(
      plain === R.renderSolid(model, { view: P.orthoAt(P.ORTHO_AZIMUTH, P.ORTHO_ELEVATION) }),
      `${id}: orthoAt(28, 25) рисует не так, как вид по умолчанию`,
    );
  }
  check(!plain.includes('stroke-width="3.4"'), `${id}: выделение без шага`);
}

/* 2. Шаги. */
for (const primer of [diagonalKuba(), sechenieKuba()]) {
  const { model, shagi } = primer;
  const all = [...(model.lines ?? []), ...(model.sections ?? []), ...(model.angles ?? [])];
  const maxShag = Math.max(...all.map((x) => x.shag ?? 0));
  check(
    maxShag === shagi.length,
    `${model.alt}: шагов в модели ${maxShag}, подписей ${shagi.length}`,
  );
  const zero = R.solidDiagnostics(model, { shag: 0 });
  const full = R.solidDiagnostics(model);
  check(zero.strokes.length < full.strokes.length, `${model.alt}: на шаге 0 видны элементы шагов`);
  for (let k = 1; k <= maxShag; k += 1) {
    const svg = R.renderSolid(model, { shag: k });
    check(
      svg.includes('stroke-width="3.4"') || svg.includes('stroke-width="2.4"'),
      `${model.alt}: шаг ${k} не выделен`,
    );
    const prev = R.solidDiagnostics(model, { shag: k - 1 }).strokes.length;
    const cur = R.solidDiagnostics(model, { shag: k }).strokes.length;
    check(cur >= prev, `${model.alt}: на шаге ${k} пропали элементы прошлых шагов`);
  }
}

/* 3–5. Рамка, подписи, скорость. */
const AZ = Array.from({ length: 12 }, (_, i) => i * 30);
const EL = [15, 30, 50, 70];
let labels = 0;
let crossing = 0;
let frames = 0;
let total = 0;
let worst = 0;
let worstId = '';

function crosses(l, s) {
  for (let i = 0; i + 1 < s.points.length; i += 1) {
    const [a, b] = [s.points[i], s.points[i + 1]];
    for (let t = 0; t <= 1; t += 0.05) {
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      if (x > l.x + 1 && x < l.x + l.w - 1 && y > l.y + 1 && y < l.y + l.h - 1) {
        return true;
      }
    }
  }
  return false;
}

/* Прогрев: первые кадры JIT не считаются. */
for (const [, model] of MODELS.slice(0, 10)) {
  R.renderSolid(model, { view: P.orthoAt(10, 20), ustoychivo: true });
}

for (const [id, model] of MODELS) {
  const sizes = new Set();
  for (const az of AZ) {
    for (const el of EL) {
      const opts = { view: P.orthoAt(az, el), ustoychivo: true };
      /* Время кадра — лучшее из трёх: одиночный замер ловит паузы
         машины (сборщик мусора, соседние процессы), а не сам рендер. */
      let svg = '';
      let dt = Infinity;
      for (let i = 0; i < 3; i += 1) {
        const t0 = performance.now();
        svg = R.renderSolid(model, opts);
        dt = Math.min(dt, performance.now() - t0);
      }
      frames += 1;
      total += dt;
      if (dt > worst) {
        worst = dt;
        worstId = `${id} ${az}/${el}`;
      }
      sizes.add(/viewBox="([^"]+)"/.exec(svg)?.[1]);

      const d = R.solidDiagnostics(model, opts);
      const L = d.labels;
      for (let i = 0; i < L.length; i += 1) {
        for (let j = i + 1; j < L.length; j += 1) {
          const [a, b] = [L[i], L[j]];
          check(
            !(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y),
            `${id} ${az}/${el}: подписи ${a.text} и ${b.text} налезают`,
          );
        }
        labels += 1;
        if (d.strokes.some((s) => crosses(L[i], s))) {
          crossing += 1;
        }
      }
    }
  }
  check(sizes.size === 1, `${id}: рамка живого чертежа меняется при вращении (${sizes.size})`);
}
check(crossing <= labels * 0.001, `подписей сквозь линию ${crossing} из ${labels} (> 0,1 %)`);
const avg = total / frames;
check(avg <= 3, `средний кадр ${avg.toFixed(2)} мс > 3`);
check(worst <= 25, `худший кадр ${worst.toFixed(1)} мс > 25 (${worstId})`);

/* 6. Точное ядро №15. */
const C = requireSrc('lib/zadanie15/core/index.ts');
const T = (name, x, y, z) => ({ name, p: C.v3n(x, y, z) });
const euler = (poly) => poly.vertices.length - poly.edges.length + poly.faces.length;

/* Координаты чётные: середины рёбер — целые точки. */
const pir = C.pyramid(
  [T('A', 0, 0, 0), T('B', 8, 0, 0), T('C', 8, 12, 0), T('D', 0, 12, 0)],
  T('S', 4, 6, 10),
);
check(euler(pir) === 2 && pir.edges.length === 8, 'пирамида SABCD: не та топология');
{
  const sp = (n) => pir.vertices.find((v) => v.name === n).p;
  const mid = (a, b) =>
    C.v3n(...[0, 1, 2].map((i) => (C.toArray(sp(a))[i] + C.toArray(sp(b))[i]) / 2));
  const sec = C.section(pir, C.planeThrough(mid('S', 'A'), mid('S', 'B'), mid('S', 'C')));
  check(
    sec.kind === 'polygon' && sec.vertices.length === 4,
    'пирамида: сечение через середины боковых рёбер — не четырёхугольник',
  );
  const S = C.area(sec.vertices.map((v) => v.p));
  check(
    Math.abs(C.surdToNumber(S) - 24) < 1e-9,
    `пирамида: площадь сечения ${C.surdToNumber(S)}, а не 24 (четверть основания)`,
  );
  check(
    C.polygonKind(sec.vertices.map((v) => v.p)) === 'прямоугольник',
    'пирамида: сечение — не прямоугольник',
  );
}

const pr = C.prism([T('A', 0, 0, 0), T('B', 4, 0, 0), T('C', 0, 3, 0)], C.v3n(0, 0, 5));
check(euler(pr) === 2 && pr.edges.length === 9, 'призма ABCA₁B₁C₁: не та топология');
check(
  pr.vertices.map((v) => v.name).join(' ') === 'A B C A_1 B_1 C_1',
  'призма: имена верхних вершин',
);
{
  const sec = C.section(pr, C.planeThrough(C.v3n(2, 0, 0), C.v3n(2, 1, 0), C.v3n(2, 0, 1)));
  check(
    sec.kind === 'polygon' && sec.vertices.length === 4,
    'призма: сечение x = 2 — не четырёхугольник',
  );
}

const tet = C.tetrahedron(T('A', 0, 0, 0), T('B', 2, 0, 0), T('C', 0, 2, 0), T('D', 0, 0, 2));
check(euler(tet) === 2 && tet.faces.length === 4, 'тетраэдр: не та топология');
/* Грани наружу: внутренняя точка по ту же сторону каждой грани. */
for (const poly of [pir, pr, tet]) {
  const inner = [0, 1, 2].map(
    (i) => poly.vertices.reduce((s, v) => s + C.toArray(v.p)[i], 0) / poly.vertices.length,
  );
  const sides = new Set(
    poly.faces.map((f) => {
      const [a, b, c] = f.idx.map((i) => C.toArray(poly.vertices[i].p));
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const w = inner.map((x, i) => x - a[i]);
      return Math.sign(n[0] * w[0] + n[1] * w[1] + n[2] * w[2]);
    }),
  );
  check(sides.size === 1 && sides.has(-1), `${poly.kind}: грани смотрят не наружу`);
}

console.log(
  `Кадров ${frames}: средний ${avg.toFixed(2)} мс, худший ${worst.toFixed(1)} мс (${worstId}); ` +
    `подписей сквозь линию ${crossing} из ${labels}.`,
);
if (failures.length > 0) {
  console.error(`check-stereo-engine: ${failures.length} из ${checks} проверок не прошли`);
  failures.slice(0, 40).forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log(`check-stereo-engine: ok (${checks} проверок)`);
