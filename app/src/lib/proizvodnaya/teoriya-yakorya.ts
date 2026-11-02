/**
 * Якоря вкладки «Теория» задания №9: сюда ведёт «Повторить теорию» из
 * карточек по теории (content/kartochki/09-proizvodnaya.ts).
 *
 * Имена собираются здесь и только здесь: раздел — #teoriya-<id>
 * (оболочка TeoriyaShell), подраздел — его id («z9-3-2»), рамка, таблица
 * или плашка «Запомни» — #t9-<имя> из BLOKI_9. Блокам разделов имя
 * ставит поле `yakor` (content/theoryProizvodnaya.ts), рамкам «Понятия
 * производной» — поле `yakor` текстов (content/theoryPonyatie9.ts);
 * Teoriya9 и PonyatieProizvodnoy9 рисуют его как id, а
 * scripts/verify_cards собирает якоря из тех же данных — якорь карточки
 * не может разойтись со страницей.
 *
 * Модуль не читает теорию: её данные сами берут отсюда имена блоков.
 */

/** Рамки, таблицы и плашки теории №9, на которые ведут карточки. */
export const BLOKI_9 = [
  /* Понятие производной */
  'skorost',
  'kasatelnaya-opr',
  'uglovoy',
  'kasatelnaya-k',
  'opredelenie',
  'smysl',
  'algoritm',
  'primer-x2',
  'modul',
  'odnostoronnie',
  'net-vyvod',
  /* Геометрический смысл */
  'glavnaya',
  'treugolnik',
  'tupoy',
  'znak-chislo',
  /* Знак и монотонность */
  'znak',
  'tablica',
  'vyshe-osi',
  /* Экстремумы */
  'max-min',
  'ekstr-shagi',
  'kasanie-osi',
  /* Физический смысл */
  'skorost-uskorenie',
  'pravila',
  'fiz-shagi',
  'ne-v-zakon',
  /* Касательная */
  'parallel',
  'usloviya',
  'proverka-kasaniya',
  /* Первообразная */
  'F-opredelenie',
  'nyuton',
  'pamyatka',
] as const;

export type Blok9 = (typeof BLOKI_9)[number];

export const YAKOR_9 = {
  /** Раздел теории: «teoriya-ekstremumy». */
  razdel: (id: string) => `teoriya-${id}`,
  /** Рамка, таблица или плашка: «t9-tablica». */
  blok: (id: Blok9) => `t9-${id}`,
} as const;
