/**
 * Сбой загрузки куска кода и единственная автоперезагрузка.
 *
 * Сайт — статический экспорт: после выкладки у ученика может быть
 * открыта старая вкладка, которой нужен кусок кода (chunk), или
 * страница, до которой не дошла сеть. Браузер бросает ChunkLoadError,
 * и без перехвата экран остаётся белым.
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

/**
 * Если это сбой загрузки кода и перезагрузка в этом окне ещё не
 * была — перезагружает страницу и возвращает true. Иначе false: тогда
 * показывать сообщение должен тот, кто спрашивал.
 */
export function reloadOnceForChunkError(error: unknown): boolean {
  if (!isChunkLoadError(error)) {
    return false;
  }
  if (!takeReloadTurn(sessionMemory(), Date.now())) {
    return false;
  }
  window.location.reload();
  return true;
}
