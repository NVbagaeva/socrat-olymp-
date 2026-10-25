/**
 * Картинки сюжетов задания №4.
 *
 * Сюжет — прототип банка (lib/veroyatnost/bank4). Их показывал прежний
 * экран генератора на карточках сюжетов; общий генератор (components/
 * generator) карточек с картинками не рисует, поэтому сейчас картинки
 * не выводятся — соответствие «сюжет → картинка» сохранено для
 * тренажёра и будущих экранов. Картинки лежат в
 * app/public/images/veroyatnost-4/syuzhety/ (исходники PNG — в
 * assets/img/veroyatnost-4/), у одной картинки может быть несколько
 * сюжетов: у «Жребий: кому начинать игру» и «Жребий: начинать будет
 * не он» одна шахматная доска, у двух задач про билеты — одни билеты,
 * у двух задач про сумки — одни сумки, а у двух задач про отрезок —
 * отрезок из превью опорных задач.
 *
 * Прототип без картинки здесь не записан. У задания №5 картинок
 * сюжетов пока нет.
 */

const PAPKA = '/images/veroyatnost-4/syuzhety';

export interface KartinkaSyuzheta {
  /** Путь от корня public; версию добавляет assetUrl на экране. */
  src: string;
  alt: string;
}

const K = (fayl: string, alt: string): KartinkaSyuzheta => ({ src: `${PAPKA}/${fayl}.webp`, alt });

const VERTOLET = K('p4-01', 'Вертолёт с пассажирами');
const SHLYAPA = K('p4-02', 'Шляпа с жребиями');
const VYSHKA = K('p4-03', 'Вышка для прыжков и бассейн');
const SHAHMATY = K('p4-04', 'Шахматная доска с фигурами');
const CHASY = K('p4-05', 'Механические часы');
const YADRO = K('p4-06', 'Ядро и флажки стран');
const TRIBUNA = K('p4-07', 'Трибуна и кресла зала');
const BILETY = K('p4-08', 'Экзаменационные билеты');
const TAKSI = K('p4-09', 'Машины такси');
const GIMNASTIKA = K('p4-10', 'Гимнастки на помосте');
const KALENDAR = K('p4-11', 'Календарь конференции');
const AUDITORII = K('p4-12', 'Аудитории с партами');
const STSENA = K('p4-13', 'Сцена конкурса');
const SETKA = K('p4-14', 'Турнирная сетка');
const GRUPPY = K('p4-15', 'Две группы участников');
const MONETA = K('p4-16', 'Монета');
const MYACH = K('p4-17', 'Мяч и монета судьи');
const KOSTI = K('p4-18', 'Две игральные кости');
const NASOS = K('p4-19', 'Садовый насос');
const SUMKI = K('p4-20', 'Сумки на фабрике');
const OTREZOK: KartinkaSyuzheta = {
  src: '/images/veroyatnost-4/otrezok.webp',
  alt: 'Отрезок с выделенным участком',
};

/** Код прототипа → картинка. */
export const KARTINKI_SYUZHETOV: Record<string, KartinkaSyuzheta> = {
  'p4-01': VERTOLET,
  'p4-02': SHLYAPA,
  'p4-03': VYSHKA,
  'p4-04': SHAHMATY,
  'p4-24': SHAHMATY,
  'p4-05': CHASY,
  'p4-06': YADRO,
  'p4-07': TRIBUNA,
  'p4-08': BILETY,
  'p4-25': BILETY,
  'p4-09': TAKSI,
  'p4-10': GIMNASTIKA,
  'p4-11': KALENDAR,
  'p4-12': AUDITORII,
  'p4-13': STSENA,
  'p4-14': SETKA,
  'p4-15': GRUPPY,
  'p4-16': MONETA,
  'p4-17': MYACH,
  'p4-18': KOSTI,
  'p4-19': NASOS,
  'p4-20': SUMKI,
  'p4-21': SUMKI,
  'p4-22': OTREZOK,
  'p4-23': OTREZOK,
};
