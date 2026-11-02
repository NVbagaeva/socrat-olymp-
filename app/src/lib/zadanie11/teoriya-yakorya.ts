/**
 * Якоря вкладки «Теория» задания №11: сюда ведёт «Повторить теорию» из
 * карточек по теории (content/kartochki/11-*.ts), а из тренажёра —
 * ссылка на лайфхак.
 *
 * Имена собираются здесь и только здесь: раздел — #teoriya-<id>
 * (оболочка TeoriyaShell), блок раздела — #<раздел>-<часть>
 * («smesi-formula», «pryamaya-glavnoe»), карточка раздела с полем
 * `yakor` — #t11-<имя> из BLOKI_11, лайфхак — #layfhak-<id> (полная
 * карточка в разделе «Лайфхаки»), ловушка — #lovushka-<id> (раздел
 * «Ловушки»). Лайфхаки и ловушки повторяются в разделах задач, но якорь
 * у каждого один — там, где собраны все. Teoriya11 рисует эти id, а
 * scripts/verify_cards собирает якоря из тех же данных — якорь
 * карточки не может разойтись со страницей.
 *
 * Модуль не читает теорию: её данные сами берут отсюда имена блоков.
 */

/** Карточки разделов теории №11 (поле `yakor`), на которые ведут карточки по теории. */
export const BLOKI_11 = [
  /* Как устроено задание */
  'odz',
  'lishnie-korni',
  'odz-i-smysl',
  /* Разминка */
  'proporciya',
  'poyasa',
  'okruglenie',
  'procenty-mestami',
] as const;

export type Blok11 = (typeof BLOKI_11)[number];

/** Блоки раздела, у которых есть id: подпункты содержания и «Главное». */
export type ChastRazdela11 =
  'opredelenie' | 'formula' | 'tablitsa' | 'glavnoe' | 'layfhaki' | 'lovushki' | 'tipy';

export const YAKOR_11 = {
  /** Раздел теории: «teoriya-smesi». */
  razdel: (id: string) => `teoriya-${id}`,
  /** Блок раздела: «smesi-formula». */
  chast: (razdel: string, chast: ChastRazdela11) => `${razdel}-${chast}`,
  /** Карточка раздела: «t11-odz». */
  kartochka: (id: Blok11) => `t11-${id}`,
  /** Полная карточка лайфхака в разделе «Лайфхаки»: «layfhak-root-guess». */
  layfhak: (id: string) => `layfhak-${id}`,
  /** Карточка ловушки в разделе «Ловушки»: «lovushka-minuty». */
  lovushka: (id: string) => `lovushka-${id}`,
} as const;
