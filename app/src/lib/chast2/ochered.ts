/**
 * Очередь отправки фото. Готовый JPEG сначала ложится в IndexedDB этого
 * браузера, потом уходит на сервер по одному: прогресс, повтор,
 * ожидание связи. Закрыли вкладку или пропала сеть — фото не теряется:
 * при следующем открытии работы очередь продолжит.
 *
 * Сеть пропала («offline» или сбой запроса) — элемент ждёт события
 * `online` и уходит снова; другая ошибка (не то фото, лимит) — элемент
 * с текстом ошибки и кнопкой «Повторить».
 */

export interface QItem {
  id: string;
  workId: string;
  taskNo: number;
  blob: Blob;
  width: number;
  height: number;
  /** wait — ждёт очереди или связи; up — отправляется; err — нужна кнопка. */
  status: 'wait' | 'up' | 'err';
  progress: number;
  error: string | null;
  tries: number;
  /** Сеть пропала: ждём `online`. */
  offline: boolean;
  createdAt: number;
  /** Фото, которое это заменяет (правка отправленного): встанет на его место. */
  zamena?: string;
}

/** Хранилище очереди: IndexedDB в браузере, память в проверках. */
export interface QStore {
  all(): Promise<QItem[]>;
  put(item: QItem): Promise<void>;
  del(id: string): Promise<void>;
}

export function memoryQStore(): QStore {
  const m = new Map<string, QItem>();
  return {
    all: () => Promise.resolve([...m.values()]),
    put: (i) => {
      m.set(i.id, i);
      return Promise.resolve();
    },
    del: (id) => {
      m.delete(id);
      return Promise.resolve();
    },
  };
}

const DB = 'budetege-ochered';
const STORE = 'foto';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB'));
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error ?? new Error('indexedDB'));
      }),
  );
}

export function idbQStore(): QStore {
  return {
    all: () => run<QItem[]>('readonly', (s) => s.getAll()),
    put: (i) => run<void>('readwrite', (s) => s.put(i)).then(() => undefined),
    del: (id) => run<void>('readwrite', (s) => s.delete(id)).then(() => undefined),
  };
}

/** Отправка одного фото. Ошибка с code 'offline' (или сетевой сбой) — ждать связи. */
export type Sender = (item: QItem, onProgress: (share: number) => void) => Promise<unknown>;

export interface Ochered {
  items(): readonly QItem[];
  add(
    input: Pick<QItem, 'workId' | 'taskNo' | 'blob' | 'width' | 'height' | 'zamena'>,
  ): Promise<QItem>;
  retry(id: string): void;
  remove(id: string): Promise<void>;
  subscribe(fn: () => void): () => void;
  /** Подождать, пока очередь опустеет или встанет на ошибке/без связи. */
  idle(): Promise<void>;
}

/** Ошибка сети: ждём связи, а не показываем кнопку. */
export function isOffline(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const code = (e as { code?: unknown }).code;
  return code === 'offline' || e instanceof TypeError;
}

const AUTO_TRIES = 3;

export interface OcheredOptions {
  store?: QStore;
  send: Sender;
  /** Фото ушло — экран перечитывает работу. */
  onSent?: (item: QItem, result: unknown) => void;
  online?: () => boolean;
  /** Подписка на появление связи. */
  onOnline?: (fn: () => void) => () => void;
  newId?: () => string;
  /** Пауза перед автоповтором, мс (умножается на номер попытки). */
  retryDelay?: number;
}

export function createOchered(opts: OcheredOptions): Ochered {
  const store = opts.store ?? idbQStore();
  const retryDelay = opts.retryDelay ?? 500;
  const isOnline = opts.online ?? (() => typeof navigator === 'undefined' || navigator.onLine);
  const listeners = new Set<() => void>();
  let list: QItem[] = [];
  let busy = false;
  let waiters: (() => void)[] = [];
  const emit = () => listeners.forEach((l) => l());
  const set = (id: string, patch: Partial<QItem>) => {
    list = list.map((i) => (i.id === id ? { ...i, ...patch } : i));
    emit();
  };
  const settle = () => {
    const pending = list.some((i) => i.status === 'up' || (i.status === 'wait' && !i.offline));
    if (!pending && !busy) {
      const w = waiters;
      waiters = [];
      w.forEach((f) => f());
    }
  };

  async function pump(): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      for (;;) {
        const next = list.find((i) => i.status === 'wait' && (!i.offline || isOnline()));
        if (next === undefined) break;
        if (!isOnline()) {
          set(next.id, { offline: true });
          break;
        }
        set(next.id, { status: 'up', progress: 0, offline: false, tries: next.tries + 1 });
        try {
          const res = await opts.send(next, (p) => set(next.id, { progress: p }));
          list = list.filter((i) => i.id !== next.id);
          emit();
          await store.del(next.id);
          opts.onSent?.(next, res);
        } catch (e) {
          if (isOffline(e)) {
            set(next.id, { status: 'wait', offline: true, progress: 0 });
            break;
          }
          const cur = list.find((i) => i.id === next.id);
          const tries = cur?.tries ?? AUTO_TRIES;
          const message = e instanceof Error ? e.message : 'Не получилось отправить';
          set(next.id, {
            status: tries < AUTO_TRIES ? 'wait' : 'err',
            error: message,
            progress: 0,
          });
          const row = list.find((i) => i.id === next.id);
          if (row) await store.put(row);
          /* Повтор не сразу: 0,5 с, 1 с… */
          if (tries < AUTO_TRIES) await new Promise((r) => setTimeout(r, retryDelay * tries));
        }
      }
    } finally {
      busy = false;
      settle();
    }
  }

  const ready = store.all().then((rows) => {
    /* После перезагрузки «отправлялось» — снова в очередь. */
    list = rows
      .map((r) => (r.status === 'up' ? { ...r, status: 'wait' as const, progress: 0 } : r))
      .sort((a, b) => a.createdAt - b.createdAt);
    emit();
    void pump();
  });

  const unsubscribeOnline = (
    opts.onOnline ??
    ((fn: () => void) => {
      if (typeof window === 'undefined') return () => {};
      window.addEventListener('online', fn);
      return () => window.removeEventListener('online', fn);
    })
  )(() => {
    list = list.map((i) => (i.offline ? { ...i, offline: false } : i));
    emit();
    void pump();
  });
  void unsubscribeOnline;

  const newId =
    opts.newId ??
    (() =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

  return {
    items: () => list,
    async add(input) {
      await ready;
      const item: QItem = {
        ...input,
        id: newId(),
        status: 'wait',
        progress: 0,
        error: null,
        tries: 0,
        offline: false,
        createdAt: Date.now(),
      };
      await store.put(item);
      list = [...list, item];
      emit();
      void pump();
      return item;
    },
    retry(id) {
      set(id, { status: 'wait', error: null, tries: 0, offline: false });
      void pump();
    },
    async remove(id) {
      list = list.filter((i) => i.id !== id);
      emit();
      await store.del(id);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    idle() {
      return ready.then(
        () =>
          new Promise<void>((resolve) => {
            waiters.push(resolve);
            settle();
          }),
      );
    },
  };
}
