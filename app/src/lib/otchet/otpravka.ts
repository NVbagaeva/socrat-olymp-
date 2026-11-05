'use client';

/**
 * Отправка результата учителю — ОДНА функция на весь сайт.
 *
 * Сейчас сервера нет, поэтому «отправить» = собрать ссылку на
 * /rezultat/ с результатом после «#» и отдать её ученику: на телефоне
 * — системное меню «Поделиться» (мессенджер выбирает ученик), иначе —
 * скопировать в буфер обмена.
 *
 * Когда появится кабинет на сервере, достаточно заменить тело
 * `otpravitUchitelyu` (например, на запись попытки через
 * lib/kabinet/api.ts) и вернуть 'otpravleno' — кнопка на экране итогов
 * и её тексты подстроятся по результату, остальной код не меняется.
 */

import { zakodirovat } from './kod';
import { verno, type Otchet } from './types';

/** Чем закончилась отправка — по этому кнопка выбирает сообщение. */
export type ItogOtpravki =
  /** Ученик выбрал, куда отправить, в меню «Поделиться». */
  | 'podelilsya'
  /** Ссылка в буфере обмена: «Ссылка скопирована, отправьте её учителю». */
  | 'skopirovano'
  /** Ученик закрыл меню «Поделиться» — ничего не случилось. */
  | 'otmeneno'
  /** Ни поделиться, ни скопировать: показать ссылку, чтобы скопировать руками. */
  | 'vruchnuyu'
  /** Будущая серверная отправка: результат уже у учителя. */
  | 'otpravleno';

export interface OtvetOtpravki {
  itog: ItogOtpravki;
  /** Ссылка с результатом (у серверной отправки может не быть). */
  ssylka?: string;
}

/** Адрес страницы учителя с результатом. */
export function ssylkaNaRezultat(otchet: Otchet, origin: string): string {
  return `${origin}/rezultat/#${zakodirovat(otchet)}`;
}

/** Строка сообщения: «Результат тренировки: Иванов Пётр, №1 Планиметрия, 7 из 10». */
export function tekstSoobshcheniya(otchet: Otchet): string {
  const razdel = otchet.nomer === null ? otchet.razdel : `№${otchet.nomer} ${otchet.razdel}`;
  return `Результат тренировки: ${otchet.imya}, ${razdel}, ${verno(otchet)} из ${otchet.zadachi.length}`;
}

async function skopirovat(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Отправить результат учителю. Заменить это тело — и кнопка станет автоматической отправкой. */
export async function otpravitUchitelyu(otchet: Otchet): Promise<OtvetOtpravki> {
  const ssylka = ssylkaNaRezultat(otchet, window.location.origin);
  const text = tekstSoobshcheniya(otchet);
  const share: ShareData = { title: text, text, url: ssylka };
  if (typeof navigator.share === 'function' && (navigator.canShare?.(share) ?? true)) {
    try {
      await navigator.share(share);
      return { itog: 'podelilsya', ssylka };
    } catch (e) {
      /* Закрыл меню — не ошибка. Остальное (запрещено в рамке и т. п.) — копируем. */
      if (e instanceof DOMException && e.name === 'AbortError') return { itog: 'otmeneno', ssylka };
    }
  }
  return (await skopirovat(`${text}\n${ssylka}`))
    ? { itog: 'skopirovano', ssylka }
    : { itog: 'vruchnuyu', ssylka };
}

/* ── Имя ученика: только в его браузере ─────────────────────────── */

const KLYUCH_IMENI = 'budetege:otchet:imya';

export function zapomnennoeImya(): string {
  try {
    return window.localStorage.getItem(KLYUCH_IMENI) ?? '';
  } catch {
    return '';
  }
}

export function zapomnitImya(imya: string): void {
  try {
    window.localStorage.setItem(KLYUCH_IMENI, imya);
  } catch {
    /* Приватный режим: имя просто не запомнится. */
  }
}
