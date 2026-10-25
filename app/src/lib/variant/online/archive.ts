/**
 * Архив завершённых работ ученика — в IndexedDB на его устройстве.
 *
 * Незавершённая работа живёт в общей сессии тренажёров
 * (TrainerSessionHost, localStorage): пауза, возврат после закрытия
 * вкладки, защита от двух вкладок. Сюда попадает только итог — после
 * «Завершить работу». Из архива строятся карточки серии и статистика.
 *
 * В записи — код результата (из него страница проверки восстанавливает
 * всё) и посчитанные итоги по заданиям: статистике не нужно заново
 * собирать варианты.
 *
 * Без IndexedDB (приватный режим, старый браузер) архив живёт в
 * памяти страницы: работа решается, итог показывается, но в статистику
 * после перезагрузки не попадёт. Экран говорит об этом плашкой.
 */

import type { Chast2Ui } from '@/lib/chast2/sostoyanie';
import type { EgeNo } from '../types';
import type { Mode } from './link';

export interface ArchivedTask {
  egeNumber: EgeNo;
  right: boolean;
  /** Пустой ответ (не начато). */
  empty: boolean;
  seconds: number;
}

export interface ArchivedWork {
  /** Ключ: код партии | вариант | режим | время завершения. */
  id: string;
  code: string;
  variant: number;
  mode: Mode;
  /** Название работы для карточек и графика. */
  title: string;
  finishedAt: number;
  resultCode: string;
  primary: number;
  max: number;
  test: number | null;
  seconds: number;
  tasks: ArchivedTask[];
  /**
   * Часть 2 (варианты повышенной сложности): баллы самопроверки и
   * сколько заданий оценено; ui — ответы и оценки, чтобы досчитать
   * часть 2 после завершения.
   */
  chast2?: { summa: number; oceneno: number; vsego: number; max: number; ui: Chast2Ui };
}

/** Хранилище архива: в браузере — IndexedDB, в проверках — память. */
export interface ArchiveBackend {
  put(work: ArchivedWork): Promise<void>;
  all(): Promise<ArchivedWork[]>;
}

export function memoryBackend(): ArchiveBackend {
  const rows = new Map<string, ArchivedWork>();
  return {
    put(work) {
      rows.set(work.id, structuredClone(work));
      return Promise.resolve();
    },
    all() {
      return Promise.resolve([...rows.values()].map((w) => structuredClone(w)));
    },
  };
}

const DB = 'budetege-variant';
const STORE = 'works';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('idb'));
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('idb'));
    req.onblocked = () => reject(new Error('blocked'));
  });
}

export function indexedDbBackend(): ArchiveBackend {
  let db: Promise<IDBDatabase> | null = null;
  const get = () => {
    if (db === null) {
      db = openDb();
      db.catch(() => {
        db = null;
      });
    }
    return db;
  };
  return {
    async put(work) {
      const d = await get();
      const tx = d.transaction(STORE, 'readwrite');
      await request(tx.objectStore(STORE).put(work));
    },
    async all() {
      const d = await get();
      const tx = d.transaction(STORE, 'readonly');
      return (await request(tx.objectStore(STORE).getAll())) as ArchivedWork[];
    },
  };
}

/* ── Архив страницы ─────────────────────────────────────────────── */

let backend: ArchiveBackend | null = null;
/** IndexedDB не открылась — архив только в памяти. */
let volatile = false;
const listeners = new Set<() => void>();

function current(): ArchiveBackend {
  if (backend === null) {
    let ok = false;
    try {
      ok = typeof indexedDB !== 'undefined';
    } catch {
      ok = false;
    }
    backend = ok ? indexedDbBackend() : memoryBackend();
    volatile = !ok;
  }
  return backend;
}

/** Только для проверок: подменить хранилище. */
export function setArchiveBackend(next: ArchiveBackend): void {
  backend = next;
  volatile = false;
}

export function archiveVolatile(): boolean {
  return volatile;
}

/** Сохранить итог. Не вышло с IndexedDB — уходит в память, без падения. */
export async function saveWork(work: ArchivedWork): Promise<void> {
  try {
    await current().put(work);
  } catch {
    if (!volatile) {
      const mem = memoryBackend();
      backend = mem;
      volatile = true;
    }
    await current().put(work);
  }
  listeners.forEach((l) => l());
}

export async function listWorks(): Promise<ArchivedWork[]> {
  try {
    const rows = await current().all();
    return rows.sort((a, b) => a.finishedAt - b.finishedAt);
  } catch {
    return [];
  }
}

export function onArchiveChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
