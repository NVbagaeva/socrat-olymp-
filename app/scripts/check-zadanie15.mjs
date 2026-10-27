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
       раскладка подписей, SVG для экспорта, сцены витрины;
     — сечение по трём точкам: треугольник … шестиугольник на кубе и
       параллелепипеде, через вершину и через ребро, совпадение с
       гранью, касание, точки на одной прямой и не на поверхности;
       инструмент выбора (счётчик, отмена, сброс, имена новых вершин),
       аналитическая видимость сторон сечения и контура плоскости.

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
  /* Индекс — общей типографикой рисунков (lib/risunki/shrifty.js): буква
     курсивом, индекс tspan class="indeks" — 70 %, опущен, прямой. */
  const a1 = R.imyaSvg('A_1');
  ok(
    a1.startsWith('<tspan font-style="italic">A</tspan>') &&
      /<tspan class="indeks" font-size="70%" font-style="normal" dy="[0-9.]+em"[^>]*>1<\/tspan>$/.test(
        a1,
      ),
    `имя A_1 в SVG — буква курсивом и нижний индекс: ${a1}`,
  );
  ok(/>13<\/tspan>$/.test(R.imyaSvg('A_{13}')), 'имя A_{13} — двузначный индекс одним блоком');
  ok(R.imyaSvg("K'").includes('′'), "имя K' в SVG — со штрихом");
}

/* ── Сечение по трём точкам ─────────────────────────────── */

{
  const T = K;
  // Точка на ребре a→b с параметром t (точно).
  const na = (poly, a, b, t = [1, 2]) => {
    const A = poly.vertices[T.vertexIndex(poly, a)].p;
    const B = poly.vertices[T.vertexIndex(poly, b)].p;
    const tt = rat(t[0], t[1]);
    const f = (k) => T.add(A[k], T.mul(T.sub(B[k], A[k]), tt));
    return { x: f('x'), y: f('y'), z: f('z') };
  };
  const ve = (poly, n) => poly.vertices[T.vertexIndex(poly, n)].p;
  const sec3 = (poly, pts) => T.sectionByThreePoints(poly, pts);
  const vida = (r) => (r.ok ? T.polygonKind(r.section.vertices.map((v) => v.p)) : r.code);

  for (const [poly, nm] of [
    [cube(6), 'куб'],
    [box(4, 6, 3), 'параллелепипед'],
  ]) {
    const tri = sec3(poly, [ve(poly, 'A_1'), ve(poly, 'B'), ve(poly, 'D')]);
    ok(
      tri.ok && tri.kind === 'polygon' && tri.section.vertices.length === 3,
      `${nm}: A_1BD — треугольник`,
    );
    const quad = sec3(poly, [na(poly, 'A_1', 'B_1'), na(poly, 'A_1', 'D_1'), ve(poly, 'B')]);
    ok(quad.ok && quad.section.vertices.length === 4, `${nm}: M, N, B — четырёхугольник (через D)`);
    ok(quad.ok && /трапеция/.test(vida(quad)), `${nm}: MNB — трапеция (${vida(quad)})`);
    const pent = sec3(poly, [na(poly, 'A_1', 'B_1'), na(poly, 'A_1', 'D_1'), ve(poly, 'C')]);
    ok(pent.ok && pent.section.vertices.length === 5, `${nm}: M, N, C — пятиугольник`);
    const hex = sec3(poly, [na(poly, 'A', 'B'), na(poly, 'B', 'C'), na(poly, 'C', 'C_1')]);
    ok(hex.ok && hex.section.vertices.length === 6, `${nm}: середины AB, BC, CC_1 — шестиугольник`);
    // Плоскость через вершины A и C_1 (и середины BB_1, DD_1).
    const vert = sec3(poly, [ve(poly, 'A'), na(poly, 'B', 'B_1'), na(poly, 'D', 'D_1')]);
    ok(
      vert.ok &&
        vert.section.vertices.length === 4 &&
        vert.section.vertices.filter((v) => v.vertex !== undefined).length === 2,
      `${nm}: через вершину A — четырёхугольник с вершинами A и C_1`,
    );
    // Плоскость через ребро AB и C_1: прямоугольник ABC_1D_1.
    const edge = sec3(poly, [ve(poly, 'A'), ve(poly, 'B'), ve(poly, 'C_1')]);
    ok(
      edge.ok &&
        edge.section.vertices.length === 4 &&
        edge.section.vertices.every((v) => v.vertex !== undefined) &&
        vida(edge) === 'прямоугольник',
      `${nm}: через ребро AB — прямоугольник ABC_1D_1 (${vida(edge)})`,
    );
    // Вершины сечения без дублей и упорядочены обходом: соседние
    // вершины лежат в общей грани.
    for (const r of [tri, quad, pent, hex, vert, edge]) {
      const vs = r.section.vertices;
      const keys = new Set(vs.map((v) => T.toArray(v.p).join(',')));
      ok(keys.size === vs.length, `${nm}: вершины сечения без дублей`);
      ok(
        vs.every((v, i) => v.faces.some((f) => vs[(i + 1) % vs.length].faces.includes(f))),
        `${nm}: соседние вершины сечения — в одной грани (обход)`,
      );
    }
    // Совпадает с гранью.
    const face = sec3(poly, [ve(poly, 'A'), ve(poly, 'B'), na(poly, 'C', 'D')]);
    ok(
      face.ok && face.kind === 'face' && /ABCD/.test(face.note),
      `${nm}: три точки в грани — сечение-грань`,
    );
    // На одной прямой.
    const col = sec3(poly, [ve(poly, 'A'), na(poly, 'A', 'B', [1, 3]), ve(poly, 'B')]);
    ok(
      !col.ok && col.code === 'collinear' && /одной прямой/.test(col.message),
      `${nm}: три точки на прямой — отказ`,
    );
    const diag = sec3(poly, [ve(poly, 'A'), na(poly, 'A_1', 'B_1'), ve(poly, 'A')]);
    ok(!diag.ok && diag.code === 'same-point', `${nm}: совпадающие точки — отказ`);
    // Не на поверхности: центр тела, точка снаружи.
    const c0 = na(poly, 'A', 'C_1'); // центр тела — середина диагонали
    const off = sec3(poly, [ve(poly, 'A'), c0, ve(poly, 'B')]);
    ok(
      !off.ok && off.code === 'off-surface' && off.point === 1,
      `${nm}: точка внутри тела — отказ`,
    );
    const out = T.sectionByThreePoints(
      poly,
      [ve(poly, 'A'), K.v3n(-1, 0, 0), ve(poly, 'B')],
      ['A', 'X', 'B'],
    );
    ok(
      !out.ok && out.code === 'off-surface' && /\$X\$/.test(out.message),
      `${nm}: точка снаружи — отказ с именем`,
    );
  }

  // Вырожденные плоскости: касание в вершине, по ребру, мимо.
  const cb = cube(6);
  const tv = T.sectionByPlane(cb, { n: K.v3n(1, 1, 1), c: rat(0) });
  ok(!tv.ok && tv.code === 'touch-vertex' && /\$A\$/.test(tv.message), 'касание в вершине A');
  const te = T.sectionByPlane(cb, { n: K.v3n(0, 1, 1), c: rat(0) });
  ok(!te.ok && te.code === 'touch-edge' && /\$AB\$/.test(te.message), 'касание по ребру AB');
  const tn = T.sectionByPlane(cb, { n: K.v3n(1, 0, 0), c: rat(10) });
  ok(!tn.ok && tn.code === 'none', 'плоскость мимо фигуры');

  // Где точка на поверхности.
  eqStr(T.placeOnSurface(cb, K.v3n(0, 0, 0))?.kind, 'vertex', 'A — вершина');
  const pe = T.placeOnSurface(cb, K.v3n(2, 0, 0));
  ok(pe?.kind === 'edge' && K.ratStr(pe.t) === '1/3', 'точка AB, t = 1/3');
  eqStr(T.placeOnSurface(cb, K.v3n(2, 3, 0))?.kind, 'face', 'точка в грани ABCD');
  ok(T.placeOnSurface(cb, K.v3n(2, 3, 1)) === null, 'точка внутри — не на поверхности');
  ok(T.placeOnSurface(cb, K.v3n(2, 3, -1)) === null, 'точка снаружи — не на поверхности');
  const sf = T.snapOnFace(cb, T.faceIndex(cb, 'ABCD'), 0.49, 0.26);
  ok(
    sf.kind === 'face' && K.toArray(sf.p).join(',') === '1.5,3,0',
    `округление в грани до 1/12: ${K.toArray(sf.p)}`,
  );
  const se = T.snapOnEdge(cb, 0, 0.98);
  ok(se.kind === 'vertex', 'у конца ребра — вершина');
}

/* ── Инструмент: выбор точек ────────────────────────────── */

{
  const I = requireSrc('lib/zadanie15/render/instrument.ts');
  const poly = cube(6);
  const ei = (a, b) => K.edgeIndex(poly, a, b);
  const fwd = (a, b, t) => (poly.vertices[poly.edges[ei(a, b)].a].name === a ? t : 1 - t);
  const s = new I.SechenieTryokhTochek(poly);
  eqStr(s.podskazka, 'Выберите три точки на рёбрах или гранях (1/3)', 'подсказка 1/3');
  ok(s.naRebre(ei('A', 'B'), fwd('A', 'B', 0.52)), 'точка на AB взята');
  eqStr(s.podskazka, 'Выберите три точки на рёбрах или гранях (2/3)', 'подсказка 2/3');
  ok(!s.naRebre(ei('A', 'B'), fwd('A', 'B', 0.49)), 'та же точка второй раз не берётся');
  ok(/уже выбрана/.test(s.soobshchenie?.text ?? ''), 'сообщение «уже выбрана»');
  ok(s.vzyat(s.c.vertex('B')), 'вершина B взята');
  eqStr(s.podskazka, 'Выберите три точки на рёбрах или гранях (3/3)', 'подсказка 3/3');
  // Третья на прямой AB — отказ, остаёмся на 2/3.
  ok(!s.vzyat(s.c.vertex('A')), 'A на прямой MB — не берётся');
  ok(/одной прямой/.test(s.soobshchenie?.text ?? ''), 'сообщение «на одной прямой»');
  eqStr(s.schyot, 2, 'после отказа выбрано две точки');
  ok(s.naRebre(ei('C', 'C_1'), fwd('C', 'C_1', 0.5)), 'точка на CC_1 взята');
  ok(s.itog !== null, 'сечение построено');
  const sc = s.scena();
  // M и B на ребре AB: плоскость через ребро, сечение ABNK.
  eqStr(sc.sechenie?.pts.length, 4, 'сечение M, B, N — четырёхугольник');
  eqStr(
    sc.metki
      .filter((m) => m.vybrana)
      .map((m) => m.name)
      .sort()
      .join(','),
    'B,M,N',
    'выбранные точки подсвечены',
  );
  eqStr(
    sc.sechenie.names.join(','),
    sc.sechenie.names.filter((x) => typeof x === 'string' && x.length > 0).join(','),
    'у всех вершин сечения есть имена',
  );
  eqStr(sc.sechenie.names.join(','), 'A,B,N,K', 'новая вершина — следующая свободная буква K');
  ok(sc.ploskost?.length === 4, 'секущая плоскость — параллелограмм');
  ok(!s.vzyat(s.c.vertex('D')), 'четвёртая точка не берётся');
  // Отмена убирает сечение и новые вершины.
  s.otmenit();
  ok(s.itog === null && s.schyot === 2, 'отмена: две точки, сечения нет');
  ok(s.c.byName('N') === undefined && s.c.byName('K') === undefined, 'отмена: N и K удалены');
  ok(s.naGrani(K.faceIndex(poly, 'CC_1D_1D'), 0.5, 0.5), 'точка в грани взята');
  ok(s.itog !== null, 'сечение через точку грани');
  s.sbrosit();
  ok(s.schyot === 0 && s.itog === null && s.c.byName('M') === undefined, 'сброс выбора');
  // Три точки одной грани — сечение-грань с пояснением.
  s.vzyat(s.c.vertex('A'));
  s.vzyat(s.c.vertex('B'));
  s.naGrani(K.faceIndex(poly, 'ABCD'), 0.5, 0.5);
  ok(
    s.itog?.kind === 'face' && s.soobshchenie?.vid === 'info',
    'три точки в грани — сечение-грань',
  );
  eqStr(s.scena().sechenie?.pts.length, 4, 'сечение-грань нарисовано');
}

/* ── Видимость: аналитически ────────────────────────────── */

{
  const I = requireSrc('lib/zadanie15/render/instrument.ts');
  const poly = cube(6);
  const ei = (a, b) => K.edgeIndex(poly, a, b);
  const s = new I.SechenieTryokhTochek(poly);
  // Правильный шестиугольник: середины AB, BC, CC_1.
  s.naRebre(ei('A', 'B'), 0.5);
  s.naRebre(ei('B', 'C'), 0.5);
  s.naRebre(ei('C', 'C_1'), 0.5);
  const sc = s.scena();
  eqStr(sc.sechenie.pts.length, 6, 'шестиугольник инструментом');
  // Сторона на грани, повёрнутой от зрителя, — штрихом; на лицевой — сплошная.
  const tela = sc.tela;
  for (const k of [K0, unit([-0.5, -1, 0.4]), unit([0.6, 0.8, -0.5]), unit([0.2, 0.3, 1])]) {
    const kam = { vid: 'orto', k };
    const ls = R.linii(sc, kam).filter((l) => l.vid === 'sechenie');
    eqStr(ls.length, 6, 'стороны сечения не дробятся');
    for (const l of ls) {
      const o = sc.otrezki.find((x) => ptEq(x.a, l.a) && ptEq(x.b, l.b));
      const lic = o.grani.some((f) => R.licom(tela[0].grani[f], kam));
      ok(
        l.vidno === lic,
        `сторона сечения: видимость по грани (k = ${k.map((x) => x.toFixed(2))})`,
      );
    }
    // Контур плоскости: куски без дыр, есть видимые; закрытая часть —
    // ровно та, что проецируется на лицевые грани позади них.
    const pl = R.linii(sc, kam).filter((l) => l.vid === 'ploskost');
    ok(
      pl.some((l) => l.vidno),
      'контур плоскости частично виден',
    );
    for (const l of pl) {
      const m = [0, 1, 2].map((i) => (l.a[i] + l.b[i]) / 2);
      ok(
        R.zakrytaKemTo(m, tela, kam, 1e-9) === !l.vidno,
        'кусок контура: середина согласна с лучом',
      );
    }
  }
  // Отрезок, протыкающий куб насквозь спереди назад: виден до передней
  // грани (t = 1/4 точно), дальше закрыт.
  const kam = { vid: 'orto', k: unit([0.3, -1, 0.2]) };
  const k = R.kuskiOtrezka([3, -3, 3], [3, 9, 3], tela, kam, 1e-9);
  ok(k[0].vidno && Math.abs(k[0].t1 - 0.25) < 1e-12, `прокол передней грани: t = ${k[0].t1}`);
  ok(k.length >= 2 && !k[1].vidno, 'внутри куба — штрихом');
  // Взгляд ровно спереди: верхняя грань смотрит ребром. Рёбра по краю
  // видны, стороны сечения на ней — тоже (без мигания штриха).
  const front = { vid: 'orto', k: [0, -1, 0] };
  const rebra = R.linii(sc, front).filter((l) => l.vid === 'rebro');
  const A1B1 = rebra.find(
    (l) =>
      (ptEq(l.a, [0, 0, 6]) && ptEq(l.b, [6, 0, 6])) ||
      (ptEq(l.b, [0, 0, 6]) && ptEq(l.a, [6, 0, 6])),
  );
  ok(A1B1?.vidno === true, 'ребро A_1B_1 по краю — сплошное');
  const persp2 = { vid: 'persp', glaz: [3 + 40, 3 - 100, 3 + 50] };
  const ps = R.linii(sc, persp2);
  ok(
    ps.some((l) => !l.vidno) && ps.some((l) => l.vidno),
    'центральная проекция: есть сплошные и штрихи',
  );
  // SVG экспорта с плоскостью: плоскость, сечение, линии.
  const svg = R.chertezhSvg(sc, K0, [0, 0, 1]);
  ok((svg.match(/<polygon/g) ?? []).length === 2, 'SVG: заливки плоскости и сечения');
  ok(
    svg.indexOf('fill-opacity="0.08"') < svg.indexOf('fill-opacity="0.22"'),
    'SVG: плоскость под сечением',
  );
}

/* ── Итог ───────────────────────────────────────────────── */

console.log(`Проверок ядра №15: ${checks}`);
if (problems.length > 0) {
  console.log(`проблем: ${problems.length}`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}
console.log('проблем: 0');
