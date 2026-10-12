/**
 * Раскладка дерева вероятностей — геометрия компонента ProbabilityTree.
 *
 * Вынесена в чистую функцию, чтобы одна и та же раскладка шла и на
 * рисунок, и в автотест (подписи вероятностей не налезают на ветки,
 * овалы событий охватывают свои листья). Правила прежние: дерево растёт
 * сверху вниз, одно испытание — один уровень, лист — свой столбец,
 * ветка — над серединой своего поддерева.
 */

import labels from '@/lib/graph/labels.js';

export interface VetvRaskladki {
  id: string;
  parent: string | null;
  label: string;
  p: number;
  pLabel?: string;
}

export interface SobytieRaskladki {
  /** Имя события: A, B. */
  name: string;
  /** Листья события — подряд стоящие в порядке обхода. */
  leaves: readonly string[];
}

/* Шаг между листьями подстраивается под самую длинную подпись ветки:
   «не выиграл» просит больше места, чем «попал». */
export const LEAF_GAP_MIN = 88;
export const LEAF_GAP_MAX = 122;
const ZNAK = 7.5;
export const LEVEL_H = 96;
export const TOP = 42;
export const PAD_X = 20;
/* Когда уровни подписаны, слева нужно место под их названия:
   иначе подпись уровня наезжает на крайнюю ветку. */
export const PAD_LEVELS = 104;
/* Овал события вокруг листьев и подпись под ним. */
export const OVAL = { dx: 24, dy: 12, ry: 21, podpis: 18 };
/** Кегль подписи вероятности ветки (как в probability.css). */
export const KEGL_P = 14;

export interface MetkaVetvi {
  id: string;
  x: number;
  y: number;
  anchor: 'start' | 'end';
  text: string;
}

export interface OvalRaskladki {
  name: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Место подписи под овалом. */
  lx: number;
  ly: number;
}

export interface RaskladkaDereva {
  width: number;
  height: number;
  urovney: number;
  koren: { x: number; y: number };
  listya: VetvRaskladki[];
  glubina: Map<string, number>;
  proizvedenie: Map<string, number>;
  x: Map<string, number>;
  y: (d: number) => number;
  /** Отрезки веток: от родителя к узлу. */
  otrezki: { id: string; x1: number; y1: number; x2: number; y2: number }[];
  metki: MetkaVetvi[];
  ovaly: OvalRaskladki[];
}

/** Рамка подписи вероятности: текст от точки (x, y) по базовой линии. */
export function ramkaMetki(x: number, y: number, w: number, anchor: 'start' | 'end') {
  const x0 = anchor === 'end' ? x - w : x;
  return { x: x0 + w / 2, y: y - KEGL_P * 0.35, halfW: w / 2 + 1, halfH: KEGL_P * 0.42 };
}

export function chisloVetvi(value: number): string {
  /* Хвосты вида 0,6400000000000001 — от двоичной дроби, а не от задачи. */
  return String(Math.round(value * 1e9) / 1e9).replace('.', ',');
}

export function raskladkaDereva(o: {
  branches: readonly VetvRaskladki[];
  levels?: readonly string[] | undefined;
  showProducts?: boolean;
  showSum?: boolean;
  events?: readonly SobytieRaskladki[] | undefined;
}): RaskladkaDereva {
  const { branches, levels } = o;
  const dlinnaya = branches.reduce((m, b) => Math.max(m, b.label.length), 0);
  const LEAF_GAP = Math.max(LEAF_GAP_MIN, Math.min(LEAF_GAP_MAX, Math.round(dlinnaya * ZNAK) + 28));

  const deti = new Map<string | null, VetvRaskladki[]>();
  for (const b of branches) {
    const spisok = deti.get(b.parent) ?? [];
    spisok.push(b);
    deti.set(b.parent, spisok);
  }
  const detiU = (id: string | null): VetvRaskladki[] => deti.get(id) ?? [];

  /* Листья в порядке обхода — они и задают горизонтальную раскладку. */
  const listya: VetvRaskladki[] = [];
  const glubina = new Map<string, number>();
  const proizvedenie = new Map<string, number>();
  const obhod = (b: VetvRaskladki, d: number, p: number): void => {
    glubina.set(b.id, d);
    const pp = p * b.p;
    proizvedenie.set(b.id, pp);
    const sled = detiU(b.id);
    if (sled.length === 0) {
      listya.push(b);
      return;
    }
    for (const c of sled) {
      obhod(c, d + 1, pp);
    }
  };
  for (const b of detiU(null)) {
    obhod(b, 0, 1);
  }

  /* x узла: у листа — свой столбец, у ветки — середина её поддерева. */
  const x = new Map<string, number>();
  const sleva = levels === undefined ? PAD_X : PAD_LEVELS;
  listya.forEach((b, i) => x.set(b.id, sleva + LEAF_GAP / 2 + i * LEAF_GAP));
  const postavit = (b: VetvRaskladki): number => {
    const est = x.get(b.id);
    if (est !== undefined) {
      return est;
    }
    const sled = detiU(b.id).map(postavit);
    const seredina = (Math.min(...sled) + Math.max(...sled)) / 2;
    x.set(b.id, seredina);
    return seredina;
  };
  for (const b of detiU(null)) {
    postavit(b);
  }

  const urovney = Math.max(...[...glubina.values()], 0) + 1;
  const y = (d: number): number => TOP + (d + 1) * LEVEL_H;
  const koren = { x: sleva + (listya.length * LEAF_GAP) / 2, y: TOP };

  const otrezki = branches.map((b) => {
    const d = glubina.get(b.id) ?? 0;
    const roditel = branches.find((p) => p.id === b.parent);
    const px = roditel === undefined ? koren.x : (x.get(roditel.id) ?? 0);
    const py = roditel === undefined ? koren.y : y(glubina.get(roditel.id) ?? 0);
    return { id: b.id, x1: px, y1: py, x2: x.get(b.id) ?? 0, y2: y(d) };
  });

  /* Вероятность стоит сбоку от ветки, со стороны её наклона: поверх
     линии она читалась бы хуже. Обычное место — у середины ветки; если
     там подпись задевает соседнюю ветку (у развилки на три ветви) или
     другую подпись, она сдвигается вдоль своей ветки, а в крайнем
     случае уходит на другую сторону. Пересечения считает общий модуль
     подписей lib/graph/labels.js. */
  const zanyato: { x: number; y: number; halfW: number; halfH: number }[] = [];
  const metki: MetkaVetvi[] = otrezki.map((s) => {
    const b = branches.find((v) => v.id === s.id) as VetvRaskladki;
    const text = b.pLabel ?? chisloVetvi(b.p);
    const w = labels.pointTextWidth(text, KEGL_P);
    const naruzhu = s.x2 < s.x1 ? -1 : 1;
    let luchshee: { m: MetkaVetvi; box: (typeof zanyato)[number]; zazor: number } | null = null;
    for (const storona of [naruzhu, -naruzhu]) {
      for (const dolya of [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73]) {
        const x = s.x1 + (s.x2 - s.x1) * dolya + storona * 10;
        const y = s.y1 + (s.y2 - s.y1) * dolya;
        const anchor: 'start' | 'end' = storona < 0 ? 'end' : 'start';
        const box = ramkaMetki(x, y, w, anchor);
        let zazor = Math.min(
          ...otrezki.map((o) => labels.segRectDist(o.x1, o.y1, o.x2, o.y2, box)),
          ...zanyato.map((z) =>
            Math.max(
              Math.abs(z.x - box.x) - z.halfW - box.halfW,
              Math.abs(z.y - box.y) - z.halfH - box.halfH,
            ),
          ),
        );
        zazor = Math.min(zazor, 3);
        if (luchshee === null || zazor > luchshee.zazor + 1e-9) {
          luchshee = { m: { id: s.id, x, y, anchor, text }, box, zazor };
        }
        if (zazor >= 3) {
          break;
        }
      }
      if (luchshee !== null && luchshee.zazor >= 3) {
        break;
      }
    }
    const v = luchshee as NonNullable<typeof luchshee>;
    zanyato.push(v.box);
    return v.m;
  });

  /* Овалы событий: вокруг своих листьев и их подписей. Подпись события —
     под овалом, у его дальнего от соседа конца, как на рисунках ЕГЭ. */
  const events = o.events ?? [];
  const ovaly: OvalRaskladki[] = events.map((e) => {
    const xs = e.leaves.map((id) => x.get(id) ?? 0);
    const d = Math.max(...e.leaves.map((id) => glubina.get(id) ?? 0));
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const cx = (left + right) / 2;
    const rx = (right - left) / 2 + OVAL.dx;
    const cy = y(d) + OVAL.dy;
    /* Под листьями могут стоять произведения (разбор) — тогда подпись
       события уходит ниже них. */
    const ly = o.showProducts ? y(d) + 44 + 22 : cy + OVAL.ry + OVAL.podpis;
    return { name: e.name, cx, cy, rx, ry: OVAL.ry, lx: cx, ly };
  });
  if (ovaly.length > 1) {
    const poLevomu = [...ovaly].sort((a, b) => a.cx - a.rx - (b.cx - b.rx));
    poLevomu.forEach((ov, i) => {
      if (i === 0) {
        ov.lx = ov.cx - ov.rx + 8;
      } else if (i === poLevomu.length - 1) {
        ov.lx = ov.cx + ov.rx - 8;
      }
    });
  }

  const width = sleva + listya.length * LEAF_GAP + PAD_X;
  const nizOvalov = ovaly.length > 0 ? Math.max(...ovaly.map((ov) => ov.ly)) + 8 : 0;
  const height = Math.max(
    y(urovney - 1) + (o.showProducts ? 46 : 20) + (o.showSum ? 38 : 0),
    nizOvalov + (o.showSum ? 38 : 0),
  );

  return {
    width,
    height,
    urovney,
    koren,
    listya,
    glubina,
    proizvedenie,
    x,
    y,
    otrezki,
    metki,
    ovaly,
  };
}
