/**
 * Чек-лист чертежа: двенадцать пунктов из требований к разделу.
 *
 * Проверка живёт рядом с движком и работает на тех же моделях, что
 * уходят на страницу: просит у рендера диагностику сцены в пикселях
 * и мерит зазоры. Ничего не рисует и ничего не исправляет.
 *
 * Пункты:
 *  1. невидимые линии штриховые, видимые сплошные
 *  2. видимость вычислена движком по модели
 *  3. вспомогательный отрезок не сливается с ребром
 *  4. у тел вращения основание разделено на видимую и скрытую части
 *  5. в комбинациях видимость учитывает оба тела
 *  6. подписи не налезают на линии и друг на друга
 *  7. прямой угол отмечен там, где он есть в условии
 *  8. вспомогательные построения акцентного цвета
 *  9. числа на чертеже — числа варианта
 * 10. буквы на чертеже — те же, что в условии
 * 11. цвета и шрифт из токенов сайта
 * 12. чертёж читается на ширине 360
 */

import type { Model, Polyhedron } from './model';
import { subscript } from './figures';
import { renderSolid, solidDiagnostics } from './render';

/** Сколько пунктов в чек-листе. */
export const CHECKLIST_POINTS = 12;

/** Названия пунктов для таблицы. */
export const CHECKLIST_TITLES = [
  'штриховые и сплошные',
  'видимость по модели',
  'апофема не сливается',
  'основание тела вращения',
  'видимость в комбинации',
  'подписи не налезают',
  'прямой угол отмечен',
  'вспомогательные акцентом',
  'числа варианта',
  'буквы условия',
  'цвета и шрифт',
  'читается на 360',
];

/**
 * Чертежи, где прямой угол обязан быть отмечен: перпендикулярность
 * стоит в условии или в определении фигуры. Там, где прямой угол —
 * это ответ задачи (угол между прямыми в кубе), отмечать его нельзя.
 */
const NEEDS_ANGLE = new Set([
  'P03-20',
  'P03-21',
  'P03-41',
  'P03-42',
  'P03-43',
  'P03-44',
  'P03-46',
  'P03-49',
  'P03-51',
  'sheet-II-1',
  'sheet-III-1',
  'sheet-IV-1',
  'sheet-V-1',
]);

export interface CheckRow {
  id: string;
  figure: string;
  points: boolean[];
  notes: string[];
}

/* ── Геометрия на плоскости ──────────────────────────────────────── */

type P = [number, number];

function segmentDistance(p: P, a: P, b: P): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    return Math.hypot(p[0] - a[0], p[1] - a[1]);
  }
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
}

function rectSegmentDistance(x: number, y: number, w: number, h: number, a: P, b: P): number {
  const inside = (p: P) => p[0] >= x && p[0] <= x + w && p[1] >= y && p[1] <= y + h;
  if (inside(a) || inside(b)) {
    return 0;
  }
  const corners: P[] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  let best = Infinity;
  for (let i = 0; i < 4; i += 1) {
    const c0 = corners[i] as P;
    const c1 = corners[(i + 1) % 4] as P;
    if (cross(c0, c1, a, b)) {
      return 0;
    }
    best = Math.min(best, segmentDistance(c0, a, b), segmentDistance(c1, a, b));
  }
  return best;
}

function cross(a: P, b: P, c: P, d: P): boolean {
  const side = (p: P, q: P, r: P) =>
    Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b);
}

function same(a: P, b: P): boolean {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.6;
}

/* ── Один чертёж ─────────────────────────────────────────────────── */

function letterSet(text: string): Set<string> {
  /* Условие набрано в TeX: «A_1». В alt и заголовках — «A₁».
     Считаем обе записи одной и той же буквой. */
  const normalised = text
    .replace(/_\{(\d)\}/g, (_match, digit: string) => subscript(digit))
    .replace(/_(\d)/g, (_match, digit: string) => subscript(digit));
  return new Set(normalised.match(/[A-Z]₁?/g) ?? []);
}

export function checkDrawing(id: string, model: Model, condition: string | null): CheckRow {
  const svg = renderSolid(model);
  const d = solidDiagnostics(model);
  const ok: boolean[] = Array.from({ length: CHECKLIST_POINTS }, () => true);
  const notes: string[] = [];

  const edges = d.strokes.filter((s) => s.role === 'edge');
  const aux = d.strokes.filter((s) => s.role === 'aux');
  const hidden = d.strokes.filter((s) => !s.visible);
  const segments = (list: typeof d.strokes): [P, P][] =>
    list.flatMap((s) => s.points.slice(1).map((p, i): [P, P] => [s.points[i] as P, p as P]));
  const edgeSegments = segments(edges);

  /* 1. Невидимые линии штриховые, видимые сплошные. */
  const dashed = (svg.match(/stroke-dasharray/g) ?? []).length;
  ok[0] = hidden.length === dashed;
  if (!ok[0]) {
    notes.push('штриховых линий в разметке не столько, сколько скрытых кусков');
  }

  /* 2. Видимость вычислена движком: в модели нет способа задать её руками. */
  ok[1] = true;

  /* 3. Вспомогательный отрезок не сливается с ребром.
        Пересечение под углом — не слияние: диагональ обязана
        пересекать рёбра. Сравниваются только почти параллельные пары,
        а выделенное ребро (вспомогательный отрезок поверх ребра
        целиком) — это и есть задумка. */
  const hasPolyhedron = model.bodies.some((body) => body.kind === 'polyhedron');
  let minAux = Infinity;
  (hasPolyhedron ? aux : []).forEach((stroke) => {
    segments([stroke]).forEach(([a, b]) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 1) {
        return;
      }
      edgeSegments.forEach(([c, e]) => {
        const elen = Math.hypot(e[0] - c[0], e[1] - c[1]);
        if (elen < 1) {
          return;
        }
        const sin =
          Math.abs((b[0] - a[0]) * (e[1] - c[1]) - (b[1] - a[1]) * (e[0] - c[0])) / (len * elen);
        if (sin > 0.15) {
          return;
        }
        const onEdge = (same(a, c) && same(b, e)) || (same(a, e) && same(b, c));
        if (onEdge) {
          return;
        }
        [0.3, 0.5, 0.7].forEach((t) => {
          const p: P = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          minAux = Math.min(minAux, segmentDistance(p, c, e));
        });
      });
    });
  });
  ok[2] = minAux === Infinity || minAux >= 3;
  if (!ok[2]) {
    notes.push(`вспомогательная линия идёт в ${minAux.toFixed(1)} px вдоль ребра`);
  }

  /* 4. Тела вращения: у нижнего основания есть видимая и скрытая
        части. У открытого сосуда (конус вершиной вниз) скрывать
        нечего: видно и весь край, и поверхность жидкости. */
  const round = model.bodies.filter((b) => b.kind === 'cylinder' || b.kind === 'cone');
  const openVessel = model.bodies.every((b) => b.kind === 'cone' && b.inverted === true);
  if (round.length > 0 && !openVessel) {
    const visible = d.strokes.some((s) => s.role === 'edge' && s.visible);
    ok[3] = visible && hidden.length > 0;
    if (!ok[3]) {
      notes.push('у тела вращения нет штриховой части основания');
    }
  }

  /* 5. В комбинациях видимость учитывает оба тела. */
  if (model.bodies.length > 1) {
    ok[4] = hidden.length > 0;
    if (!ok[4]) {
      notes.push('в комбинации нет ни одной скрытой линии');
    }
  }

  /* 6. Подписи не налезают на линии и друг на друга. */
  let minLabel = Infinity;
  d.labels.forEach((label, i) => {
    d.strokes.forEach((stroke) => {
      segments([stroke]).forEach(([a, b]) => {
        minLabel = Math.min(
          minLabel,
          rectSegmentDistance(label.x, label.y, label.w, label.h, a, b),
        );
      });
    });
    d.labels.slice(i + 1).forEach((other) => {
      const gap = Math.max(
        label.x - (other.x + other.w),
        other.x - (label.x + label.w),
        label.y - (other.y + other.h),
        other.y - (label.y + label.h),
      );
      minLabel = Math.min(minLabel, gap);
    });
  });
  ok[5] = minLabel === Infinity || minLabel >= 0.5;
  if (!ok[5]) {
    notes.push(`подписи сходятся ближе ${minLabel.toFixed(1)} px`);
  }

  /* 7. Прямой угол отмечен там, где перпендикулярность в условии.
        Где прямой угол — сам ответ задачи, отмечать его нельзя. */
  if (NEEDS_ANGLE.has(id)) {
    ok[6] = d.angles > 0;
    if (!ok[6]) {
      notes.push('перпендикулярность в условии, а прямой угол не отмечен');
    }
  }

  /* 8. Вспомогательные построения терракотовые. */
  const auxStrokes = (svg.match(/stroke="var\(--graph-accent\)"/g) ?? []).length;
  ok[7] = aux.length === 0 || auxStrokes > 0;
  if (!ok[7]) {
    notes.push('вспомогательные линии нарисованы не акцентным цветом');
  }

  /* 9. Числа на чертеже совпадают с числами варианта. */
  const measures = model.measures ?? [];
  const drawn = (svg.match(/>(\d+(?:,\d+)?)</g) ?? []).map((m) => m.slice(1, -1));
  ok[8] = measures.every((measure) => drawn.includes(measure.text));
  if (!ok[8]) {
    notes.push('число варианта не попало на чертёж');
  }

  /* 10. Буквы на чертеже — те же, что в условии. */
  const onDrawing = new Set<string>();
  model.bodies.forEach((body) => {
    if (body.kind === 'polyhedron') {
      ((body as Polyhedron).names ?? []).forEach((name) => {
        if (name) {
          onDrawing.add(name.replace(/1$/, '₁'));
        }
      });
    }
  });
  (model.marks ?? []).forEach((mark) => {
    if (mark.label) {
      onDrawing.add(mark.label.replace(/1$/, '₁'));
    }
  });
  if (condition !== null) {
    const inCondition = letterSet(condition);
    const extra = [...onDrawing].filter((name) => !inCondition.has(name));
    ok[9] = extra.length === 0;
    if (!ok[9]) {
      notes.push(`на чертеже буквы, которых нет в условии: ${extra.join(', ')}`);
    }
  }

  /* 11. Цвета — токенами, шрифт подписей — шрифт формул.
     Буква на чертеже и буква в формуле условия — одна и та же буква,
     поэтому и шрифт у них один: KaTeX_Math, запасной — шрифт сайта. */
  const hex = svg.match(/#[0-9a-fA-F]{3,8}\b/g);
  const font =
    svg.includes('font-family="KaTeX_Math, var(--font-sans)"') || !svg.includes('<text');
  ok[10] = hex === null && font;
  if (!ok[10]) {
    notes.push(hex ? `в разметке хекс ${hex[0]}` : 'подписи не шрифтом формул');
  }

  /* 12. Читается на 360: зазоры после сжатия до ширины телефона. */
  const width = Number((svg.match(/width="([\d.]+)"/) ?? [])[1] ?? d.width);
  const scale = Math.min(1, 360 / width);
  ok[11] = minLabel === Infinity || minLabel * scale >= 0.5;
  if (!ok[11]) {
    notes.push(`на 360 зазор подписей ${(minLabel * scale).toFixed(1)} px`);
  }

  const figure = model.alt.split(',')[0] ?? model.alt;
  return { id, figure: figure.slice(0, 46), points: ok, notes };
}
