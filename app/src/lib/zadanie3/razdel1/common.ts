/**
 * Общее для прототипов раздела I.
 *
 * Условие задачи называет рёбра как придётся: DD₁, C₁D₁, B₁C₁ —
 * это те же три измерения параллелепипеда, что AA₁, AB, AD. Здесь
 * лежит перевод имени ребра в измерение и сборка тела по трём числам.
 */

import { box } from '../../solid/figures';
import { type Polyhedron } from '../../solid/model';
import { type Vec3 } from '../../solid/vec';

/** Измерение параллелепипеда: a — вдоль AB, b — вдоль AD, c — вверх. */
export type Dim = 'a' | 'b' | 'c';

const ALONG_A = ['AB', 'BA', 'CD', 'DC', 'A1B1', 'B1A1', 'C1D1', 'D1C1'];
const ALONG_B = ['AD', 'DA', 'BC', 'CB', 'A1D1', 'D1A1', 'B1C1', 'C1B1'];
const VERTICAL = ['AA1', 'A1A', 'BB1', 'B1B', 'CC1', 'C1C', 'DD1', 'D1D'];

/** Какое измерение задаёт это ребро. */
export function dimOf(edge: string): Dim {
  if (ALONG_A.includes(edge)) {
    return 'a';
  }
  if (ALONG_B.includes(edge)) {
    return 'b';
  }
  if (VERTICAL.includes(edge)) {
    return 'c';
  }
  throw new Error(`${edge} — не ребро параллелепипеда`);
}

/** Три числа условия по именам рёбер: сколько вдоль каждой оси. */
export function sides(
  names: readonly string[],
  values: readonly number[],
): [number, number, number] {
  const out: Record<Dim, number | undefined> = { a: undefined, b: undefined, c: undefined };
  names.forEach((name, i) => {
    const value = values[i];
    if (value === undefined) {
      throw new Error(`Нет числа для ребра ${name}`);
    }
    out[dimOf(name)] = value;
  });
  const { a, b, c } = out;
  if (a === undefined || b === undefined || c === undefined) {
    throw new Error('Три ребра должны задавать три разных измерения');
  }
  return [a, b, c];
}

/** Задают ли три имени рёбер три разных измерения. */
export function coversAllDims(names: readonly string[]): boolean {
  try {
    return new Set(names.map(dimOf)).size === 3;
  } catch {
    return false;
  }
}

/** Параллелепипед ABCDA₁B₁C₁D₁ по трём числам условия. */
export function boxOf(a: number, b: number, c: number): Polyhedron {
  return box(a, b, c);
}

/** Верхняя вершина под нижней: A → A₁. */
export function upper(name: string): string {
  return `${name}1`;
}

/** Только нижние вершины (без индекса) из перечня. */
export function baseNames(names: readonly string[]): string[] {
  return names.filter((n) => !/\d/.test(n));
}

/**
 * Координаты вершины по её имени: A слева-спереди снизу, дальше
 * против часовой стрелки, индекс 1 — верхнее основание.
 *
 * Это второй, независимый от движка способ получить точку: движок
 * собирает тело своим сборщиком, а формула прототипа считает по
 * этой таблице. Если правило букв где-то разошлось, два ответа
 * не совпадут, и автотест это поймает.
 */
export function pointOf(name: string, a: number, b: number, c: number): Vec3 {
  const top = /1$/.test(name);
  const base = name.replace(/1$/, '');
  const flat: Record<string, readonly [number, number]> = {
    A: [0, 0],
    B: [a, 0],
    C: [a, b],
    D: [0, b],
  };
  const xy = flat[base];
  if (xy === undefined) {
    throw new Error(`${name} — не вершина параллелепипеда`);
  }
  return [xy[0], xy[1], top ? c : 0];
}

/** Направляющий вектор прямой по двум вершинам. */
export function directionOf(
  line: readonly [string, string],
  a: number,
  b: number,
  c: number,
): Vec3 {
  const from = pointOf(line[0], a, b, c);
  const to = pointOf(line[1], a, b, c);
  return [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
}
