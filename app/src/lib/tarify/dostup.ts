'use client';

/**
 * Доступ к генераторам, пока нет оплаты и тарифов в аккаунте.
 *
 *   — Генераторы заданий из BESPLATNO.generatorNomera и «Собрать
 *     вариант» открыты: в каждом одна пробная генерация
 *     (BESPLATNO.generatorProbnyh). Потом — окно «в пробном доступе и на
 *     платных тарифах». Собранный лист остаётся: его можно печатать.
 *   — Генераторы остальных заданий закрыты целиком.
 *   — Полный доступ — у аккаунтов из POLNYY_DOSTUP_SHA256: всё открыто,
 *     без счётчика.
 *
 * Счётчик живёт в браузере (localStorage), сайт статический: это мягкое
 * ограничение витрины, а не защита. Настоящие лимиты появятся вместе
 * с тарифами в аккаунте — проверять их будет сервер.
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useSessionUser } from '@/lib/auth/session';
import { storage } from '@/lib/storage';
import { BESPLATNO } from './config';

/** «Собрать вариант» — свой счётчик пробной генерации. */
export const SOBRAT_VARIANT = 'variant';

/**
 * Полный доступ: SHA-256 почты аккаунта (строчными, без пробелов по
 * краям). Адресов в коде сайта нет — как и у списка регистрации
 * (docs/AUTH.md). Добавить почту:
 *   printf '%s' 'adres@mail.ru' | sha256sum
 */
export const POLNYY_DOSTUP_SHA256: readonly string[] = [
  /* Владелец сайта. */
  'b21ee108e9ab541ad8f914fe9e391942afc13890f6d98b5a97e8c02351acf937',
];

/** Открыт ли генератор задания без тарифа (с пробной генерацией). */
export function generatorOtkryt(scope: string): boolean {
  return (
    scope === SOBRAT_VARIANT || (BESPLATNO.generatorNomera as readonly string[]).includes(scope)
  );
}

/* ── Полный доступ ─────────────────────────────────────────────── */

const proveneno = new Map<string, boolean>();

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Вошёл аккаунт с полным доступом. На сервере, при гидратации и пока
 * считается отпечаток почты — false.
 */
export function usePolnyyDostup(): boolean {
  const user = useSessionUser();
  const email = user?.email.trim().toLowerCase() ?? '';
  const [otvet, setOtvet] = useState<{ email: string; ok: boolean } | null>(null);
  useEffect(() => {
    if (email === '' || proveneno.has(email)) return undefined;
    let alive = true;
    sha256(email)
      .then((hash) => {
        const ok = POLNYY_DOSTUP_SHA256.includes(hash);
        proveneno.set(email, ok);
        if (alive) setOtvet({ email, ok });
      })
      .catch(() => {
        /* Нет crypto.subtle (не https) — полного доступа нет. */
        proveneno.set(email, false);
      });
    return () => {
      alive = false;
    };
  }, [email]);
  if (email === '') return false;
  return proveneno.get(email) ?? (otvet?.email === email && otvet.ok);
}

/* ── Пробные генерации ─────────────────────────────────────────── */

const KEY = 'generator:probnye';
const EVENT = 'budetege:probnye';

function potracheno(): Record<string, number> {
  const raw = storage.get<unknown>(KEY, {});
  return raw !== null && typeof raw === 'object' ? (raw as Record<string, number>) : {};
}

/** Сколько пробных генераций осталось в генераторе. */
export function probnyhOstalos(scope: string): number {
  const n = Number(potracheno()[scope] ?? 0);
  return Math.max(0, BESPLATNO.generatorProbnyh - (Number.isFinite(n) ? n : 0));
}

/** Пробная генерация потрачена. */
export function potratitProbnuyu(scope: string): void {
  const vse = potracheno();
  storage.set(KEY, { ...vse, [scope]: Number(vse[scope] ?? 0) + 1 });
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  const fromStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.endsWith(KEY)) onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', fromStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', fromStorage);
  };
}

/** Осталось пробных генераций; на сервере и при гидратации — null. */
export function useProbnyhOstalos(scope: string): number | null {
  return useSyncExternalStore(
    subscribe,
    () => probnyhOstalos(scope),
    () => null,
  );
}
