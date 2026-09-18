/**
 * Общее для прототипов раздела VI (шар).
 *
 * Точные площадь 4πr² и объём 4/3·πr³ содержат π, и второго способа
 * посчитать их с нуля нет — как у конуса и цилиндра. Поэтому шар
 * приближается многогранником: вершины лежат на сфере, грани —
 * четырёхугольники поясов и треугольники у полюсов.
 *
 * Важно здесь не само приближение, а его свойство: сетка граней
 * у всех шаров одна и та же, а вершины отличаются только общим
 * множителем r. Значит площадь любой грани растёт ровно как r²,
 * а вклад любой грани в объём — ровно как r³, и в ОТНОШЕНИИ двух
 * шаров погрешность приближения сокращается без остатка. Все три
 * прототипа раздела — отношения либо суммы площадей, поэтому
 * такой проверки достаточно, и она нигде не повторяет формулу.
 */

import { polyhedronVolume, surfaceArea } from '../../solid/measure';
import { type Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';

/** Долей по экватору и поясов от полюса до полюса. */
const SEGMENTS = 24;
const STACKS = 12;

/**
 * Шар приближением: вершины на сфере радиуса r, пояса
 * четырёхугольниками, у полюсов треугольники. Обход граней —
 * против часовой стрелки снаружи, как того ждут измерители.
 */
export function ballApprox(r: number): Polyhedron {
  const vertices: Vec3[] = [[0, 0, r]];
  for (let i = 1; i < STACKS; i += 1) {
    const theta = (Math.PI * i) / STACKS;
    const z = Math.cos(theta);
    const ring = Math.sin(theta);
    for (let j = 0; j < SEGMENTS; j += 1) {
      const phi = (2 * Math.PI * j) / SEGMENTS;
      vertices.push([r * ring * Math.cos(phi), r * ring * Math.sin(phi), r * z]);
    }
  }
  vertices.push([0, 0, -r]);

  const south = vertices.length - 1;
  /** Номер вершины пояса i (1…STACKS−1) и доли j. */
  const at = (i: number, j: number): number => 1 + (i - 1) * SEGMENTS + (j % SEGMENTS);

  const faces: number[][] = [];
  for (let j = 0; j < SEGMENTS; j += 1) {
    faces.push([0, at(1, j), at(1, j + 1)]);
  }
  for (let i = 1; i < STACKS - 1; i += 1) {
    for (let j = 0; j < SEGMENTS; j += 1) {
      faces.push([at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]);
    }
  }
  for (let j = 0; j < SEGMENTS; j += 1) {
    faces.push([south, at(STACKS - 1, j + 1), at(STACKS - 1, j)]);
  }

  return { kind: 'polyhedron', vertices, faces };
}

/** Площадь поверхности приближения: годится для отношений и сумм. */
export function approxArea(r: number): number {
  return surfaceArea(ballApprox(r));
}

/** Объём приближения: годится для отношений. */
export function approxVolume(r: number): number {
  return polyhedronVolume(ballApprox(r));
}

/**
 * Поверхность в долях от поверхности единичного шара. У точного
 * шара это ровно r², но здесь число получено сложением площадей
 * граней настоящего многогранника, а не формулой 4πr².
 */
export function areaUnits(r: number): number {
  return approxArea(r) / approxArea(1);
}

/** Объём в долях от объёма единичного шара: у точного это r³. */
export function volumeUnits(r: number): number {
  return approxVolume(r) / approxVolume(1);
}

export { solveBySearch } from '../search';
