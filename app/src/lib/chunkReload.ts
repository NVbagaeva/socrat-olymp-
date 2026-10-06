/**
 * Сбой загрузки и единственная автоперезагрузка.
 *
 * Сайт — статический экспорт: после выкладки у ученика может быть
 * открыта старая вкладка, которой нужен кусок кода (chunk), а на
 * мобильной сети ответ страницы может оборваться посреди передачи.
 * В первом случае браузер бросает ChunkLoadError, во втором Safari
 * говорит «TypeError: Load failed», Chrome — «Failed to fetch» или
 * «network error». Роутер Next обрыв посреди ответа не переживает:
 * ошибка уходит в корень, и без перехвата экран остаётся белым.
 *
 * Лечится обычно одной перезагрузкой. Но если сбой постоянный, а
 * перезагрузка запускается по каждому сбою, страница зациклится. Поэтому
 * перезагружаем один раз за окно в минуту: пометка лежит в
 * sessionStorage. Нет хранилища (приватный режим) — помнить нечем,
 * автоматически не перезагружаем, а показываем сообщение с кнопкой.
 */

/** Ключ пометки «уже перезагружались». Версия в имени — на случай смены формата. */
export const CHUNK_RELOAD_KEY = 'budetege:chunk-reload:v1';

/** Окно, в котором вторая автоперезагрузка не запускается. */
export const CHUNK_RELOAD_WINDOW_MS = 60_000;

/* Формулировки разных браузеров и сборщиков: Chrome и Safari говорят
   по-разному, а у динамического import() сообщение своё. */
const CHUNK_PATTERN =
  /ChunkLoadError|Loading chunk [^\s]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

/* Сеть оборвалась или пропала: сообщения браузеров о неудавшемся
   запросе. Только они и только у ошибки типа TypeError (так бросает
   fetch), чтобы не принять за сеть ошибку в коде. */
const NETWORK_PATTERN =
  /^(Load failed|Failed to fetch|network error|NetworkError when attempting to fetch resource\.?|The network connection was lost\.?|The Internet connection appears to be offline\.?|Failed to fetch RSC payload.*)$/i;

/** Это сбой загрузки кода, а не ошибка в самом коде страницы? */
export function isChunkLoadError(error: unknown): boolean {
  if (typeof error === 'string') {
    return CHUNK_PATTERN.test(error);
  }
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { name, message } = error as { name?: unknown; message?: unknown };
  return name === 'ChunkLoadError' || (typeof message === 'string' && CHUNK_PATTERN.test(message));
}

/** Оборвалась или пропала сеть: неудавшийся запрос, а не ошибка в коде. */
export function isNetworkLoadError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { name, message } = error as { name?: unknown; message?: unknown };
  return (
    name === 'TypeError' && typeof message === 'string' && NETWORK_PATTERN.test(message.trim())
  );
}

/** Лечится перезагрузкой: сбой загрузки кода или обрыв сети. */
export function isRecoverableLoadError(error: unknown): boolean {
  return isChunkLoadError(error) || isNetworkLoadError(error);
}

type Memory = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Можно ли перезагрузить страницу сейчас. Если можно, пометка
 * записывается сразу: до самой перезагрузки второй вызов её не повторит.
 */
export function takeReloadTurn(memory: Memory | null, now: number): boolean {
  if (memory === null) {
    return false;
  }
  try {
    const last = Number(memory.getItem(CHUNK_RELOAD_KEY));
    if (Number.isFinite(last) && last > 0 && now - last < CHUNK_RELOAD_WINDOW_MS) {
      return false;
    }
    memory.setItem(CHUNK_RELOAD_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

function sessionMemory(): Memory | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function reloadOnceIf(matches: (error: unknown) => boolean, error: unknown): boolean {
  if (!matches(error)) {
    return false;
  }
  if (!takeReloadTurn(sessionMemory(), Date.now())) {
    return false;
  }
  window.location.reload();
  return true;
}

/**
 * Для слушателей на всё окно: перезагружает страницу один раз, но только
 * при сбое загрузки кода. Любой другой неудавшийся запрос приложения
 * (не за страницей) перезагрузку вызывать не должен.
 */
export function reloadOnceForChunkError(error: unknown): boolean {
  return reloadOnceIf(isChunkLoadError, error);
}

/**
 * Для экранов ошибок и границ: ошибка уже сломала отрисовку, и если
 * причина — сбой загрузки кода или обрыв сети, лечится перезагрузкой.
 * Один раз в окне; true — перезагрузка запущена. Иначе false: сообщение
 * показывает тот, кто спрашивал.
 */
export function reloadOnceForLoadError(error: unknown): boolean {
  return reloadOnceIf(isRecoverableLoadError, error);
}
