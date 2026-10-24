/** Время для таймера: «12:05», «1:02:05». */
export function clockText(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Время задания в таблице: «45 с», «2 мин 05 с». */
export function secondsText(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s} с`;
  return `${Math.floor(s / 60)} мин ${String(s % 60).padStart(2, '0')} с`;
}

/** Дата ГГГГ-ММ-ДД → «24.10.2026». */
export function dateText(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m === null ? iso : `${m[3]}.${m[2]}.${m[1]}`;
}
