'use client';

/**
 * Push на этом устройстве (docs/kabinet-uvedomleniya.md, PR 3г): что умеет
 * браузер, есть ли подписка, включить и выключить. Модуль грузится
 * динамически со страницы настроек — в первую загрузку не попадает.
 *
 * Service worker (`/sw.js`) регистрируется только по кнопке «Включить»:
 * у остальных его нет. Он не трогает загрузку страниц — только
 * показывает push и открывает ссылку по нажатию.
 */

import { klyuchVBayty, pushSostoyanie, etoIos } from './model';
import type { PushSostoyanie, PushVozmozhnosti } from './model';

export const SW_ADRES = '/sw.js';

export function vozmozhnosti(): PushVozmozhnosti {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    sw: 'serviceWorker' in navigator && navigator.serviceWorker !== undefined,
    pushManager: typeof window !== 'undefined' && (window as { PushManager?: unknown }).PushManager !== undefined,
    notification: typeof Notification !== 'undefined',
    ios: etoIos(navigator.userAgent, navigator.maxTouchPoints ?? 0),
    standalone: nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  };
}

async function tekushchayaPodpiska(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  if (reg === undefined || reg.pushManager === undefined) return null;
  return reg.pushManager.getSubscription();
}

/** Состояние для экрана; подписку, если она есть, ещё раз отдаёт базе
 * (вошли в этом браузере другим аккаунтом — подписка переходит к нему). */
export async function sostoyanie(): Promise<PushSostoyanie> {
  const v = vozmozhnosti();
  if (!(v.sw && v.pushManager && v.notification)) return pushSostoyanie(v, false);
  const sub = await tekushchayaPodpiska();
  if (sub !== null && v.permission === 'granted') {
    await zapisat(sub).catch(() => undefined);
  }
  return pushSostoyanie(v, sub !== null);
}

async function zapisat(sub: PushSubscription): Promise<void> {
  const j = sub.toJSON();
  if (j.endpoint === undefined || j.keys?.p256dh === undefined || j.keys.auth === undefined) {
    throw new Error('subscription');
  }
  const { pushPodpisat } = await import('./api');
  await pushPodpisat(j.endpoint, j.keys.p256dh, j.keys.auth);
}

export type OshibkaPush = 'zapret' | 'net_klyucha' | 'servis' | 'svyaz';

export class PushError extends Error {
  constructor(readonly kod: OshibkaPush) {
    super(kod);
  }
}

/** Включить: разрешение, service worker, подписка, запись в базу. */
export async function vklyuchit(): Promise<void> {
  const razreshenie = await Notification.requestPermission();
  if (razreshenie !== 'granted') throw new PushError('zapret');
  const { pushKlyuch } = await import('./api');
  let klyuch: string | null;
  try {
    klyuch = await pushKlyuch();
  } catch {
    throw new PushError('svyaz');
  }
  if (klyuch === null || klyuch === '') throw new PushError('net_klyucha');
  const reg = await navigator.serviceWorker.register(SW_ADRES, { scope: '/' });
  await navigator.serviceWorker.ready;
  // Старая подписка (например, с прежним ключом) — заменить.
  const staraya = await reg.pushManager.getSubscription();
  if (staraya !== null) await staraya.unsubscribe().catch(() => false);
  let sub: PushSubscription;
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: klyuchVBayty(klyuch),
    });
  } catch {
    throw new PushError('svyaz');
  }
  try {
    await zapisat(sub);
  } catch (e) {
    await sub.unsubscribe().catch(() => false);
    const kod = (e as { code?: string }).code;
    throw new PushError(kod === 'bad_endpoint' ? 'servis' : 'svyaz');
  }
}

/** Выключить на этом устройстве. */
export async function vyklyuchit(): Promise<void> {
  const sub = await tekushchayaPodpiska();
  if (sub === null) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => false);
  const { pushOtpisat } = await import('./api');
  await pushOtpisat(endpoint).catch(() => false);
}
