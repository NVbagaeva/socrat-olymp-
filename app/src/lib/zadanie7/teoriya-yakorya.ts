/**
 * Якоря вкладки «Теория» задания №7: сюда ведёт «Повторить теорию» из
 * карточек по теории (content/kartochki/07-*.ts).
 *
 * Имена собираются здесь и только здесь: раздел — #teoriya-<id>
 * (оболочка TeoriyaShell), карточка теории — #k-<id> (KartochkaTelo7,
 * виды иррациональных уравнений — Irracionalnye7), рамка или таблица
 * раздела — #t7-<имя> из BLOKI_7. Блокам имя ставит поле `yakor`
 * (content/teoriya7.ts), Teoriya7 рисует его как id, а
 * scripts/verify_cards собирает якоря из тех же данных — якорь
 * карточки не может разойтись со страницей.
 *
 * Модуль не читает теорию: её данные сами берут отсюда имена блоков.
 */

/** Рамки и таблицы теории №7, на которые ведут карточки (поле `yakor` блока). */
export const BLOKI_7 = [
  'koren',
  'ravnosilnye',
  'sovokupnost',
  'odz',
  'vopros',
  'odno-chislo',
  'lineynoe',
  'proporciya',
  'koren-n',
  'skolko-korney',
  'formula-korney',
  'menshiy',
  'svoystva-stepeney',
  'pokazateli',
  'logarifm',
  'tozhdestvo',
  'svoystva-log',
  'odz-log',
  'okruzhnost',
  'znacheniya',
] as const;

export type Blok7 = (typeof BLOKI_7)[number];

export const YAKOR_7 = {
  /** Раздел теории: «teoriya-logarifmy». */
  razdel: (id: string) => `teoriya-${id}`,
  /** Карточка теории: «k-log-chislo». */
  kartochka: (id: string) => `k-${id}`,
  /** Рамка или таблица раздела: «t7-odz». */
  blok: (id: Blok7) => `t7-${id}`,
} as const;
