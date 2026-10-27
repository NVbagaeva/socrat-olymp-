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
import { type ViewId, viewOf } from './project';
import { type Vec3, add, centroid, sub } from './vec';

const DEG = Math.PI / 180;

/** Индекс в имени вершины для описаний: A1 → A₁. */
export function subscript(name: string): string {
  return name.replace(/\d/g, (d) => String.fromCharCode(0x2080 + Number(d)));
}

/** Имена вершин строкой через запятую с индексами: для alt. */
export function namesText(names: readonly (string | null)[]): string {
  const list = names.filter((n): n is string => n !== null);
  /* Пирамиду называют с вершины: SABCD, а не ABCDS. */
  const ordered = list.includes('S') ? ['S', ...list.filter((n) => n !== 'S')] : list;
  return ordered.map(subscript).join('');
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

/**
 * С какого угла начинать обход основания. Зависит от вида: в cabinet
 * сторона AB встаёт спереди и горизонтально, в ortho углы подобраны так,
 * чтобы ни одно ребро не легло вдоль луча зрения.
 */
export function polygonStart(n: number, view: ViewId = 'ortho'): number {
  return viewOf(view).polygonStart(n);
}

/**
 * Точка на видимом контуре шара: большой круг, обращённый к зрителю.
 * Радиус к такой точке на чертеже виден целиком и кончается ровно
 * на окружности шара; angle — угол на этом круге от правой точки
 * против часовой стрелки, градусы.
 */
export function sphereOutlinePoint(
  center: Vec3,
  r: number,
  angle: number,
  view: ViewId = 'ortho',
): Vec3 {
  return viewOf(view).spherePoint(center, r, angle * DEG);
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
export function regularPrism(n: number, R: number, h: number, view: ViewId = 'ortho'): Polyhedron {
  return rightPrism(regularPolygon(n, R, 0, polygonStart(n, view)), h);
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
export function regularPyramid(
  n: number,
  R: number,
  h: number,
  view: ViewId = 'ortho',
): Polyhedron {
  return pyramid(regularPolygon(n, R, 0, polygonStart(n, view)), [0, 0, h]);
}

/** Усечённая пирамида: два подобных основания. */
export function frustumPyramid(
  n: number,
  R: number,
  r: number,
  h: number,
  view: ViewId = 'ortho',
): Polyhedron {
  const start = polygonStart(n, view);
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
export function tetrahedron(a: number, view: ViewId = 'ortho'): Polyhedron {
  const R = a / Math.sqrt(3);
  const base = regularPolygon(3, R, 0, polygonStart(3, view));
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

/* ── Части тел вращения и тела из кубиков ───────────────────────── */

/** Точки дуги окружности в плоскости z: от угла a0 до a0 + alfa (градусы). */
function duga(r: number, z: number, a0: number, alfa: number): Vec3[] {
  const n = Math.max(8, Math.round(alfa / 4));
  return Array.from({ length: n + 1 }, (_, k) => {
    const u = ((a0 + (alfa * k) / n) * Math.PI) / 180;
    return [r * Math.cos(u), r * Math.sin(u), z] as Vec3;
  });
}

/**
 * Часть цилиндра, вырезанная двумя плоскостями через ось: центральный
 * угол alfa (градусы, меньше 360), дуга начинается с угла a0. Боковая
 * поверхность — полоски (gladkie): между ними рёбер нет, только контур.
 * Вершины: O, O1 — центры оснований; A, B, A1, B1 — концы дуг.
 */
export function sektorCilindra(r: number, h: number, alfa: number, a0 = 0): Polyhedron {
  const niz = [[0, 0, 0] as Vec3, ...duga(r, 0, a0, alfa)];
  const n = niz.length;
  const vertices = [...niz, ...niz.map((p) => add(p, [0, 0, h]))];
  /* Основание обходится против часовой стрелки сверху: O, дуга. */
  const faces: number[][] = [
    Array.from({ length: n }, (_, k) => n - 1 - k),
    Array.from({ length: n }, (_, k) => n + k),
  ];
  const gladkie: number[] = [];
  for (let k = 0; k < n; k += 1) {
    const next = (k + 1) % n;
    if (k > 0 && k < n - 1) gladkie.push(faces.length);
    faces.push([k, next, n + next, n + k]);
  }
  const imya = (k: number) => (k === 0 ? 'O' : k === 1 ? 'A' : k === n - 1 ? 'B' : null);
  return {
    kind: 'polyhedron',
    vertices,
    faces,
    gladkie,
    names: [...niz.map((_, k) => imya(k)), ...niz.map((_, k) => (imya(k) === null ? null : `${imya(k)}1`))],
  };
}

/**
 * Часть конуса, вырезанная двумя плоскостями через ось: основание —
 * круговой сектор с углом alfa (градусы), вершина S над центром O.
 */
export function sektorKonusa(r: number, h: number, alfa: number, a0 = 0): Polyhedron {
  const niz = [[0, 0, 0] as Vec3, ...duga(r, 0, a0, alfa)];
  const n = niz.length;
  const vertices = [...niz, [0, 0, h] as Vec3];
  const faces: number[][] = [Array.from({ length: n }, (_, k) => n - 1 - k)];
  const gladkie: number[] = [];
  for (let k = 0; k < n; k += 1) {
    if (k > 0 && k < n - 1) gladkie.push(faces.length);
    faces.push([k, (k + 1) % n, n]);
  }
  const imya = (k: number) => (k === 0 ? 'O' : k === 1 ? 'A' : k === n - 1 ? 'B' : null);
  return { kind: 'polyhedron', vertices, faces, gladkie, names: [...niz.map((_, k) => imya(k)), 'S'] };
}

/**
 * Тело из единичных кубиков (кубик [x, y, z] занимает [x, x+1] × …),
 * со стороной кубика a. Поверхность — квадраты, не общие двум кубикам;
 * стыки квадратов одной плоскости движок не рисует, поэтому видны
 * только настоящие рёбра. Имена — вершинам с заданными координатами
 * (в единицах кубика).
 */
export function kubiki(
  spisok: readonly (readonly [number, number, number])[],
  a = 1,
  imena: Readonly<Record<string, readonly [number, number, number]>> = {},
): Polyhedron {
  const est = new Set(spisok.map((k) => k.join(',')));
  const vertices: Vec3[] = [];
  const index = new Map<string, number>();
  const v = (p: readonly [number, number, number]): number => {
    const key = p.join(',');
    let i = index.get(key);
    if (i === undefined) {
      i = vertices.length;
      index.set(key, i);
      vertices.push([p[0] * a, p[1] * a, p[2] * a]);
    }
    return i;
  };
  const faces: number[][] = [];
  for (const [x, y, z] of spisok) {
    for (let os = 0; os < 3; os += 1) {
      for (const znak of [-1, 1]) {
        const sosed = [x, y, z].map((c, k) => (k === os ? c + znak : c));
        if (est.has(sosed.join(','))) continue;
        /* Квадрат на грани кубика: две другие оси — u и w. */
        const u = (os + 1) % 3;
        const w = (os + 2) % 3;
        const sdvig = (k: number, du: number, dw: number) =>
          k === os ? (znak > 0 ? 1 : 0) : k === u ? du : k === w ? dw : 0;
        const ugol = (du: number, dw: number): [number, number, number] => [
          x + sdvig(0, du, dw),
          y + sdvig(1, du, dw),
          z + sdvig(2, du, dw),
        ];
        /* Обход (0,0) → (1,0) → (1,1) → (0,1) в осях u, w смотрит по +os. */
        const kvadrat = [ugol(0, 0), ugol(1, 0), ugol(1, 1), ugol(0, 1)].map(v);
        faces.push(znak > 0 ? kvadrat : kvadrat.reverse());
      }
    }
  }
  const names = vertices.map(() => null as string | null);
  Object.entries(imena).forEach(([name, p]) => {
    const i = index.get(p.join(','));
    if (i !== undefined) names[i] = name;
  });
  return { kind: 'polyhedron', vertices, faces, names };
}
