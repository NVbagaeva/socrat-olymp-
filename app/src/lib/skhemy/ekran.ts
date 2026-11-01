/**
 * Экранная раскладка живой схемы: кадр в координатах модели →
 * примитивы SVG в пикселях экрана.
 *
 * Порядок: отражение и поворот (vid) → рамка (что должно поместиться)
 * → масштаб под ширину чертежа → примитивы. Толщины, дуги углов,
 * засечки и подписи считаются уже в пикселях: при любом повороте и
 * любом размере чертежа буквы стоят прямо, кегль один и тот же, дуги
 * одного радиуса. Поэтому на телефоне подписи не мельчают.
 *
 * Функции чистые: их же вызывает проверка scripts/verify_schemes.
 */

import { angleOf, cross, dist, dot, len, polar, rotate, sub, unit } from './geometriya';
import { razmestitPodpisi, type Prepyatstviya } from './podpisi';
import type { Cvet, Element, Kadr, Ramka, StilLinii, T2, Vid } from './tipy';

/* ── Стиль ─────────────────────────────────────────────────────── */

export const SK = {
  /** Поле вокруг фигуры: место под подписи. */
  pole: 30,
  poleUzkoe: 24,
  ugol: { r: 15, shag: 4, min: 7, dolya: 0.38, pryamoy: 10 },
  shtrih: { pol: 4, shag: 3.5 },
  tochkaR: 2.6,
  /** Кегль подписи точки, px. */
  kegl: 17,
} as const;

/** Радиус кольца ручки перетаскивания, px. */
export const RUCHKA_R = 7;

/* ── Вид и рамка ───────────────────────────────────────────────── */

/** Точка модели после отражения и поворота (ещё не экран). */
export function povernut(p: T2, vid: Vid): T2 {
  return rotate([p[0] * vid.otrazhenie, p[1]], [0, 0], vid.ugol);
}

export interface Sostoyanie {
  /** Горящие группы подсветки. */
  lit: ReadonlySet<string>;
  /** Шаг пошагового построения; null — чертёж целиком. */
  shag: number | null;
  /** Подписи точек: на лицевой стороне карточки «Узнай схему» их нет. */
  podpisi: boolean;
}

export const SOSTOYANIE_POLNOE: Sostoyanie = { lit: new Set(), shag: null, podpisi: true };

/** Точки дуги против часовой от ot до do (градусы) — ломаная для отрисовки и рамки. */
export function tochkiDugi(c: T2, r: number, ot: number, doU: number): T2[] {
  let razmah = (((doU - ot) % 360) + 360) % 360;
  if (razmah < 1e-9) razmah = 360;
  const n = Math.max(8, Math.ceil(razmah / 4));
  const out: T2[] = [];
  for (let i = 0; i <= n; i += 1) {
    const q = polar(ot + (razmah * i) / n, r);
    out.push([c[0] + q[0], c[1] + q[1]]);
  }
  return out;
}

function goritEl(el: Element, lit: ReadonlySet<string>): boolean {
  return el.gruppy !== undefined && el.gruppy.some((g) => lit.has(g));
}

/** Цвет элемента: у словаря — цвет первой горящей группы. */
function cvetEl(el: Element, lit: ReadonlySet<string>): Cvet | null {
  if (el.cvet === undefined) return null;
  if (typeof el.cvet === 'string') return el.cvet;
  for (const g of el.gruppy ?? []) {
    const c = el.cvet[g];
    if (lit.has(g) && c !== undefined) return c;
  }
  return null;
}

export function vidimEl(el: Element, sost: Sostoyanie): boolean {
  if (sost.shag !== null && (el.shag ?? 0) > sost.shag) return false;
  return el.skrytyy !== true || goritEl(el, sost.lit);
}

/**
 * Рамка кадра в повёрнутых координатах: всё видимое должно
 * поместиться. Окружность от поворота не меняется — её рамка центр ± r.
 */
export function ramkaKadra(kadr: Kadr, vid: Vid, sost: Sostoyanie): Ramka {
  let minx = Infinity;
  let miny = Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  const vzyat = (p: T2, r = 0) => {
    const q = povernut(p, vid);
    minx = Math.min(minx, q[0] - r);
    maxx = Math.max(maxx, q[0] + r);
    miny = Math.min(miny, q[1] - r);
    maxy = Math.max(maxy, q[1] + r);
  };
  for (const el of kadr.elementy) {
    if (!konechnyy(el) || !vidimEl(el, sost)) continue;
    switch (el.vid) {
      case 'otrezok':
        vzyat(el.a);
        vzyat(el.b);
        break;
      case 'okruzhnost':
        vzyat(el.c, el.r);
        break;
      case 'mnogougolnik':
        el.tochki.forEach((p) => vzyat(p));
        break;
      case 'ugol':
        vzyat(el.v);
        break;
      case 'tochka':
        vzyat(el.p);
        break;
      case 'duga':
        tochkiDugi(el.c, el.r, el.ot, el.do).forEach((p) => vzyat(p));
        break;
    }
  }
  if (!Number.isFinite(minx)) return [-1, -1, 1, 1];
  return [minx, miny, maxx, maxy];
}

/** Плавный переход рамки: доля t ∈ [0; 1] пути от a к b. */
export function smeshatRamki(a: Ramka, b: Ramka, t: number): Ramka {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t,
  ];
}

export interface Preobrazovanie {
  s: number;
  vEkran: (p: T2) => T2;
  vModel: (x: number, y: number) => T2;
}

/** Масштаб и сдвиг: рамка по центру поля W×H с полями. */
export function preobrazovanie(ramka: Ramka, vid: Vid, W: number, H: number): Preobrazovanie {
  const pole = W < 420 ? SK.poleUzkoe : SK.pole;
  const bw = Math.max(ramka[2] - ramka[0], 1e-6);
  const bh = Math.max(ramka[3] - ramka[1], 1e-6);
  const s = Math.min((W - 2 * pole) / bw, (H - 2 * pole) / bh);
  const ox = (W - bw * s) / 2 - ramka[0] * s;
  const oy = (H + bh * s) / 2 + ramka[1] * s;
  const otr = Math.abs(vid.otrazhenie) < 1e-3 ? 1e-3 : vid.otrazhenie;
  return {
    s,
    vEkran: (p) => {
      const q = povernut(p, vid);
      return [ox + q[0] * s, oy - q[1] * s];
    },
    vModel: (x, y) => {
      const q = rotate([(x - ox) / s, (oy - y) / s], [0, 0], -vid.ugol);
      return [q[0] / otr, q[1]];
    },
  };
}

/* ── Примитивы экрана ──────────────────────────────────────────── */

interface Obshchee {
  id: string;
  lit: boolean;
  dim: boolean;
  cvet: Cvet | null;
  /** Появился на нынешнем шаге построения — рисуется с анимацией. */
  novyy: boolean;
}

export interface EkrLiniya extends Obshchee {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stil: StilLinii;
  /** Засечки: путь SVG или пустая строка. */
  shtrihi: string;
}

export interface EkrOkr extends Obshchee {
  cx: number;
  cy: number;
  r: number;
  stil: StilLinii;
}

export interface EkrDuga extends Obshchee {
  d: string;
  stil: StilLinii;
}

export interface EkrMnog extends Obshchee {
  points: string;
}

export interface EkrUgol extends Obshchee {
  /** Дуги или квадратик. */
  d: string;
  /** Заливка сектора у подсвеченного угла; пустая — нет. */
  sektor: string;
  pryamoy: boolean;
}

export interface EkrTochka extends Obshchee {
  x: number;
  y: number;
  imya: string | null;
}

export interface EkrPodpis extends Obshchee {
  x: number;
  y: number;
  bukva: string;
  indeks: string;
}

export interface Ekran {
  W: number;
  H: number;
  mnog: EkrMnog[];
  okr: EkrOkr[];
  dugi: EkrDuga[];
  linii: EkrLiniya[];
  ugly: EkrUgol[];
  tochki: EkrTochka[];
  podpisi: EkrPodpis[];
  /** Экранные положения именованных точек — ручки перетаскивания. */
  poImeni: Record<string, T2>;
  preob: Preobrazovanie;
}

const f1 = (x: number) => Math.round(x * 10) / 10;
/* Координаты атрибутов SVG — до сотых пикселя: тригонометрия на
   сервере и в браузере расходится в последних битах, и без округления
   React ругается на несовпадение разметки при гидратации. */
const f2 = (x: number) => Math.round(x * 100) / 100;

function shtrihiPut(a: T2, b: T2, n: number): string {
  const d = unit(sub(b, a));
  const nrm: T2 = [-d[1], d[0]];
  const m: T2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let put = '';
  for (let i = 0; i < n; i += 1) {
    const sdvig = (i - (n - 1) / 2) * SK.shtrih.shag;
    const c: T2 = [m[0] + d[0] * sdvig, m[1] + d[1] * sdvig];
    put += `M${f1(c[0] + nrm[0] * SK.shtrih.pol)} ${f1(c[1] + nrm[1] * SK.shtrih.pol)}L${f1(c[0] - nrm[0] * SK.shtrih.pol)} ${f1(c[1] - nrm[1] * SK.shtrih.pol)}`;
  }
  return put;
}

interface UgolGeom {
  d: string;
  sektor: string;
  /** Ломаные дуг — препятствия подписям. */
  lomanye: T2[][];
}

function ugolPut(a: T2, v: T2, b: T2, dugi: number, pryamoy: boolean): UgolGeom | null {
  const la = dist(a, v);
  const lb = dist(b, v);
  if (la < 4 || lb < 4) return null;
  const u = unit(sub(a, v));
  const w = unit(sub(b, v));
  if (pryamoy) {
    const s = Math.min(SK.ugol.pryamoy, 0.4 * Math.min(la, lb));
    const p1: T2 = [v[0] + u[0] * s, v[1] + u[1] * s];
    const p2: T2 = [p1[0] + w[0] * s, p1[1] + w[1] * s];
    const p3: T2 = [v[0] + w[0] * s, v[1] + w[1] * s];
    return {
      d: `M${f1(p1[0])} ${f1(p1[1])}L${f1(p2[0])} ${f1(p2[1])}L${f1(p3[0])} ${f1(p3[1])}`,
      sektor: `M${f1(v[0])} ${f1(v[1])}L${f1(p1[0])} ${f1(p1[1])}L${f1(p2[0])} ${f1(p2[1])}L${f1(p3[0])} ${f1(p3[1])}Z`,
      lomanye: [[p1, p2, p3]],
    };
  }
  const sweep = cross(u, w) > 0 ? 1 : 0;
  const r0 = Math.max(SK.ugol.min, Math.min(SK.ugol.r, SK.ugol.dolya * Math.min(la, lb)));
  const a0 = angleOf(u);
  const ugol = Math.acos(Math.max(-1, Math.min(1, dot(u, w)))) / (Math.PI / 180);
  const znak = sweep === 1 ? 1 : -1;
  let d = '';
  const lomanye: T2[][] = [];
  for (let i = 0; i < dugi; i += 1) {
    const r = r0 + i * SK.ugol.shag;
    const p1: T2 = [v[0] + u[0] * r, v[1] + u[1] * r];
    const p2: T2 = [v[0] + w[0] * r, v[1] + w[1] * r];
    d += `M${f1(p1[0])} ${f1(p1[1])}A${f1(r)} ${f1(r)} 0 0 ${sweep} ${f1(p2[0])} ${f1(p2[1])}`;
    const lom: T2[] = [];
    for (let k = 0; k <= 6; k += 1) {
      const q = polar(a0 + (znak * ugol * k) / 6, r);
      lom.push([v[0] + q[0], v[1] + q[1]]);
    }
    lomanye.push(lom);
  }
  const rs = r0 + (dugi - 1) * SK.ugol.shag;
  const s1: T2 = [v[0] + u[0] * rs, v[1] + u[1] * rs];
  const s2: T2 = [v[0] + w[0] * rs, v[1] + w[1] * rs];
  const sektor = `M${f1(v[0])} ${f1(v[1])}L${f1(s1[0])} ${f1(s1[1])}A${f1(rs)} ${f1(rs)} 0 0 ${sweep} ${f1(s2[0])} ${f1(s2[1])}Z`;
  return { d, sektor, lomanye };
}

function konechnyy(el: Element): boolean {
  const ok = (p: T2) => Number.isFinite(p[0]) && Number.isFinite(p[1]);
  switch (el.vid) {
    case 'otrezok':
      return ok(el.a) && ok(el.b);
    case 'okruzhnost':
      return ok(el.c) && Number.isFinite(el.r) && el.r < 1e6;
    case 'mnogougolnik':
      return el.tochki.every(ok);
    case 'ugol':
      return ok(el.a) && ok(el.v) && ok(el.b);
    case 'tochka':
      return ok(el.p);
    case 'duga':
      return ok(el.c) && Number.isFinite(el.r) && el.r < 1e6;
  }
}

/**
 * Кадр → примитивы экрана. Порядок слоёв в SVG: заливки, окружности,
 * линии, дуги углов, точки, подписи.
 */
export function raskladka(
  kadr: Kadr,
  vid: Vid,
  ramka: Ramka,
  W: number,
  H: number,
  sost: Sostoyanie,
  /** Точки с ручками перетаскивания: кольцо ручки — препятствие подписи. */
  ruchki: readonly string[] = [],
): Ekran {
  const preob = preobrazovanie(ramka, vid, W, H);
  const E = preob.vEkran;
  const ekran: Ekran = {
    W,
    H,
    mnog: [],
    okr: [],
    dugi: [],
    linii: [],
    ugly: [],
    tochki: [],
    podpisi: [],
    poImeni: {},
    preob,
  };
  const prep: Prepyatstviya = { otrezki: [], okruzhnosti: [], tochki: [] };

  for (const el of kadr.elementy) {
    /* Промежуточный кадр анимации может пройти через вырожденную
       фигуру: элемент с бесконечностью или NaN просто не рисуется. */
    if (!konechnyy(el)) continue;
    const vidim = vidimEl(el, sost);
    const lit = goritEl(el, sost.lit);
    const obshchee = {
      id: el.id,
      lit,
      dim: sost.lit.size > 0 && !lit,
      cvet: cvetEl(el, sost.lit),
      novyy: sost.shag !== null && sost.shag > 0 && (el.shag ?? 0) === sost.shag,
    };
    if (el.vid === 'tochka') {
      const p = E(el.p);
      const ruchka = el.ruchka ?? el.imya;
      if (ruchka !== undefined) ekran.poImeni[ruchka] = [f2(p[0]), f2(p[1])];
      if (!vidim) continue;
      ekran.tochki.push({ ...obshchee, x: f2(p[0]), y: f2(p[1]), imya: el.imya ?? null });
      prep.tochki.push(p);
      continue;
    }
    if (!vidim) continue;
    switch (el.vid) {
      case 'otrezok': {
        const a = E(el.a);
        const b = E(el.b);
        if (dist(a, b) < 0.5) break;
        ekran.linii.push({
          ...obshchee,
          x1: f2(a[0]),
          y1: f2(a[1]),
          x2: f2(b[0]),
          y2: f2(b[1]),
          stil: el.stil ?? 'linia',
          shtrihi: el.shtrihi === undefined ? '' : shtrihiPut(a, b, el.shtrihi),
        });
        prep.otrezki.push([a, b]);
        break;
      }
      case 'okruzhnost': {
        const c = E(el.c);
        const r = el.r * preob.s;
        ekran.okr.push({
          ...obshchee,
          cx: f2(c[0]),
          cy: f2(c[1]),
          r: f2(r),
          stil: el.stil ?? 'linia',
        });
        prep.okruzhnosti.push([c, r]);
        break;
      }
      case 'duga': {
        const pts = tochkiDugi(el.c, el.r, el.ot, el.do).map(E);
        ekran.dugi.push({
          ...obshchee,
          d: pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f1(p[0])} ${f1(p[1])}`).join(''),
          stil: el.stil ?? 'linia',
        });
        for (let i = 1; i < pts.length; i += 1) prep.otrezki.push([pts[i - 1]!, pts[i]!]);
        break;
      }
      case 'mnogougolnik': {
        const pts = el.tochki.map(E);
        ekran.mnog.push({
          ...obshchee,
          points: pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' '),
        });
        break;
      }
      case 'ugol': {
        const g = ugolPut(E(el.a), E(el.v), E(el.b), el.dugi ?? 1, el.pryamoy === true);
        if (g === null) break;
        ekran.ugly.push({
          ...obshchee,
          d: g.d,
          sektor: lit ? g.sektor : '',
          pryamoy: el.pryamoy === true,
        });
        for (const lom of g.lomanye) {
          for (let i = 1; i < lom.length; i += 1) prep.otrezki.push([lom[i - 1]!, lom[i]!]);
        }
        break;
      }
    }
  }

  for (const imya of ruchki) {
    const p = ekran.poImeni[imya];
    if (p !== undefined) prep.okruzhnosti.push([p, RUCHKA_R]);
  }

  if (sost.podpisi) {
    const imennye = ekran.tochki.filter((t) => t.imya !== null);
    const mesta = razmestitPodpisi(
      imennye.map((t) => ({ p: [t.x, t.y] as T2, imya: t.imya ?? '' })),
      prep,
      W,
      H,
      SK.kegl,
    );
    imennye.forEach((t, i) => {
      const m = mesta[i]!;
      const [bukva, indeks] = (t.imya ?? '').split('_');
      ekran.podpisi.push({
        id: `p-${t.id}`,
        lit: t.lit,
        /* Буквы не тускнеют: по ним читают и подсвеченное, и остальное. */
        dim: false,
        cvet: t.cvet,
        novyy: t.novyy,
        x: f2(m[0]),
        y: f2(m[1]),
        bukva: bukva ?? '',
        indeks: indeks ?? '',
      });
    });
  }
  return ekran;
}

/** Длина экранного вектора — для проверок. */
export const dlina = len;
