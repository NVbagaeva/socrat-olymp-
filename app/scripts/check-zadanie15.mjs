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
       удаление со всеми зависимыми;
     — рисунок (src/lib/zadanie15/render): видимость рёбер, сторон
       сечения и вспомогательных прямых для параллельной и центральной
       проекции, разрез тела на две части, натуральная величина,
       раскладка подписей, SVG для экспорта, сцены витрины.

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

/* ── Пересечение плоскостей ─────────────────────────────── */

{
  const faces = (poly, name) => poly.faces[K.faceIndex(poly, name)].plane;
  const base = faces(C6, 'ABCD');
  const top = faces(C6, 'A_1B_1C_1D_1');
  const front = faces(C6, 'AA_1B_1B');
  ok(K.intersectPlanes(base, top).kind === 'parallel', 'основания куба параллельны');
  ok(K.intersectPlanes(base, base).kind === 'same', 'плоскость сама с собой — совпадает');
  const m = K.intersectPlanes(base, front);
  ok(m.kind === 'line', 'ABCD ∩ AA_1B_1B — прямая');
  if (m.kind === 'line') {
    ok(K.onLine(m.line, K.v3n(0, 0, 0)) && K.onLine(m.line, K.v3n(6, 0, 0)), 'это прямая AB');
    ok(K.onPlane(base, m.line.p) && K.onPlane(front, m.line.p), 'точка прямой в обеих плоскостях');
  }
  // Плоскость через M (середина A_1B_1), N (середина A_1D_1) и C: след на основании.
  const c = new Construction(cube(6));
  const M = c.pointOnEdge('A_1', 'B_1', rat(1, 2), 'M').value;
  const N = c.pointOnEdge('A_1', 'D_1', rat(1, 2), 'N').value;
  const Cv = c.vertex('C');
  const pl = c.plane3(M, N, Cv, '\\alpha');
  ok(pl.ok, 'плоскость α задана');
  const alpha = { kind: 'plane', id: pl.value };
  const baseRef = { kind: 'face', face: K.faceIndex(C6, 'ABCD') };
  const topRef = { kind: 'face', face: K.faceIndex(C6, 'A_1B_1C_1D_1') };
  eqStr(c.planeTex(alpha), '\\alpha', 'подпись α');
  eqStr(c.planeTex(baseRef), '(ABC)', 'подпись плоскости грани — три первые вершины имени');

  const same = c.planeMeet(alpha, alpha);
  ok(!same.ok && same.code === 'same-plane', 'плоскость с собой — отказ');
  const par = c.planeMeet(baseRef, topRef);
  ok(!par.ok && par.code === 'parallel-planes', 'параллельные грани — отказ');
  ok(!par.ok && /параллельны/.test(par.message), 'текст отказа про параллельные плоскости');

  const L = c.planeMeet(alpha, baseRef);
  ok(L.ok, 'α ∩ (ABC) строится');
  const l = L.value;
  eqStr(c.lineTex(l), '\\alpha \\cap (ABC)', 'подпись прямой пересечения');
  // Через C — общая точка обеих плоскостей.
  eqStr(
    c
      .meetThrough(l)
      .map((id) => c.point(id).name)
      .join(','),
    'C',
    'пока одна общая точка — C',
  );
  ok(/общая точка/.test(c.describe(l)), 'обоснование с одной общей точкой');
  ok(c.planeMeet(baseRef, alpha).value === l, 'та же пара плоскостей — та же прямая');
  ok(c.findMeet(alpha, baseRef) === l, 'findMeet находит прямую');

  // Кандидаты: след пересекает прямые рёбер основания.
  const hits = c.lineEdgeHits(l);
  const names = hits
    .map((h) => `${K.toArray(h.p).join(',')}${h.onSegment ? '' : '*'}`)
    .sort()
    .join(' ');
  // Прямая через C(6,6,0) с направлением (1,-1,0): проходит через C
  // (вершина, два ребра) и продолжения AB (12,0,0) и AD (0,12,0).
  eqStr(names, '0,12,0* 12,0,0* 6,6,0', 'кандидаты: C и две точки на продолжениях');
  const atC = hits.find((h) => h.onSegment);
  ok(
    atC !== undefined && atC.edges.length === 3,
    'вершина C засчитана один раз, с тремя рёбрами (BC, CD, CC_1)',
  );

  // Вторая общая точка: X = MN ∩ … нет; построим точку на следе через
  // пересечение с продолжением AB — через прямые одной плоскости.
  const ab = c.edgeLine('A', 'B');
  const X = c.intersect(l, ab, 'X');
  ok(X.ok, 'X = (α ∩ ABC) ∩ AB строится');
  eqStr(K.toArray(c.point(X.value).p).join(','), '12,0,0', 'X на продолжении AB');
  eqStr(
    c
      .meetThrough(l)
      .map((id) => c.point(id).name)
      .join(','),
    'C,X',
    'теперь две общие точки',
  );
  eqStr(
    c.describe(l),
    '$C \\in \\alpha$ и $C \\in (ABC)$, $X \\in \\alpha$ и $X \\in (ABC)$, $C \\ne X$. ' +
      'Плоскости $\\alpha$ и $(ABC)$ различны и имеют общие точки, значит, они пересекаются по прямой ' +
      '(аксиома: если две различные плоскости имеют общую точку, то они пересекаются по прямой, проходящей через эту точку). ' +
      'Обе точки $C$ и $X$ лежат на этой прямой, значит, $\\alpha \\cap (ABC) = CX$.',
    'полное школьное обоснование прямой пересечения',
  );

  eqStr(
    c.describe(X.value),
    '$X = CX \\cap AB$ — обе прямые лежат в плоскости $(ABC)$.',
    'описание точки пересечения со следом',
  );
  eqStr(
    c.faceVertexNames(K.faceIndex(C6, 'BB_1C_1C')).join(' '),
    'B B_1 C_1 C',
    'имена вершин грани по её имени',
  );

  // Шаги: вершины не считаются.
  eqStr(c.steps().length, 6, 'шагов построения: M, N, α, прямая, AB, X');
  ok(
    c.steps().every((id) => c.get(id).origin.op !== 'vertex'),
    'в шагах нет вершин',
  );
  ok(/на ребре \$A_1B_1\$, \$A_1M : MB_1 = 1:1\$/.test(c.describe(M)), 'описание точки на ребре');

  // Удаление α уносит прямую пересечения и X.
  const dep = c.dependents(pl.value);
  ok(dep.includes(l) && dep.includes(X.value), 'прямая пересечения зависит от плоскости');

  // Перетаскивание: M сдвигается, плоскость и след пересчитываются.
  const before = c.line(l).line;
  const mv = c.setEdgeParam(M, rat(1, 3));
  ok(mv.ok, 'сдвиг M по ребру');
  eqStr(K.toArray(c.point(M).p).join(','), '2,0,6', 'M на 1/3 ребра');
  ok(!K.sameLine(before, c.line(l).line), 'след пересчитан');
  ok(K.onPlane(c.plane(pl.value).plane, c.point(M).p), 'плоскость проходит через новое M');
  ok(K.onLine(c.line(l).line, c.point(X.value).p), 'X пересчитана и лежит на следе');
  // В вершину A_1 (t = 0) M, N, C остаются не на одной прямой — сдвиг разрешён;
  // а вот сдвиг, ломающий построение, отменяется: сделаем N совпадающей с M.
  const c2 = new Construction(cube(6));
  const m2 = c2.pointOnEdge('A', 'B', rat(1, 2), 'M').value;
  const n2 = c2.pointOnEdge('A', 'B', rat(1, 3), 'N').value;
  const l2 = c2.lineThrough(m2, n2);
  ok(l2.ok, 'прямая по двум точкам одного ребра');
  const bad = c2.setEdgeParam(n2, rat(1, 2));
  ok(!bad.ok, 'сдвиг N в M ломает прямую — отменён');
  eqStr(K.ratStr(c2.point(n2).origin.t), '1/3', 'параметр N остался прежним');

  // Прямые пересечения грани: снимаются вместе с плоскостью грани.
  eqStr(c.linesOfFace(baseRef.face).join(','), l, 'прямая числится за гранью ABCD');
}

/* ── Сцена: плоскости и линии на экране ─────────────────── */

{
  const S = requireSrc('lib/zadanie15/scene/index.ts');
  const opts = (c, extra) => ({
    camera: S.DEFAULT_CAMERA,
    mode: 'learn',
    facePlanes: [],
    ...extra,
  });

  // Все сценарии витрины собираются без отказов.
  for (const sc of S.SCENARIOS) {
    const { c, facePlanes } = sc.build();
    const scene = S.buildScene(c, opts(c, { facePlanes }));
    ok(scene.edges.length === 12 && scene.faces.length === 6, `${sc.id}: куб на сцене`);
    ok(
      scene.points.every((p) => Number.isFinite(p.p[0]) && Number.isFinite(p.p[1])),
      `${sc.id}: точки спроецированы`,
    );
    ok(
      scene.lines
        .filter((l) => l.kind === 'meet')
        .every((l) => l.runs.length > 0 && l.label !== null),
      `${sc.id}: у линий пересечения есть отрезки и подпись`,
    );
    ok(
      scene.sheets.every((sh) => sh.points.length >= 3),
      `${sc.id}: листы плоскостей — многоугольники`,
    );
    ok(scene.notice === null, `${sc.id}: без сообщения о параллельности`);
  }

  // Сценарий 1: линии появляются только в режиме изучения или после показа.
  const sled = S.SCENARIOS.find((sc) => sc.id === 'sled');
  const { c, facePlanes } = sled.build();
  const faces = facePlanes;
  const learn = S.buildScene(c, opts(c, { facePlanes: faces }));
  const meets = learn.lines.filter((l) => l.kind === 'meet');
  eqStr(meets.length, 2, 'изучение: две линии пересечения');
  ok(
    meets.every((l) => l.through.length === 2),
    'у каждой линии две общие точки для обоснования',
  );
  ok(learn.candidates.length > 0, 'кандидаты в вершины отмечены');
  ok(learn.sections.length === 1 && learn.sections[0].points.length >= 3, 'сечение показано');
  const train = S.buildScene(c, opts(c, { facePlanes: faces, mode: 'train' }));
  eqStr(train.lines.filter((l) => l.kind === 'meet').length, 0, 'тренажёр: линий нет');
  eqStr(train.sections.length, 0, 'тренажёр: сечения нет');
  const reveal = S.buildScene(c, opts(c, { facePlanes: faces, mode: 'train', reveal: true }));
  eqStr(reveal.lines.filter((l) => l.kind === 'meet').length, 2, 'после проверки линии показаны');
  ok(reveal.candidates.length > 0, 'после проверки кандидаты показаны');
  // Тренажёр: пустых кружков-кандидатов нет ни в одном сценарии, пока не нажали «Показать».
  for (const sc of S.SCENARIOS) {
    const b = sc.build();
    const t = S.buildScene(b.c, opts(b.c, { facePlanes: b.facePlanes, mode: 'train' }));
    eqStr(t.candidates.length, 0, `тренажёр, ${sc.id}: кандидатов нет`);
    eqStr(t.lines.filter((l) => l.kind === 'meet').length, 0, `тренажёр, ${sc.id}: линий нет`);
  }
  // Камера всегда ортогональная: следы в параллельных гранях параллельны
  // на экране при любом повороте (проекция линейная, без перспективы).
  {
    const pts = [
      [0, 0, 0],
      [6, 3, 0],
      [0, 0, 6],
      [6, 3, 6],
    ];
    for (let i = 0; i < 40; i += 1) {
      const cam = { yaw: i * 0.37, pitch: ((i % 9) - 4) * 0.33 };
      const b = S.basisOf(cam);
      const P = pts.map((p) => S.project(b, p));
      const u = [P[1][0] - P[0][0], P[1][1] - P[0][1]];
      const v = [P[3][0] - P[2][0], P[3][1] - P[2][1]];
      const cr = u[0] * v[1] - u[1] * v[0];
      if (Math.abs(cr) > 1e-9) {
        ok(false, `камера ${i}: параллельные отрезки на экране не параллельны (${cr})`);
        break;
      }
    }
    ok(true, 'камера ортогональная: параллельность сохраняется при 40 поворотах');
  }
  // Пошаговый показ: до первого шага — только фигура.
  const start = S.buildScene(c, opts(c, { facePlanes: faces, upTo: -1 }));
  eqStr(start.lines.length, 0, 'шаг «фигура»: линий нет');
  eqStr(start.points.length, 8, 'шаг «фигура»: только вершины');
  // Выбранная линия подсвечивает обе плоскости и общие точки.
  const sel = S.buildScene(c, opts(c, { facePlanes: faces, selected: meets[0].id }));
  eqStr(sel.sheets.filter((sh) => sh.highlighted).length, 2, 'подсвечены обе плоскости');
  eqStr(sel.points.filter((p) => p.highlighted).length, 2, 'подсвечены общие точки');
  // Подписи не накладываются: ни одна пара центров ближе 12 px по обеим осям.
  const labels = [
    ...learn.points.map((p) => p.label),
    ...learn.sheets.map((sh) => sh.label.p),
    ...learn.lines.flatMap((l) => (l.label === null ? [] : [l.label.p])),
  ];
  let clash = 0;
  for (let i = 0; i < labels.length; i++)
    for (let j = i + 1; j < labels.length; j++)
      if (Math.abs(labels[i][0] - labels[j][0]) < 12 && Math.abs(labels[i][1] - labels[j][1]) < 12)
        clash += 1;
  eqStr(clash, 0, 'подписи разведены');
  // На телефоне подписи крупнее относительно чертежа — и всё равно не налезают.
  for (const sc of S.SCENARIOS) {
    const b2 = sc.build();
    const k = 1.9;
    const ph = S.buildScene(b2.c, opts(b2.c, { facePlanes: b2.facePlanes, labelScale: k }));
    const ls = [
      ...ph.points.map((p) => p.label),
      ...ph.sheets.map((sh) => sh.label.p),
      ...ph.lines.flatMap((l) => (l.label === null ? [] : [l.label.p])),
    ];
    let hits = 0;
    for (let i = 0; i < ls.length; i++)
      for (let j = i + 1; j < ls.length; j++)
        if (Math.abs(ls[i][0] - ls[j][0]) < 12 * k && Math.abs(ls[i][1] - ls[j][1]) < 12 * k)
          hits += 1;
    eqStr(hits, 0, `${sc.id}: подписи разведены и на телефоне`);
    ok(
      ls.every((p) => p[0] >= 0 && p[0] <= ph.size && p[1] >= 0 && p[1] <= ph.size),
      `${sc.id}: подписи в пределах сцены на телефоне`,
    );
    // Подпись точки остаётся рядом с точкой.
    const far = ph.points.filter(
      (p) => Math.hypot(p.label[0] - p.p[0], p.label[1] - p.p[1]) > 60 * k,
    );
    eqStr(far.map((p) => p.tex).join(','), '', `${sc.id}: подписи точек рядом с точками`);
  }

  // Параллельные плоскости: основание и верхняя грань — сообщение, линии нет.
  const top = K.faceIndex(c.poly, 'A_1B_1C_1D_1');
  const base = K.faceIndex(c.poly, 'ABCD');
  const par = c.planeMeet({ kind: 'face', face: base }, { kind: 'face', face: top });
  ok(!par.ok && par.code === 'parallel-planes', 'ядро: грани параллельны');
  const parScene = S.buildScene(c, opts(c, { facePlanes: [base, top] }));
  ok(
    typeof parScene.notice === 'string' && parScene.notice.includes('параллельны'),
    'сцена: сообщение о параллельности',
  );

  // Камера «смотреть на плоскость прямо»: взгляд вдоль нормали плоскости.
  const n = S.vnorm([1, 2, 3]);
  const cam = S.facingPlane(n, S.DEFAULT_CAMERA);
  const b = S.basisOf(cam);
  ok(S.vlen(S.vcross(b.toward, n)) < 1e-9, 'камера перпендикулярна плоскости');
  ok(S.vdot(b.toward, n) > 0, 'камера с ближней стороны плоскости');
  // Поворот и плавный переход камеры не выходят за пределы наклона.
  const turned = S.orbit(S.DEFAULT_CAMERA, 500, -5000);
  ok(Math.abs(turned.pitch) <= S.MAX_PITCH + 1e-9, 'наклон камеры ограничен');
  const mid = S.lerpCamera(S.DEFAULT_CAMERA, cam, 0.5);
  ok(Number.isFinite(mid.yaw) && Number.isFinite(mid.pitch), 'промежуточная камера');
}

/* ── Рисунок ────────────────────────────────────────────── */

const R = {
  ...requireSrc('lib/zadanie15/render/scena.ts'),
  ...requireSrc('lib/zadanie15/render/vidimost.ts'),
  ...requireSrc('lib/zadanie15/render/razrez.ts'),
  ...requireSrc('lib/zadanie15/render/naturalnaya.ts'),
  ...requireSrc('lib/zadanie15/render/metki.ts'),
  ...requireSrc('lib/zadanie15/render/eksport.ts'),
  ...requireSrc('lib/zadanie15/render/primery.ts'),
};
const unit = (v) => {
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
};
/* Взгляд спереди-справа-сверху: ближе всех B_1, дальше всех D. */
const K0 = unit([0.4, -1, 0.6]);
const orto = { vid: 'orto', k: K0 };
const persp = { vid: 'persp', glaz: K0.map((x, i) => 3 + x * 400 + (i === 2 ? 0 : 0)) };
const near = (a, b) => Math.abs(a - b) < 1e-6;
const ptEq = (a, b) => a.every((x, i) => near(x, b[i]));

// Куб: невидимы ровно три ребра — те, что сходятся в D.
{
  const sc = R.scena(cube(6));
  const D = [0, 6, 0];
  for (const [kam, nm] of [
    [orto, 'параллельная'],
    [persp, 'центральная'],
  ]) {
    const ls = R.linii(sc, kam);
    const hidden = ls.filter((l) => !l.vidno);
    eqStr(hidden.length, 3, `куб, ${nm} проекция — невидимых рёбер`);
    ok(
      hidden.every((l) => ptEq(l.a, D) || ptEq(l.b, D)),
      `куб, ${nm} проекция — невидимые рёбра сходятся в D`,
    );
  }
}

// Стороны сечения A_1BD: A_1B в передней грани видна, BD (в основании)
// и A_1D (в левой грани) — штрихом.
{
  const sc = R.PRIMERY.find((p) => p.id === 'kub-treugolnik').build();
  const ls = R.linii(sc, orto).filter((l) => l.vid === 'sechenie');
  eqStr(ls.length, 3, 'A_1BD — сторон без разрывов');
  const A1 = [0, 0, 6];
  const B = [6, 0, 0];
  const side = (p, q) =>
    ls.find((l) => (ptEq(l.a, p) && ptEq(l.b, q)) || (ptEq(l.a, q) && ptEq(l.b, p)));
  ok(side(A1, B)?.vidno === true, 'A_1BD — сторона A_1B видна');
  ok(side(B, [0, 6, 0])?.vidno === false, 'A_1BD — сторона BD штрихом');
  ok(side(A1, [0, 6, 0])?.vidno === false, 'A_1BD — сторона A_1D штрихом');
}

// Вспомогательные прямые пятиугольника: куски покрывают отрезок без
// дыр; след YC в задней грани закрыт, его продолжение за куб — нет.
{
  const sc = R.PRIMERY.find((p) => p.id === 'kub-pyatiugolnik').build();
  const T = sc.tela;
  const eps = sc.razmer * 1e-7;
  for (const o of sc.otrezki) {
    const k = R.kuskiOtrezka(o.a, o.b, T, orto, eps);
    ok(
      near(k[0].t0, 0) &&
        near(k.at(-1).t1, 1) &&
        k.every((x, i) => i === 0 || near(k[i - 1].t1, x.t0)),
      'отрезок построения разбит на куски без дыр',
    );
  }
  const C = [6, 6, 0];
  const Y = [-3, 6, 6];
  const yc = sc.otrezki.find((o) => o.vid === 'vspom' && ptEq(o.a, Y) && ptEq(o.b, C));
  ok(yc !== undefined, 'пятиугольник — есть след YC');
  if (yc) {
    const k = R.kuskiOtrezka(yc.a, yc.b, T, orto, eps);
    ok(k.some((x) => x.vidno) && k.some((x) => !x.vidno), 'след YC: часть видна, часть штрихом');
    // Точка следа внутри задней грани CC_1D_1D (x = 3) — закрыта.
    ok(R.zakrytaKemTo([3, 6, 2], T, orto, eps), 'точка задней грани закрыта');
    ok(!R.zakrytaKemTo([3, 0, 2], T, orto, eps), 'точка передней грани видна');
  }
  eqStr(
    sc.metki
      .filter((m) => m.vid === 'tochka')
      .map((m) => m.name)
      .join(','),
    'M,N,X,Y,K,L',
    'пятиугольник — точки построения',
  );
  eqStr(
    sc.sechenie.names.filter(Boolean).sort().join(','),
    'C,K,L,M,N',
    'пятиугольник — имена вершин сечения',
  );
}

// Разрез: объёмы частей в сумме — объём куба; A_1BD отрезает 1/6.
{
  const sc = R.PRIMERY.find((p) => p.id === 'kub-treugolnik').build();
  const vol = (t) =>
    t.grani.reduce((s, g) => {
      let a = [0, 0, 0];
      g.pts.forEach((p, i) => {
        const q = g.pts[(i + 1) % g.pts.length];
        a = [
          a[0] + p[1] * q[2] - p[2] * q[1],
          a[1] + p[2] * q[0] - p[0] * q[2],
          a[2] + p[0] * q[1] - p[1] * q[0],
        ];
      });
      const area = (a[0] * g.n[0] + a[1] * g.n[1] + a[2] * g.n[2]) / 2;
      return s + (area * g.c) / 3;
    }, 0);
  const { plyus, minus } = R.razrezat(sc.tela[0], sc.sechenie, sc.razmer);
  const [v1, v2] = [vol(plyus), vol(minus)].sort((a, b) => a - b);
  ok(near(v1, 36) && near(v2, 180), `разрез куба по A_1BD — объёмы ${v1}, ${v2}`);
  eqStr(Math.min(plyus.grani.length, minus.grani.length), 4, 'отрезанная часть — тетраэдр');
  ok(
    [plyus, minus].every((t) => t.rebra.every((r) => r.f[0] !== r.f[1])),
    'у частей каждое ребро — общее у двух граней',
  );
}

// Натуральная величина: правильный шестиугольник со стороной 3√2.
{
  const sc = R.PRIMERY.find((p) => p.id === 'kub-shestiugolnik').build();
  const nv = R.naturalnaya(sc.sechenie);
  eqStr(nv.pts.length, 6, 'шестиугольник — вершин в натуральную величину');
  ok(
    nv.storony.every((x) => near(x, 3 * Math.SQRT2)),
    'шестиугольник — стороны 3√2',
  );
}

// Подписи не налезают друг на друга.
{
  const z = [
    { p: [100, 100], w: 20, h: 20 },
    { p: [104, 100], w: 20, h: 20 },
    { p: [100, 106], w: 20, h: 20 },
  ];
  const pos = R.razlozhit(z, [], [100, 100]);
  const boxes = pos.map((q, i) => [q.x, q.y, q.x + z[i].w, q.y + z[i].h]);
  const inter = (a, b) =>
    Math.min(a[2], b[2]) > Math.max(a[0], b[0]) && Math.min(a[3], b[3]) > Math.max(a[1], b[1]);
  ok(
    !inter(boxes[0], boxes[1]) && !inter(boxes[0], boxes[2]) && !inter(boxes[1], boxes[2]),
    'подписи не пересекаются',
  );
}

// Школьный ракурс: сечение не смотрит ребром, D остаётся невидимой.
for (const p of R.PRIMERY) {
  const sc = p.build();
  const k = R.shkolnyyRakurs(sc);
  const cos = Math.abs(k[0] * sc.sechenie.n[0] + k[1] * sc.sechenie.n[1] + k[2] * sc.sechenie.n[2]);
  ok(cos > 0.2, `${p.id}: сечение в школьном ракурсе видно (cos = ${cos.toFixed(2)})`);
  ok(k[0] > 0 && k[1] < 0 && k[2] > 0, `${p.id}: ракурс спереди-справа-сверху`);
}

// SVG для экспорта: все сцены витрины собираются; у куба три штриха.
{
  for (const p of R.PRIMERY) {
    const svg = R.chertezhSvg(p.build(), K0, [0, 0, 1]);
    ok(svg.startsWith('<svg') && svg.includes('<polygon'), `SVG витрины: ${p.id}`);
  }
  const svg = R.chertezhSvg(R.scena(cube(6)), K0, [0, 0, 1]);
  eqStr((svg.match(/stroke-dasharray/g) ?? []).length, 3, 'SVG куба — штрихом три ребра');
  eqStr(
    R.imyaSvg('A_1'),
    '<tspan font-style="italic">A</tspan><tspan baseline-shift="sub" font-size="70%">1</tspan>',
    'имя A_1 в SVG',
  );
  ok(R.imyaSvg("K'").includes('′'), "имя K' в SVG — со штрихом");
}

/* ── Итог ───────────────────────────────────────────────── */

console.log(`Проверок ядра №15: ${checks}`);
if (problems.length > 0) {
  console.log(`проблем: ${problems.length}`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}
console.log('проблем: 0');
