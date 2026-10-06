/**
 * Движок рисунков задания №2: renderVectorPlane(config) → строка SVG.
 *
 * Чистая функция без React и без знания о задачах. Сетка, оси, стрелки
 * осей, подписи 0, 1, x, y нарисованы тем же пером, что чертежи
 * задания №12: тема (цвета-токены, толщины, кегли, клетка) и текстовые
 * примитивы берутся из lib/graph/renderer.js. Своё здесь только то,
 * чего у графиков нет: векторы с наконечником, подписи «буква со
 * стрелкой», проекции на оси и катеты смещений.
 *
 * Остриё наконечника — ровно узел сетки конца вектора: наконечник
 * рисуется многоугольником от точки узла, стержень укорочен под него.
 * SVG-маркер не используется намеренно: с ним положение острия
 * зависит от refX и markerUnits, и проверить его числом нельзя.
 *
 * Подпись вектора ставится у середины со смещением по нормали; место
 * выбирается из кандидатов (две стороны, несколько смещений и сдвигов
 * вдоль вектора) так, чтобы её прямоугольник не касался ни одного
 * отрезка, оси, стрелки и другой подписи. Если такого места нет,
 * подпись ставится в лучшее из плохих, а в отчёт пишется нарушение:
 * генератор по отчёту отбраковывает расположение.
 *
 * Всё размещение и все нарушения попадают в Report — по нему движок
 * проверяется автотестом (selftest.ts) без разбора SVG.
 */

import { THEME, esc, fmt, px, svgText, textWidth } from '@/lib/graph/renderer.js';
import { type Rect, type Seg, pointSegDist, rectGap, segRectDist, segSegDist } from './geometry';
import {
  DEFAULT_WINDOW,
  type Box,
  type Okno,
  type Report,
  type ReportVector,
  type Risunok,
  type Tochka,
  type Vektor,
} from './types';

/* Оформление, которого нет в теме графиков: наконечник, подписи
   векторов, катеты, проекции. Всё, что есть в THEME, берётся оттуда. */
const V = {
  /* Вектор — цвет графика №12 (lineA, токен --color-primary): в ч/б
     теме печати тот же токен становится чёрным. Своего цвета нет. */
  color: THEME.colors.lineA,
  shaftWidth: THEME.width.curve,
  /* Наконечник узкий и вытянутый, как в задачах ЕГЭ: длина к половине
     ширины — 4 : 1, ширина основания согласована со стержнем. */
  headLen: 16,
  headHalf: 4,
  /* Заход стержня и оси под наконечник: без него на стыке при
     сглаживании виден светлый зазор. Меньше половины толщины линии,
     основание наконечника при этом не пересекается. */
  overlap: 0.5,
  /* Подпись вектора: жирная курсивная антиква со стрелкой сверху. */
  label: {
    size: 20,
    family: THEME.font.curveLabelFamily,
    weight: THEME.font.curveLabelWeight,
    track: 0.62,
    offsets: [9, 14, 20, 26, 32, 40],
    shifts: [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8],
    gap: 3,
    otherSidePenalty: 4,
    arrowRise: 4,
    arrowHead: 3.5,
  },
  /* Числа у осей: 0, 1 и координаты проекций. В ФИПИ они заметно
     жирнее подписей графиков, и читаются с телефона. */
  tick: { size: 14, weight: 600, gapX: 17, gapY: 7, originGap: 5 },
  axisName: { size: THEME.font.axisName, belowX: 19, leftY: 8, downY: 15 },
  proj: { dash: '5 4', width: 1.4, tick: 3.5 },
  hint: { dash: '6 4', width: THEME.width.helper, size: 15, weight: 600, gap: 11 },
  /* Минимальная дистанция между векторами и минимальная длина, в клетках. */
  minDist: 1,
  minLen: 2,
};

export function emptyReport(): Report {
  return {
    window: { ...DEFAULT_WINDOW },
    cell: THEME.geometry.cell,
    width: 0,
    height: 0,
    grid: true,
    hints: false,
    axes: { x: 0, y: 0, tipX: 0, tipY: 0, arrowLen: THEME.geometry.arrowLen },
    head: { len: V.headLen, half: V.headHalf, shaftWidth: V.shaftWidth, overlap: V.overlap },
    vectors: [],
    boxes: [],
    ticks: [],
    problems: [],
  };
}

/* Препятствие для подписи: отрезок с «толщиной» r (половина ширины
   линии) или готовый прямоугольник. */
interface Obstacle {
  seg?: Seg;
  r?: number;
  rect?: Rect;
  what: string;
}

function boxRect(b: Box): Rect {
  return { left: b.x - b.halfW, right: b.x + b.halfW, top: b.y - b.halfH, bottom: b.y + b.halfH };
}

function clearance(rect: Rect, obstacles: Obstacle[]): { min: number; what: string } {
  let min = Infinity;
  let what = '';
  for (const o of obstacles) {
    const d = o.seg ? segRectDist(o.seg, rect) - (o.r ?? 0) : rectGap(o.rect as Rect, rect);
    if (d < min) {
      min = d;
      what = o.what;
    }
  }
  return { min, what };
}

/* Подпись катета — длина в клетках, без знака: знак координаты
   объясняется словами в подсказке и решении, а не на рисунке. */
function dlina(value: number): string {
  return String(Math.abs(value));
}

/** Окно рисунка: заданное или по умолчанию, расширенное под векторы с запасом в клетку. */
export function resolveWindow(config: Risunok): Okno {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const v of config.vectors) {
    xs.push(v.from[0], v.to[0]);
    ys.push(v.from[1], v.to[1]);
  }
  if (config.window === 'tight') {
    return {
      xmin: Math.min(-1, ...xs.map((x) => x - 1)),
      xmax: Math.max(2, ...xs.map((x) => x + 1)),
      ymin: Math.min(-1, ...ys.map((y) => y - 1)),
      ymax: Math.max(2, ...ys.map((y) => y + 1)),
    };
  }
  const base = config.window ?? DEFAULT_WINDOW;
  return {
    xmin: Math.min(base.xmin, ...xs.map((x) => x - 1)),
    xmax: Math.max(base.xmax, ...xs.map((x) => x + 1)),
    ymin: Math.min(base.ymin, ...ys.map((y) => y - 1)),
    ymax: Math.max(base.ymax, ...ys.map((y) => y + 1)),
  };
}

export function renderVectorPlane(config: Risunok, report?: Report): string {
  const R = report ?? emptyReport();
  const win = resolveWindow(config);
  const cell = config.cell ?? THEME.geometry.cell;
  const g = THEME.geometry;
  const showGrid = config.grid !== false;
  /* Без сетки координаты читаются по проекциям на оси, и катеты
     легли бы прямо на них: в этом режиме подсказка катетов не нужна. */
  const hints = config.hints === true && showGrid;
  const width = (win.xmax - win.xmin) * cell + g.pad * 2;
  const height = (win.ymax - win.ymin) * cell + g.pad * 2;
  const sx = (x: number) => g.pad + (x - win.xmin) * cell;
  const sy = (y: number) => g.pad + (win.ymax - y) * cell;
  const axisX = sy(0);
  const axisY = sx(0);
  const tipX = sx(win.xmax) + g.arrowExtend;
  const tipY = sy(win.ymax) - g.arrowExtend;

  Object.assign(R, {
    axes: { x: axisX, y: axisY, tipX, tipY, arrowLen: g.arrowLen },
    head: { len: V.headLen, half: V.headHalf, shaftWidth: V.shaftWidth, overlap: V.overlap },
    window: win,
    cell,
    width,
    height,
    grid: showGrid,
    hints,
    vectors: [],
    boxes: [],
    ticks: [],
    problems: [],
  });

  const problems = R.problems;
  const boxes = R.boxes;
  const obstacles: Obstacle[] = [];
  const addBox = (b: Box) => {
    boxes.push(b);
    obstacles.push({ rect: boxRect(b), what: `подпись ${b.id}` });
  };

  /* ── Проверка самих векторов: то, что обещает генератор ──────── */
  const cellSegs = config.vectors.map((v) => ({
    v,
    seg: { x1: v.from[0], y1: v.from[1], x2: v.to[0], y2: v.to[1] } as Seg,
  }));
  for (const { v, seg } of cellSegs) {
    const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
    if (len < V.minLen - 1e-9) {
      problems.push(`вектор ${v.name} короче ${V.minLen} клеток`);
    }
    if ((seg.y1 === 0 && seg.y2 === 0) || (seg.x1 === 0 && seg.x2 === 0)) {
      problems.push(`вектор ${v.name} лежит на оси`);
    }
    for (const c of [v.from, v.to]) {
      if (!Number.isInteger(c[0]) || !Number.isInteger(c[1])) {
        problems.push(`вектор ${v.name}: координаты не целые`);
      }
    }
  }
  for (let i = 0; i < cellSegs.length; i += 1) {
    for (let j = i + 1; j < cellSegs.length; j += 1) {
      const a = cellSegs[i]!;
      const b = cellSegs[j]!;
      /* Общее начало (оба вектора из одной точки, как в B6) — не
         касание: тогда дистанция меряется от концов до чужого вектора. */
      const sharedStart = a.seg.x1 === b.seg.x1 && a.seg.y1 === b.seg.y1;
      const d = sharedStart
        ? Math.min(pointSegDist(a.seg.x2, a.seg.y2, b.seg), pointSegDist(b.seg.x2, b.seg.y2, a.seg))
        : segSegDist(a.seg, b.seg);
      if (d < V.minDist - 1e-9) {
        problems.push(
          d === 0
            ? `векторы ${cellSegs[i]!.v.name} и ${cellSegs[j]!.v.name} пересекаются или касаются`
            : `векторы ${cellSegs[i]!.v.name} и ${cellSegs[j]!.v.name} ближе ${V.minDist} клетки`,
        );
      }
    }
  }

  const head: string[] = [];
  const gridLayer: string[] = [];
  const axisLayer: string[] = [];
  const helperLayer: string[] = [];
  const vectorLayer: string[] = [];
  const labelLayer: string[] = [];

  head.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px(width)} ${px(height)}" width="${px(width)}" height="${px(height)}" class="vp" role="img"` +
      (config.alt ? ` aria-label="${esc(config.alt)}"` : ' aria-hidden="true"') +
      ' style="max-width:100%;height:auto">',
  );
  if (config.alt) {
    head.push(`<title>${esc(config.alt)}</title>`);
  }
  head.push(
    `<rect x="0" y="0" width="${px(width)}" height="${px(height)}" fill="${THEME.colors.bg}"/>`,
  );

  /* ── Сетка: внутренние линии, рамки нет ──────────────────────── */
  if (showGrid) {
    const lines: string[] = [];
    for (let gx = win.xmin + 1; gx < win.xmax; gx += 1) {
      lines.push(`M${px(sx(gx))} ${px(sy(win.ymin))}V${px(sy(win.ymax))}`);
    }
    for (let gy = win.ymin + 1; gy < win.ymax; gy += 1) {
      lines.push(`M${px(sx(win.xmin))} ${px(sy(gy))}H${px(sx(win.xmax))}`);
    }
    gridLayer.push(
      `<path class="vp-grid" d="${lines.join('')}" fill="none" stroke="${THEME.colors.grid}" stroke-width="${THEME.width.grid}"/>`,
    );
  }

  /* ── Оси со стрелками: наконечники той же формы и размера, что у
     графиков №12 (arrowLen, arrowHalf из THEME). Линия оси кончается
     у основания наконечника: остриё острое, за него ничего не
     выступает. ─────────────────────────────────────────────────── */
  axisLayer.push(
    `<path class="vp-axes" d="M${px(sx(win.xmin))} ${px(axisX)}H${px(tipX - g.arrowLen + V.overlap)}M${px(axisY)} ${px(sy(win.ymin))}V${px(tipY + g.arrowLen - V.overlap)}" fill="none" stroke="${THEME.colors.axis}" stroke-width="${THEME.width.axis}" stroke-linecap="butt"/>`,
  );
  axisLayer.push(
    `<path class="vp-axes-heads" d="M${px(tipX)} ${px(axisX)}L${px(tipX - g.arrowLen)} ${px(axisX - g.arrowHalf)}L${px(tipX - g.arrowLen)} ${px(axisX + g.arrowHalf)}ZM${px(axisY)} ${px(tipY)}L${px(axisY - g.arrowHalf)} ${px(tipY + g.arrowLen)}L${px(axisY + g.arrowHalf)} ${px(tipY + g.arrowLen)}Z" fill="${THEME.colors.axis}"/>`,
  );
  const axisR = THEME.width.axis / 2;
  obstacles.push({
    seg: { x1: sx(win.xmin), y1: axisX, x2: tipX, y2: axisX },
    r: axisR,
    what: 'ось x',
  });
  obstacles.push({
    seg: { x1: axisY, y1: sy(win.ymin), x2: axisY, y2: tipY },
    r: axisR,
    what: 'ось y',
  });
  obstacles.push({
    seg: {
      x1: tipX - g.arrowLen,
      y1: axisX - g.arrowHalf,
      x2: tipX - g.arrowLen,
      y2: axisX + g.arrowHalf,
    },
    r: 0,
    what: 'стрелка оси x',
  });
  obstacles.push({
    seg: {
      x1: axisY - g.arrowHalf,
      y1: tipY + g.arrowLen,
      x2: axisY + g.arrowHalf,
      y2: tipY + g.arrowLen,
    },
    r: 0,
    what: 'стрелка оси y',
  });

  /* Подписи осей: x под стрелкой оси x, y слева от стрелки оси y — как в ФИПИ. */
  const nameW = (t: string) => textWidth(t, V.axisName.size);
  const xName: Box = {
    kind: 'axisName',
    id: 'x',
    x: tipX - 3 - nameW('x') / 2,
    y: axisX + V.axisName.belowX - V.axisName.size * 0.35,
    halfW: nameW('x') / 2 + 1,
    halfH: V.axisName.size * 0.42,
  };
  const yName: Box = {
    kind: 'axisName',
    id: 'y',
    x: axisY - V.axisName.leftY - nameW('y') / 2,
    y: tipY + V.axisName.downY - V.axisName.size * 0.3,
    halfW: nameW('y') / 2 + 1,
    halfH: V.axisName.size * 0.48,
  };
  labelLayer.push(
    svgText('x', tipX - 3, axisX + V.axisName.belowX, 'end', {
      size: V.axisName.size,
      style: 'italic',
    }),
  );
  labelLayer.push(
    svgText('y', axisY - V.axisName.leftY, tipY + V.axisName.downY, 'end', {
      size: V.axisName.size,
      style: 'italic',
    }),
  );
  addBox(xName);
  addBox(yName);

  /* ── Числа у осей ────────────────────────────────────────────── */
  const tickBoxX = (at: number, text: string): Box => ({
    kind: 'tick',
    id: `x=${text}`,
    x: sx(at),
    y: axisX + V.tick.gapX - V.tick.size * 0.35,
    halfW: textWidth(text, V.tick.size) / 2 + 1.5,
    halfH: V.tick.size * 0.42,
  });
  const tickBoxY = (at: number, text: string): Box => ({
    kind: 'tick',
    id: `y=${text}`,
    x: axisY - V.tick.gapY - textWidth(text, V.tick.size) / 2,
    y: sy(at),
    halfW: textWidth(text, V.tick.size) / 2 + 1.5,
    halfH: V.tick.size * 0.42,
  });
  const tickOpts = {
    size: V.tick.size,
    weight: V.tick.weight,
    extra: "font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1",
  };
  const tickTextX = (at: number, text: string) =>
    svgText(text, sx(at), axisX + V.tick.gapX, 'middle', tickOpts);
  const tickTextY = (at: number, text: string) =>
    svgText(text, axisY - V.tick.gapY, sy(at) + V.tick.size * 0.36, 'end', tickOpts);

  /* «0» слева-снизу от начала координат. */
  const zeroW = textWidth('0', V.tick.size);
  const zero: Box = {
    kind: 'tick',
    id: '0',
    x: axisY - V.tick.originGap - zeroW / 2,
    y: axisX + V.tick.gapX - V.tick.size * 0.35,
    halfW: zeroW / 2 + 1.5,
    halfH: V.tick.size * 0.42,
  };
  labelLayer.push(svgText('0', axisY - V.tick.originGap, axisX + V.tick.gapX, 'end', tickOpts));
  addBox(zero);

  if (showGrid) {
    labelLayer.push(tickTextX(1, '1'));
    labelLayer.push(tickTextY(1, '1'));
    addBox(tickBoxX(1, '1'));
    addBox(tickBoxY(1, '1'));
    axisLayer.push(
      `<path class="vp-ticks" d="M${px(sx(1))} ${px(axisX - g.tick)}v${px(g.tick * 2)}M${px(axisY - g.tick)} ${px(sy(1))}h${px(g.tick * 2)}" stroke="${THEME.colors.axis}" stroke-width="${THEME.width.tick}"/>`,
    );
  } else {
    /* Режим без сетки: проекции концов на оси и числа только у них. */
    const xs = new Set<number>();
    const ys = new Set<number>();
    const proj: string[] = [];
    for (const v of config.vectors) {
      for (const p of [v.from, v.to]) {
        const [x, y] = p;
        if (x !== 0) xs.add(x);
        if (y !== 0) ys.add(y);
        if (x !== 0 && y !== 0) {
          proj.push(`M${px(sx(x))} ${px(sy(y))}V${px(axisX)}`);
          proj.push(`M${px(sx(x))} ${px(sy(y))}H${px(axisY)}`);
          obstacles.push({
            seg: { x1: sx(x), y1: sy(y), x2: sx(x), y2: axisX },
            r: V.proj.width / 2,
            what: `проекция (${x}; ${y})`,
          });
          obstacles.push({
            seg: { x1: sx(x), y1: sy(y), x2: axisY, y2: sy(y) },
            r: V.proj.width / 2,
            what: `проекция (${x}; ${y})`,
          });
        }
      }
    }
    if (proj.length > 0) {
      helperLayer.push(
        `<path class="vp-proj" d="${proj.join('')}" fill="none" stroke="${THEME.colors.axis}" stroke-width="${V.proj.width}" stroke-dasharray="${V.proj.dash}"/>`,
      );
    }
    const ticks: string[] = [];
    const sortedX = [...xs].sort((a, b) => a - b);
    const sortedY = [...ys].sort((a, b) => a - b);
    for (const at of sortedX) {
      labelLayer.push(tickTextX(at, fmt(at)));
      addBox(tickBoxX(at, fmt(at)));
      ticks.push(`M${px(sx(at))} ${px(axisX - V.proj.tick)}v${px(V.proj.tick * 2)}`);
      R.ticks.push({ axis: 'x', at });
    }
    for (const at of sortedY) {
      labelLayer.push(tickTextY(at, fmt(at)));
      addBox(tickBoxY(at, fmt(at)));
      ticks.push(`M${px(axisY - V.proj.tick)} ${px(sy(at))}h${px(V.proj.tick * 2)}`);
      R.ticks.push({ axis: 'y', at });
    }
    if (ticks.length > 0) {
      axisLayer.push(
        `<path class="vp-ticks" d="${ticks.join('')}" stroke="${THEME.colors.axis}" stroke-width="${THEME.width.tick}"/>`,
      );
    }
    for (const list of [sortedX, sortedY]) {
      for (let i = 1; i < list.length; i += 1) {
        if (list[i]! - list[i - 1]! < 1) {
          problems.push(`числа ${fmt(list[i - 1]!)} и ${fmt(list[i]!)} на оси ближе 1`);
        }
      }
      if (list.some((at) => Math.abs(at) < 1)) {
        problems.push('число на оси накрывает «0»');
      }
    }
  }

  /* ── Векторы: стержень и наконечник, остриё в узле ───────────── */
  const vectorSegs: {
    v: Vektor;
    shaft: Seg;
    headSegs: Seg[];
    tip: { x: number; y: number };
    shaftEnd: { x: number; y: number };
  }[] = [];
  for (const v of config.vectors) {
    const x1 = sx(v.from[0]);
    const y1 = sy(v.from[1]);
    const tx = sx(v.to[0]);
    const ty = sy(v.to[1]);
    const len = Math.hypot(tx - x1, ty - y1);
    const ux = len === 0 ? 1 : (tx - x1) / len;
    const uy = len === 0 ? 0 : (ty - y1) / len;
    const bx = tx - ux * V.headLen;
    const by = ty - uy * V.headLen;
    /* Стержень кончается у основания наконечника (с заходом overlap
       внутрь него, где он шире стержня): торец butt не выступает,
       остриё — сама точка узла. */
    const ex = bx + ux * V.overlap;
    const ey = by + uy * V.overlap;
    const w1 = { x: bx - uy * V.headHalf, y: by + ux * V.headHalf };
    const w2 = { x: bx + uy * V.headHalf, y: by - ux * V.headHalf };
    vectorLayer.push(
      `<g class="vp-vector" data-vector="${esc(v.name)}">` +
        `<path class="vp-shaft" d="M${px(x1)} ${px(y1)}L${px(ex)} ${px(ey)}" fill="none" stroke="${V.color}" stroke-width="${V.shaftWidth}" stroke-linecap="butt"/>` +
        /* Без обводки: обводка у острого угла вылезла бы за узел. */
        `<path class="vp-head" d="M${px(tx)} ${px(ty)}L${px(w1.x)} ${px(w1.y)}L${px(w2.x)} ${px(w2.y)}Z" fill="${V.color}" stroke="none"/>` +
        '</g>',
    );
    const shaft: Seg = { x1, y1, x2: ex, y2: ey };
    const headSegs: Seg[] = [
      { x1: tx, y1: ty, x2: w1.x, y2: w1.y },
      { x1: tx, y1: ty, x2: w2.x, y2: w2.y },
      { x1: w1.x, y1: w1.y, x2: w2.x, y2: w2.y },
    ];
    vectorSegs.push({ v, shaft, headSegs, tip: { x: tx, y: ty }, shaftEnd: { x: ex, y: ey } });
    obstacles.push({ seg: shaft, r: V.shaftWidth / 2, what: `вектор ${v.name}` });
    for (const s of headSegs) {
      obstacles.push({ seg: s, r: 0.5, what: `наконечник ${v.name}` });
    }
  }

  /* Вектор не должен накрывать подписи осей и чисел. */
  for (const { v, shaft, headSegs } of vectorSegs) {
    for (const b of boxes) {
      const rect = boxRect(b);
      const d = Math.min(
        segRectDist(shaft, rect) - V.shaftWidth / 2,
        ...headSegs.map((s) => segRectDist(s, rect)),
      );
      if (d < 1) {
        problems.push(`вектор ${v.name} закрывает подпись ${b.id}`);
      }
    }
  }

  /* ── Катеты смещений: только в подсказках ────────────────────── */
  const hintLabels: {
    text: string;
    mx: number;
    my: number;
    nx: number;
    ny: number;
    id: string;
    v: Vektor;
  }[] = [];
  if (hints) {
    for (const v of config.vectors) {
      const dx = v.to[0] - v.from[0];
      const dy = v.to[1] - v.from[1];
      const cx = sx(v.to[0]);
      const cy = sy(v.from[1]);
      const legs: string[] = [];
      if (dx !== 0) legs.push(`M${px(sx(v.from[0]))} ${px(cy)}H${px(cx)}`);
      if (dy !== 0) legs.push(`M${px(cx)} ${px(cy)}V${px(sy(v.to[1]))}`);
      helperLayer.push(
        `<path class="vp-hint-leg" data-hint="${esc(v.name)}" d="${legs.join('')}" fill="none" stroke="${THEME.colors.accent}" stroke-width="${V.hint.width}" stroke-dasharray="${V.hint.dash}"/>`,
      );
      /* Катет не должен проходить по подписям осей и чисел. */
      const legSegs: Seg[] = [];
      if (dx !== 0) legSegs.push({ x1: sx(v.from[0]), y1: cy, x2: cx, y2: cy });
      if (dy !== 0) legSegs.push({ x1: cx, y1: cy, x2: cx, y2: sy(v.to[1]) });
      for (const b of boxes) {
        if (legSegs.some((leg) => segRectDist(leg, boxRect(b)) < 1.5)) {
          problems.push(`катет вектора ${v.name} закрывает подпись ${b.id}`);
        }
      }
      if (dx !== 0) {
        /* Подпись Δx — с внешней стороны катета, напротив вектора. */
        obstacles.push({
          seg: { x1: sx(v.from[0]), y1: cy, x2: cx, y2: cy },
          r: V.hint.width / 2,
          what: `катет Δx ${v.name}`,
        });
        hintLabels.push({
          text: dlina(dx),
          mx: (sx(v.from[0]) + cx) / 2,
          my: cy,
          nx: 0,
          ny: dy > 0 ? 1 : -1,
          id: `Δx ${v.name}`,
          v,
        });
      }
      if (dy !== 0) {
        obstacles.push({
          seg: { x1: cx, y1: cy, x2: cx, y2: sy(v.to[1]) },
          r: V.hint.width / 2,
          what: `катет Δy ${v.name}`,
        });
        hintLabels.push({
          text: dlina(dy),
          mx: cx,
          my: (cy + sy(v.to[1])) / 2,
          nx: dx > 0 ? 1 : -1,
          ny: 0,
          id: `Δy ${v.name}`,
          v,
        });
      }
    }
  }

  /* ── Подписи векторов: буква со стрелкой, место по кандидатам ── */
  const field: Rect = { left: 2, right: width - 2, top: 2, bottom: height - 2 };
  for (const item of vectorSegs) {
    const { v } = item;
    const text = v.name;
    const w = textWidth(text, V.label.size, V.label.track);
    const halfW = Math.max(w / 2 + 2.5, 8);
    const textH = V.label.size * 0.72;
    const boxH = textH + V.label.arrowRise + 2.5 + 2.5 + 2;
    const halfH = boxH / 2;
    const x1 = sx(v.from[0]);
    const y1 = sy(v.from[1]);
    const x2 = item.tip.x;
    const y2 = item.tip.y;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const nx = -uy;
    const ny = ux;
    /* Предпочтительная сторона — от начала координат: так чаще в ФИПИ. */
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const preferred = (mx - axisY) * nx + (my - axisX) * ny >= 0 ? 1 : -1;
    const ext = Math.abs(nx) * halfW + Math.abs(ny) * halfH;
    const own = new Set<string>([`вектор ${v.name}`, `наконечник ${v.name}`]);
    const others = obstacles.filter((o) => !own.has(o.what));
    const selfObstacles = obstacles.filter((o) => own.has(o.what));

    let best: { box: Box; score: number; min: number; what: string } | null = null;
    let chosen: Box | null = null;
    outer: for (const off of V.label.offsets) {
      for (const t of V.label.shifts) {
        for (const side of [preferred, -preferred]) {
          const bx = x1 + ux * len * t + side * nx * (off + ext);
          const by = y1 + uy * len * t + side * ny * (off + ext);
          const box: Box = {
            kind: 'vectorLabel',
            id: `вектор ${text}`,
            x: bx,
            y: by,
            halfW,
            halfH,
          };
          const rect = boxRect(box);
          const inside =
            rectGap(rect, field) < 0 &&
            rect.left >= field.left &&
            rect.right <= field.right &&
            rect.top >= field.top &&
            rect.bottom <= field.bottom;
          const c = clearance(rect, others);
          const self = clearance(rect, selfObstacles).min;
          const min = Math.min(c.min, self, inside ? Infinity : -1);
          const score =
            off + Math.abs(t - 0.5) * 60 + (side === preferred ? 0 : V.label.otherSidePenalty);
          if (min >= V.label.gap) {
            chosen = box;
            break outer;
          }
          if (best === null || min > best.min) {
            best = { box, score, min, what: inside ? c.what : 'край рисунка' };
          }
        }
      }
    }
    if (chosen === null) {
      chosen = (best as { box: Box }).box;
      problems.push(
        `подпись вектора ${v.name} не помещается: мешает ${(best as { what: string }).what}`,
      );
    }
    const baseline = chosen.y - halfH + V.label.arrowRise + 2.5 + 2.5 + textH;
    const arrowY = baseline - textH - V.label.arrowRise;
    const ax1 = chosen.x - w * 0.5;
    const ax2 = chosen.x + w * 0.55;
    labelLayer.push(
      `<g class="vp-label" data-label="${esc(text)}">` +
        svgText(text, chosen.x, baseline, 'middle', {
          size: V.label.size,
          family: V.label.family,
          weight: V.label.weight,
          style: 'italic',
          fill: V.color,
        }) +
        `<path d="M${px(ax1)} ${px(arrowY)}H${px(ax2)}M${px(ax2 - V.label.arrowHead)} ${px(arrowY - V.label.arrowHead * 0.7)}L${px(ax2)} ${px(arrowY)}L${px(ax2 - V.label.arrowHead)} ${px(arrowY + V.label.arrowHead * 0.7)}" fill="none" stroke="${V.color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>` +
        '</g>',
    );
    addBox(chosen);
    const rv: ReportVector = {
      name: v.name,
      from: v.from,
      to: v.to,
      tip: item.tip,
      shaftEnd: item.shaftEnd,
      label: chosen,
    };
    R.vectors.push(rv);
  }

  /* Подписи катетов — после подписей векторов: буква важнее числа,
     а у числа кандидатов больше (две стороны, сдвиг вдоль катета). */
  const hintOpts = {
    size: V.hint.size,
    weight: V.hint.weight,
    fill: THEME.colors.accent,
    extra: "font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1",
  };
  for (const h of hintLabels) {
    const halfW = textWidth(h.text, V.hint.size) / 2 + 1.5;
    const halfH = V.hint.size * 0.42;
    const ext = Math.abs(h.nx) * halfW + Math.abs(h.ny) * halfH;
    /* Вдоль катета: направление, перпендикулярное нормали. */
    const tx = h.ny;
    const ty = h.nx;
    const legHalf =
      h.nx === 0
        ? Math.abs(sx(h.v.to[0]) - sx(h.v.from[0])) / 2
        : Math.abs(sy(h.v.to[1]) - sy(h.v.from[1])) / 2;
    /* Место — по лучшему счёту, а не первое свободное: иначе подписи
       катетов соседних векторов сходятся в один просвет между ними.
       Зазор ценится до 30 px, дальше считаются только смещение,
       сдвиг вдоль катета и сторона (внешняя предпочтительнее). */
    let best: { box: Box; score: number; min: number; what: string } | null = null;
    for (const off of [V.hint.gap, V.hint.gap + 7, V.hint.gap + 14]) {
      for (const shift of [0, 0.3, -0.3, 0.6, -0.6]) {
        for (const side of [1, -1]) {
          const box: Box = {
            kind: 'hint',
            id: h.id,
            x: h.mx + tx * shift * legHalf + side * h.nx * (off + ext),
            y: h.my + ty * shift * legHalf + side * h.ny * (off + ext),
            halfW,
            halfH,
          };
          const rect = boxRect(box);
          const inField =
            rect.left >= 2 && rect.right <= width - 2 && rect.top >= 2 && rect.bottom <= height - 2;
          const c = clearance(rect, obstacles);
          const min = inField ? c.min : -1;
          const score =
            Math.min(min, 30) -
            (off - V.hint.gap) * 0.3 -
            Math.abs(shift) * 4 -
            (side === 1 ? 0 : 3);
          if (best === null || score > best.score) {
            best = { box, score, min, what: inField ? c.what : 'край рисунка' };
          }
        }
      }
    }
    const chosen = (best as { box: Box }).box;
    if ((best as { min: number }).min < V.label.gap) {
      problems.push(
        `подпись катета ${h.id} не помещается: мешает ${(best as { what: string }).what}`,
      );
    }
    labelLayer.push(
      `<g data-hint="${esc(h.v.name)}">` +
        svgText(h.text, chosen.x, chosen.y + V.hint.size * 0.36, 'middle', hintOpts) +
        '</g>',
    );
    addBox(chosen);
  }

  return [
    ...head,
    ...gridLayer,
    ...axisLayer,
    ...helperLayer,
    ...vectorLayer,
    ...labelLayer,
    '</svg>',
  ].join('');
}

/** Координаты конца минус начала: то, что читается с рисунка. */
export function koordinaty(v: Vektor): Tochka {
  return [v.to[0] - v.from[0], v.to[1] - v.from[1]];
}
