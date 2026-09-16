'use client';

/**
 * Прокрутка при переходах внутри вкладки «Подготовительные задачи».
 *
 * На телефоне шапка темы занимает почти весь первый экран, и после
 * выбора навыка ученик оставался стоять на ней: задание приходилось
 * искать прокруткой. На широком экране этой беды нет, поэтому там
 * страница не двигается.
 *
 * Шапку темы мы не прячем и не делаем липкой — она возвращена
 * намеренно. Двигается только видимая область.
 */

import { useSyncExternalStore } from 'react';

/* Ниже 1024px содержимое вкладки уходит под шапку темы. Тот же порог,
   по которому в этой вкладке прокручиваются вбок лента вкладок
   и ряд навыков. */
const NARROW = '(max-width: 1023.98px)';

/** Куда прокрутить после перехода на другой экран вкладки. */
export type PrepTarget = 'skill' | 'list';

/* Намерение живёт между кликом и отрисовкой следующего экрана.
   Обычная переменная модуля: она переживает переход по ссылке внутри
   приложения и не переживает перезагрузку страницы — ровно то, что
   нужно. При прямом заходе по адресу прокрутки не будет. */
let pending: PrepTarget | null = null;

/** Запомнить, что переход сделан кликом внутри вкладки. */
export function requestPrepScroll(target: PrepTarget): void {
  pending = target;
}

/** Забрать намерение. Второй раз оно не сработает. */
export function takePrepScroll(): PrepTarget | null {
  const target = pending;
  pending = null;
  return target;
}

function matches(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** «Уменьшить движение» в системе — плавность выключается. */
function behavior(): ScrollBehavior {
  return matches('(prefers-reduced-motion: reduce)') ? 'auto' : 'smooth';
}

/**
 * Подвести узел к верху видимой области.
 *
 * На широком экране не делает ничего: там весь экран виден сразу
 * и самовольная прокрутка только мешала бы.
 */
export function scrollPrepTo(selector: string, gap = 12): void {
  if (!matches(NARROW)) {
    return;
  }
  const node = document.querySelector(selector);
  if (node === null) {
    return;
  }
  window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - gap, behavior: behavior() });
}

/** То же, но следующим кадром: после того, как экран перерисовался. */
export function scrollPrepSoon(selector: string, gap = 12): void {
  requestAnimationFrame(() => scrollPrepTo(selector, gap));
}

/* ── Узкий экран ──────────────────────────────────────────────── */

function subscribeNarrow(listener: () => void): () => void {
  const list = window.matchMedia(NARROW);
  list.addEventListener('change', listener);
  return () => list.removeEventListener('change', listener);
}

/**
 * Узкий ли экран сейчас.
 *
 * На сервере ответ всегда «нет»: там ширины окна не существует.
 * Значение нужно только обработчику клика, в разметку оно не попадает,
 * поэтому расхождению при гидратации взяться неоткуда.
 */
export function usePrepNarrow(): boolean {
  return useSyncExternalStore(
    subscribeNarrow,
    () => matches(NARROW),
    () => false,
  );
}
