/**
 * Картинки сюжетов задач №4 и №5 (lib/kartinkiZadach.ts) и готовые
 * картинки, которые показываются другим задачам. Отдельно от
 * illyustratsii.ts: тот файл — содержание раздела, его сторожит
 * scripts/check-redesign.mjs.
 */
/**
 * Опорные задачи, которым показываем готовую картинку прототипа с тем
 * же сюжетом вместо своей, не подходящей по условию (решение автора,
 * docs/plans/kartinki-k-zadacham.md). Ключ — id задачи, значение — имя
 * файла прототипа в public/images/veroyatnost/zadanie-N/.
 */
export const KARTINKA_PROTOTIPA_OPORNOY: Readonly<Record<string, string>> = {
  'k4-09': 'p4-07',
  'k5-31': 'p5-07',
  'k5-40': 'p5-09',
};

/**
 * Готовые картинки, общие для всех вариантов прототипа: на них нечего
 * пересчитывать, поэтому числа вариантов им не противоречат. Ключ — id
 * прототипа, значение — имя файла в public/images/veroyatnost/zadanie-N/.
 */
export const KARTINKA_VSEH_VARIANTOV: Readonly<Record<string, string>> = {
  'p4-08': 'p4-08',
  'p4-25': 'p4-08',
};

/**
 * Ключи сюжетов новых картинок (lib/kartinkiZadach.ts,
 * public/images/zadachi/<4|5>/). Ключ записи — id прототипа или опорной
 * задачи (сюжет у всех вариантов один) либо `<id>#<n>` — вариант n,
 * когда у вариантов прототипа сюжеты разные (p5-03: сканер, тостер…).
 * Своя картинка варианта в папке veroyatnost/zadanie-N важнее.
 */
export const SYUZHET_KARTINKI_45: Readonly<Record<string, string>> = {
  'p4-24': 'zhrebiy-nachat-igru',
  'p5-03#5': 'skaner-srok-sluzhby',
  'p5-03#6': 'toster-srok-sluzhby',
  'p5-03#16': 'toster-srok-sluzhby',
  'p5-03#9': 'printer-srok-sluzhby',
  'p5-03#10': 'fen-srok-sluzhby',
  'p5-03#15': 'fen-srok-sluzhby',
  'k5-22': 'telefon-srok-sluzhby',
  'p5-14': 'sklady-oshibka-sborki',
  'p5-15': 'test-na-virus',
  'p5-16': 'ekzamen-vyuchennyy-bilet',
  'p5-17': 'rybak-dva-ozera',
  'p5-18': 'pochta-spam',
  'p5-19': 'taksi-tsentr-prigorod',
  'p5-20': 'samolet-zaderzhka-pogoda',
  'p5-21': 'bagazh-peresadka',
  'p5-22': 'olimpiada-dve-shkoly',
  'p5-23': 'yaytsa-dve-fermy',
  'p5-24': 'konfety-tri-linii',
  'p5-25': 'dacha-tri-marshruta',
  'p5-26': 'marshrut-les-ozero-gory',
  'p5-27': 'basketbolist-dva-shtrafnyh',
  'p5-28': 'test-ugadyvanie-tri-voprosa',
  'p5-29': 'sluzhba-podderzhki-zvonki',
  'p5-30': 'dozhd-tri-dnya',
  'p5-31': 'futbolist-tri-penalti',
  'p5-32': 'dozhd-subbota-voskresene',
  'p5-33': 'lotereya-tri-bileta',
  'p5-34': 'smartfon-zaryad',
  'p5-35': 'posylka-kurer-pochta',
  'p5-36': 'onlayn-igra-server',
  'p5-37': 'futbol-dozhd',
  'p5-38': 'fotograf-shtativ',
  'p5-39': 'kartofel-tri-fermera',
  'p5-40': 'olimpiada-tri-temy',
  'p5-41': 'semena-tykvy-vskhozhest',
  'p5-42': 'dva-svetofora',
  'p5-43': 'shakhmatist-tri-partii',
  'p5-44': 'budilnik-prospit',
  'p5-45': 'pitstsa-dostavka',
  'p5-46': 'golosovoy-pomoshchnik',
  'p5-47': 'penalti-levyy-pravyy',
  'p5-48': 'girlyandy-dve-fabriki',
  'p5-49': 'kofeynya-tri-barista',
  'p5-50': 'turfirma-transport',
  'p5-51': 'kvest-tri-zamka',
  'p5-52': 'darts-dva-broska',
  'p5-53': 'sobesedovaniya-tri-kompanii',
  'k5-sp-1': 'opechatka-telefon',
  'k5-sp-2': 'strelok-ochki',
  'k5-sp-3': 'pryzhok-v-dlinu',
  'k5-sp-4': 'ozhidanie-taksi',
  'k5-sv-1': 'kruzhki-shakhmaty-tantsy',
  'k5-sv-2': 'avtobusy-dva-marshruta',
  'k5-sv-3': 'khleb-moloko',
  'k5-sv-4': 'dozhd-veter',
  'k5-sv-5': 'popkorn-avtomaty',
  'k5-sv-6': 'printery-bumaga',
  'k5-sv-7': 'kholodilnik-datchik',
  'k5-hb-1': 'datchiki-dyma',
  'k5-hb-2': 'kassy-samoobsluzhivaniya',
  'k5-hb-3': 'signalizatsiya-dva-kanala',
  'k5-hb-4': 'tri-strelka-mishen',
  'k5-hb-5': 'girlyanda-tri-sektsii',
  'k5-hb-6': 'pribor-tri-bloka',
  'k5-bv-1': 'vaza-yabloki-grushi',
  'k5-bv-2': 'dezhurnye-klass',
  'k5-bv-3': 'meshochek-shariki',
  'k5-bv-4': 'akvarium-rybki',
  'k5-bv-5': 'korzina-myachi',
  'k5-bv-6': 'loterejnye-bilety-pyat',
  'k5-bv-7': 'vaza-tyulpany',
  'k5-dr-1': 'avtobus-tramvay-shkola',
  'k5-dr-2': 'robot-pylesos',
  'k5-dr-3': 'tri-rabochikh-detali',
  'k5-sl-1': 'turisty-yazyki',
  'k5-sl-3': 'basketbolist-do-popadaniya',
  /* Новые картинки вместо прежних «не по условию» (KARTINKA_NE_PO_USLOVIYU):
     предметы на них нельзя пересчитать или их число совпадает с условием. */
  'k4-06': 'sad-foto',
  'k4-11': 'zhrebiy-mars',
  'k5-38': 'pirozhki-paket',
  'k5-60': 'kinder-princessy',
};
