/**
 * Счётчик времени задачи: общее и активное.
 *
 * Общее идёт от показа задачи. Активное — только пока вкладка видна и
 * было действие не позже двух минут назад: после двух минут бездействия
 * счётчик встаёт на паузу до следующего действия. Чистая логика без
 * браузера: время приходит снаружи (scripts/check-zhurnal.mjs).
 */

export const PAUZA_MS = 120_000;

export interface AktivnostSnimok {
  /** Накоплено активного времени в закрытых отрезках, мс. */
  acc: number;
  /** Накоплено общего времени до последней остановки, мс. */
  obshchee: number;
}

export interface Aktivnost {
  /** Действие пользователя: клавиша, касание, мышь, прокрутка. */
  deystvie(t: number): void;
  /** Вкладка стала видна или скрылась. */
  vidimost(vidna: boolean, t: number): void;
  aktivnoMs(t: number): number;
  obshcheeMs(t: number): number;
  /** Остановить (уход со страницы): состояние, с которого можно продолжить. */
  snimok(t: number): AktivnostSnimok;
}

export function sozdatAktivnost(
  t0: number,
  vidna: boolean,
  prezhde: AktivnostSnimok = { acc: 0, obshchee: 0 },
  pauza: number = PAUZA_MS,
): Aktivnost {
  let acc = prezhde.acc;
  /* Начало текущего активного отрезка; null — пауза. */
  let from: number | null = vidna ? t0 : null;
  let last = t0;
  let visible = vidna;

  /* Закрыть отрезок: он кончается не позже, чем через паузу после
     последнего действия. */
  function zakryt(t: number): void {
    if (from !== null) {
      acc += Math.max(0, Math.min(t, last + pauza) - from);
      from = null;
    }
  }

  return {
    deystvie(t) {
      if (!visible) {
        return;
      }
      if (from === null) {
        from = t;
      } else if (t > last + pauza) {
        zakryt(t);
        from = t;
      }
      last = t;
    },
    vidimost(vidna2, t) {
      if (vidna2 === visible) {
        return;
      }
      visible = vidna2;
      if (vidna2) {
        from = t;
        last = t;
      } else {
        zakryt(t);
      }
    },
    aktivnoMs(t) {
      const tekushchiy = from === null ? 0 : Math.max(0, Math.min(t, last + pauza) - from);
      return Math.round(acc + tekushchiy);
    },
    obshcheeMs(t) {
      return Math.round(prezhde.obshchee + Math.max(0, t - t0));
    },
    snimok(t) {
      return { acc: this.aktivnoMs(t), obshchee: this.obshcheeMs(t) };
    },
  };
}
