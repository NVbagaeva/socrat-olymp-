/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №12.
 *
 * График f(x) = k·logₐ x: в разделе такой записи нет (12L — logₐ x,
 * b + logₐ x, logₐ(x + b)), а кривую рисует тот же движок — семейство
 * `loga` (families/loga.js) умеет множитель k. Отмеченные точки — узлы
 * сетки: x = rⁿ, y = c·n. Подвох задачи: k и a по отдельности не
 * находятся, но f(x) = k·logₐ x = c·log_r x, где c = f(r).
 *
 * В наборы 12L, тренажёр и генератор №12 шаблон не входит.
 */

import renderer from './renderer.js';
import './families/loga.js';
import { asymptotes, verticalAsymptote } from './families/shared.js';

export interface KLog {
  /** Основание, в котором точки читаются: f(x) = c·log_r x. */
  r: number;
  /** f(r) = c — целое. */
  c: number;
  /** Абсциссы отмеченных точек: степени r (1, r, r² …), значения — целые. */
  marks: number[];
  /** Спрошенное значение функции. */
  y0: number;
}

export interface KLogTask {
  uslovie: string;
  otvet: number;
  /** Независимый счёт: решение f(x) = y0 численно (бисекция по кривой). */
  proverka: number;
  svg: string;
  svgUchitel: string;
  points: { x: number; y: number }[];
  /** Шаги разбора: подпись и строки с $…$. */
  shagi: { title: string; lines: string[] }[];
  hints: { question: string; options: string[]; correct: number; comment?: string }[];
}

const log = (x: number, r: number) => Math.log(x) / Math.log(r);
const round9 = (x: number) => Math.round(x * 1e9) / 1e9;
const dec = (x: number) => String(round9(x)).replace('.', '{,}').replace('-', '-');
/** Целое ли (с допуском). */
const celoe = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;

function scene(p: KLog, points: { x: number; y: number }[], uchitel: boolean) {
  const ys = points.map((t) => t.y);
  const xs = points.map((t) => t.x);
  /* Хвост у асимптоты обрезаем там, где кривая ещё отстоит от оси Oy
     на 0,2 клетки (то же правило, что у 12L). */
  const tail = Math.ceil(p.c * log(0.2, p.r));
  const win = {
    xmin: -2,
    xmax: Math.max(...xs) + 2,
    ymin: Math.max(Math.min(tail, -2), -4),
    ymax: Math.max(...ys) + 2,
  };
  const guides = uchitel
    ? points.flatMap((t) => [
        ...(t.y !== 0
          ? [{ type: 'segment', from: [t.x, 0], to: [t.x, t.y], style: 'dashed', color: 'accent' }]
          : []),
        { type: 'segment', from: [0, t.y], to: [t.x, t.y], style: 'dashed', color: 'accent' },
      ])
    : [];
  return {
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ type: 'loga', a: p.r, k: p.c, c: 0, d: 0, color: 'lineA', label: null }],
    points: points.map((t) => ({ x: t.x, y: t.y, style: 'solid', color: 'lineA', label: null })),
    shapes: asymptotes([verticalAsymptote(0, win)]).concat(guides),
    alt: 'График функции f(x) = k·logₐ x с отмеченными точками в узлах сетки',
  };
}

export function kLog(p: KLog): KLogTask {
  const points = p.marks.map((x) => ({ x, y: round9(p.c * log(x, p.r)) }));
  if (!points.every((t) => celoe(t.x) && celoe(t.y))) {
    throw new Error('kLog: точки не в узлах сетки');
  }
  const n0 = p.y0 / p.c;
  const otvet = round9(p.r ** n0);
  /* Второй счёт: бисекция по самой кривой на (0; 1000). */
  const f = (x: number) => p.c * log(x, p.r);
  let lo = 1e-9;
  let hi = 1000;
  for (let i = 0; i < 200; i += 1) {
    const m = (lo + hi) / 2;
    if (f(m) < p.y0) lo = m;
    else hi = m;
  }
  const proverka = (lo + hi) / 2;
  const [, A, B] = points;
  const Pr = points.find((t) => t.x === p.r) ?? A!;
  const tochki = points.map((t) => `$(${dec(t.x)};\\ ${dec(t.y)})$`).join(', ');
  const n0tex = celoe(n0) ? dec(n0) : `\\dfrac{${p.y0}}{${p.c}}`;
  const shagi = [
    {
      title: 'Читаем точки',
      lines: [`На графике отмечены узлы сетки ${tochki}.`],
    },
    {
      title: 'Что дают точки',
      lines: [
        `Точка $(1;\\ 0)$ лежит на любом графике $k\\log_a x$: $\\log_a 1=0$. Из точки $(${dec(Pr.x)};\\ ${dec(Pr.y)})$: $k\\log_a ${dec(p.r)}=${dec(p.c)}$.`,
        `По отдельности $k$ и $a$ не находятся — и не нужны: по формуле перехода $\\log_a x=\\log_a ${dec(p.r)}\\cdot\\log_{${dec(p.r)}} x$, поэтому $f(x)=k\\log_a ${dec(p.r)}\\cdot\\log_{${dec(p.r)}} x=${dec(p.c)}\\log_{${dec(p.r)}} x$.`,
        ...(B === undefined || B === Pr
          ? []
          : [
              `Проверяем по третьей точке: $f(${dec(B.x)})=${dec(p.c)}\\log_{${dec(p.r)}} ${dec(B.x)}=${dec(B.y)}$ — сходится.`,
            ]),
      ],
    },
    {
      title: 'Решаем уравнение',
      lines: [
        `$${dec(p.c)}\\log_{${dec(p.r)}} x=${dec(p.y0)}$, откуда $\\log_{${dec(p.r)}} x=${n0tex}$.`,
        `По определению логарифма $x=${dec(p.r)}^{${n0tex}}=${dec(otvet)}$.`,
      ],
    },
  ];
  const r = dec(p.r);
  const hints = [
    {
      question: 'Можно ли по графику найти $k$ и $a$ по отдельности?',
      options: [
        `Нет, но $f(x)=${dec(p.c)}\\log_{${r}} x$ — этого достаточно`,
        `Да: $k=${dec(p.c)}$, $a=${r}$ — других вариантов нет`,
        'Да: $k=1$, а $a$ читается по точке',
      ],
      correct: 0,
      comment: `$k\\log_a x=k\\log_a ${r}\\cdot\\log_{${r}} x$, а $k\\log_a ${r}=f(${r})=${dec(p.c)}$.`,
    },
    {
      question: `Какое уравнение решаем?`,
      options: [
        `$\\log_{${r}} x=${dec(p.y0)}$`,
        `$${dec(p.c)}\\log_{${r}} x=${dec(p.y0)}$`,
        `$${dec(p.c)}\\log_{${r}} x=0$`,
      ],
      correct: 1,
    },
    {
      question: 'Чему равен $x$?',
      options: [`$${r}^{${n0tex}}$`, `$${r}^{${dec(p.y0)}}$`, `$${dec(p.y0)}^{${r}}$`],
      correct: 0,
      comment: `$\\log_{${r}} x=${n0tex}$ значит $x=${r}^{${n0tex}}=${dec(otvet)}$.`,
    },
  ];
  return {
    uslovie: `На рисунке изображён график функции вида $f(x)=k\\log_a x$. При каком значении $x$ функция $f(x)$ принимает значение $${dec(p.y0)}$?`,
    otvet,
    proverka,
    svg: renderer.renderGraph(scene(p, points, false)),
    svgUchitel: renderer.renderGraph(scene(p, points, true)),
    points,
    shagi,
    hints,
  };
}
