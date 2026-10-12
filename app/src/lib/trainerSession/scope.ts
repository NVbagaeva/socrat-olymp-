/**
 * Раздел тренажёра по адресу страницы. Чистые функции без браузера:
 * зовутся и на сервере (сборка страницы), и в браузере (метка в меню).
 */

/**
 * Раздел тренажёра по адресу страницы: «/zadaniya/12/linear/trenazher/»
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
  return own.length === 0 ? null : own.join(':');
}

/** Есть ли незавершённая тренировка в этом разделе или в его подразделах. */
export function hasActiveScope(scopes: readonly string[], scope: string | null): boolean {
  return scope !== null && scopes.some((item) => item === scope || item.startsWith(`${scope}:`));
}
