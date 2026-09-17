/**
 * Базовые фигуры: 45 штук по catalog.json старого генератора.
 *
 * Имена и папки совпадают со старым каталогом, чтобы на витрине
 * новый чертёж стоял рядом со старым. Сами чертежи старых файлов
 * не используют: каждая фигура собрана заново из модели.
 */

import {
  baseCenter,
  box,
  dir,
  frustumPyramid,
  namesText,
  polygonStart,
  prism,
  pyramid,
  regularPolygon,
  regularPrism,
  regularPyramid,
  sphereOutlinePoint,
  tetrahedron,
  vertex,
} from './figures';
import { type Model, type Polyhedron, orientOutward } from './model';
import { circlePoint } from './project';
import { type Vec3, add, mid } from './vec';

export interface CatalogEntry {
  folder: 'piramidy' | 'prizmy' | 'tela_vrashcheniya' | 'kombinacii';
  name: string;
  title: string;
  build: () => Model;
}

const UP: Vec3 = [0, 0, 1];

function polyAlt(kind: string, body: Polyhedron): string {
  return `${kind} ${namesText(body.names ?? [])}`;
}

/* ── Пирамиды ──────────────────────────────────────────────────── */

function pyramidWithHeight(n: number, R: number, h: number, apothem: boolean): Model {
  const body = regularPyramid(n, R, h);
  const O = baseCenter(body, n);
  const S = vertex(body, 'S');
  const A = vertex(body, 'A');
  const B = vertex(body, 'B');
  const names = namesText(body.names ?? []);

  if (apothem) {
    /* Апофема к правому ребру BC: к переднему ребру AB она пошла бы
       почти по той же линии, что и высота SO, и слилась бы с ней. */
    const M = mid(B, vertex(body, 'C'));
    return {
      alt: `Правильная пирамида ${names} с высотой SO и апофемой SM`,
      bodies: [body],
      marks: [
        { p: O, label: 'O' },
        { p: M, label: 'M' },
      ],
      lines: [
        { a: S, b: O },
        { a: S, b: M },
        { a: O, b: M },
      ],
      angles: [{ at: O, u: dir(O, S), v: dir(O, M) }],
    };
  }

  /* Прямая через O из вершины A: к противоположной вершине (чётное n)
     или к середине противоположной стороны (нечётное n). */
  const far: Vec3 =
    n % 2 === 0
      ? vertex(body, String.fromCharCode(65 + n / 2))
      : mid(
          vertex(body, String.fromCharCode(65 + (n - 1) / 2)),
          vertex(body, String.fromCharCode(65 + (n + 1) / 2)),
        );
  return {
    alt: `Пирамида ${names} с высотой SO`,
    bodies: [body],
    marks: [{ p: O, label: 'O' }],
    lines: [
      { a: S, b: O },
      { a: A, b: far },
    ],
    angles: [{ at: O, u: dir(O, S), v: dir(O, far) }],
  };
}

const PYRAMIDS: CatalogEntry[] = [
  {
    folder: 'piramidy',
    name: 'piramida_3ug',
    title: 'Треугольная пирамида',
    build: () => {
      const body = regularPyramid(3, 2.6, 4);
      return { alt: polyAlt('Треугольная пирамида', body), bodies: [body] };
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_3ug_visota',
    title: 'Треугольная пирамида с высотой SO',
    build: () => pyramidWithHeight(3, 2.6, 4, false),
  },
  {
    folder: 'piramidy',
    name: 'piramida_3ug_apofema',
    title: 'Правильная треугольная пирамида с апофемой SM',
    build: () => pyramidWithHeight(3, 2.6, 4, true),
  },
  {
    folder: 'piramidy',
    name: 'tetraedr',
    title: 'Правильный тетраэдр',
    build: () => {
      const body = tetrahedron(4);
      return { alt: polyAlt('Правильный тетраэдр', body), bodies: [body] };
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_4ug',
    title: 'Правильная четырёхугольная пирамида',
    build: () => {
      const body = regularPyramid(4, 2.9, 4);
      return { alt: polyAlt('Правильная четырёхугольная пирамида', body), bodies: [body] };
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_4ug_visota',
    title: 'Четырёхугольная пирамида с высотой SO',
    build: () => {
      const model = pyramidWithHeight(4, 2.9, 4, false);
      const body = model.bodies[0] as Polyhedron;
      /* Обе диагонали основания: высота стоит на их пересечении. */
      model.lines?.push({ a: vertex(body, 'B'), b: vertex(body, 'D') });
      return model;
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_4ug_apofema',
    title: 'Четырёхугольная пирамида с высотой и апофемой',
    build: () => pyramidWithHeight(4, 2.9, 4, true),
  },
  {
    folder: 'piramidy',
    name: 'piramida_4ug_rebro_perp',
    title: 'Пирамида, боковое ребро SD ⟂ основанию',
    build: () => {
      const base = regularPolygon(4, 2.9, 0, polygonStart(4));
      const D = base[3] as Vec3;
      const body = pyramid(base, add(D, [0, 0, 4.5]));
      const C = vertex(body, 'C');
      const A = vertex(body, 'A');
      return {
        alt: `Четырёхугольная пирамида ${namesText(body.names ?? [])}, боковое ребро SD перпендикулярно основанию`,
        bodies: [body],
        angles: [
          { at: D, u: UP, v: dir(D, C) },
          { at: D, u: UP, v: dir(D, A) },
        ],
      };
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_5ug',
    title: 'Правильная пятиугольная пирамида',
    build: () => {
      const body = regularPyramid(5, 2.8, 4);
      return { alt: polyAlt('Правильная пятиугольная пирамида', body), bodies: [body] };
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_5ug_visota',
    title: 'Пятиугольная пирамида с высотой SO',
    build: () => pyramidWithHeight(5, 2.8, 4, false),
  },
  {
    folder: 'piramidy',
    name: 'piramida_6ug',
    title: 'Правильная шестиугольная пирамида',
    build: () => {
      const body = regularPyramid(6, 2.8, 4);
      return { alt: polyAlt('Правильная шестиугольная пирамида', body), bodies: [body] };
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_6ug_apofema',
    title: 'Шестиугольная пирамида с высотой и апофемой',
    build: () => pyramidWithHeight(6, 2.8, 4, true),
  },
  {
    folder: 'piramidy',
    name: 'piramida_usech_3ug',
    title: 'Усечённая треугольная пирамида',
    build: () => {
      const body = frustumPyramid(3, 3, 1.5, 3.4);
      return { alt: polyAlt('Усечённая треугольная пирамида', body), bodies: [body] };
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_usech_4ug',
    title: 'Усечённая четырёхугольная пирамида',
    build: () => {
      const body = frustumPyramid(4, 3, 1.5, 3.4);
      return { alt: polyAlt('Усечённая четырёхугольная пирамида', body), bodies: [body] };
    },
  },
  {
    folder: 'piramidy',
    name: 'piramida_usech_6ug',
    title: 'Усечённая шестиугольная пирамида',
    build: () => {
      const body = frustumPyramid(6, 3, 1.5, 3.4);
      return { alt: polyAlt('Усечённая шестиугольная пирамида', body), bodies: [body] };
    },
  },
];

/* ── Призмы ────────────────────────────────────────────────────── */

function boxWithDiagonal(a: number, b: number, c: number, kind: string): Model {
  const body = box(a, b, c);
  const A = vertex(body, 'A');
  const C = vertex(body, 'C');
  const C1 = vertex(body, 'C1');
  return {
    alt: `${kind} ${namesText(body.names ?? [])} с диагональю AC₁`,
    bodies: [body],
    lines: [
      { a: A, b: C1 },
      { a: A, b: C },
    ],
    angles: [{ at: C, u: dir(C, A), v: dir(C, C1) }],
  };
}

const PRISMS: CatalogEntry[] = [
  {
    folder: 'prizmy',
    name: 'prizma_3ug_pryamaya',
    title: 'Прямая треугольная призма',
    build: () => {
      const body = regularPrism(3, 2.6, 4.2);
      return { alt: polyAlt('Прямая треугольная призма', body), bodies: [body] };
    },
  },
  {
    folder: 'prizmy',
    name: 'prizma_3ug_naklonnaya',
    title: 'Наклонная треугольная призма',
    build: () => {
      const body = prism(regularPolygon(3, 2.6, 0, polygonStart(3)), [1.2, 0.5, 4]);
      return { alt: polyAlt('Наклонная треугольная призма', body), bodies: [body] };
    },
  },
  {
    folder: 'prizmy',
    name: 'prizma_4ug_pryamaya',
    title: 'Прямая четырёхугольная призма',
    build: () => {
      const body = regularPrism(4, 2.7, 4.2);
      return { alt: polyAlt('Прямая четырёхугольная призма', body), bodies: [body] };
    },
  },
  {
    folder: 'prizmy',
    name: 'parallelepiped_pryamougolnyi',
    title: 'Прямоугольный параллелепипед',
    build: () => {
      const body = box(5, 3, 3.4);
      return { alt: polyAlt('Прямоугольный параллелепипед', body), bodies: [body] };
    },
  },
  {
    folder: 'prizmy',
    name: 'parallelepiped_diagonal',
    title: 'Прямоугольный параллелепипед с диагональю AC₁',
    build: () => boxWithDiagonal(5, 3, 3.4, 'Прямоугольный параллелепипед'),
  },
  {
    folder: 'prizmy',
    name: 'parallelepiped_diag_sechenie',
    title: 'Диагональное сечение ACC₁A₁',
    build: () => {
      const body = box(5, 3, 3.4);
      const pts = ['A', 'C', 'C1', 'A1'].map((n) => vertex(body, n));
      return {
        alt: `Прямоугольный параллелепипед ${namesText(body.names ?? [])}, диагональное сечение ACC₁A₁`,
        bodies: [body],
        sections: [{ points: pts }],
      };
    },
  },
  {
    folder: 'prizmy',
    name: 'parallelepiped_naklonnyi',
    title: 'Наклонный параллелепипед',
    build: () => {
      /* Наклон влево: вправо-вверх на чертеже уже уходит ребро глубины
         AD, и наклонённые в ту же сторону боковые рёбра слились бы
         с ним в одну полосу. */
      const body = prism(
        [
          [0, 0, 0],
          [5, 0, 0],
          [5, 3, 0],
          [0, 3, 0],
        ],
        [-1.6, 0.5, 4],
      );
      return { alt: polyAlt('Наклонный параллелепипед', body), bodies: [body] };
    },
  },
  {
    folder: 'prizmy',
    name: 'kub',
    title: 'Куб',
    build: () => {
      const body = box(4, 4, 4);
      return { alt: polyAlt('Куб', body), bodies: [body] };
    },
  },
  {
    folder: 'prizmy',
    name: 'kub_diagonal',
    title: 'Куб с диагональю AC₁',
    build: () => boxWithDiagonal(4, 4, 4, 'Куб'),
  },
  {
    folder: 'prizmy',
    name: 'prizma_5ug',
    title: 'Правильная пятиугольная призма',
    build: () => {
      const body = regularPrism(5, 2.7, 4.2);
      return { alt: polyAlt('Правильная пятиугольная призма', body), bodies: [body] };
    },
  },
  {
    folder: 'prizmy',
    name: 'prizma_6ug',
    title: 'Правильная шестиугольная призма',
    build: () => {
      const body = regularPrism(6, 2.7, 4.2);
      return { alt: polyAlt('Правильная шестиугольная призма', body), bodies: [body] };
    },
  },
  {
    folder: 'prizmy',
    name: 'prizma_6ug_diag_sechenie',
    title: 'Шестиугольная призма, сечение ADD₁A₁',
    build: () => {
      const body = regularPrism(6, 2.7, 4.2);
      const pts = ['A', 'D', 'D1', 'A1'].map((n) => vertex(body, n));
      return {
        alt: `Правильная шестиугольная призма ${namesText(body.names ?? [])}, сечение ADD₁A₁`,
        bodies: [body],
        sections: [{ points: pts }],
      };
    },
  },
  {
    folder: 'prizmy',
    name: 'prizma_usechennaya',
    title: 'Усечённая треугольная призма',
    build: () => {
      const base = regularPolygon(3, 2.6, 0, polygonStart(3));
      /* Секущая плоскость наклонена к основанию примерно на 13°:
         в банке прототипов усечённой призмы нет, наклон витринный. */
      const heights = [4.0, 3.3, 4.4];
      const top = base.map((p, k): Vec3 => [p[0], p[1], heights[k] ?? 3]);
      const vertices = [...base, ...top];
      const faces = [
        [0, 1, 2],
        [3, 4, 5],
        [0, 1, 4, 3],
        [1, 2, 5, 4],
        [2, 0, 3, 5],
      ];
      const body: Polyhedron = {
        kind: 'polyhedron',
        vertices,
        faces: orientOutward(vertices, faces),
        names: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
      };
      return { alt: polyAlt('Усечённая треугольная призма', body), bodies: [body] };
    },
  },
];

/* ── Тела вращения ─────────────────────────────────────────────── */

const REVOLUTION: CatalogEntry[] = [
  {
    folder: 'tela_vrashcheniya',
    name: 'cilindr',
    title: 'Цилиндр',
    build: () => ({
      alt: 'Цилиндр',
      bodies: [{ kind: 'cylinder', base: [0, 0, 0], r: 2.2, h: 4.4 }],
    }),
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'cilindr_os_radius',
    title: 'Цилиндр: ось OO₁, радиус r, образующая l',
    build: () => {
      const r = 2.2;
      const h = 4.4;
      const O: Vec3 = [0, 0, 0];
      const O1: Vec3 = [0, 0, h];
      const A = circlePoint(O, r, 0);
      const A1 = circlePoint(O1, r, 0);
      return {
        alt: 'Цилиндр с осью OO₁, радиусом OA = r и образующей AA₁ = l',
        bodies: [{ kind: 'cylinder', base: O, r, h }],
        marks: [
          { p: O, label: 'O' },
          { p: O1, label: 'O1' },
          { p: A, label: 'A' },
          { p: A1, label: 'A1' },
        ],
        lines: [
          { a: O, b: O1 },
          { a: O, b: A, label: 'r' },
          { a: O1, b: A1 },
          { a: A, b: A1, label: 'l' },
        ],
        angles: [{ at: O, u: dir(O, A), v: UP }],
      };
    },
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'cilindr_osevoe_sechenie',
    title: 'Осевое сечение цилиндра ABB₁A₁',
    build: () => {
      const r = 2.2;
      const h = 4.4;
      const O: Vec3 = [0, 0, 0];
      const O1: Vec3 = [0, 0, h];
      const A = circlePoint(O, r, Math.PI);
      const B = circlePoint(O, r, 0);
      const A1 = circlePoint(O1, r, Math.PI);
      const B1 = circlePoint(O1, r, 0);
      return {
        alt: 'Цилиндр с осевым сечением ABB₁A₁',
        bodies: [{ kind: 'cylinder', base: O, r, h }],
        marks: [
          { p: A, label: 'A' },
          { p: B, label: 'B' },
          { p: A1, label: 'A1' },
          { p: B1, label: 'B1' },
          { p: O, label: 'O' },
          { p: O1, label: 'O1' },
        ],
        sections: [{ points: [A, B, B1, A1] }],
      };
    },
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'konus',
    title: 'Конус',
    build: () => ({
      alt: 'Конус',
      bodies: [{ kind: 'cone', base: [0, 0, 0], r: 2.4, h: 4.6 }],
    }),
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'konus_visota_obrazuyushchaya',
    title: 'Конус: высота h, образующая l',
    build: () => {
      const r = 2.4;
      const h = 4.6;
      const O: Vec3 = [0, 0, 0];
      const S: Vec3 = [0, 0, h];
      const A = circlePoint(O, r, 0);
      return {
        alt: 'Конус с вершиной S, высотой SO = h, образующей SA = l и радиусом OA = r',
        bodies: [{ kind: 'cone', base: O, r, h }],
        marks: [
          { p: O, label: 'O' },
          { p: S, label: 'S' },
          { p: A, label: 'A' },
        ],
        lines: [
          { a: S, b: O, label: 'h' },
          { a: S, b: A, label: 'l' },
          { a: O, b: A, label: 'r' },
        ],
        angles: [{ at: O, u: dir(O, A), v: UP }],
      };
    },
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'konus_osevoe_sechenie',
    title: 'Осевое сечение конуса SAB',
    build: () => {
      const r = 2.4;
      const h = 4.6;
      const O: Vec3 = [0, 0, 0];
      const S: Vec3 = [0, 0, h];
      const A = circlePoint(O, r, Math.PI);
      const B = circlePoint(O, r, 0);
      return {
        alt: 'Конус с осевым сечением SAB и высотой SO',
        bodies: [{ kind: 'cone', base: O, r, h }],
        marks: [
          { p: O, label: 'O' },
          { p: S, label: 'S' },
          { p: A, label: 'A' },
          { p: B, label: 'B' },
        ],
        lines: [{ a: S, b: O }],
        sections: [{ points: [S, A, B] }],
      };
    },
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'konus_usechennyi',
    title: 'Усечённый конус',
    build: () => ({
      alt: 'Усечённый конус',
      bodies: [{ kind: 'cone', base: [0, 0, 0], r: 2.6, top: 1.4, h: 3.2 }],
    }),
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'konus_usechennyi_os',
    title: 'Усечённый конус с осью и радиусами',
    build: () => {
      const r = 2.6;
      const r1 = 1.4;
      const h = 3.2;
      const O: Vec3 = [0, 0, 0];
      const O1: Vec3 = [0, 0, h];
      const A = circlePoint(O, r, 0);
      const A1 = circlePoint(O1, r1, 0);
      return {
        alt: 'Усечённый конус с осью OO₁ и радиусами OA и O₁A₁',
        bodies: [{ kind: 'cone', base: O, r, top: r1, h }],
        marks: [
          { p: O, label: 'O' },
          { p: O1, label: 'O1' },
          { p: A, label: 'A' },
          { p: A1, label: 'A1' },
        ],
        lines: [
          { a: O, b: O1 },
          { a: O, b: A },
          { a: O1, b: A1 },
        ],
        angles: [{ at: O, u: dir(O, A), v: UP }],
      };
    },
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'shar',
    title: 'Шар',
    build: () => ({
      alt: 'Шар',
      bodies: [{ kind: 'sphere', center: [0, 0, 0], r: 2.4 }],
    }),
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'shar_radius',
    title: 'Шар с центром O и радиусом R',
    build: () => {
      const R = 2.4;
      const O: Vec3 = [0, 0, 0];
      /* Точка на контуре шара справа-сверху: радиус к ней на чертеже
         виден целиком и кончается ровно на окружности. */
      const A = sphereOutlinePoint(O, R, 35);
      return {
        alt: 'Шар с центром O и радиусом OA = R',
        bodies: [{ kind: 'sphere', center: O, r: R }],
        marks: [
          { p: O, label: 'O' },
          { p: A, label: 'A' },
        ],
        lines: [{ a: O, b: A, label: 'R' }],
      };
    },
  },
  {
    folder: 'tela_vrashcheniya',
    name: 'shar_sechenie',
    title: 'Сечение шара плоскостью',
    build: () => {
      const R = 2.4;
      const z = 1.3;
      const O: Vec3 = [0, 0, 0];
      const O1: Vec3 = [0, 0, z];
      const A = circlePoint(O1, Math.sqrt(R * R - z * z), 0);
      return {
        alt: 'Шар с центром O, сечение плоскостью с центром O₁, радиус сечения O₁A, радиус шара OA = R',
        bodies: [{ kind: 'sphere', center: O, r: R, sections: [z] }],
        marks: [
          { p: O, label: 'O' },
          { p: O1, label: 'O1' },
          { p: A, label: 'A' },
        ],
        lines: [
          { a: O, b: O1 },
          { a: O1, b: A },
          { a: O, b: A, label: 'R' },
        ],
        angles: [{ at: O1, u: dir(O1, A), v: dir(O1, O) }],
      };
    },
  },
];

/* ── Комбинации ────────────────────────────────────────────────── */

const COMBOS: CatalogEntry[] = [
  {
    folder: 'kombinacii',
    name: 'shar_v_kube',
    title: 'Шар, вписанный в куб',
    build: () => {
      const a = 4;
      const cube = box(a, a, a);
      cube.glass = true;
      const O: Vec3 = [a / 2, a / 2, a / 2];
      return {
        alt: `Шар с центром O, вписанный в куб ${namesText(cube.names ?? [])}`,
        bodies: [cube, { kind: 'sphere', center: O, r: a / 2 }],
        marks: [{ p: O, label: 'O' }],
      };
    },
  },
  {
    folder: 'kombinacii',
    name: 'kub_v_share',
    title: 'Куб, вписанный в шар',
    build: () => {
      const a = 3.2;
      const cube = box(a, a, a);
      const O: Vec3 = [a / 2, a / 2, a / 2];
      return {
        alt: `Куб ${namesText(cube.names ?? [])}, вписанный в шар с центром O; диагональ куба AC₁ — диаметр шара`,
        bodies: [{ kind: 'sphere', center: O, r: (a * Math.sqrt(3)) / 2, glass: true }, cube],
        marks: [{ p: O, label: 'O' }],
        lines: [{ a: vertex(cube, 'A'), b: vertex(cube, 'C1') }],
      };
    },
  },
  {
    folder: 'kombinacii',
    name: 'shar_v_cilindre',
    title: 'Шар, вписанный в цилиндр',
    build: () => {
      const r = 2.2;
      const O: Vec3 = [0, 0, r];
      return {
        alt: 'Шар с центром O, вписанный в цилиндр',
        bodies: [
          { kind: 'cylinder', base: [0, 0, 0], r, h: 2 * r, glass: true },
          { kind: 'sphere', center: O, r },
        ],
        marks: [{ p: O, label: 'O' }],
      };
    },
  },
  {
    folder: 'kombinacii',
    name: 'shar_v_konuse',
    title: 'Шар, вписанный в конус',
    build: () => {
      const r = 2.6;
      const h = 5.2;
      const l = Math.hypot(r, h);
      /* Радиус вписанного шара — радиус окружности, вписанной в осевое
         сечение: r·h / (l + r). */
      const rho = (r * h) / (l + r);
      const O: Vec3 = [0, 0, rho];
      const S: Vec3 = [0, 0, h];
      const O1: Vec3 = [0, 0, 0];
      return {
        alt: 'Шар с центром O, вписанный в конус с вершиной S и центром основания O₁',
        bodies: [
          { kind: 'cone', base: O1, r, h, glass: true },
          { kind: 'sphere', center: O, r: rho },
        ],
        marks: [
          { p: O, label: 'O' },
          { p: S, label: 'S' },
          { p: O1, label: 'O1' },
        ],
        lines: [{ a: S, b: O1 }],
      };
    },
  },
  {
    folder: 'kombinacii',
    name: 'piramida_v_konuse',
    title: 'Пирамида, вписанная в конус',
    build: () => {
      const r = 2.7;
      const h = 5;
      const body = regularPyramid(4, r, h);
      body.noFill = true;
      const O: Vec3 = [0, 0, 0];
      const S: Vec3 = [0, 0, h];
      return {
        alt: `Правильная четырёхугольная пирамида ${namesText(body.names ?? [])}, вписанная в конус с той же вершиной S и центром основания O`,
        bodies: [{ kind: 'cone', base: O, r, h, glass: true }, body],
        marks: [{ p: O, label: 'O' }],
        lines: [{ a: S, b: O }],
      };
    },
  },
  {
    folder: 'kombinacii',
    name: 'prizma_v_cilindre',
    title: 'Призма, вписанная в цилиндр',
    build: () => {
      const r = 2.6;
      const h = 4.2;
      const body = regularPrism(6, r, h);
      body.noFill = true;
      return {
        alt: `Правильная шестиугольная призма ${namesText(body.names ?? [])}, вписанная в цилиндр`,
        bodies: [{ kind: 'cylinder', base: [0, 0, 0], r, h, glass: true }, body],
      };
    },
  },
];

export const CATALOG: CatalogEntry[] = [...PYRAMIDS, ...PRISMS, ...REVOLUTION, ...COMBOS];
