/**
 * Сценарии витрины этапа 2.5: три построения на кубе, у каждого —
 * построение из ядра и какие плоскости граней продлены листом.
 *
 * Шаги записаны в самом построении (порядок создания объектов), по
 * ним работает пошаговый показ. Прямые пересечения плоскостей
 * строятся здесь же: в режиме «изучение» сцена их показывает, в
 * «тренажёре» прячет, пока ученик не построит их сам.
 */

import { Construction, type ObjId, cube, faceIndex, rat } from '../core';

export interface Scenario {
  id: string;
  title: string;
  /** Подводка витрины; формулы в `$…$`, рисуется через typeset. */
  lead: string;
  build: () => { c: Construction; facePlanes: number[] };
}

function must<T>(r: { ok: true; value: T } | { ok: false; message: string }): T {
  if (!r.ok) throw new Error(r.message);
  return r.value;
}

/* 1. Куб, плоскость (MNK) и плоскость основания: след.
   M — середина AB, N на CC_1 (CN : NC_1 = 1 : 2), K на DD_1
   (DK : KD_1 = 2 : 1). След α ∩ (ABC) проходит через M; вторая общая
   точка Y — там, где α ∩ (BB_1C_1C) пересекает ребро BC. */
const trace: Scenario = {
  id: 'sled',
  title: 'След плоскости на основании',
  lead: 'Куб, плоскость $\\alpha = (MNK)$ и плоскость основания. Линия пересечения появляется сама, как только есть обе плоскости; вторая общая точка строится на ребре $BC$.',
  build: () => {
    const poly = cube(6);
    const c = new Construction(poly);
    const M = must(c.pointOnEdge('A', 'B', rat(1, 2), 'M'));
    const N = must(c.pointOnEdge('C', 'C_1', rat(1, 3), 'N'));
    const K = must(c.pointOnEdge('D', 'D_1', rat(2, 3), 'K'));
    const alpha = must(c.plane3(M, N, K, '\\alpha'));
    const base = faceIndex(poly, 'ABCD');
    const right = faceIndex(poly, 'BB_1C_1C');
    must(c.planeMeet({ kind: 'plane', id: alpha }, { kind: 'face', face: base }));
    const l2 = must(c.planeMeet({ kind: 'plane', id: alpha }, { kind: 'face', face: right }));
    const bc = c.edgeLine('B', 'C');
    must(c.intersect(l2, bc, 'Y'));
    return { c, facePlanes: [base, right] };
  },
};

/* 2. Сечение пятиугольником через следы на продолжениях рёбер.
   M, N — середины A_1B_1 и A_1D_1, K на CC_1 (CK : KC_1 = 1 : 2).
   MN — след α на верхней грани; X и Y — на продолжениях B_1C_1 и
   D_1C_1; через них и K — следы на боковых гранях, P и Q — на BB_1 и DD_1. */
const pentagon: Scenario = {
  id: 'pyatiugolnik',
  title: 'Пятиугольник через следы на продолжениях рёбер',
  lead: 'Следы плоскости на верхней и боковых гранях. Точки $X$ и $Y$ лежат на продолжениях рёбер — кандидаты в вершины отмечаются кружками, вершины сечения появляются там, где следы пересекают рёбра.',
  build: () => {
    const poly = cube(6);
    const c = new Construction(poly);
    const M = must(c.pointOnEdge('A_1', 'B_1', rat(1, 2), 'M'));
    const N = must(c.pointOnEdge('A_1', 'D_1', rat(1, 2), 'N'));
    const K = must(c.pointOnEdge('C', 'C_1', rat(1, 3), 'K'));
    const alpha = must(c.plane3(M, N, K, '\\alpha'));
    const top = faceIndex(poly, 'A_1B_1C_1D_1');
    const right = faceIndex(poly, 'BB_1C_1C');
    const back = faceIndex(poly, 'CC_1D_1D');
    const a = { kind: 'plane', id: alpha } as const;
    must(c.planeMeet(a, { kind: 'face', face: top }));
    const X = must(c.intersect(must(c.lineThrough(M, N)), c.edgeLine('B_1', 'C_1'), 'X'));
    const Y = must(c.intersect(must(c.lineThrough(M, N)), c.edgeLine('D_1', 'C_1'), 'Y'));
    must(c.planeMeet(a, { kind: 'face', face: right }));
    must(c.intersect(must(c.lineThrough(X, K)), c.edgeLine('B', 'B_1'), 'P'));
    must(c.planeMeet(a, { kind: 'face', face: back }));
    must(c.intersect(must(c.lineThrough(Y, K)), c.edgeLine('D', 'D_1'), 'Q'));
    return { c, facePlanes: [top, right, back] };
  },
};

/* 3. Две плоскости через одну точку: α = (ACM), β = (BDM), M —
   середина BB_1. Линия α ∩ β проходит через M и через вторую общую
   точку O = AC ∩ BD. */
const twoPlanes: Scenario = {
  id: 'dve-ploskosti',
  title: 'Две плоскости через одну точку',
  lead: '$\\alpha = (ACM)$ и $\\beta = (BDM)$ проходят через $M$ — середину $BB_1$. Линия пересечения сразу проходит через $M$; вторая общая точка $O = AC \\cap BD$ строится в плоскости основания.',
  build: () => {
    const poly = cube(6);
    const c = new Construction(poly);
    const M = must(c.pointOnEdge('B', 'B_1', rat(1, 2), 'M'));
    const alpha = must(c.plane3(c.vertex('A'), c.vertex('C'), M, '\\alpha'));
    const beta = must(c.plane3(c.vertex('B'), c.vertex('D'), M, '\\beta'));
    must(c.planeMeet({ kind: 'plane', id: alpha }, { kind: 'plane', id: beta }));
    const ac = must(c.lineThrough(c.vertex('A'), c.vertex('C')));
    const bd = must(c.lineThrough(c.vertex('B'), c.vertex('D')));
    must(c.intersect(ac, bd, 'O'));
    return { c, facePlanes: [] };
  },
};

export const SCENARIOS: readonly Scenario[] = [trace, pentagon, twoPlanes];

/** Идентификатор прямой пересечения по ссылке на плоскости — для тестов. */
export type { ObjId };
