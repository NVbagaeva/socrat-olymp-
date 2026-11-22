/**
 * Активное время (docs/kabinet-zhurnal.md, «Время»).
 *
 * Время идёт, только когда вкладка видна и было действие — нажатие,
 * ввод, прокрутка — не дольше 2 минут назад. Промежуток между двумя
 * действиями засчитывается целиком, если он не длиннее 2 минут, и не
 * засчитывается совсем, если длиннее: после 2 минут бездействия таймер
 * стоит, и эти 2 минуты в активное время не входят. Показ вкладки —
 * тоже действие, скрытие засчитывает промежуток до него.
 *
 * Чистая модель без браузера: часы передаются снаружи. Привязка к
 * событиям страницы — ./zapis.ts.
 */

/** Сколько бездействия до паузы. */
export const PAUZA_MS = 2 * 60 * 1000;

export interface AktivnyyTaymer {
  /** Было действие в момент t. */
  deystvie(t: number): void;
  /** Вкладка стала видна или скрыта. */
  vidimost(vidna: boolean, t: number): void;
  /** Накопленное активное время к моменту t. */
  aktivnoe(t: number): number;
  /** Идёт ли таймер в момент t. */
  idet(t: number): boolean;
}

export function aktivnyyTaymer(start: number, vidna = true, pauza = PAUZA_MS): AktivnyyTaymer {
  let nakopleno = 0;
  /* Последнее действие; null — вкладка скрыта. */
  let posledneye: number | null = vidna ? start : null;

  function zachest(t: number) {
    if (posledneye === null) return;
    const promezhutok = t - posledneye;
    if (promezhutok > 0 && promezhutok <= pauza) nakopleno += promezhutok;
  }

  return {
    deystvie(t) {
      if (posledneye === null) return;
      zachest(t);
      posledneye = Math.max(posledneye, t);
    },
    vidimost(vidnaSeychas, t) {
      if (vidnaSeychas) {
        if (posledneye === null) posledneye = t;
        return;
      }
      zachest(t);
      posledneye = null;
    },
    /* Только засчитанное: открытый промежуток войдёт со следующим
       действием. Так показание не убывает, когда бездействие переходит
       за 2 минуты. Нажатие, которым закрывают задачу, — тоже действие. */
    aktivnoe(t) {
      void t;
      return nakopleno;
    },
    idet(t) {
      return posledneye !== null && t - posledneye <= pauza;
    },
  };
}
