/**
 * Вёрстка формул шпаргалок на сборке.
 *
 * Все формулы раздела набираются KaTeX один раз, при сборке, и в
 * браузер уходит готовая разметка. Ошибку в записи формулы здесь
 * ловим громко: throwOnError оставлен включённым, поэтому кривая
 * формула уронит сборку с указанием, какая именно, а не превратится
 * в красную строку на странице ученика.
 */

import { katex } from '@/lib/graph/katex';
import { SHPARGALKI, type SheetItem } from '@/content/shpargalki';

/** Все записи формул пунктов: без повторов. */
export function formulasOf(items: readonly SheetItem[]): string[] {
  const seen = new Set<string>();
  items.forEach((item) =>
    item.pieces.forEach((piece) => {
      if (piece.kind !== 'текст') {
        seen.add(piece.value);
      }
    }),
  );
  return [...seen];
}

/** Свёрстанные формулы пунктов: ключ — запись в TeX. */
export function renderFormulas(items: readonly SheetItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  formulasOf(items).forEach((tex) => {
    try {
      out[tex] = katex.renderToString(tex, { throwOnError: true, displayMode: false });
    } catch (error) {
      throw new Error(`Формула не набирается KaTeX: ${tex}\n${String(error)}`);
    }
  });
  return out;
}

/**
 * Проверка всех шпаргалок сразу. Вызывается на сборке страницы
 * теории: если хоть одна формула любого раздела не набирается,
 * сборка падает, и это видно сразу, а не на глазах у ученика.
 */
export function assertSheetsOk(): void {
  Object.values(SHPARGALKI).forEach((items) => renderFormulas(items));
}
