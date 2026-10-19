/**
 * Чертежи задания №16: числовая прямая метода интервалов и эскиз
 * параболы относительно оси Ox.
 *
 * Здесь только геометрия — где стоят точки, знаки, штриховка и
 * кривая в координатах viewBox. Рисует components/zadanie16/
 * Chertezh16.tsx: SVG для линий, подписи чисел — KaTeX поверх.
 *
 * Чертёж не в масштабе, как в тетради: точки расставлены через
 * равные промежутки по порядку, важны только порядок и знаки.
 */

import type { Mnozhestvo16, Promezhutok16 } from './otvet';
import { normalizovat16 } from './otvet';

/** Точка на оси: число (для порядка), подпись TeX и закрашена ли. */
export interface Tochka16 {
  x: number;
  /** Подпись под осью, TeX без долларов: «-3», «\tfrac{1}{2}», «\sqrt{2}». */
  tex: string;
  /** Закрашенная — входит в ответ; выколотая (пустой кружок) — нет. */
  zakrashena: boolean;
}

export type Znak16 = '+' | '-';

/**
 * Заштрихованный участок между точками: номера точек по порядку,
 * -1 — от минус бесконечности, n — до плюс бесконечности. Слой 1 —
 * вторая штриховка (система неравенств): ниже и с другим наклоном.
 */
export interface Uchastok16 {
  ot: number;
  do: number;
  sloy?: 0 | 1;
}

/** Числовая прямая метода интервалов. */
export interface Pryamaya16 {
  vid: 'pryamaya';
  tochki: Tochka16[];
  /** Знаки над промежутками слева направо: их на один больше, чем точек. */
  znaki?: (Znak16 | null)[];
  shtrikh?: Uchastok16[];
  /** Подпись оси; по умолчанию x. */
  peremennaya?: string;
  /** Описание для экранного диктора. Не задано — собирается из точек. */
  opisanie?: string;
}

/** Эскиз параболы относительно оси Ox. */
export interface Parabola16 {
  vid: 'parabola';
  vetvi: 'vverh' | 'vniz';
  /**
   * Нули: два (D > 0), один (D = 0, вершина на оси) или ни одного
   * (D < 0, парабола целиком над осью или под ней).
   */
  korni: Tochka16[];
  /** Где ось заштрихована: там, где парабола над осью или под ней. */
  shtrikh?: 'nad' | 'pod';
  /** Знаки +/− над промежутками оси. */
  znaki?: boolean;
  peremennaya?: string;
  opisanie?: string;
}

export type Chertezh16 = Pryamaya16 | Parabola16;

/* ── Геометрия ──────────────────────────────────────────────── */

export const SHIRINA = 600;
const POLE = 28;

export interface Geom16 {
  w: number;
  h: number;
  osY: number;
  /** Конец стрелки оси. */
  strelkaX: number;
  tochki: (Tochka16 & { cx: number })[];
  znaki: { cx: number; cy: number; znak: Znak16 }[];
  shtrikh: { x1: number; x2: number; sloy: 0 | 1 }[];
  /** Кривая (парабола): путь SVG. */
  krivaya?: string;
  peremennaya: string;
  opisanie: string;
}

/** Элемент по номеру; выход за край — ошибка данных чертежа. */
function at<T>(arr: readonly T[], i: number): T {
  const v = arr[i];
  if (v === undefined) {
    throw new Error(`Нет элемента ${i} из ${arr.length}`);
  }
  return v;
}

function proverit(tochki: readonly Tochka16[]): void {
  tochki.forEach((t, i) => {
    const prev = tochki[i - 1];
    if (prev !== undefined && !(prev.x < t.x)) {
      throw new Error(`Точки на прямой не по возрастанию: ${prev.tex}, ${t.tex}`);
    }
  });
}

/** Края участка в координатах: -1 и n — края оси. */
function kraya(xs: readonly number[], ot: number, do_: number): [number, number] {
  const n = xs.length;
  const left = ot < 0 ? 0 : at(xs, ot);
  const right = do_ >= n ? SHIRINA - 6 : at(xs, do_);
  return [left, right];
}

function srednie(xs: readonly number[]): number[] {
  const kr = [0, ...xs, SHIRINA - 14];
  return kr.slice(1).map((x, i) => (at(kr, i) + x) / 2);
}

function znakSlovom(z: Znak16): string {
  return z === '+' ? 'плюс' : 'минус';
}

function opisat(tochki: readonly Tochka16[], znaki: readonly (Znak16 | null)[]): string {
  const t = tochki
    .map(
      (p) => `${p.tex.replace(/\\[a-z]+|[{}]/gi, '')} ${p.zakrashena ? 'закрашена' : 'выколота'}`,
    )
    .join(', ');
  const z = znaki
    .filter((x): x is Znak16 => x !== null)
    .map(znakSlovom)
    .join(', ');
  return `Числовая прямая: ${t || 'без точек'}${z ? `; знаки слева направо: ${z}` : ''}.`;
}

/** Координаты числовой прямой. */
export function geomPryamoy(p: Pryamaya16): Geom16 {
  proverit(p.tochki);
  const n = p.tochki.length;
  const shag = (SHIRINA - 2 * POLE) / (n + 1);
  const xs = p.tochki.map((_, i) => POLE + shag * (i + 1));
  const osY = 62;
  const znaki = p.znaki ?? [];
  if (znaki.length > 0 && znaki.length !== n + 1) {
    throw new Error(`Знаков ${znaki.length}, а промежутков ${n + 1}`);
  }
  const sr = srednie(xs);
  return {
    w: SHIRINA,
    h: 100,
    osY,
    strelkaX: SHIRINA - 4,
    tochki: p.tochki.map((t, i) => ({ ...t, cx: at(xs, i) })),
    znaki: znaki.flatMap((z, i) => (z === null ? [] : [{ cx: at(sr, i), cy: osY - 40, znak: z }])),
    shtrikh: (p.shtrikh ?? []).map((u) => {
      const [x1, x2] = kraya(xs, u.ot, u.do);
      return { x1, x2, sloy: u.sloy ?? 0 };
    }),
    peremennaya: p.peremennaya ?? 'x',
    opisanie: p.opisanie ?? opisat(p.tochki, znaki),
  };
}

/**
 * Координаты эскиза параболы. Вершина — посередине; нули — на трети
 * и двух третях ширины. Ветви — отрезок параболы, записанный одной
 * квадратичной кривой Безье: она и есть парабола, не приближение.
 */
export function geomParaboly(p: Parabola16): Geom16 {
  proverit(p.korni);
  if (p.korni.length > 2) {
    throw new Error('У параболы не больше двух нулей');
  }
  const w = SHIRINA;
  const h = 180;
  const osY = 96;
  const verh = 10;
  const niz = h - 8;
  const vv = p.vetvi === 'vverh' ? 1 : -1;
  const xv = w / 2;
  const n = p.korni.length;
  const xs = n === 2 ? [w / 3, (2 * w) / 3] : n === 1 ? [xv] : [];

  /* Вершина: под осью (вверх, два нуля), на оси (один), над осью (ни одного). */
  const glubina = 58;
  const yv = n === 2 ? osY + vv * glubina : n === 1 ? osY : osY - vv * 30;
  /* Коэффициент: при двух нулях ветвь проходит через ось в xs. */
  const d = w / 6;
  const c = n === 2 ? (-vv * glubina) / (d * d) : (-vv * 70) / (w / 4) ** 2;
  /* Полуширина отрезка: ветвь доходит до края по высоте. */
  const kray = vv === 1 ? verh : niz;
  const L = Math.min(Math.sqrt(Math.abs((kray - yv) / c)), w / 2 - 20);
  const yE = yv + c * L * L;
  const krivaya = `M${xv - L} ${yE}Q${xv} ${yv - c * L * L} ${xv + L} ${yE}`;

  /* Знак выражения на промежутках оси: парабола над осью — «+». */
  const nadPervym: Znak16 = vv === 1 ? '+' : '-';
  const protiv: Znak16 = nadPervym === '+' ? '-' : '+';
  const znakiPromezhutkov: Znak16[] =
    n === 2 ? [nadPervym, protiv, nadPervym] : n === 1 ? [nadPervym, nadPervym] : [nadPervym];
  const nuzhen: Znak16 | null = p.shtrikh === undefined ? null : p.shtrikh === 'nad' ? '+' : '-';
  const sr = srednie(xs);
  const shtrikh: Geom16['shtrikh'] = [];
  if (nuzhen !== null) {
    znakiPromezhutkov.forEach((z, i) => {
      if (z === nuzhen) {
        const [x1, x2] = kraya(xs, i - 1, i);
        shtrikh.push({ x1, x2, sloy: 0 });
      }
    });
  }
  return {
    w,
    h,
    osY,
    strelkaX: w - 4,
    tochki: p.korni.map((t, i) => ({ ...t, cx: at(xs, i) })),
    znaki: p.znaki
      ? znakiPromezhutkov.map((z, i) => ({
          cx: n === 0 ? w * 0.8 : at(sr, i),
          cy: osY - 42,
          znak: z,
        }))
      : [],
    shtrikh,
    krivaya,
    peremennaya: p.peremennaya ?? 'x',
    opisanie:
      p.opisanie ??
      `Эскиз параболы, ветви ${p.vetvi === 'vverh' ? 'вверх' : 'вниз'}, ${
        n === 0
          ? 'с осью Ox не пересекается'
          : n === 1
            ? 'касается оси Ox'
            : 'пересекает ось Ox в двух точках'
      }.`,
  };
}

export function geom16(ch: Chertezh16): Geom16 {
  return ch.vid === 'pryamaya' ? geomPryamoy(ch) : geomParaboly(ch);
}

/* ── Метод интервалов: знаки по кратности ────────────────────── */

export type Neravenstvo16 = '>' | '>=' | '<' | '<=';

export interface Koren16 {
  x: number;
  tex: string;
  /** Кратность корня: чётная — знак через точку не меняется. По умолчанию 1. */
  kratnost?: number;
  /** Корень знаменателя: выколот всегда, даже в нестрогом неравенстве. */
  znamenatel?: boolean;
}

export interface MetodIntervalov16 {
  korni: Koren16[];
  /** Знак на самом правом промежутке (при старшем коэффициенте > 0 — «+»). */
  sprava: Znak16;
  znak: Neravenstvo16;
}

/** Знаки на промежутках справа налево: меняются только через нечётную кратность. */
export function znakiPoKratnosti(korni: readonly Koren16[], sprava: Znak16): Znak16[] {
  const out: Znak16[] = [sprava];
  for (let i = korni.length - 1; i >= 0; i -= 1) {
    const prev = at(out, 0);
    const kr = at(korni, i).kratnost ?? 1;
    out.unshift(kr % 2 === 1 ? (prev === '+' ? '-' : '+') : prev);
  }
  return out;
}

/**
 * Прямая метода интервалов целиком: точки (закрашены в нестрогом
 * неравенстве, кроме нулей знаменателя), знаки по кратности и
 * штриховка промежутков с нужным знаком.
 */
export function metodIntervalov16(m: MetodIntervalov16): Pryamaya16 {
  const korni = [...m.korni].sort((a, b) => a.x - b.x);
  const nestrogo = m.znak === '>=' || m.znak === '<=';
  const nuzhen: Znak16 = m.znak === '>' || m.znak === '>=' ? '+' : '-';
  const znaki = znakiPoKratnosti(korni, m.sprava);
  const shtrikh: Uchastok16[] = [];
  znaki.forEach((z, i) => {
    if (z === nuzhen) {
      shtrikh.push({ ot: i - 1, do: i });
    }
  });
  return {
    vid: 'pryamaya',
    tochki: korni.map((k) => ({ x: k.x, tex: k.tex, zakrashena: nestrogo && !k.znamenatel })),
    znaki,
    shtrikh,
  };
}

/**
 * Ответ, который показывает прямая: заштрихованные промежутки и
 * закрашенные точки (в том числе отдельные). По нему проверяется,
 * что рисунок и ответ в данных совпадают.
 */
export function otvetPryamoy16(p: Pryamaya16): Mnozhestvo16 {
  const xs = p.tochki.map((t) => t.x);
  const n = xs.length;
  const out: Promezhutok16[] = [];
  for (const u of p.shtrikh ?? []) {
    if ((u.sloy ?? 0) !== 0) {
      continue;
    }
    const ot = u.ot < 0 ? -Infinity : at(xs, u.ot);
    const do_ = u.do >= n ? Infinity : at(xs, u.do);
    out.push({
      ot,
      do: do_,
      otVkl: u.ot >= 0 && at(p.tochki, u.ot).zakrashena,
      doVkl: u.do < n && at(p.tochki, u.do).zakrashena,
    });
  }
  p.tochki.forEach((t) => {
    if (t.zakrashena) {
      out.push({ ot: t.x, do: t.x, otVkl: true, doVkl: true });
    }
  });
  return normalizovat16(out);
}
