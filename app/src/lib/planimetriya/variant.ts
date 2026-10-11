/**
 * Варианты генератора: поворот, отражение и переименование точек.
 *
 * Один и тот же прототип на листе выглядит по-разному: фигура
 * повёрнута и, может быть, отражена, точки названы другими буквами.
 * Буквы меняются согласованно — и на рисунке, и в тексте условия,
 * и в решении (pereimenovat). Поворот ограничен диапазоном сцены:
 * у треугольника основание остаётся «почти горизонтальным», у
 * окружности годится любой угол — читаемость не теряется.
 */

import type { Rng } from '../veroyatnost/generator';
import type { Variant } from './types';

/**
 * Буквы для новых имён. Нет S, P, R, V — ими в условиях обозначают
 * площадь, периметр, радиус и объём; нет I, J, U, W, X, Y, Z, G, Q —
 * их в школьных чертежах почти не бывает или их легко спутать.
 */
export const BUKVY = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'K', 'L', 'M', 'N', 'T'] as const;

/** Буквы, которые не переименовываются: O — центр окружности. */
export const FIKSIROVANNYE = ['O'] as const;

export interface DiapazonVarianta {
  /** Наибольший поворот в обе стороны, градусы. 180 — любой. */
  povorot?: number;
  /** Можно ли отражать фигуру. */
  otrazhenie?: boolean;
  /** Переименовывать ли точки. */
  bukvy?: boolean;
}

/** Случайный вариант для сцены с точками imena. */
export function sluchaynyyVariant(
  rng: Rng,
  imena: readonly string[],
  d: DiapazonVarianta = {},
): Variant {
  const maxPov = d.povorot ?? 20;
  const povorot = maxPov === 0 ? 0 : Math.round((rng.next() * 2 - 1) * maxPov);
  const otrazhenie = d.otrazhenie !== false && rng.next() < 0.5;
  const bukvy: Record<string, string> = {};
  if (d.bukvy !== false) {
    const svoi = imena.filter((n) => !(FIKSIROVANNYE as readonly string[]).includes(n));
    const zanyaty = new Set(imena.filter((n) => (FIKSIROVANNYE as readonly string[]).includes(n)));
    const pul = BUKVY.filter((b) => !zanyaty.has(b));
    /* Простые имена (одна буква) переименовываются; с индексом — оставляются. */
    const prostye = svoi.filter((n) => /^[A-Z]$/.test(n));
    if (pul.length >= prostye.length) {
      const novye = rng.sample(pul, prostye.length);
      prostye.forEach((n, i) => {
        bukvy[n] = novye[i]!;
      });
    }
  }
  return { povorot, otrazhenie, bukvy };
}

/**
 * Согласованная замена букв в тексте условия или решения. Меняются
 * только одиночные латинские заглавные — имена точек; команды TeX
 * (\angle, \Delta, \sqrt) и обычные слова не трогаются. Замена
 * одновременная: A→B и B→A не путаются.
 */
export function pereimenovat(tekst: string, bukvy: Readonly<Record<string, string>>): string {
  return tekst.replace(/\\[a-zA-Z]+|[A-Z]/g, (m) => (m.length === 1 ? (bukvy[m] ?? m) : m));
}

/** Тождественный вариант: без поворота, отражения и переименования. */
export const BEZ_VARIANTA: Variant = { povorot: 0, otrazhenie: false, bukvy: {} };
