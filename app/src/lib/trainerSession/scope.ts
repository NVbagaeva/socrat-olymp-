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
  if (own.length === 0) {
    return null;
  }
  /* Разделы базы — со своим префиксом: «/baza/zadaniya/5/» → «baza-5»,
     иначе тренировка №5 базы легла бы на место №5 профиля. */
  return (parts[at - 1] === 'baza' ? 'baza-' : '') + own.join(':');
}

/** Есть ли незавершённая тренировка в этом разделе или в его подразделах. */
export function hasActiveScope(scopes: readonly string[], scope: string | null): boolean {
  return scope !== null && scopes.some((item) => item === scope || item.startsWith(`${scope}:`));
}
