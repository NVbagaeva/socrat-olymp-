/**
 * Тарифы: единственный источник цен, сроков, лимитов и списков
 * возможностей. Страница /tarify/, будущий кабинет и будущие ограничения
 * доступа читают только этот файл. Поменять цену — поменять одно число.
 *
 * Оплаты и ограничений на сайте пока нет: файл описывает, что будет,
 * и ничего не включает сам.
 */

/** Флаг оплаты: «1» — кнопки ведут на регистрацию и оплату. */
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === '1';

export const TARIFY_HREF = '/tarify/';

export type Rol = 'uchenik' | 'repetitor';
export type Srok = 'd30' | 'ege';
export type TarifId = 'besplatno' | 'probnyy' | Rol;

/** Последний день доступа по сроку «До ЕГЭ» (ГГГГ-ММ-ДД). */
export const DO_EGE = { data: '2027-06-30', podpis: 'до 30 июня 2027' } as const;

/** Срок обычной оплаты, дней. */
export const PERIOD_DNEY = 30;

/** Лимиты бесплатного доступа. */
export const BESPLATNO = {
  /** Задач тренажёра в день. */
  trenazherVDen: 10,
  /** Вариантов онлайн всего. */
  variantovOnlayn: 1,
  /** Вариантов генератора в день (без листа учителя). */
  generatorVDen: 1,
} as const;

/** Пробный доступ: полный, без карты. */
export const PROBNYY = {
  dney: 7,
  /** Сколько раз на аккаунт. */
  raz: 1,
} as const;

/** Учеников в одном классе репетитора. */
export const KLASS_MAKS = 30;

/**
 * Цена «До ЕГЭ» снижается к экзамену: ступень действует с даты `s`
 * (включительно) до следующей ступени. После `konets` срок «До ЕГЭ»
 * не продаётся — остаётся оплата за 30 дней.
 */
export interface Stupen {
  s: string;
  tsena: number;
}

export interface PlatnyyTarif {
  nazvanie: string;
  /** Цена за PERIOD_DNEY дней, ₽. */
  tsena30: number;
  /** Ступени цены «До ЕГЭ» по дате покупки, от ранней к поздней. */
  doEge: Stupen[];
}

/** С этой даты срок «До ЕГЭ» не продаётся: до экзамена меньше месяца. */
export const DO_EGE_KONETS_PRODAZH = '2027-06-01';

export const PLATNYE: Record<Rol, PlatnyyTarif> = {
  uchenik: {
    nazvanie: 'Ученик',
    tsena30: 390,
    doEge: [
      { s: '2026-01-01', tsena: 1990 },
      { s: '2027-02-01', tsena: 1590 },
      { s: '2027-03-01', tsena: 1290 },
      { s: '2027-04-01', tsena: 990 },
      { s: '2027-05-01', tsena: 690 },
    ],
  },
  repetitor: {
    nazvanie: 'Репетитор',
    tsena30: 890,
    doEge: [
      { s: '2026-01-01', tsena: 4990 },
      { s: '2027-02-01', tsena: 3990 },
      { s: '2027-03-01', tsena: 2990 },
      { s: '2027-04-01', tsena: 2290 },
      { s: '2027-05-01', tsena: 1590 },
    ],
  },
};

/** Дата по Москве в виде ГГГГ-ММ-ДД. */
export function segodnya(now: Date = new Date()): string {
  return new Date(now.getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Цена «До ЕГЭ» на дату покупки; null — срок уже не продаётся. */
export function tsenaDoEge(rol: Rol, data: string = segodnya()): number | null {
  if (data >= DO_EGE_KONETS_PRODAZH) return null;
  let tsena: number | null = null;
  for (const stupen of PLATNYE[rol].doEge) {
    if (data >= stupen.s) tsena = stupen.tsena;
  }
  return tsena;
}

/** Цена тарифа роли на выбранный срок; null — срок не продаётся. */
export function tsena(rol: Rol, srok: Srok, data?: string): number | null {
  return srok === 'd30' ? PLATNYE[rol].tsena30 : tsenaDoEge(rol, data);
}

/** «1 990 ₽» — с неразрывными пробелами. */
export function rubli(summa: number): string {
  return `${summa.toLocaleString('ru-RU').replace(/\s/g, ' ')} ₽`;
}

/* ── Тексты плашек ────────────────────────────────────────────── */

/* ── Главная ценность: методические подсказки ─────────────────── */

/**
 * Во всех тренажёрах и опорных задачах подсказка — не готовый ответ, а
 * вопрос к следующему шагу с вариантами ответа. После ошибки — подсказка
 * и вторая попытка. Это и есть то, за что платят: занятие с учителем,
 * а не сборник ответов.
 */
export const PODSKAZKI = {
  punkt: 'Методические подсказки во всех тренажёрах и опорных задачах',
  punktBesplatno: 'Методические подсказки к каждому шагу решения',
  zagolovok: 'Подсказки, которые учат решать, а не выдают ответ',
  lid: 'Каждый тренажёр и каждая опорная задача сопровождаются подсказками, которые составил учитель. Они ведут к решению так, как это делают на занятии.',
  primery: [
    {
      nazvanie: 'Вопрос вместо ответа',
      tekst:
        'Застряли — подсказка задаёт вопрос к следующему шагу и предлагает варианты. Ученик сам делает шаг и понимает, почему он верный.',
    },
    {
      nazvanie: 'Разбор ошибки сразу',
      tekst:
        'Ответ проверяется сразу. Ошибся — подсказка показывает, где свернул не туда, и даёт вторую попытку.',
    },
    {
      nazvanie: 'Приём, который пригодится снова',
      tekst:
        'Подсказки называют приём, а не только числа: тот же ход сработает в следующей задаче этого типа и на экзамене.',
    },
  ],
} as const;

/* ── Плашки ───────────────────────────────────────────────────── */

export interface Plashka {
  id: TarifId;
  nazvanie: string;
  /** Одна строка «для кого». */
  dlyaKogo: string;
  /** Что входит: 5–7 пунктов. */
  vhodit: string[];
  /** Чего нет: 1–2 серых пункта. */
  net: string[];
}

const besplatno: Plashka = {
  id: 'besplatno',
  nazvanie: 'Бесплатно',
  dlyaKogo: 'Чтобы начать и заниматься в своём темпе',
  vhodit: [
    PODSKAZKI.punktBesplatno,
    'Теория и «О задании» — целиком',
    'Опорные задачи: первый блок каждого навыка',
    `Тренажёр: ${BESPLATNO.trenazherVDen} задач в день`,
    `${BESPLATNO.variantovOnlayn} вариант онлайн`,
    `Генератор: ${BESPLATNO.generatorVDen} вариант в день`,
  ],
  net: ['Работа над ошибками, прогресс и история', 'Листы учителя с решениями'],
};

const probnyy: Record<Rol, Plashka> = {
  uchenik: {
    id: 'probnyy',
    nazvanie: `Пробный ${PROBNYY.dney} дней`,
    dlyaKogo: 'Чтобы посмотреть всё, прежде чем платить',
    vhodit: [
      `Всё из тарифа «Ученик» на ${PROBNYY.dney} дней`,
      PODSKAZKI.punkt,
      'Тренажёр без ограничений',
      'Все опорные задачи',
      'Работа над ошибками, прогресс и история',
      'Все варианты онлайн с баллами',
    ],
    net: ['Один раз на аккаунт', `Через ${PROBNYY.dney} дней — снова бесплатный доступ`],
  },
  repetitor: {
    id: 'probnyy',
    nazvanie: `Пробный ${PROBNYY.dney} дней`,
    dlyaKogo: 'Чтобы посмотреть всё, прежде чем платить',
    vhodit: [
      `Всё из тарифа «Репетитор» на ${PROBNYY.dney} дней`,
      PODSKAZKI.punkt,
      'Генератор и «Собрать вариант» без ограничений',
      'Листы учителя с решениями',
      `Классы до ${KLASS_MAKS} учеников`,
      'Домашние задания и таблица результатов',
    ],
    net: ['Один раз на аккаунт', `Через ${PROBNYY.dney} дней — снова бесплатный доступ`],
  },
};

const platnye: Record<Rol, Plashka> = {
  uchenik: {
    id: 'uchenik',
    nazvanie: PLATNYE.uchenik.nazvanie,
    dlyaKogo: 'Тому, кто готовится к экзамену сам',
    vhodit: [
      PODSKAZKI.punkt,
      'Тренажёр без ограничений',
      'Все опорные задачи',
      'Работа над ошибками',
      'Прогресс и история решений',
      'Все варианты онлайн с баллами',
      'Варианты повышенной сложности',
    ],
    net: ['Классы и домашние задания — в тарифе «Репетитор»'],
  },
  repetitor: {
    id: 'repetitor',
    nazvanie: PLATNYE.repetitor.nazvanie,
    dlyaKogo: 'Тому, кто готовит к экзамену других',
    vhodit: [
      'Всё из «Ученика», включая подсказки во всех задачах',
      'Генератор и «Собрать вариант» без ограничений',
      'Листы учителя с решениями',
      `Классы до ${KLASS_MAKS} учеников`,
      'Домашние задания',
      'Таблица результатов',
      'Ученики решают выданные задания бесплатно',
    ],
    net: [`Больше ${KLASS_MAKS} учеников в классе — напишите нам`],
  },
};

/** Три плашки страницы для выбранной роли: бесплатно, пробный, платный. */
export function plashki(rol: Rol): [Plashka, Plashka, Plashka] {
  return [besplatno, probnyy[rol], platnye[rol]];
}

/* ── Таблица сравнения ────────────────────────────────────────── */

/** Ячейка: true — входит, false — нет, строка — входит с условием. */
export type Yacheyka = boolean | string;

export interface StrokaSravneniya {
  vozmozhnost: string;
  besplatno: Yacheyka;
  uchenik: Yacheyka;
  repetitor: Yacheyka;
}

export const SRAVNENIE: StrokaSravneniya[] = [
  { vozmozhnost: 'Методические подсказки', besplatno: true, uchenik: true, repetitor: true },
  { vozmozhnost: 'Теория и «О задании»', besplatno: true, uchenik: true, repetitor: true },
  {
    vozmozhnost: 'Опорные задачи',
    besplatno: 'первый блок навыка',
    uchenik: 'все',
    repetitor: 'все',
  },
  {
    vozmozhnost: 'Тренажёр',
    besplatno: `${BESPLATNO.trenazherVDen} задач в день`,
    uchenik: 'без ограничений',
    repetitor: 'без ограничений',
  },
  { vozmozhnost: 'Работа над ошибками', besplatno: false, uchenik: true, repetitor: true },
  { vozmozhnost: 'Прогресс и история', besplatno: false, uchenik: true, repetitor: true },
  {
    vozmozhnost: 'Варианты онлайн с баллами',
    besplatno: `${BESPLATNO.variantovOnlayn} вариант`,
    uchenik: 'все',
    repetitor: 'все',
  },
  {
    vozmozhnost: 'Варианты повышенной сложности',
    besplatno: false,
    uchenik: true,
    repetitor: true,
  },
  {
    vozmozhnost: 'Генератор и «Собрать вариант»',
    besplatno: `${BESPLATNO.generatorVDen} вариант в день`,
    /* Платный не хуже бесплатного: у ученика тот же лимит генератора. */
    uchenik: `${BESPLATNO.generatorVDen} вариант в день`,
    repetitor: 'без ограничений',
  },
  { vozmozhnost: 'Листы учителя с решениями', besplatno: false, uchenik: false, repetitor: true },
  {
    vozmozhnost: 'Классы',
    besplatno: false,
    uchenik: false,
    repetitor: `до ${KLASS_MAKS} учеников`,
  },
  {
    vozmozhnost: 'Домашние задания и таблица результатов',
    besplatno: false,
    uchenik: false,
    repetitor: true,
  },
];

/** Общие подписи. */
export const TARIFY_TEXT = {
  metkaGlavnoy: 'Полный доступ',
  bezKarty: 'без карты',
  bezAvtoprodleniya: 'Без автопродления: доступ заканчивается сам',
  za30: `за ${PERIOD_DNEY} дней`,
  knopki: {
    nachat: 'Начать заниматься',
    skoro: 'Оплата скоро откроется',
    probnyy: 'Попробовать бесплатно',
    oplatit: 'Оформить доступ',
  },
} as const;
