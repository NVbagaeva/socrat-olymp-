/**
 * Хранилище состояния кабинета.
 *
 * Компоненты обращаются только сюда и ничего не знают о localStorage.
 * Когда появится сервер, здесь меняется четыре метода — страницы и
 * компоненты не правятся.
 *
 * Всё под одним префиксом, чтобы clear() не выносил чужие ключи, и
 * всё в try/catch: в приватном окне доступ к хранилищу выбрасывает
 * исключение, а не возвращает пустоту.
 */

const PREFIX = 'budetege:';

/** Есть ли хранилище: на сервере при статической сборке его нет. */
function store(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const storage = {
  /** Значение по ключу. Нет значения или оно испорчено — fallback. */
  get<T>(key: string, fallback: T): T {
    const target = store();
    if (target === null) {
      return fallback;
    }
    try {
      const raw = target.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    const target = store();
    if (target === null) {
      return;
    }
    try {
      target.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* Квота исчерпана или запись запрещена: состояние в памяти
         остаётся рабочим, поэтому падать здесь нечем. */
    }
  },

  remove(key: string): void {
    const target = store();
    try {
      target?.removeItem(PREFIX + key);
    } catch {
      /* см. set */
    }
  },

  /** Только свои ключи: чужие в том же домене не трогаются. */
  clear(): void {
    const target = store();
    if (target === null) {
      return;
    }
    try {
      const own = Object.keys(target).filter((key) => key.startsWith(PREFIX));
      own.forEach((key) => target.removeItem(key));
    } catch {
      /* см. set */
    }
  },
};

/* ── Хранилище как внешний источник для React ─────────────────────
   Значение из localStorage нельзя прочитать во время сборки: браузера
   там нет. Поэтому чтение оформлено как внешний источник с двумя
   снимками — для сборки и для браузера. React сам отрисует страницу
   со сборочным снимком, а после подключения в браузере перерисует её
   с сохранённым: ни ручного эффекта, ни расхождения разметки. */

export interface PersistentStore<T> {
  /** Подписка на изменения. Возвращает отписку. */
  subscribe(listener: () => void): () => void;
  /** Снимок для браузера. Ссылка не меняется, пока не было записи. */
  read(): T;
  /** Снимок для сборки: браузера нет, отдаётся начальное значение. */
  initial(): T;
  write(value: T): void;
}

export function persistent<T>(key: string, initial: T): PersistentStore<T> {
  const listeners = new Set<() => void>();
  /* Снимок кэшируется: React сравнивает ссылки, и новый объект на
     каждое чтение уводил бы его в бесконечную перерисовку. */
  let snapshot: T | undefined;

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    read() {
      if (snapshot === undefined) {
        snapshot = storage.get<T>(key, initial);
      }
      return snapshot;
    },
    initial() {
      return initial;
    },
    write(value) {
      snapshot = value;
      storage.set(key, value);
      listeners.forEach((listener) => listener());
    },
  };
}
