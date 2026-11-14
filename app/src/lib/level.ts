/**
 * Уровень экзамена: профильная или базовая математика.
 *
 * Уровень — параметр, а не второй сайт: страницы, сетка заданий, шапка,
 * сборщик варианта получают его и берут отсюда адреса, подписи и
 * префикс ключей хранилища. Профиль — уровень по умолчанию: его адреса
 * и ключи не меняются (/zadaniya/, «kartochki:7:v1»).
 *
 * Чистый модуль без браузера: его берут и серверные страницы, и
 * проверки на Node. Запоминание выбранного уровня — lib/levelStore.ts.
 */

import { href, ZADANIYA } from './paths';

export type Level = 'profile' | 'base';

export const LEVELS: readonly Level[] = ['profile', 'base'];

/** Начало адресов базы — без «/» на конце, как ZADANIYA. */
export const BAZA = '/baza';

export interface LevelInfo {
  id: Level;
  /** Подпись переключателя и метки у номера задания. */
  label: string;
  /** Полное название уровня: подпись сайдбара, тексты. */
  name: string;
  /** Номера заданий с кратким ответом: вкладки над списком. */
  range: string;
  /** Сколько заданий с кратким ответом. */
  count: number;
  /** Главная уровня. */
  home: string;
  /** Начало адресов банка без «/» на конце: к нему дописывают номер. */
  bankBase: string;
  /** Страница банка заданий (ссылка). */
  bank: string;
  /** Сборщик варианта. */
  variant: string;
  /** Префикс ключей хранилища: у профиля пустой — ключи прежние. */
  storage: string;
}

const INFO: Readonly<Record<Level, LevelInfo>> = {
  profile: {
    id: 'profile',
    label: 'Профиль',
    name: 'Профильная математика',
    range: '1–13',
    count: 13,
    home: '/',
    bankBase: ZADANIYA,
    bank: href(ZADANIYA),
    variant: '/variant/',
    storage: '',
  },
  base: {
    id: 'base',
    label: 'База',
    name: 'Базовая математика',
    range: '1–21',
    count: 21,
    home: href(BAZA),
    bankBase: `${BAZA}${ZADANIYA}`,
    bank: href(BAZA, ZADANIYA),
    variant: href(BAZA, 'variant'),
    storage: 'baza:',
  },
};

export function levelInfo(level: Level): LevelInfo {
  return INFO[level];
}

/** Ключ хранилища уровня: у профиля — как был, у базы — с префиксом. */
export function levelKey(level: Level, key: string): string {
  return INFO[level].storage + key;
}

/* Адреса, которые сами говорят об уровне. Остальные страницы (об авторе,
   тарифы, кабинет) уровня не задают — на них действует запомненный. */
const PROFILE_PATHS = [ZADANIYA, '/variant', '/povyshennye', '/ezhemesyachnye'];

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Уровень по адресу. /baza/… — всегда база; главная, банк и варианты
 * профиля — профиль; null — адрес об уровне молчит.
 */
export function levelOfPath(pathname: string): Level | null {
  const path = pathname.split(/[?#]/)[0] ?? '';
  if (under(path, BAZA)) return 'base';
  if (path === '/' || path === '') return 'profile';
  return PROFILE_PATHS.some((prefix) => under(path, prefix)) ? 'profile' : null;
}

/**
 * Куда ведёт переключатель уровня с этой страницы: банк — в банк,
 * вариант — в сборщик варианта, остальное — на главную уровня. Страница
 * задания ведёт в банк другого уровня: номера у уровней разные, а пары
 * «это же задание» показывает своя плашка.
 */
export function levelTwin(pathname: string, to: Level): string {
  const path = pathname.split(/[?#]/)[0] ?? '';
  const from = levelOfPath(path);
  const rest = from === 'base' ? path.slice(BAZA.length) || '/' : path;
  if (under(rest, ZADANIYA)) return INFO[to].bank;
  if (rest === '/variant/' || rest === '/variant') return INFO[to].variant;
  return INFO[to].home;
}
