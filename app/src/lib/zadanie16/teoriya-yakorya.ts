/**
 * Якоря вкладки «Теория» задания №16: сюда ведёт «Повторить теорию» из
 * карточек по теории (content/kartochki/16-*.ts).
 *
 * Имена собираются здесь и только здесь: глава — #teoriya-<id>
 * (оболочка TeoriyaShell), пункт главы — его id («intervaly-vid»),
 * карточка теории — #t16-<имя> из KARTOCHKI_16. Карточке имя ставит
 * поле `yakor` (content/teoriya16.ts), Teoriya16 рисует его как id, а
 * scripts/verify_cards собирает якоря из тех же данных — якорь
 * карточки не может разойтись со страницей.
 *
 * Модуль не читает теорию: её данные сами берут отсюда имена.
 */

/** Карточки теории №16, на которые ведут карточки по теории (поле `yakor`). */
export const KARTOCHKI_16 = [
  /* Метод интервалов: стандартный вид */
  'opredelenie',
  'algoritm',
  'razlozhit',
  /* Алгоритм и кратность корней */
  'kratnost',
  'primer-dva',
  'primer-kratnost',
  'parabola',
  /* Системы неравенств */
  'ogranicheniya',
  'sistema',
] as const;

export type Yakor16 = (typeof KARTOCHKI_16)[number];

export const YAKOR_16 = {
  /** Глава теории: «teoriya-intervaly». */
  razdel: (id: string) => `teoriya-${id}`,
  /** Карточка теории: «t16-kratnost». */
  kartochka: (id: Yakor16) => `t16-${id}`,
} as const;
