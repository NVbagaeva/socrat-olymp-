#!/usr/bin/env node
/* scripts/check-zadanie15.mjs — автотест ядра задания №15 (сечения).

   Запуск: pnpm test:zadanie15

   Ядро (src/lib/zadanie15/core) считает точно: дроби на BigInt,
   длины и площади вида a√b. Здесь проверяется:
     — арифметика дробей и корней (сокращение, вынос из-под корня,
       приведение подобных);
     — сечения куба: треугольник, прямоугольник, трапеция,
       пятиугольник, правильный шестиугольник — вид многоугольника,
       порядок вершин, площадь, периметр, деление рёбер;
     — сечения параллелепипеда с неравными рёбрами;
     — угол между сечением и гранью, расстояние до плоскости;
     — построение с происхождением: правила метода следов (соединять
       только точки одной грани, пересекать только прямые одной
       плоскости), параллельная через точку с обоснованием, цепочка
       до точек условия, точка «на глаз» не обоснована, имена,
       удаление со всеми зависимыми.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { requireSrc } from './lib/load-ts.mjs';

const K = requireSrc('lib/zadanie15/core/index.ts');
const { rat, sqrtRat, surdStr, sumStr, surdSum, surdOf, cube, box, Construction } = K;

const problems = [];
let checks = 0;
const ok = (cond, what) => {
  checks += 1;
  if (!cond) problems.push(what);
};
const eqStr = (got, want, what) => ok(got === want, `${what}: ${got} вместо ${want}`);

/* ── Арифметика ─────────────────────────────────────────── */

eqStr(K.ratStr(rat(6, -4)), '-3/2', 'сокращение дроби');
eqStr(K.ratStr(K.ratDec(2.5)), '5/2', 'десятичная дробь');
eqStr(K.ratStr(K.add(rat(1, 3), rat(1, 6))), '1/2', 'сложение дробей');
eqStr(surdStr(sqrtRat(rat(8))), '2√2', '√8');
eqStr(surdStr(sqrtRat(rat(1, 2))), '1/2√2', '√(1/2)');
eqStr(surdStr(sqrtRat(rat(49, 4))), '7/2', '√(49/4)');
eqStr(surdStr(sqrtRat(rat(72))), '6√2', '√72');
eqStr(
  sumStr(surdSum([surdOf(rat(2), 2n), surdOf(rat(3), 8n), surdOf(rat(5))])),
  '5 + 8√2',
  'приведение подобных',
);
eqStr(K.surdTex(sqrtRat(rat(3, 4))), '\\dfrac{\\sqrt{3}}{2}', 'TeX √(3/4)');
eqStr(
  K.sumTex(surdSum([surdOf(rat(1), 13n), surdOf(rat(2), 5n), surdOf(rat(5))])),
  '5+2\\sqrt{5}+\\sqrt{13}',
  'TeX суммы',
);

/* ── Сечения ────────────────────────────────────────────── */

/**
 * Сечение плоскостью через три точки, заданные вершинами или
 * точками на рёбрах [«A_1», «B_1», t].
 */
function sec(poly, pts) {
  const c = new Construction(poly);
  const ids = pts.map((p) => {
    if (typeof p === 'string') return c.vertex(p);
    const r = c.pointOnEdge(p[0], p[1], rat(p[2][0], p[2][1]));
    if (!r.ok) throw new Error(r.message);
    return r.value;
  });
  const pl = c.plane3(ids[0], ids[1], ids[2]);
  if (!pl.ok) throw new Error(pl.message);
  const plane = c.plane(pl.value).plane;
  const s = K.section(poly, plane);
  const P = s.vertices.map((v) => v.p);
  return {
    s,
    plane,
    kind: s.kind === 'polygon' ? K.polygonKind(P) : s.kind,
    n: P.length,
    area: surdStr(K.area(P)),
    per: sumStr(K.perimeter(P)),
    cuts: K.edgeCuts(poly, s)
      .map((e) => `${e.name}:${e.p}:${e.q}`)
      .sort(),
  };
}

const C6 = cube(6);
const half = [1, 2];

// Треугольник A_1BD: правильный, сторона 6√2.
{
  const r = sec(C6, ['A_1', 'B', 'D']);
  eqStr(r.kind, 'равносторонний треугольник', 'куб, A_1BD — вид');
  eqStr(r.area, '18√3', 'куб, A_1BD — площадь');
  eqStr(r.per, '18√2', 'куб, A_1BD — периметр');
  const base = C6.faces[K.faceIndex(C6, 'ABCD')].plane;
  eqStr(surdStr(K.cosPlanes(r.plane, base)), '1/3√3', 'куб, угол A_1BD и ABCD — косинус');
  eqStr(surdStr(K.tanPlanes(r.plane, base)), '√2', 'куб, угол A_1BD и ABCD — тангенс');
  eqStr(surdStr(K.distance(C6.vertices[0].p, r.plane)), '2√3', 'куб, расстояние от A до A_1BD');
}

// Прямоугольник ABC_1D_1.
{
  const r = sec(C6, ['A', 'B', 'C_1']);
  eqStr(r.kind, 'прямоугольник', 'куб, ABC_1D_1 — вид');
  eqStr(r.area, '36√2', 'куб, ABC_1D_1 — площадь');
  eqStr(r.per, '12 + 12√2', 'куб, ABC_1D_1 — периметр');
  ok(r.cuts.length === 0, 'куб, ABC_1D_1 — рёбра не делятся (сечение по вершинам)');
}

// Равнобедренная трапеция BDNM: M, N — середины A_1B_1 и A_1D_1.
{
  const r = sec(C6, ['B', 'D', ['A_1', 'B_1', half]]);
  eqStr(r.kind, 'равнобедренная трапеция', 'куб, BDNM — вид');
  eqStr(r.n, 4, 'куб, BDNM — вершин');
  eqStr(r.area, '81/2', 'куб, BDNM — площадь');
  eqStr(r.cuts.join(' '), 'A_1B_1:1:1 A_1D_1:1:1', 'куб, BDNM — деление рёбер');
}

// Пятиугольник: M, N — середины A_1B_1, A_1D_1, плоскость через C.
{
  const r = sec(C6, [['A_1', 'B_1', half], ['A_1', 'D_1', half], 'C']);
  eqStr(r.kind, 'пятиугольник', 'куб, MNC — вид');
  eqStr(r.cuts.join(' '), 'A_1B_1:1:1 A_1D_1:1:1 BB_1:2:1 DD_1:2:1', 'куб, MNC — деление рёбер');
  // Порядок вершин — обход выпуклого многоугольника: соседние вершины
  // лежат в одной грани.
  const v = r.s.vertices;
  ok(
    v.every((a, i) => {
      const b = v[(i + 1) % v.length];
      return a.faces.some((f) => b.faces.includes(f));
    }),
    'куб, MNC — соседние вершины сечения лежат в одной грани',
  );
}

// Правильный шестиугольник через середины AB, BC, CC_1.
{
  const r = sec(C6, [
    ['A', 'B', half],
    ['B', 'C', half],
    ['C', 'C_1', half],
  ]);
  eqStr(r.kind, 'правильный шестиугольник', 'куб, шестиугольник — вид');
  eqStr(r.area, '27√3', 'куб, шестиугольник — площадь');
  eqStr(r.per, '18√2', 'куб, шестиугольник — периметр');
  eqStr(r.cuts.length, 6, 'куб, шестиугольник — делятся шесть рёбер');
}

// Плоскость грани и касание.
{
  eqStr(sec(C6, ['A', 'B', 'C']).kind, 'face', 'куб, ABC — совпадает с гранью');
}

// Параллелепипед 2 × 3 × 4: A_1BD — треугольник, площадь √61.
const B234 = box(2, 3, 4);
{
  const r = sec(B234, ['A_1', 'B', 'D']);
  eqStr(r.kind, 'треугольник', 'параллелепипед, A_1BD — вид');
  eqStr(r.area, '√61', 'параллелепипед, A_1BD — площадь');
  eqStr(r.per, '5 + 2√5 + √13', 'параллелепипед, A_1BD — периметр');
  const base = B234.faces[K.faceIndex(B234, 'ABCD')].plane;
  // tg = c / h, h — высота треугольника ABD из A: 6/√13; tg = 4·√13/6 = 2√13/3
  eqStr(
    surdStr(K.tanPlanes(r.plane, base)),
    '2/3√13',
    'параллелепипед, угол с основанием — тангенс',
  );
}

// Параллелепипед: диагональное сечение ACC_1A_1 — прямоугольник 4 × √13.
{
  const r = sec(B234, ['A', 'C', 'C_1']);
  eqStr(r.kind, 'прямоугольник', 'параллелепипед, ACC_1A_1 — вид');
  eqStr(r.area, '4√13', 'параллелепипед, ACC_1A_1 — площадь');
}

// Параллелепипед 4 × 6 × 3: через середины AB, AD и точку на CC_1 (2:1).
{
  const B = box(4, 6, 3);
  const r = sec(B, [
    ['A', 'B', half],
    ['A', 'D', half],
    ['C', 'C_1', [2, 3]],
  ]);
  // Плоскость 3x + 2y − 9z = 6; проекция сечения на ABCD — 24 − 3 = 21,
  // cos угла с основанием 9/√94 ⇒ S = 21·√94/9 = 7√94/3.
  eqStr(r.kind, 'пятиугольник', 'параллелепипед 4×6×3 — вид');
  eqStr(r.area, '7/3√94', 'параллелепипед 4×6×3 — площадь');
  eqStr(r.per, '2√10 + √13 + √85', 'параллелепипед 4×6×3 — периметр');
  eqStr(
    r.cuts.join(' '),
    'AB:1:1 AD:1:1 BB_1:2:7 CC_1:2:1 DD_1:2:7',
    'параллелепипед 4×6×3 — деление рёбер',
  );
}

/* ── Построение с происхождением ────────────────────────── */

{
  const c = new Construction(cube(6));
  const M = c.pointOnEdge('A_1', 'B_1', rat(1, 2), 'M');
  const N = c.pointOnEdge('A_1', 'D_1', rat(1, 2), 'N');
  const P = c.pointOnEdge('C', 'C_1', rat(1, 3), 'P');
  ok(M.ok && N.ok && P.ok, 'точки на рёбрах ставятся');
  const m = M.value;
  const n = N.value;
  const p = P.value;

  // M и P — в разных гранях: соединять нельзя.
  const bad = c.lineThrough(m, p);
  ok(!bad.ok && bad.code === 'not-coplanar', 'MP не в одной грани — отказ');
  ok(
    !bad.ok && /не лежат в одной грани/.test(bad.message),
    'текст отказа «не лежат в одной грани»',
  );

  // MN — в грани A_1B_1C_1D_1.
  const MN = c.lineThrough(m, n);
  ok(MN.ok, 'MN проводится');
  const mn = MN.value;
  const og = c.line(mn).origin;
  ok(
    og.op === 'line' && og.plane.kind === 'face' && c.planeName(og.plane) === 'A_1B_1C_1D_1',
    'MN лежит в грани A_1B_1C_1D_1',
  );

  // MN ∩ B_1C_1 — точка X на продолжении ребра.
  const b1c1 = c.edgeLine('B_1', 'C_1');
  const X = c.intersect(mn, b1c1, 'X');
  ok(X.ok, 'X = MN ∩ B_1C_1 находится');
  const x = X.value;
  eqStr(K.toArray(c.point(x).p).join(','), '6,-3,6', 'координаты X');
  ok(c.onEdgeSegment(x) === null, 'X — на продолжении ребра, а не на нём');
  const xo = c.point(x).origin;
  ok(
    xo.op === 'intersect' && xo.plane !== null && c.planeName(xo.plane) === 'A_1B_1C_1D_1',
    'X получена в плоскости A_1B_1C_1D_1',
  );
  ok(c.grounded(x), 'X обоснована');
  const chainNames = c
    .chain(x)
    .map((id) => c.get(id))
    .filter((o) => o.kind === 'point')
    .map((o) => o.name);
  eqStr(chainNames.join(','), 'M,N,B_1,C_1,X', 'цепочка X до точек условия');

  // XP — обе в грани BB_1C_1C (X — на продолжении B_1C_1).
  const XP = c.lineThrough(x, p);
  ok(XP.ok, 'XP проводится: X и P в плоскости BB_1C_1C');

  // Параллельные и скрещивающиеся рёбра.
  const aa1 = c.edgeLine('A', 'A_1');
  const cc1 = c.edgeLine('C', 'C_1');
  const bc = c.edgeLine('B', 'C');
  const par = c.intersect(aa1, cc1);
  ok(!par.ok && par.code === 'parallel', 'AA_1 и CC_1 — параллельны, отказ');
  const skew = c.intersect(aa1, bc);
  ok(!skew.ok && skew.code === 'skew', 'AA_1 и BC — скрещиваются, отказ');
  ok(!skew.ok && /скрещиваются/.test(skew.message), 'текст отказа «скрещиваются»');

  // Через C — параллельно MN: опора на параллельные грани.
  const C = c.vertex('C');
  const L = c.parallelThrough(mn, C);
  ok(L.ok, 'параллельная MN через C проводится');
  const lo = c.line(L.value).origin;
  ok(lo.op === 'parallel' && lo.reason === 'parallel-faces', 'обоснование — параллельные грани');
  ok(
    lo.op === 'parallel' && lo.plane !== null && c.planeName(lo.plane) === 'ABCD',
    'параллельная лежит в грани ABCD',
  );

  // Точка «на глаз» — не обоснована.
  const F = c.freePoint(K.v3n(6, 6, 2), 'F');
  ok(F.ok && !c.grounded(F.value), 'точка «на глаз» не обоснована');

  // Имена.
  const t1 = c.rename(x, 'A');
  ok(!t1.ok && t1.code === 'name-taken', 'имя A занято');
  const t2 = c.rename(x, 'm');
  ok(!t2.ok && t2.code === 'name-invalid', 'имя m недопустимо');
  const t3 = c.rename(x, "X_1'");
  ok(t3.ok && c.point(x).name === "X_1'", 'переименование в X_1′');
  ok(
    c
      .chain(x)
      .map((id) => c.get(id))
      .some((o) => o.kind === 'point' && o.name === "X_1'"),
    'новое имя в цепочке',
  );

  // Удаление M уносит MN, X, XP, параллельную.
  const gone = c.remove(m);
  ok(
    gone.includes(mn) && gone.includes(x) && gone.includes(XP.value) && gone.includes(L.value),
    'удаление M уносит всё зависимое',
  );
  ok(c.has(n) && c.has(p), 'независимые точки остаются');
  ok(c.remove(c.vertex('A')).length === 0, 'вершину удалить нельзя');

  // Сечение плоскостью MNP совпадает с сечением, построенным заново.
  const c2 = new Construction(cube(6));
  const ids = [
    c2.pointOnEdge('A_1', 'B_1', rat(1, 2)).value,
    c2.pointOnEdge('A_1', 'D_1', rat(1, 2)).value,
    c2.pointOnEdge('C', 'C_1', rat(1, 3)).value,
  ];
  const pl = c2.plane3(ids[0], ids[1], ids[2]);
  ok(pl.ok, 'плоскость MNP задаётся');
  const s = K.section(c2.poly, c2.plane(pl.value).plane);
  ok(
    s.kind === 'polygon' && s.vertices.length >= 4,
    `сечение MNP — многоугольник (${s.vertices.length} вершин)`,
  );
  const col = c2.plane3(c2.vertex('A'), c2.vertex('B'), ids[0]);
  ok(col.ok, 'A, B, M задают плоскость');
  const line3 = c2.plane3(c2.vertex('A'), c2.vertex('C'), c2.vertex('C'));
  ok(!line3.ok && line3.code === 'collinear', 'три точки на прямой — отказ');
}

/* ── Итог ───────────────────────────────────────────────── */

console.log(`Проверок ядра №15: ${checks}`);
if (problems.length > 0) {
  console.log(`проблем: ${problems.length}`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}
console.log('проблем: 0');
