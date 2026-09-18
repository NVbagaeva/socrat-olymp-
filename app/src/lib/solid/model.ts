/**
 * Модель чертежа: тела в пространстве и пометки к ним.
 *
 * Чертёж не рисуется по экранным координатам: описывается фигура
 * в пространстве, а проекция, видимость рёбер и место подписей
 * вычисляются движком. Поэтому здесь нет ни пикселей, ни цветов.
 */

import type { ViewId } from './project';
import { type Vec3, at, centroid, dot, sub } from './vec';

/** Многогранник: вершины, грани по индексам, имена вершин. */
export interface Polyhedron {
  kind: 'polyhedron';
  vertices: Vec3[];
  /** Грани списками индексов, обход против часовой стрелки снаружи. */
  faces: number[][];
  /** Имена вершин: «A», «B1» (цифра — индекс). Пусто — без подписи. */
  names?: (string | null)[];
  /**
   * Прозрачное тело: своих рёбер не прячет ничего, кроме него самого,
   * и чужие линии сквозь него видны. Так рисуют внешнее тело
   * в комбинациях: куб вокруг шара, цилиндр вокруг призмы.
   */
  glass?: boolean;
  /** Не заливать грани: внутреннее тело в комбинации. */
  noFill?: boolean;
}

export interface Cylinder {
  kind: 'cylinder';
  /** Центр нижнего основания. */
  base: Vec3;
  r: number;
  h: number;
  glass?: boolean;
  /** Не рисовать нижнее основание: его уже рисует другое тело. */
  hideBase?: boolean;
  /** Высота жидкости в сосуде. */
  liquid?: number;
}

export interface Cone {
  kind: 'cone';
  /** Центр основания (у перевёрнутого — верхнего). */
  base: Vec3;
  r: number;
  h: number;
  /** Радиус верхнего основания усечённого конуса. */
  top?: number;
  glass?: boolean;
  hideBase?: boolean;
  /** Вершиной вниз: сосуд. Основание тогда сверху. */
  inverted?: boolean;
  /** Высота жидкости в сосуде, от вершины. */
  liquid?: number;
}

export interface Sphere {
  kind: 'sphere';
  center: Vec3;
  r: number;
  glass?: boolean;
  /** Рисовать ли экватор. По умолчанию да. */
  equator?: boolean;
  /** Сечения горизонтальными плоскостями: высоты от центра. */
  sections?: number[];
}

export type Body = Polyhedron | Cylinder | Cone | Sphere;

/** Отмеченная точка: центр основания, середина ребра. */
export interface Mark {
  p: Vec3;
  label?: string;
}

/** Роль элемента на чертеже: зачем он здесь. */
export type LineRole = 'искомое' | 'построение';

/** Вспомогательный отрезок: высота, апофема, радиус. */
export interface Line {
  a: Vec3;
  b: Vec3;
  /** Подпись курсивом у середины: «h», «l», «R». */
  label?: string;
  /**
   * 'искомое' — то, что названо в вопросе условия: синим и толще.
   * 'построение' — дополнительное построение разбора: оранжевым.
   * Не задана — 'построение': так рисовались все линии раньше.
   */
  role?: LineRole;
}

/** Знак прямого угла в точке at между направлениями u и v. */
export interface RightAngle {
  at: Vec3;
  u: Vec3;
  v: Vec3;
}

/**
 * Дуга угла в точке at между направлениями u и v: знак «вот этот
 * угол». Знак прямого угла рисует RightAngle, а здесь угол любой,
 * поэтому дуга.
 */
export interface AngleArc {
  at: Vec3;
  u: Vec3;
  v: Vec3;
  /** Подпись у дуги: «60°», «α». */
  label?: string;
  /** Как у Line: искомое синим, построение оранжевым. */
  role?: LineRole;
}

/** Сечение или выделенная часть: многоугольник с заливкой. */
export interface Section {
  points: Vec3[];
}

/** Одиночная подпись: площадь основания S, где отрезка нет. */
export interface Note {
  p: Vec3;
  text: string;
}

/** Число на чертеже: длина ребра. */
export interface Measure {
  a: Vec3;
  b: Vec3;
  text: string;
}

export interface Model {
  /** Описание для голосового доступа. */
  alt: string;
  /**
   * Вид: ortho для тел вращения, пирамид и комбинаций, cabinet для призм
   * и параллелепипедов, где переднее ребро AB должно быть горизонтальным.
   * Не указан — ortho.
   */
  view?: ViewId;
  bodies: Body[];
  marks?: Mark[];
  lines?: Line[];
  angles?: RightAngle[];
  arcs?: AngleArc[];
  sections?: Section[];
  measures?: Measure[];
  notes?: Note[];
}

/* ── Помощники для сборки многогранников ────────────────────────── */

/** Нормаль грани по трём первым несовпадающим вершинам. */
export function faceNormal(vertices: readonly Vec3[], face: readonly number[]): Vec3 {
  /* Нормаль по Ньюэллу: устойчива к почти коллинеарным вершинам. */
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < face.length; i += 1) {
    const a = at(vertices, at(face, i));
    const b = at(vertices, at(face, (i + 1) % face.length));
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return [nx, ny, nz];
}

/**
 * Развернуть грани выпуклого тела наружу: нормаль каждой грани
 * должна смотреть от центра тела.
 */
export function orientOutward(vertices: readonly Vec3[], faces: number[][]): number[][] {
  const center = centroid(vertices);
  return faces.map((face) => {
    const n = faceNormal(vertices, face);
    const p = at(vertices, at(face, 0));
    return dot(n, sub(p, center)) < 0 ? face.slice().reverse() : face;
  });
}

/** Рёбра многогранника из его граней, каждое один раз. */
export function polyhedronEdges(faces: readonly (readonly number[])[]): [number, number][] {
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  faces.forEach((face) => {
    for (let i = 0; i < face.length; i += 1) {
      const a = at(face, i);
      const b = at(face, (i + 1) % face.length);
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push(a < b ? [a, b] : [b, a]);
      }
    }
  });
  return edges;
}

/** Не пустая ли грань на самом деле (три вершины не на одной прямой). */
export function faceIsFlat(vertices: readonly Vec3[], face: readonly number[]): boolean {
  const n = faceNormal(vertices, face);
  return dot(n, n) > 1e-12;
}
