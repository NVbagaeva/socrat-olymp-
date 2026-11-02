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
import { gabaritBukvy, kasaniya, razmestitSVynoskami, type Prepyatstviya } from './podpisi';
import type { Cvet, Element, Kadr, Ramka, StilLinii, T2, Vid, Yakor, ZhivayaSkhema } from './tipy';

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
  /** Кегль величины (данные условия на чертеже), px. */
  keglVel: 15,
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
  /** Выбранный режим схемы (ZhivayaSkhema.rezhimy); не задан — первый. */
  rezhim?: string;
}

/**
 * Режим, в котором рисовать кадр: горит группа режима — он; иначе
 * выбранный; иначе первый. У схемы без режимов — undefined.
 */
export function rezhimKadra(skhema: ZhivayaSkhema, sost: Sostoyanie): string | undefined {
  const r = skhema.rezhimy;
  if (r === undefined || r.length === 0) return undefined;
  const poPodsvetke = r.find((m) => m.gruppy.some((g) => sost.lit.has(g)));
  if (poPodsvetke !== undefined) return poPodsvetke.id;
  return r.find((m) => m.id === sost.rezhim)?.id ?? r[0]!.id;
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
      case 'velichina':
        tochkiYakorya(el.yakor).forEach((p) => vzyat(p));
        break;
    }
  }
  if (!Number.isFinite(minx)) return [-1, -1, 1, 1];
  return [minx, miny, maxx, maxy];
}

function tochkiYakorya(y: Yakor): readonly T2[] {
  if ('otrezok' in y) return y.otrezok;
  if ('ugol' in y) return [y.ugol[1]];
  return [y.vnutri];
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
  /** Выноска от точки к отнесённой букве: путь SVG или пустая строка. */
  vynoska: string;
}

/**
 * Кусок текста величины: цифры, знаки и имена функций (cos) прямо,
 * латинские буквы курсивом; indeks — нижний индекс (S_ABC).
 */
export interface ChastVelichiny {
  t: string;
  kursiv: boolean;
  indeks: boolean;
}

export interface EkrVelichina extends Obshchee {
  /** Центр текста. */
  x: number;
  y: number;
  chasti: ChastVelichiny[];
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
  /** Данные условия на чертеже: длины, углы, площади. */
  velichiny: EkrVelichina[];
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
    case 'velichina':
      return tochkiYakorya(el.yakor).every(ok);
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
  /* Величина не уместилась в поле — фигура чуть мельчает, чтобы
     запись не обрезалась краем чертежа. */
  let r = ramka;
  for (let i = 0; ; i += 1) {
    const [ekran, vne] = raskladka1(kadr, vid, r, W, H, sost, ruchki);
    if (!vne || i === 3) return ekran;
    const dx = (r[2] - r[0]) * 0.1;
    const dy = (r[3] - r[1]) * 0.1;
    r = [r[0] - dx, r[1] - dy, r[2] + dx, r[3] + dy];
  }
}

function raskladka1(
  kadr: Kadr,
  vid: Vid,
  ramka: Ramka,
  W: number,
  H: number,
  sost: Sostoyanie,
  ruchki: readonly string[],
): [Ekran, boolean] {
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
    velichiny: [],
    poImeni: {},
    preob,
  };
  const prep: Prepyatstviya = { otrezki: [], okruzhnosti: [], tochki: [] };
  /* Величины ставятся последними: им мешают и линии, и буквы. */
  const velichiny: { el: Element & { vid: 'velichina' }; obshchee: Obshchee }[] = [];

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
    if (el.vid === 'velichina') {
      velichiny.push({ el, obshchee });
      continue;
    }
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

  const zanyato: Pryam[] = [];
  if (sost.podpisi) {
    const imennye = ekran.tochki.filter((t) => t.imya !== null);
    const mesta = razmestitSVynoskami(
      imennye.map((t) => ({ p: [t.x, t.y] as T2, imya: t.imya ?? '' })),
      prep,
      W,
      H,
      SK.kegl,
    );
    imennye.forEach((t, i) => {
      const { c: m, vynoska: v } = mesta[i]!;
      const [bukva, indeks] = (t.imya ?? '').split('_');
      const g = gabaritBukvy(t.imya ?? '', SK.kegl);
      zanyato.push([m[0] - g.hw, m[1] - g.hh, m[0] + g.hw, m[1] + g.hh]);
      if (v !== null) prep.otrezki.push([v[0], v[1]]);
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
        vynoska: v === null ? '' : `M${f2(v[0][0])} ${f2(v[0][1])}L${f2(v[1][0])} ${f2(v[1][1])}`,
      });
    });
  }
  let vne = false;
  for (const { el, obshchee } of velichiny) {
    const chasti = chastiVelichiny(el.tekst);
    const { hw, hh } = gabaritVelichiny(chasti);
    const c = mestoVelichiny(el.yakor, hw, hh, E, prep, zanyato, W, H);
    if (c[0] - hw < 1 || c[1] - hh < 1 || c[0] + hw > W - 1 || c[1] + hh > H - 1) vne = true;
    zanyato.push([c[0] - hw, c[1] - hh, c[0] + hw, c[1] + hh]);
    ekran.velichiny.push({ ...obshchee, x: f2(c[0]), y: f2(c[1]), chasti });
  }
  return [ekran, vne];
}

/* ── Величины ──────────────────────────────────────────────────── */

type Pryam = readonly [number, number, number, number];

/** «S_ABC = 60», «cos C = 0,6» → куски для набора. */
export function chastiVelichiny(tekst: string): ChastVelichiny[] {
  const out: ChastVelichiny[] = [];
  const dobavit = (t: string, kursiv: boolean, indeks: boolean) => {
    const posl = out[out.length - 1];
    if (posl !== undefined && posl.kursiv === kursiv && posl.indeks === indeks) posl.t += t;
    else out.push({ t, kursiv, indeks });
  };
  const re = /(cos|sin|tg|ctg)|_([A-Za-z0-9]+)|([A-Za-z])|([^A-Za-z_]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tekst)) !== null) {
    if (m[1] !== undefined) dobavit(m[1], false, false);
    else if (m[2] !== undefined) dobavit(m[2], /[A-Za-z]/.test(m[2]), true);
    else if (m[3] !== undefined) dobavit(m[3], true, false);
    else if (m[4] !== undefined) dobavit(m[4], false, false);
  }
  return out;
}

/** Полуширина и полувысота записи величины, px. */
export function gabaritVelichiny(chasti: readonly ChastVelichiny[]): { hw: number; hh: number } {
  return { hw: shirinaVelichiny(chasti, SK.keglVel) / 2 + 1, hh: SK.keglVel * 0.42 };
}

/** Ширина текста величины, px (оценка по классам знаков). */
function shirinaVelichiny(chasti: readonly ChastVelichiny[], kegl: number): number {
  let w = 0;
  for (const c of chasti) {
    const k = c.indeks ? 0.7 : 1;
    for (const ch of c.t) {
      let x = 0.3;
      if (/[0-9]/.test(ch)) x = 0.5;
      else if (/[A-Za-z]/.test(ch)) x = c.kursiv ? 0.62 : 0.5;
      else if (ch === ' ') x = 0.25;
      else if (ch === '=' || ch === '+' || ch === '−') x = 0.78;
      else if (ch === '√') x = 0.85;
      else if (ch === '°') x = 0.4;
      w += x * k;
    }
  }
  return w * kegl;
}

/**
 * Место величины: первый кандидат, который ничего не задевает.
 * У отрезка — снаружи фигуры по нормали к середине, потом ближе к
 * концам и с другой стороны; у угла — по биссектрисе за дугой угла;
 * внутри — около точки по спирали.
 */
function mestoVelichiny(
  y: Yakor,
  hw: number,
  hh: number,
  E: (p: T2) => T2,
  prep: Prepyatstviya,
  zanyato: readonly Pryam[],
  W: number,
  H: number,
): T2 {
  const centr: T2 = [W / 2, H / 2];
  const kand: { c: T2; cena: number }[] = [];
  const vynos = (d: T2) => Math.abs(d[0]) * hw + Math.abs(d[1]) * hh;
  if ('otrezok' in y) {
    const a = E(y.otrezok[0]);
    const b = E(y.otrezok[1]);
    const u = unit(sub(b, a));
    const nr: T2 = [-u[1], u[0]];
    const m: T2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const naruzhu = dot(sub(m, centr), nr) >= 0 ? 1 : -1;
    const l = dist(a, b);
    for (const ots of [4, 7, 11, 16]) {
      for (const t of [0, 0.15, -0.15, 0.3, -0.3]) {
        for (const storona of [naruzhu, -naruzhu]) {
          const d: T2 = [nr[0] * storona, nr[1] * storona];
          const k = ots + vynos(d);
          kand.push({
            c: [m[0] + u[0] * t * l + d[0] * k, m[1] + u[1] * t * l + d[1] * k],
            cena: ots + Math.abs(t) * 30 + (storona === naruzhu ? 0 : 12),
          });
        }
      }
    }
  } else if ('ugol' in y) {
    const a = E(y.ugol[0]);
    const v = E(y.ugol[1]);
    const b = E(y.ugol[2]);
    const ua = unit(sub(a, v));
    const ub = unit(sub(b, v));
    let bis: T2 = [ua[0] + ub[0], ua[1] + ub[1]];
    bis = len(bis) < 1e-6 ? [-ua[1], ua[0]] : unit(bis);
    const r0 = Math.max(
      SK.ugol.min,
      Math.min(SK.ugol.r, SK.ugol.dolya * Math.min(dist(a, v), dist(b, v))),
    );
    for (const ots of [4, 8, 13, 19, 26]) {
      for (const da of [0, 12, -12, 24, -24, 40, -40]) {
        const d = rotate(bis, [0, 0], da);
        const k = r0 + ots + vynos(d);
        kand.push({ c: [v[0] + d[0] * k, v[1] + d[1] * k], cena: ots + Math.abs(da) * 0.4 });
      }
    }
    /* Узкий угол: длинная запись не помещается внутри — встаёт снаружи
       вершины, на продолжении биссектрисы. */
    for (const ots of [5, 9, 14]) {
      for (const da of [0, 25, -25, 50, -50]) {
        const d = rotate([-bis[0], -bis[1]], [0, 0], da);
        const k = ots + vynos(d);
        kand.push({ c: [v[0] + d[0] * k, v[1] + d[1] * k], cena: 60 + ots + Math.abs(da) * 0.4 });
      }
    }
  } else {
    const p = E(y.vnutri);
    kand.push({ c: p, cena: 0 });
    for (const ots of [6, 12, 18, 26]) {
      for (let i = 0; i < 12; i += 1) {
        const d = polar(i * 30, 1);
        kand.push({ c: [p[0] + d[0] * ots, p[1] + d[1] * ots], cena: ots });
      }
    }
  }
  kand.sort((x, z) => x.cena - z.cena);
  let luchshee: T2 = kand[0]?.c ?? centr;
  let luchshiy = Infinity;
  for (const { c, cena } of kand) {
    const pr: Pryam = [c[0] - hw, c[1] - hh, c[0] + hw, c[1] + hh];
    const vne = pr[0] < 1 || pr[1] < 1 || pr[2] > W - 1 || pr[3] > H - 1 ? 1 : 0;
    const shtraf = 1e4 * kasaniya(pr, prep, zanyato, null) + 3e3 * vne + cena;
    if (shtraf < luchshiy) {
      luchshiy = shtraf;
      luchshee = c;
    }
    if (shtraf < 1e3) break;
  }
  return luchshee;
}

/** Длина экранного вектора — для проверок. */
export const dlina = len;
