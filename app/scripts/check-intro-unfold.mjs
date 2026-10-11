#!/usr/bin/env node
/* scripts/check-intro-unfold.mjs — развёртка октаэдра в заставке честная.

   Заставка первого визита раскрывает октаэдр по развёртке от нижней
   вершины (src/components/onboarding/intro/unfold.ts — тот же код, что
   рисует сцена). Проверка на каждом шаге 2 мс от собранного октаэдра
   до полного раскрытия (с перелётом пружины):

     1. граней 8, все — правильные треугольники с ребром √2;
     2. никакие две грани не проходят друг сквозь друга. Грани берутся
        чуть ужатыми к центру (на 1 %): касание по общему ребру или
        вершине собранного октаэдра пересечением не считается;
     3. в момент 0 грани складываются ровно в октаэдр: вершины —
        (0,0,0), (0,2,0) и четыре точки экватора на высоте 1.

   Запуск: node scripts/check-intro-unfold.mjs */

import { requireSrc } from './lib/load-ts.mjs';

const { LOWER_TRI, UPPER_TRI, petalFrames, unfoldAngles } = requireSrc(
  'components/onboarding/intro/unfold.ts',
);
const { transformPoint, sub, cross, dot, length } = requireSrc(
  'components/onboarding/intro/math.ts',
);

const failures = [];

function faces(t) {
  const { aL, aU } = unfoldAngles(t);
  const out = [];
  for (const f of petalFrames(aL, aU)) {
    out.push(LOWER_TRI.map(([x, y]) => transformPoint(f.lower, [x, y, 0])));
    out.push(UPPER_TRI.map(([x, y]) => transformPoint(f.upper, [x, y, 0])));
  }
  return out;
}

function shrink(tri, k) {
  const c = [0, 1, 2].map((i) => (tri[0][i] + tri[1][i] + tri[2][i]) / 3);
  return tri.map((p) => p.map((v, i) => c[i] + (v - c[i]) * k));
}

/* Отрезок p–q пересекает треугольник (Мёллер — Трумбор). */
function segmentHits(p, q, tri) {
  const d = sub(q, p);
  const e1 = sub(tri[1], tri[0]);
  const e2 = sub(tri[2], tri[0]);
  const h = cross(d, e2);
  const a = dot(e1, h);
  if (Math.abs(a) < 1e-12) return false;
  const f = 1 / a;
  const s = sub(p, tri[0]);
  const u = f * dot(s, h);
  if (u < 0 || u > 1) return false;
  const qv = cross(s, e1);
  const v = f * dot(d, qv);
  if (v < 0 || u + v > 1) return false;
  const t = f * dot(e2, qv);
  return t >= 0 && t <= 1;
}

function intersect(A, B) {
  for (let i = 0; i < 3; i += 1) {
    if (segmentHits(A[i], A[(i + 1) % 3], B)) return true;
    if (segmentHits(B[i], B[(i + 1) % 3], A)) return true;
  }
  return false;
}

let steps = 0;
let worstEdge = 0;
for (let t = 0; t <= 2.5 + 1e-9; t += 0.002) {
  steps += 1;
  const fs = faces(t);
  if (fs.length !== 8) failures.push(`t=${t.toFixed(3)}: граней ${fs.length}`);
  for (const f of fs) {
    for (let i = 0; i < 3; i += 1) {
      worstEdge = Math.max(worstEdge, Math.abs(length(sub(f[i], f[(i + 1) % 3])) - Math.SQRT2));
    }
  }
  const small = fs.map((f) => shrink(f, 0.99));
  for (let i = 0; i < 8; i += 1) {
    for (let j = i + 1; j < 8; j += 1) {
      if (intersect(small[i], small[j])) {
        failures.push(`t=${t.toFixed(3)}: грани ${i} и ${j} пересекаются`);
      }
    }
  }
}
/* Матрицы — Float32Array, отсюда погрешность порядка 1e-7. */
if (worstEdge > 1e-6) failures.push(`ребро отличается от √2 на ${worstEdge}`);

/* Собранный октаэдр. */
const expected = [
  [0, 0, 0],
  [0, 2, 0],
  [Math.SQRT1_2, 1, Math.SQRT1_2],
  [Math.SQRT1_2, 1, -Math.SQRT1_2],
  [-Math.SQRT1_2, 1, Math.SQRT1_2],
  [-Math.SQRT1_2, 1, -Math.SQRT1_2],
];
for (const v of faces(0).flat()) {
  if (!expected.some((e) => length(sub(e, v)) < 1e-6)) {
    failures.push(`в собранном виде лишняя вершина ${v.map((x) => x.toFixed(4)).join(', ')}`);
  }
}

if (failures.length > 0) {
  console.error('Развёртка октаэдра:\n  ' + [...new Set(failures)].slice(0, 20).join('\n  '));
  process.exit(1);
}
console.log(`Развёртка октаэдра: ${steps} моментов, 8 правильных граней, пересечений нет.`);
