/**
 * Якоря блоков вкладки «Теория» заданий №4 и №5: сюда ведёт
 * «Повторить теорию» из карточек по теории (content/kartochki/04-*.ts,
 * 05-*.ts).
 *
 * Имена собираются здесь и только здесь: разделы теории ставят их на
 * свои блоки, scripts/verify_cards сверяет с ними `source` карточек.
 * Блоки перечислены по данным раздела (content/veroyatnost-teoriya),
 * поэтому якорь не может разойтись со страницей.
 *
 * Теория вероятностей одна на два номера: разделы о событиях — во
 * вкладке №4 (t4-…), координатная прямая — во вкладке №5 (t5-…).
 */

import { IZOBRAZHENIE, SVYAZANY, VIDY_SOBYTIY } from '@/content/veroyatnost-teoriya';

/** Карточки раздела «Классическая вероятность» — по порядку на странице. */
export const BLOKI_KLASSICHESKOY = [
  'opredelenie',
  'pochemu',
  'primer',
  'ravnovozmozhnye',
  'kak-uznat',
] as const;

/** Блоки раздела «Координатная прямая» (№5). */
export const BLOKI_PRYAMOY = [
  'ideya',
  'vlozhenie',
  'peresechenie',
  'protivopolozhnoe',
  'vyvod',
  'algoritm',
  'syuzhety',
] as const;

export const YAKOR_4 = {
  /** Карточка вида события: «t4-vid-nevozmozhnoe». */
  vid: (id: string) => `t4-vid-${id}`,
  /** Плашка «Важно понимать»: тип события зависит от условий. */
  vazhno: 't4-vidy-vazhno',
  /** Плашка «Запомни»: три типа и их вероятности. */
  zapomni: 't4-vidy-zapomni',
  /** Карточка блока «События могут быть связаны»: «t4-svyaz-nezavisimye». */
  svyaz: (id: string) => `t4-svyaz-${id}`,
  klass: (id: (typeof BLOKI_KLASSICHESKOY)[number]) => `t4-klass-${id}`,
  /** Две карточки способов: диаграмма Эйлера и числовая прямая. */
  izoSposoby: 't4-izo-sposoby',
  /** Строка таблицы «Как изображать события»: «t4-izo-peresechenie». */
  izo: (id: string) => `t4-izo-${id}`,
  izoPrimer: 't4-izo-primer',
  /** Итоговые плашки: размер фигуры и вложенность событий. */
  izoVlozhenie: 't4-izo-vlozhenie',
} as const;

export const YAKOR_5 = {
  pryamaya: (id: (typeof BLOKI_PRYAMOY)[number]) => `t5-pryamaya-${id}`,
} as const;

/** Все якоря блоков теории №4 (без якорей разделов). */
export function yakoryaBlokov4(): string[] {
  return [
    ...VIDY_SOBYTIY.kartochki.map((k) => YAKOR_4.vid(k.id)),
    YAKOR_4.vazhno,
    YAKOR_4.zapomni,
    ...SVYAZANY.kartochki.map((k) => YAKOR_4.svyaz(k.id)),
    ...BLOKI_KLASSICHESKOY.map(YAKOR_4.klass),
    YAKOR_4.izoSposoby,
    ...IZOBRAZHENIE.stroki.map((s) => YAKOR_4.izo(s.id)),
    YAKOR_4.izoPrimer,
    YAKOR_4.izoVlozhenie,
  ];
}

/** Все якоря блоков теории №5 (без якорей разделов). */
export function yakoryaBlokov5(): string[] {
  return BLOKI_PRYAMOY.map(YAKOR_5.pryamaya);
}
