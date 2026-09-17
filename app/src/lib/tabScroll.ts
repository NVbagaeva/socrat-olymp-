'use client';

/**
 * Прокрутка при переходах внутри вкладки темы.
 *
 * Шапка темы занимает верх страницы, и после выбора навыка ученик
 * оставался стоять на ней: задание приходилось искать прокруткой.
 * Это одинаково на телефоне и на компьютере, поэтому подводим экран
 * к делу на любой ширине.
 *
 * Шапку темы мы не прячем и не делаем липкой — она возвращена
 * намеренно. Двигается только видимая область.
 */

/** Куда прокрутить после перехода: селектор нужного заголовка. */
export type TabTarget = string;

/* Намерение живёт между кликом и отрисовкой следующего экрана.
   Обычная переменная модуля: она переживает переход по ссылке внутри
   приложения и не переживает перезагрузку страницы — ровно то, что
   нужно. При прямом заходе по адресу прокрутки не будет. */
let pending: TabTarget | null = null;

/** Запомнить, что переход сделан кликом внутри вкладки. */
export function requestTabScroll(target: TabTarget): void {
  pending = target;
}

/** Забрать намерение. Второй раз оно не сработает. */
export function takeTabScroll(): TabTarget | null {
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

/* Через сколько проверить, доехала ли плавная прокрутка. */
const CHECK_MS = 350;

/* Признаки того, что человек взялся за прокрутку сам. Клавиши берём
   только прокручивающие: набор ответа в поле прокруткой не считается. */
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

function inView(node: Element): boolean {
  const box = node.getBoundingClientRect();
  return box.bottom > 0 && box.top < window.innerHeight;
}

/**
 * Подвести узел к верху видимой области.
 *
 * Плавную прокрутку браузер может оборвать — тогда экран остаётся
 * посреди пути. Поэтому через треть секунды проверяем, попал ли узел
 * в кадр, и только если не попал совсем — доводим рывком.
 *
 * Если за это время человек крутил сам — колесом, пальцем или
 * клавишами, — не трогаем ничего: дёргать экран из-под руки нельзя.
 */
export function scrollTabTo(selector: string, gap = 12): void {
  const node = document.querySelector(selector);
  if (node === null) {
    return;
  }

  const top = () => node.getBoundingClientRect().top + window.scrollY - gap;
  const smooth = behavior() === 'smooth';
  window.scrollTo({ top: top(), behavior: smooth ? 'smooth' : 'auto' });

  if (!smooth) {
    return;
  }

  let touched = false;
  const mark = () => {
    touched = true;
  };
  const byKey = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.has(event.key)) {
      touched = true;
    }
  };

  window.addEventListener('wheel', mark, { passive: true });
  window.addEventListener('touchmove', mark, { passive: true });
  window.addEventListener('keydown', byKey);

  window.setTimeout(() => {
    window.removeEventListener('wheel', mark);
    window.removeEventListener('touchmove', mark);
    window.removeEventListener('keydown', byKey);

    if (touched || inView(node)) {
      return;
    }
    window.scrollTo({ top: top(), behavior: 'auto' });
  }, CHECK_MS);
}
