/**
 * Раздел тренажёра по адресу страницы. Чистые функции без браузера:
 * зовутся и на сервере (сборка страницы), и в браузере (метка в меню).
 *
 * Адрес раздела профиля — по коду, раздел тренажёра — по номеру
 * хранения: на нём ключи браузера (budetege:trainer:<раздел>:session) и
 * trainer_sessions.scope в базе. Код переводится в номер, ключи не
 * меняются.
 */

import { nomerPoKodu } from '@/lib/paths';

/**
 * Раздел тренажёра по адресу страницы: «/zadaniya/grafiki-funkciy/linear/trenazher/»
 * → «12:linear». Адрес вкладки тренажёра и адрес раздела дают один и тот же.
 */
export function scopeOfPath(path: string): string | null {
  const parts = path.split(/[?#]/)[0]?.split('/').filter(Boolean) ?? [];
  const at = parts.indexOf('zadaniya');
  if (at === -1) {
    return null;
  }
  const own: string[] = [];
  for (const part of parts.slice(at + 1)) {
    if (part === 'trenazher') {
      break;
    }
    own.push(part);
  }
  if (own.length === 0) {
    return null;
  }
  /* Разделы базы — со своим префиксом: «/baza/zadaniya/5/» → «baza-5»,
     иначе тренировка №5 базы легла бы на место №5 профиля. */
  if (parts[at - 1] === 'baza') return `baza-${own.join(':')}`;
  const nomer = nomerPoKodu(own[0]!);
  if (nomer !== null) own[0] = String(nomer);
  return own.join(':');
}

/** Есть ли незавершённая тренировка в этом разделе или в его подразделах. */
export function hasActiveScope(scopes: readonly string[], scope: string | null): boolean {
  return scope !== null && scopes.some((item) => item === scope || item.startsWith(`${scope}:`));
}
