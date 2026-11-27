/**
 * Код ошибки новой выдачи ДЗ для текста на экране (content/dz2.ts).
 *
 * Кроме кодов базы («bad_task_no: …» → bad_task_no) различаются три
 * случая, которые раньше все показывались как «Проверьте связь»:
 *  - sayt_obnovilsya — сайт выложили заново, пока страница была открыта,
 *    и прежнего файла скрипта на сервере уже нет (ChunkLoadError);
 *  - sessiya — вход истёк (PostgREST: «JWT expired», PGRST301/303);
 *  - set — запрос не дошёл до сервера (нет сети).
 * Остальное — unknown; причину для учителя даёт prichinaOshibki.
 */

const CHUNK = /ChunkLoadError|Loading (?:CSS )?chunk|dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;
const SESSIYA = /JWT expired|jwt expired|invalid JWT|PGRST30[13]|Auth session missing|refresh token/i;
const SET = /Failed to fetch|NetworkError|Load failed|network request failed/i;

function tekst(e: unknown): string {
  if (e instanceof Error) return `${e.name} ${e.message}`;
  return typeof e === 'string' ? e : '';
}

export function kodOshibki(e: unknown): string {
  const t = tekst(e);
  if (CHUNK.test(t)) return 'sayt_obnovilsya';
  if (SESSIYA.test(t)) return 'sessiya';
  if (e instanceof Error && 'code' in e) {
    const kod = String((e as { code: unknown }).code);
    if (kod !== 'unknown') return kod;
  }
  if (SET.test(t)) return 'set';
  return 'unknown';
}

/** Короткая причина для неизвестной ошибки: что сообщить, если повторится. */
export function prichinaOshibki(e: unknown): string | null {
  const t = e instanceof Error ? e.message : typeof e === 'string' ? e : '';
  const s = t.replace(/\s+/g, ' ').trim();
  return s === '' ? null : s.slice(0, 160);
}
