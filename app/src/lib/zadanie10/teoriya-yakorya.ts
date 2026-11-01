/**
 * Якоря вкладки «Теория» задания №10: сюда ведёт «Повторить теорию» из
 * карточек по теории (content/kartochki/10-*.ts).
 *
 * Имена собираются здесь и только здесь: раздел — #teoriya-<id>
 * (оболочка TeoriyaShell), карточка «Физика в двух словах» —
 * #fizika-<прототип>, часть общей теории единиц — #ed-<часть>
 * (content/teoriya-edinicy.ts), рамка, таблица или ловушка раздела —
 * #t10-<имя> из BLOKI_10. Блокам имя ставит поле `yakor`
 * (content/teoriya10.ts), Teoriya10 рисует его как id, а
 * scripts/verify_cards собирает якоря из тех же данных — якорь
 * карточки не может разойтись со страницей.
 *
 * Модуль не читает теорию: её данные сами берут отсюда имена блоков.
 */

/** Рамки, таблицы и ловушки теории №10, на которые ведут карточки (поле `yakor` блока). */
export const BLOKI_10 = [
  /* Как решать прикладную задачу */
  'algoritm',
  'vanta',
  'formula-dana',
  /* Единицы измерения */
  'edinicy-v-formule',
  'otvet-v-edinicah',
  /* Линейные и дробно-рациональные */
  'proporciya',
  'vyrazit-r',
  'znamenatel',
  /* Квадратные */
  'formula-korney',
  'vybor-kornya',
  'neravenstvo',
  'vershina',
  'promezhutok',
  'pervyy-koren',
  /* Степени и корни */
  'vozvedenie',
  'drobnyy-pokazatel',
  'standartnyy-vid',
  'odno-osnovanie',
  /* Показательные и логарифмические */
  'raspad',
  'logarifm',
  'pochemu',
  'stepeni-dvoyki',
  'rc',
  'celoe-k',
  /* Тригонометрия */
  'tablichnye',
  'monotonnost',
  'ponizhenie',
  'kakoy-ugol',
  /* Ловушки */
  'lov-edinicy',
  'lov-koren',
  'lov-znak',
  'lov-smysl',
  'pered-otvetom',
] as const;

export type Blok10 = (typeof BLOKI_10)[number];

export const YAKOR_10 = {
  /** Раздел теории: «teoriya-kvadratnye». */
  razdel: (id: string) => `teoriya-${id}`,
  /** Карточка «Физика в двух словах»: «fizika-P06». */
  fizika: (prototip: string) => `fizika-${prototip}`,
  /** Рамка, таблица или ловушка раздела: «t10-vybor-kornya». */
  blok: (id: Blok10) => `t10-${id}`,
} as const;
