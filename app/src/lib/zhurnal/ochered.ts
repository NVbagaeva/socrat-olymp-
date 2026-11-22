'use client';

/**
 * Очередь журнала в браузере и отправка на сервер (docs/kabinet-zhurnal.md).
 *
 * Записи копятся в localStorage под ключом ученика и уходят пачками
 * функцией zhurnal_push: через 3 с после изменения, раз в 10 с, пока
 * очередь не пуста, при скрытии вкладки и при открытии страницы. Без
 * связи записи ждут. Отправляет одна вкладка браузера (navigator.locks);
 * сервер идемпотентен, поэтому двойная отправка ничего не ломает.
 *
 * Пишется только вошедшему ученику и только при флаге журнала. Гостю и
 * учителю очередь не заводится.
 */

import { currentUser } from '@/lib/auth/session';
import { browserStorage } from '@/lib/storage';
import { zhurnalRazdel } from './config';
import {
  PUSTAYA_OCHERED,
  bezOtpravlennogo,
  pachka,
  razobratOchered,
  razmerOcheredi,
  vOchered,
  variantVOchered,
  type Ochered,
  type ZapisVarianta,
  type ZapisZadachi,
} from './model';

const KLYUCH = 'budetege:zhurnal:ochered:v1:';
const POSLE_IZMENENIYA_MS = 3000;
const INTERVAL_MS = 10000;

function uchenik(): string | null {
  const user = currentUser();
  return user !== null && user.role === 'student' ? user.id : null;
}

function prochest(uid: string): Ochered {
  const target = browserStorage();
  if (target === null) return PUSTAYA_OCHERED;
  try {
    const raw = target.getItem(KLYUCH + uid);
    return raw === null ? PUSTAYA_OCHERED : razobratOchered(JSON.parse(raw));
  } catch {
    return PUSTAYA_OCHERED;
  }
}

function zapisat(uid: string, q: Ochered): void {
  const target = browserStorage();
  if (target === null) return;
  try {
    if (razmerOcheredi(q) === 0) target.removeItem(KLYUCH + uid);
    else target.setItem(KLYUCH + uid, JSON.stringify(q));
  } catch {
    /* Хранилище переполнено или закрыто: запись теряется, решать это не мешает. */
  }
}

/** Положить задачу в очередь. Раздел вне журнала — молча мимо. */
export function zapisatZadachu(z: ZapisZadachi): void {
  const uid = uchenik();
  if (uid === null || !zhurnalRazdel(z.task_no)) return;
  zapisat(uid, vOchered(prochest(uid), z));
  zaplanirovat(POSLE_IZMENENIYA_MS);
}

export function zapisatVariant(v: ZapisVarianta): void {
  const uid = uchenik();
  if (uid === null) return;
  zapisat(uid, variantVOchered(prochest(uid), v));
  zaplanirovat(POSLE_IZMENENIYA_MS);
}

/* ── Отправка ───────────────────────────────────────────────────── */

let tajmer: ReturnType<typeof setTimeout> | null = null;
let idet = false;
let pauzaDo = 0;
let neudach = 0;
/* Сервер ответил «журнал выключен» или «нельзя»: до перезагрузки страницы не стучимся. */
let stop = false;
let podklyucheno = false;

function zaplanirovat(cherez: number): void {
  if (typeof window === 'undefined' || stop) return;
  podklyuchit();
  if (tajmer !== null) clearTimeout(tajmer);
  tajmer = setTimeout(() => {
    tajmer = null;
    void otpravit();
  }, Math.max(cherez, pauzaDo - Date.now()));
}

function podklyuchit(): void {
  if (podklyucheno || typeof document === 'undefined') return;
  podklyucheno = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void otpravit();
  });
  window.addEventListener('online', () => zaplanirovat(500));
}

async function sLockom(fn: () => Promise<void>): Promise<void> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (locks === undefined) return fn();
  await locks.request('budetege-zhurnal', { ifAvailable: true }, async (lock) => {
    if (lock !== null) await fn();
  });
}

/**
 * Отправить, что накопилось. При скрытии вкладки — сразу: браузер обычно
 * успевает. Не успел — запись дождётся следующего открытия сайта.
 */
export async function otpravit(): Promise<void> {
  const uid = uchenik();
  if (uid === null || idet || stop) return;
  idet = true;
  try {
    await sLockom(async () => {
      for (let krug = 0; krug < 5; krug += 1) {
        const p = pachka(prochest(uid));
        if (p === null) return;
        const { getClient } = await import('@/lib/auth/client');
        const supabase = await getClient();
        const { data, error } = await supabase.rpc('zhurnal_push', {
          p: { zadachi: p.zadachi, varianty: p.varianty },
        });
        if (error !== null) {
          const msg = error.message ?? '';
          if (/^(forbidden|progress_not_allowed)/.test(msg)) {
            /* Записывать нельзя (школьник до согласия родителя): очередь не копим. */
            zapisat(uid, PUSTAYA_OCHERED);
            stop = true;
            return;
          }
          throw new Error(msg);
        }
        if ((data as { off?: boolean } | null)?.off === true) {
          stop = true;
          return;
        }
        zapisat(uid, bezOtpravlennogo(prochest(uid), p));
      }
    });
    neudach = 0;
    pauzaDo = 0;
  } catch {
    /* Нет связи или сервер занят: пауза растёт — 10 с, 20 с … до 5 минут. */
    neudach += 1;
    pauzaDo = Date.now() + Math.min(300000, INTERVAL_MS * 2 ** (neudach - 1));
  } finally {
    idet = false;
  }
  const uidPosle = uchenik();
  if (uidPosle !== null && !stop && razmerOcheredi(prochest(uidPosle)) > 0) zaplanirovat(INTERVAL_MS);
}

/** При открытии страницы: отправить то, что осталось с прошлого раза. */
export function dosylka(): void {
  const uid = uchenik();
  if (uid !== null && razmerOcheredi(prochest(uid)) > 0) zaplanirovat(1000);
}
