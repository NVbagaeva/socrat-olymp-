/**
 * Картинки сюжетов аналогов задания №9 (раздел хранения 10).
 *
 * Картинка прототипа (illyustracii.ts, public/illustrations/zadanie-10/)
 * нарисована на сюжет ФИПИ. У аналога с другим сюжетом (камешек вместо
 * волейбольного мяча, дрон вместо тепловоза) — своя картинка из
 * lib/kartinkiZadach.ts. Ключ записи — `<прототип>:<метка plot аналога>`
 * (data/zadanie10/analogi.json), значение — ключ сюжета картинки.
 * Аналог, которого здесь нет, берёт картинку прототипа: сцена та же.
 */

export const SYUZHET_KARTINKI_9: Readonly<Record<string, string>> = {
  'P01:мост в верёвочном парке': 'most-verevochnyy-park',
  'P01:велодорожка': 'most-velodorozhka',
  'P02:мобильные игры': 'reyting-mobilnyh-igr',
  'P02:музеи': 'reyting-muzeev',
  'P02:научные видеоблоги': 'reyting-videoblogov',
  'P03:приложение доставки': 'reyting-dostavki-edy',
  'P04:зарядная станция самокатов': 'zaryadka-samokatov',
  'P04:USB-порт': 'usb-zashchita',
  'P05:аккумулятор электросамоката': 'akkumulyator-samokata',
  'P05:генератор': 'generator-obogrevatel',
  'P05:павербанк': 'powerbank-smartfon',
  'P06:плита и обогреватель': 'obogrevatel-toster',
  'P06:чайник и утюг': 'chaynik-utyug',
  'P06:игровой компьютер': 'pk-zaryadka-samokata',
  'P06:игровая приставка': 'uvlazhnitel-pristavka',
  'P07:проектор для смартфона': 'proektor-iz-korobki',
  'P07:кадр плёнки': 'filmoskop',
  'P07:насекомое под линзой': 'nasekomoe-linza',
  'P08:дрон-доставщик': 'dron-dostavshchik-signal',
  'P08:скорая помощь': 'skoraya-signal',
  'P08:электрокар': 'elektrokar-signal',
  'P09:два дрона': 'dva-drona-zvuk',
  'P09:катера': 'kater-i-buy',
  'P09:роботы': 'robot-pylesos-i-sobaka',
  'P11:электросамокат': 'tormozhenie-samokata',
  'P11:автобус': 'tormozhenie-avtobusa',
  'P11:карт': 'tormozhenie-karta',
  'P12:грузовик': 'gruzovik-iz-posyolka',
  'P12:беспилотное такси': 'bespilotnoe-taksi',
  'P13:3D-принтер': 'namotka-filamenta',
  'P15:каркасный бассейн': 'karkasnyy-basseyn',
  'P16:3D-принтер': 'nagrev-sopla-3d',
  'P16:муфельная печь': 'mufelnaya-pech',
  'P16:паяльная станция': 'payalnaya-stanciya',
  'P17:камешек': 'kameshek-vverh',
  'P17:баскетбольный мяч': 'basketbolnyy-myach-vverh',
  'P19:наблюдатель на горе': 'nablyudatel-na-gore',
  'P19:космонавт на орбите': 'gorizont-s-orbity',
  'P19:дрон с камерой': 'gorizont-s-drona',
  'P21:баллон для дайвинга': 'ballon-dlya-dayvinga',
  'P32:модель ракеты': 'vodyanaya-raketa',
  'P32:баллон для пейнтбола': 'ballon-peyntbol',
  'P23:подводная лаборатория': 'podvodnaya-laboratoriya',
  'P23:купол для дайверов': 'kupol-dlya-dayverov',
  'P24:дефибриллятор': 'defibrillyator',
  'P24:рентгеновский аппарат': 'rentgen-apparat',
  'P24:лазерная установка': 'lazernoe-shou',
  'P25:тёплый пол': 'teplyy-pol',
  'P25:теплица': 'teplica-otoplenie',
  'P25:водяное охлаждение ПК': 'vodyanoe-ohlazhdenie-pk',
  'P26:камень': 'kamen-pod-uglom',
  'P26:мяч для регби': 'myach-regbi-pod-uglom',
  'P26:мяч в паделе': 'padel-myach',
  'P27:смартфон на пружинном держателе': 'smartfon-v-derzhatele',
  'P27:игрушка-попрыгунчик': 'brelok-poprygunchik',
  'P34:фигурка на пружине': 'brelok-poprygunchik',
  'P34:датчик в смартфоне': 'vibromotor-model',
  'P28:роботы-сумоисты': 'roboty-sumoisty',
  'P28:шайбы аэрохоккея': 'shayby-aerohokkeya',
  'P29:мяч над скалодромом': 'myach-nad-skalodromom',
  'P29:мяч над дроном': 'myach-nad-dronom',
  'P33:CD-диск и лазерная указка': 'cd-difrakciya',
};

/** Ключ записи в словаре картинок для задачи банка: сюжет аналога или прототип. */
export function klyuchKartinki10(z: { prototypeId: string; plot?: string }): string {
  const k = `${z.prototypeId}:${z.plot ?? ''}`;
  return k in SYUZHET_KARTINKI_9 ? k : z.prototypeId;
}
