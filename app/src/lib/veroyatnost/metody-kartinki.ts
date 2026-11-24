/**
 * Иллюстрации карточек «Ключевые методы решения» задания №5: по
 * одной стеклянной картинке на метод, в стиле шапок разделов (синее
 * стекло с тёплыми акцентами, прозрачный фон, без надписей).
 *
 * Исходники — app/assets/zadanie-0N/metod-<id>.png (сгенерированы через
 * OpenAI Images, как картинки шапок); готовые WebP и PNG двух ширин
 * собирает scripts/build-shapka.mjs в public/images/zadanie-0N/.
 * Размеры — обрезанного кадра (их печатает тот же скрипт): разметка
 * держит место до загрузки. Версии файлов — своя таблица
 * (lib/illyustraciiUrl.ts), общая первая загрузка не растёт.
 *
 * Метода нет в списке — карточка остаётся без картинки.
 */

import type { Zadanie } from '@/content/veroyatnost';

export interface KartinkaMetoda {
  /** Путь без ширины и расширения: /images/zadanie-05/metod-polnaya. */
  put: string;
  width: number;
  height: number;
}

/** Ширины готовых файлов, px: карточка ~200 px, на экранах 2x — 400. */
export const SHIRINY_KARTINOK = [240, 480] as const;

type Razmery = Readonly<Record<string, readonly [number, number]>>;

/** Размеры обрезанных кадров по методам. */
const RAZMERY: Readonly<Record<Zadanie, Razmery>> = {
  /* У №4 карточки — ссылки на главы теории со своими картинками
     (MetodyKartochki4, public/images/zadanie-04/metody/). */
  4: {},
  5: {
    nesovmestnye: [1019, 562],
    protivopolozhnoe: [922, 582],
    koordinatnaya: [1152, 265],
    sovmestnye: [929, 696],
    uslovnaya: [1138, 602],
    nezavisimye: [984, 606],
    'hotya-by': [950, 646],
    'dva-predmeta': [634, 873],
    polnaya: [915, 732],
    'do-uspeha': [997, 688],
  },
};

export function kartinkaMetoda(zadanie: Zadanie, id: string): KartinkaMetoda | undefined {
  const r = RAZMERY[zadanie][id];
  if (r === undefined) return undefined;
  return { put: `/images/zadanie-0${zadanie}/metod-${id}`, width: r[0], height: r[1] };
}
