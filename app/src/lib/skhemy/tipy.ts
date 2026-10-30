/**
 * Движок живых схем (lib/skhemy): типы.
 *
 * Схема — функция от положений подвижных точек: postroit(t) отдаёт
 * кадр — список элементов в координатах модели (y вверх). Экранную
 * раскладку (поворот, отражение, масштаб, подписи) делает ekran.ts,
 * рисует — components/skhemy/ChertezhSkhemy.tsx.
 *
 * Элемент знает свои группы подсветки и шаг построения. Так один и
 * тот же кадр служит и чертежу «как есть», и пошаговой сборке, и
 * подсветке следствий и шагов доказательства.
 */

import type { T2 } from '@/lib/planimetriya/types';

export type { T2 };

export type Tochki = Readonly<Record<string, T2>>;

/**
 * Цвет подсветки: a — основной синий, b — акцент (терракота),
 * c — третий (бирюзовый). Подобные треугольники — a и b, равные
 * углы — одним цветом и одинаковым числом дуг.
 */
export type Cvet = 'a' | 'b' | 'c';

/** linia — сплошная; punktir — вспомогательное построение; prodolzhenie — продолжение стороны. */
export type StilLinii = 'linia' | 'punktir' | 'prodolzhenie';

interface Obshchee {
  /** Ключ элемента: стабилен между кадрами, иначе анимации перезапускаются. */
  id: string;
  /** Группы подсветки: элемент «загорается», когда горит одна из них. */
  gruppy?: readonly string[];
  /** Шаг пошагового построения, на котором элемент появляется (0 — сразу). */
  shag?: number;
  /** Виден только при подсветке своей группы: заливки, вспомогательные окружности, дуги равных углов. */
  skrytyy?: boolean;
  /**
   * Цвет при подсветке. Не задан — основной синий. Словарь — свой
   * цвет у каждой группы: сторона AB синяя в одной паре подобных
   * треугольников и терракотовая в другой.
   */
  cvet?: Cvet | Readonly<Record<string, Cvet>>;
}

export type Element =
  | (Obshchee & {
      vid: 'otrezok';
      a: T2;
      b: T2;
      stil?: StilLinii;
      /** Засечки равных отрезков. */
      shtrihi?: 1 | 2 | 3;
    })
  | (Obshchee & { vid: 'okruzhnost'; c: T2; r: number; stil?: StilLinii })
  | (Obshchee & { vid: 'mnogougolnik'; tochki: readonly T2[] })
  | (Obshchee & {
      vid: 'ugol';
      a: T2;
      v: T2;
      b: T2;
      /** Число дуг: равные углы — одинаковое число. */
      dugi?: 1 | 2 | 3;
      /** Значок прямого угла — квадратик. */
      pryamoy?: boolean;
    })
  | (Obshchee & {
      vid: 'tochka';
      p: T2;
      /** Подпись: заглавная латинская буква, индекс через «_»: A_1. */
      imya?: string;
    });

export type VidElementa = Element['vid'];

/** Кадр схемы: элементы и пояснения к нынешнему положению. */
export interface Kadr {
  elementy: Element[];
  /** Особый случай положения (тупой угол, вырождение), TeX в долларах. Нет — null. */
  zametka: string | null;
  /** Пересчитанные величины под чертежом, TeX в долларах. */
  znacheniya: string[];
}

/** Живая схема: начальное положение, подвижные точки, ограничения, построение. */
export interface ZhivayaSkhema {
  id: string;
  nachalo: Tochki;
  podvizhnye: readonly string[];
  /** Поле, за которое подвижные точки не выходят (minx, miny, maxx, maxy). */
  pole: readonly [number, number, number, number];
  postroit: (t: Tochki) => Kadr;
  /** Новое положение точки или null — так тянуть нельзя (фигура выродится). */
  ogranichit: (imya: string, p: T2, t: Tochki) => T2 | null;
  /** Случайное невырожденное положение — карточки и «Случайное положение». */
  sluchaynaya: (rnd: () => number) => Tochki;
  /** Подписи шагов пошагового построения: индекс — номер шага. */
  shagi: readonly string[];
}

/** Вид чертежа: поворот (градусы, против часовой) и отражение (1 — нет, −1 — зеркально). */
export interface Vid {
  ugol: number;
  /** Множитель по x до поворота. Плавный переход 1 → −1 — анимация отражения. */
  otrazhenie: number;
}

export const VID_ISHODNYY: Vid = { ugol: 0, otrazhenie: 1 };

/** Прямоугольник (minx, miny, maxx, maxy). */
export type Ramka = readonly [number, number, number, number];
