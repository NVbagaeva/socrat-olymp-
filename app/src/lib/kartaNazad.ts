/**
 * «← К карте»: откуда пришли на страницы заданий.
 *
 * Нажали на карте («Карта ЕГЭ» в кабинете ученика или на /karta/)
 * ссылку на раздел — карта записывает в sessionStorage этой вкладки
 * браузера «метку»: адрес карты, где она стояла на экране, вид холста,
 * что было выбрано и с какого раздела ушли. Пока ученик ходит по
 * страницам заданий (/zadaniya/…, /baza/…) — по вкладкам раздела и по
 * другим заданиям, — метка живёт, и над вкладками стоит «← К карте».
 * Ушёл на любую другую страницу (главная, тарифы) — метка стирается:
 * пришедшему на задание с главной или по прямой ссылке кнопки нет.
 *
 * История браузера. Первый переход с карты — обычный (push): карта
 * остаётся записью в истории. Дальше, пока метка жива, переходы между
 * страницами заданий идут заменой записи (replace, KartaNazad.tsx): так
 * «назад» в браузере и жест «назад» на телефоне с любой вкладки и с
 * любого задания возвращают сразу на карту, без промежуточных шагов.
 * Кнопка делает то же самое (history.back()), если в истории за это
 * время ничего не добавилось; иначе — переходит на адрес карты.
 *
 * Вернулись на карту — она берёт метку (vzyatVozvrat) и ставит всё как
 * было: прокрутку, вид, выбор, мягко подсвечивает раздел, с которого
 * ушли. Тренировка в тренажёре живёт в своём хранилище и от этого не
 * сбрасывается.
 */

import { AUTH_HREF } from '@/lib/auth/config';
import { KARTA_NAZAD_KLYUCH as KLYUCH } from './kartaNazadKlyuch';

/** Адрес страницы «Карта ЕГЭ» (KabinetRaskladka: KARTA_HREF). */
export const KARTA_STRANICA = '/karta/';

/** Где на карте стояли и что было выбрано. */
export interface KartaMetka {
  /** Адрес карты: /kabinet/ или /karta/ (с ?… если был). */
  href: string;
  /** Верх карты относительно окна в момент ухода: прокрутка страницы. */
  verh: number;
  /** Ширина окна: вид холста восстанавливается только на той же. */
  shirina: number;
  /** Вид холста (масштаб и сдвиг); null — список на телефоне. */
  vid: { k: number; x: number; y: number } | null;
  /** Выбор на карте (как Vybor в KartaEkran). */
  vybor: unknown;
  /** Раздел, с которого ушли: его карта подсветит. */
  no: number | null;
  /** Метка действует: ученик на страницах заданий. */
  zhivaya: boolean;
  /** Длина истории на первой странице после карты (для кнопки). */
  dlina: number | null;
}

function hranilishche(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function prochitatMetku(): KartaMetka | null {
  try {
    const raw = hranilishche()?.getItem(KLYUCH);
    if (raw == null) return null;
    const m = JSON.parse(raw) as KartaMetka;
    return typeof m === 'object' && m !== null && typeof m.href === 'string' ? m : null;
  } catch {
    return null;
  }
}

export function zapisatMetku(m: KartaMetka): void {
  try {
    hranilishche()?.setItem(KLYUCH, JSON.stringify(m));
  } catch {
    /* Хранилище недоступно — кнопки просто не будет. */
  }
}

export function steretMetku(): void {
  try {
    hranilishche()?.removeItem(KLYUCH);
  } catch {
    /* нечего стирать */
  }
}

const bezSlesha = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

/** Страница заданий: банк, разделы профиля и базы со всеми вкладками. */
export function stranicaZadaniy(pathname: string): boolean {
  return /^\/(zadaniya|baza)(\/|$)/.test(pathname);
}

/** Страница, где стоит карта. */
export function stranicaKarty(pathname: string): boolean {
  const p = bezSlesha(pathname);
  return p === bezSlesha(KARTA_STRANICA) || p === bezSlesha(AUTH_HREF.kabinet);
}

/** Тот же адрес карты, без строки запроса и хвостовой «/». */
export function tazheKarta(m: KartaMetka, pathname: string): boolean {
  return bezSlesha(m.href.split(/[?#]/)[0] ?? '') === bezSlesha(pathname);
}

/** Метка, по которой показывается кнопка на этой странице. */
export function metkaDlyaKnopki(pathname: string): KartaMetka | null {
  const m = prochitatMetku();
  return m !== null && m.zhivaya && stranicaZadaniy(pathname) ? m : null;
}

/**
 * Сторож (NavigationGuard в корневом layout): страница сменилась — решить судьбу метки.
 *   страница заданий — метка живёт (на первой запоминается длина истории);
 *   та же карта — метка ждёт карту, но больше не живая;
 *   любая другая — метка стирается.
 * Страница открыта заново по ссылке извне или набранным адресом — тоже
 * стирается: на задание пришли не с карты (pervyy — первая страница,
 * открытая в этой вкладке загрузкой, а не переходом внутри сайта).
 */
export function storozh(pathname: string, pervyy: boolean): void {
  const m = prochitatMetku();
  if (m === null) return;
  if (pervyy) {
    const nav = performance.getEntriesByType?.('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    let svoy = false;
    try {
      svoy = document.referrer !== '' && new URL(document.referrer).origin === location.origin;
    } catch {
      svoy = false;
    }
    if (nav?.type === 'navigate' && !svoy) {
      steretMetku();
      return;
    }
  }
  if (stranicaZadaniy(pathname)) {
    if (!m.zhivaya) steretMetku();
    else if (m.dlina === null) zapisatMetku({ ...m, dlina: window.history.length });
    return;
  }
  if (stranicaKarty(pathname) && tazheKarta(m, pathname)) {
    if (m.zhivaya) zapisatMetku({ ...m, zhivaya: false });
    return;
  }
  steretMetku();
}

/** Карта забирает метку, если вернулись на неё (живая или нет). */
export function vzyatVozvrat(pathname: string): KartaMetka | null {
  const m = prochitatMetku();
  if (m === null || !tazheKarta(m, pathname)) return null;
  steretMetku();
  return m;
}
