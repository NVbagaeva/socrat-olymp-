/**
 * Иконка раздела: адреса файлов и srcset. Без тяжёлых зависимостей —
 * модуль нужен и серверным страницам, и клиентским карточкам.
 *
 * Файлы лежат в public/images/razdely/<задание>/<имя>-<ширина>.{webp,png}
 * (scripts/build-razdely-icons.mjs); имя — поле icon подтемы в
 * data/functionTypes.ts. Другой системы иконок разделов в проекте нет.
 */

import { assetUrl } from '@/lib/assetUrl';
import type { IkonkaRazdela } from './types';

/** Ширины файлов иконок — как в scripts/build-razdely-icons.mjs. */
const WIDTHS = [96, 192, 384] as const;
/** Пропорции иконок: исходник 1024×923. */
const ICON_W = 1024;
const ICON_H = 923;

/** Иконка раздела: файлы public/images/razdely/<задание>/<имя>-<ширина>.*. */
export function ikonkaRazdela(task: string, name: string): IkonkaRazdela {
  const file = (width: number, ext: string) =>
    assetUrl(`/images/razdely/${task}/${name}-${width}.${ext}`);
  const set = (ext: string) => WIDTHS.map((width) => `${file(width, ext)} ${width}w`).join(', ');
  return {
    webp: set('webp'),
    png: set('png'),
    src: file(192, 'png'),
    width: ICON_W,
    height: ICON_H,
  };
}
