/* content/struktura.js — структура экзамена: какой раздел на каком номере.

   Единственное место, где записано, под каким номером ЕГЭ идёт раздел,
   в какой он части и сколько баллов даёт. Остальной код номер не
   пишет, а спрашивает его здесь. Сменилась структура экзамена —
   правится этот файл (план — docs/ege-2027-struktura-shag-0.md).

   Три понятия:

   код раздела     — 'uravneniya'. Постоянное имя раздела.
   номер хранения  — 7. Под ним раздел записан: в базе (ege_tasks.no,
                     коды прототипов «7:P01»), в ключах браузера
                     (budetege:zadanie-7:log:v1), в кодах вариантов и
                     комплектов, в именах файлов и папок (task-07.webp,
                     lib/zadanie7). Не меняется никогда: на нём держится
                     всё сохранённое.
   номер ЕГЭ       — номер задания на экзамене. Только для показа:
                     в структуре из 19 заданий «Уравнения» — задание 6.

   Номера в комментариях кода и в именах файлов — номера хранения.

   Файл — простой JavaScript: его читают и страницы сайта, и служебные
   скрипты Node (сборка PDF и каталогов), которым TypeScript недоступен.
   Проверка — scripts/check-struktura.mjs (pnpm test:struktura). */

/**
 * @typedef {'planimetriya' | 'vektory' | 'stereometriya' | 'veroyatnost'
 *   | 'slozhnaya-veroyatnost' | 'sluchainye-velichiny' | 'uravneniya' | 'vychisleniya'
 *   | 'proizvodnaya' | 'prikladnye-zadachi' | 'tekstovye-zadachi' | 'grafiki-funkciy'
 *   | 'ekonomika' | 'uravnenie-s-otborom' | 'stereometriya-dokazatelstvo' | 'neravenstvo'
 *   | 'optimizaciya' | 'planimetriya-dokazatelstvo' | 'parametr' | 'chisla'
 *   | 'naibolshee-naimenshee'} RazdelKod
 */

/**
 * Раздел банка.
 * @typedef {object} Razdel
 * @property {RazdelKod} kod Код раздела.
 * @property {number} hranenie Номер хранения.
 */

/**
 * Раздел вне экзамена: в действующей структуре у него нет номера.
 * @typedef {object} VneEkzamena
 * @property {string} prichina Подпись плашки для администратора.
 * @property {1 | 2} chast В какой части раздел был: для его собственных страниц.
 * @property {number} ball Балл за задачу раздела: для уже решённых работ.
 * @property {boolean} [otkryt] true — страницы раздела открыты всем.
 *   Без этого поля раздел вне экзамена скрыт: посетителю его адрес
 *   отвечает 404, администратор видит раздел с плашкой prichina.
 */

/**
 * Шкала перевода первичных баллов в тестовые.
 * @typedef {object} Shkala
 * @property {readonly number[]} tablitsa tablitsa[k] — тестовый балл за k первичных.
 * @property {boolean} predvaritelnaya Официальной шкалы под эту структуру ещё
 *   нет: на сайте рядом с тестовым баллом стоит пометка.
 * @property {string} istochnik Откуда таблица — подпись под баллом.
 */

/**
 * Структура экзамена.
 * @typedef {object} Struktura
 * @property {string} id Имя структуры: пишется в сохранённые данные.
 * @property {string} podpis Как назвать структуру человеку.
 * @property {number} chast1 Сколько заданий в первой части.
 * @property {readonly (readonly [RazdelKod, number])[]} zadaniya
 *   Задания по порядку номеров ЕГЭ: раздел и максимальный балл.
 * @property {Readonly<Partial<Record<RazdelKod, RazdelKod>>>} vnutri
 *   Раздел без своего номера, который идёт внутри другого: его задачи
 *   показываются под номером «хозяина».
 * @property {Shkala} shkala Перевод первичных баллов в тестовые.
 * @property {Readonly<Partial<Record<RazdelKod, VneEkzamena>>>} vne
 *   Разделы вне экзамена: в банке, меню и вариантах их нет, страницы
 *   скрыты (см. skryt). Раздел не удаляется: код, данные и прогресс
 *   учеников остаются. Вернуть раздел — одна правка здесь: поставить
 *   otkryt: true (страницы снова открыты всем) или перенести раздел
 *   из vne в zadaniya на его номер (раздел снова в экзамене).
 */

/**
 * Все разделы банка. Номер хранения новому разделу — следующий
 * свободный; занятые не переиспользуются.
 * @type {readonly Razdel[]}
 */
export const RAZDELY = [
  { kod: 'planimetriya', hranenie: 1 },
  { kod: 'vektory', hranenie: 2 },
  { kod: 'stereometriya', hranenie: 3 },
  { kod: 'veroyatnost', hranenie: 4 },
  { kod: 'slozhnaya-veroyatnost', hranenie: 5 },
  { kod: 'sluchainye-velichiny', hranenie: 6 },
  { kod: 'uravneniya', hranenie: 7 },
  { kod: 'vychisleniya', hranenie: 8 },
  { kod: 'proizvodnaya', hranenie: 9 },
  { kod: 'prikladnye-zadachi', hranenie: 10 },
  { kod: 'tekstovye-zadachi', hranenie: 11 },
  { kod: 'grafiki-funkciy', hranenie: 12 },
  { kod: 'ekonomika', hranenie: 13 },
  { kod: 'uravnenie-s-otborom', hranenie: 14 },
  { kod: 'stereometriya-dokazatelstvo', hranenie: 15 },
  { kod: 'neravenstvo', hranenie: 16 },
  { kod: 'optimizaciya', hranenie: 17 },
  { kod: 'planimetriya-dokazatelstvo', hranenie: 18 },
  { kod: 'parametr', hranenie: 19 },
  { kod: 'chisla', hranenie: 20 },
  { kod: 'naibolshee-naimenshee', hranenie: 21 },
];

/**
 * Последняя официальная шкала профильной математики: ЕГЭ-2026, таблица
 * соответствия первичных и тестовых баллов Рособрнадзора
 * (obrnadzor.gov.ru, апрель 2026; решения комиссии от 30.03.2026
 * № 04-1/КИД и следующие). Совпадает со шкалой 2025 года. Максимум —
 * 32 первичных балла: столько же, сколько в ЕГЭ-2027 из 19 заданий.
 * Выйдет шкала 2027 года — заменить таблицу в структуре и снять
 * пометку predvaritelnaya.
 */
const SHKALA_2026 = [
  0, 6, 11, 17, 22, 27, 34, 40, 46, 52, 58, 64, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94,
  95, 96, 97, 98, 99, 100, 100, 100,
];

/**
 * Проект ЕГЭ-2027 из 20 заданий: 13 в первой части, 7 во второй.
 * Номер ЕГЭ здесь совпадает с номером хранения — с этой структуры
 * сайт начинался.
 * @type {Struktura}
 */
const STRUKTURA_2027_20 = {
  id: '2027-20',
  podpis: 'проект ЕГЭ-2027 из 20 заданий',
  chast1: 13,
  zadaniya: [
    ['planimetriya', 1],
    ['vektory', 1],
    ['stereometriya', 1],
    ['veroyatnost', 1],
    ['slozhnaya-veroyatnost', 1],
    ['sluchainye-velichiny', 1],
    ['uravneniya', 1],
    ['vychisleniya', 1],
    ['proizvodnaya', 1],
    ['prikladnye-zadachi', 1],
    ['tekstovye-zadachi', 1],
    ['grafiki-funkciy', 1],
    ['ekonomika', 1],
    ['uravnenie-s-otborom', 2],
    ['stereometriya-dokazatelstvo', 3],
    ['neravenstvo', 2],
    ['optimizaciya', 2],
    ['planimetriya-dokazatelstvo', 3],
    ['parametr', 4],
    ['chisla', 4],
  ],
  vnutri: {},
  /* Первичных баллов в этой структуре 33: шкала на 32 балла равномерно
     растягивается (content/variantOnline/shkala.ts). */
  shkala: {
    tablitsa: SHKALA_2026,
    predvaritelnaya: true,
    istochnik:
      'Шкала Рособрнадзора для ЕГЭ-2026 по профильной математике; под формат 2027 года — ориентировочно',
  },
  vne: {
    'naibolshee-naimenshee': {
      prichina: 'Раздела нет в структуре из 20 заданий',
      chast: 1,
      ball: 1,
    },
  },
};

/**
 * ЕГЭ-2027 по демоверсии от 12.11.2026: 19 заданий, 12 в первой части,
 * 7 во второй, 32 первичных балла. «Случайных величин» в экзамене нет;
 * экономическая задача — во второй части, задачи на оптимизацию идут
 * внутри неё.
 * @type {Struktura}
 */
const STRUKTURA_2027_19 = {
  id: '2027-19',
  podpis: 'ЕГЭ-2027',
  chast1: 12,
  zadaniya: [
    ['planimetriya', 1],
    ['vektory', 1],
    ['stereometriya', 1],
    ['veroyatnost', 1],
    ['slozhnaya-veroyatnost', 1],
    ['uravneniya', 1],
    ['vychisleniya', 1],
    ['proizvodnaya', 1],
    ['prikladnye-zadachi', 1],
    ['tekstovye-zadachi', 1],
    ['grafiki-funkciy', 1],
    ['naibolshee-naimenshee', 1],
    ['uravnenie-s-otborom', 2],
    ['stereometriya-dokazatelstvo', 3],
    ['neravenstvo', 2],
    ['ekonomika', 2],
    ['planimetriya-dokazatelstvo', 3],
    ['parametr', 4],
    ['chisla', 4],
  ],
  vnutri: { optimizaciya: 'ekonomika' },
  shkala: {
    tablitsa: SHKALA_2026,
    predvaritelnaya: true,
    istochnik:
      'Шкала Рособрнадзора для ЕГЭ-2026 по профильной математике; для ЕГЭ-2027 — предварительная',
  },
  vne: {
    'sluchainye-velichiny': { prichina: 'Скрыт — нет в ЕГЭ-2027', chast: 1, ball: 1 },
  },
};

/** Все структуры по имени. */
export const STRUKTURY = {
  '2027-20': STRUKTURA_2027_20,
  '2027-19': STRUKTURA_2027_19,
};

/**
 * Действующая структура — ЕГЭ-2027 из 19 заданий (сайт переключён в
 * PR 6 плана). Прежнюю структуру из 20 заданий можно собрать для
 * сверки: STRUKTURA_EGE=2027-20 pnpm build (next.config.ts) — только
 * для проверки, не для выкладки. На ней же идут прежние проверки,
 * которые сверяют номера 1–13 (CI задаёт переменную сам).
 * @type {Struktura}
 */
export const STRUKTURA =
  process.env.STRUKTURA_EGE === '2027-20' ? STRUKTURA_2027_20 : STRUKTURA_2027_19;

/* ── Разделы ─────────────────────────────────────────────────────── */

/**
 * Раздел по коду или по номеру хранения.
 * @param {RazdelKod | number} x
 * @returns {Razdel}
 */
export function razdel(x) {
  const found = RAZDELY.find((r) => (typeof x === 'number' ? r.hranenie === x : r.kod === x));
  if (found === undefined) {
    throw new Error(`Нет раздела «${x}» в content/struktura.js`);
  }
  return found;
}

/**
 * Есть ли раздел с таким кодом или номером хранения.
 * @param {string | number} x
 * @returns {boolean}
 */
export function estRazdel(x) {
  return RAZDELY.some((r) => (typeof x === 'number' ? r.hranenie === x : r.kod === x));
}

/* ── Номер, часть, балл ──────────────────────────────────────────── */

/**
 * Номер задания ЕГЭ у раздела; null — раздела в экзамене нет.
 * Раздел, который идёт внутри другого, получает номер «хозяина».
 * @param {RazdelKod | number} x Код раздела или номер хранения.
 * @param {Struktura} [s]
 * @returns {number | null}
 */
export function nomerEge(x, s = STRUKTURA) {
  const { kod } = razdel(x);
  const hozyain = s.vnutri[kod] ?? kod;
  const mesto = s.zadaniya.findIndex(([k]) => k === hozyain);
  return mesto === -1 ? null : mesto + 1;
}

/**
 * Номер для показа — всегда число: номер ЕГЭ, а у раздела вне экзамена
 * — его номер хранения. Для текстов самого раздела («Задание №7.
 * Уравнения»): страницы скрытого раздела собираются и должны читаться.
 * @param {RazdelKod | number} x
 * @param {Struktura} [s]
 * @returns {number}
 */
export function nomerRazdela(x, s = STRUKTURA) {
  return nomerEge(x, s) ?? razdel(x).hranenie;
}

/**
 * Номер для показа двумя цифрами: «07» — как на карточках банка.
 * @param {RazdelKod | number} x
 * @param {Struktura} [s]
 * @returns {string}
 */
export function nomerDvumya(x, s = STRUKTURA) {
  return String(nomerRazdela(x, s)).padStart(2, '0');
}

/**
 * Раздел в экзамене: со своим номером или внутри другого раздела.
 * @param {RazdelKod | number} x
 * @param {Struktura} [s]
 * @returns {boolean}
 */
export function vEkzamene(x, s = STRUKTURA) {
  return nomerEge(x, s) !== null;
}

/**
 * Почему раздел скрыт: подпись плашки. null — раздел в экзамене.
 * @param {RazdelKod | number} x
 * @param {Struktura} [s]
 * @returns {string | null}
 */
export function prichinaSkrytiya(x, s = STRUKTURA) {
  return s.vne[razdel(x).kod]?.prichina ?? null;
}

/**
 * Раздел скрыт: его нет в экзамене, и его страницы закрыты от
 * посетителей. Как именно закрыты — components/tasks/skrytye и
 * scripts/build-skrytye.mjs; проверка — scripts/check-skrytye.mjs.
 * @param {RazdelKod | number} x
 * @param {Struktura} [s]
 * @returns {boolean}
 */
export function skryt(x, s = STRUKTURA) {
  const vne = s.vne[razdel(x).kod];
  return vne !== undefined && vne.otkryt !== true;
}

/**
 * Часть экзамена, в которой стоит раздел.
 * @param {RazdelKod | number} x
 * @param {Struktura} [s]
 * @returns {1 | 2}
 */
export function chastRazdela(x, s = STRUKTURA) {
  const nomer = nomerEge(x, s);
  if (nomer === null) {
    return vneEkzamena(x, s).chast;
  }
  return nomer <= s.chast1 ? 1 : 2;
}

/**
 * «первая часть» / «вторая часть» — для подписей вроде «Задание №7 ·
 * первая часть».
 * @param {RazdelKod | number} x
 * @param {Struktura} [s]
 * @returns {string}
 */
export function slovoChasti(x, s = STRUKTURA) {
  return chastRazdela(x, s) === 1 ? 'первая часть' : 'вторая часть';
}

/**
 * Максимальный первичный балл за задачу раздела.
 * @param {RazdelKod | number} x
 * @param {Struktura} [s]
 * @returns {number}
 */
export function maxBall(x, s = STRUKTURA) {
  const nomer = nomerEge(x, s);
  if (nomer === null) {
    return vneEkzamena(x, s).ball;
  }
  return /** @type {readonly [RazdelKod, number]} */ (s.zadaniya[nomer - 1])[1];
}

/**
 * @param {RazdelKod | number} x
 * @param {Struktura} s
 * @returns {VneEkzamena}
 */
function vneEkzamena(x, s) {
  const { kod } = razdel(x);
  const vne = s.vne[kod];
  if (vne === undefined) {
    throw new Error(`Раздел «${kod}» не стоит в структуре ${s.id} и не записан в vne`);
  }
  return vne;
}

/* ── Задания по порядку ──────────────────────────────────────────── */

/**
 * Задание экзамена: номер, раздел, часть, балл.
 * @typedef {object} ZadanieEge
 * @property {number} nomer Номер ЕГЭ.
 * @property {RazdelKod} kod
 * @property {number} hranenie
 * @property {1 | 2} chast
 * @property {number} ball Максимальный первичный балл.
 */

/**
 * Все задания экзамена по порядку номеров.
 * @param {Struktura} [s]
 * @returns {ZadanieEge[]}
 */
export function zadaniyaEge(s = STRUKTURA) {
  return s.zadaniya.map(([kod, ball], i) => ({
    nomer: i + 1,
    kod,
    hranenie: razdel(kod).hranenie,
    chast: i < s.chast1 ? 1 : 2,
    ball,
  }));
}

/**
 * «1–13»: номера заданий части — для подписей «задания 1–13».
 * @param {1 | 2} chast
 * @param {Struktura} [s]
 * @returns {string}
 */
export function nomeraChasti(chast, s = STRUKTURA) {
  const nomera = zadaniyaEge(s)
    .filter((z) => z.chast === chast)
    .map((z) => z.nomer);
  return `${nomera[0]}–${nomera[nomera.length - 1]}`;
}

/**
 * Раздел, который стоит на номере ЕГЭ.
 * @param {number} nomer
 * @param {Struktura} [s]
 * @returns {Razdel}
 */
export function razdelNomera(nomer, s = STRUKTURA) {
  const zadanie = s.zadaniya[nomer - 1];
  if (zadanie === undefined) {
    throw new Error(`В структуре ${s.id} нет задания ${nomer}`);
  }
  return razdel(zadanie[0]);
}

/**
 * Максимум первичных баллов: за часть или за всю работу.
 * @param {1 | 2} [chast]
 * @param {Struktura} [s]
 * @returns {number}
 */
export function maxPervichnyy(chast, s = STRUKTURA) {
  return zadaniyaEge(s)
    .filter((z) => chast === undefined || z.chast === chast)
    .reduce((summa, z) => summa + z.ball, 0);
}
