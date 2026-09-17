/**
 * Раздел I. Параллелепипед и куб: прототипы P03-01 … P03-19.
 *
 * Пропорции тел выбраны так, чтобы чертёж читался: числа условия
 * на чертеж не выносятся (в задачнике их там нет), кроме ступенчатых
 * многогранников P03-05 и P03-11 — те лежат в steps.ts.
 */

import { box } from '../figures';
import { type Model } from '../model';
import { edge, face, lift, midEdge, prismModel, unlabelled } from './common';

/* Прямоугольный параллелепипед: переднее ребро, глубина, высота. */
const BOX: [number, number, number] = [5, 3, 3.6];
/* Куб. */
const CUBE = 4;
/* Правильная четырёхугольная призма: основание квадрат, призма выше куба. */
const PRISM: [number, number, number] = [3.4, 3.4, 4.8];

const NAMES = 'ABCDA₁B₁C₁D₁';

export const SECTION1: Record<string, Model> = {
  'P03-01': (() => {
    const body = box(...BOX);
    return prismModel(`Прямоугольный параллелепипед ${NAMES} с диагональю AC₁`, body, {
      lines: [edge(body, 'A', 'C1')],
    });
  })(),

  'P03-02': (() => {
    const body = box(CUBE, CUBE, CUBE);
    const diagonal = edge(body, 'A', 'C1');
    return prismModel('Куб с диагональю', unlabelled(body), { lines: [diagonal] });
  })(),

  'P03-03': (() => {
    const body = box(...BOX);
    return prismModel(
      `Прямоугольный параллелепипед ${NAMES}, сечение через точки A, B и C₁ — прямоугольник ABC₁D₁`,
      body,
      { sections: [face(body, 'A', 'B', 'C1', 'D1')] },
    );
  })(),

  'P03-04': (() => {
    const body = box(...BOX);
    return prismModel(
      `Прямоугольный параллелепипед ${NAMES}, сечение через вершины A, A₁ и C — прямоугольник ACC₁A₁`,
      body,
      { sections: [face(body, 'A', 'C', 'C1', 'A1')] },
    );
  })(),

  'P03-06': (() => {
    const body = box(CUBE, CUBE, CUBE);
    return prismModel(`Куб ${NAMES}, выделены прямые BC₁ и A₁B₁`, body, {
      lines: [edge(body, 'B', 'C1'), edge(body, 'A1', 'B1')],
    });
  })(),

  'P03-07': (() => {
    const body = box(CUBE, CUBE, CUBE);
    return prismModel(`Куб ${NAMES}, выделены прямые CB₁ и AD`, body, {
      lines: [edge(body, 'C', 'B1'), edge(body, 'A', 'D')],
    });
  })(),

  'P03-08': (() => {
    const body = box(CUBE, CUBE, CUBE);
    return prismModel(`Куб ${NAMES}, выделены прямые CD₁ и BC₁`, body, {
      lines: [edge(body, 'C', 'D1'), edge(body, 'B', 'C1')],
    });
  })(),

  'P03-09': (() => {
    const body = box(...PRISM);
    return prismModel(
      `Правильная четырёхугольная призма ${NAMES}, выделены диагонали DB₁ и CA₁`,
      body,
      { lines: [edge(body, 'D', 'B1'), edge(body, 'C', 'A1')] },
    );
  })(),

  'P03-10': (() => {
    const body = box(...BOX);
    return prismModel(`Прямоугольный параллелепипед ${NAMES}, выделены прямые A₁D₁ и AC`, body, {
      lines: [edge(body, 'A1', 'D1'), edge(body, 'A', 'C')],
    });
  })(),

  'P03-12': (() => {
    const body = box(...BOX);
    return prismModel(
      `Прямоугольный параллелепипед ${NAMES}, выделена половина с вершинами A, B, C, A₁, B₁, C₁: она отсечена плоскостью ACC₁A₁`,
      body,
      { sections: [face(body, 'A', 'C', 'C1', 'A1')] },
    );
  })(),

  'P03-13': (() => {
    const body = box(...BOX);
    return prismModel(
      `Прямоугольный параллелепипед ${NAMES}, выделена часть с вершинами A, B, C, D, A₁, B₁: она отсечена плоскостью A₁B₁CD`,
      body,
      { sections: [face(body, 'A1', 'B1', 'C', 'D')] },
    );
  })(),

  'P03-14': (() => {
    const body = box(...BOX);
    return prismModel(
      `Прямоугольный параллелепипед ${NAMES}, выделена часть с вершинами A, D₁, A₁, B, C₁, B₁: она отсечена плоскостью ABC₁D₁`,
      body,
      { sections: [face(body, 'A', 'B', 'C1', 'D1')] },
    );
  })(),

  /* Призма, отсечённая от куба плоскостью через середины двух рёбер,
     выходящих из вершины B, параллельно третьему ребру BB₁. */
  'P03-15': (() => {
    const body = box(CUBE, CUBE, CUBE);
    const m = midEdge(body, 'A', 'B');
    const n = midEdge(body, 'B', 'C');
    const cut = { points: [m, n, lift(n, CUBE), lift(m, CUBE)] };
    return prismModel(
      'Куб, от него отсечена треугольная призма: плоскость проходит через середины двух рёбер, выходящих из одной вершины, и параллельна третьему',
      unlabelled(body),
      { sections: [cut] },
    );
  })(),

  'P03-16': (() => {
    const body = box(CUBE, CUBE, CUBE);
    const m = midEdge(body, 'A', 'B');
    const n = midEdge(body, 'B', 'C');
    const cut = { points: [m, n, lift(n, CUBE), lift(m, CUBE)] };
    return prismModel(
      'Куб, от него отсечена треугольная призма: плоскость проходит через середины двух рёбер, выходящих из одной вершины, и параллельна третьему',
      unlabelled(body),
      { sections: [cut] },
    );
  })(),

  'P03-17': (() => {
    const body = box(...BOX);
    return prismModel(
      `Прямоугольный параллелепипед ${NAMES}, выделена пирамида с основанием ABCD и вершиной B₁`,
      body,
      {
        lines: [edge(body, 'A', 'B1'), edge(body, 'C', 'B1'), edge(body, 'D', 'B1')],
      },
    );
  })(),

  'P03-18': (() => {
    const body = box(...PRISM);
    return prismModel(
      `Правильная четырёхугольная призма ${NAMES}, выделен многогранник с вершинами A, B, C, A₁, B₁`,
      body,
      {
        lines: [edge(body, 'A', 'C'), edge(body, 'C', 'A1'), edge(body, 'C', 'B1')],
      },
    );
  })(),

  'P03-19': (() => {
    const body = box(...BOX);
    return prismModel(
      `Прямоугольный параллелепипед ${NAMES}, выделен тетраэдр с вершинами A, B, C, B₁`,
      body,
      {
        lines: [edge(body, 'A', 'C'), edge(body, 'A', 'B1'), edge(body, 'C', 'B1')],
      },
    );
  })(),
};
