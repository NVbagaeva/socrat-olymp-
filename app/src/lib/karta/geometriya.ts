/**
 * Геометрия «Карты ЕГЭ»: контуры островов из content/karta/kontury.json
 * (их пишет tools/karta/obvesti.py) и всё, что из них считается. Все
 * координаты — в системе фона 1586 × 992; от размера картинки не зависят.
 */

import KONTURY from '@/content/karta/kontury.json';

export interface Ramka {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Ostrov {
  no: number;
  /** Контур: путь SVG. */
  d: string;
  /** Центр подписи: самая «глубокая» точка острова. */
  cx: number;
  cy: number;
  /** Расстояние от центра до края. */
  radius: number;
  ramka: Ramka;
}

export const KARTA_W = KONTURY.shirina;
export const KARTA_H = KONTURY.vysota;

function ramkaPuti(d: string): Ramka {
  const chisla = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < chisla.length; i += 2) {
    const x = chisla[i] as number;
    const y = chisla[i + 1] as number;
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const OSTROVA: readonly Ostrov[] = KONTURY.ostrova.map((o) => ({
  no: o.no,
  d: o.d,
  cx: o.centr[0] as number,
  cy: o.centr[1] as number,
  radius: o.radius,
  ramka: ramkaPuti(o.d),
}));

export function ostrov(no: number): Ostrov | undefined {
  return OSTROVA.find((o) => o.no === no);
}

/** Общая рамка нескольких островов с полем вокруг. */
export function ramkaOstrovov(nomera: readonly number[], pole = 0): Ramka {
  const ramki = nomera.flatMap((no) => ostrov(no)?.ramka ?? []);
  if (ramki.length === 0) return { x: 0, y: 0, w: KARTA_W, h: KARTA_H };
  const x0 = Math.min(...ramki.map((r) => r.x)) - pole;
  const y0 = Math.min(...ramki.map((r) => r.y)) - pole;
  const x1 = Math.max(...ramki.map((r) => r.x + r.w)) + pole;
  const y1 = Math.max(...ramki.map((r) => r.y + r.h)) + pole;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const CHAST_1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
export const CHAST_2 = [14, 15, 16, 17, 18, 19, 20] as const;

/** Материк: рамка островов части. */
export function ramkaMaterika(chast: 1 | 2): Ramka {
  return ramkaOstrovov(chast === 1 ? CHAST_1 : CHAST_2, 30);
}

/**
 * Плавная линия через центры островов — «рекомендуемый путь». Кривая
 * идёт через середины отрезков, центры — её опорные точки.
 */
export function putD(nomera: readonly number[]): string {
  const t = nomera.flatMap((no) => {
    const o = ostrov(no);
    return o === undefined ? [] : [[o.cx, o.cy] as const];
  });
  const a = t[0];
  if (a === undefined || t.length < 2) return '';
  let d = `M${a[0]} ${a[1]}`;
  for (let i = 1; i < t.length; i += 1) {
    const p = t[i - 1] as readonly [number, number];
    const q = t[i] as readonly [number, number];
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    d += i === 1 ? `L${mx} ${my}` : `Q${p[0]} ${p[1]} ${mx} ${my}`;
    if (i === t.length - 1) d += `L${q[0]} ${q[1]}`;
  }
  return d;
}

/**
 * Места на карте, которых нет в контурах: таблички частей и надпись в
 * проливе. Подобраны по фону; при новой композиции фона — поправить.
 */
export const MESTA = {
  chast1: { x: 262, y: 318, ugol: -7 },
  chast2: { x: 792, y: 112, ugol: -6 },
  /** Линия надписи «Пролив ЕГЭ» и полоса, по которой пролив нажимается. */
  proliv: { d: 'M852 417 Q990 452 1128 462', polosa: 'M610 402 Q820 400 990 448 T1330 478' },
} as const;
