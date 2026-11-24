/**
 * Иллюстрации карточек «Ключевые методы решения» задания №5: по одной
 * стеклянной картинке на метод, в стиле шапок разделов (синее стекло с
 * тёплыми акцентами, прозрачный фон, без надписей).
 *
 * Исходники — app/assets/zadanie-05/metod-<id>.png (сгенерированы через
 * OpenAI Images, как картинки шапок); готовые WebP и PNG двух ширин
 * собирает scripts/build-shapka.mjs в public/images/zadanie-05/.
 * Размеры — обрезанного кадра (их печатает тот же скрипт): разметка
 * держит место до загрузки.
 *
 * Метода нет в списке — карточка остаётся без картинки.
 */

export interface KartinkaMetoda {
  /** Имя файла без ширины и расширения. */
  imya: string;
  width: number;
  height: number;
}

/** Ширины готовых файлов, px: карточка ~200 px, на экранах 2x — 400. */
export const SHIRINY_KARTINOK_5 = [240, 480] as const;

export const KARTINKI_METODOV_5: Readonly<Record<string, KartinkaMetoda>> = {
  nesovmestnye: { imya: 'metod-nesovmestnye', width: 1019, height: 562 },
  protivopolozhnoe: { imya: 'metod-protivopolozhnoe', width: 922, height: 582 },
  koordinatnaya: { imya: 'metod-koordinatnaya', width: 1152, height: 265 },
  sovmestnye: { imya: 'metod-sovmestnye', width: 929, height: 696 },
  uslovnaya: { imya: 'metod-uslovnaya', width: 1138, height: 602 },
  nezavisimye: { imya: 'metod-nezavisimye', width: 984, height: 606 },
  'hotya-by': { imya: 'metod-hotya-by', width: 950, height: 646 },
  'dva-predmeta': { imya: 'metod-dva-predmeta', width: 634, height: 873 },
  polnaya: { imya: 'metod-polnaya', width: 915, height: 732 },
  'do-uspeha': { imya: 'metod-do-uspeha', width: 997, height: 688 },
};

export function kartinkaMetoda5(id: string): KartinkaMetoda | undefined {
  return KARTINKI_METODOV_5[id];
}
