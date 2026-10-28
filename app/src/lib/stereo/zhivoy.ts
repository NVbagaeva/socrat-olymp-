/**
 * Данные живого чертежа рядом с готовым SVG.
 *
 * Где чертёж приходит готовой строкой SVG («Собрать вариант», варианты
 * повышенной сложности, разборы в HTML), рядом кладётся модель фигуры:
 * модель lib/solid или сценарий lib/chertezh3. На экране такой чертёж
 * оживает — вращается руками (components/stereo/Zhivoy3d.tsx); на
 * печати и без скриптов остаётся тот же SVG.
 */

import type { Scenariy } from '../chertezh3/scenariy';
import type { Model } from '../solid/model';

export type Dannye3d =
  /** Модель lib/solid с выбранным видом (rakurs). */
  | { m: Model }
  /** Сценарий lib/chertezh3; vspom — с вспомогательными построениями (лист учителя). */
  | { sc: Scenariy; vspom?: boolean };

/** Числа — до четырёх знаков: данные не разрастаются. */
export function dannye3dJson(d: Dannye3d): string {
  return JSON.stringify(d, (_k, v: unknown) =>
    typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v,
  );
}

const ATTR = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * SVG в обёртке с данными фигуры — для чертежей внутри готового HTML
 * (решение по пунктам). Обёртку оживляет useOzhivit3d.
 */
export function obernut3d(svg: string, d: Dannye3d): string {
  return `<div class="zh3d" data-zh3d="${ATTR(dannye3dJson(d))}">${svg}</div>`;
}

/* ── Хранение рядом с SVG одной строкой ─────────────────────────── */

const METKA = '<!--zh3d:';

/**
 * Рисунок и данные живого чертежа одной строкой — для хранилищ с одним
 * полем рисунка (работы кабинета): данные — комментарием в конце SVG,
 * на листе и в браузере без скриптов их не видно.
 */
export function svgSDannymi(svg: string, zhivoy: string | undefined): string {
  return zhivoy === undefined || zhivoy === ''
    ? svg
    : `${svg}${METKA}${encodeURIComponent(zhivoy)}-->`;
}

/** Обратно: SVG и данные (если были). */
export function razdelitSvg(stroka: string): { svg: string; zhivoy?: string } {
  const i = stroka.lastIndexOf(METKA);
  if (i < 0 || !stroka.endsWith('-->')) return { svg: stroka };
  try {
    return {
      svg: stroka.slice(0, i),
      zhivoy: decodeURIComponent(stroka.slice(i + METKA.length, -3)),
    };
  } catch {
    return { svg: stroka.slice(0, i) };
  }
}
