import type { ComponentType } from 'react';
import type { RazdelKod } from '@/content/struktura';

/**
 * Живой чертёж шапки: что получает каждый раздел.
 *
 * Чертёж занимает весь квадрат внутри кольца и сам принимает фокус
 * (tabIndex 0): стрелки крутят или двигают, Enter нажимает. Пальцем
 * перехватывается только жест по самой фигуре; вертикальная прокрутка
 * страницы остаётся (touch-action на ручках и холсте — см. shapka.css).
 */
export interface ZhivoyProps {
  /** Описание для скринридера. */
  label: string;
  /** «Уменьшить движение»: без авто-вращения и анимаций. */
  tiho: boolean;
  /** Чертёж открыт нажатием — первым действием он и принимает фокус. */
  avtofokus: boolean;
}

export type ZhivoyModul = { default: ComponentType<ZhivoyProps> };

/**
 * Код живого чертежа раздела — отдельным куском на раздел: в сборку
 * страницы не входит, грузится после первой отрисовки шапки.
 */
export function zagruzitZhivoy(kod: RazdelKod): Promise<ZhivoyModul> | null {
  switch (kod) {
    case 'planimetriya':
      return import('./Planimetriya');
    case 'vektory':
      return import('./Vektory');
    case 'stereometriya':
      return import('./KubShar');
    case 'veroyatnost':
      return import('./Kost');
    case 'slozhnaya-veroyatnost':
      return import('./Derevo');
    case 'uravneniya':
      return import('./Vesy');
    case 'vychisleniya':
      return import('./Koren');
    case 'proizvodnaya':
      return import('./Kasatelnaya');
    case 'prikladnye-zadachi':
      return import('./Brosok');
    case 'tekstovye-zadachi':
      return import('./Mashiny');
    case 'grafiki-funkciy':
      return import('./Parabola');
    case 'naibolshee-naimenshee':
      return import('./Otrezok');
    case 'uravnenie-s-otborom':
      return import('./Krug');
    case 'stereometriya-dokazatelstvo':
      return import('./Piramida');
    case 'neravenstvo':
      return import('./Pryamaya');
    case 'ekonomika':
      return import('./Vklad');
    case 'planimetriya-dokazatelstvo':
      return import('./Okruzhnosti');
    case 'parametr':
      return import('./Puchok');
    case 'chisla':
      return import('./Golovolomka');
    default:
      return null;
  }
}
