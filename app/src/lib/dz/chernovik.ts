'use client';

/**
 * Черновик ДЗ репетитора: пункты, которые он кладёт кнопкой «В домашнее
 * задание» прямо со страниц разделов, и настройки конструктора. Живёт в
 * базе (homework_drafts), пока репетитор не выдаст ДЗ или не очистит
 * черновик, — виден с телефона и с компьютера.
 *
 * Одно хранилище на вкладку: кнопки в разделе, плашка «В черновике ДЗ» и
 * конструктор видят одно и то же. Состав пишется в базу сразу (после
 * нажатия репетитор может тут же уйти на другую страницу), настройки —
 * с задержкой: набор текста не шлёт запрос на каждую букву. Отложенное
 * дописывается и при уходе со страницы.
 */

import { useSyncExternalStore } from 'react';
import {
  chitatSostav,
  klyuchPunkta,
  novyyId,
  pustoySostav,
  type PunktSostava,
  type Sostav,
} from './sostav';

type Sostoyanie =
  | { status: 'net' }
  | { status: 'gruzitsya' }
  | { status: 'gotovo'; sostav: Sostav }
  | { status: 'oshibka' };

let state: Sostoyanie = { status: 'net' };
const slushateli = new Set<() => void>();
let zapis: ReturnType<typeof setTimeout> | null = null;
let zagruzka: Promise<void> | null = null;

function obnovit(next: Sostoyanie): void {
  state = next;
  for (const f of slushateli) f();
}

const api = () => import('./api');

/** Загрузить черновик из базы (один раз за визит). */
export function zagruzitChernovik(): Promise<void> {
  if (zagruzka !== null) return zagruzka;
  obnovit({ status: 'gruzitsya' });
  zagruzka = api()
    .then((m) => m.loadDraft())
    .then((row) => obnovit({ status: 'gotovo', sostav: chitatSostav(row?.body ?? null) }))
    .catch(() => {
      zagruzka = null;
      obnovit({ status: 'oshibka' });
    });
  return zagruzka;
}

/* Запросы записи — по очереди: поздний не обгоняет ранний. */
let ochered: Promise<unknown> = Promise.resolve();

function otpravit(sostav: Sostav): Promise<unknown> {
  ochered = ochered
    .catch(() => undefined)
    .then(() => api())
    .then((m) =>
      sostav.punkty.length === 0 && sostav.nastroyki.note === ''
        ? m.clearDraft()
        : m.saveDraft(sostav),
    );
  return ochered;
}

function zapisat(sostav: Sostav, srazu: boolean): void {
  if (zapis !== null) clearTimeout(zapis);
  zapis = null;
  if (srazu) {
    void otpravit(sostav);
    return;
  }
  zapis = setTimeout(() => {
    zapis = null;
    void otpravit(sostav);
  }, 400);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (zapis !== null && state.status === 'gotovo') zapisat(state.sostav, true);
  });
}

/** Сразу записать отложенное (перед уходом со страницы, перед выдачей). */
export async function sohranitSeychas(): Promise<void> {
  if (zapis !== null && state.status === 'gotovo') zapisat(state.sostav, true);
  await ochered.catch(() => undefined);
}

function izmenit(f: (s: Sostav) => Sostav, srazu = true): void {
  if (state.status !== 'gotovo') return;
  const next = f(state.sostav);
  obnovit({ status: 'gotovo', sostav: next });
  zapisat(next, srazu);
}

/** Пункт без id — для «уже в черновике?». */
export type NovyyPunkt = PunktSostava extends infer P
  ? P extends PunktSostava
    ? Omit<P, 'id'>
    : never
  : never;

export function estVChernovike(p: NovyyPunkt): boolean {
  if (state.status !== 'gotovo') return false;
  const key = klyuchPunkta({ ...p, id: '' } as PunktSostava);
  return state.sostav.punkty.some((x) => klyuchPunkta(x) === key);
}

/** Добавить пункт в конец; тот же пункт второй раз не добавляется. */
export async function dobavit(p: NovyyPunkt): Promise<void> {
  await zagruzitChernovik();
  if (estVChernovike(p)) return;
  izmenit((s) => ({ ...s, punkty: [...s.punkty, { ...p, id: novyyId() } as PunktSostava] }));
}

export function ubrat(id: string): void {
  izmenit((s) => ({ ...s, punkty: s.punkty.filter((p) => p.id !== id) }));
}

export function zamenit(p: PunktSostava): void {
  izmenit((s) => ({ ...s, punkty: s.punkty.map((x) => (x.id === p.id ? p : x)) }));
}

/** Переставить пункт: from → to (индексы в списке). */
export function perestavit(from: number, to: number): void {
  izmenit((s) => {
    const list = [...s.punkty];
    const [item] = list.splice(from, 1);
    if (item === undefined) return s;
    list.splice(Math.max(0, Math.min(list.length, to)), 0, item);
    return { ...s, punkty: list };
  });
}

export function zadatNastroyki(n: Partial<Sostav['nastroyki']>): void {
  izmenit((s) => ({ ...s, nastroyki: { ...s.nastroyki, ...n } }), false);
}

/** Заменить весь состав (из шаблона). */
export function zadatSostav(sostav: Sostav): void {
  izmenit(() => sostav);
}

export function ochistit(): void {
  izmenit(() => pustoySostav());
}

function podpisatsya(f: () => void): () => void {
  slushateli.add(f);
  return () => slushateli.delete(f);
}

const NET: Sostoyanie = { status: 'net' };

/** Черновик для экрана. Пока не загружен — status 'net' / 'gruzitsya'. */
export function useChernovik(): Sostoyanie {
  return useSyncExternalStore(
    podpisatsya,
    () => state,
    () => NET,
  );
}
