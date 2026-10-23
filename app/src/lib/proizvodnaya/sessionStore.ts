'use client';

/**
 * Хранение активной сессии тренажёра №9.
 *
 * Модульный store переживает переходы между вкладками раздела и
 * другими страницами сайта внутри одной вкладки браузера (клиентская
 * навигация не перезагружает модули). Копия в sessionStorage
 * переживает перезагрузку страницы: в неё уходят только идентификаторы
 * задач, а сами задачи собираются заново (генератор детерминирован по
 * seed). Ответов числом в хранилище нет.
 *
 * Все обращения к storage — в try/catch: в приватном окне доступ
 * бросает исключение, и тогда сессия живёт в памяти до перезагрузки.
 */

import { useSyncExternalStore } from 'react';
import type { TrainerModeId } from '@/content/trainerModes';
import { persistent } from '../storage';
import { taskFromId, type Task9 } from './session';
import type { Istochnik } from './types';

export const ISTOCHNIK_OTKRYTYJ: Istochnik = 'otkrytyj-bank';
export const ISTOCHNIK_SVOI: Istochnik = 'ne-iz-otkrytogo-banka';

/** Настройки, с которыми запущена тренировка. */
export interface Settings9 {
  groups: string[];
  mode: TrainerModeId;
  /** Сколько заданий. */
  count: number;
  istochnik: Istochnik;
}

/** Чем закончилось задание: решено само или с подсказкой / решением. */
export type Mark9 = 'right' | 'hinted';

/** Состояние одного задания сессии. */
export interface Item9 {
  /** Черновик ответа. */
  value: string;
  checked: 'right' | 'wrong' | null;
  mark: Mark9 | null;
  /** Открыта ли лесенка вопросов-подсказок. */
  hintOn: boolean;
  /** Сколько вопросов лесенки пройдено верно. */
  hintStep: number;
  /** Кнопки текущего вопроса, на которые уже нажали и ошиблись. */
  hintWrong: number[];
  /** Открыто ли полное решение. */
  solution: boolean;
  /** Неверных проверок. */
  misses: number;
  /** Накопленное время на задание, секунды. */
  sec: number;
}

export interface ActiveSession9 {
  /** Новый на каждый запуск: по нему сбрасывается состояние экрана. */
  id: string;
  settings: Settings9;
  tasks: Task9[];
  items: Item9[];
  index: number;
  /** Накопленное активное время, секунды. */
  seconds: number;
  paused: boolean;
}

/** Итог завершённой тренировки: сама сессия уже очищена. */
export interface RowIto9 {
  title: string;
  right: number;
  total: number;
}

export interface Result9 {
  settings: Settings9;
  /** Сколько заданий было в сессии. */
  total: number;
  /** Сколько закрыто (решено, с подсказкой или с решением). */
  solved: number;
  right: number;
  hinted: number;
  misses: number;
  seconds: number;
  /** Завершена досрочно. */
  early: boolean;
  rows: RowIto9[];
}

export function newItem(): Item9 {
  return {
    value: '',
    checked: null,
    mark: null,
    hintOn: false,
    hintStep: 0,
    hintWrong: [],
    solution: false,
    misses: 0,
    sec: 0,
  };
}

/* ── Сохранение ──────────────────────────────────────────────────── */

const KEY_SESSION = 'budetege:proizvodnaya-9:session:v1';
const KEY_RESULT = 'budetege:proizvodnaya-9:result:v1';

interface Saved9 {
  v: 1;
  id: string;
  settings: Settings9;
  taskIds: string[];
  items: Item9[];
  index: number;
  seconds: number;
  paused: boolean;
}

function readStorage(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    /* Приватный режим или квота: сессия живёт в памяти. */
  }
}

const MODES: TrainerModeId[] = ['practice', 'mixed', 'mistakes', 'control'];

function isSettings(value: unknown): value is Settings9 {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Partial<Settings9>;
  return (
    Array.isArray(v.groups) &&
    v.groups.every((g) => typeof g === 'string') &&
    MODES.includes(v.mode as TrainerModeId) &&
    typeof v.count === 'number' &&
    (v.istochnik === ISTOCHNIK_OTKRYTYJ || v.istochnik === ISTOCHNIK_SVOI)
  );
}

function toItem(value: unknown): Item9 {
  const base = newItem();
  if (typeof value !== 'object' || value === null) {
    return base;
  }
  const v = value as Partial<Item9>;
  return {
    value: typeof v.value === 'string' ? v.value : '',
    checked: v.checked === 'right' || v.checked === 'wrong' ? v.checked : null,
    mark: v.mark === 'right' || v.mark === 'hinted' ? v.mark : null,
    hintOn: v.hintOn === true,
    hintStep: typeof v.hintStep === 'number' && v.hintStep >= 0 ? Math.floor(v.hintStep) : 0,
    hintWrong: Array.isArray(v.hintWrong)
      ? v.hintWrong.filter((n): n is number => typeof n === 'number')
      : [],
    solution: v.solution === true,
    misses: typeof v.misses === 'number' && v.misses >= 0 ? Math.floor(v.misses) : 0,
    sec: typeof v.sec === 'number' && v.sec >= 0 ? v.sec : 0,
  };
}

/** Собрать сессию из записи. Задачи, которые не собрались, выпадают. */
function restore(raw: string | null): ActiveSession9 | null {
  if (raw === null) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<Saved9>;
    if (value.v !== 1 || typeof value.id !== 'string' || !isSettings(value.settings)) {
      return null;
    }
    if (!Array.isArray(value.taskIds) || !Array.isArray(value.items)) {
      return null;
    }
    const tasks: Task9[] = [];
    const items: Item9[] = [];
    value.taskIds.forEach((id, i) => {
      const task = typeof id === 'string' ? taskFromId(id) : null;
      if (task !== null) {
        tasks.push(task);
        items.push(toItem(value.items?.[i]));
      }
    });
    if (tasks.length === 0) {
      return null;
    }
    const index =
      typeof value.index === 'number' ? Math.min(Math.max(0, value.index), tasks.length - 1) : 0;
    return {
      id: value.id,
      settings: value.settings,
      tasks,
      items,
      index,
      seconds: typeof value.seconds === 'number' && value.seconds >= 0 ? value.seconds : 0,
      paused: value.paused === true,
    };
  } catch {
    return null;
  }
}

function persistSession(session: ActiveSession9 | null): void {
  if (session === null) {
    writeStorage(KEY_SESSION, null);
    return;
  }
  const saved: Saved9 = {
    v: 1,
    id: session.id,
    settings: session.settings,
    taskIds: session.tasks.map((task) => task.id),
    items: session.items,
    index: session.index,
    seconds: session.seconds,
    paused: session.paused,
  };
  writeStorage(KEY_SESSION, JSON.stringify(saved));
}

function restoreResult(raw: string | null): Result9 | null {
  if (raw === null) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<Result9>;
    if (
      !isSettings(value.settings) ||
      typeof value.total !== 'number' ||
      !Array.isArray(value.rows)
    ) {
      return null;
    }
    return value as Result9;
  } catch {
    return null;
  }
}

/* ── Хранилище ───────────────────────────────────────────────────── */

const listeners = new Set<() => void>();
/* undefined — ещё не читали из sessionStorage. */
let current: ActiveSession9 | null | undefined;
let currentResult: Result9 | null | undefined;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Активная сессия сейчас. На сервере всегда null. */
export function getActive(): ActiveSession9 | null {
  if (current === undefined) {
    current = restore(readStorage(KEY_SESSION));
  }
  return current;
}

/** Итог последней завершённой тренировки, пока ученик его не закрыл. */
export function getResult(): Result9 | null {
  if (currentResult === undefined) {
    currentResult = restoreResult(readStorage(KEY_RESULT));
  }
  return currentResult;
}

let counter = 0;

/** Начать сессию: прежняя и прежний итог забываются. */
export function start(settings: Settings9, tasks: Task9[]): ActiveSession9 {
  counter += 1;
  const session: ActiveSession9 = {
    id: `s9:${Date.now().toString(36)}:${counter}`,
    settings,
    tasks,
    items: tasks.map(() => newItem()),
    index: 0,
    seconds: 0,
    paused: false,
  };
  current = session;
  currentResult = null;
  persistSession(session);
  writeStorage(KEY_RESULT, null);
  notify();
  return session;
}

/** Изменить сессию. Сессии нет — ничего не происходит. */
export function update(change: (session: ActiveSession9) => ActiveSession9): void {
  const session = getActive();
  if (session === null) {
    return;
  }
  const next = change(session);
  if (next === session) {
    return;
  }
  current = next;
  persistSession(next);
  notify();
}

/** Очистить сессию. */
export function clear(): void {
  current = null;
  persistSession(null);
  notify();
}

/** Завершить: запомнить итог и очистить сессию. */
export function finish(result: Result9): void {
  currentResult = result;
  writeStorage(KEY_RESULT, JSON.stringify(result));
  clear();
}

/** Закрыть итоговый экран: тренажёр возвращается к конфигуратору. */
export function dismissResult(): void {
  currentResult = null;
  writeStorage(KEY_RESULT, null);
  notify();
}

export interface ActiveState {
  /** false до подключения в браузере: хранилища ещё нет, показывать нечего. */
  ready: boolean;
  session: ActiveSession9 | null;
  result: Result9 | null;
}

const NOT_READY: ActiveState = { ready: false, session: null, result: null };
let lastState: ActiveState = NOT_READY;

function stateSnapshot(): ActiveState {
  const session = getActive();
  const result = getResult();
  if (lastState.ready && lastState.session === session && lastState.result === result) {
    return lastState;
  }
  lastState = { ready: true, session, result };
  return lastState;
}

/** Активная сессия и итог: перерисовка при каждом изменении. */
export function useActiveSession(): ActiveState {
  return useSyncExternalStore(subscribe, stateSnapshot, () => NOT_READY);
}

/* ── Выбранный источник ──────────────────────────────────────────── */

/** Источник заданий запоминается между визитами (localStorage). */
const istochnikStore = persistent<Istochnik>('proizvodnaya-9:istochnik', ISTOCHNIK_SVOI);

export function useIstochnik(): [Istochnik, (value: Istochnik) => void] {
  const value = useSyncExternalStore(
    istochnikStore.subscribe,
    istochnikStore.read,
    istochnikStore.initial,
  );
  const safe: Istochnik = value === ISTOCHNIK_OTKRYTYJ ? ISTOCHNIK_OTKRYTYJ : ISTOCHNIK_SVOI;
  return [safe, (next) => istochnikStore.write(next)];
}
