/**
 * Сценарий чертежа задания №3 — декларативное описание сцены.
 *
 * Сценарий не рисует ничего сам: в нём тело, размеры, имена вершин,
 * ракурс, данные условия и вспомогательные элементы. Проекцию,
 * видимость, раскладку подписей и подсветку считает ядро
 * (lib/stereo) по этому описанию — и для интерактивного чертежа,
 * и для статичного SVG листа.
 *
 * Сценарий — обычный JSON: он уезжает в браузер вместе с условием,
 * поэтому в нём нет ни ответа, ни шагов решения — только то, что
 * видно в условии, и id элементов, на которые ссылается решение.
 *
 * Имена точек — идентификаторы: заглавная буква, цифры индекса,
 * штрихи («A», «A1», «K'»). В TeX они превращаются в «A_1», «K'».
 */

import type { Rakurs } from '@/lib/stereo/proekciya';

export type Tochka3 = readonly [number, number, number];
export type Tochka2 = readonly [number, number];

/** Прямоугольный блок составного многогранника: «+» добавить, «−» вырезать. */
export interface Blok {
  op: '+' | '-';
  /** Угол блока с наименьшими координатами. */
  ot: Tochka3;
  /** Размеры по x, y, z. */
  razmer: Tochka3;
}

/**
 * Тело сцены. Оси: x — вправо (вдоль AB), y — вглубь (вдоль AD),
 * z — вверх. Правильные основания ставятся стороной AB к зрителю.
 */
export type TeloScenariya =
  | { vid: 'kub'; a: number }
  /** ABCDA₁B₁C₁D₁: AB = a, AD = b, AA₁ = c. */
  | { vid: 'parallelepiped'; a: number; b: number; c: number }
  /** Правильная призма: n-угольник со стороной a, высота h. */
  | { vid: 'prizma'; n: 3 | 4 | 6; a: number; h: number }
  /** Прямая призма над произвольным выпуклым основанием (обход против часовой). */
  | { vid: 'pryamaya-prizma'; osnovanie: readonly Tochka2[]; h: number }
  /** Правильная пирамида: n-угольник со стороной a, высота h. */
  | { vid: 'piramida'; n: 3 | 4 | 6; a: number; h: number }
  /** Пирамида над произвольным выпуклым основанием с вершиной в точке. */
  | { vid: 'piramida-proizv'; osnovanie: readonly Tochka2[]; vershina: Tochka3 }
  /** Правильный тетраэдр с ребром a. */
  | { vid: 'tetraedr'; a: number }
  /** Объединение и вычитание прямоугольных блоков: «фигуры из кубиков». */
  | { vid: 'sostavnoy'; bloki: readonly Blok[] };

/** Где стоит дополнительная точка. */
export type Gde =
  | { seredina: readonly [string, string] }
  /** Точка P + t·(Q − P). */
  | { naOtrezke: readonly [string, string, number] }
  /** Центр масс перечисленных точек (центр правильного основания). */
  | { centr: readonly string[] }
  /** Основание перпендикуляра из точки на прямую (2 точки) или плоскость (3). */
  | { proekciya: string; na: readonly string[] }
  | { xyz: Tochka3 };

export type Rol = 'uslovie' | 'vspom';

export interface TochkaScenariya {
  imya: string;
  gde: Gde;
  /**
   * uslovie — точка названа в условии и видна ученику;
   * vspom — появляется только со вспомогательными построениями.
   */
  rol?: Rol;
  /** false — точка служебная (конец подписи), не рисуется и не подписывается. */
  pokazat?: boolean;
}

export type VidElementa =
  | 'otrezok'
  | 'vysota'
  | 'apofema'
  | 'diagonal'
  | 'mediana'
  | 'radius'
  | 'treugolnik'
  | 'mnogougolnik'
  | 'ploskost'
  | 'ugol'
  | 'pryamoy-ugol';

/** Виды-отрезки: ровно две точки. */
export const OTREZKI: readonly VidElementa[] = [
  'otrezok',
  'vysota',
  'apofema',
  'diagonal',
  'mediana',
  'radius',
];
/** Виды-многоугольники: три точки и больше, в одной плоскости. */
export const MNOGOUGOLNIKI: readonly VidElementa[] = ['treugolnik', 'mnogougolnik', 'ploskost'];
/** Углы: три точки, вершина угла — средняя. */
export const UGLY: readonly VidElementa[] = ['ugol', 'pryamoy-ugol'];

export interface Element {
  /** На этот id ссылается шаг решения. */
  id: string;
  vid: VidElementa;
  tochki: readonly string[];
  /**
   * uslovie — элемент назван в условии (искомая диагональ, сечение,
   * прямые угла) и виден ученику; vspom (по умолчанию) — только во
   * вспомогательных построениях и на листе учителя.
   */
  rol?: Rol;
  /** Обозначение в TeX («h», «l», «\\alpha») — не число из ответа. */
  podpis?: string;
}

/** На что ставится подпись данных условия. */
export type Ssylka =
  | { otrezok: readonly [string, string] }
  | { ugol: readonly [string, string, string] }
  | { element: string };

/** Число или величина из условия, подписанная на чертеже. */
export interface Dannoe {
  id: string;
  na: Ssylka;
  /** TeX: «7», «2{,}5», «\\sqrt{12}», «60^\\circ». */
  tekst: string;
}

/** Что из условия сверить с геометрией сцены. */
export type Proverka =
  | { dlina: readonly [string, string]; ravno: number }
  | { ploshchad: readonly string[]; ravno: number }
  | { otnoshenie: readonly [readonly [string, string], readonly [string, string]]; ravno: number }
  | { ugol: readonly [string, string, string]; ravno: number }
  /** Объём тела. */
  | { obem: number };

export interface Scenariy {
  /** «P03-41#3» — прототип и вариант, или своё имя. */
  id: string;
  /** Описание для голосового доступа. */
  alt: string;
  telo: TeloScenariya;
  /**
   * Имена вершин в порядке сборщика тела. null — вершину не
   * подписывать. Без поля — вершины без имён (условие их не называет).
   */
  imena?: readonly (string | null)[];
  rakurs?: Rakurs;
  /**
   * false — имена вершин служат только ссылками и не подписываются:
   * условие вершин не называет («в правильной четырёхугольной пирамиде…»).
   */
  podpisatVershiny?: boolean;
  tochki?: readonly TochkaScenariya[];
  dannye?: readonly Dannoe[];
  elementy?: readonly Element[];
  proverki?: readonly Proverka[];
  /**
   * Размеры тела условные: в условии их нет (любая треугольная
   * призма), сцена выбрала удобные. Проверки размеров тогда только
   * по отношениям.
   */
  uslovnye?: boolean;
}

/* ── Имена ───────────────────────────────────────────────────── */

const IMYA = /^[A-Z][0-9]*'*$/;

export function imyaVerno(imya: string): boolean {
  return IMYA.test(imya);
}

/** «A1» → «A_1», «K'» → «K'», «A12» → «A_{12}». */
export function imyaTex(imya: string): string {
  const m = /^([A-Z])([0-9]*)('*)$/.exec(imya);
  if (m === null) {
    return imya;
  }
  const [, b, idx = '', pr = ''] = m;
  const sub = idx === '' ? '' : idx.length === 1 ? `_${idx}` : `_{${idx}}`;
  return `${b}${pr}${sub}`;
}

/** «AB1» → ["A", "B1"]: имена точек подряд. */
export function razbitImena(s: string): string[] {
  return s.match(/[A-Z][0-9]*'*/g) ?? [];
}

/** Ключ отрезка без учёта порядка концов: «A-B1». */
export function klyuchOtrezka(a: string, b: string): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}
