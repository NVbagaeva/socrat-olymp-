/**
 * Уведомления на сайте (docs/kabinet-uvedomleniya.md, PR 3б): что
 * отдаёт база и чистые функции экрана — текст и ссылка события, время,
 * счётчик. Проверяет scripts/check-uvedomleniya.mjs.
 */

import { dz2ItogiHref, dz2ReshatHref } from '@/lib/dz2/links';

export type Sobytie =
  | 'dz_novoe'
  | 'dz_izmeneno'
  | 'dz_vozvrat'
  | 'dz_kommentariy'
  | 'dz_sdano'
  | 'dz_napominanie'
  | 'dz_srok'
  | 'dz_ne_sdali';

export const SOBYTIYA: readonly Sobytie[] = [
  'dz_novoe',
  'dz_izmeneno',
  'dz_vozvrat',
  'dz_kommentariy',
  'dz_sdano',
  'dz_napominanie',
  'dz_srok',
  'dz_ne_sdali',
];

/** Строка колокольчика (moi_uvedomleniya). */
export interface Uvedomlenie {
  id: number;
  event: Sobytie;
  homework_id?: string;
  payload: { za?: number; pozdno?: boolean; skolko?: number; vsego?: number; uchenik?: string };
  visible_at: string;
  read: boolean;
  title?: string;
  uchenik_name?: string;
}

export type Kanal = 'pochta' | 'push';

/** Настройки (moi_nastroyki_uvedomleniy). */
export interface Nastroyki {
  sobytiya: Sobytie[];
  kanaly: Partial<Record<Sobytie, Record<Kanal, boolean>>>;
  quiet_on: boolean;
  quiet_from: string;
  quiet_to: string;
  tz: string;
  digest: 'day' | 'week' | 'off';
  /** Каналы, которые сейчас работают на сайте (флаг базы). */
  dostupno: Kanal[];
}

/* ── Текст и ссылка ─────────────────────────────────────────────── */

const imyaDz = (title: string | undefined) =>
  `«${title === undefined || title === '' ? 'Без названия' : title}»`;

/**
 * Что показать в колокольчике. Ученику — на «ты», учителю — на «вы»,
 * без «мы» и без рода («сдано», а не «сдал»).
 */
export function tekst(u: Uvedomlenie): string {
  const dz = imyaDz(u.title);
  switch (u.event) {
    case 'dz_novoe':
      return `Новое ДЗ: ${dz}`;
    case 'dz_izmeneno':
      return `ДЗ ${dz} изменено — проверь срок и условия`;
    case 'dz_vozvrat':
      return `ДЗ ${dz} вернули на доработку`;
    case 'dz_kommentariy':
      return `Комментарий учителя к ДЗ ${dz}`;
    case 'dz_napominanie':
      return u.payload.za === 3
        ? `До дедлайна ДЗ ${dz} меньше 3 часов`
        : `До дедлайна ДЗ ${dz} меньше суток`;
    case 'dz_srok':
      return u.payload.pozdno === true
        ? `Срок ДЗ ${dz} прошёл — сдать ещё можно, с опозданием`
        : `Срок ДЗ ${dz} прошёл, приём закрыт`;
    case 'dz_sdano': {
      const kto = u.uchenik_name ?? 'Ученик';
      return u.payload.pozdno === true
        ? `${kto}: ДЗ ${dz} сдано с опозданием`
        : `${kto}: ДЗ ${dz} сдано`;
    }
    case 'dz_ne_sdali':
      return `ДЗ ${dz}: не сдали ${u.payload.skolko ?? 0} из ${u.payload.vsego ?? 0}`;
    default:
      return 'Уведомление';
  }
}

/** Куда ведёт уведомление: ученику — в ДЗ, учителю — в итоги. */
export function ssylka(u: Uvedomlenie): string | null {
  if (u.homework_id === undefined) return null;
  return u.event === 'dz_sdano' || u.event === 'dz_ne_sdali'
    ? dz2ItogiHref(u.homework_id)
    : dz2ReshatHref(u.homework_id);
}

/** Важность для значка: срок и доработка — оранжевые, остальное — синее. */
export function vazhnoe(u: Uvedomlenie): boolean {
  return (
    u.event === 'dz_srok' ||
    u.event === 'dz_vozvrat' ||
    (u.event === 'dz_napominanie' && u.payload.za === 3)
  );
}

/* ── Время ───────────────────────────────────────────────────────── */

/**
 * «только что», «5 мин назад», «3 ч назад», «вчера в 18:05», «12 ноября
 * в 9:30» — во времени устройства.
 */
export function kogda(iso: string, now = Date.now(), timeZone?: string): string {
  const t = Date.parse(iso);
  const sek = Math.max(0, Math.round((now - t) / 1000));
  if (sek < 60) return 'только что';
  if (sek < 3600) return `${Math.floor(sek / 60)} мин назад`;
  const opts = timeZone === undefined ? {} : { timeZone };
  const den = (x: number) =>
    new Date(x).toLocaleDateString('ru-RU', {
      ...opts,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  const chasy = new Date(t).toLocaleTimeString('ru-RU', {
    ...opts,
    hour: 'numeric',
    minute: '2-digit',
  });
  if (den(t) === den(now)) return `${Math.floor(sek / 3600)} ч назад`;
  if (den(t) === den(now - 86400000)) return `вчера в ${chasy}`;
  const data = new Date(t).toLocaleDateString('ru-RU', { ...opts, day: 'numeric', month: 'long' });
  return `${data} в ${chasy}`;
}

/** Счётчик на колокольчике: до 99, дальше «99+»; ноль — без значка. */
export function schetchik(n: number): string | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 99 ? '99+' : String(Math.floor(n));
}

/* ── Настройки ───────────────────────────────────────────────────── */

/** Часовые пояса России для выбора; текущий, если его нет в списке, — добавляется. */
export const POYASA: readonly { tz: string; nazvanie: string }[] = [
  { tz: 'Europe/Kaliningrad', nazvanie: 'Калининград (МСК−1)' },
  { tz: 'Europe/Moscow', nazvanie: 'Москва (МСК)' },
  { tz: 'Europe/Samara', nazvanie: 'Самара (МСК+1)' },
  { tz: 'Asia/Yekaterinburg', nazvanie: 'Екатеринбург (МСК+2)' },
  { tz: 'Asia/Omsk', nazvanie: 'Омск (МСК+3)' },
  { tz: 'Asia/Novosibirsk', nazvanie: 'Новосибирск (МСК+4)' },
  { tz: 'Asia/Krasnoyarsk', nazvanie: 'Красноярск (МСК+4)' },
  { tz: 'Asia/Irkutsk', nazvanie: 'Иркутск (МСК+5)' },
  { tz: 'Asia/Yakutsk', nazvanie: 'Якутск (МСК+6)' },
  { tz: 'Asia/Vladivostok', nazvanie: 'Владивосток (МСК+7)' },
  { tz: 'Asia/Magadan', nazvanie: 'Магадан (МСК+8)' },
  { tz: 'Asia/Kamchatka', nazvanie: 'Камчатка (МСК+9)' },
];

export function poyasa(tekushchiy: string): { tz: string; nazvanie: string }[] {
  return POYASA.some((p) => p.tz === tekushchiy)
    ? [...POYASA]
    : [...POYASA, { tz: tekushchiy, nazvanie: tekushchiy }];
}

/** Время «ЧЧ:ММ» — то же правило, что у базы. */
export function vremyaVerno(s: string): boolean {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(s);
}

/** Запрос сохранения: только то, что меняет экран. */
export function zapros(n: Nastroyki): Partial<Nastroyki> {
  return {
    kanaly: n.kanaly,
    quiet_on: n.quiet_on,
    quiet_from: n.quiet_from,
    quiet_to: n.quiet_to,
    tz: n.tz,
    digest: n.digest,
  };
}

/* ── Push на этом устройстве (PR 3г) ─────────────────────────────── */

/** Что умеет браузер — собирает lib/uvedomleniya/push.ts. */
export interface PushVozmozhnosti {
  sw: boolean;
  pushManager: boolean;
  notification: boolean;
  /** iPhone или iPad (в том числе iPad, который называет себя Mac). */
  ios: boolean;
  /** Сайт открыт с экрана «Домой». */
  standalone: boolean;
  permission: 'default' | 'granted' | 'denied';
}

export type PushSostoyanie =
  /** iPhone в Safari: push только с экрана «Домой» (iOS 16.4+). */
  | 'ios'
  /** Браузер не умеет push. */
  | 'net'
  /** Уведомления сайту запрещены в браузере. */
  | 'zapret'
  | 'vykl'
  | 'vkl';

export function pushSostoyanie(v: PushVozmozhnosti, podpiska: boolean): PushSostoyanie {
  const umeet = v.sw && v.pushManager && v.notification;
  if (v.ios && !v.standalone && !umeet) return 'ios';
  if (!umeet) return 'net';
  if (v.permission === 'denied') return 'zapret';
  return podpiska && v.permission === 'granted' ? 'vkl' : 'vykl';
}

/** iPhone, iPod, iPad — и iPad с «настольным» Safari (Macintosh + касания). */
export function etoIos(ua: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
}

/** Открытый ключ VAPID (base64url) → байты для applicationServerKey. */
export function klyuchVBayty(b64u: string): Uint8Array<ArrayBuffer> {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob(pad);
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
