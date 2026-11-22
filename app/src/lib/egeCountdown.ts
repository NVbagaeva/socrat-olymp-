/**
 * Логика обратного отсчёта до ЕГЭ (плашка на главной). Чистые функции
 * без React и без «сейчас» внутри: момент времени всегда приходит
 * аргументом — так состояния проверяются подменой даты
 * (scripts/check-ege-countdown.mjs).
 *
 * Всё считается по Москве. Москва — UTC+3 круглый год, без перевода
 * часов, поэтому хватает арифметики и не нужен Intl с часовыми поясами.
 */

import type { EgeCel } from '@/config/ege-countdown';
import { plural } from './plural';

const SEK = 1000;
const MIN = 60 * SEK;
const CHAS = 60 * MIN;
const SUTKI = 24 * CHAS;
const MSK = 3 * CHAS;

/** Момент «дата и время по Москве» в миллисекундах эпохи. */
export function mskMoment(data: string, vremya = '00:00'): number {
  const [g = 0, m = 1, d = 1] = data.split('-').map(Number);
  const [ch = 0, mi = 0] = vremya.split(':').map(Number);
  return Date.UTC(g, m - 1, d, ch, mi) - MSK;
}

/** Номер московского календарного дня (сутки от эпохи по Москве). */
export function mskDen(ms: number): number {
  return Math.floor((ms + MSK) / SUTKI);
}

/**
 * Фаза плашки:
 *  dni      — до экзамена больше суток: крупно дни, рядом ч : м : с;
 *  sutki    — меньше суток, но по календарю экзамен ещё завтра;
 *  segodnya — московский день экзамена, с полуночи до полуночи.
 */
export type Faza = 'dni' | 'sutki' | 'segodnya';

export type Sostoyanie = {
  cel: EgeCel;
  /** Номер цели в списке. */
  idx: number;
  faza: Faza;
  /** Полных суток до начала экзамена (в фазе dni — не меньше 1). */
  dni: number;
  chasy: number;
  minuty: number;
  sekundy: number;
  /** Доля учебного года от nachaloGoda до экзамена: 0…1. */
  progress: number;
  /** Московский день — по нему выбирается фраза дня. */
  den: number;
  /** Через сколько миллисекунд сменится секунда на табло. */
  doTika: number;
};

/**
 * Состояние плашки в момент `now`. Берётся первая цель, чей московский
 * день ещё не прошёл: в сам день экзамена — фаза segodnya, на следующий
 * день — уже отсчёт до следующей цели. Отрицательных чисел не бывает.
 * null — все цели в прошлом, плашку не показываем.
 */
export function sostoyanie(now: number, celi: readonly EgeCel[]): Sostoyanie | null {
  const den = mskDen(now);
  for (const [idx, cel] of celi.entries()) {
    const start = mskMoment(cel.data, cel.vremya);
    const denCeli = mskDen(start);
    if (den > denCeli) continue;

    const god = mskMoment(cel.nachaloGoda);
    const progress = Math.min(1, Math.max(0, (now - god) / (start - god)));
    if (den === denCeli) {
      return {
        cel,
        idx,
        faza: 'segodnya',
        dni: 0,
        chasy: 0,
        minuty: 0,
        sekundy: 0,
        progress: 1,
        den,
        doTika: (denCeli + 1) * SUTKI - MSK - now,
      };
    }
    const ost = start - now;
    const sek = Math.floor(ost / SEK);
    return {
      cel,
      idx,
      faza: ost >= SUTKI ? 'dni' : 'sutki',
      dni: Math.floor(sek / 86400),
      chasy: Math.floor((sek % 86400) / 3600),
      minuty: Math.floor((sek % 3600) / 60),
      sekundy: sek % 60,
      progress,
      den,
      doTika: (ost % SEK) + 1,
    };
  }
  return null;
}

/** «05» — две цифры для часов, минут и секунд. */
export function dve(n: number): string {
  return String(n).padStart(2, '0');
}

export const slovoDney = (n: number) => plural(n, 'день', 'дня', 'дней');
export const slovoChasov = (n: number) => plural(n, 'час', 'часа', 'часов');
export const slovoMinut = (n: number) => plural(n, 'минута', 'минуты', 'минут');
export const slovoSekund = (n: number) => plural(n, 'секунда', 'секунды', 'секунд');

/**
 * Глагол к числу дней: «остался 1 день», «остался 21 день», но
 * «осталось 2 дня», «осталось 11 дней».
 */
export function ostalos(n: number): string {
  return plural(n, 'остался', 'осталось', 'осталось');
}

/** Подпись над отсчётом: «До ЕГЭ по математике осталось». */
export function podpis(s: Sostoyanie): string {
  return `${s.cel.podpis} ${s.faza === 'dni' ? ostalos(s.dni) : 'осталось'}`;
}

/** Отсчёт словами — для скринридера, без секунд. */
export function slovami(s: Sostoyanie): string {
  if (s.faza === 'segodnya') return `${s.cel.segodnya}. ${s.cel.segodnyaTekst}`;
  const chasti = [`${s.chasy} ${slovoChasov(s.chasy)}`, `${s.minuty} ${slovoMinut(s.minuty)}`];
  if (s.faza === 'dni') chasti.unshift(`${s.dni} ${slovoDney(s.dni)}`);
  return `${podpis(s)}: ${chasti.join(' ')}`;
}
