/**
 * «Распад изотопа» — живая иллюстрация теории №9 (прикладные задачи,
 * раздел «Показательные и логарифмические зависимости»):
 * components/tasks/zadanie10/raspad. Чистая модель без React: масса,
 * ядра в пробирке, ход времени, разметка сцены. Её же проверяет
 * scripts/check-raspad-10.mjs.
 *
 * Масса m(t) = 16 · 2^(−t/7) (задача ФИПИ: m₀ = 16 мг, T = 7 мин).
 * В пробирке 64 ядра по 0,25 мг. Время жизни каждого — квантиль закона
 * распада, поэтому через k периодов живых ядер ровно 64 / 2^k: картинка
 * сходится с формулой точно, а порядок распада выглядит случайным.
 */

export const M0 = 16;
export const PERIOD = 7;
export const T_MAX = 35;
export const PERIODOV = T_MAX / PERIOD;

/** Целевые массы вопроса «через сколько минут масса будет …», мг. */
export const CELI = [8, 4, 2, 1, 0.5] as const;
export const CEL_DEFAULT = 1;

export function m(t: number): number {
  return M0 * 2 ** (-t / PERIOD);
}

/** Сколько периодов до массы `cel` и через сколько минут. */
export function otvet(cel: number): { k: number; t: number; raz: number } {
  const k = Math.round(Math.log2(M0 / cel));
  return { k, t: k * PERIOD, raz: 2 ** k };
}

/* ── Ядра ───────────────────────────────────────────────────────── */

export const YADER = 64;
export const MG_NA_YADRO = M0 / YADER;

export interface Yadro {
  /** Номер места в пробирке (по строкам снизу вверх). */
  n: number;
  /** Момент распада, мин. */
  zhizn: number;
  /** Сдвиг фазы дрожания. */
  faza: number;
}

/** Детерминированный генератор (mulberry32): ядра одинаковы на сервере и в браузере. */
function sluchaynoe(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Ядра: времена жизни — квантили (i + ½)/64 закона распада,
 * перемешанные по местам. Через kT живы ровно 64 / 2^k.
 */
export function yadra(): Yadro[] {
  const rnd = sluchaynoe(20271);
  const zhizni = Array.from(
    { length: YADER },
    (_, i) => -PERIOD * Math.log2(1 - (i + 0.5) / YADER),
  );
  for (let i = zhizni.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = zhizni[i] as number;
    zhizni[i] = zhizni[j] as number;
    zhizni[j] = tmp;
  }
  return zhizni.map((zhizn, i) => ({
    n: i,
    zhizn,
    faza: rnd() * Math.PI * 2,
  }));
}

export function zhivyh(ya: Yadro[], t: number): number {
  return ya.filter((y) => y.zhizn > t + 1e-9).length;
}

/* ── Числа по-русски ────────────────────────────────────────────── */

function kruglo(x: number, znakov: number): number {
  const k = 10 ** znakov;
  return Math.round(x * k) / k;
}

export function ru(x: number, znakov = 2): string {
  return String(kruglo(x, znakov)).replace('.', ',').replace('-', '−');
}

export function ruTex(x: number, znakov = 2): string {
  return ru(x, znakov).replace(',', '{,}').replace('−', '-');
}

/** «раз» после числа: 1 раз, 2 раза, 5 раз. */
export function raz(n: number): string {
  const d = n % 10;
  const s = n % 100;
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return 'раза';
  return 'раз';
}

/** Время для подписей — до 0,1 мин. */
export function tPodpis(t: number): number {
  return kruglo(t, 1);
}

/* ── Проигрывание ───────────────────────────────────────────────── */

/** Секунд показа на одну минуту распада при ×1. */
export const SEK_NA_MIN = 0.32;
/** Пауза-«снимок» на каждом периоде полураспада, с при ×1. */
export const SEK_SNIMOK = 1.4;
const RAZGON = 1.2;
const MIN_DOLYA = 0.14;

export function dolyaSkorosti(t: number, start: number, stop: number): number {
  const razgon = Math.sqrt(Math.max(0, t - start) / RAZGON) + MIN_DOLYA;
  const tormoz = Math.sqrt(Math.max(0, stop - t) / RAZGON) + MIN_DOLYA;
  return Math.min(1, razgon, tormoz);
}

/** Следующая остановка — ближайший конец периода впереди (7, 14, …), последняя — 35 мин. */
export function sleduyushayaOstanovka(t: number): number {
  const k = Math.floor(t / PERIOD + 1e-9) + 1;
  return Math.min(T_MAX, k * PERIOD);
}

export function shagVremeni(
  dtSek: number,
  skorost: number,
  t: number,
  start: number,
  stop: number,
): number {
  const polnyy = (dtSek * skorost) / SEK_NA_MIN;
  return Math.min(stop, t + polnyy * dolyaSkorosti(t, start, stop));
}

/* ── Разметка сцены, px ─────────────────────────────────────────── */

export interface Razmetka {
  W: number;
  H: number;
  uzkaya: boolean;
  pole: number;
  /** Пикселей на миллиграмм — общий для столбика массы и графика. */
  pxMg: number;
  yNol: number;
  /** Пробирка: столбцов ядер, шаг сетки, левый край, ширина, верх и низ. */
  kolonok: number;
  shag: number;
  px0: number;
  pw: number;
  py0: number;
  py1: number;
  /** Столбик массы: x середины. */
  xStolbik: number;
  xRazdel: number;
  gx0: number;
  gx1: number;
  /** До скольких минут тянется ось t (с запасом справа под подпись). */
  tOs: number;
  yDeleniya: number;
  yOtvet: number;
}

export function razmetka(W: number): Razmetka {
  const uzkaya = W < 560;
  const pole = uzkaya ? 8 : 16;
  const H = uzkaya ? 320 : 360;
  const yNol = H - (uzkaya ? 58 : 62);
  const verh = 30;
  const pxMg = (yNol - verh) / M0;
  /* Пробирка: на компьютере 8 × 8 ядер, на телефоне 4 × 16 — узкая и высокая. */
  const kolonok = uzkaya ? 4 : 8;
  const px0 = pole + (uzkaya ? 6 : 14);
  let shag: number;
  let pw: number;
  if (uzkaya) {
    shag = Math.min(12.5, (yNol - verh - 30) / (YADER / kolonok));
    pw = shag * kolonok + 12;
  } else {
    const shirinaPaneli = Math.min(260, Math.max(200, W * 0.29));
    pw = pole + shirinaPaneli - 18 - 18 - px0;
    shag = (pw - 12) / kolonok;
  }
  const xStolbik = px0 + pw + 18;
  const xRazdel = xStolbik + (uzkaya ? 12 : 18);
  const py1 = yNol;
  const py0 = py1 - (shag * (YADER / kolonok) + 22);
  const gx0 = xRazdel + (uzkaya ? 26 : 34);
  /* Подпись оси t: на компьютере — справа от стрелки, на телефоне — буква над ней. */
  const gx1 = W - pole - (uzkaya ? 14 : 60);
  return {
    W,
    H,
    uzkaya,
    pole,
    pxMg,
    yNol,
    kolonok,
    shag,
    px0,
    pw,
    py0,
    py1,
    xStolbik,
    xRazdel,
    gx0,
    gx1,
    tOs: uzkaya ? 37 : T_MAX,
    yDeleniya: yNol + 18,
    yOtvet: yNol + 42,
  };
}

export function yM(r: Razmetka, mg: number): number {
  return r.yNol - mg * r.pxMg;
}

export function xT(r: Razmetka, t: number): number {
  return r.gx0 + ((r.gx1 - r.gx0) * t) / r.tOs;
}

/** Центр ядра в пробирке (без дрожания) и радиус. */
export function mestoYadra(r: Razmetka, y: Yadro): { x: number; y: number; rad: number } {
  const { shag, kolonok } = r;
  const niz = r.py1 - 10;
  return {
    x: r.px0 + 6 + shag * ((y.n % kolonok) + 0.5),
    y: niz - shag * (Math.floor(y.n / kolonok) + 0.5),
    rad: Math.max(3, shag * 0.3),
  };
}

export function prizhat(c: number, w: number, lo: number, hi: number): number {
  return Math.min(Math.max(c, lo + w / 2), hi - w / 2);
}

export function shirinaPriblizitelno(text: string, px: number): number {
  return text.length * px * 0.58;
}
