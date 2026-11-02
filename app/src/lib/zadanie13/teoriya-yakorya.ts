/**
 * Якоря вкладки «Теория» задания №13: сюда ведёт «Повторить теорию» из
 * карточек по теории (content/kartochki/13-*.ts).
 *
 * Имена собираются здесь и только здесь: глава — #teoriya-<id>
 * (оболочка TeoriyaShell), подраздел — его id («dif-formula»), карточка,
 * таблица, рисунок или блок признаков — #t13-<имя> из BLOKI_13. Блокам
 * имя ставит поле `yakor` (content/teoriya13.ts), Teoriya13 рисует его
 * как id, а scripts/verify_cards собирает якоря из тех же данных —
 * якорь карточки не может разойтись со страницей.
 *
 * Модуль не читает теорию: её данные сами берут отсюда имена блоков.
 */

/** Блоки теории №13, на которые ведут карточки (поле `yakor` блока). */
export const BLOKI_13 = [
  /* Проценты и увеличивающий коэффициент */
  'oboznacheniya',
  'procent',
  'sto-procentov',
  'proporciya',
  'koeffitsient',
  'ne-skladyvat',
  'k-drobyu',
  'umenshit',
  /* Кредит простыми словами */
  'kredit',
  'pereplata',
  'izmenenie',
  'dolg-na-konec',
  'platezh',
  'petya',
  'vernut',
  'lov-vernut',
  /* Две схемы кредита */
  'ris-dve-shemy',
  'dif-slovami',
  'ann-slovami',
  'kak-uznat',
  /* Дифференцированный платёж */
  'tri-pravila',
  'tablitsa-dif',
  'formula-dif',
  'lov-n1',
  /* «Поломанный» дифференцированный платёж */
  'po-kuskam',
  'lov-periody',
  'lov-kazhdaya',
  /* Аннуитет */
  'tsepochka',
  'tablitsa-ann',
  'geom',
  'chetyre',
  'lov-k',
  'lov-pereplata-ann',
  /* Вклады */
  'vklad',
  'tablitsa-vklad',
  'lov-nachalo',
  'punkty',
  'lov-nachislit',
  /* Как определить тип задачи */
  'priznaki',
  'opredeli',
  /* Ловушки и лайфхаки */
  'lov-edinicy',
  'v-tysyachah',
  'lov-stroka',
  'lov-chem',
  'sokrashchaem',
  'delimost',
] as const;

export type Blok13 = (typeof BLOKI_13)[number];

export const YAKOR_13 = {
  /** Глава теории: «teoriya-dif». */
  razdel: (id: string) => `teoriya-${id}`,
  /** Карточка, таблица, рисунок или блок главы: «t13-formula-dif». */
  blok: (id: Blok13) => `t13-${id}`,
} as const;
