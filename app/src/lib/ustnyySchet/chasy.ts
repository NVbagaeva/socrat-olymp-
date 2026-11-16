/**
 * Часы тренировки. Время — только из performance.now(): кадры
 * анимации на время не влияют, медленный кадр не «съедает» секунды.
 *
 * Пауза (ученик ушёл со вкладки в практике) останавливает счёт;
 * в рейтинговом режиме паузы нет — там время считает сервер, а часы
 * лишь показывают остаток до серверного срока (сдвиг — sdvig).
 */

export type Seychas = () => number;

const poUmolchaniyu: Seychas = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

export interface Chasy {
  /** Активное время с начала, мс. */
  proshlo(): number;
  pauza(): void;
  dalshe(): void;
  readonly naPauze: boolean;
}

export function sozdatChasy(now: Seychas = poUmolchaniyu): Chasy {
  const start = now();
  let pauzaS: number | null = null;
  let naPauzeVsego = 0;
  return {
    proshlo() {
      const t = pauzaS ?? now();
      return Math.max(0, t - start - naPauzeVsego);
    },
    pauza() {
      if (pauzaS === null) pauzaS = now();
    },
    dalshe() {
      if (pauzaS !== null) {
        naPauzeVsego += now() - pauzaS;
        pauzaS = null;
      }
    },
    get naPauze() {
      return pauzaS !== null;
    },
  };
}

/** Секунды для таймера: «1:05», «0:09». */
export function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000 - 1e-9));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** Длительность словами для итогов: «1 мин 05 с», «8,4 с». */
export function dlitelnost(ms: number): string {
  if (ms < 60_000) {
    const d = Math.round(ms / 100);
    return `${Math.floor(d / 10)},${d % 10} с`;
  }
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)} мин ${String(s % 60).padStart(2, '0')} с`;
}

/** Отметки, на которых таймер объявляет остаток скринридеру. */
export const OTMETKI_SEK: readonly number[] = [60, 30, 10, 0];
