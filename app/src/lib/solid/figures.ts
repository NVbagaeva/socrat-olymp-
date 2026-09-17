/**
 * Сборщики тел: из чисел — модель в пространстве.
 *
 * Здесь описано, как устроены фигуры (вершины, грани, имена), но не
 * как они выглядят: проекция и видимость — дело движка.
 *
 * Расположение букв — как в учебнике и в задачнике: A слева-спереди,
 * обход основания против часовой стрелки, если смотреть сверху;
 * верхние вершины призм — те же буквы с индексом 1.
 */

import { type Polyhedron, orientOutward } from './model';
import { type Vec3, add, centroid, sub } from './vec';

const DEG = Math.PI / 180;

/** Индекс в имени вершины для описаний: A1 → A₁. */
export function subscript(name: string): string {
  return name.replace(/\d/g, (d) => String.fromCharCode(0x2080 + Number(d)));
}

/** Имена вершин строкой через запятую с индексами: для alt. */
export function namesText(names: readonly (string | null)[]): string {
  return names
    .filter((n): n is string => n !== null)
    .map(subscript)
    .join('');
}

/**
 * Правильный многоугольник в горизонтальной плоскости.
 * Первая вершина — под углом start (градусы, от оси x против часовой
 * стрелки сверху), дальше против часовой стрелки.
 */
export function regularPolygon(n: number, R: number, z: number, start: number): Vec3[] {
  return Array.from({ length: n }, (_, k) => {
    const u = (start + (360 / n) * k) * DEG;
    return [R * Math.cos(u), R * Math.sin(u), z];
  });
}

/** С какого угла начинать обход, чтобы буквы стояли как в задачнике. */
export function polygonStart(n: number): number {
  switch (n) {
    case 3:
      return 150; /* A слева, B спереди, C справа */
    case 4:
      return 225; /* A слева-спереди, B справа-спереди */
    case 6:
      return 180; /* A слева, BC — переднее ребро */
    default:
      return 270 - 360 / n / 2 - 360 / n; /* одна вершина спереди */
  }
}

/** Буквы основания: A, B, C, … */
export function letters(n: number): string[] {
  return Array.from({ length: n }, (_, k) => String.fromCharCode(65 + k));
}

/** Призма над основанием: верх — тот же многоугольник, сдвинутый на shift. */
export function prism(
  base: Vec3[],
  shift: Vec3,
  names: string[] = letters(base.length),
): Polyhedron {
  const n = base.length;
  const top = base.map((p) => add(p, shift));
  const vertices = [...base, ...top];
  const faces: number[][] = [
    Array.from({ length: n }, (_, k) => k),
    Array.from({ length: n }, (_, k) => n + k),
  ];
  for (let k = 0; k < n; k += 1) {
    const next = (k + 1) % n;
    faces.push([k, next, n + next, n + k]);
  }
  return {
    kind: 'polyhedron',
    vertices,
    faces: orientOutward(vertices, faces),
    names: [...names, ...names.map((s) => `${s}1`)],
  };
}

/** Прямая призма высоты h. */
export function rightPrism(base: Vec3[], h: number, names?: string[]): Polyhedron {
  return prism(base, [0, 0, h], names);
}

/** Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами a, b, c. */
export function box(a: number, b: number, c: number): Polyhedron {
  return rightPrism(
    [
      [0, 0, 0],
      [a, 0, 0],
      [a, b, 0],
      [0, b, 0],
    ],
    c,
  );
}

/** Правильная n-угольная призма: радиус описанной окружности R, высота h. */
export function regularPrism(n: number, R: number, h: number): Polyhedron {
  return rightPrism(regularPolygon(n, R, 0, polygonStart(n)), h);
}

/** Пирамида: основание и вершина. */
export function pyramid(
  base: Vec3[],
  apex: Vec3,
  names: string[] = letters(base.length),
  apexName = 'S',
): Polyhedron {
  const n = base.length;
  const vertices = [...base, apex];
  const faces: number[][] = [Array.from({ length: n }, (_, k) => k)];
  for (let k = 0; k < n; k += 1) {
    faces.push([k, (k + 1) % n, n]);
  }
  return {
    kind: 'polyhedron',
    vertices,
    faces: orientOutward(vertices, faces),
    names: [...names, apexName],
  };
}

/** Правильная n-угольная пирамида: вершина над центром основания. */
export function regularPyramid(n: number, R: number, h: number): Polyhedron {
  return pyramid(regularPolygon(n, R, 0, polygonStart(n)), [0, 0, h]);
}

/** Усечённая пирамида: два подобных основания. */
export function frustumPyramid(n: number, R: number, r: number, h: number): Polyhedron {
  const start = polygonStart(n);
  const base = regularPolygon(n, R, 0, start);
  const top = regularPolygon(n, r, h, start);
  const vertices = [...base, ...top];
  const faces: number[][] = [
    Array.from({ length: n }, (_, k) => k),
    Array.from({ length: n }, (_, k) => n + k),
  ];
  for (let k = 0; k < n; k += 1) {
    const next = (k + 1) % n;
    faces.push([k, next, n + next, n + k]);
  }
  const names = letters(n);
  return {
    kind: 'polyhedron',
    vertices,
    faces: orientOutward(vertices, faces),
    names: [...names, ...names.map((s) => `${s}1`)],
  };
}

/** Правильный тетраэдр ABCD с ребром a. */
export function tetrahedron(a: number): Polyhedron {
  const R = a / Math.sqrt(3);
  const base = regularPolygon(3, R, 0, polygonStart(3));
  return pyramid(base, [0, 0, a * Math.sqrt(2 / 3)], ['A', 'B', 'C'], 'D');
}

/** Центр основания многогранника: среднее его первых n вершин. */
export function baseCenter(body: Polyhedron, n: number): Vec3 {
  return centroid(body.vertices.slice(0, n));
}

/** Вершина многогранника по имени. */
export function vertex(body: Polyhedron, name: string): Vec3 {
  const index = (body.names ?? []).indexOf(name);
  const p = body.vertices[index];
  if (index < 0 || p === undefined) {
    throw new Error(`Нет вершины ${name}`);
  }
  return p;
}

/** Направление из точки a в точку b. */
export function dir(a: Vec3, b: Vec3): Vec3 {
  return sub(b, a);
}
