/**
 * Стеклянные картинки раздела «Устный счёт» (public/images/ustnyy-schet/,
 * исходники — assets/ustnyy-schet/, сборка — scripts/build-shapka.mjs,
 * журнал запросов — docs/plans/ustnyy-schet-kartinki.md).
 *
 * Адреса с версией считает сервер (illyustraciyaUrl): таблица версий не
 * идёт в первую загрузку страниц. Размер кадра — из вывода сборки
 * («в разметку: width=… height=…»): по нему разметка держит место.
 */

import { illyustraciyaUrl } from '@/lib/illyustraciiUrl';

export const KARTINKI_US = {
  'shapka-sekundomer': { w: 738, h: 1008, shiriny: [280, 560] },
  'znak-plyus': { w: 908, h: 913, shiriny: [240, 480] },
  'znak-minus': { w: 958, h: 483, shiriny: [240, 480] },
  'znak-umnozhit': { w: 838, h: 837, shiriny: [240, 480] },
  'znak-delit': { w: 847, h: 919, shiriny: [240, 480] },
  'gruppa-kvadraty': { w: 1003, h: 704, shiriny: [240, 480] },
  'gruppa-umnozhenie': { w: 772, h: 900, shiriny: [240, 480] },
  'gruppa-delenie': { w: 759, h: 943, shiriny: [240, 480] },
  'gruppa-slozhenie': { w: 941, h: 605, shiriny: [240, 480] },
  'gruppa-doli': { w: 911, h: 759, shiriny: [240, 480] },
  'gruppa-uravneniya': { w: 1053, h: 959, shiriny: [240, 480] },
  vieta: { w: 964, h: 748, shiriny: [240, 480] },
  tablica: { w: 1018, h: 880, shiriny: [240, 480] },
  reyting: { w: 964, h: 829, shiriny: [240, 480] },
} as const;

export type KartinkaUsId = keyof typeof KARTINKI_US;

export interface KartinkaUs {
  src: string;
  srcSet: string;
  /** Пропорции кадра для width/height у img. */
  width: number;
  height: number;
}

/** Картинка для img: меньшая ширина — src, обе — в srcSet. */
export function kartinkaUs(id: KartinkaUsId): KartinkaUs {
  const k = KARTINKI_US[id];
  const [a, b] = k.shiriny;
  const url = (w: number) => illyustraciyaUrl(`/images/ustnyy-schet/${id}-${w}.webp`);
  return {
    src: url(a),
    srcSet: `${url(a)} ${a}w, ${url(b)} ${b}w`,
    width: k.w,
    height: k.h,
  };
}
