/**
 * Якоря вкладки «Теория» задания №6: сюда ведёт «Повторить теорию» из
 * карточек по теории (content/kartochki/06-*.ts).
 *
 * Имена собираются здесь и только здесь: раздел — #teoriya-<id>
 * (оболочка TeoriyaShell), карточка теории — #k-<id> (KartochkaTelo6),
 * рамка раздела — #t6-<имя> из BLOKI_6. Рамкам имя ставит поле `yakor`
 * блока (content/teoriya6.ts), Teoriya6 рисует его как id, а
 * scripts/verify_cards собирает якоря из тех же данных — якорь
 * карточки не может разойтись со страницей.
 *
 * Модуль не читает теорию: её данные сами берут отсюда имена рамок.
 */

/** Рамки теории №6, на которые ведут карточки (поле `yakor` блока). */
export const BLOKI_6 = [
  'velichina',
  'eiler-chtenie',
  'derevo-chtenie',
  'uslovnaya-smysl',
  'uslovnaya-cherta',
  'ozhidanie-smysl',
  'ozhidanie-svoystva',
  'dispersiya-razbros',
  'dispersiya-znak',
  'vyborka-srednee',
  'vyborka-pochemu',
  'chebyshev-epsilon',
  'chebyshev-otsenka',
  'promezhutok-znak',
] as const;

export type Blok6 = (typeof BLOKI_6)[number];

export const YAKOR_6 = {
  /** Раздел теории: «teoriya-ozhidanie». */
  razdel: (id: string) => `teoriya-${id}`,
  /** Карточка теории: «k-loteraya». */
  kartochka: (id: string) => `k-${id}`,
  /** Рамка раздела: «t6-ozhidanie-smysl». */
  blok: (id: Blok6) => `t6-${id}`,
} as const;
