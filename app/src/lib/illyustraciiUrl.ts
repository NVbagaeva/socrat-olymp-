import { withVersion } from './assetUrl';

/**
 * Адрес с версией для иллюстраций, которые держат свою таблицу версий
 * (process.env.ILLYUSTRACII_ASSET_VERSIONS, считает next.config.ts):
 *
 *   /images/zadanie-11/gorod-    — города сцены «Два путника» №10
 *                                  (zadanie11/vstrecha/Scena — ленивый кусок).
 *
 * Общая таблица ASSET_VERSIONS входит в первую загрузку каждой страницы
 * (порог — scripts/check-first-load.mjs), поэтому эти файлы в ней не
 * лежат: таблицу читают только код сцены и сервер — в первую загрузку
 * других страниц она не попадает. Приём тот же, что у заставки, шапок
 * разделов и картинок задач.
 */

let versii: Record<string, string> | null = null;

export function illyustraciyaUrl(path: string): string {
  versii ??= JSON.parse(process.env.ILLYUSTRACII_ASSET_VERSIONS ?? '{}') as Record<string, string>;
  return withVersion(path, versii);
}
