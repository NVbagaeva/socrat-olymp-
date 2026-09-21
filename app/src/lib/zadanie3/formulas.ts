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
import { nabratVykladku, type AtomVykladki } from '@/lib/tex';
import { SHPARGALKI, type SheetItem } from '@/content/shpargalki';

/**
 * Ключ формулы в наборе. В ключ входит и режим набора: одна и та же
 * запись в строке и отдельной строкой набирается по-разному —
 * у отдельной строки дроби и корни полного размера.
 */
export function formulaKey(tex: string, display: boolean): string {
  return `${display ? 'строкой' : 'в строке'}:${tex}`;
}

/** Все формулы пунктов с их режимом набора, без повторов. */
export function formulasOf(items: readonly SheetItem[]): { tex: string; display: boolean }[] {
  const seen = new Map<string, { tex: string; display: boolean }>();
  items.forEach((item) =>
    item.pieces.forEach((piece) => {
      if (piece.kind === 'текст') {
        return;
      }
      const display = piece.kind === 'формула-строкой';
      seen.set(formulaKey(piece.value, display), { tex: piece.value, display });
    }),
  );
  return [...seen.values()];
}

/** Свёрстанные формулы пунктов: ключ — режим и запись в TeX. */
export function renderFormulas(items: readonly SheetItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  formulasOf(items).forEach(({ tex, display }) => {
    try {
      out[formulaKey(tex, display)] = katex.renderToString(tex, {
        throwOnError: true,
        displayMode: display,
      });
    } catch (error) {
      throw new Error(`Формула не набирается KaTeX: ${tex}\n${String(error)}`);
    }
  });
  return out;
}

/**
 * Блочные формулы пунктов выкладкой: атомы со знаками между ними.
 *
 * Из них браузер собирает строки по ширине колонки — тем же правилом
 * тетради, что и разборы задач (components/…/VykladkaKlient). Раньше
 * такая формула уезжала вбок в невидимую прокрутку и на телефоне
 * выглядела обрезанной.
 *
 * Строчные формулы сюда не идут: они стоят внутри предложения и
 * рвать их по «=» посреди фразы незачем.
 *
 * Набор выключной: дроби и индексы того же размера, что у формулы
 * отдельной строкой, которую выкладка заменила, — от переноса формула
 * не мельчает.
 */
export function renderVykladki(items: readonly SheetItem[]): Record<string, AtomVykladki[][]> {
  const out: Record<string, AtomVykladki[][]> = {};
  items.forEach((item) =>
    item.pieces.forEach((piece) => {
      if (piece.kind !== 'формула-строкой') {
        return;
      }
      out[piece.value] = nabratVykladku(piece.value, true, true);
    }),
  );
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
