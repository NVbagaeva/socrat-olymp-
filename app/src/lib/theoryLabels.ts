/**
 * Раскладка подписей рисунка теории.
 *
 * Подписи теории — блоки KaTeX поверх SVG (components/tasks/theory/rich/
 * KatexFigure.tsx), а не текст внутри рисунка. Подписи осей и надписи
 * вроде «$k > 0$» стоят там, где их поставил автор (at, dx, dy). Подписи
 * точек (auto: true) автор не двигает: их место подбирает общий модуль
 * graph/labels.js — тот же, что у подписей точек на чертежах движка.
 * Рамка подписи не пересекает кривую, оси, пунктиры, другие подписи,
 * чужие точки и не выходит за рисунок; нет места рядом — подпись
 * отодвигается и к точке идёт выноска.
 *
 * Раскладка одна и для страницы, и для автотеста (scripts/check-
 * theory-point-labels.mjs): он берёт эти же прямоугольники.
 */

import labels from '@/lib/graph/labels.js';
import { THEME, renderGraph } from '@/lib/graph/renderer.js';
import type { FigureLabel, TheoryFigure } from '@/lib/theoryFigures';

/** Кегль подписи по умолчанию, пиксели натурального размера чертежа. */
export const LABEL_SIZE = 17;

interface Win {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface PlacedLabel {
  label: FigureLabel;
  /** Центр рамки, пиксели чертежа. */
  x: number;
  y: number;
  /** Точка привязки ручной подписи (at + dx, dy): страница ставит подпись
   *  от неё по настоящей ширине, как раньше; рамка по оценке ширины
   *  нужна только как препятствие для подписей точек. */
  anchorX: number;
  halfW: number;
  halfH: number;
  auto: boolean;
  /** Выноска от точки к рамке; есть у отодвинутой подписи. */
  leader: { x1: number; y1: number; x2: number; y2: number } | null;
  /** Нашлось ли свободное место. */
  free: boolean;
}

export interface FigureLayout {
  width: number;
  height: number;
  svg: string;
  labels: PlacedLabel[];
  /** Отчёт рендерера: кривые, оси, поле, фигуры — для автотеста. */
  report: Record<string, unknown>;
}

/* Рамка подписи по оценке: ширина по таблице долей кегля с запасом
   на курсив и индексы KaTeX, высота — с запасом на строку. */
function sizeOf(label: FigureLabel) {
  const size = label.size ?? LABEL_SIZE;
  const plain = labels.plainOfTex(label.text) as string;
  const halfW = ((labels.pointTextWidth(plain, size) as number) * 1.12) / 2 + 2;
  return { halfW, halfH: size * 0.66 };
}

export function layoutFigure(figure: TheoryFigure): FigureLayout {
  const scene = figure.scene as { window: Win; cell?: number };
  const geometry = THEME.geometry as { pad: number; cell: number; pointRadius: number };
  const cell = scene.cell ?? geometry.cell;
  const w = scene.window;
  const width = (w.xmax - w.xmin) * cell + geometry.pad * 2;
  const height = (w.ymax - w.ymin) * cell + geometry.pad * 2;

  const report: Record<string, unknown> = {};
  const svg = renderGraph(figure.scene, report) as string;
  const px = (x: number) => geometry.pad + (x - w.xmin) * cell;
  const py = (y: number) => geometry.pad + (w.ymax - y) * cell;

  /* Подписи, которые автор поставил сам, — тоже препятствия. */
  const placed: PlacedLabel[] = [];
  const boxes: { x: number; y: number; halfW: number; halfH: number }[] = [];
  figure.labels.forEach((label) => {
    if (label.auto === true) return;
    const { halfW, halfH } = sizeOf(label);
    const ax = px(label.at[0]) + (label.dx ?? 0);
    const ay = py(label.at[1]) + (label.dy ?? 0);
    const x = label.anchor === 'left' ? ax + halfW : label.anchor === 'right' ? ax - halfW : ax;
    placed.push({
      label,
      x,
      y: ay,
      anchorX: ax,
      halfW,
      halfH,
      auto: false,
      leader: null,
      free: true,
    });
    boxes.push({ x, y: ay, halfW, halfH });
  });

  /* Отрезки построений в пикселях. */
  const segments: number[][] = [];
  const shapes = figure.scene.shapes as {
    type: string;
    from?: [number, number];
    to?: [number, number];
    points?: [number, number][];
  }[];
  shapes.forEach((shape) => {
    if (shape.type === 'segment' && shape.from && shape.to) {
      segments.push([px(shape.from[0]), py(shape.from[1]), px(shape.to[0]), py(shape.to[1])]);
    } else if (shape.type === 'polygon' && shape.points) {
      const ring = shape.points;
      ring.forEach((p, i) => {
        const next = ring[(i + 1) % ring.length] as [number, number];
        segments.push([px(p[0]), py(p[1]), px(next[0]), py(next[1])]);
      });
    }
  });
  const marks = (report.points as { x: number; y: number; r: number }[] | undefined) ?? [];

  figure.labels.forEach((label) => {
    if (label.auto !== true) return;
    const { halfW, halfH } = sizeOf(label);
    const anchor = { x: px(label.at[0]), y: py(label.at[1]) };
    const spot = labels.placePointLabel({
      anchor,
      halfW,
      halfH,
      r: geometry.pointRadius,
      gap: geometry.pointRadius + 5,
      obstacles: labels.obstaclesOf({
        curves: report.curves,
        axes: report.axes,
        field: report.field,
        segments,
        points: marks,
        boxes,
      }),
    });
    placed.push({
      label,
      x: spot.x,
      y: spot.y,
      anchorX: spot.x,
      halfW,
      halfH,
      auto: true,
      leader: spot.leader,
      free: spot.free,
    });
    boxes.push({ x: spot.x, y: spot.y, halfW, halfH });
  });

  return { width, height, svg, labels: placed, report: { ...report, segments } };
}
