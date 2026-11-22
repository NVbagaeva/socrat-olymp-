/**
 * Подписи точек живой схемы: буква ставится туда, где она не касается
 * ни линий, ни окружностей, ни дуг углов, ни чужих точек и подписей.
 *
 * Работает в пикселях экрана, поэтому при повороте чертежа буквы
 * остаются прямыми и заново находят себе место. Правило то же, что в
 * движке №1 (lib/planimetriya/kollizii.ts), но облегчённое: кадр
 * пересчитывается при каждом движении пальца, перебор должен
 * укладываться в доли миллисекунды.
 *
 * Желаемое направление — середина самого широкого «просвета» между
 * линиями, выходящими из точки: буква встаёт снаружи угла, а не
 * внутрь него. Кандидаты — 24 направления и пять отступов; штраф за
 * касание огромный, за удаление от точки и от желаемого направления —
 * небольшой.
 *
 * Выноска — как в движке №1: если рядом с точкой чистого места нет,
 * буква отходит дальше (28–48 px) и соединяется с точкой тонкой
 * линией. Выноска не должна задевать чужие подписи и точки; линии
 * чертежа она пересекать может, но чем меньше, тем лучше.
 */

import type { T2 } from './tipy';

export interface Prepyatstviya {
  otrezki: [T2, T2][];
  /** Центр и радиус. */
  okruzhnosti: [T2, number][];
  tochki: T2[];
}

/** Зазор подписи до препятствий, px. */
export const ZAZOR = 2;
/**
 * Раскладка держит чуть больший зазор: координаты на экране округляются
 * до сотых, и буква, поставленная ровно на зазор, после округления
 * касалась бы линии.
 */
const ZAZOR_RASKLADKI = ZAZOR + 0.05;
const OTSTUPY = [5, 8, 12, 17, 23] as const;
const NAPRAVLENIY = 24;
/** Для выноски направлений больше: в тесноте чистое место бывает узким. */
const NAPRAVLENIY_VYNOSKI = 48;
/** Отступы подписи с выноской, px. */
const OTSTUPY_VYNOSKI = [28, 36, 48, 64, 80] as const;
/** Выноска начинается на таком расстоянии от точки, px. */
const OT_TOCHKI = 4;

/**
 * Буквы вершин — KaTeX_Math полужирным курсивом (тема чертежа). Доли
 * кегля по замеру рамки текста в Chromium: ширина знака (совпадает с
 * метриками KaTeX) и свес курсива вправо за неё. Сверка с браузером —
 * scripts/check-chertezhi-18.mjs --brauzer.
 */
const SHIRINA_BUKVY: Readonly<Record<string, number>> = {
  A: 0.86,
  B: 0.86,
  C: 0.82,
  D: 0.94,
  E: 0.82,
  F: 0.68,
  G: 0.88,
  H: 0.98,
  I: 0.52,
  J: 0.64,
  K: 0.98,
  L: 0.76,
  M: 1.14,
  N: 0.96,
  O: 0.84,
  P: 0.72,
  Q: 0.86,
  R: 0.88,
  S: 0.7,
  T: 0.64,
  U: 0.8,
  V: 0.68,
  W: 1.1,
  X: 0.94,
  Y: 0.68,
  Z: 0.78,
};
const SVES_BUKVY: Readonly<Record<string, number>> = {
  B: 0.03,
  C: 0.08,
  D: 0.01,
  E: 0.03,
  F: 0.16,
  G: 0.01,
  H: 0.07,
  I: 0.06,
  J: 0.1,
  K: 0.08,
  M: 0.12,
  N: 0.1,
  P: 0.17,
  R: 0.02,
  S: 0.04,
  T: 0.15,
  U: 0.09,
  V: 0.22,
  W: 0.11,
  X: 0.06,
  Y: 0.22,
  Z: 0.07,
};

export interface Gabarit {
  /** Полуширина и полувысота прямоугольника буквы. */
  hw: number;
  hh: number;
  /**
   * На сколько px центр прямоугольника правее точки привязки текста
   * (text-anchor: middle): свес курсива. Текст рисуется в x − sdvig.
   */
  sdvig: number;
}

export function gabaritBukvy(imya: string, kegl: number): Gabarit {
  const [bukva = '', indeks] = imya.split('_');
  const shirina = SHIRINA_BUKVY[bukva] ?? 0.86;
  /* С индексом свес уходит под индекс — рамка симметрична. */
  if (indeks !== undefined)
    return { hw: (kegl * (shirina + indeks.length * 0.42)) / 2, hh: kegl * 0.42, sdvig: 0 };
  const sves = SVES_BUKVY[bukva] ?? 0.1;
  return { hw: (kegl * (shirina + sves)) / 2, hh: kegl * 0.42, sdvig: (kegl * sves) / 2 };
}

type Pryamougolnik = readonly [number, number, number, number];

function otrezokVPryamougolnike(a: T2, b: T2, r: Pryamougolnik): boolean {
  /* Лян — Барски: отсечение отрезка прямоугольником. */
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0] - r[0], r[2] - a[0], a[1] - r[1], r[3] - a[1]];
  for (let i = 0; i < 4; i += 1) {
    const pi = p[i]!;
    const qi = q[i]!;
    if (Math.abs(pi) < 1e-12) {
      if (qi < 0) return false;
    } else {
      const t = qi / pi;
      if (pi < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

function okruzhnostVPryamougolnike(c: T2, rad: number, r: Pryamougolnik): boolean {
  const nx = Math.max(r[0], Math.min(c[0], r[2]));
  const ny = Math.max(r[1], Math.min(c[1], r[3]));
  const blizh = Math.hypot(c[0] - nx, c[1] - ny);
  const dal = Math.max(
    Math.hypot(c[0] - r[0], c[1] - r[1]),
    Math.hypot(c[0] - r[2], c[1] - r[1]),
    Math.hypot(c[0] - r[0], c[1] - r[3]),
    Math.hypot(c[0] - r[2], c[1] - r[3]),
  );
  return blizh <= rad && rad <= dal;
}

function peresekayutsya(a: Pryamougolnik, b: Pryamougolnik): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

/** Сколько препятствий задевает прямоугольник (с зазором). */
export function kasaniya(
  r: Pryamougolnik,
  prep: Prepyatstviya,
  zanyato: readonly Pryamougolnik[],
  svoya: T2 | null,
  zazor: number = ZAZOR,
): number {
  const z: Pryamougolnik = [r[0] - zazor, r[1] - zazor, r[2] + zazor, r[3] + zazor];
  let n = 0;
  for (const [a, b] of prep.otrezki) if (otrezokVPryamougolnike(a, b, z)) n += 1;
  for (const [c, rad] of prep.okruzhnosti) if (okruzhnostVPryamougolnike(c, rad, z)) n += 1;
  for (const p of prep.tochki) {
    if (svoya !== null && p[0] === svoya[0] && p[1] === svoya[1]) continue;
    if (p[0] > z[0] - 3 && p[0] < z[2] + 3 && p[1] > z[1] - 3 && p[1] < z[3] + 3) n += 1;
  }
  for (const q of zanyato) if (peresekayutsya(z, q)) n += 1;
  return n;
}

/** Направления линий, выходящих из точки p (радианы, экран). */
function luchi(p: T2, prep: Prepyatstviya): number[] {
  const out: number[] = [];
  const blizko = 1.5;
  for (const [a, b] of prep.otrezki) {
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const lab = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (lab < 3) continue;
    if (la < blizko) out.push(Math.atan2(b[1] - p[1], b[0] - p[0]));
    else if (lb < blizko) out.push(Math.atan2(a[1] - p[1], a[0] - p[0]));
    else if (Math.abs(la + lb - lab) < 0.05) {
      /* Точка внутри отрезка: линия уходит в обе стороны. */
      out.push(Math.atan2(a[1] - p[1], a[0] - p[0]), Math.atan2(b[1] - p[1], b[0] - p[0]));
    }
  }
  for (const [c, rad] of prep.okruzhnosti) {
    const d = Math.hypot(p[0] - c[0], p[1] - c[1]);
    if (Math.abs(d - rad) < blizko) {
      const k = Math.atan2(p[1] - c[1], p[0] - c[0]);
      out.push(k + Math.PI / 2, k - Math.PI / 2);
    }
  }
  return out;
}

function zhelaemoe(p: T2, prep: Prepyatstviya, centr: T2): number {
  const l = luchi(p, prep)
    .map((x) => (x + 2 * Math.PI) % (2 * Math.PI))
    .sort((a, b) => a - b);
  if (l.length === 0) return Math.atan2(p[1] - centr[1], p[0] - centr[0]);
  let luchshiy = 0;
  let shirina = -1;
  for (let i = 0; i < l.length; i += 1) {
    const a = l[i]!;
    const b = i + 1 < l.length ? l[i + 1]! : l[0]! + 2 * Math.PI;
    if (b - a > shirina) {
      shirina = b - a;
      luchshiy = (a + b) / 2;
    }
  }
  return luchshiy;
}

function raznostUglov(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

/** Пересекаются ли отрезки ab и cd (касание концами не считается). */
function otrezkiPeresekayutsya(a: T2, b: T2, c: T2, d: T2): boolean {
  const o = (p: T2, q: T2, r: T2) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}

/** Конец выноски: точка на краю прямоугольника подписи по пути от p к его центру. */
function konecVynoski(p: T2, pr: Pryamougolnik): T2 {
  const c: T2 = [(pr[0] + pr[2]) / 2, (pr[1] + pr[3]) / 2];
  const dx = c[0] - p[0];
  const dy = c[1] - p[1];
  const hw = (pr[2] - pr[0]) / 2 + 1;
  const hh = (pr[3] - pr[1]) / 2 + 1;
  /* Доля пути от центра обратно к p, на которой луч выходит из прямоугольника. */
  const k = Math.min(
    Math.abs(dx) < 1e-9 ? Infinity : hw / Math.abs(dx),
    Math.abs(dy) < 1e-9 ? Infinity : hh / Math.abs(dy),
  );
  return [c[0] - dx * k, c[1] - dy * k];
}

/** Место подписи; `vynoska` — от точки до края буквы, если буква отнесена. */
export interface MestoPodpisi {
  c: T2;
  vynoska: readonly [T2, T2] | null;
  /** Чистого места не нашлось ни рядом, ни с выноской: буква касается чего-то. */
  tesno?: boolean;
}

/**
 * Места подписей: центр каждой буквы в пикселях экрана. Точки, у
 * которых сходится больше линий, расставляются первыми — им теснее.
 */
export function razmestitPodpisi(
  tochki: readonly { p: T2; imya: string }[],
  prep: Prepyatstviya,
  W: number,
  H: number,
  kegl: number,
): T2[] {
  return razmestitSVynoskami(tochki, prep, W, H, kegl).map((m) => m.c);
}

/** То же, с выносками для букв, которым рядом с точкой нет чистого места. */
export function razmestitSVynoskami(
  tochki: readonly { p: T2; imya: string }[],
  prep: Prepyatstviya,
  W: number,
  H: number,
  kegl: number,
): MestoPodpisi[] {
  const centr: T2 = [W / 2, H / 2];
  const poryadok = tochki
    .map((t, i) => ({ i, n: luchi(t.p, prep).length }))
    .sort((a, b) => b.n - a.n)
    .map((x) => x.i);
  const mesta: MestoPodpisi[] = tochki.map((t) => ({ c: t.p, vynoska: null }));
  const zanyato: Pryamougolnik[] = [];
  /* Выноски уже поставленных букв — препятствие следующим. */
  const vynoski: [T2, T2][] = [];
  for (const i of poryadok) {
    const { p, imya } = tochki[i]!;
    const g = gabaritBukvy(imya, kegl);
    const zhel = zhelaemoe(p, prep, centr);
    const prepI: Prepyatstviya = { ...prep, otrezki: [...prep.otrezki, ...vynoski] };
    let luchshee: T2 = [p[0] + g.hw + 4, p[1] - g.hh - 4];
    let luchshiyShtraf = Infinity;
    let luchshiyPr: Pryamougolnik | null = null;
    let luchshayaVynoska: [T2, T2] | null = null;
    const kandidat = (ug: number, ots: number): { c: T2; pr: Pryamougolnik; vne: number } => {
      const dx = Math.cos(ug);
      const dy = Math.sin(ug);
      const vynos = ots + Math.abs(dx) * g.hw + Math.abs(dy) * g.hh;
      const c: T2 = [p[0] + dx * vynos, p[1] + dy * vynos];
      const pr: Pryamougolnik = [c[0] - g.hw, c[1] - g.hh, c[0] + g.hw, c[1] + g.hh];
      const vne = pr[0] < 1 || pr[1] < 1 || pr[2] > W - 1 || pr[3] > H - 1 ? 1 : 0;
      return { c, pr, vne };
    };
    for (const ots of OTSTUPY) {
      for (let k = 0; k < NAPRAVLENIY; k += 1) {
        const ug = zhel + (k * 2 * Math.PI) / NAPRAVLENIY;
        const { c, pr, vne } = kandidat(ug, ots);
        const shtraf =
          1e4 * kasaniya(pr, prepI, zanyato, p, ZAZOR_RASKLADKI) +
          3e3 * vne +
          ots * 1.6 +
          raznostUglov(ug, zhel) * 9;
        if (shtraf < luchshiyShtraf) {
          luchshiyShtraf = shtraf;
          luchshee = c;
          luchshiyPr = pr;
        }
      }
      /* Нашлось чистое место на этом отступе — дальше не уходим. */
      if (luchshiyShtraf < 1e3) break;
    }
    /* Рядом тесно — буква с выноской, если так она встаёт чисто. */
    if (luchshiyShtraf >= 1e3) {
      let shtrafV = Infinity;
      for (const ots of OTSTUPY_VYNOSKI) {
        for (let k = 0; k < NAPRAVLENIY_VYNOSKI; k += 1) {
          const ug = zhel + (k * 2 * Math.PI) / NAPRAVLENIY_VYNOSKI;
          const { c, pr, vne } = kandidat(ug, ots);
          if (vne === 1 || kasaniya(pr, prepI, zanyato, p, ZAZOR_RASKLADKI) > 0) continue;
          const nachalo: T2 = [p[0] + Math.cos(ug) * OT_TOCHKI, p[1] + Math.sin(ug) * OT_TOCHKI];
          const konec = konecVynoski(p, pr);
          /* Выноска не задевает чужие подписи и точки. */
          const lin: Pryamougolnik = [
            Math.min(nachalo[0], konec[0]),
            Math.min(nachalo[1], konec[1]),
            Math.max(nachalo[0], konec[0]),
            Math.max(nachalo[1], konec[1]),
          ];
          if (
            zanyato.some((q) =>
              otrezokVPryamougolnike(nachalo, konec, [q[0] - 2, q[1] - 2, q[2] + 2, q[3] + 2]),
            )
          )
            continue;
          const chuzhie = prep.tochki.some(
            (q) =>
              (q[0] !== p[0] || q[1] !== p[1]) &&
              q[0] > lin[0] - 3 &&
              q[0] < lin[2] + 3 &&
              q[1] > lin[1] - 3 &&
              q[1] < lin[3] + 3 &&
              otrezokVPryamougolnike(nachalo, konec, [q[0] - 3, q[1] - 3, q[0] + 3, q[1] + 3]),
          );
          if (chuzhie) continue;
          const perecheniy = prepI.otrezki.filter(([a, b]) =>
            otrezkiPeresekayutsya(nachalo, konec, a, b),
          ).length;
          const shtraf = perecheniy * 40 + ots * 1.6 + raznostUglov(ug, zhel) * 9;
          if (shtraf < shtrafV) {
            shtrafV = shtraf;
            luchshee = c;
            luchshiyPr = pr;
            luchshayaVynoska = [nachalo, konec];
          }
        }
        if (luchshayaVynoska !== null) break;
      }
    }
    mesta[i] = {
      c: luchshee,
      vynoska: luchshayaVynoska,
      tesno: luchshiyShtraf >= 1e3 && luchshayaVynoska === null,
    };
    if (luchshiyPr !== null) zanyato.push(luchshiyPr);
    if (luchshayaVynoska !== null) vynoski.push(luchshayaVynoska);
  }
  return mesta;
}
