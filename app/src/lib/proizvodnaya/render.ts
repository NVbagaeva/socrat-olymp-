/**
 * Движок рисунков задания №9: renderFigura(figura, режим) → строка SVG.
 *
 * Чистая функция без React. Сетка, оси, стрелки, толщины и цвета те же,
 * что у чертежей №12 и №2 (тема и текстовые примитивы берутся из
 * lib/graph/renderer.js). Своё здесь: гладкая кривая по узлам
 * (кубические кривые Безье, точно эрмитов сплайн из spline.ts),
 * выколотые концы, отмеченные точки x₁…xₙ, касательная по двум узлам,
 * закраска, вспомогательные построения.
 *
 * Три режима одного и того же рисунка:
 *   student — лист ученика: только то, что даёт условие. Никаких
 *             пунктиров, треугольников, прямых y = k, отрезков [p; q];
 *   hint    — подсказка тренажёра: вспомогательные построения по шагам;
 *   teacher — лист учителя и разбор: все построения сразу.
 *
 * Подписи ставятся по кандидатам и ни с чем не пересекаются: ни друг с
 * другом, ни с кривой, ни с осями. Если места нет, подпись ставится в
 * лучшее из плохих, а в отчёт пишется нарушение: генератор по отчёту
 * отбраковывает задачу.
 */

import { THEME, esc, px, svgText, textWidth } from '@/lib/graph/renderer.js';
import { type Rect, type Seg, rectGap, segRectDist } from '../vektory/geometry';
import { funkciya } from './reshit';
import { postroit } from './spline';
import type { Figura, Konets, Pomoshch, Tochka } from './types';

type Napr = 'below' | 'above' | 'right' | 'left' | 'below-right' | 'above-right' | 'below-left' | 'above-left';

export type RezhimRisunka = 'student' | 'hint' | 'teacher';

export interface OpciiRisunka {
  rezhim: RezhimRisunka;
  /** Шаг подсказки: показываются построения с shag ≤ этого. По умолчанию все. */
  shag?: number;
}

export interface Podpis {
  kind: string;
  id: string;
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

export interface Otchet {
  width: number;
  height: number;
  cell: number;
  boxes: Podpis[];
  /** Подписи чисел на оси, которым не нашлось места. */
  propushcheny: string[];
  problems: string[];
}

/** Дефис перед числом — типографский минус. */
function minusify(text: string): string {
  return text.replace(/-(?=\d)/g, THEME.minus);
}

export function pustoyOtchet(): Otchet {
  return { width: 0, height: 0, cell: 0, boxes: [], propushcheny: [], problems: [] };
}

const V = {
  curve: THEME.colors.lineA,
  aux: THEME.colors.accent,
  curveWidth: THEME.width.curve,
  tangentWidth: 2.6,
  dash: '6 5',
  dashWidth: 1.8,
  dotR: 4.8,
  endR: 5.2,
  tick: { size: 12.5, weight: 600, gapY: 7, gapX: 16, origin: 5 },
  axisName: { size: THEME.font.axisName, belowX: 19, leftY: 8, downY: 15 },
  mark: { size: 15, sub: 10.5, weight: 600 },
  curveLabel: { size: 20, track: 0.62 },
  helper: { size: 15, weight: 600 },
  gap: 3,
  field: 3,
};

interface Prep {
  seg?: Seg;
  r?: number;
  rect?: Rect;
  what: string;
}

function boxRect(b: Podpis): Rect {
  return { left: b.x - b.halfW, right: b.x + b.halfW, top: b.y - b.halfH, bottom: b.y + b.halfH };
}

function zazor(rect: Rect, obstacles: readonly Prep[]): { min: number; what: string } {
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

/** Подпись переменной с индексом: x₁, x₀. */
function podpisX(sub: string, x: number, y: number, fill: string): string {
  return (
    `<text x="${px(x)}" y="${px(y)}" text-anchor="middle" font-size="${V.mark.size}" font-weight="${V.mark.weight}" fill="${fill}" ` +
    `stroke="${THEME.colors.halo}" stroke-width="${THEME.width.halo}" stroke-linejoin="round" ` +
    `style="font-family:${THEME.font.curveLabelFamily};font-style:italic;paint-order:stroke fill">x` +
    `<tspan font-size="${V.mark.sub}" dy="3" font-style="normal">${esc(sub)}</tspan></text>`
  );
}

function shirinaX(sub: string): number {
  return V.mark.size * 0.55 + sub.length * V.mark.sub * 0.58;
}

/** Дуга угла между направлениями t0 → t1 (против часовой, в градусах математических). */
function duga(cx: number, cy: number, r: number, t0: number, t1: number): string {
  const rad = (t: number) => (t * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(t0));
  const y0 = cy - r * Math.sin(rad(t0));
  const x1 = cx + r * Math.cos(rad(t1));
  const y1 = cy - r * Math.sin(rad(t1));
  const large = Math.abs(t1 - t0) > 180 ? 1 : 0;
  return `M${px(x0)} ${px(y0)}A${px(r)} ${px(r)} 0 ${large} 0 ${px(x1)} ${px(y1)}`;
}

export function renderFigura(fig: Figura, opts: OpciiRisunka, report?: Otchet): string {
  const R = report ?? pustoyOtchet();
  const win = fig.okno;
  const g = THEME.geometry;
  const cell = fig.cell ?? g.cell;
  const showAux = opts.rezhim !== 'student';
  const shagNow = opts.shag ?? Number.POSITIVE_INFINITY;
  const aux = showAux
    ? (fig.pomoshch ?? []).filter((p: Pomoshch) => (p.shag ?? 0) <= shagNow)
    : [];
  const width = (win.xmax - win.xmin) * cell + g.pad * 2;
  const height = (win.ymax - win.ymin) * cell + g.pad * 2;
  const sx = (x: number) => g.pad + (x - win.xmin) * cell;
  const sy = (y: number) => g.pad + (win.ymax - y) * cell;
  const axisX = sy(0);
  const axisY = sx(0);
  const tipX = sx(win.xmax) + g.arrowExtend;
  const tipY = sy(win.ymax) - g.arrowExtend;
  const field: Rect = { left: V.field, right: width - V.field, top: V.field, bottom: height - V.field };

  R.width = width;
  R.height = height;
  R.cell = cell;
  R.boxes = [];
  R.propushcheny = [];
  R.problems = [];
  const problems = R.problems;
  const obstacles: Prep[] = [];

  const addBox = (b: Podpis) => {
    R.boxes.push(b);
    obstacles.push({ rect: boxRect(b), what: `подпись ${b.id}` });
  };

  const layers = {
    head: [] as string[],
    grid: [] as string[],
    fill: [] as string[],
    axis: [] as string[],
    aux: [] as string[],
    curve: [] as string[],
    dots: [] as string[],
    labels: [] as string[],
  };

  layers.head.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px(width)} ${px(height)}" width="${px(width)}" height="${px(height)}" class="pr" role="img"` +
      (fig.alt ? ` aria-label="${esc(fig.alt)}"` : ' aria-hidden="true"') +
      ' style="max-width:100%;height:auto">',
  );
  if (fig.alt) {
    layers.head.push(`<title>${esc(fig.alt)}</title>`);
  }
  layers.head.push(`<rect x="0" y="0" width="${px(width)}" height="${px(height)}" fill="${THEME.colors.bg}"/>`);

  /* ── Сетка ───────────────────────────────────────────────────── */
  {
    const lines: string[] = [];
    for (let gx = win.xmin + 1; gx < win.xmax; gx += 1) {
      lines.push(`M${px(sx(gx))} ${px(sy(win.ymin))}V${px(sy(win.ymax))}`);
    }
    for (let gy = win.ymin + 1; gy < win.ymax; gy += 1) {
      lines.push(`M${px(sx(win.xmin))} ${px(sy(gy))}H${px(sx(win.xmax))}`);
    }
    layers.grid.push(
      `<path class="pr-grid" d="${lines.join('')}" fill="none" stroke="${THEME.colors.grid}" stroke-width="${THEME.width.grid}"/>`,
    );
  }

  /* ── Оси со стрелками ───────────────────────────────────────── */
  layers.axis.push(
    `<path class="pr-axes" d="M${px(sx(win.xmin))} ${px(axisX)}H${px(tipX - g.arrowLen + 0.5)}M${px(axisY)} ${px(sy(win.ymin))}V${px(tipY + g.arrowLen - 0.5)}" fill="none" stroke="${THEME.colors.axis}" stroke-width="${THEME.width.axis}" stroke-linecap="butt"/>`,
    `<path class="pr-axes-heads" d="M${px(tipX)} ${px(axisX)}L${px(tipX - g.arrowLen)} ${px(axisX - g.arrowHalf)}L${px(tipX - g.arrowLen)} ${px(axisX + g.arrowHalf)}ZM${px(axisY)} ${px(tipY)}L${px(axisY - g.arrowHalf)} ${px(tipY + g.arrowLen)}L${px(axisY + g.arrowHalf)} ${px(tipY + g.arrowLen)}Z" fill="${THEME.colors.axis}"/>`,
  );
  const axisR = THEME.width.axis / 2;
  obstacles.push(
    { seg: { x1: sx(win.xmin), y1: axisX, x2: tipX, y2: axisX }, r: axisR, what: 'ось x' },
    { seg: { x1: axisY, y1: sy(win.ymin), x2: axisY, y2: tipY }, r: axisR, what: 'ось y' },
    {
      seg: { x1: tipX - g.arrowLen, y1: axisX - g.arrowHalf, x2: tipX - g.arrowLen, y2: axisX + g.arrowHalf },
      r: 0,
      what: 'стрелка оси x',
    },
    {
      seg: { x1: axisY - g.arrowHalf, y1: tipY + g.arrowLen, x2: axisY + g.arrowHalf, y2: tipY + g.arrowLen },
      r: 0,
      what: 'стрелка оси y',
    },
  );
  const nameW = (t: string) => textWidth(t, V.axisName.size);
  layers.labels.push(
    svgText('x', tipX - 3, axisX + V.axisName.belowX, 'end', { size: V.axisName.size, style: 'italic' }),
    svgText('y', axisY - V.axisName.leftY, tipY + V.axisName.downY, 'end', { size: V.axisName.size, style: 'italic' }),
  );
  addBox({
    kind: 'axisName',
    id: 'x',
    x: tipX - 3 - nameW('x') / 2,
    y: axisX + V.axisName.belowX - V.axisName.size * 0.35,
    halfW: nameW('x') / 2 + 1,
    halfH: V.axisName.size * 0.42,
  });
  addBox({
    kind: 'axisName',
    id: 'y',
    x: axisY - V.axisName.leftY - nameW('y') / 2,
    y: tipY + V.axisName.downY - V.axisName.size * 0.3,
    halfW: nameW('y') / 2 + 1,
    halfH: V.axisName.size * 0.48,
  });

  /* ── Кривая ──────────────────────────────────────────────────── */
  const f = funkciya(fig);
  const first = fig.uzly[0];
  const last = fig.uzly[fig.uzly.length - 1];
  const lo = first === undefined ? 0 : first.x;
  const hi = last === undefined ? 0 : last.x;
  const polyline: { x: number; y: number }[] = [];
  let pathD = '';
  if (fig.rezhim === 'pryamaya' && first !== undefined && last !== undefined) {
    const k = (last.y - first.y) / (last.x - first.x);
    const x1 = win.xmin;
    const x2 = win.xmax;
    pathD = `M${px(sx(x1))} ${px(sy(first.y + k * (x1 - first.x)))}L${px(sx(x2))} ${px(sy(first.y + k * (x2 - first.x)))}`;
    for (let x = x1; x <= x2 + 1e-9; x += 0.25) {
      polyline.push({ x, y: first.y + k * (x - first.x) });
    }
  } else if (fig.rezhim === 'lomanaya') {
    pathD = fig.uzly.map((u, i) => `${i === 0 ? 'M' : 'L'}${px(sx(u.x))} ${px(sy(u.y))}`).join('');
    for (const u of fig.uzly) {
      polyline.push({ x: u.x, y: u.y });
    }
  } else if (fig.uzly.length >= 2) {
    const spl = postroit(fig.uzly);
    pathD = `M${px(sx(lo))} ${px(sy((first as { y: number }).y))}`;
    for (let i = 0; i < fig.uzly.length - 1; i += 1) {
      const a = fig.uzly[i] as { x: number; y: number };
      const b = fig.uzly[i + 1] as { x: number; y: number };
      const h = b.x - a.x;
      const m0 = spl.m[i] as number;
      const m1 = spl.m[i + 1] as number;
      pathD += `C${px(sx(a.x + h / 3))} ${px(sy(a.y + (h / 3) * m0))} ${px(sx(b.x - h / 3))} ${px(sy(b.y - (h / 3) * m1))} ${px(sx(b.x))} ${px(sy(b.y))}`;
    }
    for (let x = lo; x <= hi + 1e-9; x += 0.1) {
      polyline.push({ x, y: spl.y(x) });
    }
  }
  for (let i = 0; i < polyline.length - 1; i += 1) {
    const p1 = polyline[i] as { x: number; y: number };
    const p2 = polyline[i + 1] as { x: number; y: number };
    obstacles.push({
      seg: { x1: sx(p1.x), y1: sy(p1.y), x2: sx(p2.x), y2: sy(p2.y) },
      r: V.curveWidth / 2,
      what: 'график',
    });
  }

  /* Закраска между графиком и осью. */
  if (fig.zalivka !== undefined) {
    const { a, b } = fig.zalivka;
    let d = `M${px(sx(a))} ${px(axisX)}`;
    for (let x = a; x <= b + 1e-9; x += 0.05) {
      d += `L${px(sx(x))} ${px(sy(f.y(x)))}`;
    }
    d += `L${px(sx(b))} ${px(axisX)}Z`;
    layers.fill.push(
      `<path class="pr-fill" d="${d}" fill="${V.curve}" fill-opacity="0.22" stroke="none"/>`,
    );
  }
  layers.curve.push(
    `<path class="pr-curve" d="${pathD}" fill="none" stroke="${V.curve}" stroke-width="${V.curveWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
  );

  /* Концы: выколотые и закрашенные. */
  const concy: [Konets, number, number][] = [];
  if (first !== undefined && last !== undefined && fig.rezhim !== 'pryamaya') {
    concy.push([fig.levyy, first.x, first.y], [fig.pravyy, last.x, last.y]);
  }
  for (const [kind, x, y] of concy) {
    if (kind === 'none') {
      continue;
    }
    layers.dots.push(
      `<circle class="pr-end" cx="${px(sx(x))}" cy="${px(sy(y))}" r="${V.endR}" fill="${kind === 'open' ? THEME.colors.bg : V.curve}" stroke="${V.curve}" stroke-width="2.6"/>`,
    );
    obstacles.push({ seg: { x1: sx(x), y1: sy(y), x2: sx(x), y2: sy(y) }, r: V.endR + 1.5, what: 'конец графика' });
  }
  if (fig.rezhim === 'lomanaya') {
    /* Вершины ломаной — узлы сетки, отмечены точками. */
    for (const u of fig.uzly) {
      if (u === first || u === last) {
        continue;
      }
      layers.dots.push(
        `<circle cx="${px(sx(u.x))}" cy="${px(sy(u.y))}" r="${V.dotR - 1}" fill="${V.curve}" stroke="${THEME.colors.halo}" stroke-width="1.5"/>`,
      );
    }
  }

  /* ── Касательная и прямая ───────────────────────────────────── */
  let kas: { a: Tochka; b: Tochka; x0: number | null } | null = null;
  if (fig.kasatelnaya !== undefined) {
    kas = { a: fig.kasatelnaya.a, b: fig.kasatelnaya.b, x0: fig.kasatelnaya.x0 };
  } else if (fig.rezhim === 'pryamaya' && first !== undefined && last !== undefined) {
    kas = { a: [first.x, first.y], b: [last.x, last.y], x0: null };
  }
  const dotsPoints: { x: number; y: number; fill: string; r: number; what: string }[] = [];
  if (kas !== null) {
    const [ax, ay] = kas.a;
    const [bx, by] = kas.b;
    const k = (by - ay) / (bx - ax);
    if (fig.rezhim !== 'pryamaya') {
      /* Касательная — прямая через два узла, продлённая до рамки окна. */
      const x1 = win.xmin;
      const x2 = win.xmax;
      const yAt = (x: number) => ay + k * (x - ax);
      /* Обрезка по рамке окна: пересечения с левой и правой сторонами и с верхом и низом. */
      const clipX = (y: number) => ax + (y - ay) / k;
      const xs = [x1, x2, clipX(win.ymin), clipX(win.ymax)].filter((x) => x >= x1 - 1e-9 && x <= x2 + 1e-9);
      xs.sort((p, q) => p - q);
      const xa = xs[0] as number;
      const xb = xs[xs.length - 1] as number;
      layers.curve.push(
        `<path class="pr-tangent" d="M${px(sx(xa))} ${px(sy(yAt(xa)))}L${px(sx(xb))} ${px(sy(yAt(xb)))}" fill="none" stroke="${V.aux}" stroke-width="${V.tangentWidth}" stroke-linecap="round"/>`,
      );
      for (let i = 0; i < 40; i += 1) {
        const x = xa + ((xb - xa) * i) / 40;
        const x2n = xa + ((xb - xa) * (i + 1)) / 40;
        obstacles.push({
          seg: { x1: sx(x), y1: sy(yAt(x)), x2: sx(x2n), y2: sy(yAt(x2n)) },
          r: V.tangentWidth / 2,
          what: 'касательная',
        });
      }
    } else {
      /* Прямая уже нарисована как «кривая». */
    }
    for (const p of [kas.a, kas.b]) {
      dotsPoints.push({ x: p[0], y: p[1], fill: V.aux, r: V.dotR, what: 'узел прямой' });
    }
    if (kas.x0 !== null) {
      dotsPoints.push({ x: kas.x0, y: f.y(kas.x0), fill: THEME.colors.axis, r: V.dotR, what: 'точка касания' });
    }
  }

  /* ── Отмеченные точки на оси ─────────────────────────────────── */
  const metki = fig.metki ?? [];
  metki.forEach((m) => {
    dotsPoints.push({ x: m, y: 0, fill: THEME.colors.axis, r: V.dotR, what: 'отмеченная точка' });
  });

  /* ── Вспомогательные построения ─────────────────────────────── */
  const auxDots: { x: number; y: number; fill: string }[] = [];
  const auxLabels: { text: string; sub?: string; x: number; y: number; kind: string; id: string; fill: string; pref: Napr }[] = [];
  for (const item of aux) {
    switch (item.t) {
      case 'vert': {
        const yv = f.y(item.x);
        layers.aux.push(
          `<path class="pr-aux" d="M${px(sx(item.x))} ${px(axisX)}V${px(sy(yv))}" fill="none" stroke="${V.aux}" stroke-width="${V.dashWidth}" stroke-dasharray="${V.dash}"/>`,
        );
        obstacles.push({ seg: { x1: sx(item.x), y1: axisX, x2: sx(item.x), y2: sy(yv) }, r: 1, what: 'пунктир' });
        auxDots.push({ x: item.x, y: yv, fill: V.aux });
        break;
      }
      case 'goriz': {
        layers.aux.push(
          `<path class="pr-aux" d="M${px(sx(win.xmin))} ${px(sy(item.y))}H${px(sx(win.xmax))}" fill="none" stroke="${V.aux}" stroke-width="${V.dashWidth}" stroke-dasharray="${V.dash}"/>`,
        );
        obstacles.push({
          seg: { x1: sx(win.xmin), y1: sy(item.y), x2: sx(win.xmax), y2: sy(item.y) },
          r: 1,
          what: 'пунктир y = k',
        });
        break;
      }
      case 'tochka':
        auxDots.push({ x: item.x, y: item.y, fill: V.aux });
        break;
      case 'otrezok': {
        layers.aux.push(
          `<path class="pr-aux-seg" d="M${px(sx(item.p))} ${px(axisX)}H${px(sx(item.q))}" fill="none" stroke="${V.aux}" stroke-opacity="0.55" stroke-width="9" stroke-linecap="butt"/>`,
        );
        break;
      }
      default:
        break;
    }
  }

  /* Треугольник наклона. */
  const treugolnik = aux.some((p) => p.t === 'treugolnik');
  if (treugolnik && kas !== null) {
    const pts = [kas.a, kas.b].sort((p, q) => p[0] - q[0]);
    const A = pts[0] as Tochka;
    const B = pts[1] as Tochka;
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const rising = dy > 0;
    const C: Tochka = rising ? [B[0], A[1]] : [A[0], B[1]];
    const legH = rising ? `M${px(sx(A[0]))} ${px(sy(A[1]))}H${px(sx(C[0]))}` : `M${px(sx(C[0]))} ${px(sy(C[1]))}H${px(sx(B[0]))}`;
    const legV = rising ? `M${px(sx(C[0]))} ${px(sy(C[1]))}V${px(sy(B[1]))}` : `M${px(sx(A[0]))} ${px(sy(A[1]))}V${px(sy(C[1]))}`;
    layers.aux.push(
      `<path class="pr-tri" d="M${px(sx(A[0]))} ${px(sy(A[1]))}L${px(sx(B[0]))} ${px(sy(B[1]))}L${px(sx(C[0]))} ${px(sy(C[1]))}Z" fill="${V.aux}" fill-opacity="0.1" stroke="none"/>`,
      `<path class="pr-tri-legs" d="${legH}${legV}" fill="none" stroke="${V.aux}" stroke-width="${V.dashWidth}" stroke-dasharray="${V.dash}"/>`,
    );
    const cs = 10;
    const sxC = sx(C[0]);
    const syC = sy(C[1]);
    const ux = rising ? -1 : 1;
    const uy = -1;
    layers.aux.push(
      `<path d="M${px(sxC + ux * cs)} ${px(syC)}v${px(uy * cs)}h${px(-ux * cs)}" fill="none" stroke="${V.aux}" stroke-width="1.6"/>`,
    );
    /* Угол α: от положительного направления Ox до прямой, жирно. */
    const theta = (Math.atan2(rising ? dy : -dy, dx) * 180) / Math.PI; // острый угол при катете
    const rArc = Math.min(cell * 1.0, 0.45 * Math.hypot(dx, dy) * cell);
    if (rising) {
      layers.aux.push(
        `<path class="pr-alpha" d="${duga(sx(A[0]), sy(A[1]), rArc, 0, theta)}" fill="none" stroke="${V.aux}" stroke-width="3.6" stroke-linecap="round"/>`,
      );
      auxLabels.push({
        text: 'α',
        x: sx(A[0]) + (rArc + 13) * Math.cos((theta / 2 * Math.PI) / 180),
        y: sy(A[1]) - (rArc + 13) * Math.sin((theta / 2 * Math.PI) / 180),
        kind: 'alpha',
        id: 'α',
        fill: V.aux,
        pref: 'right',
      });
    } else {
      const alphaDeg = 180 - theta;
      layers.aux.push(
        `<path class="pr-alpha" d="${duga(sx(B[0]), sy(B[1]), rArc, 0, alphaDeg)}" fill="none" stroke="${V.aux}" stroke-width="3.6" stroke-linecap="round"/>`,
        `<path class="pr-beta" d="${duga(sx(B[0]), sy(B[1]), rArc * 0.7, alphaDeg, 180)}" fill="none" stroke="${V.aux}" stroke-width="1.8"/>`,
      );
      auxLabels.push(
        {
          text: 'α',
          x: sx(B[0]) + (rArc + 13) * Math.cos(((alphaDeg / 2) * Math.PI) / 180),
          y: sy(B[1]) - (rArc + 13) * Math.sin(((alphaDeg / 2) * Math.PI) / 180),
          kind: 'alpha',
          id: 'α',
          fill: V.aux,
          pref: 'above',
        },
        {
          text: 'β',
          x: sx(B[0]) + (rArc * 0.7 + 13) * Math.cos((((alphaDeg + 180) / 2) * Math.PI) / 180),
          y: sy(B[1]) - (rArc * 0.7 + 13) * Math.sin((((alphaDeg + 180) / 2) * Math.PI) / 180),
          kind: 'beta',
          id: 'β',
          fill: V.aux,
          pref: 'left',
        },
      );
    }
    /* Длины катетов. */
    auxLabels.push(
      {
        text: String(Math.abs(dx)),
        x: (sx(A[0]) + sx(B[0])) / 2,
        y: (rising ? sy(A[1]) : sy(C[1])) + 17,
        kind: 'leg',
        id: 'Δx',
        fill: V.aux,
        pref: 'below',
      },
      {
        text: String(Math.abs(dy)),
        x: (rising ? sx(C[0]) + 14 : sx(A[0]) - 14),
        y: (sy(A[1]) + sy(B[1])) / 2 + 5,
        kind: 'leg',
        id: 'Δy',
        fill: V.aux,
        pref: rising ? 'right' : 'left',
      },
    );
  }

  /* Точки (после линий, чтобы лежали сверху). */
  for (const d of auxDots) {
    layers.dots.push(
      `<circle cx="${px(sx(d.x))}" cy="${px(sy(d.y))}" r="${V.dotR - 0.8}" fill="${d.fill}" stroke="${THEME.colors.halo}" stroke-width="1.6"/>`,
    );
    obstacles.push({ seg: { x1: sx(d.x), y1: sy(d.y), x2: sx(d.x), y2: sy(d.y) }, r: V.dotR, what: 'точка' });
  }
  for (const d of dotsPoints) {
    layers.dots.push(
      `<circle class="pr-dot" cx="${px(sx(d.x))}" cy="${px(sy(d.y))}" r="${d.r}" fill="${d.fill}" stroke="${THEME.colors.halo}" stroke-width="1.8"/>`,
    );
    obstacles.push({ seg: { x1: sx(d.x), y1: sy(d.y), x2: sx(d.x), y2: sy(d.y) }, r: d.r + 1, what: d.what });
  }

  /* ── Числа на осях ──────────────────────────────────────────── */
  const tickOpts = {
    size: V.tick.size,
    weight: V.tick.weight,
    extra: "font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1",
  };
  const otmecheno = new Set<number>(metki);
  const auxZasechki = new Set<number>();
  for (const item of aux) {
    if (item.t === 'zasechka') {
      auxZasechki.add(item.x);
    }
  }
  /* Засечки на осях в узлах сетки. */
  {
    const ticks: string[] = [];
    for (let x = win.xmin + 1; x < win.xmax; x += 1) {
      if (x !== 0) {
        ticks.push(`M${px(sx(x))} ${px(axisX - g.tick)}v${px(g.tick * 2)}`);
      }
    }
    for (let y = win.ymin + 1; y < win.ymax; y += 1) {
      if (y !== 0) {
        ticks.push(`M${px(axisY - g.tick)} ${px(sy(y))}h${px(g.tick * 2)}`);
      }
    }
    layers.axis.push(
      `<path class="pr-ticks" d="${ticks.join('')}" stroke="${THEME.colors.axis}" stroke-width="${THEME.width.tick}"/>`,
    );
  }
  /* Нуль: в той из четырёх четвертей у начала координат, где свободно. */
  {
    const zeroW = textWidth('0', V.tick.size);
    const halfW = zeroW / 2 + 1.5;
    const halfH = V.tick.size * 0.42;
    const spots: [number, number, 'end' | 'start'][] = [
      [axisY - V.tick.origin, axisX + V.tick.gapX, 'end'],
      [axisY + V.tick.origin, axisX + V.tick.gapX, 'start'],
      [axisY - V.tick.origin, axisX - 8, 'end'],
      [axisY + V.tick.origin, axisX - 8, 'start'],
    ];
    let best: { b: Podpis; x: number; y: number; anchor: 'end' | 'start'; min: number } | null = null;
    for (const [x, y, anchor] of spots) {
      const b: Podpis = {
        kind: 'tick',
        id: '0',
        x: anchor === 'end' ? x - zeroW / 2 : x + zeroW / 2,
        y: y - V.tick.size * 0.35,
        halfW,
        halfH,
      };
      const min = zazor(boxRect(b), obstacles.filter((o) => o.what !== 'ось x' && o.what !== 'ось y')).min;
      if (best === null || min > best.min) {
        best = { b, x, y, anchor, min };
      }
      if (min >= V.gap) {
        break;
      }
    }
    const chosen = best as { b: Podpis; x: number; y: number; anchor: 'end' | 'start'; min: number };
    if (chosen.min < V.gap - 1) {
      problems.push('подпись 0 не помещается: мешает график');
    }
    layers.labels.push(svgText('0', chosen.x, chosen.y, chosen.anchor, tickOpts));
    addBox(chosen.b);
  }
  /* Подписи отмеченных точек раньше чисел: у них приоритет. */
  metki.forEach((m, i) => {
    const sub = String(i + 1);
    const halfW = shirinaX(sub) / 2 + 1.5;
    const halfH = V.mark.size * 0.5;
    let best: { b: Podpis; min: number; what: string } | null = null;
    for (const side of [1, -1]) {
      for (const off of [18, 28]) {
        const b: Podpis = {
          kind: 'mark',
          id: `x${sub}`,
          x: sx(m),
          y: axisX + side * off - V.mark.size * 0.1,
          halfW,
          halfH,
        };
        const rect = boxRect(b);
        const inside = rect.left >= field.left && rect.right <= field.right && rect.top >= field.top && rect.bottom <= field.bottom;
        const c = zazor(rect, obstacles.filter((o) => o.what !== 'отмеченная точка'));
        const min = inside ? c.min : -1;
        if (best === null || min > best.min) {
          best = { b, min, what: inside ? c.what : 'край рисунка' };
        }
        if (min >= V.gap) {
          break;
        }
      }
      if (best !== null && best.min >= V.gap) {
        break;
      }
    }
    const chosen = (best as { b: Podpis }).b;
    if ((best as { min: number }).min < V.gap) {
      problems.push(`подпись x${sub} не помещается: мешает ${(best as { what: string }).what}`);
    }
    layers.labels.push(podpisX(sub, chosen.x, chosen.y + V.mark.size * 0.35, THEME.colors.axis));
    addBox(chosen);
  });
  /* Числа по оси x и y. */
  const numberBox = (text: string, x: number, y: number): Podpis => ({
    kind: 'tick',
    id: text,
    x,
    y,
    halfW: textWidth(text, V.tick.size) / 2 + 1.5,
    halfH: V.tick.size * 0.42,
  });
  const chislaX = fig.chisla ?? 'vse';
  for (let x = win.xmin + 1; x < win.xmax; x += 1) {
    if (x === 0 || otmecheno.has(x)) {
      continue;
    }
    const wantIt = chislaX === 'vse' || x === 1 || auxZasechki.has(x);
    if (!wantIt) {
      continue;
    }
    const text = (x < 0 ? THEME.minus : '') + String(Math.abs(x));
    let done = false;
    for (const side of [1]) {
      const b = numberBox(text, sx(x), axisX + side * V.tick.gapX - V.tick.size * 0.35 + (side === -1 ? -V.tick.size * 0.1 : 0));
      const rect = boxRect(b);
      if (zazor(rect, obstacles).min >= V.gap - 1) {
        layers.labels.push(
          svgText(text, sx(x), (b.y + V.tick.size * 0.35), 'middle', tickOpts),
        );
        addBox(b);
        done = true;
        break;
      }
    }
    if (!done) {
      R.propushcheny.push(`x=${x}`);
    }
  }
  const chislaY = fig.chislaY ?? 'minimum';
  for (let y = win.ymin + 1; y < win.ymax; y += 1) {
    if (y === 0) {
      continue;
    }
    if (!(chislaY === 'vse' || y === 1)) {
      continue;
    }
    const text = (y < 0 ? THEME.minus : '') + String(Math.abs(y));
    const w = textWidth(text, V.tick.size);
    let done = false;
    for (const side of [-1]) {
      const bx = side === -1 ? axisY - V.tick.gapY - w / 2 : axisY + V.tick.gapY + w / 2;
      const b = numberBox(text, bx, sy(y));
      if (zazor(boxRect(b), obstacles).min >= V.gap - 1) {
        layers.labels.push(
          svgText(text, side === -1 ? axisY - V.tick.gapY : axisY + V.tick.gapY, sy(y) + V.tick.size * 0.36, side === -1 ? 'end' : 'start', tickOpts),
        );
        addBox(b);
        done = true;
        break;
      }
    }
    if (!done) {
      R.propushcheny.push(`y=${y}`);
    }
  }

  /* ── Подписи вспомогательных построений и точки касания ─────── */
  const place = (
    id: string,
    kind: string,
    halfW: number,
    halfH: number,
    around: { x: number; y: number },
    prefer: Napr[],
    offs: number[],
  ): Podpis => {
    let best: { b: Podpis; min: number; score: number; what: string } | null = null;
    const dirs = {
      below: [0, 1],
      above: [0, -1],
      right: [1, 0],
      left: [-1, 0],
      'below-right': [0.7, 0.7],
      'above-right': [0.7, -0.7],
      'below-left': [-0.7, 0.7],
      'above-left': [-0.7, -0.7],
    } as const;
    const order = [...prefer, 'below', 'above', 'right', 'left', 'below-right', 'above-right', 'below-left', 'above-left'] as (keyof typeof dirs)[];
    for (let di = 0; di < order.length; di += 1) {
      const [dx, dy] = dirs[order[di] as keyof typeof dirs];
      for (const off of offs) {
        const b: Podpis = {
          kind,
          id,
          x: around.x + dx * (off + halfW * Math.abs(dx)),
          y: around.y + dy * (off + halfH * Math.abs(dy)),
          halfW,
          halfH,
        };
        const rect = boxRect(b);
        const inside = rect.left >= field.left && rect.right <= field.right && rect.top >= field.top && rect.bottom <= field.bottom;
        const c = zazor(rect, obstacles);
        const min = inside ? c.min : -1;
        const score = Math.min(min, 12) * 10 - di * 6 - off * 0.2;
        if (best === null || score > best.score) {
          best = { b, min, score, what: inside ? c.what : 'край рисунка' };
        }
      }
    }
    const chosen = (best as { b: Podpis }).b;
    if ((best as { min: number }).min < V.gap) {
      problems.push(`подпись ${id} не помещается: мешает ${(best as { what: string }).what}`);
    }
    return chosen;
  };

  if (kas !== null && kas.x0 !== null && fig.rezhim !== 'pryamaya') {
    const tx = sx(kas.x0);
    const ty = sy(f.y(kas.x0));
    const w = shirinaX('0') / 2 + 1.5;
    const b = place('x0', 'x0', w, V.mark.size * 0.5, { x: tx, y: ty }, ['above-left', 'below-right'], [12, 20, 28]);
    layers.labels.push(podpisX('0', b.x, b.y + V.mark.size * 0.35, THEME.colors.axis));
    addBox(b);
  }
  for (const item of aux) {
    if (item.t === 'vert' && item.podpis !== undefined && item.podpis !== '') {
      const text = minusify(item.podpis);
      const halfW = textWidth(text, V.tick.size) / 2 + 2;
      const b = place(`подпись ${text}`, 'aux', halfW, V.tick.size * 0.5, { x: sx(item.x), y: axisX }, ['below', 'above'], [14, 22]);
      layers.labels.push(svgText(text, b.x, b.y + V.tick.size * 0.35, 'middle', { ...tickOpts, fill: V.aux }));
      addBox(b);
    }
    if (item.t === 'zasechka' && item.podpis !== undefined) {
      /* Число уже поставлено как обычная подпись оси. */
    }
    if (item.t === 'goriz' && item.podpis !== undefined && item.podpis !== '') {
      const text = minusify(item.podpis);
      const halfW = textWidth(text, 15) / 2 + 3;
      const b = place(`подпись ${text}`, 'aux', halfW, 9, { x: sx(win.xmax) - halfW - 6, y: sy(item.y) }, ['above', 'below'], [10, 18]);
      layers.labels.push(svgText(text, b.x, b.y + 5, 'middle', { size: 15, weight: 600, fill: V.aux, style: 'italic' }));
      addBox(b);
    }
    if (item.t === 'tochka' && item.podpis !== undefined && item.podpis !== '') {
      const text = minusify(item.podpis);
      const halfW = textWidth(text, 15) / 2 + 3;
      const b = place(`подпись ${text}`, 'aux', halfW, 9, { x: sx(item.x), y: sy(item.y) }, ['above-right', 'below-right', 'above-left'], [10, 18]);
      layers.labels.push(svgText(text, b.x, b.y + 5, 'middle', { size: 15, weight: 600, fill: V.aux }));
      addBox(b);
    }
    if (item.t === 'znak') {
      const midX = (item.x0 + item.x1) / 2;
      const glyph = item.znak > 0 ? '+' : THEME.minus;
      const halfW = 9;
      const halfH = 10;
      const b = place(
        `знак ${glyph}`,
        'aux',
        halfW,
        halfH,
        { x: sx(midX), y: axisX },
        item.znak > 0 ? ['above', 'below'] : ['below', 'above'],
        [6, 16, 28],
      );
      layers.labels.push(svgText(glyph, b.x, b.y + 7, 'middle', { size: 22, weight: 700, fill: V.aux }));
      addBox(b);
    }
  }
  for (const al of auxLabels) {
    const halfW = textWidth(al.text, V.helper.size) / 2 + 3;
    const halfH = V.helper.size * 0.55;
    const b = place(al.id, al.kind, halfW, halfH, { x: al.x, y: al.y }, [al.pref], [0, 6, 12]);
    layers.labels.push(
      svgText(al.text, b.x, b.y + V.helper.size * 0.36, 'middle', {
        size: al.kind === 'alpha' || al.kind === 'beta' ? 19 : V.helper.size,
        weight: V.helper.weight,
        fill: al.fill,
        style: al.kind === 'alpha' || al.kind === 'beta' ? 'italic' : undefined,
        family: al.kind === 'alpha' || al.kind === 'beta' ? THEME.font.curveLabelFamily : undefined,
      }),
    );
    addBox(b);
  }

  /* ── Подпись кривой ─────────────────────────────────────────── */
  if (fig.podpis !== '' && polyline.length > 1) {
    const text = `y = ${fig.podpis}`;
    const w = textWidth(text, V.curveLabel.size, V.curveLabel.track);
    const halfW = w / 2 + 3;
    const halfH = V.curveLabel.size * 0.62;
    let best: { b: Podpis; score: number; min: number; what: string } | null = null;
    const n = polyline.length;
    for (let ti = Math.round(n * 0.06); ti <= Math.round(n * 0.94); ti += Math.max(1, Math.round(n / 45))) {
      const p0 = polyline[Math.max(0, ti - 1)] as { x: number; y: number };
      const p1 = polyline[Math.min(n - 1, ti + 1)] as { x: number; y: number };
      const mx = sx((p0.x + p1.x) / 2);
      const my = sy((p0.y + p1.y) / 2);
      let nx = -(sy(p1.y) - sy(p0.y));
      let ny = sx(p1.x) - sx(p0.x);
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      for (const side of [1, -1]) {
        for (const off of [16, 28, 42]) {
          const ext = Math.abs(nx) * halfW + Math.abs(ny) * halfH;
          const b: Podpis = {
            kind: 'curveLabel',
            id: text,
            x: mx + side * nx * (off + ext * 0.7),
            y: my + side * ny * (off + ext * 0.7),
            halfW,
            halfH,
          };
          const rect = boxRect(b);
          const inside = rect.left >= field.left && rect.right <= field.right && rect.top >= field.top && rect.bottom <= field.bottom;
          const c = zazor(rect, obstacles);
          const min = inside ? c.min : -1;
          const score = Math.min(min, 22) * 4 - off * 0.3;
          if (best === null || score > best.score) {
            best = { b, score, min, what: inside ? c.what : 'край рисунка' };
          }
        }
      }
    }
    const chosen = (best as { b: Podpis }).b;
    if ((best as { min: number }).min < V.gap + 3) {
      problems.push(`подпись графика не помещается: мешает ${(best as { what: string }).what}`);
    }
    layers.labels.push(
      svgText(text, chosen.x, chosen.y + V.curveLabel.size * 0.34, 'middle', {
        size: V.curveLabel.size,
        family: THEME.font.curveLabelFamily,
        weight: THEME.font.curveLabelWeight,
        style: 'italic',
        fill: V.curve,
        math: true,
      }),
    );
    addBox(chosen);
  }

  return [
    ...layers.head,
    ...layers.grid,
    ...layers.fill,
    ...layers.axis,
    ...layers.aux,
    ...layers.curve,
    ...layers.dots,
    ...layers.labels,
    '</svg>',
  ].join('');
}

/** Чист ли рисунок по отчёту в каждом из режимов: подсказка и учитель — тоже. */
export function risunokChist(fig: Figura): string[] {
  const out: string[] = [];
  for (const rezhim of ['student', 'teacher'] as const) {
    const rep = pustoyOtchet();
    renderFigura(fig, { rezhim }, rep);
    out.push(...rep.problems.map((p) => `${rezhim}: ${p}`));
  }
  return out;
}
