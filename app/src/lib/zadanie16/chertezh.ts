/**
 * Чертежи задания №16: числовая прямая метода интервалов, система
 * неравенств (прямые друг под другом и пересечение) и эскиз параболы
 * относительно осей.
 *
 * Здесь только геометрия в координатах viewBox: оси, точки,
 * штриховка, дуги, кривая и подписи с их рамками. Рисует
 * components/zadanie16/Chertezh16.tsx: линии — SVG, подписи — KaTeX
 * поверх. Подписи раскладываются здесь же, чтобы не налезать друг на
 * друга: числа, которым тесно в ряду, уходят строкой ниже.
 *
 * Прямая и система — не в масштабе, как в тетради: точки идут через
 * равные промежутки, важен порядок. Парабола с осью Oy — в масштабе
 * по x: вершина стоит там, где она есть, относительно x = 0.
 */

import type { Mnozhestvo16, Promezhutok16 } from './otvet';
import { normalizovat16, peresechenie16, razobrat16 } from './otvet';

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
 * вторая штриховка на той же прямой: ниже и с другим наклоном.
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
  /** Дуги («змейка») над промежутками, знаки — под дугами. */
  dugi?: boolean;
  /** Подпись оси; по умолчанию x. */
  peremennaya?: string;
  /** Описание для экранного диктора. Не задано — собирается из точек. */
  opisanie?: string;
}

/** Строка системы: условие и его решение (TeX-запись множества). */
export interface RyadSistemy16 {
  /** Условие над прямой, TeX: «x>-3». */
  tex: string;
  /** Решение условия: «(-3;\,+\infty)». */
  mnozhestvo: string;
}

/**
 * Система неравенств: у каждого условия своя прямая, прямые друг под
 * другом с общими точками, внизу — пересечение (его считает движок).
 */
export interface Sistema16 {
  vid: 'sistema';
  /** Все точки всех прямых по возрастанию: подписи и положения общие. */
  tochki: { x: number; tex: string }[];
  ryady: RyadSistemy16[];
  peremennaya?: string;
  opisanie?: string;
}

/** Эскиз параболы. */
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
  /**
   * Ось Oy при x = 0: чертёж в масштабе по x, вершина стоит
   * относительно оси Oy там, где она есть.
   */
  oy?: boolean;
  /** Абсцисса вершины при D < 0 в масштабе; по умолчанию 0. */
  vershina?: number;
  peremennaya?: string;
  opisanie?: string;
}

export type Chertezh16 = Pryamaya16 | Sistema16 | Parabola16;

/* ── Геометрия ──────────────────────────────────────────────── */

export const SHIRINA = 600;
const POLE = 28;
const LEVYY_KRAY = 4;
const PRAVYY_KRAY = SHIRINA - 6;
/** Высота строки подписей и шаг второй строки. */
const STROKA = 24;

/** Рамка подписи в координатах viewBox. */
export interface Ramka16 {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export type VidPodpisi16 = 'chislo' | 'plus' | 'minus' | 'os' | 'uslovie';

/** Подпись KaTeX: где стоит её рамка. Компонент ставит подпись в рамку. */
export interface Podpis16 {
  tex: string;
  vid: VidPodpisi16;
  ramka: Ramka16;
}

export interface Ryad16 {
  osY: number;
  /** Итоговая прямая системы: штриховка пересечения. */
  itog?: boolean;
  /** Номер цвета штриховки (у прямых системы — свой). */
  tsvet: number;
  tochki: { cx: number; zakrashena: boolean }[];
  shtrikh: { x1: number; x2: number; vys: number; sloy: 0 | 1 }[];
}

export interface Geom16 {
  w: number;
  h: number;
  ryady: Ryad16[];
  /** Дуги «змейки»: пути SVG. */
  dugi: string[];
  /** Парабола: путь SVG. */
  krivaya?: string;
  /** Ось Oy: абсцисса и концы (y2 — у стрелки). */
  oy?: { x: number; y1: number; y2: number };
  /** Пунктир через все прямые системы в общих точках. */
  napravlyayushchie: { x: number; y1: number; y2: number }[];
  /** Стрелка вниз к пересечению. */
  strelkaVniz?: { x: number; y1: number; y2: number };
  podpisi: Podpis16[];
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

function proverit(tochki: readonly { x: number; tex: string }[]): void {
  tochki.forEach((t, i) => {
    const prev = tochki[i - 1];
    if (prev !== undefined && !(prev.x < t.x)) {
      throw new Error(`Точки на прямой не по возрастанию: ${prev.tex}, ${t.tex}`);
    }
  });
}

/**
 * Ширина подписи в единицах viewBox — с запасом на узкий экран:
 * подписи набраны в долях ширины чертежа (container query), но не
 * мельче 12px, и на телефоне знак занимает до 18 единиц.
 */
export function shirinaTex16(tex: string): number {
  const vidimoe = tex
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a: string, b: string) =>
      a.length > b.length ? a : b,
    )
    .replace(/\\sqrt/g, '√')
    .replace(/\\(?:pi|infty|cdot|ne|le|ge|in)/g, '∞')
    .replace(/\\[a-z]+/gi, '')
    .replace(/[{}\s]/g, '');
  return Math.max(1, vidimoe.length) * 18 + 8;
}

function ramkaPod(cx: number, y: number, tex: string): Ramka16 {
  const w = shirinaTex16(tex);
  return { x1: cx - w / 2, x2: cx + w / 2, y1: y, y2: y + STROKA };
}

export function peresekayutsya16(a: Ramka16, b: Ramka16): boolean {
  return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
}

/**
 * Числа под осью: слева направо, каждое — в первую строку, где оно
 * ни на что не налезает. Подпись оси «x» стоит у стрелки и тоже
 * учитывается: число у правого края уйдёт под неё.
 */
function podpisiPodOsyu(
  osY: number,
  chisla: readonly { cx: number; tex: string }[],
  peremennaya: string | null,
  zanyato: readonly Podpis16[] = [],
): Podpis16[] {
  const out: Podpis16[] = [...zanyato];
  if (peremennaya !== null) {
    const w = shirinaTex16(peremennaya);
    out.push({
      tex: peremennaya,
      vid: 'os',
      ramka: { x1: PRAVYY_KRAY - w, x2: PRAVYY_KRAY, y1: osY + 10, y2: osY + 10 + STROKA },
    });
  }
  for (const c of [...chisla].sort((p, q) => p.cx - q.cx)) {
    let stroka = 0;
    let r = ramkaPod(c.cx, osY + 10, c.tex);
    while (out.some((p) => peresekayutsya16(p.ramka, r))) {
      stroka += 1;
      r = ramkaPod(c.cx, osY + 10 + stroka * STROKA, c.tex);
    }
    out.push({ tex: c.tex, vid: 'chislo', ramka: r });
  }
  return out.slice(zanyato.length);
}

function znakPodpis(cx: number, cy: number, z: Znak16): Podpis16 {
  return {
    tex: z,
    vid: z === '+' ? 'plus' : 'minus',
    ramka: { x1: cx - 11, x2: cx + 11, y1: cy - 11, y2: cy + 11 },
  };
}

/** Нижний край всех подписей и линий — высота рисунка. */
function vysota(podpisi: readonly Podpis16[], niz: number): number {
  return Math.ceil(Math.max(niz, ...podpisi.map((p) => p.ramka.y2)) + 4);
}

/** Края участка в координатах: -1 и n — края оси. */
function kraya(xs: readonly number[], ot: number, do_: number): [number, number] {
  const n = xs.length;
  const left = ot < 0 ? LEVYY_KRAY : at(xs, ot);
  const right = do_ >= n ? PRAVYY_KRAY - 8 : at(xs, do_);
  return [left, right];
}

/** Середины промежутков: левый край, точки, правый край. */
function srednie(xs: readonly number[]): number[] {
  const kr = [LEVYY_KRAY, ...xs, PRAVYY_KRAY - 14];
  return kr.slice(1).map((x, i) => (at(kr, i) + x) / 2);
}

/** Точки через равные промежутки. */
function ravnomerno(n: number): number[] {
  const shag = (SHIRINA - 2 * POLE) / (n + 1);
  return Array.from({ length: n }, (_, i) => POLE + shag * (i + 1));
}

function bezTex(tex: string): string {
  return tex.replace(/\\[a-z]+|[{}]/gi, '');
}

function opisat(tochki: readonly Tochka16[], znaki: readonly (Znak16 | null)[]): string {
  const t = tochki
    .map((p) => `${bezTex(p.tex)} ${p.zakrashena ? 'закрашена' : 'выколота'}`)
    .join(', ');
  const z = znaki
    .filter((x): x is Znak16 => x !== null)
    .map((x) => (x === '+' ? 'плюс' : 'минус'))
    .join(', ');
  return `Числовая прямая: ${t || 'без точек'}${z ? `; знаки слева направо: ${z}` : ''}.`;
}

/* ── Прямая метода интервалов ───────────────────────────────── */

export function geomPryamoy(p: Pryamaya16): Geom16 {
  proverit(p.tochki);
  const n = p.tochki.length;
  const xs = ravnomerno(n);
  const znaki = p.znaki ?? [];
  if (znaki.length > 0 && znaki.length !== n + 1) {
    throw new Error(`Знаков ${znaki.length}, а промежутков ${n + 1}`);
  }
  /* С дугами: дуга до 34 над осью, знак под её вершиной, штриховка
     ниже знака. Без дуг: знак над штриховкой. */
  const dugaVys = 34;
  const osY = p.dugi ? 60 : 56;
  const vys0 = p.dugi ? 12 : 22;
  const znakY = p.dugi ? osY - 24 : osY - 38;
  const sr = srednie(xs);
  const dugi: string[] = [];
  if (p.dugi) {
    const kr = [LEVYY_KRAY + 6, ...xs, PRAVYY_KRAY - 20];
    kr.slice(1).forEach((x2, i) => {
      const x1 = at(kr, i);
      /* Вершина квадратичной кривой на высоте h — контрольная точка на 2h. */
      dugi.push(`M${x1} ${osY}Q${(x1 + x2) / 2} ${osY - 2 * dugaVys} ${x2} ${osY}`);
    });
  }
  const znakiP = znaki.flatMap((z, i) => (z === null ? [] : [znakPodpis(at(sr, i), znakY, z)]));
  const chisla = podpisiPodOsyu(
    osY,
    p.tochki.map((t, i) => ({ cx: at(xs, i), tex: t.tex })),
    p.peremennaya ?? 'x',
  );
  const podpisi = [...znakiP, ...chisla];
  return {
    w: SHIRINA,
    h: vysota(podpisi, osY + 12),
    ryady: [
      {
        osY,
        tsvet: 0,
        tochki: p.tochki.map((t, i) => ({ cx: at(xs, i), zakrashena: t.zakrashena })),
        shtrikh: (p.shtrikh ?? []).map((u) => {
          const [x1, x2] = kraya(xs, u.ot, u.do);
          const sloy = u.sloy ?? 0;
          return { x1, x2, vys: sloy === 0 ? vys0 : vys0 - 8, sloy };
        }),
      },
    ],
    dugi,
    napravlyayushchie: [],
    podpisi,
    opisanie: p.opisanie ?? opisat(p.tochki, znaki),
  };
}

/* ── Система: прямые друг под другом и пересечение ──────────── */

/** Точки и штриховка прямой по множеству: концы ищутся среди общих точек. */
function ryadIzMnozhestva(
  mn: Mnozhestvo16,
  tochki: readonly { x: number; tex: string }[],
  xs: readonly number[],
): Pick<Ryad16, 'tochki' | 'shtrikh'> {
  const nomer = (x: number): number => {
    const i = tochki.findIndex((t) => Math.abs(t.x - x) < 1e-9);
    if (i < 0) {
      throw new Error(`Конца ${x} нет среди точек системы`);
    }
    return i;
  };
  const kruzhki = new Map<number, boolean>();
  const shtrikh: Ryad16['shtrikh'] = [];
  for (const p of mn) {
    const i = Number.isFinite(p.ot) ? nomer(p.ot) : -1;
    const j = Number.isFinite(p.do) ? nomer(p.do) : tochki.length;
    if (i >= 0) kruzhki.set(i, (kruzhki.get(i) ?? false) || p.otVkl);
    if (j < tochki.length) kruzhki.set(j, (kruzhki.get(j) ?? false) || p.doVkl);
    if (i !== j) {
      const [x1, x2] = kraya(xs, i, j);
      shtrikh.push({ x1, x2, vys: 14, sloy: 0 });
    }
  }
  return {
    tochki: [...kruzhki.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([i, z]) => ({ cx: at(xs, i), zakrashena: z })),
    shtrikh,
  };
}

/** Решение системы: пересечение решений всех строк. */
export function reshenieSistemy16(s: Sistema16): Mnozhestvo16 {
  let mn: Mnozhestvo16 = [{ ot: -Infinity, do: Infinity, otVkl: false, doVkl: false }];
  for (const r of s.ryady) {
    const e = razobrat16(r.mnozhestvo);
    if (!e.ok) throw new Error(`Строка системы ${r.tex}: ${e.oshibka}`);
    mn = peresechenie16(mn, e.mnozhestvo);
  }
  return mn;
}

export function geomSistemy(s: Sistema16): Geom16 {
  proverit(s.tochki);
  const xs = ravnomerno(s.tochki.length);
  const shag = 66;
  const verh = 40;
  const ryady: Ryad16[] = s.ryady.map((r, i) => {
    const e = razobrat16(r.mnozhestvo);
    if (!e.ok) throw new Error(`Строка системы ${r.tex}: ${e.oshibka}`);
    return { osY: verh + i * shag, tsvet: i % 3, ...ryadIzMnozhestva(e.mnozhestvo, s.tochki, xs) };
  });
  const posledniy = verh + (s.ryady.length - 1) * shag;
  const itogY = posledniy + shag + 14;
  const itog = ryadIzMnozhestva(reshenieSistemy16(s), s.tochki, xs);
  itog.shtrikh.forEach((sh) => {
    sh.vys = 18;
  });
  ryady.push({ osY: itogY, itog: true, tsvet: 0, ...itog });
  /* Условие — над своей прямой у левого края, выше штриховки. */
  const usloviya: Podpis16[] = s.ryady.map((r, i) => {
    const y = verh + i * shag - 38;
    return {
      tex: r.tex,
      vid: 'uslovie',
      ramka: { x1: LEVYY_KRAY, x2: LEVYY_KRAY + shirinaTex16(r.tex), y1: y, y2: y + 22 },
    };
  });
  const chisla = podpisiPodOsyu(
    itogY,
    s.tochki.map((t, i) => ({ cx: at(xs, i), tex: t.tex })),
    s.peremennaya ?? 'x',
  );
  return {
    w: SHIRINA,
    h: vysota(chisla, itogY + 12),
    ryady,
    dugi: [],
    napravlyayushchie: xs.map((x) => ({ x, y1: verh - 16, y2: itogY })),
    strelkaVniz: { x: PRAVYY_KRAY - 24, y1: posledniy + 12, y2: itogY - 26 },
    podpisi: [...usloviya, ...chisla],
    opisanie:
      s.opisanie ??
      `Система: ${s.ryady.map((r) => bezTex(r.tex)).join('; ')}. Внизу — пересечение решений.`,
  };
}

/* ── Парабола ───────────────────────────────────────────────── */

/**
 * Эскиз параболы. Без оси Oy — как в тетради: вершина посередине,
 * нули на трети и двух третях ширины. С осью Oy — в масштабе по x.
 * Ветви — отрезок параболы, записанный одной квадратичной кривой
 * Безье: она и есть парабола, а не приближение.
 */
export function geomParaboly(p: Parabola16): Geom16 {
  proverit(p.korni);
  if (p.korni.length > 2) {
    throw new Error('У параболы не больше двух нулей');
  }
  const w = SHIRINA;
  const osY = 100;
  const verh = 14;
  const niz = 176;
  const vv = p.vetvi === 'vverh' ? 1 : -1;
  const n = p.korni.length;

  /* Абсцисса на рисунке. */
  let X: (x: number) => number;
  if (p.oy) {
    const vse = [0, ...p.korni.map((k) => k.x), p.vershina ?? 0];
    const lo = Math.min(...vse);
    const hi = Math.max(...vse);
    const span = hi - lo || 2;
    const pad = 0.4 * span + 1;
    X = (x) => 40 + ((x - (lo - pad)) / (span + 2 * pad)) * (w - 90);
  } else {
    const pos = n === 2 ? [w / 3, (2 * w) / 3] : [w / 2];
    X = (x) => {
      const i = p.korni.findIndex((k) => k.x === x);
      return i >= 0 ? at(pos, i) : w / 2;
    };
  }
  const xs = p.korni.map((k) => X(k.x));
  const xv =
    n === 2 ? (at(xs, 0) + at(xs, 1)) / 2 : n === 1 ? at(xs, 0) : p.oy ? X(p.vershina ?? 0) : w / 2;

  /* Вершина: за осью при двух нулях, на оси при одном, до оси не
     доходит при D < 0. Ветвь при двух нулях проходит через нули. */
  const glubina = 52;
  const yv = n === 2 ? osY + vv * glubina : n === 1 ? osY : osY - vv * 26;
  const d = n === 2 ? (at(xs, 1) - at(xs, 0)) / 2 : w / 6;
  const c = n === 2 ? (-vv * glubina) / (d * d) : (-vv * 70) / (w / 4) ** 2;
  const kray = vv === 1 ? verh : niz;
  const L = Math.min(Math.sqrt(Math.abs((kray - yv) / c)), xv - 12, w - 24 - xv);
  const yE = yv + c * L * L;
  const krivaya = `M${xv - L} ${yE}Q${xv} ${yv - c * L * L} ${xv + L} ${yE}`;

  /* Знак выражения на промежутках оси: парабола над осью — «+». */
  const snaruzhi: Znak16 = vv === 1 ? '+' : '-';
  const vnutri: Znak16 = snaruzhi === '+' ? '-' : '+';
  const znakiPr: Znak16[] =
    n === 2 ? [snaruzhi, vnutri, snaruzhi] : n === 1 ? [snaruzhi, snaruzhi] : [snaruzhi];
  const nuzhen: Znak16 | null = p.shtrikh === undefined ? null : p.shtrikh === 'nad' ? '+' : '-';
  const shtrikh: Ryad16['shtrikh'] = [];
  if (nuzhen !== null) {
    znakiPr.forEach((z, i) => {
      if (z === nuzhen) {
        const [x1, x2] = kraya(xs, i - 1, i);
        shtrikh.push({ x1, x2, vys: 14, sloy: 0 });
      }
    });
  }
  const sr = srednie(xs);
  const znakiP = p.znaki
    ? znakiPr.map((z, i) => znakPodpis(n === 0 ? w * 0.85 : at(sr, i), osY - 30, z))
    : [];

  const oy = p.oy ? { x: X(0), y1: niz, y2: verh - 8 } : undefined;
  /* Подписи оси Oy: «y» у стрелки, «0» под началом координат —
     они занимают место первыми, числа обходят их. */
  const zanyato: Podpis16[] = [];
  if (oy !== undefined) {
    zanyato.push({
      tex: 'y',
      vid: 'os',
      ramka: { x1: oy.x + 8, x2: oy.x + 8 + shirinaTex16('y'), y1: verh - 10, y2: verh + 14 },
    });
  }
  const chisla = podpisiPodOsyu(
    osY,
    [
      ...(oy === undefined || p.korni.some((k) => k.x === 0) ? [] : [{ cx: oy.x - 16, tex: '0' }]),
      /* Нуль в точке 0 стоит на оси Oy: подпись — левее оси. */
      ...p.korni.map((k, i) => ({
        cx: oy !== undefined && k.x === 0 ? oy.x - 16 : at(xs, i),
        tex: k.tex,
      })),
    ],
    p.peremennaya ?? 'x',
    zanyato,
  );
  const podpisi = [...zanyato, ...znakiP, ...chisla];
  return {
    w,
    h: vysota(podpisi, niz + 4),
    ryady: [
      {
        osY,
        tsvet: 0,
        tochki: p.korni.map((k, i) => ({ cx: at(xs, i), zakrashena: k.zakrashena })),
        shtrikh,
      },
    ],
    dugi: [],
    krivaya,
    ...(oy === undefined ? {} : { oy }),
    napravlyayushchie: [],
    podpisi,
    opisanie:
      p.opisanie ??
      `Эскиз параболы, ветви ${p.vetvi === 'vverh' ? 'вверх' : 'вниз'}, ${
        n === 0
          ? 'с осью Ox не пересекается'
          : n === 1
            ? `касается оси Ox в точке ${bezTex(at(p.korni, 0).tex)}`
            : 'пересекает ось Ox в двух точках'
      }.`,
  };
}

export function geom16(ch: Chertezh16): Geom16 {
  if (ch.vid === 'pryamaya') return geomPryamoy(ch);
  if (ch.vid === 'sistema') return geomSistemy(ch);
  return geomParaboly(ch);
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
  /** Рисовать дуги «змейки». */
  dugi?: boolean;
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
    ...(m.dugi ? { dugi: true } : {}),
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
    out.push({
      ot: u.ot < 0 ? -Infinity : at(xs, u.ot),
      do: u.do >= n ? Infinity : at(xs, u.do),
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
