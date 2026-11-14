/**
 * Тренажёр «Тригонометрическая окружность» (№14) — движок без React.
 *
 * Ученик раскладывает карточки с углами по точкам окружности. Здесь:
 * — режимы (какие точки на окружности) и уровни (какие углы);
 * — генератор раунда по зерну: одна карточка — одна точка, дроби
 *   сокращены, углы не повторяются;
 * — раскладка слотов: стеклянные ячейки снаружи окружности, по лучу
 *   своей точки, не задевают окружность, оси, подписи и друг друга;
 * — проверка раскладки и разбор угла «m·2π + остаток».
 *
 * Углы — числа вида n·π/d с d ∈ {1, 2, 3, 4, 6}. Точка окружности —
 * номер k = 0…23 шага π/12: так в одной сетке живут и четверти,
 * и деления на 8 и на 12. Геометрия — в единицах viewBox, R = 100,
 * как у остальных окружностей раздела (lib/zadanie14/krug.ts).
 */

import { peresekayutsya, R, rasstoyaniyaRamki, type Ramka } from './krug';

/* ── Углы ─────────────────────────────────────────────────────── */

/** Угол n·π/d, дробь несократима, d > 0. */
export interface UgolOk {
  n: number;
  d: number;
}

function nod(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x === 0 ? 1 : x;
}

/** Угол точки k (шаг π/12) плюс m полных оборотов. */
export function ugolTochki(k: number, m = 0): UgolOk {
  const n = k + 24 * m;
  const g = nod(n, 12);
  return { n: n / g, d: 12 / g };
}

/** Номер точки угла: 0…23 (шаг π/12). */
export function tochkaUgla(u: UgolOk): number {
  const k = (u.n * 12) / u.d;
  return ((k % 24) + 24) % 24;
}

/** Сколько полных оборотов 2π в угле: u = m·2π + остаток, остаток ∈ [0; 2π). */
export function oboroty(u: UgolOk): number {
  return Math.floor(u.n / (2 * u.d));
}

/** TeX угла: 0, π, −3π, \frac{5\pi}{4}, -\frac{179\pi}{2}. */
export function ugolOkTex(u: UgolOk): string {
  if (u.n === 0) return '0';
  const znak = u.n < 0 ? '-' : '';
  const a = Math.abs(u.n);
  const chis = a === 1 ? '\\pi' : `${a}\\pi`;
  return u.d === 1 ? `${znak}${chis}` : `${znak}\\frac{${chis}}{${u.d}}`;
}

/** То же для текста разбора: дробь крупно. */
function ugolD(u: UgolOk): string {
  return ugolOkTex(u).replace('\\frac', '\\dfrac');
}

export function ravnyUgly(a: UgolOk, b: UgolOk): boolean {
  return a.n === b.n && a.d === b.d;
}

/** Значение в радианах. */
export function radiany(u: UgolOk): number {
  return (u.n * Math.PI) / u.d;
}

/* ── Режимы и уровни ──────────────────────────────────────────── */

export type Rezhim = 'chetverti' | 'chetyre' | 'shest' | 'mix';
export type Uroven = 'osnovnye' | 'otric' | 'bolshie';

export interface RezhimInfo {
  id: Rezhim;
  title: string;
  /** Короткое пояснение под кнопкой: какие точки. */
  opisanie: string;
  /** Точки окружности (номера k). */
  tochki: number[];
  /** Уровни; один — выбор уровня не показывается. */
  urovni: Uroven[];
}

const kratnye = (shag: number) => Array.from({ length: 24 / shag }, (_, i) => i * shag);

export const REZHIMY: readonly RezhimInfo[] = [
  {
    id: 'chetverti',
    title: 'Четверти',
    opisanie: 'Четыре точки на осях, углы — любые кратные $\\dfrac{\\pi}{2}$',
    tochki: kratnye(6),
    urovni: ['bolshie'],
  },
  {
    id: 'chetyre',
    title: 'Знаменатель 4',
    opisanie: 'Восемь точек: окружность поделена на $8$ частей',
    tochki: kratnye(3),
    urovni: ['osnovnye', 'otric', 'bolshie'],
  },
  {
    id: 'shest',
    title: 'Знаменатель 6 и 3',
    opisanie: 'Двенадцать точек: окружность поделена на $12$ частей',
    tochki: kratnye(2),
    urovni: ['osnovnye', 'otric', 'bolshie'],
  },
  {
    id: 'mix',
    title: 'Вперемешку',
    opisanie: 'Шестнадцать точек сразу, карточек восемь — часть ячеек останется пустой',
    tochki: [...new Set([...kratnye(2), ...kratnye(3)])].sort((a, b) => a - b),
    urovni: ['osnovnye', 'otric', 'bolshie'],
  },
];

export const UROVNI: readonly { id: Uroven; title: string; opisanie: string }[] = [
  { id: 'osnovnye', title: 'Основные', opisanie: 'Углы от $0$ до $2\\pi$' },
  { id: 'otric', title: 'С отрицательными', opisanie: 'Углы от $-2\\pi$ до $2\\pi$' },
  {
    id: 'bolshie',
    title: 'Большие углы',
    opisanie: 'Углы больше оборота — от $2\\pi$ до тысяч $\\pi$',
  },
];

export function rezhimInfo(id: Rezhim): RezhimInfo {
  return REZHIMY.find((r) => r.id === id) ?? (REZHIMY[0] as RezhimInfo);
}

/** Уровень, который на самом деле действует в режиме. */
export function urovenRezhima(rezhim: Rezhim, uroven: Uroven): Uroven {
  const info = rezhimInfo(rezhim);
  return info.urovni.includes(uroven) ? uroven : (info.urovni[0] as Uroven);
}

/** Сколько карточек может лечь на одну точку. */
export function emkost(rezhim: Rezhim, uroven: Uroven): 1 | 2 {
  /* Вперемешку точек вдвое больше карточек — перебором не угадать,
     а двойные ячейки на 16 точках не помещаются в ширину телефона. */
  return (rezhim === 'chetyre' || rezhim === 'shest') && urovenRezhima(rezhim, uroven) === 'bolshie'
    ? 2
    : 1;
}

/* ── Раунд ────────────────────────────────────────────────────── */

export interface Kartochka {
  id: number;
  ugol: UgolOk;
  /** Верная точка. */
  k: number;
}

export interface Raund {
  rezhim: Rezhim;
  uroven: Uroven;
  emkost: 1 | 2;
  /** Точки окружности режима. */
  tochki: number[];
  /** Карточки в порядке панели (перемешаны). */
  kartochki: Kartochka[];
}

/** Детерминированный генератор по зерну (mulberry32). */
export function sluchay(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function celoe(rnd: () => number, ot: number, doV: number): number {
  return ot + Math.floor(rnd() * (doV - ot + 1));
}

function peremeshat<T>(a: readonly T[], rnd: () => number): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Знакомые «круглые» большие числа: 2026π, 3005π, 179π/2 и т. п. */
const OGROMNYE_M = [250, 500, 506, 751, 1000, 1012, 1013, 1250, 1502, 44, 89, 100];

/**
 * Число оборотов для большого угла. Для точек на осях (d = 1, 2)
 * бывают огромные углы вроде 3005π; для π/4, π/6, π/3 — до десятка
 * оборотов, чтобы числитель оставался посильным.
 */
function oborotyBolshogo(k: number, rnd: () => number): number {
  const naOsi = k % 6 === 0;
  const znak = rnd() < 0.3 ? -1 : 1;
  if (naOsi && rnd() < 0.55) {
    return znak * (OGROMNYE_M[celoe(rnd, 0, OGROMNYE_M.length - 1)] as number);
  }
  if (naOsi && rnd() < 0.5) return znak * celoe(rnd, 6, 40);
  return znak * celoe(rnd, 1, 6);
}

/** Угол для точки k на уровне. */
function ugolDlya(k: number, uroven: Uroven, rnd: () => number, otric: boolean): UgolOk {
  if (uroven === 'osnovnye') return ugolTochki(k, 0);
  if (uroven === 'otric') return ugolTochki(k, otric ? -1 : 0);
  let m = oborotyBolshogo(k, rnd);
  /* «Большой» — больше оборота по модулю: m = −1 даёт угол из (−2π; 0]. */
  if (m === -1) m = -2;
  return ugolTochki(k, m);
}

/** Точки карточек раунда: какие точки и сколько карточек на каждой. */
function tochkiKartochek(info: RezhimInfo, uroven: Uroven, rnd: () => number): number[] {
  const vse = info.tochki;
  if (info.id === 'chetverti') return [...vse];
  if (uroven !== 'bolshie' || info.id === 'mix') {
    if (info.id !== 'mix') return [...vse];
    /* Вперемешку: восемь точек, из каждого семейства хотя бы по две. */
    const sem = [
      vse.filter((k) => k % 6 === 0),
      vse.filter((k) => k % 3 === 0 && k % 6 !== 0),
      vse.filter((k) => k % 4 === 2 && k % 6 !== 0),
      vse.filter((k) => k % 4 === 0 && k % 6 !== 0),
    ];
    const vybor = sem.flatMap((s) => peremeshat(s, rnd).slice(0, 2));
    return vybor;
  }
  /* Большие углы: часть точек получает две карточки, часть — ни одной. */
  const skolko = info.id === 'shest' ? 10 : 8;
  const dvoynyh = celoe(rnd, 2, 3);
  const tochki = peremeshat(vse, rnd).slice(0, skolko - dvoynyh);
  return [...tochki, ...tochki.slice(0, dvoynyh)];
}

/** Раунд по зерну. Одно зерно — один и тот же раунд. */
export function raund(rezhim: Rezhim, urovenVybran: Uroven, seed: number): Raund {
  const rnd = sluchay(seed);
  const info = rezhimInfo(rezhim);
  const uroven = urovenRezhima(rezhim, urovenVybran);
  const tochki = tochkiKartochek(info, uroven, rnd);
  /* Отрицательные: не меньше половины карточек. */
  const otric = new Set<number>();
  if (uroven === 'otric') {
    const poryadok = peremeshat(
      tochki.map((_, i) => i),
      rnd,
    );
    const nado = Math.ceil(tochki.length / 2) + celoe(rnd, 0, Math.floor(tochki.length / 4));
    for (const i of poryadok.slice(0, nado)) otric.add(i);
  }
  const ugly: UgolOk[] = [];
  tochki.forEach((k, i) => {
    let u = ugolDlya(k, uroven, rnd, otric.has(i));
    for (let p = 0; p < 40 && ugly.some((v) => ravnyUgly(u, v)); p += 1) {
      u = ugolDlya(k, uroven, rnd, otric.has(i));
    }
    /* Повтор так и не ушёл — сдвигаем на оборот: точка та же. */
    while (ugly.some((v) => ravnyUgly(u, v))) u = ugolTochki(k, oboroty(u) + 3);
    ugly.push(u);
  });
  const kartochki = peremeshat(
    ugly.map((ugol, i) => ({ ugol, k: tochki[i] as number })),
    rnd,
  ).map((c, id) => ({ id, ...c }));
  return { rezhim, uroven, emkost: emkost(rezhim, uroven), tochki: info.tochki, kartochki };
}

/* ── Проверка ─────────────────────────────────────────────────── */

/** Раскладка: id карточки → точка (k) или null, если карточка в панели. */
export type Raskladka = Record<number, number | null>;

export type OtmetkaKartochki = 'verno' | 'neverno' | 'pusto';

export interface ItogOk {
  otmetki: Record<number, OtmetkaKartochki>;
  verno: number;
  vsego: number;
  vse: boolean;
}

export function proveritRaskladku(r: Raund, raskl: Raskladka): ItogOk {
  const otmetki: Record<number, OtmetkaKartochki> = {};
  let verno = 0;
  for (const c of r.kartochki) {
    const k = raskl[c.id];
    if (k === null || k === undefined) otmetki[c.id] = 'pusto';
    else if (k === c.k) {
      otmetki[c.id] = 'verno';
      verno += 1;
    } else otmetki[c.id] = 'neverno';
  }
  return { otmetki, verno, vsego: r.kartochki.length, vse: verno === r.kartochki.length };
}

/* ── Разбор ───────────────────────────────────────────────────── */

function slovoOborotov(m: number): string {
  const a = Math.abs(m);
  const d = a % 100;
  if (d >= 11 && d <= 14) return 'полных оборотов';
  if (a % 10 === 1) return 'полный оборот';
  if (a % 10 >= 2 && a % 10 <= 4) return 'полных оборота';
  return 'полных оборотов';
}

/**
 * Разбор угла — строки с формулами в $…$.
 * 3005π = 3004π + π = 1502·2π + π → точка π;
 * −7π/4 = −2π + π/4 → точка π/4.
 */
export function razborUgla(u: UgolOk): { cepochka: string; poyasnenie: string; tochka: string } {
  const m = oboroty(u);
  const ost = ugolTochki(tochkaUgla(u), 0);
  const tochka = ugolD(ost);
  const t = ugolD(u);
  const ostZapis = ost.n === 0 ? '' : `+${tochka}`;
  if (m === 0) {
    const shag = ost.d === 1 ? '\\pi' : `\\dfrac{\\pi}{${ost.d}}`;
    const poyasnenie =
      ost.n === 0
        ? 'Угол $0$ — начальная точка $(1;\\,0)$.'
        : ost.n === 1
          ? `Угол меньше оборота: проходим против часовой стрелки дугу ${ost.d === 1 ? '$\\pi$ — половину окружности' : `$${shag}$`}.`
          : `Угол меньше оборота: знаменатель $${ost.d}$ — шаг $${shag}$, проходим $${ost.n}$ таких шагов против часовой стрелки.`;
    return { cepochka: `${t}`, poyasnenie, tochka };
  }
  const oborot = Math.abs(m) === 1 ? `${m < 0 ? '-' : ''}2\\pi` : `${m}\\cdot2\\pi`;
  /* Промежуточный шаг: 176π/2 + 3π/2 — то, что делится на 2π, отдельно. */
  const celaya: UgolOk = { n: 2 * m * u.d, d: u.d };
  const celayaTex =
    u.d === 1 ? ugolD(celaya) : `${m < 0 ? '-' : ''}\\dfrac{${Math.abs(celaya.n)}\\pi}{${u.d}}`;
  const shagi = [t];
  if (Math.abs(m) >= 2 || u.d === 1) {
    if (ost.n !== 0) shagi.push(`${celayaTex}${ostZapis}`);
  }
  shagi.push(`${oborot}${ostZapis}`);
  const cepochka = [...new Set(shagi)].join('=');
  if (m === -1) {
    const modul = ugolD({ n: -u.n, d: u.d });
    const poyasnenie =
      ost.n === 0
        ? 'Угол отрицательный: от начала идём по часовой стрелке целый оборот и возвращаемся в точку $(1;\\,0)$.'
        : `Угол отрицательный: от точки $(1;\\,0)$ идём по часовой стрелке дугу $${modul}$. Запись $-2\\pi+${tochka}$ говорит то же: оборот назад и $${tochka}$ вперёд.`;
    return { cepochka, poyasnenie, tochka };
  }
  const kuda = m > 0 ? 'против часовой стрелки' : 'по часовой стрелке';
  const skolko = Math.abs(m) === 1 ? 'Один полный оборот' : `$${Math.abs(m)}$ ${slovoOborotov(m)}`;
  const hvost =
    ost.n === 0
      ? ' — и точка возвращается в начало $(1;\\,0)$.'
      : m > 0
        ? `, затем ещё $${tochka}$.`
        : `, затем $${tochka}$ обратно, против часовой стрелки.`;
  const poyasnenie = `${skolko} ${kuda}${hvost} Полные обороты точку не меняют.`;
  return { cepochka, poyasnenie, tochka };
}

/* ── Раскладка слотов ─────────────────────────────────────────── */

/** Размер карточки и ячейки в единицах viewBox. */
export const KARTA = { w: 60, h: 42 } as const;
/** Промежуток между двумя карточками в одной ячейке. */
export const ZAZOR_KART = 4;
/** Отступ ячейки от окружности. */
const OTSTUP = 7;
/** Конец оси: стрелка чуть дальше окружности. */
export const OS_OK = R + 16;

export interface Yacheyka {
  k: number;
  /** Точка на окружности. */
  x0: number;
  y0: number;
  ramka: Ramka;
  /** Ячейка ушла от луча — нужна выноска к точке. */
  vynoska: boolean;
}

export interface PodpisOk {
  tex: string;
  x: number;
  y: number;
  ramka: Ramka;
}

export interface GeomOk {
  vb: { x: number; y: number; w: number; h: number };
  yacheyki: Yacheyka[];
  podpisi: PodpisOk[];
  /** Стрелка «против часовой» у начальной точки: дуга и наконечник. */
  strelka: { duga: string; konec: string };
}

function naKruge(theta: number, r = R): { x: number; y: number } {
  return { x: r * Math.cos(theta), y: -r * Math.sin(theta) };
}

function ramkaC(x: number, y: number, w: number, h: number): Ramka {
  return { x1: x - w / 2, y1: y - h / 2, x2: x + w / 2, y2: y + h / 2 };
}

/** Размер ячейки: две карточки — одна под другой. */
export function razmerYacheyki(e: 1 | 2): { w: number; h: number } {
  return { w: KARTA.w, h: e === 1 ? KARTA.h : 2 * KARTA.h + ZAZOR_KART };
}

const T = 2.5;
const OSI: Ramka[] = [
  { x1: -OS_OK - 4, x2: OS_OK + 4, y1: -T, y2: T },
  { x1: -T, x2: T, y1: -OS_OK - 4, y2: OS_OK + 4 },
];

/** Половина ширины рисунка: дальше вбок ячейки не уходят (телефон узкий). */
const POLUSHIRINA = 186;

/** Ближайшая точка рамки к точке (x; y). */
function blizhayshaya(r: Ramka, x: number, y: number): { x: number; y: number } {
  return { x: Math.max(r.x1, Math.min(x, r.x2)), y: Math.max(r.y1, Math.min(y, r.y2)) };
}

/**
 * Ячейка точки — снаружи окружности, в стороне своей точки. Перебор
 * по сетке: ячейка не задевает окружность, оси, подписи и другие
 * ячейки и не выходит за ширину рисунка. Из свободных мест — то, что
 * ближе к лучу точки и к самой точке.
 */
function postavitYacheyku(k: number, w: number, h: number, zanyato: Ramka[]): Yacheyka {
  const theta = (k * Math.PI) / 12;
  const p = naKruge(theta);
  let luchshe: { ramka: Ramka; cena: number; vynoska: boolean } | null = null;
  for (let cx = -POLUSHIRINA + w / 2; cx <= POLUSHIRINA - w / 2; cx += 2) {
    for (let cy = -260; cy <= 260; cy += 2) {
      const ugol = Math.atan2(-cy, cx);
      let razn = Math.abs(ugol - theta) % (2 * Math.PI);
      if (razn > Math.PI) razn = 2 * Math.PI - razn;
      if (razn > 0.5) continue;
      const ramka = ramkaC(cx, cy, w, h);
      const { min } = rasstoyaniyaRamki(ramka);
      if (min < R + OTSTUP) continue;
      if (zanyato.some((z) => peresekayutsya(z, ramka, 3))) continue;
      const b = blizhayshaya(ramka, p.x, p.y);
      const dal = Math.hypot(b.x - p.x, b.y - p.y);
      const cena = dal + razn * 90;
      if (luchshe === null || cena < luchshe.cena) {
        luchshe = { ramka, cena, vynoska: dal > OTSTUP + 10 };
      }
    }
  }
  if (luchshe === null) throw new Error(`Нет места для ячейки точки ${k}`);
  zanyato.push(luchshe.ramka);
  return { k, x0: p.x, y0: p.y, ramka: luchshe.ramka, vynoska: luchshe.vynoska };
}

function f(x: number): string {
  return (Math.round(x * 100) / 100).toString();
}

const kesh = new Map<string, GeomOk>();

/** Геометрия окружности режима: ячейки, подписи осей, стрелка обхода. */
export function geomOkruzhnosti(rezhim: Rezhim, e: 1 | 2): GeomOk {
  const klyuch = `${rezhim}:${e}`;
  const gotovo = kesh.get(klyuch);
  if (gotovo !== undefined) return gotovo;
  const { w, h } = razmerYacheyki(e);
  const zanyato: Ramka[] = [...OSI];
  /* Подписи — внутри окружности: снаружи место отдано ячейкам.
     Над осью у начала — «(1; 0)» и стрелка обхода, под осью — cos. */
  const podpisi: PodpisOk[] = [
    { tex: '(1;\\,0)', x: 73, y: -13, ramka: ramkaC(73, -13, 40, 18) },
    { tex: '\\cos', x: 75, y: 14, ramka: ramkaC(75, 14, 32, 18) },
    { tex: '\\sin', x: -19, y: -82, ramka: ramkaC(-19, -82, 30, 18) },
  ];
  zanyato.push(...podpisi.map((p) => p.ramka));
  const tochki = rezhimInfo(rezhim).tochki;
  const sem = (k: number) => (k % 6 === 0 ? 0 : k % 3 === 0 ? 2 : 1);
  const poryadok = [...tochki].sort((a, b) => sem(a) - sem(b) || a - b);
  const yacheyki = poryadok
    .map((k) => postavitYacheyku(k, w, h, zanyato))
    .sort((a, b) => a.k - b.k);
  /* Стрелка обхода против часовой: дуга внутри окружности у начала. */
  const rs = R - 40;
  const a1 = naKruge(0.42, rs);
  const a2 = naKruge(0.9, rs);
  const duga = `M${f(a1.x)} ${f(a1.y)}A${rs} ${rs} 0 0 0 ${f(a2.x)} ${f(a2.y)}`;
  const tk = 0.98;
  const tip = naKruge(tk, rs);
  const tx = -Math.sin(tk);
  const ty = -Math.cos(tk);
  const nx = Math.cos(tk);
  const ny = -Math.sin(tk);
  const L = 9;
  const W = 5;
  const base = { x: tip.x - tx * L, y: tip.y - ty * L };
  const konec = `M${f(tip.x)} ${f(tip.y)}L${f(base.x + nx * W)} ${f(base.y + ny * W)}L${f(base.x - nx * W)} ${f(base.y - ny * W)}Z`;

  let x1 = -OS_OK - 12;
  let x2 = OS_OK + 12;
  let y1 = -OS_OK - 12;
  let y2 = OS_OK + 12;
  for (const r of yacheyki.map((y) => y.ramka)) {
    x1 = Math.min(x1, r.x1 - 4);
    x2 = Math.max(x2, r.x2 + 4);
    y1 = Math.min(y1, r.y1 - 4);
    y2 = Math.max(y2, r.y2 + 4);
  }
  /* Рисунок симметричен по ширине: окружность — по центру экрана. */
  const sx = Math.max(-x1, x2);
  const geom: GeomOk = {
    vb: { x: -sx, y: y1, w: 2 * sx, h: y2 - y1 },
    yacheyki,
    podpisi,
    strelka: { duga, konec },
  };
  kesh.set(klyuch, geom);
  return geom;
}

/**
 * Дуга от начальной точки к точке угла для разбора: против часовой
 * для положительного угла, по часовой — для отрицательного. Полные
 * обороты не рисуются: дуга показывает только остаток.
 */
export function dugaUgla(u: UgolOk): { d: string; dlina: number } | null {
  const k = tochkaUgla(u);
  if (k === 0) return null;
  const theta = (k * Math.PI) / 12;
  const plyus = u.n > 0;
  const dl = plyus ? theta : 2 * Math.PI - theta;
  const p1 = naKruge(0);
  const p2 = naKruge(theta);
  const large = dl > Math.PI ? 1 : 0;
  const sweep = plyus ? 0 : 1;
  return {
    d: `M${f(p1.x)} ${f(p1.y)}A${R} ${R} 0 ${large} ${sweep} ${f(p2.x)} ${f(p2.y)}`,
    dlina: dl * R,
  };
}

/** Описание окружности для экранного диктора — словами. */
export function opisanieOk(rezhim: Rezhim): string {
  const n = rezhimInfo(rezhim).tochki.length;
  return `Единичная окружность с осями косинусов и синусов, отмечено точек: ${n}. Возле каждой точки — ячейка для карточки с углом.`;
}
